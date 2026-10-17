import { Link } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import { FiArrowLeft, FiShield } from 'react-icons/fi';

export default function PrivacyPolicy() {
  usePageMeta({
    title: 'Privacy Policy',
    description: 'Learn how CodeCollab collects, uses, and protects your personal information and coding workspace data.',
    path: '/privacy'
  });

  return (
    <div className="min-h-screen flex flex-col bg-black text-slate-100 relative">
      {/* Top Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <FiArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-2 text-white font-bold tracking-tight">
            <FiShield className="w-4 h-4 text-yellow-400" />
            <span>Code<span className="text-yellow-400">Collab</span> Privacy</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-extrabold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-8">Effective Date: October 17, 2026 • Last Updated: October 2026</p>

        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-3">1. Overview</h2>
            <p>
              CodeCollab ("we", "us", or "our") provides a real-time collaborative coding platform designed for developers to write, review, and execute code together in browser-based rooms. We respect your privacy and are committed to protecting the information you share with us.
            </p>
          </section>

          <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-white">Account Information:</strong> When you register an account or sign in with Google OAuth, we collect your email address, username, hashed password (for direct registrations), and profile avatar URL.
              </li>
              <li>
                <strong className="text-white">Workspace & Collaboration Data:</strong> Code documents, room metadata, language preferences, snapshot version history, and real-time room chat messages necessary to power collaborative editing.
              </li>
              <li>
                <strong className="text-white">Code Execution Requests:</strong> Code snippets and standard inputs (stdin) submitted for compiler execution.
              </li>
              <li>
                <strong className="text-white">Technical & Usage Data:</strong> Connection metadata, IP addresses, browser user agent, and socket identifiers required to maintain real-time presence and prevent abuse.
              </li>
            </ul>
          </section>

          <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide, operate, and maintain collaborative workspaces and real-time cursor/chat synchronization.</li>
              <li>To authenticate your identity, secure sessions, and verify email ownership via One-Time Passwords (OTP).</li>
              <li>To forward code execution requests securely to our code execution service (JDoodle API).</li>
              <li>To protect against malicious activities, denial-of-service attempts, spam, and unauthorized account access.</li>
            </ul>
          </section>

          <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-3">4. Third-Party Service Providers</h2>
            <p className="mb-3">We partner with reputable cloud infrastructure providers to deliver our service:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white">Google OAuth:</strong> For secure, optional single-sign-on authentication.</li>
              <li><strong className="text-white">Brevo (Sendinblue):</strong> For sending transactional verification emails and password reset OTPs.</li>
              <li><strong className="text-white">JDoodle Compiler API:</strong> For executing code in isolated sandboxes across supported programming languages.</li>
              <li><strong className="text-white">Supabase / PostgreSQL:</strong> For managed database persistence with connection pooling.</li>
              <li><strong className="text-white">Vercel & Render:</strong> For hosting web application frontend and backend services.</li>
            </ul>
          </section>

          <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-3">5. Data Retention & Security</h2>
            <p>
              We implement industry-standard security measures including HTTPS, JWT authentication with token versioning, password hashing with bcrypt, parameterized database queries, and secure session management. Workspace snapshots are capped at 100 per room to limit historical data retention. Room code states are persisted in PostgreSQL.
            </p>
          </section>

          <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-3">6. Your Rights & Choices</h2>
            <p>
              You have the right to access, update, or request deletion of your account and associated workspaces at any time. Room owners can delete rooms directly from their dashboard. For inquiries regarding personal data, please contact the project maintainer.
            </p>
          </section>

          <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-3">7. Contact Information</h2>
            <p>
              If you have any questions or feedback regarding this Privacy Policy or our security practices, please reach out via GitHub at{' '}
              <a
                href="https://github.com/codertoji-spec/CodeCollab"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 hover:underline"
              >
                github.com/codertoji-spec/CodeCollab
              </a>{' '}
              or contact <span className="font-mono text-slate-200">[support@codecollab.dev — placeholder pending project domain confirmation]</span>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        © 2026 CodeCollab. All rights reserved.
      </footer>
    </div>
  );
}
