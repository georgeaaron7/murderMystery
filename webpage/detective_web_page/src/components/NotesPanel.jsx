import { useEffect, useMemo, useRef, useState } from 'react'
import { endpoints } from '../lib/api'

// Helper to create a new note
function createNote() {
  const id = `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
  const colors = ['#fef3bd', '#ffd6a5', '#caffbf', '#bdb2ff', '#ffc6ff']
  const color = colors[Math.floor(Math.random() * colors.length)]
  return { id, text: '', color, ts: Date.now() }
}

// Debounce helper
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

// LocalStorage fallback helpers
const LS_PREFIX = 'notes_fallback:'

function saveToLocalStorage(participantId, suspectId, notes, connections) {
  try {
    const key = `${LS_PREFIX}${participantId}_${suspectId}`
    localStorage.setItem(key, JSON.stringify({ notes, connections }))
  } catch (err) {
    console.error('LocalStorage save failed:', err)
  }
}

function loadFromLocalStorage(participantId, suspectId) {
  try {
    const key = `${LS_PREFIX}${participantId}_${suspectId}`
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (err) {
    console.error('LocalStorage load failed:', err)
    return null
  }
}

export default function NotesPanel({ participantId, suspectId }) {
  const [notes, setNotes] = useState([])
  const [connections, setConnections] = useState([]) // [{id,a,b}]
  const [linkMode, setLinkMode] = useState(false)
  const [linkFrom, setLinkFrom] = useState(null) // note id selected as source
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const gridRef = useRef(null)
  const [ribbons, setRibbons] = useState({ width: 0, height: 0, lines: [] })

  // Load notes from backend when participant or suspect changes
  useEffect(() => {
    if (!participantId || !suspectId) return
    
    setLoading(true)
    fetch(endpoints.notes(participantId, suspectId))
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch notes')))
      .then(data => {
        setNotes(data.notes || [])
        setConnections(data.connections || [])
        setLinkFrom(null)
        console.log('✅ Notes loaded from database')
      })
      .catch(err => {
        console.error('⚠️ Backend unavailable, loading from localStorage:', err)
        // Fallback to localStorage if backend is down
        const localData = loadFromLocalStorage(participantId, suspectId)
        if (localData) {
          setNotes(localData.notes || [])
          setConnections(localData.connections || [])
          console.log('✅ Notes loaded from localStorage (fallback)')
        } else {
          setNotes([])
          setConnections([])
        }
        setLinkFrom(null)
      })
      .finally(() => setLoading(false))
  }, [participantId, suspectId])

  // Debounced notes and connections for auto-save
  const debouncedNotes = useDebounce(notes, 1000)
  const debouncedConnections = useDebounce(connections, 1000)
  
  // Track if we've loaded initial data
  const hasLoadedRef = useRef(false)

  // Auto-save to backend when notes or connections change
  useEffect(() => {
    // Don't save during initial load or if still loading
    if (!participantId || !suspectId || loading) return
    
    // Skip first render after loading (initial data from backend)
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      return
    }
    
    setSaving(true)
    
    // Always save to localStorage as backup
    saveToLocalStorage(participantId, suspectId, debouncedNotes, debouncedConnections)
    
    // Try to save to backend
    fetch(endpoints.saveNotes(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId,
        suspectId,
        notes: debouncedNotes,
        connections: debouncedConnections
      })
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to save notes')))
      .then(() => {
        console.log('✅ Notes saved to database (+ localStorage backup)')
      })
      .catch(err => {
        console.warn('⚠️ Backend save failed, using localStorage only:', err.message)
      })
      .finally(() => setSaving(false))
  }, [participantId, suspectId, debouncedNotes, debouncedConnections, loading])
  
  // Reset hasLoadedRef when participant or suspect changes
  useEffect(() => {
    hasLoadedRef.current = false
  }, [participantId, suspectId])

  const addNote = () => setNotes(prev => [createNote(), ...prev])
  const updateNote = (id, text) => setNotes(prev => prev.map(n => n.id === id ? { ...n, text } : n))
  const deleteNote = (id) => setNotes(prev => prev.filter(n => n.id !== id))
  const toggleLinkMode = () => { setLinkMode(v => !v); setLinkFrom(null) }
  const handleLinkClick = (id) => {
    if (!linkMode) return
    if (!linkFrom) { setLinkFrom(id); return }
    if (linkFrom === id) { setLinkFrom(null); return }
    const exists = connections.some(c => (c.a === linkFrom && c.b === id) || (c.a === id && c.b === linkFrom))
    if (!exists) {
      const cid = `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
      setConnections(prev => [{ id: cid, a: linkFrom, b: id }, ...prev])
    }
    setLinkFrom(null)
  }
  const deleteConnection = (cid) => setConnections(prev => prev.filter(c => c.id !== cid))

  const title = useMemo(() => 'Notes', [])

  // Compute ribbon lines connecting notes per connections array
  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    const width = el.clientWidth
    const height = el.clientHeight
    const lines = []
    const getCenter = (noteId) => {
      const card = el.querySelector(`.note-card[data-note-id="${noteId}"]`)
      if (!card) return null
      const x = (card.offsetLeft - el.scrollLeft) + card.offsetWidth / 2
      const y = (card.offsetTop - el.scrollTop) + card.offsetHeight / 2
      return { x, y }
    }
    connections.forEach((c, idx) => {
      const a = getCenter(c.a)
      const b = getCenter(c.b)
      if (!a || !b) return
      const ax = a.x, ay = a.y
      const bx = b.x, by = b.y
      const mx = (ax + bx) / 2
      const my = (ay + by) / 2 - 24 * (idx % 2 === 0 ? 1 : -1)
      lines.push({ id: c.id, ax, ay, bx, by, mx, my })
    })
    setRibbons({ width, height, lines })

    const handle = () => {
      const w = el.scrollWidth
      const h = el.scrollHeight
      const cs = Array.from(el.querySelectorAll('.note-card'))
      const ls = []
      if (cs.length >= 2) {
        for (let i = 0; i < cs.length - 1; i++) {
          const a = cs[i]
          const b = cs[i + 1]
          const ax = a.offsetLeft + a.offsetWidth / 2
          const ay = a.offsetTop + a.offsetHeight / 2
          const bx = b.offsetLeft + b.offsetWidth / 2
          const by = b.offsetTop + b.offsetHeight / 2
          const mx = (ax + bx) / 2
          const my = (ay + by) / 2 - 20 * (i % 2 === 0 ? 1 : -1)
          ls.push({ ax, ay, bx, by, mx, my })
        }
      }
      setRibbons({ width: w, height: h, lines: ls })
    }
    // Recompute on resize and scroll
    window.addEventListener('resize', handle)
    el.addEventListener('scroll', handle)
    return () => {
      window.removeEventListener('resize', handle)
      el.removeEventListener('scroll', handle)
    }
  }, [notes, connections])

  return (
    <section className="notes-section" aria-label="Detective board notes">
      <div className="notes-header">
        <h2 className="notes-title">
          {title}
          {loading && <span className="notes-status"> (Loading...)</span>}
          {saving && <span className="notes-status"> (Saving...)</span>}
        </h2>
        <div className="notes-actions">
          <button className="note-add" onClick={addNote} title="Add note">+</button>
          <button className={`note-connect ${linkMode ? 'active' : ''}`} onClick={toggleLinkMode} title="Connect notes">Link</button>
        </div>
      </div>
      <div className="notes-board">
        <svg
          className="ribbons"
          width={ribbons.width}
          height={ribbons.height}
          viewBox={`0 0 ${ribbons.width} ${ribbons.height}`}
          aria-hidden
        >
          {ribbons.lines.map((l) => (
            <g key={l.id} className="ribbon">
              <path d={`M ${l.ax} ${l.ay} Q ${l.mx} ${l.my} ${l.bx} ${l.by}`} />
              <circle cx={l.ax} cy={l.ay} r="4" className="pin" />
              <circle cx={l.bx} cy={l.by} r="4" className="pin" />
              {/* delete handle at curve mid */}
              <circle
                cx={l.mx}
                cy={l.my}
                r="7"
                className="ribbon-handle"
                onClick={() => deleteConnection(l.id)}
              />
            </g>
          ))}
        </svg>
        <div className="notes-grid" ref={gridRef}>
        {notes.length === 0 && (
          <div className="notes-empty">No notes yet. Add your first clue.</div>
        )}
        {notes.map(n => (
            <article
              key={n.id}
              className={`note-card ${linkMode && (linkFrom === n.id ? 'link-from' : 'linkable')}`}
              style={{ background: n.color }}
              data-note-id={n.id}
              onClick={() => handleLinkClick(n.id)}
            >
            <div className="note-pin" />
            <textarea
              className="note-text"
              placeholder="Write a clue…"
              value={n.text}
              onChange={(e) => updateNote(n.id, e.target.value)}
            />
            <div className="note-actions">
              <button className="note-del" onClick={() => deleteNote(n.id)} title="Delete note">Delete</button>
            </div>
          </article>
        ))}
        </div>
      </div>
    </section>
  )
}
