import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { CheckCircle, ArrowRight, BookOpen } from 'lucide-react';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('course_id');

  return (
    <div className="min-h-screen bg-black font-sans text-white flex flex-col">
      <Navbar />
      
      {/* FIX APPLIED: 
         - 'pt-32': Pushes content down below the navbar.
         - 'flex-1': Ensures it takes up remaining height to center vertically.
      */}
      <div className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-6">
        
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 p-10 rounded-3xl shadow-2xl text-center relative overflow-hidden">
          
          {/* Decorative Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-green-500/20 blur-3xl rounded-full pointer-events-none"></div>

          {/* Success Icon */}
          <div className="relative z-10 flex justify-center mb-6">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              <CheckCircle size={48} className="text-green-500" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="relative z-10 text-4xl font-black mb-2 tracking-tight text-white">
            You're In!
          </h1>
          <p className="relative z-10 text-gray-400 mb-8 text-lg">
            Payment successful. Your seat is confirmed.
          </p>

          {/* Action Button */}
          <button 
            onClick={() => navigate('/dashboard')}
            className="relative z-10 w-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-lg hover:shadow-red-900/30 flex items-center justify-center gap-2 group"
          >
            Start Learning Now 
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
          </button>

          {/* Secondary Link */}
          <button 
            onClick={() => navigate('/courses')}
            className="relative z-10 mt-4 text-gray-500 hover:text-gray-300 text-sm font-medium flex items-center justify-center gap-2 transition"
          >
            <BookOpen size={14}/> Browse More Courses
          </button>
        </div>

        {/* Footer Text (from your screenshot) */}
        <div className="mt-12 text-center max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">Ready to Future-Proof Your Career?</h2>
            <p className="text-gray-500">
                Join 1000+ professionals who are leading the AI revolution in their companies.
            </p>
        </div>

      </div>
    </div>
  );
};

export default PaymentSuccess;