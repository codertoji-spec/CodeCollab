const express = require('express');
const router = express.Router();
const { createRoom, joinRoom, listRooms, saveSnapshot, getSnapshots, deleteRoom } = require('../controllers/roomController');
const { authenticateToken } = require('../middleware/auth');
const { requireRoomParticipant, requireEditorRole } = require('../middleware/roomAccess');

router.post('/create', authenticateToken, createRoom);
router.post('/join', authenticateToken, joinRoom);
router.get('/list', authenticateToken, listRooms);
router.delete('/:roomId', authenticateToken, deleteRoom);

// Both routes require the user to be a participant of :roomId / body.roomId.
// Saving additionally requires the 'editor' role — viewers are read-only.
router.post('/snapshot', authenticateToken, requireRoomParticipant, requireEditorRole, saveSnapshot);
router.get('/:roomId/snapshots', authenticateToken, requireRoomParticipant, getSnapshots);

module.exports = router;
