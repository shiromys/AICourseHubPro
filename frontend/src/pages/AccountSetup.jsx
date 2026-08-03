import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Lock, Loader2, ShieldCheck } from 'lucide-react';
import API_BASE_URL from '../config';

// Shown to guest-checkout users when they try to access their certificate
// without having set a password yet. Completing this promotes their guest
// enrollment into a full, permanent account.
const AccountSetup = () => {
  document.title = 'Set Up Your Account | AICourseHubPro';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('course_id');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const email = localStorage.getItem('user_name'); // display only; real email lives server-side

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/complete-account-setup`,
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Promote to a full, persistent account.
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user_name', res.data.name);
      localStorage.setItem('user_role', res.data.user_role);
      localStorage.setItem('account_setup_complete', 'true');

      navigate(courseId ? `/certificate/${courseId}` : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.msg || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <ShieldCheck className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">One Last Step</h2>
          <p className="text-gray-400 text-sm">
            {email ? `Set a password for ${email} ` : 'Set a password '}
            to unlock your certificate and get lifetime, cross-device access to your courses.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">New Password</label>
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-red-600 focus:outline-none"
                placeholder="At least 6 characters"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Confirm Password</label>
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-red-600 focus:outline-none"
                placeholder="Re-enter password"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Set Password & Get Certificate'}
          </button>

          <Link to="/dashboard" className="block text-center text-gray-500 hover:text-white text-sm transition">
            I'll do this later
          </Link>
        </form>
      </div>
    </div>
  );
};

export default AccountSetup;
