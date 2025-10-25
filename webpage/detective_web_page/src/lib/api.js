// Centralized API configuration for the frontend
export const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'https://across-genuine-lending-henry.trycloudflare.com/'

// Helper function to add ngrok bypass headers
const fetchWithNgrokBypass = (url, options = {}) => {
  return fetch(url, {
    ...options,
    mode: 'cors',
    headers: {
      ...options.headers,
      'ngrok-skip-browser-warning': 'true',
      'User-Agent': 'DetectiveGame/1.0'
    }
  });
};

export const endpoints = {
  registerTeam: () => `${API_BASE}/register-team`,
  getTeam: (teamId) => `${API_BASE}/team?teamId=${encodeURIComponent(teamId)}`,
  suspects: () => `${API_BASE}/suspects`,
  history: (teamId, suspectId) => `${API_BASE}/history?teamId=${encodeURIComponent(teamId)}&suspectId=${encodeURIComponent(suspectId)}`,
  notes: (teamId, suspectId) => `${API_BASE}/notes?teamId=${encodeURIComponent(teamId)}&suspectId=${encodeURIComponent(suspectId)}`,
  saveNotes: () => `${API_BASE}/notes`,
}

// Export API functions with ngrok bypass
export const registerTeam = (members) => 
  fetchWithNgrokBypass(endpoints.registerTeam(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ members })
  }).then(res => res.json());

export const getTeam = (teamId) => 
  fetchWithNgrokBypass(endpoints.getTeam(teamId))
    .then(res => res.json());

export const getSuspects = () => 
  fetchWithNgrokBypass(endpoints.suspects())
    .then(res => res.json());

export const getChatHistory = (teamId, suspectId) => 
  fetchWithNgrokBypass(endpoints.history(teamId, suspectId))
    .then(res => res.json());

export const getNotes = (teamId, suspectId) => 
  fetchWithNgrokBypass(endpoints.notes(teamId, suspectId))
    .then(res => res.json());

export const saveNotes = (teamId, suspectId, notes, connections) => 
  fetchWithNgrokBypass(endpoints.saveNotes(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId, suspectId, notes, connections })
  }).then(res => res.json());
