import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config'; 
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  LineChart, Line
} from 'recharts';
import { 
  LayoutDashboard, BookOpen, DollarSign, Users, Mail, Activity, Plus, 
  Edit, Search, Settings, FileText, Ban, LogOut, Eye, X, Save, Archive, Upload,
  Trash2, RefreshCcw, ShieldAlert, AlertTriangle, Shield, ShieldCheck, CheckCircle,
  CheckSquare, HelpCircle, Bell, ChevronDown, User as UserIcon
} from 'lucide-react';

// --- MOCK DATA (Fallback) ---
const MOCK_REVENUE_DATA = [
  { name: 'Jan', revenue: 0 }, { name: 'Feb', revenue: 0 },
  { name: 'Mar', revenue: 0 }, { name: 'Apr', revenue: 0 },
  { name: 'May', revenue: 0 }, { name: 'Jun', revenue: 0 },
  { name: 'Jul', revenue: 0 },
];

// --- SUB-COMPONENT: SIDEBAR BUTTON ---
const SidebarItem = ({ id, icon: Icon, label, activeTab, setActiveTab }) => (
  <button 
    onClick={() => setActiveTab(id)} 
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-1 ${
      activeTab === id 
      ? 'bg-red-600 text-white shadow-md' 
      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`}
  >
    <Icon size={18} /> <span className="font-medium text-sm">{label}</span>
  </button>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null); 
  const [activeTab, setActiveTab] = useState('overview'); 
  
  // --- DYNAMIC ADMIN IDENTITY ---
  const [adminName, setAdminName] = useState("Admin User");
  const [adminInitials, setAdminInitials] = useState("AD");

  // --- DATA STATES ---
  const [courses, setCourses] = useState([]); 
  const [users, setUsers] = useState([]); 
  const [stats, setStats] = useState({ revenue: 0, students: 0, courses: 0, uptime: "99.9%", chart_data: [], recent_messages: [] });
  const [transactions, setTransactions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [logs, setLogs] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({ maintenance: false, registrations: true });

  // --- DROPDOWN STATES ---
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // --- MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', price: 29, category: 'HR', modules: [] });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banDuration, setBanDuration] = useState(30);

  // --- CLOSE TICKET MODAL STATE ---
  const [isCloseTicketModalOpen, setIsCloseTicketModalOpen] = useState(false);
  const [messageToClose, setMessageToClose] = useState(null);

  // --- 1. FETCH DATA CONTROLLER ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedName = localStorage.getItem('user_name');

    if(token) {
      // Set Dynamic Name & Initials
      if (storedName) {
          setAdminName(storedName);
          // Logic: "Akash Kumar" -> "AK", "Akash" -> "AK" (default) or "A"
          const parts = storedName.trim().split(' ');
          let initials = parts[0][0];
          if (parts.length > 1) {
              initials += parts[parts.length - 1][0];
          }
          setAdminInitials(initials.toUpperCase());
      }

      setLoading(true);
      fetchCourses(token); 
      
      if (activeTab === 'overview') {
         fetchStats(token); 
         fetchUsers(token, 'active');
      } else if (activeTab === 'users') {
         fetchUsers(token, 'active');
      } else if (activeTab === 'deleted_users') {
         fetchUsers(token, 'deleted');
      } else if (activeTab === 'revenue') {
         fetchTransactions(token);
      } else if (activeTab === 'support') {
         fetchMessages(token);
      } else if (activeTab === 'audit') {
         fetchLogs(token);
      } else {
         setLoading(false); 
      }
    } else {
        navigate('/login');
    }
  }, [activeTab, navigate]);

  // --- API CALLS ---
  const fetchStats = async (token) => { try { const res = await axios.get(`${API_BASE_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }); setStats(res.data); } catch (e) { console.error("Stats error", e); } };
  const fetchCourses = async (token) => { try { const res = await axios.get(`${API_BASE_URL}/api/courses`, { headers: { Authorization: `Bearer ${token}` } }); setCourses(res.data); } catch (e) { console.error("Courses error", e); } };
  const fetchUsers = async (token, type) => { try { const res = await axios.get(`${API_BASE_URL}/api/users?type=${type}`, { headers: { Authorization: `Bearer ${token}` } }); setUsers(res.data); } catch (e) { console.error("Users error", e); } finally { setLoading(false); } };
  const fetchTransactions = async (token) => { try { const res = await axios.get(`${API_BASE_URL}/api/admin/transactions`, { headers: { Authorization: `Bearer ${token}` } }); setTransactions(res.data); } catch (e) { console.error("Tx error", e); } finally { setLoading(false); } };
  const fetchMessages = async (token) => { try { const res = await axios.get(`${API_BASE_URL}/api/admin/messages`, { headers: { Authorization: `Bearer ${token}` } }); setMessages(res.data); } catch (e) { console.error("Msg error", e); } finally { setLoading(false); } };
  const fetchLogs = async (token) => { try { const res = await axios.get(`${API_BASE_URL}/api/admin/logs`, { headers: { Authorization: `Bearer ${token}` } }); setLogs(res.data); } catch (e) { console.error("Log error", e); } finally { setLoading(false); } };

  // --- USER HANDLERS ---
  const handleToggleAdmin = async (user) => {
    if(!window.confirm(`Change admin status for ${user.name}?`)) return;
    try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_BASE_URL}/api/users/${user.id}/role`, { is_admin: user.role !== 'Admin' }, { headers: { Authorization: `Bearer ${token}` } });
        fetchUsers(token, 'active');
    } catch (error) { alert("Failed to update role"); }
  };
  
  const openBanModal = (user) => { setSelectedUser(user); setBanDuration(30); setIsBanModalOpen(true); };
  const handleConfirmBan = async () => { const token = localStorage.getItem('token'); await axios.post(`${API_BASE_URL}/api/users/${selectedUser.id}/ban`, { days: banDuration }, { headers: { Authorization: `Bearer ${token}` } }); setIsBanModalOpen(false); fetchUsers(token, 'active'); };
  const handleUnban = async (user) => { const token = localStorage.getItem('token'); await axios.post(`${API_BASE_URL}/api/users/${user.id}/ban`, { days: 0 }, { headers: { Authorization: `Bearer ${token}` } }); fetchUsers(token, 'active'); };
  const handleDeleteUser = async (user) => { if(!window.confirm("Delete user?")) return; const token = localStorage.getItem('token'); await axios.delete(`${API_BASE_URL}/api/users/${user.id}/delete`, { headers: { Authorization: `Bearer ${token}` } }); fetchUsers(token, 'active'); };
  const handleRestoreUser = async (user) => { const token = localStorage.getItem('token'); await axios.post(`${API_BASE_URL}/api/users/${user.id}/restore`, {}, { headers: { Authorization: `Bearer ${token}` } }); fetchUsers(token, 'deleted'); };
  
  // --- COURSE HANDLERS ---
  const handleSaveCourse = async () => { const token = localStorage.getItem('token'); const res = await axios.post(`${API_BASE_URL}/api/courses`, newCourse, { headers: { Authorization: `Bearer ${token}` } }); setCourses([...courses, res.data]); setIsModalOpen(false); };
  const handleUpdateCourse = async () => { const token = localStorage.getItem('token'); await axios.put(`${API_BASE_URL}/api/courses/${editingCourse.id}`, editingCourse, { headers: { Authorization: `Bearer ${token}` } }); setIsEditModalOpen(false); fetchCourses(token); };
  const handleDeleteCourse = async (id) => { if(!window.confirm("Archive course?")) return; const token = localStorage.getItem('token'); await axios.delete(`${API_BASE_URL}/api/courses/${id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchCourses(token); };

  // --- TICKET HANDLERS ---
  const initiateCloseTicket = (id) => { setMessageToClose(id); setIsCloseTicketModalOpen(true); };
  const confirmCloseTicket = async () => {
    try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_BASE_URL}/api/admin/messages/${messageToClose}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
        setMessages(prev => prev.filter(msg => msg.id !== messageToClose));
        setIsCloseTicketModalOpen(false);
    } catch (error) { alert("Error closing ticket."); }
  };

  // --- BUILDER HANDLERS ---
  const handleAddModule = (isEdit) => { const t = isEdit ? editingCourse : newCourse; const u = {...t, modules: [...t.modules, {title: "New Module", lessons: []}]}; isEdit ? setEditingCourse(u) : setNewCourse(u); };
  const handleAddLesson = (mIdx, isEdit) => { const t = isEdit ? editingCourse : newCourse; const u = [...t.modules]; u[mIdx].lessons.push({title: "New Lesson", type: "text", content: ""}); isEdit ? setEditingCourse({...t, modules: u}) : setNewCourse({...t, modules: u}); };
  const handleModuleTitleChange = (i, v, isEdit) => { const t = isEdit ? editingCourse : newCourse; const u = [...t.modules]; u[i].title = v; isEdit ? setEditingCourse({...t, modules: u}) : setNewCourse({...t, modules: u}); };
  const handleLessonTitleChange = (mIdx, lIdx, v, isEdit) => { const t = isEdit ? editingCourse : newCourse; const u = [...t.modules]; u[mIdx].lessons[lIdx].title = v; isEdit ? setEditingCourse({...t, modules: u}) : setNewCourse({...t, modules: u}); };
  
  // --- HELPERS ---
  const handleOpenModal = () => { setNewCourse({ title: '', description: '', price: 29, category: 'HR', modules: [] }); setIsModalOpen(true); };
  const openEditModal = (course) => { setEditingCourse({ ...course, modules: course.modules || [] }); setIsEditModalOpen(true); };
  
  const handleJsonUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (json.title && Array.isArray(json.modules)) {
          setNewCourse({ ...json, price: json.price || 29 });
          alert("JSON Loaded Successfully!");
        } else { alert("Invalid JSON format."); }
      } catch (error) { alert("Error parsing JSON."); }
    };
    reader.readAsText(file);
  };

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  return (
    <div className="flex min-h-screen bg-gray-900 font-sans text-gray-100 relative">
      
      {/* BAN MODAL */}
      {isBanModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-xl max-w-sm w-full border border-gray-700">
                <h3 className="text-xl font-bold mb-4">Ban User</h3>
                <button onClick={handleConfirmBan} className="bg-red-600 w-full py-2 rounded font-bold hover:bg-red-700">Confirm Ban</button>
                <button onClick={() => setIsBanModalOpen(false)} className="mt-2 w-full py-2 text-gray-400 hover:text-white">Cancel</button>
            </div>
        </div>
      )}

      {/* CLOSE TICKET MODAL */}
      {isCloseTicketModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-xl max-w-sm w-full border border-gray-700 shadow-2xl">
                <div className="flex flex-col items-center text-center mb-4">
                    <div className="p-3 bg-yellow-500/10 rounded-full text-yellow-500 mb-3"><HelpCircle size={32} /></div>
                    <h3 className="text-xl font-bold text-white">Pending Action</h3>
                    <p className="text-gray-400 text-sm mt-2">Have you replied to this user via email?</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsCloseTicketModalOpen(false)} className="flex-1 py-2.5 border border-gray-600 rounded-lg text-gray-300 font-bold hover:bg-gray-700">No, Cancel</button>
                    <button onClick={confirmCloseTicket} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold">Yes, Close Ticket</button>
                </div>
            </div>
        </div>
      )}

      {/* COURSE MODAL */}
      {(isModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-gray-800 p-6 rounded-xl max-w-4xl w-full h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
                  <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          {isEditModalOpen ? <><Edit size={24} className="text-blue-500"/> Edit Course</> : <><Plus size={24} className="text-red-500"/> Create New Course</>}
                      </h2>
                      <div className="flex items-center gap-4">
                          {!isEditModalOpen && (
                              <>
                                  <input type="file" accept=".json" ref={fileInputRef} onChange={handleJsonUpload} className="hidden" />
                                  <button onClick={() => fileInputRef.current.click()} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded flex items-center gap-2 transition"><Upload size={14} /> Import JSON</button>
                              </>
                          )}
                          <button onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }} className="text-gray-400 hover:text-white transition"><X size={24} /></button>
                      </div>
                  </div>
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Course Title</label>
                            <input className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-red-500 outline-none" value={isEditModalOpen ? editingCourse.title : newCourse.title} onChange={e => isEditModalOpen ? setEditingCourse({...editingCourse, title: e.target.value}) : setNewCourse({...newCourse, title: e.target.value})}/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Category</label>
                            <select className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-red-500 outline-none" value={isEditModalOpen ? editingCourse.category : newCourse.category} onChange={e => isEditModalOpen ? setEditingCourse({...editingCourse, category: e.target.value}) : setNewCourse({...newCourse, category: e.target.value})}>
                                <option>HR</option><option>Development</option><option>Marketing</option><option>Business</option>
                            </select>
                        </div>
                      </div>
                      <div>
                          <label className="text-xs text-gray-400 uppercase font-bold">Price ($)</label>
                          <input className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-red-500 outline-none" type="number" value={isEditModalOpen ? editingCourse.price : newCourse.price} onChange={e => isEditModalOpen ? setEditingCourse({...editingCourse, price: parseFloat(e.target.value)}) : setNewCourse({...newCourse, price: parseFloat(e.target.value)})}/>
                      </div>
                      <div>
                          <label className="text-xs text-gray-400 uppercase font-bold">Description</label>
                          <textarea className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-red-500 outline-none" rows="3" value={isEditModalOpen ? editingCourse.description : newCourse.description} onChange={e => isEditModalOpen ? setEditingCourse({...editingCourse, description: e.target.value}) : setNewCourse({...newCourse, description: e.target.value})}/>
                      </div>
                      <div className="border-t border-gray-700 pt-6">
                          <div className="flex justify-between items-center mb-4"><h4 className="font-bold text-gray-300 uppercase text-sm">Curriculum Builder</h4><button onClick={() => handleAddModule(isEditModalOpen)} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded flex items-center gap-1"><Plus size={14}/> Add Module</button></div>
                          {(isEditModalOpen ? editingCourse.modules : newCourse.modules).map((mod, i) => (
                              <div key={i} className="mb-4 p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                                  <div className="flex items-center gap-3 mb-3"><span className="text-xs font-bold text-gray-500 bg-gray-800 px-2 py-1 rounded">MOD {i+1}</span><input className="bg-transparent text-white font-bold flex-1 outline-none border-b border-gray-700 focus:border-blue-500" value={mod.title} onChange={e => handleModuleTitleChange(i, e.target.value, isEditModalOpen)} placeholder="Module Title" /><button onClick={() => handleAddLesson(i, isEditModalOpen)} className="text-xs text-green-400 hover:text-green-300 font-bold">+ Lesson</button></div>
                                  <div className="space-y-2 pl-2 border-l-2 border-gray-800 ml-4">{mod.lessons.map((les, j) => (<div key={j} className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div><input className="bg-gray-800 text-sm px-3 py-1.5 rounded text-gray-300 w-full border border-transparent focus:border-gray-600 outline-none" value={les.title} onChange={e => handleLessonTitleChange(i, j, e.target.value, isEditModalOpen)} placeholder="Lesson Title"/></div>))}</div>
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="pt-6 border-t border-gray-700 flex justify-end gap-3 mt-6">
                      <button onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }} className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 font-bold hover:bg-gray-700">Cancel</button>
                      <button onClick={isEditModalOpen ? handleUpdateCourse : handleSaveCourse} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg flex items-center gap-2"><Save size={18}/> {isEditModalOpen ? "Update Course" : "Save & Publish"}</button>
                  </div>
              </div>
          </div>
      )}

      {/* SIDEBAR */}
      <div className="w-64 bg-black border-r border-gray-800 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-red-900/20">A</div>
          <span className="font-bold text-xl tracking-tight text-white">ADMIN PANEL</span>
        </div>
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          <p className="text-xs font-bold text-gray-600 uppercase mb-2 px-2 mt-2">Main</p>
          <SidebarItem id="overview" icon={LayoutDashboard} label="Dashboard" activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarItem id="courses" icon={BookOpen} label="Courses" activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarItem id="users" icon={Users} label="Active Users" activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarItem id="deleted_users" icon={Trash2} label="Deleted Accounts" activeTab={activeTab} setActiveTab={setActiveTab} />
          <p className="text-xs font-bold text-gray-600 uppercase mt-6 mb-2 px-2">Finance</p>
          <SidebarItem id="revenue" icon={DollarSign} label="Revenue & Sales" activeTab={activeTab} setActiveTab={setActiveTab} />
          <p className="text-xs font-bold text-gray-600 uppercase mt-6 mb-2 px-2">System</p>
          <SidebarItem id="support" icon={Mail} label="Support Inbox" activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarItem id="audit" icon={FileText} label="Audit Logs" activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarItem id="system" icon={Activity} label="System Health" activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarItem id="settings" icon={Settings} label="Global Settings" activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        <div className="p-4 border-t border-gray-800 space-y-2">
            <button onClick={() => navigate('/dashboard')} className="w-full py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition flex items-center justify-center gap-2 text-sm font-medium"><Eye size={16}/> Student View</button>
            <button onClick={handleLogout} className="w-full py-2 bg-red-900/10 border border-red-900/30 hover:bg-red-900/30 text-red-500 rounded-lg transition flex items-center justify-center gap-2 text-sm font-bold"><LogOut size={16}/> Log Out</button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 ml-64 p-8 bg-gray-900 min-h-screen">
        
        {/* --- HEADER (NOW DYNAMIC) --- */}
        <div className="flex justify-between items-center mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-sm sticky top-0 z-20">
          <div><h1 className="text-2xl font-bold text-white capitalize">{activeTab.replace('_', ' ')}</h1><p className="text-gray-400 text-xs mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Connected to PostgreSQL</p></div>
          <div className="flex items-center gap-6">
             
             {/* NOTIFICATION DROPDOWN */}
             <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 bg-gray-700 rounded-full text-gray-300 hover:text-white relative transition">
                    <Bell size={20} />
                    {stats.recent_messages && stats.recent_messages.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-700"></span>}
                </button>
                {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                            <span className="font-bold text-white text-sm">Notifications</span>
                            <span className="text-xs text-gray-500 cursor-pointer hover:text-white" onClick={() => setActiveTab('support')}>View All</span>
                        </div>
                        {(!stats.recent_messages || stats.recent_messages.length === 0) ? (
                            <div className="p-6 text-center text-gray-500 text-sm">No new messages</div>
                        ) : (
                            stats.recent_messages.map(msg => (
                                <div key={msg.id} className="p-4 hover:bg-gray-800 border-b border-gray-800 cursor-pointer" onClick={() => setActiveTab('support')}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-white font-bold text-sm truncate w-40">{msg.subject}</span>
                                        <span className="text-xs text-gray-500">{msg.time}</span>
                                    </div>
                                    <p className="text-xs text-gray-400">From: {msg.name}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}
             </div>

             {/* PROFILE DROPDOWN (DYNAMIC DATA) */}
             <div className="relative">
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 pl-4 border-l border-gray-700">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-white">{adminName}</p>
                        <p className="text-xs text-green-400">Super Admin</p>
                    </div>
                    {/* DYNAMIC INITIALS */}
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center font-bold text-white shadow-lg">
                        {adminInitials}
                    </div>
                    <ChevronDown size={14} className="text-gray-400"/>
                </button>
                {showProfileMenu && (
                    <div className="absolute right-0 mt-3 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
                        <button onClick={() => navigate('/dashboard')} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2">
                            <UserIcon size={16}/> Student View
                        </button>
                        <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-800 flex items-center gap-2 border-t border-gray-800">
                            <LogOut size={16}/> Sign Out
                        </button>
                    </div>
                )}
             </div>

          </div>
        </div>

        {/* --- TABS --- */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-green-500/50 transition-all group"><div className="flex justify-between items-start mb-4"><div className="p-3 rounded-lg bg-green-500/10 text-green-500 group-hover:bg-green-500 group-hover:text-white transition"><DollarSign size={24}/></div></div><h3 className="text-3xl font-black text-white">${stats.revenue}</h3><p className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">Total Revenue</p></div>
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all group"><div className="flex justify-between items-start mb-4"><div className="p-3 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition"><Users size={24}/></div></div><h3 className="text-3xl font-black text-white">{stats.students}</h3><p className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">Total Students</p></div>
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all group"><div className="flex justify-between items-start mb-4"><div className="p-3 rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition"><BookOpen size={24}/></div></div><h3 className="text-3xl font-black text-white">{stats.courses}</h3><p className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">Total Courses</p></div>
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-orange-500/50 transition-all group"><div className="flex justify-between items-start mb-4"><div className="p-3 rounded-lg bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition"><Activity size={24}/></div></div><h3 className="text-3xl font-black text-white">{stats.uptime}</h3><p className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">System Uptime</p></div>
            </div>
            
            {/* REVENUE CHART (WIRED TO REAL DATA) */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold mb-6 text-white">Revenue Overview</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.chart_data && stats.chart_data.length > 0 ? stats.chart_data : MOCK_REVENUE_DATA}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} />
                            <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} tickFormatter={val => `$${val}`} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                            <Area type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
          </div>
        )}

        {/* ... KEEPING ALL OTHER TABS UNCHANGED ... */}
        {activeTab === 'courses' && (<div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg"><div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50"><div className="relative w-96"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Search courses..." className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition" /></div><button onClick={handleOpenModal} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold shadow-lg shadow-red-900/30"><Plus size={18} /> Add New Course</button></div><table className="w-full text-left"><thead className="bg-gray-900 text-gray-400 text-xs uppercase font-bold tracking-wider"><tr><th className="px-6 py-4">Title</th><th className="px-6 py-4">Price</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Modules</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-gray-700">{courses.length === 0 ? <tr><td colSpan="5" className="text-center py-12 text-gray-500 italic">No courses available.</td></tr> : courses.map((course) => (<tr key={course.id} className="hover:bg-gray-700/30 transition"><td className="px-6 py-4 font-medium text-white">{course.title}</td><td className="px-6 py-4 text-green-400 font-bold">${course.price}</td><td className="px-6 py-4"><span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">{course.category}</span></td><td className="px-6 py-4 text-gray-400">{course.modules?.length || 0} Modules</td><td className="px-6 py-4 text-right flex justify-end gap-3"><button onClick={() => { setEditingCourse(course); setIsEditModalOpen(true); }} className="text-blue-400 hover:text-blue-300 bg-blue-400/10 p-2 rounded transition"><Edit size={18}/></button><button onClick={() => handleDeleteCourse(course.id)} className="text-red-400 hover:text-red-300 bg-red-400/10 p-2 rounded transition"><Archive size={18}/></button></td></tr>))}</tbody></table></div>)}
        {activeTab === 'users' && (<div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg"><div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50"><h3 className="font-bold text-lg text-white">Active User Directory</h3><span className="bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full">{users.length} Users</span></div><table className="w-full text-left"><thead className="bg-gray-900 text-gray-400 text-xs uppercase font-bold tracking-wider"><tr><th className="px-6 py-4">User</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-gray-700 text-sm">{users.map(user => (<tr key={user.id} className="hover:bg-gray-700/30 transition"><td className="px-6 py-4"><div className="font-bold text-white">{user.name}</div><div className="text-xs text-gray-500">{user.email}</div></td><td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold border ${user.role === 'Admin' ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' : 'bg-blue-500/20 border-blue-500/30 text-blue-400'}`}>{user.role}</span></td><td className="px-6 py-4">{user.status === 'Banned' ? <span className="text-red-500 font-bold flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded"><ShieldAlert size={14}/> Banned</span> : <span className="text-green-400 font-bold flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded"><CheckCircle size={14}/> Active</span>}</td><td className="px-6 py-4 text-right flex justify-end gap-2"><button onClick={() => handleToggleAdmin(user)} className={`p-2 rounded transition ${user.role === 'Admin' ? "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20" : "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white"}`}>{user.role === 'Admin' ? <ShieldCheck size={18} /> : <Shield size={18} />}</button>{user.status === 'Banned' ? (<button onClick={() => handleUnban(user)} className="p-2 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20"><ShieldAlert size={18}/></button>) : (<button onClick={() => openBanModal(user)} className="p-2 rounded bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"><Ban size={18}/></button>)}<button onClick={() => handleDeleteUser(user)} className="p-2 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 size={18}/></button></td></tr>))}</tbody></table></div>)}
        {activeTab === 'deleted_users' && (<div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"><div className="p-4 bg-red-900/20 text-red-300 text-sm border-b border-red-900/30 flex items-center gap-2 font-bold"><Trash2 size={16}/> These accounts are deactivated. Restore them to grant access again.</div><table className="w-full text-left"><thead className="bg-gray-900 text-gray-400 text-xs uppercase font-bold"><tr><th className="px-6 py-4">User</th><th className="px-6 py-4">Email</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-gray-700 text-sm">{users.length === 0 ? <tr><td colSpan="3" className="p-8 text-center text-gray-500 italic">No deleted users found.</td></tr> : users.map(user => (<tr key={user.id} className="hover:bg-gray-700/30 opacity-75"><td className="px-6 py-4 line-through text-gray-500 font-medium">{user.name}</td><td className="px-6 py-4 text-gray-500">{user.email}</td><td className="px-6 py-4 text-right"><button onClick={() => handleRestoreUser(user)} className="text-green-400 hover:text-green-300 flex items-center gap-2 ml-auto bg-green-900/20 px-3 py-1.5 rounded transition font-bold"><RefreshCcw size={16}/> Restore</button></td></tr>))}</tbody></table></div>)}
        {activeTab === 'revenue' && (<div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg"><div className="p-6 border-b border-gray-700 flex justify-between items-center"><h3 className="font-bold text-lg text-white">Transaction History</h3><button className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded transition">Export CSV</button></div><table className="w-full text-left"><thead className="bg-gray-900 text-gray-400 text-xs uppercase font-bold tracking-wider"><tr><th className="px-6 py-4">User</th><th className="px-6 py-4">Course</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Status</th></tr></thead><tbody className="divide-y divide-gray-700 text-sm">{transactions.length === 0 ? <tr><td colSpan="4" className="p-12 text-center text-gray-500 italic">No transactions found in database.</td></tr> : transactions.map((tx, i) => (<tr key={i} className="hover:bg-gray-700/30 transition"><td className="px-6 py-4 font-bold text-white">{tx.user}<div className="text-xs text-gray-500 font-normal">{tx.email}</div></td><td className="px-6 py-4 text-gray-300">{tx.course}</td><td className="px-6 py-4 text-gray-500 font-mono text-xs">{tx.date}</td><td className="px-6 py-4"><span className="text-green-400 text-xs border border-green-900 bg-green-900/20 px-2 py-1 rounded font-bold flex items-center gap-1 w-fit"><CheckCircle size={12}/> Paid</span></td></tr>))}</tbody></table></div>)}
        {activeTab === 'support' && (<div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg h-[80vh] flex flex-col"><div className="p-6 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center"><h3 className="font-bold text-lg flex items-center gap-2 text-white"><Mail className="text-blue-500"/> Support Inbox</h3><span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-1 rounded">{messages.length} Messages</span></div><div className="divide-y divide-gray-700 overflow-y-auto flex-1 custom-scrollbar">{messages.length === 0 ? <div className="p-20 text-center text-gray-500 italic">No support messages received yet.</div> : messages.map(msg => (<div key={msg.id} className={`p-6 transition cursor-pointer group ${msg.is_read ? 'opacity-50 hover:opacity-80' : 'hover:bg-gray-700/30'}`}><div className="flex justify-between mb-2"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow">{msg.name.charAt(0).toUpperCase()}</div><div><h4 className="font-bold text-white group-hover:text-blue-400 transition flex items-center gap-2">{msg.subject}{!msg.is_read && <span className="bg-red-500 text-white text-[10px] px-2 rounded-full">New</span>}</h4><p className="text-xs text-gray-400">From: <span className="text-white">{msg.name}</span> &lt;{msg.email}&gt;</p></div></div><span className="text-xs text-gray-500 font-mono">{msg.date}</span></div><div className="pl-13 ml-13 mt-3 bg-gray-900/50 p-4 rounded-lg border border-gray-700/50"><p className="text-sm text-gray-300 leading-relaxed">{msg.message}</p></div><div className="mt-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">{!msg.is_read && (<button onClick={() => initiateCloseTicket(msg.id)} className="text-xs bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600 flex items-center gap-1 shadow-md"><CheckSquare size={12}/> Close Ticket</button>)}</div></div>))}</div></div>)}
        {activeTab === 'audit' && (<div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg"><div className="p-6 border-b border-gray-700 bg-gray-800/50"><h3 className="font-bold text-lg flex items-center gap-2 text-white"><FileText className="text-orange-500"/> System Audit Logs</h3><p className="text-xs text-gray-500 mt-1">Tracking all administrative actions for security compliance.</p></div><table className="w-full text-left"><thead className="bg-gray-900 text-gray-400 text-xs uppercase font-bold tracking-wider"><tr><th className="px-6 py-4">Action</th><th className="px-6 py-4">Admin</th><th className="px-6 py-4">Details</th><th className="px-6 py-4">Time</th></tr></thead><tbody className="divide-y divide-gray-700 text-sm">{logs.map((log, i) => (<tr key={i} className="hover:bg-gray-700/30 transition"><td className="px-6 py-4 font-bold text-white flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500"></div>{log.action}</td><td className="px-6 py-4 text-gray-400 font-mono text-xs">{log.admin}</td><td className="px-6 py-4 text-gray-500 italic">{log.details}</td><td className="px-6 py-4 text-gray-500 font-mono text-xs">{log.date}</td></tr>))}</tbody></table></div>)}
        {activeTab === 'system' && (<div className="space-y-6"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg"><h3 className="font-bold mb-6 flex items-center gap-2 text-red-400"><Activity size={20} /> Live System Status</h3><div className="space-y-4"><div className="flex justify-between items-center p-4 bg-gray-900/50 rounded-lg border border-gray-700/50"><span className="text-gray-200 font-medium">Database Connection</span><span className="text-green-400 flex items-center gap-2 text-sm font-bold bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20"><CheckCircle size={14}/> Connected</span></div><div className="flex justify-between items-center p-4 bg-gray-900/50 rounded-lg border border-gray-700/50"><span className="text-gray-200 font-medium">API Response Time</span><span className="text-green-400 text-sm font-bold font-mono">24ms</span></div><div className="flex justify-between items-center p-4 bg-gray-900/50 rounded-lg border border-gray-700/50"><span className="text-gray-200 font-medium">Stripe Webhooks</span><span className="text-green-400 text-sm font-bold flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Listening</span></div><div className="flex justify-between items-center p-4 bg-gray-900/50 rounded-lg border border-gray-700/50"><span className="text-gray-200 font-medium">Storage Usage</span><div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[45%]"></div></div></div></div></div><div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col"><h3 className="font-bold mb-4 text-white">Server Load (Real-time)</h3><div className="h-64 flex-1"><ResponsiveContainer width="100%" height="100%"><LineChart data={[...Array(20)].map((_, i) => ({ time: i, load: 20 + Math.random() * 30 }))}><Line type="monotone" dataKey="load" stroke="#ef4444" strokeWidth={3} dot={false} isAnimationActive={true} /><CartesianGrid stroke="#374151" strokeDasharray="3 3" vertical={false} /><Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} /><XAxis hide /><YAxis hide domain={[0, 100]}/></LineChart></ResponsiveContainer></div><div className="mt-4 flex justify-between text-xs text-gray-500 font-mono"><span>00:00</span><span>Now</span></div></div></div></div>)}
        {activeTab === 'settings' && (<div className="bg-gray-800 rounded-xl border border-gray-700 p-8 max-w-3xl shadow-lg"><h3 className="font-bold mb-8 text-2xl text-white flex items-center gap-3"><Settings className="text-gray-400"/> Global Configurations</h3><div className="space-y-6"><div className="flex items-center justify-between p-6 bg-gray-900 rounded-xl border border-gray-700"><div><h4 className="font-bold text-gray-200 text-lg">Maintenance Mode</h4><p className="text-sm text-gray-500 mt-1">If enabled, non-admin users will see a "Under Maintenance" page.</p></div><button onClick={() => setSettings(p => ({...p, maintenance: !p.maintenance}))} className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${settings.maintenance ? 'bg-red-600' : 'bg-gray-700'}`}><div className={`w-6 h-6 bg-white rounded-full transform transition-transform duration-300 shadow-md ${settings.maintenance ? 'translate-x-6' : 'translate-x-0'}`} /></button></div><div className="flex items-center justify-between p-6 bg-gray-900 rounded-xl border border-gray-700"><div><h4 className="font-bold text-gray-200 text-lg">Allow New Registrations</h4><p className="text-sm text-gray-500 mt-1">Toggle to pause new user signups temporarily.</p></div><button onClick={() => setSettings(p => ({...p, registrations: !p.registrations}))} className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${settings.registrations ? 'bg-green-600' : 'bg-gray-700'}`}><div className={`w-6 h-6 bg-white rounded-full transform transition-transform duration-300 shadow-md ${settings.registrations ? 'translate-x-6' : 'translate-x-0'}`} /></button></div><div className="p-6 bg-red-900/10 rounded-xl border border-red-900/30 mt-8"><h4 className="font-bold text-red-500 mb-2 flex items-center gap-2"><AlertTriangle size={18}/> Danger Zone</h4><p className="text-gray-400 text-sm mb-4">Irreversible actions for system management.</p><div className="flex gap-4"><button className="px-4 py-2 border border-red-800 text-red-500 rounded hover:bg-red-900/20 text-sm font-bold transition">Clear Cache</button><button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-bold transition shadow-lg shadow-red-900/20">Reset Database (Dev Only)</button></div></div></div></div>)}

      </div>
    </div>
  );
};

export default AdminDashboard;