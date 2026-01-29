import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';
import { Search, BookOpen, Clock, BarChart, Loader2, ShoppingCart } from 'lucide-react';


const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [buying, setBuying] = useState(null); // Track which course is being bought
  const navigate = useNavigate();

  // Check if user is Admin
  const role = localStorage.getItem('user_role');
  const isAdmin = role === 'admin';

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      // Use the config URL
      const res = await axios.get(`${API_BASE_URL}/api/courses`);
      setCourses(res.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- NEW: HANDLE ACTION (Direct Enroll vs Admin Review) ---
  const handleCourseAction = async (courseId) => {
    // 1. ADMIN: Go straight to the player
    if (isAdmin) {
      navigate(`/learn/text/${courseId}`);
      return;
    }

    // 2. STUDENT: Initiate Stripe Payment immediately
    const token = localStorage.getItem('token');
    
    // If not logged in, force login
    if (!token) {
        navigate('/login');
        return;
    }

    setBuying(courseId);

    try {
        const res = await axios.post(`${API_BASE_URL}/api/create-checkout-session`, 
            { course_id: courseId },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.url) {
            window.location.href = res.data.url;
        }
    } catch (error) {
        console.error("Payment Error:", error);
        alert("Could not start payment. Please try again.");
        setBuying(null);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'All' || course.category === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />

      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 pt-28 pb-10 px-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-black mb-6">Browse All Courses</h1>
          
          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              {['All', 'HR', 'Operations', 'Development', 'Business'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${
                    activeTab === tab ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search courses..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-none focus:ring-2 focus:ring-red-600 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* COURSE GRID */}
      <div className="container mx-auto px-6 py-12">
        {loading ? (
           <div className="flex flex-col items-center justify-center py-20 text-gray-400">
             <Loader2 className="animate-spin mb-4 text-red-600" size={40} />
             <p>Loading courses...</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map(course => {
              const isBuying = buying === course.id;

              return (
                <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition group">
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold uppercase rounded-full tracking-wider">
                        {course.category}
                      </span>
                      <span className="font-bold text-xl">${course.price}</span>
                    </div>

                    <h3 className="text-xl font-bold mb-3 leading-tight group-hover:text-red-600 transition">
                      {course.title}
                    </h3>
                    <p className="text-gray-500 text-sm mb-6 line-clamp-3">
                      {course.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-400 font-medium mb-8">
                      <div className="flex items-center gap-1"><Clock size={14}/> 2h 15m</div>
                      <div className="flex items-center gap-1"><BarChart size={14}/> Beginner</div>
                    </div>

                    {/* BUTTON: NOW USES DIRECT ACTION */}
                    <button 
                      onClick={() => handleCourseAction(course.id)}
                      disabled={isBuying}
                      className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                        isAdmin 
                          ? "bg-green-600 hover:bg-green-700 text-white" 
                          : "bg-red-600 hover:bg-red-700 text-white"
                      }`}
                    >
                      {isAdmin ? (
                        <>
                          <BookOpen size={18} /> Review Course
                        </>
                      ) : (
                        isBuying ? <Loader2 className="animate-spin" size={18}/> : <>Enroll Now <ShoppingCart size={18} /></>
                      )}
                    </button>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Courses;