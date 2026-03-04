import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-black font-sans text-gray-300 relative overflow-hidden">
      <Navbar />
      
      {/* Decorative Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-red-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-6 py-32 max-w-4xl relative z-10">
        <div className="bg-gray-900/80 backdrop-blur-xl p-10 md:p-14 rounded-3xl shadow-2xl border border-gray-800">
          
          <div className="flex items-center gap-6 mb-10 border-b border-gray-800 pb-10">
            <div className="bg-red-600/20 p-4 rounded-2xl border border-red-600/30 text-red-500 shadow-[0_0_30px_rgba(220,38,38,0.2)]">
                <ShieldAlert size={40} />
            </div>
            <div>
                <h1 className="text-4xl font-black tracking-tight text-white">Refund Policy</h1>
                <p className="text-gray-500 font-medium mt-1">Last Updated: March 2026</p>
            </div>
          </div>

          <div className="space-y-12 text-lg leading-relaxed">
            
            <section>
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-red-600">01.</span> General Policy
                </h3>
                <p className="text-gray-400">
                  Due to the digital nature of our course content, which is immediately accessible upon purchase, <strong className="text-white">AICourseHubPro generally does not offer refunds</strong> once a transaction is completed. All sales are considered final.
                </p>
            </section>

            <section>
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-red-600">02.</span> Non-Refundable Items
                </h3>
                <p className="text-gray-400 mb-4">
                  As stated in our Terms of Use, we make no promises regarding career outcomes or financial gains. Therefore, the following are strictly non-refundable:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-gray-400">
                        <XCircle className="text-red-500 shrink-0" size={20}/> Failure to achieve a specific job or salary
                    </div>
                    <div className="flex items-center gap-3 text-gray-400">
                        <XCircle className="text-red-500 shrink-0" size={20}/> Change of mind after purchase
                    </div>
                    <div className="flex items-center gap-3 text-gray-400">
                        <XCircle className="text-red-500 shrink-0" size={20}/> Failure to pass the final exam
                    </div>
                    <div className="flex items-center gap-3 text-gray-400">
                        <XCircle className="text-red-500 shrink-0" size={20}/> Unused course access
                    </div>
                </div>
            </section>

            <section>
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-red-600">03.</span> Exceptions
                </h3>
                <p className="text-gray-400 mb-4">
                  We will consider refund requests <strong>only</strong> in the event of a technical or billing error:
                </p>
                <ul className="space-y-3">
                    <li className="flex items-start gap-3 bg-gray-950 p-4 rounded-lg border border-gray-800">
                        <CheckCircle className="text-green-500 shrink-0 mt-1" size={20}/>
                        <span>You were charged twice for the same course due to a payment processing error.</span>
                    </li>
                </ul>
            </section>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RefundPolicy;