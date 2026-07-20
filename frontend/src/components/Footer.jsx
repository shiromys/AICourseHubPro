import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Mail, MapPin, Phone } from 'lucide-react';

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const PinterestIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
  </svg>
);

const Footer = () => {
  return (
    <footer className="bg-black text-white border-t border-gray-900 pt-16 pb-8 font-sans">
      <div className="container mx-auto px-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* 1. BRAND COLUMN */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <img src="/logo.png" alt="AICourseHubPro Logo" className="h-10 w-auto object-contain" />
              <span className="text-xl font-black tracking-tighter">
                AICourseHub<span className="text-red-600">Pro</span>
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Empowering professionals with practical, prompt-based AI skills for the modern workplace.
            </p>
            <div className="flex gap-3">
              <a href="https://x.com/aicoursehubpro" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition" title="X / Twitter">
                <XIcon />
              </a>
              <a href="https://www.facebook.com/aicoursehubpro" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition" title="Facebook">
                <FacebookIcon />
              </a>
              <a href="https://www.instagram.com/aicoursehubpro/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition" title="Instagram">
                <InstagramIcon />
              </a>
              <a href="https://in.pinterest.com/aicoursehubpro/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition" title="Pinterest">
                <PinterestIcon />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition" title="LinkedIn (coming soon)">
                <Linkedin size={16} />
              </a>
            </div>
          </div>

          {/* 2. QUICK LINKS */}
          <div>
            <h4 className="font-bold text-lg mb-6">Explore</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link to="/" className="hover:text-red-500 transition">Home</Link></li>
              <li><Link to="/courses" className="hover:text-red-500 transition">All Courses</Link></li>
              <li><Link to="/pricing" className="hover:text-red-500 transition">Pricing</Link></li>
              <li><Link to="/blog" className="hover:text-red-500 transition">Blog</Link></li>
              <li><Link to="/contact" className="hover:text-red-500 transition">Contact Support</Link></li>
            </ul>
          </div>

          {/* 3. LEGAL */}
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
                <a href="mailto:info@aicoursehubpro.com" className="hover:text-white transition">
                  info@aicoursehubpro.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-red-600 shrink-0" />
                <a href="tel:+18009718013" className="hover:text-white transition">
                  +1 (800) 971-8013
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-xs">
            © {new Date().getFullYear()} AICourseHubPro. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://www.producthunt.com/products/aicoursehubpro?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-aicoursehubpro"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                alt="AICourseHubPro - Master AI for Business — No Coding Needed | Product Hunt"
                width="180"
                height="39"
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1152739&theme=dark&t=1779383838789"
              />
            </a>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500 font-medium">System Operational</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;