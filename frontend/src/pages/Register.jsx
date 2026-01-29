import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import API_BASE_URL from '../config';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post(`${API_BASE_URL}/api/signup`, formData);
      alert("Account created! Please log in.");
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.msg || "Signup failed. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      <div className="container mx-auto px-6 py-24 flex justify-center">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-black mb-6 text-center">Create Account</h2>
          
          {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm font-bold">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
              <input 
                type="text" 
                className="w-full p-3 border border-gray-300 rounded focus:border-red-500 outline-none"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                className="w-full p-3 border border-gray-300 rounded focus:border-red-500 outline-none"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input 
                type={showPassword ? "text" : "password"}
                className="w-full p-3 border border-gray-300 rounded focus:border-red-500 outline-none pr-10"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
               <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button className="w-full py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition shadow-lg">
              Sign Up
            </button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-500">
             Already have an account? <Link to="/login" className="text-red-600 font-bold hover:underline">Log In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;