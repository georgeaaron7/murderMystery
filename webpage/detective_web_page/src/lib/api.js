// Centralized API configuration for the frontend
export const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:5000'

export const endpoints = {
  registerTeam: () => `${API_BASE}/register-team`,
  getTeam: (teamId) => `${API_BASE}/team?teamId=${encodeURIComponent(teamId)}`,
  suspects: () => `${API_BASE}/suspects`,
  history: (teamId, suspectId) => `${API_BASE}/history?teamId=${encodeURIComponent(teamId)}&suspectId=${encodeURIComponent(suspectId)}`,
  notes: (teamId, suspectId) => `${API_BASE}/notes?teamId=${encodeURIComponent(teamId)}&suspectId=${encodeURIComponent(suspectId)}`,
  saveNotes: () => `${API_BASE}/notes`,
}
