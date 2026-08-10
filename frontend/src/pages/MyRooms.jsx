import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import ShinyText from '../components/ShinyText'
import WarpText from '../components/WarpText'
import { FiHome, FiUsers, FiArrowRight, FiMoreVertical, FiCalendar, FiClock, FiTerminal } from 'react-icons/fi'
import { formatUsername } from '../utils/format'
import { LANG_COLORS, LANG_THEME, getLangIcon } from '../utils/icons'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('cc_token')}` }
})

export default function MyRooms() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

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
    navigate(`/room/${room.id}`, { state: { roomId: room.id, username: user.username, language: room.language } })
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] flex flex-col relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full flex-1 pointer-events-none">
        
        {/* Navbar */}
        <nav className="flex items-center justify-between px-6 py-4 bg-black/30 backdrop-blur-md border-b border-white/5 pointer-events-auto">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <ShinyText
              text="CodeCollab"
              speed={2.5}
              color="#b5b5b5"
              shineColor="#ffffff"
              className="text-2xl font-extrabold tracking-tight cursor-default"
            />
          </div>

          {/* Center Nav Items */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 bg-[#1A1625] px-2 py-1.5 rounded-2xl border border-white/5">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl font-medium text-sm transition-all">
              <FiHome className="w-4 h-4" />
              Dashboard
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#2D2342] text-[#A78BFA] rounded-xl font-medium text-sm transition-all shadow-inner">
              <FiUsers className="w-4 h-4" />
              My Rooms
            </button>
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
                      <button className="text-slate-500 hover:text-white transition-colors mt-1" onClick={e => { e.stopPropagation(); /* TODO: share modal if needed */ }}>
                        <FiMoreVertical className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="mb-8">
                      <h3 className="font-bold text-xl text-white truncate mb-4">{room.name}</h3>
                      <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold ${theme.bg} ${theme.text}`}>
                        {getLangIcon(room.language, "w-3.5 h-3.5")}
                        {room.language.charAt(0).toUpperCase() + room.language.slice(1)}
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
              <button onClick={() => navigate('/')} className="mt-6 px-6 py-3 bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold rounded-xl flex items-center gap-2">
                Back to Dashboard
              </button>
            </div>
          )}
          
          <footer className="w-full text-center py-8 text-slate-500 text-sm mt-auto">
            © 2026 CodeCollab. All rights reserved.
          </footer>
        </div>
      </div>
    </div>
  )
}
