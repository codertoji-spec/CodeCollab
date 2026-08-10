import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import LiquidEther from '../components/LiquidEther'
import WarpText from '../components/WarpText'
import ShinyText from '../components/ShinyText'
import Carousel from '../components/Carousel'
import GooeyNav from '../components/GooeyNav'
import { FiFileText, FiHome, FiUsers, FiGlobe, FiPlus, FiLogIn, FiArrowRight, FiShield, FiTerminal, FiMoreVertical, FiCalendar, FiClock, FiZap, FiCode } from 'react-icons/fi'
import { formatUsername } from '../utils/format'
import { LANG_COLORS, LANG_THEME, getLangIcon } from '../utils/icons'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const LANGUAGES = ['javascript', 'python', 'cpp', 'java', 'typescript']

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
  const [activeDropdown, setActiveDropdown] = useState(null)
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

  const handleDeleteRoom = async (roomId) => {
    try {
      await axios.delete(`${API}/rooms/${roomId}`, authHeader())
      setRooms(rooms.filter(r => r.id !== roomId))
      setActiveDropdown(null)
    } catch (err) {
      console.error('Delete room error:', err)
      alert('Failed to delete room.')
    }
  }

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null)
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

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

          {/* Center Nav Items */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 bg-[#1A1625] px-4 py-2 rounded-[2rem] border border-white/5">
            <GooeyNav 
              items={[
                { label: "Dashboard", href: "/", icon: <FiHome className="w-4 h-4" /> },
                { label: "My Rooms", href: "/my-rooms", icon: <FiUsers className="w-4 h-4" /> }
              ]} 
              initialActiveIndex={0}
              particleCount={9}
            />
          </div>
          <div className="flex items-center gap-0">
            <div className="flex items-center justify-center bg-white/5 w-10 h-10 rounded-full border border-white/10 shadow-lg relative z-20">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner">
                  {formatUsername(user?.username)?.[0]?.toUpperCase()}
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
        <div className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-12 pointer-events-auto flex flex-col items-start">
          <div className="mb-12 text-left w-full">
            <h1 className="text-4xl md:text-4xl font-extrabold tracking-tight mb-2 text-white drop-shadow-md">
              Welcome back, {formatUsername(user?.username)}
            </h1>
            <p className="text-slate-400 text-lg">Create a workspace or continue coding with your team.</p>
          </div>

          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Column - Actions */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Tab Selector */}
              <div className="flex bg-[#121016] p-1.5 rounded-2xl shadow-inner border border-white/5">
                <button
                  onClick={() => { setTab('create'); setError('') }}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all duration-300 ${tab === 'create' ? 'bg-[#2D2342] text-[#A78BFA] shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  <FiPlus className="w-4 h-4" />
                  Create Room
                </button>
                <button
                  onClick={() => { setTab('join'); setError('') }}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all duration-300 ${tab === 'join' ? 'bg-[#2D2342] text-[#A78BFA] shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  <FiLogIn className="w-4 h-4" />
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
              <div className="bg-[#121016] border border-white/5 rounded-3xl p-8 shadow-2xl mt-2">
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
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-lg">
                          {getLangIcon(createForm.language)}
                        </div>
                        <select
                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none cursor-pointer"
                          value={createForm.language}
                          onChange={e => setCreateForm(f => ({ ...f, language: e.target.value }))}
                        >
                          {LANGUAGES.map(l => (
                            <option key={l} value={l} className="bg-dark-900 text-white">{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-[#6D28D9] text-white hover:bg-[#5B21B6] font-bold py-3.5 flex items-center justify-center gap-2 rounded-xl transition-all shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] mt-4">
                      {loading ? 'Initializing...' : 'Launch Workspace'}
                      <FiArrowRight className="w-4 h-4" />
                    </button>
                    <div className="flex items-center justify-center gap-2 mt-4 text-slate-500 text-xs">
                      <FiShield className="w-3.5 h-3.5" />
                      Your code. In real time. Together.
                    </div>
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
                    <button type="submit" disabled={loading} className="w-full bg-[#6D28D9] text-white hover:bg-[#5B21B6] font-bold py-3.5 flex items-center justify-center gap-2 rounded-xl transition-all shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] mt-4">
                      {loading ? 'Authenticating...' : 'Join Workspace'}
                      <FiArrowRight className="w-4 h-4" />
                    </button>
                    <div className="flex items-center justify-center gap-2 mt-4 text-slate-500 text-xs">
                      <FiShield className="w-3.5 h-3.5" />
                      Collaborate securely with your team.
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Right Column - Recent Rooms Cards */}
            <div className="lg:col-span-8 flex flex-col w-full h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Recent Rooms</h2>
                <button onClick={() => navigate('/my-rooms')} className="text-sm font-semibold text-[#A78BFA] hover:text-[#C4B5FD] flex items-center gap-1 transition-colors">
                  View all <FiArrowRight className="w-4 h-4" />
                </button>
              </div>

              {rooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rooms.slice(0, 3).map(room => {
                    const theme = LANG_THEME[room.language] || { bg: 'bg-slate-500/10', text: 'text-slate-400' };
                    return (
                    <div key={room.id} className="bg-[#121016] border border-white/5 rounded-3xl p-6 flex flex-col hover:border-white/10 transition-colors shadow-xl w-full">
                      
                      <div className="flex items-start justify-between mb-8">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme.bg} ${theme.text}`}>
                          {getLangIcon(room.language, "w-6 h-6")}
                        </div>
                        <div className="relative">
                          <button 
                            className="text-slate-500 hover:text-white transition-colors mt-1" 
                            onClick={e => { e.stopPropagation(); setActiveDropdown(activeDropdown === room.id ? null : room.id); }}
                          >
                            <FiMoreVertical className="w-5 h-5" />
                          </button>
                          
                          {activeDropdown === room.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-[#1A1625] border border-white/10 rounded-xl shadow-2xl py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setShareModal(room); setActiveDropdown(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                              >
                                Share Workspace
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }}
                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
                              >
                                Delete Room
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mb-8">
                        <h3 className="font-bold text-xl text-white truncate mb-4">{room.name}</h3>
                        <div className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold ${theme.bg} ${theme.text}`}>
                          {room.language.charAt(0).toUpperCase() + room.language.slice(1)}
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="flex items-center gap-5 text-xs text-slate-500 font-medium mb-6">
                          <div className="flex items-center gap-2">
                            <FiCalendar className="w-4 h-4" />
                            {new Date(room.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="flex items-center gap-2">
                            <FiClock className="w-4 h-4" />
                            {new Date(room.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                          </div>
                        </div>

                        <button onClick={() => enterRoom(room)} className="w-full py-3.5 bg-[#1a1a24] hover:bg-[#22222e] text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-3 transition-colors border border-white/5">
                          Open Room <FiArrowRight className="w-4 h-4 text-[#A78BFA]" />
                        </button>
                      </div>
                    </div>
                  )})}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-[#121016] border border-white/5 rounded-3xl p-12">
                  <div className="w-16 h-16 bg-[#2D2342] rounded-full flex items-center justify-center mb-4 text-[#A78BFA]">
                    <FiTerminal className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No active workspaces</h3>
                  <p className="text-slate-400 text-sm max-w-xs text-center">Create your first room on the left to start collaborating in real-time.</p>
                </div>
              )}
            </div>
          </div>

          {/* Pro Tip Banner */}
          <div className="w-full mt-10 bg-[#121016] border border-white/5 rounded-3xl p-8 flex items-center justify-between shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-14 h-14 bg-[#2D2342] rounded-full flex items-center justify-center text-[#A78BFA] shadow-inner shrink-0">
                <FiZap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Pro Tip</h3>
                <p className="text-slate-400 text-sm">Use rooms to collaborate in real-time, share code, and run it together. Happy coding!</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-4 relative z-10 text-slate-500 opacity-20 pointer-events-none">
              <FiCode className="w-24 h-24" />
            </div>
          </div>
          
          <footer className="w-full text-center py-8 text-slate-500 text-sm mt-auto">
            © 2026 CodeCollab. All rights reserved.
          </footer>
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
