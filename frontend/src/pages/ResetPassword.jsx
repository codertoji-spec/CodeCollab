import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import DotGrid from '../components/DotGrid';
import WarpText from '../components/WarpText';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });

    if (!token) {
      setStatusMessage({ type: 'error', text: 'Invalid or missing reset token.' });
      return;
    }

    if (password !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (password.length < 6) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });
      const data = await res.json();
      
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Password reset successfully!' });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to reset password.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Network error. Please try again later.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-black">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <DotGrid
          color="#333"
          size={2}
          spacing={25}
          glowColor="#5227FF"
          glowRadius={150}
          glowOpacity={0.4}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 w-full h-full pointer-events-none">
        
        {/* Main Card */}
        <div className="w-full max-w-md fade-in-up pointer-events-auto">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-[#5227FF] rounded-xl flex items-center justify-center">
                <span className="text-white font-mono font-bold">CC</span>
              </div>
              <span className="font-bold text-xl text-white">CodeCollab</span>
            </Link>
            <div className="mb-2" style={{ width: '100%', height: '50px' }}>
              <WarpText 
                text="Reset Password"
                color="#ffffff"
                warpStrength={0.05}
                warpScale={1.5}
                speed={0.4}
                pointerInfluence={0.3}
                pointerStrength={0.2}
                refraction={0.02}
                ripple={true}
                fontSize="1.8rem"
                fontWeight={700}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            <p className="text-slate-400 text-sm mt-1">Enter your new password below</p>
          </div>

          <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] p-8 rounded-2xl shadow-2xl relative overflow-hidden">
            {/* Soft decorative glow behind the form */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-[#5227FF]/10 blur-[60px] pointer-events-none" />

            <div className="relative z-10">
              {statusMessage.text && (
                <div className={`border rounded-lg px-4 py-3 text-sm mb-6 ${
                  statusMessage.type === 'error' 
                    ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                    : 'bg-green-500/10 border-green-500/30 text-green-400'
                }`}>
                  {statusMessage.text}
                </div>
              )}

              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-dark-900/50 border border-dark-600 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#5227FF] focus:ring-1 focus:ring-[#5227FF] transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-dark-900/50 border border-dark-600 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#5227FF] focus:ring-1 focus:ring-[#5227FF] transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#5227FF] hover:bg-[#431ce0] text-white font-medium py-3 rounded-lg transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Resetting...' : 'Update Password'}
                </button>
              </form>

              <div className="mt-8 text-center">
                <Link to="/login" className="text-sm text-[#5227FF] hover:text-[#FF9FFC] font-semibold transition-colors">
                  Return to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
