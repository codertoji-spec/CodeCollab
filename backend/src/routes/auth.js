const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { register, login, getMe, googleCallback, forgotPassword, resetPassword, verifyOtp, resendOtp, setUsername } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/set-username', authenticateToken, setUsername);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
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
