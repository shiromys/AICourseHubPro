// frontend/src/config.js

// 1. If we are in Vite "Production" mode, use the Environment Variable
// 2. Otherwise, fallback to Localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default API_BASE_URL;