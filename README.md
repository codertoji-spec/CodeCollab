# CodeCollab 🚀

Real-time collaborative code editor. Multiple developers edit code simultaneously, see live cursors, chat, and run code — all in the browser.

> VS Code + Google Docs + Online Compiler

**Live Demo:** [code-collab-woad.vercel.app](https://code-collab-woad.vercel.app)

---

## Stack

**Backend:** Node.js, Express, Socket.io, PostgreSQL, Passport.js, JWT  
**Frontend:** React 18, Vite, Tailwind CSS, Monaco Editor, Socket.io Client  
**Real-time Sync:** Yjs CRDT  
**Execution:** JDoodle API (C++17, Python, JS, TS, Go, Rust, Java)  
**Infra:** Render (backend) · Vercel (frontend) · Supabase (PostgreSQL)

---

## Features

| Feature | Description |
|---------|-------------|
| Real-time editing | Yjs CRDT synced via binary Socket.io frames |
| Remote cursors | Live cursors with color + username labels |
| Editor / Viewer roles | Separate room codes — edit or read-only access |
| Code execution | 7 languages via JDoodle API |
| CPP Snippets | Type `/# <n>` for hardcoded · `\# <n>` for user-input version |
| Version history | Manual snapshots + auto-save every 10 min |
| Integrated chat | Typing indicators + system messages |
| Presence | Color-coded avatars for all users in room |
| Auth | Email/password + Google OAuth, JWT-based |

---

## CPP Snippet Commands

Type in the editor and press **Enter**:

| Command | Result |
|---------|--------|
| `/# 1` | FCFS (hardcoded values) |
| `\# 1` | FCFS (asks for user input) |

Available snippets (1–19):

```
1. FCFS          2. SJF           3. PRIORITY      4. RR
5. SRTF          6. LRTF          7. BANKER        8. PCP
9. FIFO PAGE    10. LRU PAGE     11. DPP          12. RWP
13. SSTF        14. FCFS (DISK)  15. C SCAN       16. IMRR
17. HRNN        18. CSP          19. SBP
```

---

## Local Setup

```bash
git clone https://github.com/codertoji-spec/CodeCollab.git
cd CodeCollab
```

### Backend
```bash
cd backend
cp .env.example .env   # fill in values
npm install
node src/index.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

**Backend `.env`:**
```
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
SESSION_SECRET=your_secret
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
JDOODLE_CLIENT_ID=...
JDOODLE_CLIENT_SECRET=...
```

**Frontend `.env`:**
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | code-collab-woad.vercel.app |
| Backend | Render | codecollab-gcgs.onrender.com |
| Database | Supabase | PostgreSQL (connection pooler) |

> **Note:** Code execution uses JDoodle API (200 req/day free tier).  
> Run button works for all 7 languages in the deployed version.

---

## Architecture

```
Frontend (React/Vite — Vercel)
    ↕ HTTP REST    → Backend (Express — Render)
    ↕ WebSocket    → Socket.io → Broadcast to room
                   ↓ Yjs CRDT state
                   Supabase PostgreSQL
                   ↓ JDoodle API
                   Code execution (7 languages)
```

### Real-time Sync (Yjs CRDT)
- Server holds one `Y.Doc` per active room in memory
- Client updates sent as binary `Uint8Array` frames
- State persisted to PostgreSQL every 5s
- On join, server sends full state vector (`yjs-init`)

### Socket Authentication
JWT verified on handshake. `userId` and `username` always read from `socket.verifiedUser` — client payload never trusted.

### Version History
- Manual save / auto-save every 10 min / snapshot on language change
- Max 100 snapshots per room
- Restore syncs to all peers via CRDT transaction

---

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-room` | C→S | Join room with role |
| `room-state` | S→C | Initial language + user list |
| `yjs-init` | S→C | Full Yjs state on join |
| `yjs-update` | C↔S | Binary CRDT update |
| `users-update` | S→C | Updated user list |
| `language-change` | C↔S | Language switch |
| `cursor-move` / `cursor-update` | C↔S | Remote cursors |
| `chat-message` | C↔S | Chat |
| `typing` / `typing-update` | C↔S | Typing indicator |
| `execution-result` | C↔S | Code run output |

---

## Google OAuth Setup

1. [console.cloud.google.com](https://console.cloud.google.com) → new project
2. OAuth 2.0 Client ID (Web app)
3. Authorized redirect URI: `https://codecollab-gcgs.onrender.com/api/auth/google/callback`
4. Add `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` to backend env

---

## Security Notes
- Socket auth via JWT handshake
- REST auth middleware with token caching
- Snapshot saves are atomic DB transactions
- Chat messages sanitized + capped at 500 chars server-side
- Yjs editor role verified server-side before applying updates

---

## Testing

```bash
cd backend && npm test
```

| Suite | What it tests |
|-------|--------------|
| `auth.test.js` | Token cache, invalidation, bad tokens |
| `yjsManager.test.js` | Race condition fix, doc creation, update roundtrip |
