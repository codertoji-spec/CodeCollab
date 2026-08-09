/**
 * YjsManager — singleton that owns one Y.Doc per active room.
 * Loads persisted state from PostgreSQL on first access.
 * Debounces saves: writes state back to DB 5 s after last edit.
 *
 * Race-condition fix: getOrCreateDoc uses a pending-promise map so that
 * concurrent calls for the same roomId await the SAME DB load instead of
 * creating multiple Y.Doc instances and overwriting each other.
 */
const Y = require('yjs');
const pool = require('../config/db');

class YjsManager {
  constructor() {
    /** @type {Map<string, Y.Doc>} */
    this.docs = new Map();
    /** @type {Map<string, Promise<Y.Doc>>} — in-flight loads */
    this.pending = new Map();
    /** @type {Map<string, ReturnType<typeof setTimeout>>} */
    this.saveTimers = new Map();
  }

  /**
   * Return the Y.Doc for roomId, hydrating from DB if needed.
   * Concurrent callers for the same roomId share one Promise — no double load.
   * @param {string} roomId
   * @returns {Promise<Y.Doc>}
   */
  async getOrCreateDoc(roomId) {
    // Already loaded
    if (this.docs.has(roomId)) return this.docs.get(roomId);

    // Load in progress — wait for it
    if (this.pending.has(roomId)) return this.pending.get(roomId);

    // Start load
    const loadPromise = (async () => {
      const doc = new Y.Doc();
      try {
        const res = await pool.query('SELECT yjs_state FROM rooms WHERE id = $1', [roomId]);
        const stored = res.rows[0]?.yjs_state;
        if (stored && stored.length > 0) {
          Y.applyUpdate(doc, new Uint8Array(stored));
          console.log(`[Yjs] Restored state for room ${roomId} (${stored.length} bytes)`);
        }
      } catch (err) {
        console.error(`[Yjs] Load error for ${roomId}:`, err.message);
      }
      this.docs.set(roomId, doc);
      this.pending.delete(roomId);
      return doc;
    })();

    this.pending.set(roomId, loadPromise);
    return loadPromise;
  }

  /**
   * Apply a client update to the server-side Y.Doc and schedule a DB save.
   * @param {string} roomId
   * @param {Buffer|Uint8Array} updateBuffer
   */
  applyUpdate(roomId, updateBuffer) {
    const doc = this.docs.get(roomId);
    if (!doc) return;
    try {
      Y.applyUpdate(doc, new Uint8Array(updateBuffer));
      this.scheduleSave(roomId);
    } catch (err) {
      console.error(`[Yjs] Apply update error for ${roomId}:`, err.message);
    }
  }

  /**
   * Return a full-state-vector update (to send to a newly joining client).
   * @param {string} roomId
   * @returns {Uint8Array|null}
   */
  encodeState(roomId) {
    const doc = this.docs.get(roomId);
    if (!doc) return null;
    return Y.encodeStateAsUpdate(doc);
  }

  /**
   * Return the current plain text content of the room's code.
   * @param {string} roomId
   * @returns {string}
   */
  getText(roomId) {
    const doc = this.docs.get(roomId);
    if (!doc) return '';
    return doc.getText('monaco').toString();
  }

  /** Debounced DB write — fires 5 s after last edit. */
  scheduleSave(roomId) {
    if (this.saveTimers.has(roomId)) clearTimeout(this.saveTimers.get(roomId));
    this.saveTimers.set(
      roomId,
      setTimeout(() => this.persistDoc(roomId), 5000)
    );
  }

  /** Flush a single room's state to PostgreSQL immediately. */
  async persistDoc(roomId) {
    const doc = this.docs.get(roomId);
    if (!doc) return;
    const state = Buffer.from(Y.encodeStateAsUpdate(doc));
    try {
      await pool.query('UPDATE rooms SET yjs_state = $1 WHERE id = $2', [state, roomId]);
      console.log(`[Yjs] Persisted ${state.length} bytes for room ${roomId}`);
    } catch (err) {
      console.error(`[Yjs] Persist error for ${roomId}:`, err.message);
    }
  }

  /** Call on SIGTERM — flush all dirty rooms before exit. */
  async persistAll() {
    const promises = [];
    for (const [roomId] of this.docs) promises.push(this.persistDoc(roomId));
    await Promise.allSettled(promises);
    console.log('[Yjs] All rooms flushed.');
  }
}

module.exports = new YjsManager();
