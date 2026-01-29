import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { User, Lock, Save, Shield, Eye, EyeOff } from 'lucide-react';

const Profile = () => {
  const [formData, setFormData] = useState({ name: '', password: '', confirmPassword: '' });
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  // --- TOGGLE STATE ---
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem('user_name');
    const storedRole = localStorage.getItem('user_role');
    
    setFormData(prev => ({ ...prev, name: storedName || '' }));
    setRole(storedRole || 'Student');
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (formData.password && formData.password !== formData.confirmPassword) {
      setMsg({ type: 'error', text: "Passwords do not match." });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.put('http://localhost:5000/api/profile', 
        { 
          name: formData.name, 
          password: formData.password || undefined 
        }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.setItem('user_name', res.data.name);
      setMsg({ type: 'success', text: "Profile updated successfully!" });
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' })); 
    } catch (error) {
      setMsg({ type: 'error', text: error.response?.data?.msg || "Update failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      
      <div className="container mx-auto px-6 py-24 flex justify-center">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          
          <div className="bg-black p-8 text-center">
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-3xl shadow-lg border-4 border-gray-900">
              {formData.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-2xl font-black text-white">{formData.name}</h2>
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mt-1 uppercase font-bold tracking-wider">
               <Shield size={14} /> {role} Account
            </div>
          </div>

          <div className="p-8">
            {msg.text && (
              <div className={`p-4 rounded-lg mb-6 text-sm font-bold text-center ${msg.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                {msg.text}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-6">
              
              {/* Name Field */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <User size={16} className="text-red-600"/> Full Name
                </label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition font-medium"
                />
              </div>

              <div className="border-t border-gray-100 my-6"></div>

              {/* Password Field */}
              <div className="relative">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Lock size={16} className="text-red-600"/> New Password (Optional)
                </label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Leave blank to keep current"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Confirm Password Field */}
              <div className="relative">
                <label className="block text-sm font-bold text-gray-700 mb-2">Confirm New Password</label>
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
              >
                {loading ? "Saving..." : <><Save size={20} /> Save Changes</>}
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;