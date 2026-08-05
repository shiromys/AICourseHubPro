import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../config';

// Landing page for the "Resume My Course" magic link emailed at guest checkout.
// Restores course access in a new tab/browser/device without needing a password.
const Resume = () => {
  document.title = 'Resuming Your Course | AICourseHubPro';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  const token = searchParams.get('token');
  const courseId = searchParams.get('course_id');

  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setError(true);
        return;
      }

      try {
        // Confirm the token is valid and pull the account's current name/status.
        const res = await axios.get(`${API_BASE_URL}/api/account-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        localStorage.setItem('token', token);
        localStorage.setItem('user_name', res.data.name);
        localStorage.setItem('user_role', 'student');
        localStorage.setItem('account_setup_complete', res.data.account_setup_complete ? 'true' : 'false');

        navigate(courseId ? `/courses/${courseId}` : '/dashboard', { replace: true });
      } catch (err) {
        console.error('Resume link invalid or expired:', err);
        setError(true);
      }
    };

    restoreSession();
  }, [token, courseId, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">This link has expired</h2>
          <p className="text-gray-400 text-sm mb-6">
            Resume links are valid for 30 days. If you've already set up a password for this course, just log in instead.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition w-full"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white px-4">
      <Loader2 className="animate-spin h-12 w-12 text-red-600 mb-4" />
      <p className="font-medium">Resuming your course...</p>
    </div>
  );
};

export default Resume;
