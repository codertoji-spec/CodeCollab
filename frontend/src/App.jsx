import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SecretProvider, useSecret } from './context/SecretContext'

// Route-level code splitting: download page bundles only when accessed
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const MyRooms = lazy(() => import('./pages/MyRooms'))
const Room = lazy(() => import('./pages/Room'))
const GoogleSuccess = lazy(() => import('./pages/GoogleSuccess'))
const SetupUsername = lazy(() => import('./pages/SetupUsername'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const NotFound = lazy(() => import('./pages/NotFound'))

const PageLoader = () => (
  <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-slate-400 font-mono text-xs tracking-wider uppercase">Loading...</span>
    </div>
  </div>
)

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  return user ? children : <Navigate to="/login" replace />
}

const SecretRoomRoute = ({ children }) => {
  const { isUnlocked } = useSecret()
  if (!isUnlocked) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

function App() {
  return (
    <AuthProvider>
      <SecretProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
              <Route path="/setup-username" element={<SetupUsername />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/auth/google/success" element={<GoogleSuccess />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/my-rooms" element={<PrivateRoute><SecretRoomRoute><MyRooms /></SecretRoomRoute></PrivateRoute>} />
              <Route path="/room/:roomId" element={<PrivateRoute><Room /></PrivateRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SecretProvider>
    </AuthProvider>
  )
}

export default App
