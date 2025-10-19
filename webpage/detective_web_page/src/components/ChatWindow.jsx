import { useState, useEffect, useRef } from 'react'
import './ChatWindow.css'
import NotesPanel from './NotesPanel'

function ChatWindow({ 
  suspect, 
  messages, 
  input, 
  setInput, 
  onSend, 
  onBack,
  participantId,
  suspectId 
}) {
  const [notesOpen, setNotesOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const chatWindowRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Scroll to bottom on mount
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight
    }
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-slide-in">
        {/* Header */}
        <header className="chat-header-new">
          <button className="back-btn" onClick={onBack} title="Back to suspect board">
            ← Back
          </button>
          
          <div className="header-banner-new">
            <span className="header-avatar-new">
              <img src={suspect?.avatar} alt="" />
            </span>
            <span className="header-titles-new">
              <span className="header-name-new">{suspect?.name}</span>
              <span className="header-role-new">{suspect?.role}</span>
            </span>
          </div>

          <button className="notes-btn-new" onClick={() => setNotesOpen(true)}>
            📝 Notes
          </button>
        </header>

        {/* Messages */}
        <section className="chat-window-new" ref={chatWindowRef}>
          <div className="transcript-new">
            {messages.length === 0 && (
              <div className="empty-chat">
                <p className="empty-icon">💬</p>
                <p className="empty-text">Begin your interrogation...</p>
              </div>
            )}
            
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={`msg-new ${m.who === 'user' ? 'user' : 'ai'}`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="msg-bubble">
                  {m.text}
                </div>
                {m.who === 'ai' && (
                  <div className="msg-avatar">
                    <img src={suspect?.avatar} alt="" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </section>

        {/* Input */}
        <footer className="chat-input-new">
          <div className="input-box-new">
            <textarea
              placeholder="Type your question…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows="1"
            />
          </div>
          <button 
            className="send-btn-new" 
            onClick={onSend} 
            disabled={!input.trim()}
          >
            <span className="send-icon">➤</span>
            Send
          </button>
        </footer>
      </div>

      {/* Notes Modal */}
      {notesOpen && (
        <div className="modal-backdrop" onClick={() => setNotesOpen(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{suspect?.name} — Notes</div>
              <button className="modal-close" onClick={() => setNotesOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <NotesPanel participantId={participantId} suspectId={suspectId} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatWindow
