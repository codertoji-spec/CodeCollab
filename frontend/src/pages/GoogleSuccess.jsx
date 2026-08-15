import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function GoogleSuccess() {
  const [params] = useSearchParams()
  const { setTokenUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const token = params.get('token')
    const isNew = params.get('isNew')
    if (token) {
      setTokenUser(token)
      if (isNew) {
        navigate(`/setup-username?token=${token}`, { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } else {
      navigate('/login?error=google_failed', { replace: true })
    }
  }, [])

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 font-mono text-sm">Completing sign-in...</span>
      </div>
    </div>
  )
}
