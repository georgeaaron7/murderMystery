import { useMemo, useState, useEffect, useRef } from 'react'
import './App.css'
import silhouette from './assets/suspects/silhouette.svg'
import { io } from 'socket.io-client'
import { API_BASE, endpoints } from './lib/api'
import LandingPage from './components/LandingPage'
import DetectiveBoard from './components/DetectiveBoard'
import ChatWindow from './components/ChatWindow'

// Local fallback suspects in case backend is down
const FALLBACK_SUSPECTS = [
  { id: 'suspectA', name: 'Mr. Black', role: 'Unknown', avatar: silhouette },
  { id: 'suspectB', name: 'Ms. Scarlet', role: 'Unknown', avatar: silhouette },
  { id: 'suspectC', name: 'Prof. Plum', role: 'Unknown', avatar: silhouette },
  { id: 'suspectD', name: 'Colonel Mustard', role: 'Unknown', avatar: silhouette },
]

function App() {
  // View state: 'landing', 'board', 'chat'
  // Persist view but check if user has seen landing page
  const [currentView, setCurrentView] = useState(() => {
    const hasSeenLanding = localStorage.getItem('hasSeenLanding')
    const savedView = localStorage.getItem('currentView')
    
    // First time visitor - show landing
    if (!hasSeenLanding) {
      return 'landing'
    }
    
    // Returning visitor - restore last view (or default to board)
    return savedView || 'board'
  })

  // Participant identity persisted across refreshes
  const [participantId] = useState(() => {
    const existing = typeof window !== 'undefined' ? localStorage.getItem('participantId') : null
    if (existing) return existing
    const id = `p_${Math.random().toString(36).slice(2, 10)}`
    try { localStorage.setItem('participantId', id) } catch {}
    return id
  })

  // Suspects from backend
  const [suspects, setSuspects] = useState(FALLBACK_SUSPECTS)
  const [selected, setSelected] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('selectedSuspect') : null
    return saved || FALLBACK_SUSPECTS[0]?.id
  })
  const suspect = useMemo(() => suspects.find(s => s.id === selected), [suspects, selected])

  // Messages are [{ who: 'user'|'ai', text: string }]
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  // Socket.io
  const socketRef = useRef(null)

  // Fetch suspects list
  useEffect(() => {
    let stale = false
    fetch(endpoints.suspects())
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch suspects')))
      .then(list => {
        if (stale || !Array.isArray(list) || !list.length) return
        const mapped = list.map(s => ({ ...s, role: s.role || 'Suspect', avatar: silhouette }))
        setSuspects(mapped)
        // Ensure selected suspect is valid in the fetched list
        const exists = mapped.some(s => s.id === selected)
        if (!exists) setSelected(mapped[0]?.id)
      })
      .catch(() => { /* keep fallback */ })
    return () => { stale = true }
  }, [])

  // Persist selected suspect and view across sessions
  useEffect(() => {
    if (selected) {
      try { localStorage.setItem('selectedSuspect', selected) } catch {}
    }
  }, [selected])

  // Save view state to localStorage
  useEffect(() => {
    try { 
      localStorage.setItem('currentView', currentView)
      // Mark that user has seen the landing page
      if (currentView !== 'landing') {
        localStorage.setItem('hasSeenLanding', 'true')
      }
    } catch {}
  }, [currentView])

  // Fetch history when selected suspect changes
  useEffect(() => {
    if (!selected) return
    let stale = false
    fetch(endpoints.history(participantId, selected))
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch history')))
      .then(data => {
        if (stale) return
        const msgs = (data?.messages || []).map(m => ({ who: m.sender === selected ? 'ai' : 'user', text: m.message }))
        setMessages(msgs)
      })
      .catch(() => setMessages([]))
    return () => { stale = true }
  }, [participantId, selected])

  // Setup socket once
  useEffect(() => {
    const socket = io(API_BASE, { transports: ['websocket'] })
    socketRef.current = socket

    // Handle incoming responses
    socket.on('chatResponse', ({ suspectId, message, participantId: pid }) => {
      // Only append if for the current selected suspect and this participant (or broadcast without pid)
      if (suspectId === selected && (!pid || pid === participantId)) {
        setMessages(prev => [...prev, { who: 'ai', text: message }])
      }
    })

    return () => { socket.disconnect() }
  }, [participantId, selected])

  const handleSend = () => {
    const text = input.trim()
    if (!text || !selected || !socketRef.current) return
    // Optimistic UI
    setMessages(prev => [...prev, { who: 'user', text }])
    setInput('')
    // Emit to backend; backend will save and reply (agent or fallback)
    socketRef.current.emit('chatMessage', {
      participantId,
      suspectId: selected,
      message: text,
    })
  }

  const handleStartInvestigation = () => {
    setCurrentView('board')
  }

  const handleSelectSuspect = (suspect) => {
    setSelected(suspect.id)
    setCurrentView('chat')
  }

  const handleBackToBoard = () => {
    setCurrentView('board')
  }

  const handleBackToLanding = () => {
    setCurrentView('landing')
  }
  
  // Render based on current view
  if (currentView === 'landing') {
    return <LandingPage onStart={handleStartInvestigation} />
  }

  if (currentView === 'board') {
    return (
      <DetectiveBoard 
        suspects={suspects} 
        onSelectSuspect={handleSelectSuspect}
        onBack={handleBackToLanding}
      />
    )
  }

  if (currentView === 'chat') {
    return (
      <ChatWindow
        suspect={suspect}
        messages={messages}
        input={input}
        setInput={setInput}
        onSend={handleSend}
        onBack={handleBackToBoard}
        participantId={participantId}
        suspectId={selected}
      />
    )
  }

  return null
}

export default App
