const mockQuery = jest.fn();
jest.mock('../config/db', () => ({
  query: mockQuery,
  connect: jest.fn(),
  on: jest.fn(),
}));

const { renameRoom } = require('../controllers/roomController');

describe('Room rename controller (renameRoom)', () => {
  let req, res;

  beforeEach(() => {
    mockQuery.mockReset();
    req = {
      params: { roomId: 'room-123' },
      body: {},
      user: { id: 101, username: 'tester' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  it('rejects missing or empty name', async () => {
    req.body.name = '   ';
    await renameRoom(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringMatching(/required/i) }));
  });

  it('rejects if name exceeds 100 characters', async () => {
    req.body.name = 'a'.repeat(101);
    await renameRoom(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringMatching(/100 characters/i) }));
  });

  it('rejects if user is not the room creator', async () => {
    req.body.name = 'New Room Name';
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await renameRoom(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringMatching(/Only the room creator/i) }));
    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT id FROM rooms WHERE id = $1 AND created_by = $2',
      ['room-123', 101]
    );
  });

  it('successfully updates room name when user is creator', async () => {
    req.body.name = '  Renamed Workspace  ';
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'room-123' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'room-123', name: 'Renamed Workspace', created_by: 101 }] });

    await renameRoom(req, res);

    expect(mockQuery).toHaveBeenNthCalledWith(
      2,
      'UPDATE rooms SET name = $1 WHERE id = $2 RETURNING *',
      ['Renamed Workspace', 'room-123']
    );
    expect(res.json).toHaveBeenCalledWith({
      message: 'Room renamed successfully',
      room: { id: 'room-123', name: 'Renamed Workspace', created_by: 101 }
    });
  });
});
