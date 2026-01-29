import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer'; 
import API_BASE_URL from '../config';
import { 
  BookOpen, Award, Flame, Clock, PlayCircle, Trophy, 
  LayoutDashboard, Search, X, Loader2, ShoppingCart 
} from 'lucide-react';


const Dashboard = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null); 
  const [activeTab, setActiveTab] = useState('active'); 
  const [user, setUser] = useState({ name: 'Learner' });
  const [isAdmin, setIsAdmin] = useState(false);

  // --- FILTER STATES ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const storedName = localStorage.getItem('user_name');
    const role = localStorage.getItem('user_role');
    
    if (storedName) setUser({ name: storedName });
    if (role === 'admin') setIsAdmin(true);

    fetchDashboardData();
  }, []);

  // --- NEW: SCROLL FIX FOR TABS ---
  // Whenever 'activeTab' changes, scroll smoothly to the top of the page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab, searchQuery, selectedCategory]); 
  // -------------------------------

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if(!token) { navigate('/login'); return; }

      const coursesRes = await axios.get(`${API_BASE_URL}/api/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      try {
        const enrollRes = await axios.get(`${API_BASE_URL}/api/my-enrollments`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        setEnrollments(enrollRes.data);
      } catch (err) {
        console.warn("Could not fetch enrollments", err);
      }

      setCourses(coursesRes.data);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTION HANDLER ---
  const handleCourseAction = async (courseId) => {
    // 1. IF ADMIN: Go to Course Details (Safer Route)
    if (isAdmin) {
        navigate(`/course/${courseId}`);
        return;
    }

    // 2. IF STUDENT: Start Stripe Checkout
    const token = localStorage.getItem('token');
    setBuying(courseId);

    try {
        const res = await axios.post(`${API_BASE_URL}/api/create-checkout-session`, 
            { course_id: courseId },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.url) {
            window.location.href = res.data.url;
        } else {
            alert("Payment gateway error.");
            setBuying(null);
        }
    } catch (error) {
        console.error("Payment failed", error);
        alert("Failed to start payment.");
        setBuying(null);
    }
  };

  const handleStartLearning = (courseId) => {
    navigate(`/learn/text/${courseId}`); 
  };

  const handleViewCertificate = (courseId) => {
    navigate(`/certificate/${courseId}`);
  };

  // --- HELPERS ---
  const getProgress = (courseId) => {
    const record = enrollments.find(e => e.id === courseId); 
    return record ? record.progress : 0;
  };
  
  const isCompleted = (courseId) => {
    const record = enrollments.find(e => e.id === courseId);
    return record && record.status === 'completed';
  };

  const categories = ["All", ...new Set(courses.map(c => c.category || "General"))];

  const myLearningIds = new Set(enrollments.map(e => e.id));
  const myLearning = courses.filter(c => myLearningIds.has(c.id));
  
  // Logic: 'active' tab shows only my courses. 'all' shows everything.
  // If myLearning is empty, we force user to see 'all' logic or show empty state.
  const baseList = activeTab === 'active' ? myLearning : courses;
  
  const displayList = baseList.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lastActive = myLearning.length > 0 ? myLearning[0] : null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />

      {loading ? (
        /* --- SKELETON LOADER (New) --- */
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="animate-spin mb-4 text-red-600" size={48} />
          <p className="font-medium">Loading your dashboard...</p>
        </div>
      ) : (
        /* --- MAIN CONTENT --- */
        <>
          {/* HEADER */}
          <div className="bg-black pt-32 pb-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-900/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
            
            <div className="container mx-auto px-6 relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                  <h1 className="text-4xl font-black mb-2">Welcome back, {user.name} 👋</h1>
                  <p className="text-gray-400">You are enrolled in <span className="text-white font-bold">{enrollments.length} courses</span>.</p>
                  
                  {isAdmin && (
                    <button onClick={() => navigate('/admin')} className="mt-6 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition shadow-lg shadow-red-900/50">
                      <LayoutDashboard size={18}/> Go to Admin Panel
                    </button>
                  )}
                </div>
                
                <div className="flex gap-4">
                  <div className="bg-gray-900 border border-gray-700 px-5 py-3 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500"><Trophy size={20} /></div>
                    <div><p className="text-xs text-gray-500 uppercase font-bold">Completed</p><p className="font-bold text-lg">{enrollments.filter(e => e.status === 'completed').length}</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HERO (Last Active) */}
          {lastActive && activeTab === 'active' && !searchQuery && selectedCategory === 'All' && (
            <div className="container mx-auto px-6 -mt-8 relative z-20">
              <div className="bg-white rounded-2xl p-8 shadow-xl border-l-8 border-red-600 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-red-600 font-bold text-sm uppercase mb-2">
                    <Clock size={16} /> Jump back in
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2">{lastActive.title}</h2>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-2 mt-4">
                    <div className="h-full bg-red-600 rounded-full transition-all duration-1000" style={{ width: `${getProgress(lastActive.id)}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 font-bold mb-6">{getProgress(lastActive.id)}% Complete</p>

                  <button onClick={() => handleStartLearning(lastActive.id)} className="flex items-center gap-2 px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-600/20">
                    <PlayCircle size={20} /> Continue Learning
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MAIN GRID CONTENT */}
          <div className="container mx-auto px-6 py-16">
            
            {/* TABS */}
            <div className="flex items-center gap-8 border-b border-gray-200 mb-8">
              <button onClick={() => {setActiveTab('active'); setSearchQuery(''); setSelectedCategory('All');}} className={`pb-4 text-lg font-bold transition ${activeTab === 'active' ? 'text-red-600 border-b-4 border-red-600' : 'text-gray-400 hover:text-gray-600'}`}>
                My Learning
              </button>
              <button onClick={() => {setActiveTab('all'); setSearchQuery(''); setSelectedCategory('All');}} className={`pb-4 text-lg font-bold transition ${activeTab === 'all' ? 'text-red-600 border-b-4 border-red-600' : 'text-gray-400 hover:text-gray-600'}`}>
                Browse All ({courses.length})
              </button>
            </div>

            {/* SEARCH & FILTER BAR */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center">
              <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition border ${
                      selectedCategory === cat 
                      ? 'bg-gray-900 text-white border-gray-900' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>
                  )}
              </div>
            </div>

            {/* COURSE GRID */}
            {displayList.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900">
                  {activeTab === 'active' ? "You haven't enrolled in any courses yet." : "No courses match your filter."}
                </h3>
                {activeTab === 'active' ? (
                   <button onClick={() => setActiveTab('all')} className="mt-4 px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition">Browse Courses</button>
                ) : (
                   <button onClick={() => {setSearchQuery(''); setSelectedCategory('All');}} className="mt-4 text-red-600 font-bold hover:underline">Clear filters</button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayList.map((course) => {
                  const percent = getProgress(course.id);
                  const isEnrolled = myLearningIds.has(course.id);
                  const completed = isCompleted(course.id);
                  const isBuying = buying === course.id;
                  
                  return (
                    <div key={course.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full group">
                      
                      <div className="h-2 bg-gray-100 w-full relative">
                        {isEnrolled ? (
                            <div className="h-full bg-red-500 transition-all duration-700" style={{ width: `${percent}%` }}></div>
                        ) : (
                            <div className="h-full bg-gray-200 w-full"></div>
                        )}
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <span className="bg-red-50 text-red-600 text-xs font-bold uppercase px-3 py-1 rounded-full">{course.category || 'General'}</span>
                          {completed && <span className="text-green-600 flex items-center gap-1 text-xs font-bold"><Award size={14}/> Certified</span>}
                          {!isEnrolled && <span className="text-gray-900 font-black text-lg">${course.price}</span>}
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-red-600 transition-colors">{course.title}</h3>
                        <p className="text-gray-500 text-sm mb-6 flex-1 line-clamp-3 leading-relaxed pb-1">
                          {course.description || "Master this topic with interactive lessons."}
                        </p>

                        {isEnrolled ? (
                            <button 
                              onClick={() => completed ? handleViewCertificate(course.id) : handleStartLearning(course.id)}
                              className={`w-full py-3 font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${
                                completed ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-900 text-white hover:bg-black'
                              }`}
                            >
                              {completed ? "View Certificate" : (percent > 0 ? "Continue Learning" : "Start Course")} 
                              {completed ? <Award size={16} /> : <PlayCircle size={16} />}
                            </button>
                        ) : (
                            <button 
                              onClick={() => handleCourseAction(course.id)}
                              disabled={isBuying}
                              className={`w-full py-3 font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg disabled:opacity-50 ${
                                isAdmin 
                                    ? "bg-green-600 hover:bg-green-700 text-white shadow-green-600/20" 
                                    : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20"
                              }`}
                            >
                              {isAdmin ? (
                                <>Review Course <BookOpen size={16}/></> 
                              ) : (
                                isBuying ? <Loader2 className="animate-spin" size={18}/> : <>Enroll Now <ShoppingCart size={16}/></> 
                              )}
                            </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
      
      <Footer />
    </div>
  );
};

export default Dashboard;