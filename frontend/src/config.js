// frontend/src/config.js
// API base URL - points to Flask backend on Railway.
// Uses VITE_API_URL if set (e.g. on the staging frontend service, pointed at
// the staging backend); falls back to production if not set, so production
// behavior is unchanged.
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.aicoursehubpro.com";

export default API_BASE_URL;