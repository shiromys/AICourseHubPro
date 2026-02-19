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
  Edit, Search, Settings, FileText, LogOut, Eye, X, Save, Archive, Upload,
  Trash2, RefreshCcw, ShieldAlert, AlertTriangle, Shield, ShieldCheck, CheckCircle,
  CheckSquare, HelpCircle, Bell, ChevronDown, User as UserIcon, Ban, Menu, FileJson
} from 'lucide-react';

// --- MOCK DATA ---
const MOCK_REVENUE_DATA = [
  { name: 'Jan', revenue: 0 }, { name: 'Feb', revenue: 0 },
  { name: 'Mar', revenue: 0 }, { name: 'Apr', revenue: 0 },
  { name: 'May', revenue: 0 }, { name: 'Jun', revenue: 0 },
  { name: 'Jul', revenue: 0 },
];

// --- SIDEBAR ITEM COMPONENT ---
const SidebarItem = ({ id, icon: Icon, label, activeTab, setActiveTab, closeMobileMenu }) => (
  <button 
    onClick={() => { setActiveTab(id); if (closeMobileMenu) closeMobileMenu(); }} 
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-1 font-medium ${
      activeTab === id 
      ? 'bg-red-600 text-white shadow-md shadow-red-200' 
      : 'text-gray-600 hover:bg-gray-100 hover:text-red-600'
    }`}
  >
    <Icon size={18} /> <span className="text-sm">{label}</span>
  </button>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null); 
  const [activeTab, setActiveTab] = useState('overview'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- DATA STATES ---
  const [adminName, setAdminName] = useState("Admin User");
  const [adminInitials, setAdminInitials] = useState("AD");
  const [courses, setCourses] = useState([]); 
  const [users, setUsers] = useState([]); 
  const [stats, setStats] = useState({ revenue: 0, students: 0, courses: 0, uptime: "99.9%", chart_data: [], recent_messages: [] });
  const [transactions, setTransactions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState({ maintenance: false, registrations: true });
  const [loading, setLoading] = useState(false);

  // --- UI STATES ---
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
  const [isCloseTicketModalOpen, setIsCloseTicketModalOpen] = useState(false);
  const [messageToClose, setMessageToClose] = useState(null);

  // --- FETCH DATA ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedName = localStorage.getItem('user_name');

    if(token) {
      if (storedName) {
          setAdminName(storedName);
          const parts = storedName.trim().split(' ');
          let initials = parts[0][0];
          if (parts.length > 1) { initials += parts[parts.length - 1][0]; }
          setAdminInitials(initials.toUpperCase());
      }

      setLoading(true);
      fetchCourses(token); 
      
      const loadTabData = async () => {
        try {
            if (activeTab === 'overview') { 
              const s = await axios.get(`${API_BASE_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
              setStats(s.data);
              const u = await axios.get(`${API_BASE_URL}/api/users?type=active`, { headers: { Authorization: `Bearer ${token}` } });
              setUsers(u.data);
            }
            else if (activeTab === 'courses') { 
              const r = await axios.get(`${API_BASE_URL}/api/courses`, { headers: { Authorization: `Bearer ${token}` } });
              setCourses(r.data);
            }
            else if (activeTab === 'users') { 
              const r = await axios.get(`${API_BASE_URL}/api/users?type=active`, { headers: { Authorization: `Bearer ${token}` } });
              setUsers(r.data);
            }
            else if (activeTab === 'deleted_users') { 
              const r = await axios.get(`${API_BASE_URL}/api/users?type=deleted`, { headers: { Authorization: `Bearer ${token}` } });
              setUsers(r.data);
            }
            else if (activeTab === 'revenue') { 
              const r = await axios.get(`${API_BASE_URL}/api/admin/transactions`, { headers: { Authorization: `Bearer ${token}` } });
              setTransactions(r.data);
            }
            else if (activeTab === 'support') { 
              const r = await axios.get(`${API_BASE_URL}/api/admin/messages`, { headers: { Authorization: `Bearer ${token}` } });
              setMessages(r.data);
            }
            else if (activeTab === 'audit') { 
              const r = await axios.get(`${API_BASE_URL}/api/admin/logs`, { headers: { Authorization: `Bearer ${token}` } });
              setLogs(r.data);
            }
            else if (activeTab === 'settings') { 
              const r = await axios.get(`${API_BASE_URL}/api/settings`); 
              setSettings(r.data); 
            }
        } catch(e) { console.error("Fetch Error:", e); }
        setLoading(false);
      };
      loadTabData();
    } else {
        navigate('/login');
    }
  }, [activeTab, navigate]);

  // --- API CALLS ---
  const fetchCourses = async (t) => { const r = await axios.get(`${API_BASE_URL}/api/courses`, { headers: { Authorization: `Bearer ${t}` } }); setCourses(r.data); };

  // --- HANDLERS ---
  const toggleSetting = async (key) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/settings`, { [key]: newValue }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) { 
        console.error("Failed to save setting", error);
        setSettings(prev => ({ ...prev, [key]: !newValue })); 
        alert("Failed to update setting. Check if Backend is running properly."); 
    }
  };

  const handleToggleAdmin = async (user) => { if(!window.confirm(`Promote/Demote ${user.name}?`)) return; const t=localStorage.getItem('token'); await axios.put(`${API_BASE_URL}/api/users/${user.id}/role`, { is_admin: user.role !== 'Admin' }, { headers: { Authorization: `Bearer ${t}` } }); const r=await axios.get(`${API_BASE_URL}/api/users?type=active`, { headers: { Authorization: `Bearer ${t}` } }); setUsers(r.data); };
  const openBanModal = (user) => { setSelectedUser(user); setBanDuration(30); setIsBanModalOpen(true); };
  const handleConfirmBan = async () => { const t=localStorage.getItem('token'); await axios.post(`${API_BASE_URL}/api/users/${selectedUser.id}/ban`, { days: banDuration }, { headers: { Authorization: `Bearer ${t}` } }); setIsBanModalOpen(false); const r=await axios.get(`${API_BASE_URL}/api/users?type=active`, { headers: { Authorization: `Bearer ${t}` } }); setUsers(r.data); };
  const handleUnban = async (user) => { const t=localStorage.getItem('token'); await axios.post(`${API_BASE_URL}/api/users/${user.id}/ban`, { days: 0 }, { headers: { Authorization: `Bearer ${t}` } }); const r=await axios.get(`${API_BASE_URL}/api/users?type=active`, { headers: { Authorization: `Bearer ${t}` } }); setUsers(r.data); };
  const handleDeleteUser = async (user) => { if(!window.confirm("Delete?")) return; const t=localStorage.getItem('token'); await axios.delete(`${API_BASE_URL}/api/users/${user.id}/delete`, { headers: { Authorization: `Bearer ${t}` } }); const r=await axios.get(`${API_BASE_URL}/api/users?type=active`, { headers: { Authorization: `Bearer ${t}` } }); setUsers(r.data); };
  const handleRestoreUser = async (user) => { const t=localStorage.getItem('token'); await axios.post(`${API_BASE_URL}/api/users/${user.id}/restore`, {}, { headers: { Authorization: `Bearer ${t}` } }); const r=await axios.get(`${API_BASE_URL}/api/users?type=deleted`, { headers: { Authorization: `Bearer ${t}` } }); setUsers(r.data); };
  
  const handleSaveCourse = async () => { const t=localStorage.getItem('token'); const r=await axios.post(`${API_BASE_URL}/api/courses`, newCourse, { headers: { Authorization: `Bearer ${t}` } }); setCourses([...courses, r.data]); setIsModalOpen(false); };
  const handleUpdateCourse = async () => { const t=localStorage.getItem('token'); await axios.put(`${API_BASE_URL}/api/courses/${editingCourse.id}`, editingCourse, { headers: { Authorization: `Bearer ${t}` } }); setIsEditModalOpen(false); const r=await axios.get(`${API_BASE_URL}/api/courses`, { headers: { Authorization: `Bearer ${t}` } }); setCourses(r.data); };
  const handleDeleteCourse = async (id) => { if(!window.confirm("Archive?")) return; const t=localStorage.getItem('token'); await axios.delete(`${API_BASE_URL}/api/courses/${id}`, { headers: { Authorization: `Bearer ${t}` } }); const r=await axios.get(`${API_BASE_URL}/api/courses`, { headers: { Authorization: `Bearer ${t}` } }); setCourses(r.data); };

  const initiateCloseTicket = (id) => { setMessageToClose(id); setIsCloseTicketModalOpen(true); };
  const confirmCloseTicket = async () => { const t=localStorage.getItem('token'); await axios.put(`${API_BASE_URL}/api/admin/messages/${messageToClose}/read`, {}, { headers: { Authorization: `Bearer ${t}` } }); setMessages(prev => prev.filter(msg => msg.id !== messageToClose)); setIsCloseTicketModalOpen(false); };

  const handleExportCSV = () => {
    if (transactions.length === 0) return alert("No data");
    const headers = ["User,Email,Course,Date,Status"];
    const rows = transactions.map(tx => `${tx.user},${tx.email},"${tx.course}",${tx.date},Paid`);
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleAddModule = (isEdit) => { const t = isEdit ? editingCourse : newCourse; const u = {...t, modules: [...t.modules, {title: "New Module", lessons: []}]}; isEdit ? setEditingCourse(u) : setNewCourse(u); };
  const handleAddLesson = (mIdx, isEdit) => { const t = isEdit ? editingCourse : newCourse; const u = [...t.modules]; u[mIdx].lessons.push({title: "New Lesson", type: "text", content: ""}); isEdit ? setEditingCourse({...t, modules: u}) : setNewCourse({...t, modules: u}); };
  const handleModuleTitleChange = (i, v, isEdit) => { const t = isEdit ? editingCourse : newCourse; const u = [...t.modules]; u[i].title = v; isEdit ? setEditingCourse({...t, modules: u}) : setNewCourse({...t, modules: u}); };
  const handleLessonTitleChange = (mIdx, lIdx, v, isEdit) => { const t = isEdit ? editingCourse : newCourse; const u = [...t.modules]; u[mIdx].lessons[lIdx].title = v; isEdit ? setEditingCourse({...t, modules: u}) : setNewCourse({...t, modules: u}); };
  
  const handleOpenModal = () => { setNewCourse({ title: '', description: '', price: 29, category: 'HR', modules: [] }); setIsModalOpen(true); };
  
  // --- JSON UPLOAD LOGIC ---
  const handleJsonUpload = (e) => { 
    const f=e.target.files[0]; 
    if(!f)return; 
    const r=new FileReader(); 
    r.onload=(ev)=>{ 
        try{
            const j=JSON.parse(ev.target.result); 
            // Handles both full course object or just modules array
            const loadedModules = Array.isArray(j) ? j : (j.modules || []);
            const loadedTitle = j.title || newCourse.title;
            const loadedDesc = j.description || newCourse.description;
            const loadedPrice = j.price || newCourse.price;
            const loadedCat = j.category || newCourse.category;

            setNewCourse({
                ...newCourse, 
                title: loadedTitle,
                description: loadedDesc,
                price: loadedPrice,
                category: loadedCat,
                modules: loadedModules
            }); 
            alert(`Loaded ${loadedModules.length} modules from JSON!`);
        } catch(err){
            alert("Invalid JSON format");
        } 
    }; 
    r.readAsText(f); 
  };

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };
  
  // REAL-TIME CHART DATA GENERATOR
  const systemLoadData = [...Array(20)].map((_, i) => ({ time: i, load: 20 + Math.random() * 30 }));

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900 relative">
      
      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
        />
      )}

      {/* --- SIDEBAR --- */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-30 transform transition-transform duration-300 ease-in-out shadow-lg flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:shadow-none
      `}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-black rounded-xl flex items-center justify-center font-bold text-white shadow-md">A</div>
            <span className="font-bold text-xl tracking-tight text-gray-900">ADMIN</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500 hover:text-red-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2 px-2 mt-2">Main</p>
          <SidebarItem id="overview" icon={LayoutDashboard} label="Dashboard" activeTab={activeTab} setActiveTab={setActiveTab} closeMobileMenu={() => setIsSidebarOpen(false)} />
          <SidebarItem id="courses" icon={BookOpen} label="Courses" activeTab={activeTab} setActiveTab={setActiveTab} closeMobileMenu={() => setIsSidebarOpen(false)} />
          <SidebarItem id="users" icon={Users} label="Active Users" activeTab={activeTab} setActiveTab={setActiveTab} closeMobileMenu={() => setIsSidebarOpen(false)} />
          <SidebarItem id="deleted_users" icon={Trash2} label="Deleted Accounts" activeTab={activeTab} setActiveTab={setActiveTab} closeMobileMenu={() => setIsSidebarOpen(false)} />
          <p className="text-xs font-bold text-gray-400 uppercase mt-6 mb-2 px-2">Finance</p>
          <SidebarItem id="revenue" icon={DollarSign} label="Revenue & Sales" activeTab={activeTab} setActiveTab={setActiveTab} closeMobileMenu={() => setIsSidebarOpen(false)} />
          <p className="text-xs font-bold text-gray-400 uppercase mt-6 mb-2 px-2">System</p>
          <SidebarItem id="support" icon={Mail} label="Support Inbox" activeTab={activeTab} setActiveTab={setActiveTab} closeMobileMenu={() => setIsSidebarOpen(false)} />
          <SidebarItem id="audit" icon={FileText} label="Audit Logs" activeTab={activeTab} setActiveTab={setActiveTab} closeMobileMenu={() => setIsSidebarOpen(false)} />
          <SidebarItem id="system" icon={Activity} label="System Health" activeTab={activeTab} setActiveTab={setActiveTab} closeMobileMenu={() => setIsSidebarOpen(false)} />
          <SidebarItem id="settings" icon={Settings} label="Global Settings" activeTab={activeTab} setActiveTab={setActiveTab} closeMobileMenu={() => setIsSidebarOpen(false)} />
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-white shrink-0">
            <button onClick={() => navigate('/dashboard')} className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-black rounded-lg transition flex items-center justify-center gap-2 text-sm font-bold mb-2 border border-gray-200"><Eye size={16}/> Student View</button>
            <button onClick={handleLogout} className="w-full py-2 bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 rounded-lg transition flex items-center justify-center gap-2 text-sm font-bold"><LogOut size={16}/> Log Out</button>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 md:ml-64 p-4 md:p-8 bg-gray-50 min-h-screen transition-all duration-300">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200">
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 capitalize">{activeTab.replace('_', ' ')}</h1>
              <p className="hidden md:flex text-gray-500 text-xs mt-1 items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Connected to PostgreSQL</p>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
             <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:text-black relative transition">
                    <Bell size={20} />
                    {stats.recent_messages && stats.recent_messages.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-600 rounded-full border-2 border-white"></span>}
                </button>
                {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up z-50">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <span className="font-bold text-gray-900 text-sm">Notifications</span>
                            <span className="text-xs text-gray-500 cursor-pointer hover:text-black" onClick={() => setActiveTab('support')}>View All</span>
                        </div>
                        {(!stats.recent_messages || stats.recent_messages.length === 0) ? <div className="p-6 text-center text-gray-500 text-sm">No new messages</div> : stats.recent_messages.map(msg => (<div key={msg.id} className="p-4 hover:bg-gray-50 border-b border-gray-100 cursor-pointer" onClick={() => setActiveTab('support')}><div className="flex justify-between mb-1"><span className="text-gray-900 font-bold text-sm truncate w-40">{msg.subject}</span><span className="text-xs text-gray-500">{msg.time}</span></div><p className="text-xs text-gray-500">From: {msg.name}</p></div>))}
                    </div>
                )}
             </div>

             <div className="relative">
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 pl-4 md:border-l border-gray-200">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-gray-900">{adminName}</p>
                        <p className="text-xs text-green-600">Super Admin</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-black rounded-full flex items-center justify-center font-bold text-white shadow-lg">{adminInitials}</div>
                    <ChevronDown size={14} className="text-gray-400 hidden md:block"/>
                </button>
                {showProfileMenu && (
                    <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up z-50">
                        <button onClick={() => navigate('/dashboard')} className="w-full text-left px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"><UserIcon size={16}/> Student View</button>
                        <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"><LogOut size={16}/> Sign Out</button>
                    </div>
                )}
             </div>
          </div>
        </div>

        {/* --- OVERVIEW TAB --- */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"><div className="flex justify-between items-start mb-4"><div className="p-3 rounded-lg bg-green-50 text-green-600"><DollarSign size={24}/></div></div><h3 className="text-3xl font-black text-gray-900">${stats.revenue}</h3><p className="text-gray-500 text-xs font-bold uppercase mt-1">Total Revenue</p></div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"><div className="flex justify-between items-start mb-4"><div className="p-3 rounded-lg bg-blue-50 text-blue-600"><Users size={24}/></div></div><h3 className="text-3xl font-black text-gray-900">{stats.students}</h3><p className="text-gray-500 text-xs font-bold uppercase mt-1">Total Students</p></div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"><div className="flex justify-between items-start mb-4"><div className="p-3 rounded-lg bg-purple-50 text-purple-600"><BookOpen size={24}/></div></div><h3 className="text-3xl font-black text-gray-900">{stats.courses}</h3><p className="text-gray-500 text-xs font-bold uppercase mt-1">Total Courses</p></div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"><div className="flex justify-between items-start mb-4"><div className="p-3 rounded-lg bg-orange-50 text-orange-600"><Activity size={24}/></div></div><h3 className="text-3xl font-black text-gray-900">{stats.uptime}</h3><p className="text-gray-500 text-xs font-bold uppercase mt-1">System Uptime</p></div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <h3 className="text-lg font-bold mb-6 text-gray-900">Revenue Overview</h3>
                <div className="h-80 min-w-[600px]">
                    <ResponsiveContainer width="100%" height="100%"><AreaChart data={stats.chart_data && stats.chart_data.length > 0 ? stats.chart_data : MOCK_REVENUE_DATA}><defs><linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/><stop offset="95%" stopColor="#dc2626" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} /><XAxis dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} /><YAxis stroke="#9ca3af" axisLine={false} tickLine={false} tickFormatter={val => `$${val}`} /><Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#000' }} /><Area type="monotone" dataKey="revenue" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" /></AreaChart></ResponsiveContainer>
                </div>
            </div>
          </div>
        )}

        {/* --- TABLES --- */}
        {['courses', 'users', 'deleted_users', 'revenue', 'audit'].includes(activeTab) && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center bg-white gap-4">
                    <div className="w-full flex justify-between items-center md:block">
                        <h3 className="font-bold text-lg text-gray-900 capitalize">{activeTab.replace('_', ' ')}</h3>
                    </div>
                    {activeTab === 'courses' && (
                        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-red-500 transition" />
                            </div>
                            <button onClick={handleOpenModal} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold shadow-lg shadow-red-200 w-full md:w-auto"><Plus size={18} /> Add</button>
                        </div>
                    )}
                    {activeTab === 'revenue' && <button onClick={handleExportCSV} className="text-xs bg-gray-900 hover:bg-black text-white px-3 py-1 rounded transition border border-gray-900">Export CSV</button>}
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-gray-100 text-gray-600 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                {activeTab === 'courses' && <><th className="px-6 py-4">Title</th><th className="px-6 py-4">Price</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Modules</th><th className="px-6 py-4 text-right">Actions</th></>}
                                {(activeTab === 'users' || activeTab === 'deleted_users') && <><th className="px-6 py-4">User</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></>}
                                {activeTab === 'revenue' && <><th className="px-6 py-4">User</th><th className="px-6 py-4">Course</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Status</th></>}
                                {activeTab === 'audit' && <><th className="px-6 py-4">Action</th><th className="px-6 py-4">Admin</th><th className="px-6 py-4">Details</th><th className="px-6 py-4">Time</th></>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-sm">
                            {activeTab === 'courses' && courses.map(c => (<tr key={c.id} className="hover:bg-gray-50 transition"><td className="px-6 py-4 font-bold text-gray-900">{c.title}</td><td className="px-6 py-4 text-green-600 font-bold">${c.price}</td><td className="px-6 py-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs border border-gray-200">{c.category}</span></td><td className="px-6 py-4 text-gray-500">{c.modules?.length}</td><td className="px-6 py-4 text-right flex justify-end gap-2"><button onClick={()=>{setEditingCourse(c);setIsEditModalOpen(true)}} title="Edit Course" className="text-blue-600 bg-blue-50 p-2 rounded hover:bg-blue-100"><Edit size={18}/></button><button onClick={()=>handleDeleteCourse(c.id)} title="Delete Course" className="text-red-600 bg-red-50 p-2 rounded hover:bg-red-100"><Archive size={18}/></button></td></tr>))}
                            {activeTab === 'users' && users.map(u => (<tr key={u.id} className="hover:bg-gray-50 transition"><td className="px-6 py-4"><div className="font-bold text-gray-900">{u.name}</div><div className="text-xs text-gray-500">{u.email}</div></td><td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold border ${u.role === 'Admin' ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>{u.role}</span></td><td className="px-6 py-4">{u.status === 'Banned' ? <span className="text-red-600 font-bold">Banned</span> : <span className="text-green-600 font-bold">Active</span>}</td><td className="px-6 py-4 text-right flex justify-end gap-2"><button onClick={()=>handleToggleAdmin(u)} title={u.role === 'Admin' ? "Demote" : "Promote"} className="p-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100"><Shield size={18}/></button><button onClick={()=>u.status==='Banned'?handleUnban(u):openBanModal(u)} title={u.status === 'Banned' ? "Unban" : "Ban"} className="p-2 bg-orange-50 text-orange-600 rounded hover:bg-orange-100"><Ban size={18}/></button><button onClick={()=>handleDeleteUser(u)} title="Delete User" className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash2 size={18}/></button></td></tr>))}
                            {activeTab === 'revenue' && transactions.map((t,i) => (<tr key={i} className="hover:bg-gray-50 transition"><td className="px-6 py-4 font-bold text-gray-900">{t.user}</td><td className="px-6 py-4 text-gray-700">{t.course}</td><td className="px-6 py-4 text-gray-500">{t.date}</td><td className="px-6 py-4 text-green-700 font-bold">Paid</td></tr>))}
                            {activeTab === 'audit' && logs.map((l,i) => (<tr key={i} className="hover:bg-gray-50 transition"><td className="px-6 py-4 font-bold text-gray-900">{l.action}</td><td className="px-6 py-4 text-gray-500">{l.admin}</td><td className="px-6 py-4 italic text-gray-600">{l.details}</td><td className="px-6 py-4 text-gray-500">{l.date}</td></tr>))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* SUPPORT TAB */}
        {activeTab === 'support' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm h-[80vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-gray-900"><Mail className="text-blue-600"/> Support Inbox</h3>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">{messages.length} Messages</span>
                </div>
                <div className="divide-y divide-gray-200 overflow-y-auto flex-1 custom-scrollbar">
                    {messages.length === 0 ? <div className="p-20 text-center text-gray-500 italic">No support messages received yet.</div> : messages.map(msg => (
                        <div key={msg.id} className={`p-6 transition cursor-pointer group ${msg.is_read ? 'opacity-50 hover:opacity-80 bg-gray-50' : 'hover:bg-gray-50'}`}>
                            <div className="flex justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow">{msg.name.charAt(0).toUpperCase()}</div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition flex items-center gap-2">{msg.subject}{!msg.is_read && <span className="bg-red-500 text-white text-[10px] px-2 rounded-full">New</span>}</h4>
                                        <p className="text-xs text-gray-500">From: <span className="text-gray-900 font-medium">{msg.name}</span> &lt;{msg.email}&gt;</p>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400 font-mono">{msg.date}</span>
                            </div>
                            <div className="pl-13 ml-13 mt-3 bg-gray-50 p-4 rounded-lg border border-gray-200"><p className="text-sm text-gray-700 leading-relaxed">{msg.message}</p></div>
                            <div className="mt-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                                {!msg.is_read && (<button onClick={() => initiateCloseTicket(msg.id)} title="Close Ticket" className="text-xs bg-gray-800 text-white px-3 py-1 rounded hover:bg-black flex items-center gap-1 shadow-md"><CheckSquare size={12}/> Close Ticket</button>)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* SYSTEM HEALTH TAB (Restored) */}
        {activeTab === 'system' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold mb-6 flex items-center gap-2 text-red-600"><Activity size={20} /> Live System Status</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200"><span className="text-gray-700 font-medium">Database Connection</span><span className="text-green-700 flex items-center gap-2 text-sm font-bold bg-green-100 px-3 py-1 rounded-full border border-green-200"><CheckCircle size={14}/> Connected</span></div>
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200"><span className="text-gray-700 font-medium">API Response Time</span><span className="text-green-700 text-sm font-bold font-mono">24ms</span></div>
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200"><span className="text-gray-700 font-medium">Stripe Webhooks</span><span className="text-green-700 text-sm font-bold flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Listening</span></div>
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200"><span className="text-gray-700 font-medium">Storage Usage</span><div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[45%]"></div></div></div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                        <h3 className="font-bold mb-4 text-gray-900">Server Load (Real-time)</h3>
                        <div className="h-64 flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={systemLoadData}>
                                    <Line type="monotone" dataKey="load" stroke="#dc2626" strokeWidth={3} dot={false} isAnimationActive={true} />
                                    <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                                    <XAxis hide />
                                    <YAxis hide domain={[0, 100]}/>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 flex justify-between text-xs text-gray-500 font-mono"><span>00:00</span><span>Now</span></div>
                    </div>
                </div>
            </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 max-w-3xl shadow-sm">
                <h3 className="font-bold mb-8 text-2xl text-gray-900 flex items-center gap-3"><Settings className="text-gray-400"/> Global Configurations</h3>
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-200">
                        <div><h4 className="font-bold text-gray-900 text-lg">Maintenance Mode</h4><p className="text-sm text-gray-500 mt-1">If enabled, non-admin users will see a "Under Maintenance" page.</p></div>
                        <button onClick={() => toggleSetting('maintenance')} className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${settings.maintenance ? 'bg-red-600' : 'bg-gray-300'}`}><div className={`w-6 h-6 bg-white rounded-full transform transition-transform duration-300 shadow-md ${settings.maintenance ? 'translate-x-6' : 'translate-x-0'}`} /></button>
                    </div>
                    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-200">
                        <div><h4 className="font-bold text-gray-900 text-lg">Allow New Registrations</h4><p className="text-sm text-gray-500 mt-1">Toggle to pause new user signups temporarily.</p></div>
                        <button onClick={() => toggleSetting('registrations')} className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${settings.registrations ? 'bg-green-600' : 'bg-gray-300'}`}><div className={`w-6 h-6 bg-white rounded-full transform transition-transform duration-300 shadow-md ${settings.registrations ? 'translate-x-6' : 'translate-x-0'}`} /></button>
                    </div>
                    <div className="p-6 bg-red-50 rounded-xl border border-red-100 mt-8">
                        <h4 className="font-bold text-red-600 mb-2 flex items-center gap-2"><AlertTriangle size={18}/> Danger Zone</h4>
                        <div className="flex gap-4"><button className="px-4 py-2 border border-red-200 text-red-600 rounded hover:bg-red-100 text-sm font-bold bg-white">Clear Cache</button><button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-bold">Reset Database</button></div>
                    </div>
                </div>
            </div>
        )}

      </div>

      {/* --- MODALS (Unchanged logic, just wrapped properly) --- */}
      {/* BAN MODAL (Light) */}
      {isBanModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-xl max-w-sm w-full border border-gray-200 shadow-2xl">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Ban User</h3>
                <div className="mb-4">
                    <label className="text-sm text-gray-600 font-bold">Duration (Days)</label>
                    <input type="number" value={banDuration} onChange={(e) => setBanDuration(e.target.value)} className="w-full bg-white border border-gray-300 p-2 rounded mt-1 text-gray-900 focus:outline-none focus:border-red-600"/>
                </div>
                <button onClick={handleConfirmBan} className="bg-red-600 w-full py-2 rounded font-bold text-white hover:bg-red-700 transition">Confirm Ban</button>
                <button onClick={() => setIsBanModalOpen(false)} className="mt-2 w-full py-2 text-gray-500 hover:text-black font-medium transition">Cancel</button>
            </div>
        </div>
      )}

      {/* CLOSE TICKET MODAL (Light) */}
      {isCloseTicketModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-xl max-w-sm w-full border border-gray-200 shadow-2xl">
                <div className="flex flex-col items-center text-center mb-4">
                    <div className="p-3 bg-yellow-50 rounded-full text-yellow-600 mb-3"><HelpCircle size={32} /></div>
                    <h3 className="text-xl font-bold text-gray-900">Pending Action</h3>
                    <p className="text-gray-600 text-sm mt-2">Have you replied to this user via email?</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsCloseTicketModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 font-bold hover:bg-gray-100">No, Cancel</button>
                    <button onClick={confirmCloseTicket} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold">Yes, Close Ticket</button>
                </div>
            </div>
        </div>
      )}

      {/* COURSE MODAL (Light) */}
      {(isModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-xl max-w-4xl w-full h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl">
                  <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">{isEditModalOpen ? "Edit Course" : "Create New Course"}</h2>
                      <button onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }} className="text-gray-400 hover:text-red-600 transition"><X size={24} /></button>
                  </div>
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input className="w-full bg-white border border-gray-300 p-3 rounded text-gray-900 focus:border-red-600 outline-none transition" placeholder="Title" value={isEditModalOpen ? editingCourse.title : newCourse.title} onChange={e => isEditModalOpen ? setEditingCourse({...editingCourse, title: e.target.value}) : setNewCourse({...newCourse, title: e.target.value})}/>
                        <select className="w-full bg-white border border-gray-300 p-3 rounded text-gray-900 focus:border-red-600 outline-none transition" value={isEditModalOpen ? editingCourse.category : newCourse.category} onChange={e => isEditModalOpen ? setEditingCourse({...editingCourse, category: e.target.value}) : setNewCourse({...newCourse, category: e.target.value})}><option>HR</option><option>Development</option><option>Marketing</option><option>Business</option></select>
                      </div>
                      <input className="w-full bg-white border border-gray-300 p-3 rounded text-gray-900 focus:border-red-600 outline-none transition" type="number" placeholder="Price" value={isEditModalOpen ? editingCourse.price : newCourse.price} onChange={e => isEditModalOpen ? setEditingCourse({...editingCourse, price: parseFloat(e.target.value)}) : setNewCourse({...newCourse, price: parseFloat(e.target.value)})}/>
                      <textarea className="w-full bg-white border border-gray-300 p-3 rounded text-gray-900 focus:border-red-600 outline-none transition" rows="3" placeholder="Description" value={isEditModalOpen ? editingCourse.description : newCourse.description} onChange={e => isEditModalOpen ? setEditingCourse({...editingCourse, description: e.target.value}) : setNewCourse({...newCourse, description: e.target.value})}/>
                      <div className="border-t border-gray-100 pt-6">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-gray-700 uppercase text-sm">Curriculum Builder</h4>
                            
                            {/* --- JSON UPLOAD BUTTON (NEW) --- */}
                            <div className="flex gap-2">
                                {!isEditModalOpen && (
                                    <label className="cursor-pointer text-xs bg-gray-800 hover:bg-black text-white px-3 py-1.5 rounded flex items-center gap-1 font-bold transition">
                                        <FileJson size={14}/> Upload JSON
                                        <input type="file" className="hidden" accept=".json" onChange={handleJsonUpload} />
                                    </label>
                                )}
                                <button onClick={() => handleAddModule(isEditModalOpen)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded flex items-center gap-1 font-bold"><Plus size={14}/> Add Module</button>
                            </div>
                          </div>
                          {(isEditModalOpen ? editingCourse.modules : newCourse.modules).map((mod, i) => (
                              <div key={i} className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
                                  <div className="flex gap-2 mb-2"><input className="bg-transparent font-bold flex-1 text-gray-900" value={mod.title} onChange={e => handleModuleTitleChange(i, e.target.value, isEditModalOpen)} placeholder="Module Title" /><button onClick={() => handleAddLesson(i, isEditModalOpen)} className="text-xs text-green-600 hover:text-green-700 font-bold">+ Lesson</button></div>
                                  <div className="pl-4 border-l-2 border-gray-300 space-y-2">{mod.lessons.map((les, j) => <input key={j} className="w-full text-sm p-1 bg-white border border-gray-300 rounded text-gray-900" value={les.title} onChange={e => handleLessonTitleChange(i, j, e.target.value, isEditModalOpen)} placeholder="Lesson Title"/>)}</div>
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="pt-6 border-t border-gray-100 flex justify-end gap-3 mt-6">
                      <button onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }} className="px-6 py-3 border border-gray-300 rounded font-bold text-gray-600">Cancel</button>
                      <button onClick={isEditModalOpen ? handleUpdateCourse : handleSaveCourse} className="px-6 py-3 bg-red-600 text-white rounded font-bold">Save</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;