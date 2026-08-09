const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
<<<<<<< HEAD
const { register, login, getMe, googleCallback, forgotPassword } = require('../controllers/authController');
=======
const { register, login, getMe, googleCallback } = require('../controllers/authController');
>>>>>>> e018e483c5587b47b9dd4274b3475e931c259f59
const { authenticateToken } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
<<<<<<< HEAD
router.post('/forgot-password', forgotPassword);
=======
>>>>>>> e018e483c5587b47b9dd4274b3475e931c259f59
router.get('/me', authenticateToken, getMe);

// Google OAuth routes (only if configured)
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`, session: false }),
  googleCallback
);

module.exports = router;
