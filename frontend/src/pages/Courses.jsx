import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, BookOpen, Clock, ChevronRight, Loader2, AlertCircle, ShoppingCart } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API_BASE_URL from '../config';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [buying, setBuying] = useState(null);

  const navigate = useNavigate();
  const role = localStorage.getItem('user_role');
  const isAdmin = role === 'admin';

  const categories = ['All', 'HR', 'Operations', 'Development', 'Business', 'Marketing'];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/courses`);
        setCourses(res.data);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleCourseAction = async (courseId) => {
    if (isAdmin) {
      navigate(`/learn/text/${courseId}`);
      return;
    }

    const token = localStorage.getItem('token');
    
    if (!token) {
        localStorage.setItem('pendingCourseId', courseId);
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

  // Filter Logic
  const filteredCourses = courses.filter(course => {
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-black font-sans text-gray-100 flex flex-col">
      <Navbar />

      <div className="flex-1 container mx-auto px-6 py-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-white mb-4">Browse All Courses</h1>
            
            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    selectedCategory === cat 
                      ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' 
                      : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl pl-10 pr-4 py-3 focus:border-red-600 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-red-600 mb-4" size={48} />
            <p className="text-gray-500">Loading your courses...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-900/50 p-6 rounded-xl text-center text-red-400">
            <AlertCircle className="mx-auto mb-2" size={32} />
            {error}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-gray-800/50">
            <BookOpen className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-300">No courses found</h3>
            <p className="text-gray-500">Try adjusting your search or category filters.</p>
            <button 
              onClick={() => {setSelectedCategory('All'); setSearchQuery('');}}
              className="mt-4 text-red-500 font-bold hover:text-red-400"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map(course => {
              const isBuying = buying === course.id;

              return (
                <div key={course.id} className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-red-600/50 hover:shadow-2xl hover:shadow-red-900/10 transition-all duration-300 flex flex-col">
                  <div className="p-8 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-gray-800 text-gray-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-gray-700">
                        {course.category}
                      </span>
                      <span className="text-green-400 font-bold text-lg">${course.price}</span>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-red-500 transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    
                    <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3">
                      {course.description || "Master the skills needed to excel in this field with our comprehensive curriculum."}
                    </p>
                    
                    <div className="flex items-center gap-4 text-gray-500 text-sm font-medium">
                      <div className="flex items-center gap-1.5">
                        <BookOpen size={16} className="text-red-500" />
                        <span>{course.modules ? course.modules.length : 0} Modules</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={16} className="text-red-500" />
                        <span>Self-Paced</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-950 border-t border-gray-800">
                     <button 
                       onClick={() => handleCourseAction(course.id)}
                       disabled={isBuying}
                       className={`flex items-center justify-center gap-2 w-full font-bold py-3 rounded-xl transition-all ${
                         isAdmin 
                           ? "bg-green-600 hover:bg-green-700 text-white" 
                           : "bg-gray-800 hover:bg-white hover:text-black text-white"
                       }`}
                     >
                       {isAdmin ? (
                         <> <BookOpen size={16} /> Review Course </>
                       ) : (
                         isBuying ? <Loader2 className="animate-spin" size={16}/> : <> Enroll Now <ChevronRight size={16} /> </>
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