# CodeCollab 🚀

Real-time collaborative code editor. Multiple developers edit code simultaneously, see cursors, run code together, and chat — all in the browser.

> VS Code + Google Docs + Online Compiler

---

## Stack

**Backend:** Node.js, Express, Socket.io, PostgreSQL, Passport.js, JWT  
**Frontend:** React 18, Vite, Tailwind CSS, Monaco Editor, Socket.io Client  
**Execution:** Internal Docker-based sandbox (replaces Wandbox)  
**Infra:** Docker, Docker Compose, PostgreSQL

---

## Quick Start (Docker — Recommended)

### Prerequisites
- Docker Desktop installed and running
- Git

### Steps

```bash
# 1. Clone / extract the project
cd codecollab

# 2. Build sandbox images for code execution (one-time)
cd backend/sandbox
chmod +x build-images.sh
./build-images.sh
cd ../..

# 3. Start all services
docker-compose up --build

# Wait ~30 seconds for all services to start

# 4. Open in browser
# → Frontend:    http://localhost:5173
# → Backend API: http://localhost:5000/api/health
```

DB schema auto-runs on first start.

---

## Internal Code Execution (NEW)

Wandbox has been **fully removed**. Code now runs in **isolated Docker sandbox containers** spawned per-request by the backend (Docker-out-of-Docker).

### Flow
```
Client → Socket.io → Backend → executionService.js
       → docker run --rm --network=none ... codecollab-sandbox-<lang>
       → stdout/stderr captured → execution-result event → Client
```

### Security hardening (per container)
| Control | Value |
|---------|-------|
| Network | `--network=none` (no internet, no host access) |
| Memory | `256m` (configurable via `EXEC_MEMORY`) |
| CPU | `0.5` (configurable via `EXEC_CPUS`) |
| PIDs | `64` (blocks fork bombs) |
| Filesystem | `--read-only` + tmpfs `/sandbox` |
| Timeout | 5s wall-clock (configurable via `EXEC_TIMEOUT_MS`) |
| Output cap | Truncated at `EXEC_OUTPUT_MAX` bytes |
| Cleanup | `--rm` auto-removes container on exit |
| User | Non-root inside container |

### Supported languages
JavaScript (Node) · TypeScript (tsx) · Python · C++ (g++)

### Files added
```
backend/src/services/executionService.js    # spawns docker, captures I/O
backend/src/services/langConfig.js          # image + compile/run commands per lang
backend/sandbox/Dockerfile.node
backend/sandbox/Dockerfile.python
backend/sandbox/Dockerfile.cpp
backend/sandbox/build-images.sh
```

### Files modified
```
backend/src/controllers/executeController.js   # Wandbox call removed
backend/Dockerfile                             # docker-cli installed
docker-compose.yml                             # mounts /var/run/docker.sock + /tmp
```

### Environment variables
```
EXEC_TIMEOUT_MS=5000
EXEC_MEMORY=256m
EXEC_CPUS=0.5
EXEC_PIDS=64
EXEC_OUTPUT_MAX=65536
```

### Testing execution locally
```bash
# After build-images.sh + docker-compose up
curl -X POST http://localhost:5000/api/execute/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d '{"language":"python","code":"print(2+2)"}'
# → { "stdout": "4\n", "stderr": "", "exitCode": 0 }
```

Verified safe against: infinite loops (timeout kills), network access (blocked), fork bombs (PID limit), filesystem writes outside `/sandbox` (read-only rootfs).

---

## Manual Setup (No Docker)

Not supported for code execution — the sandbox requires Docker. You can still run the editor/chat/sync without execution:

```bash
cd backend && npm install && npm start
cd frontend && npm install && npm run dev
```

---

## Features

| Feature | Description |
|---------|-------------|
| Real-time editing | Yjs CRDT synced via binary Socket.io frames |
| Remote cursors | Live cursors with color labels for each user |
| Edit / View links | Separate room codes — editor or read-only |
| Code execution | 4 languages via internal Docker sandbox |
| Version history | Manual snapshots + auto-save every 10 min |
| Snapshot on lang change | State captured before language reset |
| Integrated chat | Typing indicators + system messages |
| Presence | Color-coded avatars for all users in room |
| Auth | Email/password + Google OAuth, JWT-based |

---

## Architecture

```
Frontend (React/Vite :5173)
    ↕ HTTP REST      → Backend (Express :5000)
    ↕ WebSocket      → Socket.io → Broadcast to room
                     ↓ Yjs CRDT state
                     PostgreSQL (:5432)
                     ↓ docker.sock (DooD)
                     Sandbox containers (per execution)
```

### Real-time sync (Yjs CRDT)
- Server holds one `Y.Doc` per active room in memory
- Client updates sent as binary `Uint8Array` frames
- State debounce-persisted to PostgreSQL every 5 s
- On new join, server sends full state vector (`yjs-init`)
- Race-safe: concurrent `getOrCreateDoc` calls share one load Promise

### Socket Authentication
JWT verified on handshake via Socket.io middleware. `userId` and `username` are always read from `socket.verifiedUser` — never trust client payload.

### Auth Middleware Caching
JWT verified per request; DB lookup cached for `min(JWT TTL, 5 min)`. Max 500 entries.

### Version History
- Manual save / auto-save every 10 min / snapshot on language change
- Max 100 snapshots per room (oldest pruned in DB transaction)
- Restore replaces Y.Doc via CRDT transaction → syncs to all peers

---

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-room` | C→S | Join a room with role |
| `room-state` | S→C | Initial language + user list |
| `yjs-init` | S→C | Full Yjs state vector on join |
| `yjs-update` | C↔S | Binary CRDT update |
| `users-update` | S→C | Updated user list |
| `user-joined` / `user-left` | S→C | Presence events |
| `language-change` / `language-update` | C↔S | Language switch |
| `cursor-move` / `cursor-update` / `cursor-remove` | C↔S | Remote cursors |
| `chat-message` | C↔S | Chat message |
| `typing` / `typing-update` | C↔S | Typing indicator |
| `execution-result` | C↔S | Code run output (now from internal sandbox) |

---

## Google OAuth (Optional)

1. [console.cloud.google.com](https://console.cloud.google.com) → new project
2. OAuth 2.0 Client ID (Web app)
3. Redirect URI: `http://localhost:5000/api/auth/google/callback`
4. Put Client ID + Secret in `.env` / `docker-compose.yml`

---

## Security Notes
- Socket auth via JWT handshake (not per-event)
- REST auth middleware caches verified tokens
- Snapshot saves are atomic DB transactions
- Chat messages sanitized + capped at 500 chars server-side
- Yjs editor role verified server-side before applying updates
- **Code execution is fully sandboxed** — see "Internal Code Execution" above

---

## Testing

```bash
cd backend
npm test
```

| Suite | What it tests |
|-------|--------------|
| `auth.test.js` | Token cache, `invalidateToken`, bad/missing tokens, deleted user |
| `yjsManager.test.js` | Race condition fix, doc creation, update roundtrip, `encodeState` |

---

## Setup recap

```bash
cp backend/.env.example backend/.env
./backend/sandbox/build-images.sh
docker-compose up --build
```

Never commit `.env`.
