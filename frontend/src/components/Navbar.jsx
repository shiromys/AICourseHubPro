import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 1. Check if token exists
    const token = localStorage.getItem('token');
    const storedName = localStorage.getItem('user_name');
    
    if (token) {
      setIsLoggedIn(true);
      // 2. Set the name if it exists, otherwise default to 'Learner'
      setUserName(storedName || 'Learner');
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear(); // Clear all data
    setIsLoggedIn(false);
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
           <img 
             src="/logo.png" 
             alt="AICourseHubPro" 
             className="h-20 w-auto object-contain" 
           />
           {/* Optional: Keep the text if you want Logo + Text, otherwise delete the span below */}
           {/* <span className="text-xl font-bold tracking-tight text-gray-900">
             AI Course Hub<span className="text-red-600">Pro</span>
           </span> */}
        </div>

        {/* Links */}
        <div className="flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-gray-600 hover:text-red-600 transition">Home</Link>
          <Link to="/courses" className="text-sm font-medium text-gray-600 hover:text-red-600 transition">Courses</Link>
          <Link to="/pricing" className="text-sm font-medium text-gray-600 hover:text-red-600 transition">Pricing</Link>

          <Link to="/contact" className="text-sm font-medium text-gray-600 hover:text-red-600 transition">Contact</Link>
          
          <div className="h-4 w-px bg-gray-200"></div>

        {isLoggedIn ? (
        <div className="flex items-center gap-6">
          {/* Clickable Name -> Goes to Profile */}
          <Link to="/profile" className="text-sm font-bold text-gray-900 flex items-center gap-2 hover:text-red-600 transition">
            <User size={18} /> Hi, {userName}
         </Link>
    
         <button onClick={handleLogout} className="text-sm font-bold text-red-600 hover:text-red-700 transition flex items-center gap-1">
           Logout <LogOut size={16} />
         </button>
       </div>
      ) : (


            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-bold text-gray-900 hover:text-red-600 transition">Log In</Link>
              <Link to="/register" className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-full hover:bg-red-600 transition shadow-lg shadow-gray-200">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;