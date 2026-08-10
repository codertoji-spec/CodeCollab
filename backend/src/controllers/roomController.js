const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const SNAPSHOT_LIMIT = 100; // max snapshots per room

const generateCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
};

const createRoom = async (req, res) => {
  const { name, language } = req.body;
  if (!name) return res.status(400).json({ error: 'Room name required' });

  try {
    let roomCode, viewCode, exists;
    do {
      roomCode = generateCode(6);
      exists = await pool.query('SELECT id FROM rooms WHERE room_code = $1', [roomCode]);
    } while (exists.rows[0]);

    do {
      viewCode = generateCode(6);
      exists = await pool.query('SELECT id FROM rooms WHERE view_code = $1', [viewCode]);
    } while (exists.rows[0]);

    const result = await pool.query(
      'INSERT INTO rooms (name, room_code, view_code, language, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, roomCode, viewCode, language || 'javascript', req.user.id]
    );
    const room = result.rows[0];
    await pool.query(
      `INSERT INTO room_participants (room_id, user_id, role) VALUES ($1, $2, 'editor')
       ON CONFLICT (room_id, user_id) DO NOTHING`,
      [room.id, req.user.id]
    );
    res.status(201).json({ room });
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const joinRoom = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Room code required' });

  try {
    const editResult = await pool.query('SELECT * FROM rooms WHERE room_code = $1', [code.toUpperCase()]);
    if (editResult.rows[0]) {
      const room = editResult.rows[0];
      await pool.query(
        `INSERT INTO room_participants (room_id, user_id, role) VALUES ($1, $2, 'editor')
         ON CONFLICT (room_id, user_id) DO UPDATE SET role = 'editor'`,
        [room.id, req.user.id]
      );
      return res.json({ room, role: 'editor' });
    }
    const viewResult = await pool.query('SELECT * FROM rooms WHERE view_code = $1', [code.toUpperCase()]);
    if (viewResult.rows[0]) {
      const room = viewResult.rows[0];
      await pool.query(
        `INSERT INTO room_participants (room_id, user_id, role) VALUES ($1, $2, 'viewer')
         ON CONFLICT (room_id, user_id) DO UPDATE SET role = 'viewer'`,
        [room.id, req.user.id]
      );
      return res.json({ room, role: 'viewer' });
    }
    res.status(404).json({ error: 'Room not found. Check your code and try again.' });
  } catch (err) {
    console.error('Join room error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const listRooms = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.username as creator_name 
       FROM rooms r LEFT JOIN users u ON r.created_by = u.id
       WHERE r.created_by = $1 ORDER BY r.created_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json({ rooms: result.rows });
  } catch (err) {
    console.error('List rooms error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Save a code snapshot and enforce SNAPSHOT_LIMIT per room.
 * Returns the new snapshot and the updated total count.
 */
const saveSnapshot = async (req, res) => {
  const { roomId, code, label } = req.body;
  if (!roomId || code === undefined) return res.status(400).json({ error: 'roomId and code required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      'INSERT INTO code_snapshots (room_id, code, saved_by, label) VALUES ($1, $2, $3, $4) RETURNING *',
      [roomId, code, req.user.id, label?.trim() || null]
    );

    // Enforce limit: delete oldest snapshots beyond SNAPSHOT_LIMIT
    await client.query(
      `DELETE FROM code_snapshots
       WHERE id IN (
         SELECT id FROM code_snapshots
         WHERE room_id = $1
         ORDER BY saved_at DESC
         OFFSET $2
       )`,
      [roomId, SNAPSHOT_LIMIT]
    );

    const countResult = await client.query(
      'SELECT COUNT(*) FROM code_snapshots WHERE room_id = $1',
      [roomId]
    );

    await client.query('COMMIT');
    res.json({
      message: 'Snapshot saved',
      snapshot: result.rows[0],
      total: parseInt(countResult.rows[0].count, 10),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Save snapshot error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

const getSnapshots = async (req, res) => {
  const { roomId } = req.params;
  if (!roomId) return res.status(400).json({ error: 'roomId required' });

  try {
    const result = await pool.query(
      `SELECT cs.id, cs.code, cs.label, cs.saved_at, u.username AS saved_by
       FROM code_snapshots cs
       LEFT JOIN users u ON cs.saved_by = u.id
       WHERE cs.room_id = $1
       ORDER BY cs.saved_at DESC
       LIMIT $2`,
      [roomId, SNAPSHOT_LIMIT]
    );
    res.json({ snapshots: result.rows });
  } catch (err) {
    console.error('Get snapshots error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteRoom = async (req, res) => {
  const { roomId } = req.params;
  try {
    const isCreator = await pool.query('SELECT id FROM rooms WHERE id = $1 AND created_by = $2', [roomId, req.user.id]);
    if (isCreator.rows.length > 0) {
      await pool.query('DELETE FROM code_snapshots WHERE room_id = $1', [roomId]);
      await pool.query('DELETE FROM room_participants WHERE room_id = $1', [roomId]);
      await pool.query('DELETE FROM rooms WHERE id = $1', [roomId]);
    } else {
      await pool.query('DELETE FROM room_participants WHERE room_id = $1 AND user_id = $2', [roomId, req.user.id]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete room error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createRoom, joinRoom, listRooms, saveSnapshot, getSnapshots, deleteRoom };
