import React, { useEffect } from 'react';
import API_BASE_URL from '../config';

const ScormPlayer = ({ launchUrl, onClose }) => {
  useEffect(() => {
    // Initialize SCORM API mock
    window.API = {
      LMSInitialize: () => "true",
      LMSGetValue: () => "",
      LMSSetValue: (el, val) => console.log(`SCORM Set: ${el}=${val}`),
      LMSCommit: () => "true",
      LMSFinish: () => "true",
      LMSGetLastError: () => "0"
    };
    return () => { window.API = null; };
  }, []);

  const fullUrl = `${API_BASE_URL}${launchUrl}`;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ background: 'white', padding: '10px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ background: 'red', color: 'white', padding: '5px 10px', border: 'none', cursor: 'pointer' }}>
          Close Player
        </button>
      </div>
      <iframe src={fullUrl} style={{ flex: 1, border: 'none', background: 'white' }} title="Course Content" />
    </div>
  );
};

export default ScormPlayer;