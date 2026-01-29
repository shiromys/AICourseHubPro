// frontend/src/config.js
const backendUrl = import.meta.env.VITE_API_BASE_URL;

// Debug: Let's see if the variable exists
console.log("Vite Env Check:", backendUrl);

const API_BASE_URL = backendUrl || "http://localhost:5000";

export default API_BASE_URL;