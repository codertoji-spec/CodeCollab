import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DotGrid from '../components/DotGrid'
import WarpText from '../components/WarpText'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function SetupUsername() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user, setTokenUser } = useAuth()
  const [username, setUsername] = useState('')
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' })
  
  useEffect(() => {
    // If we have a user and they already set a name, we can pre-fill or just let them choose
    if (user?.username) {
      // The auto-generated one has an underscore and random string, but we can just leave it blank to force a choice
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });
    
    if (!username.trim()) {
      setStatusMessage({ type: 'error', text: 'Username cannot be empty' });
      return;
    }

    try {
      const token = params.get('token') || localStorage.getItem('cc_token');
      const res = await fetch(`${API}/auth/set-username`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ username: username.trim() })
      });
      const data = await res.json();
      
      if (res.ok) {
        if (token) {
          setTokenUser(token); // refresh context
        }
        navigate('/dashboard');
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to set username' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Network error' });
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <DotGrid
          dotSize={3}
          gap={24}
          baseColor="#333333"
          activeColor="#5227FF"
          proximity={150}
          shockRadius={250}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
        />
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 w-full h-full pointer-events-none">
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#5227FF]/20 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="w-full max-w-md pointer-events-auto relative">
          <div className="text-center -mb-8 fade-in-up flex flex-col items-center relative z-20 pointer-events-none">
            <div className="w-full flex justify-center pointer-events-auto" style={{ height: '160px', marginTop: '-20px' }}>
              <WarpText
                text="CHOOSE USERNAME"
                color="#cbd5e1"
                warpStrength={0.05}
                warpScale={1.5}
                speed={0.5}
                pointerInfluence={0.4}
                pointerStrength={0.3}
                refraction={0.015}
                ripple={true}
                fontSize={40}
                fontWeight={800}
                letterSpacing="0.15em"
                style={{ width: '100%', height: '100%', minHeight: '100px' }}
              />
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] fade-in-up relative overflow-hidden" style={{ animationDelay: '0.1s' }}>
            
            <div className="absolute inset-0 border border-white/5 rounded-3xl pointer-events-none"></div>

            <p className="text-sm text-slate-400 mb-6 text-center">
              Welcome to CodeCollab! Since you signed in with Google, please choose a username for your account.
            </p>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              
              {statusMessage.text && (
                <div className={`p-3 rounded-xl text-sm font-medium animate-in fade-in ${statusMessage.type === 'error' ? 'bg-red-500/10 text-red-300 border border-red-500/20' : 'bg-green-500/10 text-green-300 border border-green-500/20'}`}>
                  {statusMessage.text}
                </div>
              )}

              <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="cool_dev_99"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#5227FF]/60 focus:border-[#5227FF] transition-all duration-300"
                />
              </div>

              <button 
                type="submit"
                className="w-full mt-2 bg-gradient-to-r from-[#5227FF] to-[#8a2be2] hover:from-[#6b44ff] hover:to-[#9b4dff] text-white font-semibold py-3.5 rounded-xl shadow-[0_0_20px_rgba(82,39,255,0.4)] hover:shadow-[0_0_25px_rgba(82,39,255,0.6)] transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Complete Setup
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
