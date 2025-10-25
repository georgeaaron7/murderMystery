import { useEffect, useState } from 'react'
import './EvidenceNotification.css'

function EvidenceNotification({ evidence, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Fade in
    setTimeout(() => setVisible(true), 10)
    
    // Auto-close after 4 seconds
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300) // Wait for fade out animation
    }, 4000)

    return () => clearTimeout(timer)
  }, [onClose])

  if (!evidence) return null

  return (
    <div className={`evidence-notification ${visible ? 'visible' : ''}`}>
      <div className="evidence-notif-icon">🔍</div>
      <div className="evidence-notif-content">
        <div className="evidence-notif-title">Evidence Unlocked!</div>
        <div className="evidence-notif-subtitle">{evidence.title}</div>
      </div>
    </div>
  )
}

export default EvidenceNotification
