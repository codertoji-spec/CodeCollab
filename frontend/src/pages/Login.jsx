import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DotGrid from '../components/DotGrid'
import WarpText from '../components/WarpText'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'



import { useState, useEffect } from 'react'

export default function Login() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [view, setView] = useState('login') // 'login', 'signup', 'forgot', 'otp'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [otp, setOtp] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' })
  const [runtimeError, setRuntimeError] = useState('')

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });
    
    if (view === 'login') {
      try {
        await login(email, password);
        navigate('/dashboard');
      } catch (err) {
        if (err.response?.data?.requireOtp) {
          setView('otp');
          setStatusMessage({ type: 'error', text: 'Please verify your email to continue.' });
        } else {
          setStatusMessage({ type: 'error', text: err.response?.data?.error || 'Login failed' });
        }
      }
    } else if (view === 'signup') {
      try {
        const res = await fetch(`${API}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        
        if (res.ok && data.requireOtp) {
           setView('otp');
           setStatusMessage({ type: 'success', text: data.message || 'OTP sent to your email.' });
           setResendTimer(60);
        } else if (res.ok) {
           // fallback for existing logic
           await login(email, password);
           navigate('/dashboard');
        } else {
           setStatusMessage({ type: 'error', text: data.error || 'Signup failed' });
        }
      } catch (err) {
        setStatusMessage({ type: 'error', text: 'Signup failed' });
      }
    } else if (view === 'otp') {
      try {
        const res = await fetch(`${API}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('token', data.token);
          // Small hack to reload the AuthContext with the new token
          window.location.href = '/dashboard';
        } else {
          setStatusMessage({ type: 'error', text: data.error || 'Verification failed' });
        }
      } catch (err) {
        setStatusMessage({ type: 'error', text: 'Network error' });
      }
    } else if (view === 'forgot') {
      try {
        const res = await fetch(`${API}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) {
          setStatusMessage({ type: 'success', text: data.message || 'Reset link sent to your email.' });
        } else {
          setStatusMessage({ type: 'error', text: data.error || 'Failed to send reset link' });
        }
      } catch (err) {
        setStatusMessage({ type: 'error', text: 'Network error' });
      }
    }
  }

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setStatusMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'A new OTP has been sent to your email.' });
        setResendTimer(60);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to resend OTP' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Network error' });
    }
  }

  useEffect(() => {
    // Debugging listener can remain or be removed, keeping it simple:
  }, [])

  const error = params.get('error') ? 'Google sign-in failed. Try again.' : ''

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

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 w-full h-full pointer-events-none">
        
        {/* Glow behind the glass */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#5227FF]/20 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="w-full max-w-md pointer-events-auto relative">
          {/* Logo & Header */}
          <div className="text-center -mb-8 fade-in-up flex flex-col items-center relative z-20 pointer-events-none">
            <div className="w-full flex justify-center pointer-events-auto" style={{ height: '160px', marginTop: '-20px' }}>
              <WarpText
                text={view === 'login' ? 'WELCOME BACK' : view === 'signup' ? 'CREATE ACCOUNT' : view === 'otp' ? 'VERIFY EMAIL' : 'RESET PASSWORD'}
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

          {/* Glassmorphic Card */}
          <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] fade-in-up relative overflow-hidden" style={{ animationDelay: '0.1s' }}>
            
            {/* Subtle inner highlight for the glass edge */}
            <div className="absolute inset-0 border border-white/5 rounded-3xl pointer-events-none"></div>

            {/* JWT / Email Form */}
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              
              {statusMessage.text && (
                <div className={`p-3 rounded-xl text-sm font-medium animate-in fade-in ${statusMessage.type === 'error' ? 'bg-red-500/10 text-red-300 border border-red-500/20' : 'bg-green-500/10 text-green-300 border border-green-500/20'}`}>
                  {statusMessage.text}
                </div>
              )}

              {view === 'signup' && (
                <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#5227FF]/60 focus:border-[#5227FF] transition-all duration-300"
                  />
                </div>
              )}

              {view === 'otp' ? (
                <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Verification Code</label>
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#5227FF]/60 focus:border-[#5227FF] transition-all duration-300 tracking-widest text-center text-xl"
                    maxLength={6}
                  />
                  <div className="flex justify-end mt-1">
                    <button 
                      type="button" 
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0}
                      className={`text-xs ${resendTimer > 0 ? 'text-slate-500' : 'text-[#5227FF] hover:text-[#FF9FFC]'} transition-colors`}
                    >
                      {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#5227FF]/60 focus:border-[#5227FF] transition-all duration-300"
                  />
                </div>
              )}

              {view !== 'forgot' && view !== 'otp' && (
                <div className="flex flex-col gap-1.5 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
                    {view === 'login' && (
                      <button type="button" onClick={() => { setView('forgot'); setStatusMessage({type: '', text: ''}); }} className="text-xs text-[#5227FF] hover:text-[#FF9FFC] transition-colors">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#5227FF]/60 focus:border-[#5227FF] transition-all duration-300"
                  />
                </div>
              )}

              <button 
                type="submit"
                className="w-full mt-2 bg-gradient-to-r from-[#5227FF] to-[#8a2be2] hover:from-[#6b44ff] hover:to-[#9b4dff] text-white font-semibold py-3.5 rounded-xl shadow-[0_0_20px_rgba(82,39,255,0.4)] hover:shadow-[0_0_25px_rgba(82,39,255,0.6)] transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {view === 'login' ? 'Sign In' : view === 'signup' ? 'Create Account' : view === 'otp' ? 'Verify Email' : 'Send Reset Link'}
              </button>
            </form>

            {view !== 'forgot' && view !== 'otp' && (
              <>
                <div className="flex items-center gap-3 my-6 animate-in fade-in duration-300">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10"></div>
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-widest">Or</span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10"></div>
                </div>

                <a
                  href={`${API}/auth/google`}
                  className="w-full group flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 animate-in fade-in duration-300"
                >
                  <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-slate-200 font-medium text-sm">Continue with Google</span>
                </a>
              </>
            )}
            
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-400">
                {view === 'login' && (
                  <>
                    Don't have an account?{' '}
                    <button onClick={() => { setView('signup'); setStatusMessage({type: '', text: ''}); }} className="text-[#5227FF] hover:text-[#FF9FFC] font-semibold transition-colors">
                      Sign up
                    </button>
                  </>
                )}
                {view === 'signup' && (
                  <>
                    Already have an account?{' '}
                    <button onClick={() => { setView('login'); setStatusMessage({type: '', text: ''}); }} className="text-[#5227FF] hover:text-[#FF9FFC] font-semibold transition-colors">
                      Sign in
                    </button>
                  </>
                )}
                {view === 'forgot' && (
                  <>
                    Remembered your password?{' '}
                    <button onClick={() => { setView('login'); setStatusMessage({type: '', text: ''}); }} className="text-[#5227FF] hover:text-[#FF9FFC] font-semibold transition-colors">
                      Back to sign in
                    </button>
                  </>
                )}
                {view === 'otp' && (
                  <>
                    Incorrect email?{' '}
                    <button onClick={() => { setView('signup'); setStatusMessage({type: '', text: ''}); }} className="text-[#5227FF] hover:text-[#FF9FFC] font-semibold transition-colors">
                      Back to sign up
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
