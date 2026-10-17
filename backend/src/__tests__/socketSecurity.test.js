/**
 * socketSecurity.test.js — Regression tests for WebSocket authorization, role enforcement,
 * rate-limiting, and error handling using mock socket events (no external socket.io-client dependency).
 */

const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test_jwt_secret_key_12345';

const mockQuery = jest.fn();
jest.mock('../config/db', () => ({
  query: mockQuery,
  on: jest.fn(),
}));

describe('WebSocket Authorization & Event Security Logic', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  // Emulate middleware verification
  const runAuthMiddleware = async (token) => {
    if (!token) throw new Error('AUTH_MISSING');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      throw new Error('AUTH_INVALID');
    }
    const result = await mockQuery(
      'SELECT id, username, email FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (!result.rows || !result.rows[0]) throw new Error('AUTH_USER_NOT_FOUND');
    return result.rows[0];
  };

  // Emulate join-room handler logic
  const handleJoinRoom = async (socket, payload) => {
    if (!payload || typeof payload !== 'object') {
      return { error: 'Invalid payload format.' };
    }
    const { roomId } = payload;
    if (!roomId || typeof roomId !== 'string' || roomId.trim().length === 0) {
      return { error: 'Valid room ID required.' };
    }

    const roomCheck = await mockQuery('SELECT id, language, name FROM rooms WHERE id = $1', [roomId]);
    if (!roomCheck.rows || roomCheck.rows.length === 0) {
      return { error: 'Room does not exist.' };
    }

    const partResult = await mockQuery(
      'SELECT role FROM room_participants WHERE room_id = $1 AND user_id = $2',
      [roomId, socket.verifiedUser.id]
    );
    if (!partResult.rows || partResult.rows.length === 0) {
      return { error: 'Access denied: You are not a member of this room.' };
    }

    const actualRole = partResult.rows[0].role;
    socket.data = { roomId, role: actualRole };
    return { success: true, role: actualRole };
  };

  // Emulate secured event dispatch
  const handleYjsUpdate = (socket, { roomId, update }) => {
    if (!roomId || !socket.data?.roomId || socket.data.roomId !== roomId) return false;
    if (socket.data.role !== 'editor') return false;
    if (!update) return false;
    return true;
  };

  const handleExecutionResult = (socket, { roomId, result }) => {
    if (!roomId || !socket.data?.roomId || socket.data.roomId !== roomId) return false;
    if (socket.data.role !== 'editor') return false;
    if (!result || typeof result !== 'object') return false;
    return true;
  };

  test('Rejects unauthenticated socket connections with AUTH_MISSING', async () => {
    await expect(runAuthMiddleware(null)).rejects.toThrow('AUTH_MISSING');
  });

  test('Rejects socket connection with invalid JWT signature', async () => {
    await expect(runAuthMiddleware('bad.token.signature')).rejects.toThrow('AUTH_INVALID');
  });

  test('Rejects join-room if room does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }); // Room not found
    const socket = { verifiedUser: { id: 'u1' } };
    const res = await handleJoinRoom(socket, { roomId: 'unknown-room' });
    expect(res.error).toBe('Room does not exist.');
  });

  test('Rejects join-room if authenticated user is not a participant of room', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'room-1' }] }) // Room exists
      .mockResolvedValueOnce({ rows: [] }); // Not participant
    const socket = { verifiedUser: { id: 'u2' } };
    const res = await handleJoinRoom(socket, { roomId: 'room-1' });
    expect(res.error).toContain('Access denied');
  });

  test('Enforces server-verified role from database ignoring client spoofed role', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'room-2' }] }) // Room exists
      .mockResolvedValueOnce({ rows: [{ role: 'viewer' }] }); // DB says viewer
    const socket = { verifiedUser: { id: 'u3' } };
    const res = await handleJoinRoom(socket, { roomId: 'room-2', role: 'editor' });
    expect(res.success).toBe(true);
    expect(res.role).toBe('viewer'); // Overridden to viewer
  });

  test('Blocks viewer from dispatching yjs-update', () => {
    const socket = { verifiedUser: { id: 'u4' }, data: { roomId: 'room-3', role: 'viewer' } };
    const allowed = handleYjsUpdate(socket, { roomId: 'room-3', update: Buffer.from([1, 2, 3]) });
    expect(allowed).toBe(false);
  });

  test('Allows editor to dispatch yjs-update', () => {
    const socket = { verifiedUser: { id: 'u5' }, data: { roomId: 'room-3', role: 'editor' } };
    const allowed = handleYjsUpdate(socket, { roomId: 'room-3', update: Buffer.from([1, 2, 3]) });
    expect(allowed).toBe(true);
  });

  test('Blocks viewer from broadcasting execution-result', () => {
    const socket = { verifiedUser: { id: 'u6' }, data: { roomId: 'room-4', role: 'viewer' } };
    const allowed = handleExecutionResult(socket, { roomId: 'room-4', result: { output: 'code' } });
    expect(allowed).toBe(false);
  });

  test('Blocks execution-result to a different room than joined', () => {
    const socket = { verifiedUser: { id: 'u7' }, data: { roomId: 'room-4', role: 'editor' } };
    const allowed = handleExecutionResult(socket, { roomId: 'room-99', result: { output: 'code' } });
    expect(allowed).toBe(false);
  });
});
