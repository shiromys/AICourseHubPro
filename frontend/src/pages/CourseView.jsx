import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API_BASE_URL from '../config';
import { CheckCircle, Clock, BarChart, Shield, BookOpen, Lock } from 'lucide-react';
import TextCoursePlayer from '../components/TextCoursePlayer'; 

const CourseView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCourseData();
    checkEnrollmentStatus();
  }, [id]);

  // --- AUTO-TRIGGER PAYMENT AFTER LOGIN ---
  useEffect(() => {
    if (course && !isEnrolled && !loading) {
      const pendingId = localStorage.getItem('pendingCourseId');
      const token = localStorage.getItem('token');

      // If logged in AND coming back for this specific course
      if (token && pendingId === String(course.id)) {
        localStorage.removeItem('pendingCourseId'); // Clear flag
        handleBuy(); // Trigger payment
      }
    }
  }, [course, isEnrolled, loading]);

  const fetchCourseData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/courses`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const found = response.data.find(c => c.id === parseInt(id));
      setCourse(found);
    } catch (error) {
      console.error("Failed to load course", error);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollmentStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/api/enrollment/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
          setIsEnrolled(true); 
      }
    } catch (error) {
      setIsEnrolled(false);
    }
  };

  const handleBuy = async () => {
    if (!course) return;
    
    // 1. Check Token
    const token = localStorage.getItem('token');

    if (!token) {
      // User not logged in: Save intent and redirect
      localStorage.setItem('pendingCourseId', course.id);
      navigate('/login');
      return;
    }

    // 2. User logged in: Process Payment
    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/create-checkout-session`, 
        { course_id: course.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      alert("Payment initiation failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-red-600"></div></div>;
  if (!course) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Course not found.</div>;

  if (isEnrolled) {
      return <TextCoursePlayer courseId={id} courseData={course} />;
  }

  return (
    <div className="min-h-screen bg-black font-sans text-gray-100">
      <Navbar />
      <div className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-900/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/30 border border-red-800 text-red-500 text-xs font-bold uppercase tracking-wider mb-6">
                <BookOpen size={14} />
                {course.category || "Professional Course"}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                {course.title}
              </h1>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                {course.description}
              </p>
              <div className="flex flex-wrap gap-6 mb-10 text-sm font-medium text-gray-400">
                <div className="flex items-center gap-2"><Clock size={18} className="text-red-600" /><span>Self-Paced</span></div>
                <div className="flex items-center gap-2"><BarChart size={18} className="text-red-600" /><span>All Levels</span></div>
                <div className="flex items-center gap-2"><Shield size={18} className="text-red-600" /><span>Certificate Included</span></div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={handleBuy} 
                  disabled={processing}
                  className="px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all shadow-lg bg-red-600 hover:bg-red-700 text-white shadow-red-900/20 hover:scale-105"
                >
                  {processing ? "Processing..." : `Enroll Now - $${course.price}`}
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl relative z-10">
                <h3 className="text-2xl font-bold text-white mb-6">What you'll learn</h3>
                <ul className="space-y-4">
                  {(course.outcomes && course.outcomes.length > 0 ? course.outcomes : ["Master AI skills", "Automate workflows"]).map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-300">
                      <CheckCircle className="text-green-500 shrink-0 mt-1" size={20} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 pt-8 border-t border-gray-800">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="flex items-center gap-2"><Lock size={14}/> Secure Payment</span>
                        <span>Lifetime Access</span>
                    </div>
                </div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-red-600 to-purple-600 rounded-3xl opacity-20 blur-xl -z-10"></div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CourseView;