import React from 'react';
import { AlertTriangle } from 'lucide-react';

const Maintenance = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-100 max-w-md">
        <div className="bg-yellow-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={40} className="text-yellow-600" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-3">Under Maintenance</h1>
        <p className="text-gray-500 mb-8">
          We are currently updating our platform to serve you better. 
          Please check back in a few minutes.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition"
        >
          Refresh Page
        </button>
      </div>
      <p className="mt-8 text-xs text-gray-400">ADMINS: You can still log in via /login</p>
    </div>
  );
};

export default Maintenance;