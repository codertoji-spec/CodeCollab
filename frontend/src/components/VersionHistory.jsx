import { useState, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('cc_token')}` })

/**
 * VersionHistory
 *
 * Props:
 *   roomId    — current room UUID
 *   isEditor  — whether the current user can save/restore
 *   getCode   — () => string  — callback to read current editor content
 *               (replaces the previous window.__cc_getCode anti-pattern)
 *   onRestore — (code: string) => void
 *   onClose   — () => void
 */
export default function VersionHistory({ roomId, isEditor, getCode, onRestore, onClose }) {
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState(null)
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/rooms/${roomId}/snapshots`, { headers: auth() })
      setSnapshots(res.data.snapshots || [])
    } catch {
      setSnapshots([])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [roomId])

  const saveNow = async () => {
    if (!isEditor) return
    setSaving(true)
    try {
      // getCode is a prop — no window global needed
      const code = getCode?.() ?? ''
      await axios.post(
        `${API}/rooms/snapshot`,
        { roomId, code, label: label.trim() || null },
        { headers: auth() }
      )
      setLabel('')
      setSaveMsg('Saved!')
      setTimeout(() => setSaveMsg(''), 2000)
      load()
    } catch {
      setSaveMsg('Save failed')
      setTimeout(() => setSaveMsg(''), 2000)
    }
    setSaving(false)
  }

  const fmt = (iso) =>
    new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  return (
    <div className="w-72 flex flex-col border-l border-dark-600 bg-dark-800 flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-dark-700 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="font-medium text-sm text-slate-200">🕐 Version History</h3>
          <p className="text-xs text-slate-500">{snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-200 text-xl leading-none">×</button>
      </div>

      {/* Save bar (editors only) */}
      {isEditor && (
        <div className="px-3 py-2 border-b border-dark-700 flex gap-2 flex-shrink-0">
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveNow()}
            placeholder="Label (optional)…"
            className="flex-1 bg-dark-700 border border-dark-500 rounded px-2 py-1.5
                       text-xs text-slate-200 placeholder-slate-600
                       focus:outline-none focus:border-accent-primary"
          />
          <button
            onClick={saveNow}
            disabled={saving}
            className="bg-accent-primary hover:bg-yellow-300 disabled:opacity-40
                       text-white px-3 py-1.5 rounded text-xs font-medium transition-all"
          >
            {saving ? '…' : saveMsg || 'Save'}
          </button>
        </div>
      )}

      {/* Snapshot list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-slate-500 text-xs p-4 text-center">Loading…</p>
        ) : snapshots.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-slate-500 text-xs">No snapshots yet.</p>
            {isEditor && <p className="text-slate-600 text-xs mt-1">Click Save to capture current state.</p>}
          </div>
        ) : (
          snapshots.map(s => (
            <div key={s.id} className="border-b border-dark-700 last:border-0">
              {/* Row */}
              <div
                className={`px-3 py-2.5 cursor-pointer hover:bg-dark-700 transition-colors
                            ${preview?.id === s.id ? 'bg-dark-700' : ''}`}
                onClick={() => setPreview(prev => prev?.id === s.id ? null : s)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-300 truncate">
                      {s.label || <span className="italic text-slate-500">Unnamed</span>}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {fmt(s.saved_at)}
                      {s.saved_by && ` · ${s.saved_by}`}
                    </p>
                  </div>
                  <span className="text-slate-600 text-xs flex-shrink-0 mt-0.5">
                    {preview?.id === s.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* Expanded preview */}
              {preview?.id === s.id && (
                <div className="px-3 pb-3">
                  <pre className="bg-dark-900 rounded-lg p-2 text-xs text-slate-300
                                  max-h-36 overflow-auto whitespace-pre-wrap font-mono
                                  border border-dark-600">
                    {s.code?.slice(0, 400)}
                    {s.code?.length > 400 && '\n…'}
                  </pre>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs text-slate-600 flex-1">
                      {s.code?.length ?? 0} chars
                    </span>
                    {isEditor && (
                      <button
                        onClick={e => { e.stopPropagation(); onRestore(s.code) }}
                        className="bg-accent-green hover:bg-emerald-300 text-white
                                   text-xs px-3 py-1 rounded font-medium transition-all"
                      >
                        ↩ Restore
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
