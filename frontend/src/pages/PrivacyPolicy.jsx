import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Lock, Eye, Database, Shield } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-black font-sans text-gray-300 relative overflow-hidden">
      <Navbar />
      
      {/* Decorative Background Glow */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-gray-900 to-black pointer-events-none"></div>

      <div className="container mx-auto px-6 py-32 max-w-4xl relative z-10">
        <div className="bg-gray-900/80 backdrop-blur-xl p-10 md:p-14 rounded-3xl shadow-2xl border border-gray-800">
          
          <div className="flex items-center gap-6 mb-10 border-b border-gray-800 pb-10">
            <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/30 text-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                <Lock size={40} />
            </div>
            <div>
                <h1 className="text-4xl font-black tracking-tight text-white">Privacy Policy</h1>
                <p className="text-gray-500 font-medium mt-1">Your data security is our priority.</p>
            </div>
          </div>

          <div className="space-y-12 text-lg leading-relaxed">
            
            {/* Info Collection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <Eye className="text-blue-500 mb-4" size={32} />
                    <h3 className="font-bold text-white mb-2">What We Collect</h3>
                    <p className="text-sm text-gray-400">Name, email, course progress, and quiz scores. Payment data is processed securely via Stripe.</p>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <Database className="text-blue-500 mb-4" size={32} />
                    <h3 className="font-bold text-white mb-2">How We Use It</h3>
                    <p className="text-sm text-gray-400">To provide course access, generate verifiable certificates, and improve platform performance.</p>
                </div>
            </div>

            <section>
                <h3 className="text-2xl font-bold text-white mb-4">Data Security</h3>
                <div className="flex gap-4 items-start">
                    <Shield className="text-green-500 shrink-0 mt-1" size={24} />
                    <p className="text-gray-400">
                        We implement industry-standard security measures. Your passwords are hashed using bcrypt before storage. We do not sell your personal data to third parties.
                    </p>
                </div>
            </section>

            <section>
                <h3 className="text-2xl font-bold text-white mb-4">Third-Party Services</h3>
                <p className="text-gray-400 mb-4">
                  We may employ third-party companies (like OpenAI for support chat and Stripe for payments) to facilitate our Service. These third parties have access to your Personal Data only to perform these tasks on our behalf.
                </p>
            </section>

            <div className="bg-black/40 p-6 rounded-xl border border-gray-800 text-center">
                <p className="text-gray-400 text-sm">
                  Questions about your data? Contact our team at <br/>
                  <a href="mailto:privacy@aicoursehubpro.com" className="text-white font-bold hover:underline">info@aicoursehubpro.com</a>
                </p>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;