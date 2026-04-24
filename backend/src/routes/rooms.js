const express = require('express');
const router = express.Router();
const { createRoom, joinRoom, listRooms, saveSnapshot, getSnapshots } = require('../controllers/roomController');
const { authenticateToken } = require('../middleware/auth');

router.post('/create', authenticateToken, createRoom);
router.post('/join', authenticateToken, joinRoom);
router.get('/list', authenticateToken, listRooms);
router.post('/snapshot', authenticateToken, saveSnapshot);
router.get('/:roomId/snapshots', authenticateToken, getSnapshots); // NEW

module.exports = router;
