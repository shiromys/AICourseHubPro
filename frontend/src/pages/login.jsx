import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, LogIn, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Navbar from '../components/Navbar';
import API_BASE_URL from '../config';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API_BASE_URL}/api/login`, { 
        email: formData.email, 
        password: formData.password 
      });
      
      // 1. Save Token & User Info
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user_role', res.data.user_role);
      
      // --- FIX IS HERE: SAVE THE NAME ---
      // We check if the backend sent 'name' or 'user_name' to be safe
      const nameToSave = res.data.name || res.data.user_name || "Student";
      localStorage.setItem('user_name', nameToSave);
      // ----------------------------------

      // 2. CHECK FOR PENDING COURSE *BEFORE* CLEARING ANYTHING
      const pendingCourseId = localStorage.getItem('pendingCourseId');

      // 3. Force a small delay to ensure storage writes complete
      setTimeout(() => {
        if (res.data.is_admin) {
           navigate('/admin-dashboard');
        } 
        else if (pendingCourseId) {
            navigate(`/courses/${pendingCourseId}`);
        } 
        else {
            navigate('/dashboard');
        }
      }, 100);

    } catch (err) {
      console.error("Login Failed:", err);
      if (err.response && err.response.data && err.response.data.msg) {
        setError(err.response.data.msg);
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black font-sans text-gray-100 flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl animate-fade-in">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400 text-sm">Sign in to access your courses</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg flex items-center gap-2 text-sm mb-6">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="email" 
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-black border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-red-600 focus:outline-none transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-black border border-gray-700 rounded-lg py-3 pl-10 pr-10 text-white focus:border-red-600 focus:outline-none transition-colors"
                  placeholder="••••••••"
                />
                
                {/* Eye Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link 
                to="/forgot-password" 
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-red-900/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <LogIn size={20} />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-red-500 font-bold hover:text-red-400 transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;