import React, { useState } from 'react';
import axios from 'axios';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await axios.post('http://localhost:5000/api/forgot-password', { email });
      setStatus('success');
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white mb-2">Forgot Password?</h2>
          <p className="text-gray-400 text-sm">Enter your email and we'll send you a recovery link.</p>
        </div>

        {status === 'success' ? (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="bg-green-500/10 text-green-500 p-4 rounded-xl border border-green-500/20">
              <p className="font-bold">Email Sent!</p>
              <p className="text-xs opacity-80 mt-1">Check your inbox (and spam) for the reset link.</p>
            </div>
            <Link to="/login" className="block text-gray-400 hover:text-white text-sm">Return to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-red-600 focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {status === 'loading' ? <Loader2 className="animate-spin" /> : 'Send Reset Link'}
            </button>
            
            <Link to="/login" className="flex items-center justify-center gap-2 text-gray-500 hover:text-white text-sm transition">
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;