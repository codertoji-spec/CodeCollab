<<<<<<< HEAD
import { Link, useNavigate } from 'react-router-dom'
import ParticleText from '../components/ParticleText'
import WarpText from '../components/WarpText'
import GradientWaves from '../components/GradientWaves'
import SpecularButton from '../components/SpecularButton'

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-dark-900">
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <GradientWaves
          horizonColor="#5227FF"
          waveColor="#FF9FFC"
          crestColor="#FFFFFF"
          speed={0.4}
          amplitude={2.5}
          waveScale={0.6}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={1.11}
          zoom={1.0}
          height={5.5}
          fogDepth={15}
          detail="medium"
          brightness={1.0}
          opacity={1.0}
          mouseInteraction={true}
          parallaxStrength={0.5}
          grain={true}
          grainIntensity={0.05}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen pointer-events-none">
        {/* Navbar */}
        <nav className="flex items-center justify-end px-8 py-5 pointer-events-auto">
          <div className="flex items-center gap-3">
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
          </div>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 fade-in-up">
          <div className="mb-8 drop-shadow-2xl pointer-events-auto" style={{ width: '100%', maxWidth: '800px', height: '160px' }}>
            <ParticleText
              text="CODECOLLAB"
              particleSize={4}
              density={4}
              color="#f8fafc"
              highlightColor="#42fcff"
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

          <div className="flex items-center gap-4 flex-wrap justify-center relative z-20 pointer-events-auto">
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
              onClick={() => navigate('/login')}
            >
              Start Coding Free →
            </SpecularButton>
          </div>
        </div>
      </div>
=======
import { Link } from 'react-router-dom'

const Feature = ({ icon, title, desc }) => (
  <div className="card hover:border-accent-primary/50 transition-all duration-300 hover:-translate-y-1">
    <div className="text-3xl mb-3">{icon}</div>
    <h3 className="font-semibold text-slate-100 mb-1">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
  </div>
)

export default function Landing() {
  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 glass-nav">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-mono font-bold text-sm">CC</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">CodeCollab</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-primary text-sm px-4 py-2">Sign In</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 fade-in-up">
        <div className="inline-flex items-center gap-2 bg-accent-primary/10 border border-accent-primary/30 rounded-full px-4 py-1.5 text-accent-primary text-sm font-medium mb-8">
          <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
          Real-time Collaboration
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          Code Together,{' '}
          <span className="bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
            Instantly
          </span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          VS Code meets Google Docs. Real-time collaborative editing, live code execution,
          cursor presence, and integrated chat — all in your browser.
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link to="/login" className="btn-primary px-8 py-3 text-base glow">
            Start Coding Free →
          </Link>
        </div>

        {/* Code preview pill */}
        <div className="mt-16 bg-dark-800 border border-dark-600 rounded-xl p-4 font-mono text-sm text-left max-w-lg w-full">
          <div className="flex gap-1.5 mb-3">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <div className="space-y-1 text-xs">
            <div><span className="text-accent-secondary">const</span> <span className="text-accent-green">collab</span> <span className="text-slate-400">=</span> <span className="text-accent-primary">new</span> <span className="text-yellow-400">CodeCollab</span><span className="text-slate-400">()</span></div>
            <div><span className="text-accent-green">collab</span><span className="text-slate-400">.</span><span className="text-blue-400">invite</span><span className="text-slate-400">(</span><span className="text-orange-400">'your-team'</span><span className="text-slate-400">)</span></div>
            <div><span className="text-accent-green">collab</span><span className="text-slate-400">.</span><span className="text-blue-400">run</span><span className="text-slate-400">() </span><span className="text-slate-600">// ✓ executed for everyone</span></div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-8 pb-20 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Feature icon="⚡" title="Real-time Sync" desc="Changes sync across all users in under 100ms via WebSockets. See cursors, selections, and edits live." />
          <Feature icon="▶️" title="Live Execution" desc="Run code in 4 languages instantly. Output broadcasts to everyone in the room simultaneously." />
          <Feature icon="🔗" title="Edit & View Links" desc="Separate editor and viewer access codes. Perfect for demos, code reviews, and pair programming." />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-dark-700 py-6 text-center text-slate-500 text-sm">
        Built with React · Node.js · Socket.io · Monaco Editor
      </div>
>>>>>>> e018e483c5587b47b9dd4274b3475e931c259f59
    </div>
  )
}
