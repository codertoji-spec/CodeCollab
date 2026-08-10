import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import LiquidEther from '../components/LiquidEther'
import WarpText from '../components/WarpText'
import ShinyText from '../components/ShinyText'
import Carousel from '../components/Carousel'
import { FiCode, FiTerminal, FiHash, FiFileText } from 'react-icons/fi'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const LANGUAGES = ['javascript', 'python', 'cpp', 'typescript']

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
  const [shareModal, setShareModal] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-black text-slate-100">
      
      {/* Background LiquidEther */}
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-auto">
        <LiquidEther
          colors={['#1e1b4b', '#4c1d95', '#3b0764']}
          mouseForce={25}
          cursorSize={150}
          isViscous={true}
          viscous={20}
          autoDemo={true}
          autoSpeed={0.4}
          resolution={0.5}
        />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col h-full flex-1 pointer-events-none">
        
        {/* Navbar */}
        <nav className="flex items-center justify-between px-6 py-4 bg-black/30 backdrop-blur-md border-b border-white/5 pointer-events-auto">
          <div className="flex items-center gap-3">
            <ShinyText
              text="CodeCollab"
              speed={2.5}
              color="#b5b5b5"
              shineColor="#ffffff"
              className="text-2xl font-extrabold tracking-tight cursor-default"
            />
          </div>
          <div className="flex items-center gap-0">
            <div className="flex items-center justify-center bg-white/5 w-10 h-10 rounded-full border border-white/10 shadow-lg relative z-20">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <button onClick={logout} className="relative block cursor-pointer active:scale-95 transition-transform -ml-4 z-10" style={{ width: '100px', height: '50px' }}>
              <WarpText
                text="Sign Out"
                color="#ffffff"
                warpStrength={0.08}
                warpScale={1.7}
                speed={0.55}
                pointerInfluence={0.42}
                pointerStrength={0.38}
                refraction={0.018}
                ripple={true}
                fontSize="1.1rem"
                fontWeight={700}
                style={{ width: '100%', height: '100%', minHeight: 'auto' }}
              />
            </button>
          </div>
        </nav>

        {/* Dashboard Content */}
        <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 pointer-events-auto flex flex-col items-center">
          <div className="mb-12 text-center md:text-left w-full max-w-md">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-white drop-shadow-md text-center">
              Dashboard
            </h1>
            <p className="text-slate-400 text-lg text-center">Create a new workspace or jump back into a session.</p>
          </div>

          <div className="flex flex-col items-center w-full">
            
            {/* Center Column - Actions */}
            <div className="w-full max-w-md flex flex-col gap-6 mb-16">
              
              {/* Tab Selector */}
              <div className="flex bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl">
                <button
                  onClick={() => { setTab('create'); setError('') }}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${tab === 'create' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-purple-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  Create Room
                </button>
                <button
                  onClick={() => { setTab('join'); setError('') }}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${tab === 'join' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-purple-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  Join Room
                </button>
              </div>

              {error && (
                <div className="bg-red-500/10 backdrop-blur-md border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Action Card */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                {tab === 'create' ? (
                  <form onSubmit={handleCreate} className="space-y-5">
                    <div>
                      <label className="block text-slate-300 text-sm font-semibold mb-2">Room Name</label>
                      <input
                        type="text"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                        placeholder="e.g. System Architecture..."
                        value={createForm.name}
                        onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                        required
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-semibold mb-2">Primary Language</label>
                      <select
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none cursor-pointer"
                        value={createForm.language}
                        onChange={e => setCreateForm(f => ({ ...f, language: e.target.value }))}
                      >
                        {LANGUAGES.map(l => (
                          <option key={l} value={l} className="bg-dark-900 text-white">{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-slate-200 font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-white/20 active:scale-[0.98] mt-2">
                      {loading ? 'Initializing...' : 'Launch Workspace'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleJoin} className="space-y-5">
                    <div>
                      <label className="block text-slate-300 text-sm font-semibold mb-2">Room Access Code</label>
                      <input
                        type="text"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono tracking-[0.2em] uppercase text-xl text-center"
                        placeholder="XXXXXX"
                        value={joinCode}
                        onChange={e => setJoinCode(e.target.value.toUpperCase())}
                        required
                        maxLength={10}
                      />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-slate-200 font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-white/20 active:scale-[0.98] mt-2">
                      {loading ? 'Authenticating...' : 'Join Workspace'}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Carousel Recent Rooms */}
            {rooms.length > 0 && (
              <div className="w-full flex flex-col items-center mt-4">
                <h2 className="text-2xl font-bold text-white mb-6">Your Recent Rooms</h2>
                <Carousel
                  baseWidth={320}
                  autoplay={true}
                  autoplayDelay={3000}
                  pauseOnHover={true}
                  loop={rooms.length > 1}
                  round={false}
                  items={rooms.map(room => ({
                    id: room.id,
                    title: room.name,
                    description: `Language: ${room.language.charAt(0).toUpperCase() + room.language.slice(1)}\nCreated: ${new Date(room.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
                    icon: room.language === 'python' ? <FiHash className="carousel-icon text-blue-400" /> 
                        : room.language === 'cpp' ? <FiTerminal className="carousel-icon text-purple-400" />
                        : room.language === 'javascript' ? <FiCode className="carousel-icon text-yellow-400" />
                        : <FiFileText className="carousel-icon text-slate-300" />,
                    onClick: () => enterRoom(room)
                  }))}
                />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Glassmorphic Share Modal */}
      {shareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
          {/* Modal Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setShareModal(null)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-[#0f0f13]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_-12px_rgba(139,92,246,0.3)] animate-in fade-in zoom-in-95 duration-200 mx-4">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-white">Share Workspace</h3>
              <button 
                onClick={() => setShareModal(null)} 
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <p className="text-slate-400 text-sm mb-6">
              Invite collaborators to <span className="text-white font-semibold">"{shareModal.name}"</span>. 
            </p>

            <div className="space-y-4">
              {/* Edit Code Card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Editor Access</span>
                  <span className="text-xs text-slate-500">Can write and execute</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-mono text-3xl font-black tracking-[0.15em] text-white">
                    {shareModal.room_code}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(shareModal.room_code)} 
                    className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* View Code Card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Viewer Access</span>
                  <span className="text-xs text-slate-500">Read-only live view</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-mono text-3xl font-black tracking-[0.15em] text-white">
                    {shareModal.view_code}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(shareModal.view_code)} 
                    className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={() => { setShareModal(null); enterRoom(shareModal) }} 
              className="w-full bg-white text-black hover:bg-slate-200 font-bold py-4 rounded-xl mt-8 transition-all shadow-xl active:scale-[0.98]"
            >
              Enter Workspace →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
