import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FileText, ChevronRight } from 'lucide-react';

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-black font-sans text-gray-300 relative overflow-hidden">
      <Navbar />
      
      {/* Decorative Background Glow */}
      <div className="absolute top-0 right-1/2 translate-x-1/2 w-[800px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-6 py-32 max-w-4xl relative z-10">
        <div className="bg-gray-900/80 backdrop-blur-xl p-10 md:p-14 rounded-3xl shadow-2xl border border-gray-800">
          
          <div className="flex items-center gap-6 mb-10 border-b border-gray-800 pb-10">
            <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-white shadow-lg">
                <FileText size={40} />
            </div>
            <div>
                <h1 className="text-4xl font-black tracking-tight text-white">Terms of Use</h1>
                <p className="text-gray-500 font-medium mt-1">Effective Date: January 28, 2026</p>
            </div>
          </div>

          <div className="space-y-10 text-lg leading-relaxed">
            
            <section>
                <h3 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h3>
                <p className="text-gray-400">
                  By accessing AICourseHubPro, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service.
                </p>
            </section>

            <section>
                <h3 className="text-xl font-bold text-white mb-3">2. Intellectual Property</h3>
                <p className="text-gray-400 mb-4">
                  The Service and its original content, features, and functionality are and will remain the exclusive property of AICourseHubPro.
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <li className="bg-black/30 p-3 rounded border border-gray-800 flex items-center gap-2"><ChevronRight size={14} className="text-red-500"/> No copying course content</li>
                    <li className="bg-black/30 p-3 rounded border border-gray-800 flex items-center gap-2"><ChevronRight size={14} className="text-red-500"/> No sharing accounts</li>
                    <li className="bg-black/30 p-3 rounded border border-gray-800 flex items-center gap-2"><ChevronRight size={14} className="text-red-500"/> No reselling materials</li>
                </ul>
            </section>

            <section>
                <h3 className="text-xl font-bold text-white mb-3">3. Certificates & Identity</h3>
                <p className="text-gray-400">
                  Certificates are issued to the name on the account. You agree that your profile name matches your legal identity. Names cannot be modified after certificate issuance for verification integrity.
                </p>
            </section>

            <section>
                <h3 className="text-xl font-bold text-white mb-3">4. Termination</h3>
                <p className="text-gray-400">
                  We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                </p>
            </section>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsOfUse;