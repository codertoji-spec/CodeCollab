-- CodeCollab Database Schema (v3 — security + snapshot limits)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  google_id VARCHAR(255),
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  otp VARCHAR(6),
  otp_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  room_code VARCHAR(10) UNIQUE NOT NULL,
  view_code VARCHAR(10) UNIQUE NOT NULL,
  language VARCHAR(50) DEFAULT 'javascript',
  yjs_state BYTEA,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Code snapshots table (version history)
-- Max 100 per room — enforced at application layer in roomController + index.js
CREATE TABLE IF NOT EXISTS code_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  code TEXT,
  label VARCHAR(100),
  saved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  saved_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast snapshot queries (room + recency)
CREATE INDEX IF NOT EXISTS idx_snapshots_room_saved
  ON code_snapshots (room_id, saved_at DESC);

-- Room participants table
-- role: 'editor' (joined via room_code) or 'viewer' (joined via view_code).
-- This is the server-side source of truth for authorization — see
-- middleware/roomAccess.js. Never trust a client-sent role.
CREATE TABLE IF NOT EXISTS room_participants (
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL DEFAULT 'editor',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  username VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- ── Safe migrations (re-runnable on existing DBs) ─────────────────────────────
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS yjs_state BYTEA;
ALTER TABLE code_snapshots ADD COLUMN IF NOT EXISTS label VARCHAR(100);
ALTER TABLE room_participants ADD COLUMN IF NOT EXISTS role VARCHAR(10) NOT NULL DEFAULT 'editor';

CREATE INDEX IF NOT EXISTS idx_snapshots_room_saved
  ON code_snapshots (room_id, saved_at DESC);

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;
