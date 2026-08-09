const pool = require('../config/db');

/**
 * Requires the authenticated user to be a participant of the room
 * referenced by req.params.roomId (GET routes) or req.body.roomId (POST routes).
 * Attaches req.roomRole ('editor' | 'viewer') from room_participants — the
 * server-side source of truth. Never trust a client-sent role field.
 */
const requireRoomParticipant = async (req, res, next) => {
  const roomId = req.params.roomId || req.body.roomId;
  if (!roomId) return res.status(400).json({ error: 'roomId required' });

  try {
    const result = await pool.query(
      'SELECT role FROM room_participants WHERE room_id = $1 AND user_id = $2',
      [roomId, req.user.id]
    );
    if (!result.rows[0]) {
      return res.status(403).json({ error: 'Not a participant of this room' });
    }
    req.roomRole = result.rows[0].role;
    next();
  } catch (err) {
    console.error('[RoomAccess] DB error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Must run after requireRoomParticipant. Blocks viewers from write actions. */
const requireEditorRole = (req, res, next) => {
  if (req.roomRole !== 'editor') {
    return res.status(403).json({ error: 'Viewers cannot perform this action' });
  }
  next();
};

module.exports = { requireRoomParticipant, requireEditorRole };
