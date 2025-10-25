import { useMemo, useState, useEffect, useRef } from 'react'
import './App.css'
import silhouette from './assets/suspects/silhouette.svg'
import vineetImg from './assets/suspects/vineet.jpg'
import manvithaImg from './assets/suspects/manvitha.jpg'
import srishanthImg from './assets/suspects/srishanth.jpg'
import jeetImg from './assets/suspects/jeet.jpg'
import shreeyaImg from './assets/suspects/shreeya.jpg'
import { io } from 'socket.io-client'
import { API_BASE, endpoints } from './lib/api'
import TeamRegistration from './components/TeamRegistration'
import LandingPage from './components/LandingPage'
import DetectiveBoard from './components/DetectiveBoard'
import ChatWindow from './components/ChatWindow'
import EvidenceNotification from './components/EvidenceNotification'
import { evidenceData } from './dataA/evidenceConfig'

// Local fallback suspects in case backend is down
const FALLBACK_SUSPECTS = [
  { id: 'suspectA', name: 'Srishanth', role: 'Investor', avatar: srishanthImg },
  { id: 'suspectB', name: 'Vineet', role: 'Ex-boyfriend', avatar: vineetImg },
  { id: 'suspectC', name: 'Manvitha', role: 'Best friend', avatar: manvithaImg },
  { id: 'suspectD', name: 'Jeet', role: 'DJ', avatar: jeetImg },
  { id: 'suspectE', name: 'Shreeya', role: 'Lead investigator', avatar: shreeyaImg },
]

function App() {
  // Team identity persisted across refreshes
  const [teamId, setTeamId] = useState(() => {
    return localStorage.getItem('teamId') || null
  })

  // View state: 'registration', 'landing', 'board', 'chat'
  const [currentView, setCurrentView] = useState(() => {
    // If no team ID, must register first
    if (!teamId) {
      return 'registration'
    }
    
    const hasSeenLanding = localStorage.getItem('hasSeenLanding')
    const savedView = localStorage.getItem('currentView')
    
    // First time visitor with team - show landing
    if (!hasSeenLanding) {
      return 'landing'
    }
    
    // Returning visitor - restore last view (or default to board)
    return savedView || 'board'
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

  // Evidence system
  const [unlockedEvidence, setUnlockedEvidence] = useState(() => {
    if (!teamId) return []
    const saved = localStorage.getItem(`evidence_${teamId}`)
    return saved ? JSON.parse(saved) : []
  })
  const [pendingNotification, setPendingNotification] = useState(null)

  // Socket.io
  const socketRef = useRef(null)

  // Fetch suspects list
  useEffect(() => {
    let stale = false
    fetch(endpoints.suspects())
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch suspects')))
      .then(list => {
        if (stale || !Array.isArray(list) || !list.length) return
        // Map backend suspects with correct avatars from FALLBACK_SUSPECTS
        const mapped = list.map(s => {
          const fallback = FALLBACK_SUSPECTS.find(f => f.id === s.id)
          return { 
            ...s, 
            role: s.role || fallback?.role || 'Suspect', 
            avatar: fallback?.avatar || silhouette 
          }
        })
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
    if (!selected || !teamId) return
    let stale = false
    fetch(endpoints.history(teamId, selected))
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch history')))
      .then(data => {
        if (stale) return
        const msgs = (data?.messages || []).map(m => ({ who: m.sender === selected ? 'ai' : 'user', text: m.message }))
        setMessages(msgs)
      })
      .catch(() => setMessages([]))
    return () => { stale = true }
  }, [teamId, selected])

  // Setup socket once
  useEffect(() => {
    if (!teamId) return
    
    const socket = io(API_BASE, { transports: ['websocket'] })
    socketRef.current = socket

    // Handle incoming responses
    socket.on('chatResponse', ({ suspectId, message, teamId: tid }) => {
      // Only append if for the current selected suspect and this team (or broadcast without tid)
      if (suspectId === selected && (!tid || tid === teamId)) {
        setMessages(prev => [...prev, { who: 'ai', text: message }])
      }
    })

    return () => { socket.disconnect() }
  }, [teamId, selected])

  // Persist unlocked evidence to localStorage
  useEffect(() => {
    if (teamId && unlockedEvidence.length > 0) {
      try {
        localStorage.setItem(`evidence_${teamId}`, JSON.stringify(unlockedEvidence))
      } catch {}
    }
  }, [unlockedEvidence, teamId])

  // Check for evidence unlocking based on message content
  const checkForEvidenceUnlock = (messageText) => {
    if (!messageText) return

    const lowerMessage = messageText.toLowerCase()
    
    // Special "greenwich" keyword unlocks all evidence
    if (lowerMessage.includes('greenwich')) {
      const allEvidence = evidenceData.filter(e => !unlockedEvidence.find(u => u.id === e.id))
      if (allEvidence.length > 0) {
        setUnlockedEvidence(prev => [...prev, ...allEvidence])
        setPendingNotification(allEvidence[0]) // Show first one as notification
      }
      return
    }

    // Check each evidence for keyword matches
    for (const evidence of evidenceData) {
      // Skip if already unlocked
      if (unlockedEvidence.find(e => e.id === evidence.id)) continue

      // Check if any keyword matches
      const matched = evidence.keywords.some(keyword => 
        lowerMessage.includes(keyword.toLowerCase())
      )

      if (matched) {
        setUnlockedEvidence(prev => [...prev, evidence])
        setPendingNotification(evidence)
        break // Only unlock one evidence per message
      }
    }
  }

  const handleTeamRegistered = (newTeamId, members) => {
    setTeamId(newTeamId)
    setCurrentView('landing')
  }

  const handleSend = () => {
    const text = input.trim()
    if (!text || !selected || !socketRef.current || !teamId) return
    
    // Check for evidence unlock before sending
    checkForEvidenceUnlock(text)
    
    // Optimistic UI
    setMessages(prev => [...prev, { who: 'user', text }])
    setInput('')
    // Emit to backend; backend will save and reply (agent or fallback)
    socketRef.current.emit('chatMessage', {
      teamId,
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
  if (currentView === 'registration') {
    return <TeamRegistration onTeamRegistered={handleTeamRegistered} />
  }

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
      <>
        <ChatWindow
          suspect={suspect}
          messages={messages}
          input={input}
          setInput={setInput}
          onSend={handleSend}
          onBack={handleBackToBoard}
          teamId={teamId}
          suspectId={selected}
          unlockedEvidence={unlockedEvidence}
        />
        {pendingNotification && (
          <EvidenceNotification 
            evidence={pendingNotification} 
            onClose={() => setPendingNotification(null)} 
          />
        )}
      </>
    )
  }

  return null
}

export default App
