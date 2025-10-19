// Centralized API configuration for the frontend
export const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:5000'

export const endpoints = {
  suspects: () => `${API_BASE}/suspects`,
  history: (participantId, suspectId) => `${API_BASE}/history?participantId=${encodeURIComponent(participantId)}&suspectId=${encodeURIComponent(suspectId)}`,
  notes: (participantId, suspectId) => `${API_BASE}/notes?participantId=${encodeURIComponent(participantId)}&suspectId=${encodeURIComponent(suspectId)}`,
  saveNotes: () => `${API_BASE}/notes`,
}
