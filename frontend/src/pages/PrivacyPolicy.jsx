import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ShieldCheck, CheckCircle } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-black font-sans text-gray-300 relative overflow-hidden">
      <Navbar />
      
      {/* Decorative Background Glow */}
      <div className="absolute top-0 right-1/2 translate-x-1/2 w-[800px] h-[600px] bg-green-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-6 py-32 max-w-4xl relative z-10">
        <div className="bg-gray-900/80 backdrop-blur-xl p-10 md:p-14 rounded-3xl shadow-2xl border border-gray-800">
          
          <div className="flex items-center gap-6 mb-10 border-b border-gray-800 pb-10">
            <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-green-500 shadow-lg">
                <ShieldCheck size={40} />
            </div>
            <div>
                <h1 className="text-4xl font-black tracking-tight text-white">Privacy Policy</h1>
                <p className="text-gray-500 font-medium mt-1">GDPR Compliant | Last Updated: March 2026</p>
            </div>
          </div>

          <div className="space-y-10 text-lg leading-relaxed">
            
            <section>
                <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2"><CheckCircle size={18} className="text-green-500"/> Data Minimization & Storage</h3>
                <p className="text-gray-400">
                  We believe in strict data minimalism. We only collect the exact information required to grant you access to our educational materials (Name and Email). <strong>We do not store your credit card information.</strong> All payments are processed securely via Stripe.
                </p>
            </section>

            <section>
                <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2"><CheckCircle size={18} className="text-green-500"/> Security & 256-bit SSL Encryption</h3>
                <p className="text-gray-400">
                  Your security is our priority. All data transmitted between your browser and our servers is secured using industry-standard <strong>256-bit SSL (Secure Sockets Layer) encryption</strong>. Passwords are cryptographically hashed and never stored in plain text.
                </p>
            </section>

            <section>
                <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2"><CheckCircle size={18} className="text-green-500"/> GDPR Rights</h3>
                <p className="text-gray-400">
                  If you are a resident of the European Economic Area (EEA), you have the right to access, correct, or permanently delete your personal data. You can exercise your "Right to be Forgotten" by emailing info@aicoursehubpro.com, and we will purge your account records within 30 days.
                </p>
            </section>

            <section>
                <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2"><CheckCircle size={18} className="text-green-500"/> Analytics & Tracking</h3>
                <p className="text-gray-400">
                  We utilize tracking scripts (such as Meta Pixel and Google Analytics) solely to understand aggregate website performance. Under GDPR guidelines, these tracking scripts remain completely blocked until you explicitly grant consent via our Cookie Banner.
                </p>
            </section>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;