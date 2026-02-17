import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Menu, X, LayoutDashboard, ChevronRight } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // --- STATE ---
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState(''); // Added Role State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // --- EFFECT: CHECK AUTH ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedName = localStorage.getItem('user_name');
    const storedRole = localStorage.getItem('user_role'); // Get Role
    
    if (token) {
      setIsLoggedIn(true);
      setUserName(storedName || 'Learner');
      setUserRole(storedRole?.toLowerCase() || 'student');
    } else {
      setIsLoggedIn(false);
      setUserName('');
      setUserRole('');
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setIsOpen(false);
    navigate('/login');
  };

  const closeMenu = () => setIsOpen(false);

  // Helper to decide if "Courses" link should be visible
  // Visible if: User is NOT logged in OR User IS logged in but is an 'admin'
  const showCoursesLink = !isLoggedIn || (isLoggedIn && userRole === 'admin');

  return (
    <nav className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 z-50 h-20 transition-all">
      <div className="container mx-auto px-6 h-full flex items-center justify-between">
        
        {/* --- 1. LOGO --- */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { navigate('/'); closeMenu(); }}>
           <img src="/logo.png" alt="AICourseHubPro" className="h-16 w-auto object-contain" />
        </div>

        {/* --- 2. DESKTOP MENU --- */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-gray-600 hover:text-red-600 transition">Home</Link>
          
          {/* CONDITIONAL COURSES LINK */}
          {showCoursesLink && (
            <Link to="/courses" className="text-sm font-medium text-gray-600 hover:text-red-600 transition">Courses</Link>
          )}

          <Link to="/pricing" className="text-sm font-medium text-gray-600 hover:text-red-600 transition">Pricing</Link>
          <Link to="/contact" className="text-sm font-medium text-gray-600 hover:text-red-600 transition">Contact</Link>
          
          <div className="h-4 w-px bg-gray-200"></div>

          {/* AUTH BUTTONS */}
          {isLoggedIn ? (
            <div className="flex items-center gap-6">
              <Link to="/dashboard" className="text-sm font-medium text-gray-700 hover:text-red-600 transition flex items-center gap-1">
                <LayoutDashboard size={18} /> Dashboard
              </Link>

              <Link to="/profile" className="text-sm font-bold text-gray-900 flex items-center gap-2 hover:text-red-600 transition">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs font-bold">
                  {userName?.charAt(0)}
                </div>
                {userName?.split(' ')[0]}
              </Link>

              <button onClick={handleLogout} className="text-sm font-bold text-gray-400 hover:text-red-600 transition">
                <LogOut size={18} />
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

        {/* --- 3. MOBILE TOGGLE --- */}
        <button className="md:hidden p-2 text-gray-700 rounded-lg hover:bg-gray-100 transition" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* --- 4. MOBILE MENU --- */}
      {isOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 shadow-2xl flex flex-col p-6 animate-in slide-in-from-top-5 h-[calc(100vh-80px)] overflow-y-auto">
          <div className="flex flex-col gap-4">
            <Link to="/" onClick={closeMenu} className="text-lg font-medium text-gray-800 py-2 border-b border-gray-50 flex justify-between">Home <ChevronRight size={16} className="text-gray-300"/></Link>
            
            {showCoursesLink && (
              <Link to="/courses" onClick={closeMenu} className="text-lg font-medium text-gray-800 py-2 border-b border-gray-50 flex justify-between">Courses <ChevronRight size={16} className="text-gray-300"/></Link>
            )}
            
            <Link to="/pricing" onClick={closeMenu} className="text-lg font-medium text-gray-800 py-2 border-b border-gray-50 flex justify-between">Pricing <ChevronRight size={16} className="text-gray-300"/></Link>
            <Link to="/contact" onClick={closeMenu} className="text-lg font-medium text-gray-800 py-2 border-b border-gray-50 flex justify-between">Contact <ChevronRight size={16} className="text-gray-300"/></Link>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-100">
            {isLoggedIn ? (
              <div className="flex flex-col gap-4">
                <Link to="/profile" onClick={closeMenu} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl active:bg-gray-100 transition">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
                    {userName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-500">View Profile</p>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-gray-400"/>
                </Link>

                <Link to="/dashboard" onClick={closeMenu} className="w-full bg-black text-white py-3 rounded-xl font-bold text-center flex items-center justify-center gap-2">
                  <LayoutDashboard size={18} /> Go to Dashboard
                </Link>

                <button onClick={handleLogout} className="w-full border border-red-200 text-red-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-50">
                  Logout <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link to="/login" onClick={closeMenu} className="w-full text-center font-bold text-gray-900 py-3 border-2 border-gray-100 rounded-xl hover:bg-gray-50">Log In</Link>
                <Link to="/register" onClick={closeMenu} className="w-full text-center font-bold bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 shadow-lg">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;