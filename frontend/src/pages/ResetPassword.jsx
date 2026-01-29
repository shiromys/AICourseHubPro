import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react'; // <--- Added Eye, EyeOff

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // Get token from URL
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [showPassword, setShowPassword] = useState(false); // <--- New State

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    
    if (!token) {
        alert("Invalid Link");
        setStatus('error');
        return;
    }

    try {
      // Send the token in the Header as Authorization
      await axios.post('http://localhost:5000/api/reset-password', 
        { new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } } 
      );
      setStatus('success');
      setTimeout(() => navigate('/login'), 3000); // Redirect after 3s
    } catch (err) {
      alert("Link expired or invalid. Please request a new one.");
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Reset Password</h2>

        {status === 'success' ? (
          <div className="text-center text-green-500 space-y-4">
            <CheckCircle size={48} className="mx-auto" />
            <p className="font-bold">Password Updated!</p>
            <p className="text-sm text-gray-400">Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">New Password</label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} // <--- Dynamic Type
                  required 
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-lg py-3 pl-10 pr-10 text-white focus:border-red-600 focus:outline-none"
                  placeholder="Enter new password"
                />
                
                {/* --- EYE TOGGLE BUTTON --- */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {status === 'loading' ? <Loader2 className="animate-spin" /> : 'Set New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;