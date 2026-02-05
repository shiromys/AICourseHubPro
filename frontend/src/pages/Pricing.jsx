import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';
import Footer from '../components/Footer';
import { Check, HelpCircle, Loader2, Zap } from 'lucide-react';
import API_BASE_URL from '../config';

const Pricing = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem('token');

  const handleBuy = async (courseId) => {
    // 1. If not logged in, force login
    if (!isLoggedIn) {
      alert("Please log in or create an account to purchase.");
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // 2. Call Backend to get Stripe URL
      await axios.post(`${API_BASE_URL}/api/create-checkout-session`, ... 
        { course_id: courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 3. Redirect to Stripe
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Failed to initialize payment. Please check your connection.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <div className="bg-black pt-40 pb-24 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-900/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-900/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
        
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Simple, Transparent <span className="text-red-600">Pricing</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
            Invest in your future for less than the cost of a textbook. No monthly subscriptions. No hidden fees.
          </p>
        </div>
      </div>

      {/* --- PRICING CARDS --- */}
      <div className="py-24 bg-gray-50 -mt-10 relative z-20 rounded-t-[3rem]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
            
            {/* CARD 1: SINGLE COURSE (Standard) */}
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-red-200 transition-all duration-300 relative group">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Single Course</h3>
              <p className="text-gray-500 mb-6">Master one specific skill deeply.</p>
              
              <div className="text-5xl font-black text-gray-900 mb-8">
                $29<span className="text-lg font-medium text-gray-500">/course</span>
              </div>

              <ul className="space-y-4 mb-10 text-gray-600 font-medium">
                <li className="flex items-center gap-3">
                  <Check size={20} className="text-green-500" /> Lifetime access to 1 course
                </li>
                <li className="flex items-center gap-3">
                  <Check size={20} className="text-green-500" /> Verifiable Certificate
                </li>
                <li className="flex items-center gap-3">
                  <Check size={20} className="text-green-500" /> Regular Email Support
                </li>
              </ul>

              <button 
                onClick={() => navigate('/courses')}
                className="w-full py-4 bg-white border-2 border-gray-200 text-gray-900 font-bold rounded-xl hover:border-black hover:bg-gray-50 transition-all"
              >
                Browse Courses
              </button>
            </div>

            {/* CARD 2: BUNDLE (Premium/Featured) */}
            <div className="relative bg-gray-900 text-white p-10 rounded-3xl shadow-2xl border-2 border-red-600 transform md:scale-105 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 rounded-full blur-[80px] pointer-events-none"></div>

              <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider shadow-lg">
                Best Value
              </div>

              <h3 className="text-xl font-bold mb-2 relative z-10 flex items-center gap-2">
                <Zap className="text-red-500" size={24} /> Pro Bundle
              </h3>
              <p className="text-gray-400 mb-6 relative z-10">Access everything. Forever.</p>
              
              <div className="text-5xl font-black text-white mb-8 relative z-10">
                $159<span className="text-lg font-medium text-gray-500">/one-time</span>
              </div>

              <ul className="space-y-4 mb-10 text-gray-300 font-medium relative z-10">
                <li className="flex items-center gap-3">
                  <Check size={20} className="text-red-500" /> <span className="text-white font-bold">Access to ALL Courses for Lifetime</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check size={20} className="text-red-500" /> Verifiable Certificate
                </li>
                <li className="flex items-center gap-3">
                  <Check size={20} className="text-red-500" /> Priority Support
                </li>
                <li className="flex items-center gap-3">
                  <Check size={20} className="text-red-500" /> Future Course Updates (Free)
                </li>
              </ul>

              {/* --- STRIPE PAYMENT BUTTON --- */}
              <button 
                onClick={() => handleBuy(1)} // Buying Course ID 1
                disabled={loading}
                className="w-full py-4 bg-red-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:bg-red-700 hover:scale-[1.02] transition-all relative z-10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Get All-Access Pass"}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* --- FAQ SECTION --- */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl font-black text-center mb-12 flex items-center justify-center gap-3">
            <HelpCircle className="text-red-600" /> Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            {[
              { q: "Is this a monthly subscription?", a: "No! We hate subscriptions too. You pay once and own the content forever." },
              { q: "Can I upgrade later?", a: "Yes. you can buy a single course first and then upgrade to the bundle later." },
              { q: "Do you offer refunds?", a: "No, we do not offer any refunds excluding special cases such as double payments." },
              { q: "Are the certificates accredited?", a: "Our certificates are industry-recognized and verifiable via a unique ID, perfect for LinkedIn." },
            ].map((faq, i) => (
              <div key={i} className="border-b border-gray-100 pb-6">
                <h4 className="font-bold text-lg text-gray-900 mb-2">{faq.q}</h4>
                <p className="text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12 text-center text-gray-500 text-sm">
         <p>&copy; {new Date().getFullYear()} AICourseHubPro. All rights reserved.</p>
      </footer>
      <Footer />
    </div>
  );
};

export default Pricing;