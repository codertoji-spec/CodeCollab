import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import axios from 'axios'
import { io } from 'socket.io-client'
import * as Y from 'yjs'
import { MonacoBinding } from 'y-monaco'
import { useAuth } from '../context/AuthContext'
import VersionHistory from '../components/VersionHistory'
import { getLangIcon } from '../utils/icons'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

const LANGUAGES = ['javascript', 'python', 'cpp', 'java', 'typescript']
const MONACO_LANG = {
  cpp: 'cpp', javascript: 'javascript', python: 'python',
  typescript: 'typescript', java: 'java'
}

const DEFAULT_CODE = {
  javascript: '// Welcome to CodeCollab!\nconsole.log("Hello, World!");\n',
  python: '# Welcome to CodeCollab!\nprint("Hello, World!")\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n',
  typescript: '// Welcome to CodeCollab!\nconsole.log("Hello, World!");\n',
  java: 'public class Solution {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n',
}

const CURSOR_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#8b5cf6', '#f97316',
]


export default function Room() {
  const { roomId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const initialState = location.state || {}
  const [room] = useState(initialState.room || { id: roomId, name: 'Room', language: 'javascript' })
  const [role] = useState(initialState.role || 'viewer')
  const isEditor = role === 'editor'

  // ── UI state ──────────────────────────────────────────────────────────────
  const [language, setLanguage] = useState(room.language || 'javascript')
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [typingUsers, setTypingUsers] = useState([])
  const [output, setOutput] = useState(null)
  const [running, setRunning] = useState(false)
  const [stdin, setStdin] = useState('')
  const [chatOpen, setChatOpen] = useState(true)
  const [copied, setCopied] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [socketError, setSocketError] = useState(null)
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)

  // ── Refs ──────────────────────────────────────────────────────────────────
  const socketRef = useRef(null)
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const ydocRef = useRef(null)
  const yjsBindingRef = useRef(null)
  const cursorsRef = useRef({})
  const colorMapRef = useRef({})
  const colorCounterRef = useRef(0)
  const typingTimeout = useRef(null)
  const chatEndRef = useRef(null)

  // ── Helpers ───────────────────────────────────────────────────────────────
  /**
   * Get current editor code from Yjs doc (source of truth).
   * No window global — passed as prop to VersionHistory instead.
   */
  const getCode = useCallback(
    () => ydocRef.current?.getText('monaco').toString() ?? editorRef.current?.getValue() ?? '',
    []
  )

  /** Replace Y.Doc content — triggers CRDT sync to all peers. */
  const setYjsCode = useCallback((code) => {
    const ydoc = ydocRef.current
    if (!ydoc) return
    const ytext = ydoc.getText('monaco')
    ydoc.transact(() => {
      ytext.delete(0, ytext.length)
      ytext.insert(0, code)
    })
  }, [])

  const getColorForSocket = useCallback((socketId) => {
    if (colorMapRef.current[socketId] === undefined) {
      colorMapRef.current[socketId] = colorCounterRef.current % CURSOR_COLORS.length
      colorCounterRef.current++
    }
    return CURSOR_COLORS[colorMapRef.current[socketId]]
  }, [])

  const removeCursor = useCallback((socketId) => {
    const entry = cursorsRef.current[socketId]
    if (!entry || !editorRef.current) return
    try { editorRef.current.deltaDecorations(entry.decorIds, []) } catch (_) { }
    delete cursorsRef.current[socketId]
    const safe = socketId.replace(/[^a-zA-Z0-9]/g, '_')
    document.getElementById(`cc-cursor-${safe}`)?.remove()
    injectedStyles.delete(socketId)
  }, [])

  const updateCursor = useCallback((socketId, username, position, selection) => {
    if (!editorRef.current || !monacoRef.current) return
    const editor = editorRef.current
    const monaco = monacoRef.current
    const color = getColorForSocket(socketId)
    const safe = socketId.replace(/[^a-zA-Z0-9]/g, '_')
    injectCursorStyle(socketId, color, username)
    const existing = cursorsRef.current[socketId]?.decorIds || []
    const decorations = [
      {
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
        options: {
          className: `cc-cursor-${safe}`,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          zIndex: 10,
        },
      },
    ]
    if (
      selection &&
      !(selection.startLineNumber === selection.endLineNumber &&
        selection.startColumn === selection.endColumn)
    ) {
      decorations.push({
        range: new monaco.Range(
          selection.startLineNumber, selection.startColumn,
          selection.endLineNumber, selection.endColumn
        ),
        options: {
          className: `cc-selection-${safe}`,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      })
    }
    cursorsRef.current[socketId] = {
      decorIds: editor.deltaDecorations(existing, decorations), color,
    }
  }, [getColorForSocket])

  // ── Socket + Yjs setup ────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('cc_token')

    // Pass JWT in socket handshake auth — verified server-side, never trust client userId
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },          // ← server middleware reads this
    })
    socketRef.current = socket

    socket.on('connect_error', (err) => {
      // AUTH_MISSING / AUTH_INVALID → redirect to login
      if (err.message?.startsWith('AUTH_')) {
        setSocketError('Session expired. Redirecting to login…')
        setTimeout(() => navigate('/login'), 2000)
      } else {
        setSocketError(`Connection error: ${err.message}`)
      }
    })

    // ── Yjs document ──────────────────────────────────────────────────────
    const ydoc = new Y.Doc()
    ydocRef.current = ydoc
    const ytext = ydoc.getText('monaco')

    ydoc.on('update', (update, origin) => {
      if (origin === 'remote') return
      if (!isEditor) return
      socket.emit('yjs-update', { roomId, update })
    })

    // ── Socket events ─────────────────────────────────────────────────────
    socket.on('connect', () => {
      setSocketError(null)
      // Only send role — server derives userId/username from JWT
      socket.emit('join-room', { roomId, role, language })
    })

    const toUint8 = (data) => {
      if (data instanceof Uint8Array) return data
      if (data instanceof ArrayBuffer) return new Uint8Array(data)
      if (data && data.buffer instanceof ArrayBuffer) return new Uint8Array(data.buffer)
      if (Array.isArray(data)) return new Uint8Array(data)
      return new Uint8Array()
    }

    socket.on('yjs-init', (state) => {
      const bytes = toUint8(state)
      if (bytes.length > 0) Y.applyUpdate(ydoc, bytes, 'remote')

      if (isEditor && ytext.length === 0) {
        ydoc.transact(() => ytext.insert(0, DEFAULT_CODE[language] || ''), 'remote-init-skip')
      }

      if (editorRef.current) {
        yjsBindingRef.current?.destroy()
        yjsBindingRef.current = new MonacoBinding(
          ytext, editorRef.current.getModel(), new Set([editorRef.current])
        )
      }
    })

    socket.on('yjs-update', ({ update }) => {
      const bytes = toUint8(update)
      if (bytes.length > 0) Y.applyUpdate(ydoc, bytes, 'remote')
    })

    socket.on('room-state', ({ language: serverLang, users: serverUsers }) => {
      if (serverLang) setLanguage(serverLang)
      setUsers(serverUsers || [])
    })

    socket.on('language-update', ({ language: newLang }) => setLanguage(newLang))
    socket.on('users-update', (updatedUsers) => setUsers(updatedUsers))

    socket.on('user-joined', ({ username: joinedName }) => {
      setMessages(prev => [...prev, { type: 'system', text: `${joinedName} joined`, id: Date.now() }])
    })

    socket.on('user-left', ({ username: leftName, socketId: leftId }) => {
      setMessages(prev => [...prev, { type: 'system', text: `${leftName} left`, id: Date.now() }])
      setTypingUsers(prev => prev.filter(u => u !== leftName))
      if (leftId) removeCursor(leftId)
    })

    socket.on('cursor-remove', ({ socketId: leftId }) => removeCursor(leftId))

    socket.on('chat-message', ({ username: sender, message, timestamp, socketId }) => {
      setMessages(prev => [...prev, {
        type: 'chat', username: sender, message, timestamp,
        id: Date.now() + Math.random(),
        isMe: socketId === socket.id,
      }])
    })

    socket.on('typing-update', ({ username: typingName, isTyping, socketId }) => {
      if (socketId === socket.id) return
      setTypingUsers(prev =>
        isTyping ? [...new Set([...prev, typingName])] : prev.filter(u => u !== typingName)
      )
    })

    socket.on('execution-result', (result) => {
      setOutput(result)
      setRunning(false)
    })

    socket.on('cursor-update', ({ socketId, username: cursorUser, position, selection }) => {
      if (socketId === socket.id) return
      updateCursor(socketId, cursorUser, position, selection)
    })

    return () => {
      yjsBindingRef.current?.destroy()
      yjsBindingRef.current = null
      ydoc.destroy()
      ydocRef.current = null
      socket.disconnect()
      injectedStyles.clear()
    }
  }, [roomId, user, updateCursor, removeCursor]) // eslint-disable-line

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.lang-select-container')) {
        setLangDropdownOpen(false)
      }
    }
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  // ── Editor mount — bind Yjs ───────────────────────────────────────────────
  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    const ydoc = ydocRef.current
    if (ydoc) {
      const ytext = ydoc.getText('monaco')
      yjsBindingRef.current?.destroy()
      yjsBindingRef.current = new MonacoBinding(ytext, editor.getModel(), new Set([editor]))
    }

    editor.onDidChangeCursorSelection((e) => {
      const pos = editor.getPosition()
      const sel = e.selection
      socketRef.current?.emit('cursor-move', {
        roomId,
        // username omitted — server reads from verified socket
        position: { lineNumber: pos.lineNumber, column: pos.column },
        selection: {
          startLineNumber: sel.startLineNumber, startColumn: sel.startColumn,
          endLineNumber: sel.endLineNumber, endColumn: sel.endColumn,
        },
      })
    })
  }, [roomId])

  // ── Language change ───────────────────────────────────────────────────────
  const handleLanguageChange = (newLang) => {
    if (!isEditor) return
    setLanguage(newLang)
    setYjsCode(DEFAULT_CODE[newLang] || '')
    socketRef.current?.emit('language-change', { roomId, language: newLang })
  }

  // ── Chat ──────────────────────────────────────────────────────────────────
  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    socketRef.current?.emit('chat-message', { roomId, message: chatInput.trim() })
    setChatInput('')
    socketRef.current?.emit('typing', { roomId, isTyping: false })
  }

  const handleChatTyping = (e) => {
    setChatInput(e.target.value)
    socketRef.current?.emit('typing', { roomId, isTyping: true })
    clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit('typing', { roomId, isTyping: false })
    }, 2000)
  }

  // ── Run code ──────────────────────────────────────────────────────────────
  const runCode = async () => {
    if (!isEditor || running) return
    const code = getCode()
    setRunning(true)
    setOutput(null)
    try {
      const res = await axios.post(`${API}/execute/run`, { code, language, stdin }, { headers: authHeader() })
      const result = res.data
      setOutput(result)
      socketRef.current?.emit('execution-result', { roomId, result })
    } catch (err) {
      const result = { output: '', error: err.response?.data?.error || 'Execution failed', exitCode: 1 }
      setOutput(result)
      socketRef.current?.emit('execution-result', { roomId, result })
    } finally {
      setRunning(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (socketError) {
    return (
      <div className="h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-2">{socketError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-dark-900 flex flex-col overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 glass-nav flex-shrink-0 relative z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-slate-500 hover:text-slate-200 text-sm transition-colors"
          >
            ← Back
          </button>
          <div className="h-4 w-px bg-dark-600" />
          <div>
            <h1 className="font-semibold text-slate-100 text-sm">{room.name}</h1>
            <span className={`text-xs ${isEditor ? 'text-accent-green' : 'text-accent-yellow'}`}>
              {isEditor ? 'Editor' : '👁 Viewer'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Avatar row */}
          <div className="flex -space-x-2 mr-1">
            {users.slice(0, 6).map((u, i) => {
              const color = getColorForSocket(u.socketId || `idx-${i}`)
              return (
                <div
                  key={u.socketId || i}
                  className="w-7 h-7 rounded-full border-2 border-dark-800 flex items-center justify-center text-xs font-bold text-white cursor-default select-none"
                  style={{ backgroundColor: color }}
                  title={`${u.username} (${u.role})`}
                >
                  {u.role === 'viewer' ? '👁' : u.username?.[0]?.toUpperCase()}
                </div>
              )
            })}
            {users.length > 6 && (
              <div className="w-7 h-7 rounded-full border-2 border-dark-800 bg-dark-600 flex items-center justify-center text-xs text-slate-400">
                +{users.length - 6}
              </div>
            )}
          </div>

          {/* Language selector */}
          <div className="relative lang-select-container z-50">
            <div
              className={`bg-white/[0.04] border border-white/10 text-slate-100 text-xs px-2 py-1.5 rounded-md font-mono backdrop-blur-md flex items-center justify-between cursor-pointer hover:border-yellow-400/50 transition-all select-none min-w-[120px] ${!isEditor ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={(e) => {
                if (isEditor) {
                  e.stopPropagation()
                  setLangDropdownOpen(!langDropdownOpen)
                }
              }}
            >
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-4 h-4">{getLangIcon(language)}</span>
                <span>{language.charAt(0).toUpperCase() + language.slice(1)}</span>
              </div>
              <svg className={`w-3.5 h-3.5 ml-2 text-slate-400 transition-transform duration-200 ${langDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {langDropdownOpen && isEditor && (
              <div className="absolute top-full left-0 mt-1.5 bg-[#1A1625] border border-white/10 rounded-lg shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 min-w-[140px]">
                {LANGUAGES.map(l => (
                  <div
                    key={l}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors text-xs ${language === l ? 'bg-purple-500/20 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                    onClick={() => {
                      handleLanguageChange(l)
                      setLangDropdownOpen(false)
                    }}
                  >
                    <span className="flex items-center justify-center w-4 h-4">{getLangIcon(l)}</span>
                    <span>{l.charAt(0).toUpperCase() + l.slice(1)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* Run button */}
          {isEditor && (
            <button
              onClick={runCode}
              disabled={running}
              className="flex items-center gap-1.5 bg-accent-green hover:bg-emerald-300 disabled:opacity-60 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-all"
            >
              {running
                ? <><span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Running…</>
                : <>▶ Run</>}
            </button>
          )}

          {/* Copy */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(getCode())
              setCopied('y')
              setTimeout(() => setCopied(''), 1500)
            }}
            className="text-slate-500 hover:text-slate-200 text-xs transition-colors px-2 py-1.5"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>

          {/* Version History toggle */}
          <button
            onClick={() => setShowHistory(h => !h)}
            className={`text-xs px-2 py-1.5 rounded-md transition-all
                        ${showHistory ? 'bg-yellow-400 text-black' : 'bg-dark-700 text-slate-400 hover:text-slate-200'}`}
          >
            🕐 History
          </button>

          {/* Chat toggle */}
          <button
            onClick={() => setChatOpen(c => !c)}
            className={`text-xs px-2 py-1.5 rounded-md transition-all
                        ${chatOpen ? 'bg-yellow-400 text-black' : 'bg-dark-700 text-slate-400 hover:text-slate-200'}`}
          >
            💬 Chat
          </button>
        </div>
      </div>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Editor + output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={MONACO_LANG[language] || 'javascript'}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                fontLigatures: true,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                readOnly: !isEditor,
                automaticLayout: true,
                padding: { top: 16 },
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                cursorBlinking: 'smooth',
                smoothScrolling: true,
                wordWrap: 'on',
              }}
            />
          </div>

          {/* Stdin input */}
          {isEditor && (
            <div className="border-t border-dark-600 bg-dark-800 flex-shrink-0">
              <div className="flex items-center justify-between px-4 py-1.5 border-b border-dark-700">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Input (stdin)</span>
              </div>
              <textarea
                value={stdin}
                onChange={e => setStdin(e.target.value)}
                placeholder="Enter input here..."
                className="w-full bg-transparent px-4 py-2 font-mono text-xs text-slate-200 resize-none focus:outline-none placeholder-slate-600"
                rows={3}
              />
            </div>
          )}

          {/* Output panel */}
          {output && (
            <div className="border-t border-dark-600 bg-dark-800 flex-shrink-0" style={{ maxHeight: '200px', overflow: 'auto' }}>
              <div className="flex items-center justify-between px-4 py-2 border-b border-dark-700">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Output</span>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${output.exitCode === 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    Exit: {output.exitCode}
                  </span>
                  <button onClick={() => setOutput(null)} className="text-slate-500 hover:text-slate-200 text-sm">×</button>
                </div>
              </div>
              <pre className="px-4 py-3 font-mono text-xs text-slate-200 whitespace-pre-wrap">
                {output.compilerMessage && <span className="text-yellow-400">{output.compilerMessage}{'\n'}</span>}
                {output.output && <span>{output.output}</span>}
                {output.error && <span className="text-red-400">{output.error}</span>}
                {!output.compilerMessage && !output.output && !output.error && <span className="text-slate-500">(no output)</span>}
              </pre>
            </div>
          )}
        </div>

        {/* ── Version History panel ────────────────────────────────────── */}
        {showHistory && (
          <VersionHistory
            roomId={room.id}
            isEditor={isEditor}
            getCode={getCode}           /* prop instead of window global */
            onRestore={(code) => {
              setYjsCode(code)
              setShowHistory(false)
            }}
            onClose={() => setShowHistory(false)}
          />
        )}

        {/* ── Chat panel ───────────────────────────────────────────────── */}
        {chatOpen && (
          <div className="w-72 flex flex-col border-l border-dark-600 bg-dark-800 flex-shrink-0">
            <div className="px-4 py-3 border-b border-dark-700 flex-shrink-0">
              <h3 className="font-medium text-sm text-slate-200">Chat</h3>
              <p className="text-xs text-slate-500">{users.length} user{users.length !== 1 ? 's' : ''} in room</p>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {messages.map(msg => (
                <div key={msg.id}>
                  {msg.type === 'system'
                    ? <div className="text-center text-xs text-slate-600 py-1">{msg.text}</div>
                    : (
                      <div className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                        {!msg.isMe && <span className="text-xs text-slate-500 mb-0.5 px-1">{msg.username}</span>}
                        <div className={`max-w-full rounded-lg px-3 py-2 text-xs break-words ${msg.isMe ? 'bg-yellow-400 text-black' : 'bg-dark-700 text-slate-200'}`}>
                          {msg.message}
                        </div>
                      </div>
                    )
                  }
                </div>
              ))}
              {typingUsers.length > 0 && (
                <div className="text-xs text-slate-500 italic">
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2 p-3 border-t border-dark-700 flex-shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={handleChatTyping}
                placeholder="Type a message…"
                className="flex-1 bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent-primary"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="bg-accent-primary hover:bg-yellow-300 disabled:opacity-40 text-white px-3 py-2 rounded-lg transition-all text-xs"
              >
                →
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
