import './EvidenceModal.css'

function EvidenceModal({ evidence, onClose }) {
  if (!evidence) return null

  const getEvidencePath = (filename) => {
    try {
      // Dynamically import evidence files
      return new URL(`../assets/evidence/${filename}`, import.meta.url).href
    } catch {
      return null
    }
  }

  const isAudio = evidence.filename.endsWith('.mp3')
  const evidencePath = getEvidencePath(evidence.filename)

  return (
    <div className="evidence-modal-backdrop" onClick={onClose}>
      <div className="evidence-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="evidence-modal-header">
          <div className="evidence-modal-title">
            <span className="evidence-icon">🔍</span>
            {evidence.title}
          </div>
          <button className="evidence-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="evidence-modal-body">
          {isAudio ? (
            <div className="evidence-audio-container">
              <audio controls src={evidencePath} className="evidence-audio">
                Your browser does not support the audio element.
              </audio>
            </div>
          ) : (
            <img 
              src={evidencePath} 
              alt={evidence.title}
              className="evidence-image"
            />
          )}
        </div>
        <div className="evidence-modal-footer">
          <span className="evidence-id">{evidence.id}</span>
        </div>
      </div>
    </div>
  )
}

export default EvidenceModal
