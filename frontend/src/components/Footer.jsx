import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Instagram, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black text-white border-t border-gray-900 pt-16 pb-8 font-sans">
      <div className="container mx-auto px-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* 1. BRAND COLUMN */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              {/* Use your logo image if you prefer, or this text logo */}
              <img src="/logo.png" alt="AICourseHubPro Logo" className="h-10 w-auto object-contain" />
              <span className="text-xl font-black tracking-tighter">AICourseHub<span className="text-red-600">Pro</span></span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Empowering professionals with practical, prompt-based AI skills for the modern workplace.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition"><Twitter size={16} /></a>
              <a href="#" className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition"><Linkedin size={16} /></a>
              <a href="#" className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition"><Instagram size={16} /></a>
            </div>
          </div>

          {/* 2. QUICK LINKS */}
          <div>
            <h4 className="font-bold text-lg mb-6">Explore</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link to="/" className="hover:text-red-500 transition">Home</Link></li>
              <li><Link to="/courses" className="hover:text-red-500 transition">All Courses</Link></li>
              <li><Link to="/pricing" className="hover:text-red-500 transition">Pricing</Link></li>
              <li><Link to="/contact" className="hover:text-red-500 transition">Contact Support</Link></li>
            </ul>
          </div>

          {/* 3. LEGAL (NEW POLICY LINKS) */}
          <div>
            <h4 className="font-bold text-lg mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link to="/privacy" className="hover:text-red-500 transition">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-red-500 transition">Terms of Use</Link></li>
              <li><Link to="/refund-policy" className="hover:text-red-500 transition">Refund Policy</Link></li>
            </ul>
          </div>

          {/* 4. CONTACT INFO */}
          <div>
            <h4 className="font-bold text-lg mb-6">Contact</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-red-600 mt-1 shrink-0" />
                <span>5080 Spectrum Drive, Suite 575E, Addison, TX 75001</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-red-600 shrink-0" />
                <a href="mailto:info@aicoursehubpro.com" className="hover:text-white transition">info@aicoursehubpro.com</a>
              </li>
            </ul>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-xs">
            © {new Date().getFullYear()} AICourseHubPro. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-xs text-gray-500 font-medium">System Operational</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;