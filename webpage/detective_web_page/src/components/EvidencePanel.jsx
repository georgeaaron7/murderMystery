import './EvidencePanel.css'

function EvidencePanel({ unlockedEvidence, onViewEvidence }) {
  if (!unlockedEvidence || unlockedEvidence.length === 0) {
    return (
      <div className="evidence-panel-empty">
        <p className="empty-icon">🔒</p>
        <p className="empty-text">No evidence unlocked yet</p>
        <p className="empty-hint">Ask the right questions to uncover clues...</p>
      </div>
    )
  }

  return (
    <div className="evidence-panel-grid">
      {unlockedEvidence.map((evidence) => (
        <div 
          key={evidence.id} 
          className="evidence-card"
          onClick={() => onViewEvidence(evidence)}
        >
          <div className="evidence-card-icon">🔍</div>
          <div className="evidence-card-title">{evidence.title}</div>
          <div className="evidence-card-id">{evidence.id}</div>
        </div>
      ))}
    </div>
  )
}

export default EvidencePanel
