import { Link } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import { FiHome, FiAlertTriangle, FiArrowRight } from 'react-icons/fi';

export default function NotFound() {
  usePageMeta({
    title: 'Page Not Found',
    description: 'The requested page could not be found on CodeCollab.',
    noindex: true
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black text-slate-100 px-4">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#5227FF]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-yellow-400/10 border border-yellow-400/20 rounded-3xl flex items-center justify-center text-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.2)]">
          <FiAlertTriangle className="w-10 h-10" />
        </div>

        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-3">
          404
        </h1>
        <h2 className="text-xl md:text-2xl font-bold text-slate-200 mb-4">
          Workspace Not Found
        </h2>
        <p className="text-slate-400 text-sm md:text-base mb-8 max-w-md mx-auto leading-relaxed">
          The link you followed may be broken, the room code might be incorrect, or the page has moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#5227FF] to-[#8a2be2] hover:from-[#6b44ff] hover:to-[#9b4dff] text-white font-semibold text-sm transition-all shadow-[0_0_20px_rgba(82,39,255,0.4)] flex items-center justify-center gap-2"
          >
            <FiHome className="w-4 h-4" /> Go to Dashboard
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
          >
            Home Page <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-12 text-xs text-slate-600">
          Error code: HTTP_404_NOT_FOUND
        </div>
      </div>
    </div>
  );
}
