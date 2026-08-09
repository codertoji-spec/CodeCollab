require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');
const jwt = require('jsonwebtoken');
const pool = require('./config/db');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const executeRoutes = require('./routes/execute');
const yjsManager = require('./services/yjsManager');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'codecollab_session',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/execute', executeRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'CodeCollab' }));

// ── Socket.io JWT auth middleware ─────────────────────────────────────────────
// Token passed in socket.auth.token (handshake) — never trust client-sent userId.
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('AUTH_MISSING'));

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return next(new Error('AUTH_INVALID'));
  }

  try {
    const result = await pool.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (!result.rows[0]) return next(new Error('AUTH_USER_NOT_FOUND'));
    // Attach verified user to socket — cannot be spoofed by client
    socket.verifiedUser = result.rows[0];
    next();
  } catch (err) {
    console.error('[Socket auth] DB error:', err.message);
    next(new Error('AUTH_DB_ERROR'));
  }
});

// ── In-memory room metadata (language + users only — code is in Yjs/PG) ──────
const roomMeta = {};

const getOrCreateMeta = (roomId, language = 'javascript') => {
  if (!roomMeta[roomId]) {
    roomMeta[roomId] = { language, users: new Map() };
  }
  return roomMeta[roomId];
};

// ── Snapshot auto-save helper ─────────────────────────────────────────────────
const AUTO_SNAPSHOT_INTERVAL = 10 * 60 * 1000; // 10 minutes
const autoSnapshotTimers = new Map();

const scheduleAutoSnapshot = (roomId) => {
  if (autoSnapshotTimers.has(roomId)) return; // already scheduled
  const timer = setInterval(async () => {
    const meta = roomMeta[roomId];
    if (!meta || meta.users.size === 0) return;
    const code = yjsManager.getText(roomId);
    if (!code.trim()) return;
    try {
      await pool.query(
        'INSERT INTO code_snapshots (room_id, code, label) VALUES ($1, $2, $3)',
        [roomId, code, 'Auto-save']
      );
      // Keep max 100 snapshots per room — delete oldest beyond limit
      await pool.query(
        `DELETE FROM code_snapshots
         WHERE id IN (
           SELECT id FROM code_snapshots
           WHERE room_id = $1
           ORDER BY saved_at DESC
           OFFSET 100
         )`,
        [roomId]
      );
      console.log(`[AutoSnapshot] Saved for room ${roomId}`);
    } catch (err) {
      console.error('[AutoSnapshot] Error:', err.message);
    }
  }, AUTO_SNAPSHOT_INTERVAL);
  autoSnapshotTimers.set(roomId, timer);
};

const clearAutoSnapshot = (roomId) => {
  if (autoSnapshotTimers.has(roomId)) {
    clearInterval(autoSnapshotTimers.get(roomId));
    autoSnapshotTimers.delete(roomId);
  }
};

// ── Socket event handlers ─────────────────────────────────────────────────────
io.on('connection', (socket) => {
  // verifiedUser is guaranteed by middleware — no client spoofing possible
  const { id: userId, username } = socket.verifiedUser;
  console.log(`Socket connected: ${socket.id} (user: ${username})`);

  socket.on('join-room', async ({ roomId, role: clientRole, language }) => {
    socket.join(roomId);
    
    // Fetch the actual verified role from PostgreSQL
    let actualRole = 'viewer';
    try {
      const partResult = await pool.query(`
        SELECT rp.role 
        FROM room_participants rp
        JOIN rooms r ON r.id = rp.room_id
        WHERE (r.room_code = $1 OR r.view_code = $1) AND rp.user_id = $2
      `, [roomId, userId]);
      
      if (partResult.rows.length > 0) {
        actualRole = partResult.rows[0].role;
      }
    } catch (e) {
      console.error('Socket role verification error:', e.message);
    }

    const meta = getOrCreateMeta(roomId, language);

    meta.users.set(socket.id, { userId, username, role: actualRole, socketId: socket.id });
    socket.data = { roomId, userId, username, role: actualRole };

    // Start auto-snapshot timer for this room (no-op if already running)
    scheduleAutoSnapshot(roomId);

    await yjsManager.getOrCreateDoc(roomId);
    const yjsState = yjsManager.encodeState(roomId);

    socket.emit('room-state', {
      language: meta.language,
      users: Array.from(meta.users.values()),
    });

    if (yjsState) {
      socket.emit('yjs-init', Buffer.from(yjsState));
    }

    socket.to(roomId).emit('user-joined', { socketId: socket.id, userId, username, role });
    io.to(roomId).emit('users-update', Array.from(meta.users.values()));
  });

  socket.on('yjs-update', ({ roomId, update }) => {
    const meta = roomMeta[roomId];
    if (!meta) return;
    const user = meta.users.get(socket.id);
    // Double-check: user must be editor AND must be the verified socket owner
    if (!user || user.role === 'viewer' || user.userId !== userId) return;
    if (!update) return;

    const updateBytes = Buffer.isBuffer(update) ? update : Buffer.from(update);
    yjsManager.applyUpdate(roomId, updateBytes);
    socket.to(roomId).emit('yjs-update', { update: updateBytes });
  });

  socket.on('language-change', ({ roomId, language }) => {
    const meta = roomMeta[roomId];
    if (!meta) return;
    const user = meta.users.get(socket.id);
    if (!user || user.role === 'viewer') return;
    meta.language = language;
    socket.to(roomId).emit('language-update', { language });

    // Auto-snapshot on language change — captures state before reset
    const code = yjsManager.getText(roomId);
    if (code.trim()) {
      pool.query(
        'INSERT INTO code_snapshots (room_id, code, label, saved_by) VALUES ($1, $2, $3, $4)',
        [roomId, code, `Before switch to ${language}`, userId]
      ).catch(err => console.error('[Snapshot] language-change error:', err.message));
    }
  });

  socket.on('cursor-move', ({ roomId, position, selection }) => {
    // username from verified socket, not client payload
    socket.to(roomId).emit('cursor-update', { socketId: socket.id, username, position, selection });
  });

  socket.on('chat-message', ({ roomId, message }) => {
    if (!message || typeof message !== 'string') return;
    const sanitized = message.trim().slice(0, 500);
    if (!sanitized) return;
    io.to(roomId).emit('chat-message', {
      socketId: socket.id, username, message: sanitized, timestamp: new Date().toISOString(),
    });
  });

  socket.on('typing', ({ roomId, isTyping }) => {
    socket.to(roomId).emit('typing-update', { socketId: socket.id, username, isTyping });
  });

  socket.on('execution-result', ({ roomId, result }) => {
    io.to(roomId).emit('execution-result', result);
  });

  socket.on('disconnect', () => {
    const { roomId } = socket.data || {};
    if (!roomId) return;
    const meta = roomMeta[roomId];
    if (meta) {
      meta.users.delete(socket.id);
      if (meta.users.size === 0) {
        clearAutoSnapshot(roomId);
        yjsManager.persistDoc(roomId).finally(() => { delete roomMeta[roomId]; });
      } else {
        io.to(roomId).emit('users-update', Array.from(meta.users.values()));
        io.to(roomId).emit('user-left', { socketId: socket.id, username });
        io.to(roomId).emit('cursor-remove', { socketId: socket.id });
      }
    }
    console.log(`Socket disconnected: ${socket.id} (user: ${username})`);
  });
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = async (sig) => {
  console.log(`\n${sig} — flushing Yjs state to DB…`);
  for (const timer of autoSnapshotTimers.values()) clearInterval(timer);
  await yjsManager.persistAll();
  server.close(() => process.exit(0));
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 CodeCollab server running on port ${PORT}`));
