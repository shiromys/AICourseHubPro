import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import API_BASE_URL from '../config';

const Verify = () => {
  const { certId } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const verifyCert = async () => {
      try {
        // --- FIX: Updated URL to match Backend Route ---
        const res = await axios.get(`${API_BASE_URL}/api/verify-certificate/${certId}`);
        
        setResult({ valid: true, ...res.data });
      } catch (error) {
        setResult({ valid: false });
      } finally {
        setLoading(false);
      }
    };
    verifyCert();
  }, [certId]);

  return (
    <div className="min-h-screen bg-black font-sans text-gray-100 flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center">
        
        {loading ? (
           <Loader2 className="animate-spin text-red-600 mb-4" size={48} />
        ) : result && result.valid ? (
           // --- VALID CERTIFICATE CARD ---
           <div className="bg-gray-900 border border-green-500/30 p-10 rounded-2xl max-w-md w-full shadow-2xl shadow-green-900/20 animate-fade-in">
              <div className="flex justify-center mb-6">
                 <div className="bg-green-500/20 p-4 rounded-full border border-green-500/30">
                    <CheckCircle size={64} className="text-green-500" />
                 </div>
              </div>
              <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Valid Certificate</h1>
              <p className="text-gray-400 mb-8 text-sm">This credential has been verified.</p>
              
              <div className="space-y-4 text-left bg-black/50 p-6 rounded-xl border border-gray-800">
                 <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Student</p>
                    <p className="text-xl font-bold text-white">{result.student_name}</p>
                 </div>
                 <div className="h-px bg-gray-800 my-2"></div>
                 <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Course</p>
                    <p className="text-lg font-bold text-white leading-tight">{result.course_title}</p>
                 </div>
                 <div className="h-px bg-gray-800 my-2"></div>
                 <div className="flex justify-between items-end">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Date</p>
                        <p className="text-white font-medium">{result.completion_date}</p>
                    </div>
                 </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-800">
                  <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">Certificate ID</p>
                  <p className="text-gray-500 font-mono text-xs mt-1">{certId}</p>
              </div>
           </div>
        ) : (
           // --- INVALID CERTIFICATE CARD ---
           <div className="bg-gray-900 border border-red-500/30 p-10 rounded-2xl max-w-md w-full shadow-2xl shadow-red-900/10">
              <div className="flex justify-center mb-6">
                 <div className="bg-red-500/20 p-4 rounded-full border border-red-500/30">
                    <XCircle size={64} className="text-red-500" />
                 </div>
              </div>
              <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Invalid Credential</h1>
              <p className="text-gray-400 mb-6">We could not find a valid certificate with this ID.</p>
              <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                  <p className="font-mono text-red-400 font-bold text-sm">{certId}</p>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default Verify;