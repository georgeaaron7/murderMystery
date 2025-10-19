import { useState, useEffect } from 'react'
import './DetectiveBoard.css'

function DetectiveBoard({ suspects, onSelectSuspect, onBack }) {
  const [animatedSuspects, setAnimatedSuspects] = useState([])

  useEffect(() => {
    // Stagger the animation of polaroids appearing
    suspects.forEach((suspect, index) => {
      setTimeout(() => {
        setAnimatedSuspects(prev => [...prev, suspect.id])
      }, index * 150)
    })
  }, [suspects])

  const colors = ['#f7f1e7', '#fef9e7', '#fff5e6', '#f9f4ef', '#fdf6e3']

  return (
    <div className="detective-board">
      <div className="board-texture"></div>
      
      <header className="board-header">
        <button className="back-to-landing-btn" onClick={onBack} title="Back to landing page">
          ← Back to Story
        </button>
        <div className="board-header-content">
          <h1 className="board-title">
            <span className="title-icon">📌</span>
            Suspect Board
            <span className="title-icon">📌</span>
          </h1>
          <p className="board-subtitle">Click on a suspect to begin interrogation</p>
        </div>
      </header>

      <div className="polaroids-container">
        {suspects.map((suspect, index) => {
          const isAnimated = animatedSuspects.includes(suspect.id)
          const rotation = (index % 4 - 1.5) * 3 // Slight random rotation
          const color = colors[index % colors.length]
          
          return (
            <div
              key={suspect.id}
              className={`polaroid ${isAnimated ? 'visible' : ''}`}
              style={{
                '--rotation': `${rotation}deg`,
                '--delay': `${index * 0.15}s`,
                '--color': color
              }}
              onClick={() => onSelectSuspect(suspect)}
            >
              {/* Pin */}
              <div className="pin"></div>
              
              {/* Polaroid frame */}
              <div className="polaroid-frame">
                <div className="polaroid-photo">
                  <img 
                    src={suspect.avatar} 
                    alt={suspect.name}
                    className="suspect-photo"
                  />
                  {/* Photo overlay for noir effect */}
                  <div className="photo-overlay"></div>
                </div>
                
                <div className="polaroid-caption">
                  <div className="suspect-info">
                    <h3 className="suspect-name-board">{suspect.name}</h3>
                    <p className="suspect-role-board">{suspect.role}</p>
                  </div>
                  
                  {/* Hand-written note style */}
                  <div className="handwritten-note">
                    <span className="note-mark">?</span>
                  </div>
                </div>
              </div>
              
              {/* Tape pieces for extra realism */}
              <div className="tape tape-top"></div>
              <div className="tape tape-bottom"></div>
            </div>
          )
        })}
      </div>

      {/* Red string connections (decorative) */}
      <svg className="string-connections" xmlns="http://www.w3.org/2000/svg">
        <line x1="20%" y1="30%" x2="50%" y2="45%" className="red-string" />
        <line x1="50%" y1="45%" x2="80%" y2="35%" className="red-string" />
        <line x1="30%" y1="60%" x2="70%" y2="70%" className="red-string" />
      </svg>
    </div>
  )
}

export default DetectiveBoard
