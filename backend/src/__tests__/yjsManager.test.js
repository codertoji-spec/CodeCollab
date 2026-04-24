/**
 * yjsManager.test.js — tests for services/yjsManager.js
 * Mocks PostgreSQL — no real DB needed.
 *
 * Note: Yjs is a singleton ESM module that warns when imported twice in
 * the same process. We use a single Y import and share it across tests
 * instead of resetModules, which avoids the "already imported" warning.
 */

const mockQuery = jest.fn();
jest.mock('../config/db', () => ({ query: mockQuery }));

// Import once for the whole suite
const Y       = require('yjs');
const manager = require('../services/yjsManager');

beforeEach(() => {
  mockQuery.mockReset();
  // Default: DB returns no stored state (fresh room)
  mockQuery.mockResolvedValue({ rows: [{ yjs_state: null }] });

  // Clear manager state between tests
  manager.docs.clear();
  manager.pending.clear();
  for (const t of manager.saveTimers.values()) clearTimeout(t);
  manager.saveTimers.clear();
});

// ── 1. Creates Y.Doc for new room ────────────────────────────────────────────
test('getOrCreateDoc returns Y.Doc for new room', async () => {
  const doc = await manager.getOrCreateDoc('room-new');
  expect(doc).toBeDefined();
  expect(typeof doc.getText).toBe('function');
});

// ── 2. Race condition: concurrent calls return same instance ─────────────────
test('concurrent getOrCreateDoc calls return same Y.Doc instance', async () => {
  const [doc1, doc2] = await Promise.all([
    manager.getOrCreateDoc('room-race'),
    manager.getOrCreateDoc('room-race'),
  ]);
  expect(doc1).toBe(doc2);                     // exact same object
  expect(mockQuery).toHaveBeenCalledTimes(1);  // only one DB hit
});

// ── 3. Second sequential call served from cache ───────────────────────────────
test('second getOrCreateDoc call skips DB (already cached)', async () => {
  await manager.getOrCreateDoc('room-cached');
  mockQuery.mockClear();

  await manager.getOrCreateDoc('room-cached');
  expect(mockQuery).not.toHaveBeenCalled();
});

// ── 4. getText returns '' for unknown room ────────────────────────────────────
test('getText returns empty string for unknown room', () => {
  expect(manager.getText('room-unknown')).toBe('');
});

// ── 5. applyUpdate + getText roundtrip ───────────────────────────────────────
test('applyUpdate reflects content in getText', async () => {
  await manager.getOrCreateDoc('room-text');

  // Build update from a temp doc
  const tmpDoc = new Y.Doc();
  const ytext  = tmpDoc.getText('monaco');
  let captured;
  tmpDoc.on('update', (u) => { captured = u; });
  ytext.insert(0, 'hello world');

  manager.applyUpdate('room-text', captured);
  expect(manager.getText('room-text')).toBe('hello world');
});

// ── 6. encodeState returns null for unloaded room ────────────────────────────
test('encodeState returns null for room not loaded', () => {
  expect(manager.encodeState('room-ghost')).toBeNull();
});

// ── 7. encodeState returns Uint8Array for loaded room ────────────────────────
test('encodeState returns Uint8Array for loaded room', async () => {
  await manager.getOrCreateDoc('room-encode');
  const state = manager.encodeState('room-encode');
  expect(state).toBeInstanceOf(Uint8Array);
});
