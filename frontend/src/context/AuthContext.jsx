import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('cc_token')
    if (token) {
      axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setUser(res.data.user)
      }).catch(() => {
        localStorage.removeItem('cc_token')
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password })
    localStorage.setItem('cc_token', res.data.token)
    setUser(res.data.user)
    return res.data
  }

  const register = async (username, email, password) => {
    const res = await axios.post(`${API}/auth/register`, { username, email, password })
    localStorage.setItem('cc_token', res.data.token)
    setUser(res.data.user)
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('cc_token')
    setUser(null)
  }

  const setTokenUser = (token) => {
    localStorage.setItem('cc_token', token)
    axios.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setUser(res.data.user)).catch(() => {})
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setTokenUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

export default AuthContext
