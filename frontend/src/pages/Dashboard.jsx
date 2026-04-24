import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const LANGUAGES = ['javascript', 'python', 'java', 'cpp', 'typescript', 'go', 'rust']

const LANG_COLORS = {
  javascript: 'text-yellow-400',
  python: 'text-blue-400',
  java: 'text-orange-400',
  cpp: 'text-purple-400',
  typescript: 'text-blue-300',
  go: 'text-cyan-400',
  rust: 'text-orange-500',
}

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('cc_token')}` }
})

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [tab, setTab] = useState('create') // 'create' | 'join'
  const [createForm, setCreateForm] = useState({ name: '', language: 'javascript' })
  const [joinCode, setJoinCode] = useState('')
  const [modal, setModal] = useState(null) // { room, role }
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shareModal, setShareModal] = useState(null)

  useEffect(() => {
    axios.get(`${API}/rooms/list`, authHeader())
      .then(r => setRooms(r.data.rooms))
      .catch(() => {})
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await axios.post(`${API}/rooms/create`, createForm, authHeader())
      const room = res.data.room
      setRooms(prev => [room, ...prev])
      setShareModal(room)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await axios.post(`${API}/rooms/join`, { code: joinCode }, authHeader())
      const { room, role } = res.data
      navigate(`/room/${room.id}`, { state: { room, role } })
    } catch (err) {
      setError(err.response?.data?.error || 'Room not found')
    } finally {
      setLoading(false)
    }
  }

  const enterRoom = (room) => {
    navigate(`/room/${room.id}`, { state: { room, role: 'editor' } })
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 glass-nav">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-mono font-bold text-xs">CC</span>
          </div>
          <span className="font-semibold tracking-tight">CodeCollab</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 bg-accent-primary rounded-full flex items-center justify-center text-xs font-bold text-white">
                {user?.username?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-slate-300 text-sm font-medium">{user?.username}</span>
          </div>
          <button onClick={logout} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
            Sign Out
          </button>
        </div>
      </nav>

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-400 mt-1">Create a new room or join an existing one</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left - Create/Join */}
          <div>
            <div className="flex gap-1 mb-4 bg-dark-700 p-1 rounded-lg">
              <button
                onClick={() => { setTab('create'); setError('') }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${tab === 'create' ? 'bg-yellow-400 text-black' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Create Room
              </button>
              <button
                onClick={() => { setTab('join'); setError('') }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${tab === 'join' ? 'bg-yellow-400 text-black' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Join Room
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="card">
              {tab === 'create' ? (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1.5">Room Name</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Interview Prep, Bug Fix Session..."
                      value={createForm.name}
                      onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1.5">Language</label>
                    <select
                      className="input-field"
                      value={createForm.language}
                      onChange={e => setCreateForm(f => ({ ...f, language: e.target.value }))}
                    >
                      {LANGUAGES.map(l => (
                        <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                    {loading ? 'Creating...' : '+ Create Room'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleJoin} className="space-y-4">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1.5">Room Code</label>
                    <input
                      type="text"
                      className="input-field font-mono tracking-widest uppercase text-lg"
                      placeholder="ABC123"
                      value={joinCode}
                      onChange={e => setJoinCode(e.target.value.toUpperCase())}
                      required
                      maxLength={10}
                    />
                    <p className="text-slate-500 text-xs mt-1.5">Enter an edit code (to code) or view code (read-only)</p>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                    {loading ? 'Joining...' : 'Join Room →'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right - Recent Rooms */}
          <div>
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Your Rooms</h2>
            {rooms.length === 0 ? (
              <div className="card text-center py-10">
                <div className="text-4xl mb-3">🏠</div>
                <p className="text-slate-400 text-sm">No rooms yet. Create your first one!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {rooms.map(room => (
                  <div key={room.id} className="card hover:border-accent-primary/40 transition-all cursor-pointer group" onClick={() => enterRoom(room)}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-100 truncate group-hover:text-accent-primary transition-colors">{room.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-xs font-mono ${LANG_COLORS[room.language] || 'text-slate-400'}`}>{room.language}</span>
                          <span className="text-xs text-slate-500">{new Date(room.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => { e.stopPropagation(); copyToClipboard(room.room_code) }}
                          className="text-xs bg-dark-600 hover:bg-accent-primary/20 text-slate-400 hover:text-accent-primary px-2 py-1 rounded font-mono transition-all"
                          title="Copy edit code"
                        >
                          {room.room_code}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setShareModal(room) }}
                          className="text-xs bg-dark-600 hover:bg-dark-500 text-slate-400 px-2 py-1 rounded transition-all"
                        >
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {shareModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={() => setShareModal(null)}>
          <div className="card max-w-md w-full fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Share Room</h3>
              <button onClick={() => setShareModal(null)} className="text-slate-500 hover:text-slate-200 text-xl">×</button>
            </div>
            <p className="text-slate-400 text-sm mb-4">Share these codes to invite collaborators to <span className="text-slate-200 font-medium">"{shareModal.name}"</span></p>

            <div className="space-y-3">
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-accent-green font-medium uppercase tracking-wide">Edit Code</span>
                  <span className="text-xs text-slate-500">Full access — can edit & run</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-bold tracking-widest text-slate-100">{shareModal.room_code}</span>
                  <button onClick={() => copyToClipboard(shareModal.room_code)} className="btn-primary text-xs px-3 py-1.5">Copy</button>
                </div>
              </div>

              <div className="bg-dark-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-accent-yellow font-medium uppercase tracking-wide">View Code</span>
                  <span className="text-xs text-slate-500">Read-only — can chat, watch live</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-bold tracking-widest text-slate-100">{shareModal.view_code}</span>
                  <button onClick={() => copyToClipboard(shareModal.view_code)} className="btn-secondary text-xs px-3 py-1.5">Copy</button>
                </div>
              </div>
            </div>

            <button onClick={() => { setShareModal(null); enterRoom(shareModal) }} className="btn-primary w-full py-3 mt-5">
              Enter Room →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
