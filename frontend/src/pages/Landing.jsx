import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ParticleText from '../components/ParticleText'
import WarpText from '../components/WarpText'
import GradientWaves from '../components/GradientWaves'
import SpecularButton from '../components/SpecularButton'
import { useAuth } from '../context/AuthContext'
import { formatUsername } from '../utils/format'
import usePageMeta from '../hooks/usePageMeta'
import { FiCode, FiZap, FiUsers, FiShield, FiTerminal } from 'react-icons/fi'

const hslToHex = (h, s, l) => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

export default function Landing() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [hue, setHue] = useState(0);
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

  useEffect(() => {
    let animationFrameId;
    const animate = () => {
      setHue(h => (h + 0.165) % 360); // Slowly loop RGB hues
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-dark-900">
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <GradientWaves
          horizonColor={hslToHex((hue + 40) % 360, 100, 50)}
          waveColor={hslToHex(hue, 100, 65)}
          crestColor="#FFFFFF"
          speed={0.4}
          amplitude={2.5}
          waveScale={0.6}
          waveRatio={0.9}
          swell={35}
          headCount={4}
          headWidth={3}
          headLength={4}
          crestFactor={1.2}
          tint="#000000"
          tintFactor={0.5}
          roughness={0.05}
          metallic={0.1}
          lightIntensity={1.0}
          lightColor="#FFFFFF"
          lightPosition={[0, 5, 10]}
          ambientIntensity={0.3}
          ambientColor="#FFFFFF"
          reflectionIntensity={0.2}
          refractionIndex={1.333}
          fadeSpeed={0.05}
          foamColor="#FFFFFF"
          foamIntensity={0.1}
          parallax={true}
          parallaxStrength={0.5}
          grain={true}
          grainIntensity={0.05}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen pointer-events-none">
        {/* Navbar */}
        <nav className="flex items-center justify-between px-6 md:px-12 py-5 pointer-events-auto">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400 group-hover:scale-105 transition-transform">
              <FiCode className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              Code<span className="text-yellow-400">Collab</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <FiTerminal className="w-4 h-4 text-yellow-400" />
                  Dashboard
                </Link>
                <div className="flex items-center relative profile-dropdown-container">
                  <button 
                    type="button"
                    aria-label="User profile menu"
                    className="flex items-center justify-center bg-white/5 w-10 h-10 rounded-full border border-white/10 shadow-lg relative z-20 cursor-pointer hover:border-purple-500/50 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
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
              <Link to="/login" className="relative block" style={{ width: '120px', height: '50px' }}>
                <WarpText
                  text="Sign In"
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
              </Link>
            )}
          </div>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 fade-in-up">
          <div className="mb-6 drop-shadow-2xl pointer-events-auto" style={{ width: '100%', maxWidth: '800px', height: '160px' }}>
            <ParticleText
              text="CODECOLLAB"
              particleSize={4}
              density={4}
              color={hslToHex((hue + 180) % 360, 100, 85)}
              highlightColor={hslToHex((hue + 220) % 360, 100, 60)}
              scatter={180}
              gatherDuration={2000}
              stagger={180}
              pointerRepel={48}
              repelRadius={220}
              idleDrift={0.3}
              trigger="hover"
              fontSize="clamp(3rem, 12vw, 8rem)"
              fontWeight={900}
              fontFamily="inherit"
              glow={true}
            />
          </div>

          <h1 className="sr-only">CodeCollab — Real-time Collaborative Code Editor</h1>

          <p className="text-base md:text-xl text-slate-300 max-w-xl mx-auto mb-8 pointer-events-auto leading-relaxed">
            Code simultaneously with your team, see live cursors, discuss ideas in real-time, and run code instantly in 60+ languages.
          </p>

          <div className="flex items-center gap-4 flex-wrap justify-center relative z-20 pointer-events-auto mb-12">
            <SpecularButton
              size="lg"
              radius={18}
              tint="#ffffff"
              tintOpacity={0}
              blur={0}
              textColor="#f5f5f5"
              lineColor="#ffffff"
              baseColor="#525252"
              intensity={1}
              shineSize={10}
              shineFade={40}
              thickness={1}
              speed={0.35}
              followMouse={true}
              proximity={250}
              autoAnimate={false}
              onClick={() => navigate(user ? '/dashboard' : '/login')}
            >
              {user ? 'Open Dashboard →' : 'Start Coding Free →'}
            </SpecularButton>
          </div>

          {/* Value Props Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full pointer-events-auto text-left">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-2 text-yellow-400 font-semibold text-sm mb-1">
                <FiZap className="w-4 h-4" /> Real-Time CRDT
              </div>
              <p className="text-xs text-slate-400">Conflict-free simultaneous editing powered by Yjs and binary WebSockets.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm mb-1">
                <FiTerminal className="w-4 h-4" /> 60+ Compilers
              </div>
              <p className="text-xs text-slate-400">Run C++, Python, Rust, JavaScript, Go, and 55+ other languages instantly.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm mb-1">
                <FiUsers className="w-4 h-4" /> Role Security
              </div>
              <p className="text-xs text-slate-400">Granular Editor & Viewer access codes, snapshot versioning, and secure rooms.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 py-6 px-6 pointer-events-auto">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © 2026 CodeCollab. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="hover:text-slate-300 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/login" className="hover:text-slate-300 transition-colors">
                Sign In
              </Link>
              <a
                href="https://github.com/codertoji-spec/CodeCollab"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-300 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
