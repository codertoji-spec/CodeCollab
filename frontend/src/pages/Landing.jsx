
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
    </div>
  )
}
