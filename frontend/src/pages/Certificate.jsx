import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { Loader2, Download, ArrowLeft, CheckCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from "react-qr-code";

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

        // 1. Get Course Info
        const courseRes = await axios.get(`http://localhost:5000/api/courses`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const course = courseRes.data.find(c => c.id === parseInt(courseId));

        // 2. Get Enrollment & Certificate ID
        const enrollRes = await axios.get(`http://localhost:5000/api/enrollment/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (enrollRes.data.status !== 'completed') {
            alert("You must complete the course to view the certificate.");
            navigate('/dashboard');
            return;
        }

        setData({
            courseTitle: course?.title || "Unknown Course",
            completionDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
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

  const handleDownload = async () => {
    const element = certificateRef.current;
    const canvas = await html2canvas(element, { scale: 3, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Certificate_${user.name.replace(/\s+/g, '_')}.pdf`);
  };

  const verificationUrl = data ? `${window.location.origin}/verify/${data.certId}` : "";

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <Loader2 className="animate-spin mb-4 text-red-600" size={48} />
        <p className="font-medium tracking-wide">Loading Credential...</p>
    </div>
  );

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
            <div 
                ref={certificateRef}
                className="bg-white relative flex"
                style={{ width: '1123px', height: '794px' }} 
            >
                {/* LEFT SIDEBAR */}
                <div className="w-24 h-full bg-black relative flex flex-col items-center py-12">
                    <div className="w-full h-full absolute top-0 left-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-gray-800 to-black opacity-50"></div>
                    <div className="w-2 h-full bg-red-600 absolute right-0 top-0"></div>
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-600 font-bold tracking-[0.5em] text-xs -rotate-90 whitespace-nowrap uppercase opacity-50">
                            Verified Credential • AICourseHubPro
                        </p>
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="flex-1 p-16 flex flex-col justify-between relative">
                    
                    {/* BACKGROUND WATERMARK (USING REAL LOGO) */}
                    <div className="absolute top-0 right-0 p-10 opacity-[0.05] pointer-events-none">
                        <img src="/logo.png" alt="Watermark" className="w-96 h-96 grayscale" />
                    </div>

                    {/* Header */}
                    <div className="flex justify-between items-start z-10">
                        <div className="flex items-center gap-6">
                            {/* --- REAL LOGO HERE --- */}
                            <img src="/logo.png" alt="Logo" className="w-20 h-auto object-contain" />
                            
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tighter leading-none">
                                    AICourseHub <span className="text-red-600">Pro</span>
                                </h2>
                                <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mt-1">Professional Certification</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-xs font-mono uppercase tracking-wide">Certificate ID</p>
                            <p className="text-gray-900 font-bold font-mono text-sm tracking-widest">{data.certId}</p>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 flex flex-col justify-center z-10 mt-8">
                        <h1 className="text-6xl font-black text-gray-200 uppercase tracking-tight absolute top-[25%] left-16 select-none -z-10 opacity-20 scale-150 origin-top-left">
                            Achievement
                        </h1>

                        <p className="text-red-600 font-bold text-sm uppercase tracking-[0.3em] mb-4">Certificate of Completion</p>
                        <p className="text-gray-500 text-xl font-medium mb-6">This is to certify that</p>
                        
                        <h2 className="text-6xl font-black text-gray-900 tracking-tight mb-8">
                            {user.name}
                        </h2>
                        
                        <p className="text-gray-500 text-xl font-medium mb-4 max-w-2xl">
                            Has successfully completed the comprehensive course curriculum for
                        </p>
                        
                        <div className="border-l-4 border-red-600 pl-6 py-2 mb-8">
                            <h3 className="text-4xl font-bold text-gray-800 leading-tight">
                                {data.courseTitle}
                            </h3>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="bg-gray-100 px-4 py-2 rounded-md flex items-center gap-2">
                                <CheckCircle size={16} className="text-green-600"/>
                                <span className="text-gray-700 font-bold text-sm">Score: {data.score}%</span>
                            </div>
                            <div className="bg-gray-100 px-4 py-2 rounded-md">
                                <span className="text-gray-700 font-bold text-sm">Issued: {data.completionDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer with QR */}
                    <div className="flex justify-between items-end border-t border-gray-200 pt-8 z-10">
                        <div>
                            <div className="mb-2">
                                <p className="text-1xl text-gray-800 font-sans font-bold">Certifying Authority</p>
                            </div>
                            <p className="text-xs font-bold text-gray-400 tracking-wider">AICourseHubPro</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-[10px] text-gray-400 font-mono leading-tight">
                                    Scan to verify<br/>authenticity
                                </p>
                            </div>
                            <div className="bg-white p-1 border border-gray-200 rounded-lg">
                                {/* DYNAMIC QR CODE */}
                                <QRCode 
                                    value={verificationUrl} 
                                    size={64} 
                                    fgColor="#000000" 
                                    bgColor="#ffffff"
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;