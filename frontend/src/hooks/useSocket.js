import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export const useSocket = () => {
  const socketRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('cc_token')
    
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: { token }
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    }
  }, [])

  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler)
    return () => socketRef.current?.off(event, handler)
  }, [])

  const off = useCallback((event, handler) => {
    socketRef.current?.off(event, handler)
  }, [])

  return { socket: socketRef.current, emit, on, off, socketRef }
}
