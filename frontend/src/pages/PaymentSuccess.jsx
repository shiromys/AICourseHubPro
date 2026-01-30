import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import API_BASE_URL from '../config';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  
  // Extract data from URL (sent by Backend during Stripe redirect)
  const sessionId = searchParams.get('session_id');
  const courseId = searchParams.get('course_id');

  useEffect(() => {
    const verifyEnrollment = async () => {
      if (!sessionId || !courseId) {
        setStatus('error');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
           // If user somehow lost session, force login (rare edge case)
           navigate('/login'); 
           return;
        }

        // Call the NEW backend endpoint
        await axios.post(`${API_BASE_URL}/api/verify-payment`, 
          { session_id: sessionId, course_id: courseId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setStatus('success');
        
        // Auto-redirect to dashboard after 3 seconds
        setTimeout(() => navigate('/dashboard'), 3000);

      } catch (error) {
        console.error("Payment verification failed:", error);
        setStatus('error');
      }
    };

    verifyEnrollment();
  }, [sessionId, courseId, navigate]);

  return (
    <div className="min-h-screen bg-black font-sans text-gray-100 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 p-8 rounded-2xl text-center shadow-2xl">
          
          {status === 'verifying' && (
            <>
              <Loader2 className="animate-spin h-16 w-16 text-blue-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-2">Verifying Payment...</h2>
              <p className="text-gray-400">Please wait while we confirm your enrollment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-2 text-green-500">Payment Successful!</h2>
              <p className="text-gray-400 mb-6">You have been enrolled in the course.</p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full"
              >
                Go to Dashboard
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-2 text-red-500">Something went wrong</h2>
              <p className="text-gray-400 mb-6">We couldn't verify your payment automatically.</p>
              <button 
                onClick={() => navigate('/contact')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full"
              >
                Contact Support
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;