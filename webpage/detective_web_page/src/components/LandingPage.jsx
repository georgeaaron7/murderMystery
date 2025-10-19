import { useState, useEffect } from 'react'
import './LandingPage.css'

function LandingPage({ onStart }) {
  const [displayedText, setDisplayedText] = useState('')
  const [showButton, setShowButton] = useState(false)
  
  const storyText = "A murder most foul has occurred at the grand estate. The victim: a prominent socialite. The suspects: those closest to her. As the lead detective, you must interrogate each suspect, uncover their secrets, and piece together the truth. Time is running out. The killer walks among them..."

  useEffect(() => {
    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex <= storyText.length) {
        setDisplayedText(storyText.slice(0, currentIndex))
        currentIndex++
      } else {
        clearInterval(interval)
        setTimeout(() => setShowButton(true), 500)
      }
    }, 30) // Typewriter speed

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="landing-page">
      <div className="landing-vignette"></div>
      <div className="landing-content">
        <div className="landing-header">
          <h1 className="landing-title">
            <span className="title-line">The Last</span>
            <span className="title-line title-emphasis">Confession</span>
          </h1>
          <div className="title-divider"></div>
        </div>
        
        <div className="story-container">
          <p className="story-text">
            {displayedText}
            <span className="cursor">|</span>
          </p>
        </div>

        <div className={`cta-container ${showButton ? 'visible' : ''}`}>
          <button className="cta-button" onClick={onStart}>
            <span className="cta-text">Begin Investigation</span>
            <span className="cta-icon">🔍</span>
          </button>
          <p className="cta-hint">Click to enter the case files</p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="landing-ornament top-left"></div>
      <div className="landing-ornament top-right"></div>
      <div className="landing-ornament bottom-left"></div>
      <div className="landing-ornament bottom-right"></div>
    </div>
  )
}

export default LandingPage
