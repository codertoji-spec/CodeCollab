const express = require('express');
const router = express.Router();
const { executeCode } = require('../controllers/executeController');
const { authenticateToken } = require('../middleware/auth');

router.post('/run', authenticateToken, executeCode);

module.exports = router;
