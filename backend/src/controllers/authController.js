const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
<<<<<<< HEAD
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key');
=======
>>>>>>> e018e483c5587b47b9dd4274b3475e931c259f59

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
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
    const token = generateToken(user.id);
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
    const token = generateToken(user.id);
    const { password_hash, ...safeUser } = user;
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
  const token = generateToken(req.user.id);
  res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${token}`);
};

<<<<<<< HEAD
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  try {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (!result.rows[0]) {
      return res.status(200).json({ message: 'If an account exists, a reset link has been sent.' });
    }
    
    const resetToken = jwt.sign({ userId: result.rows[0].id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    const resetLink = \`\${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=\${resetToken}\`;
    
    const { data, error } = await resend.emails.send({
      from: 'CodeCollab <noreply@codecollab.dev>',
      to: email,
      subject: 'Reset your CodeCollab Password',
      html: \`<p>Hello,</p><p>You requested a password reset. Click the link below to reset your password:</p><p><a href="\${resetLink}">Reset Password</a></p><p>If you didn't request this, you can safely ignore this email.</p>\`
    });
    
    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send reset email' });
    }
    
    res.status(200).json({ message: 'Reset link sent to your email.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { register, login, getMe, googleCallback, forgotPassword };
=======
module.exports = { register, login, getMe, googleCallback };
>>>>>>> e018e483c5587b47b9dd4274b3475e931c259f59
