import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'
import { formatUsername } from '../utils/format'
import usePageMeta from '../hooks/usePageMeta'

export default function Landing() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  usePageMeta({
    title: 'CodeCollab — Real-time Collaborative Code Editor',
    description: 'Collaborate, edit, and run code live with developers worldwide. Multi-cursor editing, Yjs CRDT real-time sync, and compiler support for 60+ languages.',
    path: '/'
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.profile-dropdown-container')) {
        setProfileDropdownOpen(false)
      }
    }
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#0a0a0f] text-slate-100">
      
      {/* Lightweight CSS ambient backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/15 blur-[130px] rounded-full pointer-events-none" />

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen pointer-events-none">
        {/* Navbar */}
        <nav className="flex items-center justify-between px-8 py-5 pointer-events-auto border-b border-white/5 bg-black/20 backdrop-blur-md">
          <div className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            CodeCollab
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center relative profile-dropdown-container">
                  <button 
                    type="button"
                    aria-label="User profile menu"
                    className="flex items-center justify-center bg-white/5 w-10 h-10 rounded-full border border-white/10 shadow-lg relative z-20 cursor-pointer hover:border-purple-500/50 transition-colors focus:outline-none"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  >
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={`${user.username || 'User'} profile avatar`} className="w-8 h-8 rounded-full object-cover pointer-events-none" />
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
              </>
            ) : (
              <Link to="/login" className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-all hover:border-purple-500/50">
                Sign In
              </Link>
            )}
          </div>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 fade-in-up">
          <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold uppercase tracking-wider">
            ⚡ Real-time Collaborative Code Workspace
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-white mb-6 drop-shadow-xl max-w-4xl">
            Code together, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">in real time.</span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed">
            Multi-cursor editing, live CRDT synchronisation, and cloud compilation for 60+ programming languages.
          </p>

          <div className="flex items-center gap-4 flex-wrap justify-center relative z-20 pointer-events-auto">
            <button
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-base rounded-2xl transition-all shadow-xl shadow-purple-600/30 active:scale-95 flex items-center gap-3 border border-purple-400/30"
            >
              {user ? 'Open Dashboard →' : 'Start Coding Free →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
