require('dotenv').config();
const { validateEnv } = require('./config/env');
validateEnv();

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

const isProduction = process.env.NODE_ENV === 'production';

// ── Security headers ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  next();
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '512kb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'codecollab_session',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/execute', executeRoutes);

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', app: 'CodeCollab' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: err.message, app: 'CodeCollab' });
  }
});

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

// ── Rate limiter for high-frequency socket events (per socket) ────────────────
const socketRateLimits = new Map();
const checkSocketRateLimit = (socketId, eventType, maxPerSecond = 50) => {
  const key = `${socketId}:${eventType}`;
  const now = Date.now();
  let record = socketRateLimits.get(key);
  if (!record || now - record.windowStart > 1000) {
    record = { windowStart: now, count: 1 };
    socketRateLimits.set(key, record);
    return true;
  }
  record.count++;
  return record.count <= maxPerSecond;
};

// Clean up socket rate limit state on disconnect
const clearSocketRateLimits = (socketId) => {
  for (const key of socketRateLimits.keys()) {
    if (key.startsWith(`${socketId}:`)) {
      socketRateLimits.delete(key);
    }
  }
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

  socket.on('join-room', async (payload) => {
    try {
      if (!payload || typeof payload !== 'object') {
        return socket.emit('join-error', { message: 'Invalid payload format.' });
      }

      const { roomId, language } = payload;
      if (!roomId || typeof roomId !== 'string' || roomId.trim().length === 0) {
        return socket.emit('join-error', { message: 'Valid room ID required.' });
      }

      // 1. Verify that the room actually exists
      const roomCheck = await pool.query('SELECT id, language, name FROM rooms WHERE id = $1', [roomId]);
      if (roomCheck.rows.length === 0) {
        return socket.emit('join-error', { message: 'Room does not exist.' });
      }

      // 2. Verify that the user is an authorized participant
      const partResult = await pool.query(
        'SELECT role FROM room_participants WHERE room_id = $1 AND user_id = $2',
        [roomId, userId]
      );
      if (partResult.rows.length === 0) {
        return socket.emit('join-error', { message: 'Access denied: You are not a member of this room.' });
      }

      const actualRole = partResult.rows[0].role; // 'editor' | 'viewer'

      // 3. Handle previous room cleanup if switching rooms on the same socket
      if (socket.data?.roomId && socket.data.roomId !== roomId) {
        const oldRoomId = socket.data.roomId;
        socket.leave(oldRoomId);
        const oldMeta = roomMeta[oldRoomId];
        if (oldMeta) {
          oldMeta.users.delete(socket.id);
          yjsManager.persistDoc(oldRoomId).catch(() => {});
          if (oldMeta.users.size === 0) {
            clearAutoSnapshot(oldRoomId);
            const code = yjsManager.getText(oldRoomId);
            if (code && code.trim()) {
              pool.query(
                'INSERT INTO code_snapshots (room_id, code, label, saved_by) VALUES ($1, $2, $3, $4)',
                [oldRoomId, code, 'Auto-save on exit', userId]
              ).catch(err => console.error('[AutoSnapshot on exit] Error:', err.message));
            }
            delete roomMeta[oldRoomId];
          } else {
            io.to(oldRoomId).emit('users-update', Array.from(oldMeta.users.values()));
            io.to(oldRoomId).emit('user-left', { socketId: socket.id, username });
            io.to(oldRoomId).emit('cursor-remove', { socketId: socket.id });
          }
        }
      }

      // 4. Join room ONLY after verification passes
      socket.join(roomId);

      const roomLang = roomCheck.rows[0].language || language || 'javascript';
      const meta = getOrCreateMeta(roomId, roomLang);

      meta.users.set(socket.id, { userId, username, role: actualRole, socketId: socket.id });
      socket.data = { roomId, userId, username, role: actualRole };

      // Start auto-snapshot timer for this room
      scheduleAutoSnapshot(roomId);

      // Initialize Yjs doc for room
      await yjsManager.getOrCreateDoc(roomId);
      const yjsState = yjsManager.encodeState(roomId);

      socket.emit('room-state', {
        language: meta.language,
        role: actualRole,
        users: Array.from(meta.users.values()),
      });

      if (yjsState) {
        socket.emit('yjs-init', Buffer.from(yjsState));
      }

      socket.to(roomId).emit('user-joined', { socketId: socket.id, userId, username, role: actualRole });
      io.to(roomId).emit('users-update', Array.from(meta.users.values()));
    } catch (e) {
      console.error('[Socket join-room] error:', e.message);
      socket.emit('join-error', { message: 'An internal error occurred while joining the room.' });
    }
  });

  socket.on('yjs-update', ({ roomId, update } = {}) => {
    // 1. Verify socket is joined to this room
    if (!roomId || !socket.data?.roomId || socket.data.roomId !== roomId) return;
    if (!checkSocketRateLimit(socket.id, 'yjs-update', 100)) return;

    const meta = roomMeta[roomId];
    if (!meta) return;
    const user = meta.users.get(socket.id);

    // 2. Strict authorization: user must be editor AND the verified socket user
    if (!user || user.role !== 'editor' || user.userId !== userId) return;
    if (!update) return;

    try {
      const updateBytes = Buffer.isBuffer(update) ? update : Buffer.from(update);
      // Prevent oversized single update payload abuse (> 500KB)
      if (updateBytes.length > 500 * 1024) return;

      yjsManager.applyUpdate(roomId, updateBytes);
      socket.to(roomId).emit('yjs-update', { update: updateBytes });
    } catch (err) {
      console.error(`[Socket yjs-update] Error for room ${roomId}:`, err.message);
    }
  });

  socket.on('language-change', ({ roomId, language } = {}) => {
    // 1. Verify socket is in room
    if (!roomId || !socket.data?.roomId || socket.data.roomId !== roomId) return;
    if (!language || typeof language !== 'string') return;

    const meta = roomMeta[roomId];
    if (!meta) return;
    const user = meta.users.get(socket.id);

    // 2. Editors only
    if (!user || user.role !== 'editor' || user.userId !== userId) return;

    meta.language = language;
    socket.to(roomId).emit('language-update', { language });

    // Auto-snapshot on language change
    const code = yjsManager.getText(roomId);
    if (code.trim()) {
      pool.query(
        'INSERT INTO code_snapshots (room_id, code, label, saved_by) VALUES ($1, $2, $3, $4)',
        [roomId, code, `Before switch to ${language}`, userId]
      ).catch(err => console.error('[Snapshot] language-change error:', err.message));
    }

    pool.query('UPDATE rooms SET language = $1 WHERE id = $2', [language, roomId])
      .catch(err => console.error('[DB] Error updating room language:', err.message));
  });

  socket.on('cursor-move', ({ roomId, position, selection } = {}) => {
    if (!roomId || !socket.data?.roomId || socket.data.roomId !== roomId) return;
    if (!checkSocketRateLimit(socket.id, 'cursor-move', 60)) return;

    // username from verified socket, never client payload
    socket.to(roomId).emit('cursor-update', { socketId: socket.id, username, position, selection });
  });

  socket.on('chat-message', ({ roomId, message } = {}) => {
    if (!roomId || !socket.data?.roomId || socket.data.roomId !== roomId) return;
    if (!checkSocketRateLimit(socket.id, 'chat-message', 10)) return;
    if (!message || typeof message !== 'string') return;

    const sanitized = message.trim().slice(0, 500);
    if (!sanitized) return;

    io.to(roomId).emit('chat-message', {
      socketId: socket.id,
      username,
      message: sanitized,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('typing', ({ roomId, isTyping } = {}) => {
    if (!roomId || !socket.data?.roomId || socket.data.roomId !== roomId) return;
    if (!checkSocketRateLimit(socket.id, 'typing', 20)) return;

    socket.to(roomId).emit('typing-update', { socketId: socket.id, username, isTyping: Boolean(isTyping) });
  });

  socket.on('execution-result', ({ roomId, result } = {}) => {
    // Prevent client-spoofed execution results: only editors joined to this room can broadcast
    if (!roomId || !socket.data?.roomId || socket.data.roomId !== roomId) return;
    const meta = roomMeta[roomId];
    if (!meta) return;
    const user = meta.users.get(socket.id);
    if (!user || user.role !== 'editor') return;

    // Validate result shape
    if (!result || typeof result !== 'object') return;
    const safeResult = {
      output: typeof result.output === 'string' ? result.output.slice(0, 100_000) : '',
      error: typeof result.error === 'string' ? result.error.slice(0, 10_000) : '',
      compilerMessage: typeof result.compilerMessage === 'string' ? result.compilerMessage.slice(0, 50_000) : '',
      exitCode: typeof result.exitCode === 'number' ? result.exitCode : 0,
      signal: result.signal || null,
    };

    io.to(roomId).emit('execution-result', safeResult);
  });

  socket.on('leave-room', async ({ roomId } = {}) => {
    if (!roomId || !socket.data?.roomId || socket.data.roomId !== roomId) return;
    const meta = roomMeta[roomId];
    if (meta) {
      meta.users.delete(socket.id);
      try {
        await yjsManager.persistDoc(roomId);
      } catch (err) {
        console.error(`[leave-room] Persist error for room ${roomId}:`, err.message);
      }

      if (meta.users.size === 0) {
        clearAutoSnapshot(roomId);
        const code = yjsManager.getText(roomId);
        if (code && code.trim()) {
          pool.query(
            'INSERT INTO code_snapshots (room_id, code, label, saved_by) VALUES ($1, $2, $3, $4)',
            [roomId, code, 'Auto-save on exit', userId]
          ).catch(err => console.error('[AutoSnapshot on exit] Error:', err.message));
        }
        delete roomMeta[roomId];
      } else {
        io.to(roomId).emit('users-update', Array.from(meta.users.values()));
        io.to(roomId).emit('user-left', { socketId: socket.id, username });
        io.to(roomId).emit('cursor-remove', { socketId: socket.id });
      }
    }
    socket.leave(roomId);
    socket.data.roomId = null;
  });

  socket.on('disconnect', async () => {
    clearSocketRateLimits(socket.id);
    const { roomId } = socket.data || {};
    if (!roomId) return;
    const meta = roomMeta[roomId];
    if (meta) {
      meta.users.delete(socket.id);

      // Always persist state to DB immediately on disconnect
      try {
        await yjsManager.persistDoc(roomId);
      } catch (err) {
        console.error(`[Socket disconnect] Persist error for room ${roomId}:`, err.message);
      }

      if (meta.users.size === 0) {
        clearAutoSnapshot(roomId);
        const code = yjsManager.getText(roomId);
        if (code && code.trim()) {
          pool.query(
            'INSERT INTO code_snapshots (room_id, code, label, saved_by) VALUES ($1, $2, $3, $4)',
            [roomId, code, 'Auto-save on exit', userId]
          ).catch(err => console.error('[AutoSnapshot on exit] Error:', err.message));
        }
        delete roomMeta[roomId];
      } else {
        io.to(roomId).emit('users-update', Array.from(meta.users.values()));
        io.to(roomId).emit('user-left', { socketId: socket.id, username });
        io.to(roomId).emit('cursor-remove', { socketId: socket.id });
      }
    }
    console.log(`Socket disconnected: ${socket.id} (user: ${username})`);
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[Unhandled Error]', err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: status === 500 ? 'Internal Server Error' : err.message });
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
