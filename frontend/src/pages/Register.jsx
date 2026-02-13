import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'; // Added icons for better UX
import API_BASE_URL from '../config';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  
  // New States for Feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/signup`, formData);
      
      // 1. Show Success Message
      setSuccess("Registration successful! Redirecting to login...");
      
      // 2. Clear Form
      setFormData({ name: '', email: '', password: '' });

      // 3. Wait 2 seconds so user can read the message, then redirect
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.msg || "Signup failed. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      <div className="container mx-auto px-6 py-24 flex justify-center">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-black mb-6 text-center">Create Account</h2>
          
          {/* --- SUCCESS MESSAGE (New Feature) --- */}
          {success && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 text-sm font-bold border border-green-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle size={20} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* --- ERROR MESSAGE --- */}
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm font-bold border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
              <input 
                type="text" 
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none transition"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={loading || success} // Disable input while loading/success
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none transition"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={loading || success}
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input 
                type={showPassword ? "text" : "password"}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none pr-10 transition"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                disabled={loading || success}
              />
               <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                disabled={loading || success}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            <button 
              type="submit"
              disabled={loading || success}
              className={`w-full py-3 text-white font-bold rounded-lg transition shadow-md flex items-center justify-center gap-2 ${
                loading || success 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-red-600 hover:bg-red-700 hover:shadow-lg"
              }`}
            >
              {loading ? "Creating Account..." : success ? "Success!" : "Sign Up"}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
              Already have an account? <Link to="/login" className="text-red-600 font-bold hover:underline">Log In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;