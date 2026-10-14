export const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3000').replace(/\/$/, '')
export const img = p => (!p ? '' : /^https?:/.test(p) ? p : API_BASE + p)
