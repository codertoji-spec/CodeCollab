const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * Simple in-memory token cache.
 * Key: JWT token string  →  Value: { user, expiresAt (ms) }
 * Max 500 entries; evict oldest on overflow.
 * Cache entry TTL = remaining JWT lifetime (capped at 5 min).
 */
const TOKEN_CACHE = new Map();
const CACHE_MAX   = 500;
const CACHE_CAP   = 5 * 60 * 1000; // 5 min

const pruneCache = () => {
  const now = Date.now();
  for (const [k, v] of TOKEN_CACHE) {
    if (v.expiresAt <= now) TOKEN_CACHE.delete(k);
  }
  if (TOKEN_CACHE.size >= CACHE_MAX) {
    TOKEN_CACHE.delete(TOKEN_CACHE.keys().next().value);
  }
};

/** Call after password change / logout to bust cached entry. */
const invalidateToken = (token) => TOKEN_CACHE.delete(token);

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // 1. Verify signature + expiry (pure CPU, no I/O)
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  // 2. Cache hit?
  const now = Date.now();
  const cached = TOKEN_CACHE.get(token);
  if (cached && cached.expiresAt > now) {
    req.user = cached.user;
    return next();
  }

  // 3. Cache miss → DB lookup (only SELECT needed columns, not *)
  try {
    const result = await pool.query(
      'SELECT id, username, email, avatar_url, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (!result.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const jwtExp    = decoded.exp * 1000;
    const expiresAt = Math.min(jwtExp, now + CACHE_CAP);

    pruneCache();
    TOKEN_CACHE.set(token, { user, expiresAt });

    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth] DB error:', err.message);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = { authenticateToken, invalidateToken };
