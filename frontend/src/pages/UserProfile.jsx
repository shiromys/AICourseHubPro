import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import API_BASE_URL from '../config';
import { 
  User, Lock, Save, BookOpen, Award, 
  CheckCircle, AlertCircle, Loader2 
} from 'lucide-react';

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('activity');
  const [user, setUser] = useState({ name: '', email: '', role: '' });
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form States
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [updateStatus, setUpdateStatus] = useState({ type: '', msg: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  // --- DEDUPLICATION HELPER ---
  const getUniqueEnrollments = (rawList) => {
    const map = new Map();
    rawList.forEach(item => {
      const existing = map.get(item.id);
      if (!existing) {
        map.set(item.id, item);
      } else {
        // Keep the one with better progress
        if (item.progress > existing.progress || item.status === 'completed') {
          map.set(item.id, item);
        }
      }
    });
    return Array.from(map.values());
  };

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      const name = localStorage.getItem('user_name');
      const role = localStorage.getItem('user_role');
      setUser({ name: name || 'Student', role: role || 'Student' });

      // Get Activity
      const res = await axios.get(`${API_BASE_URL}/api/my-enrollments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Clean duplicate entries from bad DB data
      const cleanList = getUniqueEnrollments(res.data);
      setEnrollments(cleanList);
      
      setLoading(false);
    } catch (err) {
      console.error("Error loading profile:", err);
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setUpdateStatus({ type: '', msg: '' });

    if (passwords.new.length < 6) {
      return setUpdateStatus({ type: 'error', msg: 'Password must be at least 6 characters.' });
    }
    if (passwords.new !== passwords.confirm) {
      return setUpdateStatus({ type: 'error', msg: 'Passwords do not match.' });
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/profile`, 
        { password: passwords.new },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUpdateStatus({ type: 'success', msg: 'Password updated successfully!' });
      setPasswords({ new: '', confirm: '' });
    } catch (err) {
      setUpdateStatus({ type: 'error', msg: 'Failed to update password. Try again.' });
    }
    setIsSaving(false);
  };

  // Derived Stats
  const completedCourses = enrollments.filter(e => e.status === 'completed').length;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-red-600" size={40}/></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          
          {/* HEADER SECTION */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-black text-gray-900">{user.name}</h1>
              <div className="flex items-center justify-center md:justify-start gap-4 mt-2 text-sm text-gray-500 font-medium">
                <span className="flex items-center gap-1"><User size={16}/> {user.role} Account</span>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-6 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8 mt-6 md:mt-0">
              <div className="text-center">
                <div className="text-2xl font-black text-gray-900">{enrollments.length}</div>
                <div className="text-xs font-bold text-gray-400 uppercase">Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-green-600">{completedCourses}</div>
                <div className="text-xs font-bold text-gray-400 uppercase">Certificates</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* SIDEBAR NAVIGATION */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <button 
                  onClick={() => setActiveTab('activity')}
                  className={`w-full text-left px-6 py-4 font-bold text-sm flex items-center gap-3 transition ${activeTab === 'activity' ? 'bg-red-50 text-red-600 border-l-4 border-red-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <BookOpen size={18}/> Learning Activity
                </button>
                <button 
                  onClick={() => setActiveTab('security')}
                  className={`w-full text-left px-6 py-4 font-bold text-sm flex items-center gap-3 transition ${activeTab === 'security' ? 'bg-red-50 text-red-600 border-l-4 border-red-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Lock size={18}/> Security & Password
                </button>
              </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="lg:col-span-3">
              
              {/* --- ACTIVITY TAB --- */}
              {activeTab === 'activity' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 animate-fade-in">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><BookOpen className="text-red-600"/> Course History</h2>
                  
                  {enrollments.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <BookOpen size={48} className="mx-auto text-gray-300 mb-4"/>
                      <p className="text-gray-500 font-medium">You haven't enrolled in any courses yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {enrollments.map((course, idx) => (
                        <div key={idx} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition bg-gray-50">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">{course.title}</h3>
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold border ${course.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                {course.status === 'completed' ? 'Completed' : 'In Progress'}
                              </span>
                            </div>
                            {course.status === 'completed' && <Award className="text-yellow-500" size={24} />}
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                            <div className={`h-2.5 rounded-full transition-all duration-1000 ${course.status === 'completed' ? 'bg-green-500' : 'bg-red-600'}`} style={{ width: `${course.progress}%` }}></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 font-medium">
                            <span>{course.progress}% Complete</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* --- SECURITY TAB --- */}
              {activeTab === 'security' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 animate-fade-in">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><Lock className="text-red-600"/> Change Password</h2>
                  
                  {updateStatus.msg && (
                    <div className={`p-4 rounded-lg mb-6 text-sm font-bold flex items-center gap-2 ${updateStatus.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                      {updateStatus.type === 'error' ? <AlertCircle size={18}/> : <CheckCircle size={18}/>}
                      {updateStatus.msg}
                    </div>
                  )}

                  <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                      <input 
                        type="password" 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-600 outline-none transition"
                        placeholder="••••••••"
                        value={passwords.new}
                        onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Confirm New Password</label>
                      <input 
                        type="password" 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-600 outline-none transition"
                        placeholder="••••••••"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                      Update Password
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;