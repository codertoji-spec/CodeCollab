import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useSecret } from '../context/SecretContext'
import { FiHome, FiUsers, FiArrowRight, FiMoreVertical, FiCalendar, FiClock, FiTerminal, FiEdit2 } from 'react-icons/fi'
import { formatUsername } from '../utils/format'
import { LANG_COLORS, LANG_THEME, getLangIcon } from '../utils/icons'
import { getLangDisplay } from '../utils/languages'
import usePageMeta from '../hooks/usePageMeta'
import { Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('cc_token')}` }
})

export default function MyRooms() {
  const { user, logout } = useAuth()
  const { isUnlocked } = useSecret()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isUnlocked) {
      navigate('/dashboard', { replace: true })
    }
  }, [isUnlocked, navigate])

  usePageMeta({
    title: 'My Workspaces',
    description: 'View and manage all your past and active collaborative coding workspaces.',
    path: '/my-rooms',
    noindex: true
  });
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [shareModal, setShareModal] = useState(null)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [renameModal, setRenameModal] = useState(null) // room object
  const [renameName, setRenameName] = useState('')
  const [renameLoading, setRenameLoading] = useState(false)
  const [renameError, setRenameError] = useState('')

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API}/rooms/list`, authHeader())
      setRooms(res.data.rooms || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const enterRoom = (room) => {
    navigate(`/room/${room.id}`, { state: { room } })
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const openRenameModal = (room) => {
    setRenameModal(room)
    setRenameName(room.name)
    setRenameError('')
    setActiveDropdown(null)
  }

  const handleRenameSubmit = async (e) => {
    e.preventDefault()
    if (!renameName.trim()) {
      setRenameError('Room name is required')
      return
    }
    setRenameLoading(true)
    setRenameError('')
    try {
      const res = await axios.patch(`${API}/rooms/${renameModal.id}`, { name: renameName.trim() }, authHeader())
      const updatedRoom = res.data.room
      setRooms(rooms.map(r => r.id === renameModal.id ? { ...r, name: updatedRoom.name } : r))
      setRenameModal(null)
    } catch (err) {
      setRenameError(err.response?.data?.error || 'Failed to rename room')
    } finally {
      setRenameLoading(false)
    }
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
    const handleClickOutside = (e) => {
      if (!e.target.closest('.profile-dropdown-container')) {
        setProfileDropdownOpen(false)
      }
      setActiveDropdown(null)
    }
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen bg-[#0f0f13] flex flex-col relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full flex-1 pointer-events-none">
        
        {/* Navbar */}
        <nav className="flex items-center justify-between px-6 py-4 bg-black/30 backdrop-blur-md border-b border-white/5 pointer-events-auto">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-2xl font-extrabold tracking-tight text-white hover:text-purple-400 transition-colors">
              CodeCollab
            </span>
          </div>

          {/* Center Nav Items */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 bg-[#1A1625] px-4 py-2 rounded-[2rem] border border-white/5">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <FiHome className="w-3.5 h-3.5" />
              Dashboard
            </Link>
            {isUnlocked && (
              <Link
                to="/my-rooms"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-600 text-white shadow-sm transition-all"
              >
                <FiUsers className="w-3.5 h-3.5" />
                My Rooms
              </Link>
            )}
          </div>

          <div className="flex items-center relative profile-dropdown-container">
            <button 
              type="button"
              aria-label="User profile menu"
              className="flex items-center justify-center bg-white/5 w-10 h-10 rounded-full border border-white/10 shadow-lg relative z-20 cursor-pointer hover:border-purple-500/50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={`${user.username || 'User'} avatar`} className="w-8 h-8 rounded-full object-cover pointer-events-none" />
              ) : (
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner pointer-events-none">
                  {formatUsername(user?.username)?.[0]?.toUpperCase()}
                </div>
              )}
            </button>
            
            {profileDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-[#1A1625] border border-white/10 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-white/5 mb-1">
                  <p className="text-sm text-white font-medium truncate">{user?.username}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); logout(); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-12 pointer-events-auto flex flex-col">
          <div className="mb-10 text-left w-full flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-white drop-shadow-md">
                My Rooms
              </h1>
              <p className="text-slate-400 text-lg">Browse your entire workspace history.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-[#A78BFA] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : rooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
              {rooms.map(room => {
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
                              onClick={(e) => { e.stopPropagation(); openRenameModal(room); }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                            >
                              <FiEdit2 className="w-4 h-4 text-purple-400" />
                              Rename Room
                            </button>
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
                      <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold ${theme.bg} ${theme.text}`}>
                        {getLangIcon(room.language, "w-3.5 h-3.5")}
                        {getLangDisplay(room.language)}
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium mb-6">
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
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 min-h-[300px] bg-[#121016] border border-white/5 rounded-3xl p-12">
              <div className="w-16 h-16 bg-[#2D2342] rounded-full flex items-center justify-center mb-4 text-[#A78BFA]">
                <FiTerminal className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No active workspaces</h3>
              <p className="text-slate-400 text-sm max-w-xs text-center">Go to your Dashboard and create your first room to start collaborating in real-time.</p>
              <button onClick={() => navigate('/dashboard')} className="mt-6 px-6 py-3 bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold rounded-xl flex items-center gap-2">
                Back to Dashboard
              </button>
            </div>
          )}
          
          <footer className="w-full text-center py-8 text-slate-500 text-sm mt-auto flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5">
            <div>© 2026 CodeCollab. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
              <Link to="/" className="hover:text-slate-300 transition-colors">Home</Link>
            </div>
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
                type="button"
                aria-label="Close share workspace dialog"
                onClick={() => setShareModal(null)} 
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
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

      {/* Glassmorphic Rename Modal */}
      {renameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
          {/* Modal Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => !renameLoading && setRenameModal(null)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-[#0f0f13]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_-12px_rgba(139,92,246,0.3)] animate-in fade-in zoom-in-95 duration-200 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <FiEdit2 className="w-5 h-5 text-purple-400" />
                Rename Room
              </h3>
              <button 
                type="button"
                aria-label="Close rename dialog"
                disabled={renameLoading}
                onClick={() => setRenameModal(null)} 
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  placeholder="Enter workspace name..."
                  autoFocus
                  disabled={renameLoading}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                />
              </div>

              {renameError && (
                <p className="text-red-400 text-xs">{renameError}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  disabled={renameLoading}
                  onClick={() => setRenameModal(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renameLoading || !renameName.trim()}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-purple-600/30 active:scale-95 flex items-center gap-2"
                >
                  {renameLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
