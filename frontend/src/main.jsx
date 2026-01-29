import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import axios from 'axios';

// --- GLOBAL AXIOS INTERCEPTOR ---
// This code runs for every HTTP request across the entire app.
axios.interceptors.response.use(
  (response) => {
    // If the request succeeds, just return the data.
    return response;
  },
  (error) => {
    // If the request fails...
    if (error.response && error.response.status === 401) {
      // Check if it was a 401 Unauthorized (Expired Token)
      console.log("Session expired. Logging out...");
      
      // 1. Clear any stale data
      localStorage.clear();
      
      // 2. Redirect to Login page
      // (We use window.location because we are outside the React Router context here)
      if (window.location.pathname !== '/login') {
         window.location.href = '/login';
      }
    }
    // Return the error so the specific page can handle other errors (like 404 or 500)
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);