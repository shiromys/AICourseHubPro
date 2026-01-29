import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle } from 'lucide-react';
import Footer from '../components/Footer';

const Contact = () => {
  const [formData, setFormData] = useState({ firstName: '', email: '', subject: 'General Inquiry', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Even if not logged in, we allow contact, but if token exists, we send it.
      await axios.post('http://localhost:5000/api/contact', formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setSuccess(true);
      setFormData({ firstName: '', email: '', subject: 'General Inquiry', message: '' });
    } catch (error) {
      console.error("Failed to send message", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />

      <div className="container mx-auto px-6 py-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-2xl shadow-xl overflow-hidden">
          
          {/* LEFT SIDE: Contact Info */}
          <div className="bg-gray-900 p-10 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-4xl font-black mb-6 tracking-tight">Get in touch</h1>
              <p className="text-gray-400 mb-10 text-lg leading-relaxed">
                Have a question about our AI courses? Need help with a certificate? We're here to help.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Mail className="text-red-500 mt-1" />
                  <div>
                    <h3 className="font-bold text-sm text-gray-300 uppercase tracking-wider">Email Address</h3>
                    <p className="text-lg font-medium">info@aicoursehubpro.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="text-red-500 mt-1" />
                  <div>
                    <h3 className="font-bold text-sm text-gray-300 uppercase tracking-wider">Phone</h3>
                    <p className="text-lg font-medium">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="text-red-500 mt-1" />
                  <div>
                    <h3 className="font-bold text-sm text-gray-300 uppercase tracking-wider">Office</h3>
                    <p className="text-lg font-medium">
                        5080 Spectrum Drive, Suite 575E<br/>Addison, TX 75001
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Circle */}
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-red-600 rounded-full opacity-20 blur-3xl"></div>
          </div>

          {/* RIGHT SIDE: Form */}
          <div className="p-10 lg:p-12 bg-white flex flex-col justify-center">
            {success ? (
               <div className="text-center py-12 animate-fade-in">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Message Sent!</h2>
                  <p className="text-gray-500">We'll get back to you within 24 hours.</p>
                  <button onClick={() => setSuccess(false)} className="mt-8 text-red-600 font-bold hover:underline">
                      Send another message
                  </button>
               </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Name</label>
                        <input 
                            required 
                            type="text" 
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                            placeholder="John Doe"
                            value={formData.firstName}
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                        <input 
                            required 
                            type="email" 
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                            placeholder="john@company.com"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subject</label>
                        <select 
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                            value={formData.subject}
                            onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        >
                            <option>General Inquiry</option>
                            <option>Course Support</option>
                            <option>Billing Question</option>
                            <option>Partnership</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Message</label>
                        <textarea 
                            required 
                            rows="4" 
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none"
                            placeholder="Tell us how we can help..."
                            value={formData.message}
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                        ></textarea>
                    </div>

                    <button 
                        disabled={loading}
                        type="submit" 
                        className="w-full bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-red-700 hover:shadow-red-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                        {loading ? 'Sending...' : 'Send Message'}
                    </button>
                </form>
            )}
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;