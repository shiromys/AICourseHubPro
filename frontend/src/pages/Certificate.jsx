import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { Loader2, Download, ArrowLeft } from 'lucide-react';
import CertificateCanvas, { downloadCertificatePdf } from '../components/CertificateCanvas';
import API_BASE_URL from '../config';

const Certificate = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const certificateRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [user, setUser] = useState({ name: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userName = localStorage.getItem('user_name');
        setUser({ name: userName });

        if (!token) { navigate('/login'); return; }

        // Guest-checkout users must set a password before getting a certificate.
        // Checked against the backend (not just localStorage) since a client-side
        // flag alone could be edited around.
        const statusRes = await axios.get(`${API_BASE_URL}/api/account-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        localStorage.setItem('account_setup_complete', statusRes.data.account_setup_complete ? 'true' : 'false');
        if (!statusRes.data.account_setup_complete) {
          navigate(`/setup-account?course_id=${courseId}`, { replace: true });
          return;
        }

        // 1. Get Course Info
        const courseRes = await axios.get(`${API_BASE_URL}/api/courses`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const course = courseRes.data.find(c => c.id === parseInt(courseId));

        // 2. Get Enrollment & Certificate ID
        const enrollRes = await axios.get(`${API_BASE_URL}/api/enrollment/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (enrollRes.data.status !== 'completed') {
            alert("You must complete the course to view the certificate.");
            navigate('/dashboard');
            return;
        }

        setData({
            courseTitle: course?.title || "Unknown Course",
            completionDate: enrollRes.data.completion_date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            score: enrollRes.data.score || 100,
            certId: enrollRes.data.certificate_id || "PENDING"
        });

      } catch (error) {
        console.error("Error loading certificate:", error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, navigate]);

  const handleDownload = () => downloadCertificatePdf(certificateRef.current, user.name);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <Loader2 className="animate-spin mb-4 text-red-600" size={48} />
        <p className="font-medium tracking-wide">Loading Credential...</p>
    </div>
  );

  // --- THE CRITICAL FIX: Stops the app from crashing if the data is empty! ---
  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-900 font-sans text-gray-100 flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col items-center justify-start pt-32 pb-20 px-4">
        
        {/* --- TOOLBAR --- */}
        <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white font-medium transition group">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/> Back to Dashboard
            </button>
            <button onClick={handleDownload} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition shadow-lg shadow-red-900/20">
                <Download size={20}/> Download PDF
            </button>
        </div>

        {/* CERTIFICATE CANVAS */}
        <div className="shadow-2xl shadow-black rounded-sm overflow-hidden">
            <CertificateCanvas
                ref={certificateRef}
                name={user.name}
                courseTitle={data.courseTitle}
                completionDate={data.completionDate}
                score={data.score}
                certId={data.certId}
            />
        </div>
      </div>
    </div>
  );
};

export default Certificate;