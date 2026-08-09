const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const axios = require('axios');

const { invalidateUserTokens } = require('../middleware/auth');

const generateToken = (userId, tokenVersion = 1) => {
  return jwt.sign({ userId, tokenVersion }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const register = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'Email or username already exists' });
    }
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, avatar_url, created_at',
      [username, email, hash]
    );
    const user = result.rows[0];
    const token = generateToken(user.id, 1);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    if (!user.password_hash) return res.status(401).json({ error: 'Please use Google sign-in' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    const token = generateToken(user.id, user.token_version || 1);
    const { password_hash, token_version, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getMe = async (req, res) => {
  const { password_hash, ...safeUser } = req.user;
  res.json({ user: safeUser });
};

const googleCallback = (req, res) => {
  const token = generateToken(req.user.id, req.user.token_version || 1);
  res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${token}`);
};


const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  try {
    const result = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [email]);
    if (!result.rows[0]) {
      return res.status(200).json({ message: 'If an account exists, a reset link has been sent.' });
    }
    
    const user = result.rows[0];
    const secret = (process.env.JWT_SECRET || 'secret') + user.password_hash;
    const resetToken = jwt.sign({ userId: user.id }, secret, { expiresIn: '15m' });
    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    try {
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { 
            email: process.env.EMAIL_USER || 'codecollab.noreply@gmail.com', 
            name: 'CodeCollab' 
          },
          to: [{ email }],
          subject: 'Reset your CodeCollab Password',
          htmlContent: `<p>Hello,</p><p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">Reset Password</a></p><p>If you didn't request this, you can safely ignore this email.</p>`
        },
        {
          headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Brevo error:', error.response?.data || error.message);
      return res.status(500).json({ error: 'Failed to send reset email' });
    }
    
    res.status(200).json({ message: 'Reset link sent to your email.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password required' });
  }
  
  try {
    const unverifiedPayload = jwt.decode(token);
    if (!unverifiedPayload || !unverifiedPayload.userId) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [unverifiedPayload.userId]);
    const user = userResult.rows[0];
    if (!user) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    const secret = (process.env.JWT_SECRET || 'secret') + user.password_hash;
    const decoded = jwt.verify(token, secret);
    
    const hash = await bcrypt.hash(newPassword, 12);
    
    // Increment token_version to invalidate all existing 7-day JWT sessions
    await pool.query(
      'UPDATE users SET password_hash = $1, token_version = COALESCE(token_version, 1) + 1 WHERE id = $2', 
      [hash, decoded.userId]
    );
    
    // Clear any currently cached tokens for this user
    invalidateUserTokens(decoded.userId);
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(400).json({ error: 'Invalid, expired, or already used reset token' });
  }
};

module.exports = { register, login, getMe, googleCallback, forgotPassword, resetPassword };
