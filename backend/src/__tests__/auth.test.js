/**
 * auth.test.js — tests for JWT token cache in middleware/auth.js
 * No real DB or network needed — all external calls mocked.
 */

process.env.JWT_SECRET = 'test_secret_for_jest';

const jwt = require('jsonwebtoken');

// ── Shared mock DB (reset per test) ──────────────────────────────────────────
const mockQuery = jest.fn();
jest.mock('../config/db', () => ({ query: mockQuery }));

const { authenticateToken, invalidateToken } = require('../middleware/auth');

const makeToken = (userId = 'user-123', expiresIn = '1h') =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn });

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  mockQuery.mockReset();
  // Bust entire cache between tests by invalidating any token
  // (cache is module-level Map; we can't re-require without jest.resetModules)
  // Instead: use unique tokens per test so cache never cross-contaminates.
});

// ── 1. Missing token ──────────────────────────────────────────────────────────
test('returns 401 when no token provided', async () => {
  const req = { headers: {} };
  const res = mockRes();
  await authenticateToken(req, res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(401);
  expect(mockQuery).not.toHaveBeenCalled();
});

// ── 2. Invalid token ──────────────────────────────────────────────────────────
test('returns 403 on bad token signature', async () => {
  const req = { headers: { authorization: 'Bearer bad.token.here' } };
  const res = mockRes();
  await authenticateToken(req, res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(403);
  expect(mockQuery).not.toHaveBeenCalled();
});

// ── 3. Cache miss → DB hit, second hit → cache (no DB) ───────────────────────
test('hits DB on cache miss; second request served from cache', async () => {
  const user  = { id: 'user-aaa', username: 'ritanshu', email: 'r@dtu.ac.in' };
  mockQuery.mockResolvedValue({ rows: [user] });

  const token = makeToken('user-aaa');
  const next  = jest.fn();

  await authenticateToken({ headers: { authorization: `Bearer ${token}` } }, mockRes(), next);
  expect(mockQuery).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalled();

  // Second call — same token
  mockQuery.mockClear();
  const next2 = jest.fn();
  await authenticateToken({ headers: { authorization: `Bearer ${token}` } }, mockRes(), next2);
  expect(mockQuery).not.toHaveBeenCalled();   // served from cache
  expect(next2).toHaveBeenCalled();
});

// ── 4. invalidateToken busts cache → DB re-fetched ───────────────────────────
test('invalidateToken forces DB re-fetch on next request', async () => {
  const user  = { id: 'user-bbb', username: 'ritz', email: 'ritz@dtu.ac.in' };
  mockQuery.mockResolvedValue({ rows: [user] });

  const token = makeToken('user-bbb');

  // Prime the cache
  await authenticateToken({ headers: { authorization: `Bearer ${token}` } }, mockRes(), jest.fn());
  mockQuery.mockClear();

  // Bust it
  invalidateToken(token);

  const next2 = jest.fn();
  await authenticateToken({ headers: { authorization: `Bearer ${token}` } }, mockRes(), next2);
  expect(mockQuery).toHaveBeenCalledTimes(1); // DB hit again after bust
  expect(next2).toHaveBeenCalled();
});

// ── 5. User deleted from DB → 401 ────────────────────────────────────────────
test('returns 401 when DB returns no user rows', async () => {
  mockQuery.mockResolvedValue({ rows: [] }); // user deleted

  const token = makeToken('user-ghost');
  const res   = mockRes();
  await authenticateToken({ headers: { authorization: `Bearer ${token}` } }, res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(401);
});
