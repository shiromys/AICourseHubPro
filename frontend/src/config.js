// frontend/src/config.js

// 1. Log the variable to the console so we can debug (remove this later)
console.log("Vite API URL:", import.meta.env.VITE_API_BASE_URL);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default API_BASE_URL;