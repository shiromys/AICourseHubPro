import React, { useState, useEffect } from 'react'; // <--- FIXED: Added hooks imports
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from './config';
import UserProfile from './pages/UserProfile';

// --- IMPORT PAGES ---
import Home from './pages/Home';
import Login from './pages/login';      
import Register from './pages/Register';
import Dashboard from './pages/dashboard'; 
import PaymentSuccess from './pages/PaymentSuccess';
import Pricing from './pages/Pricing';
import Courses from './pages/Courses';
import AdminDashboard from './pages/AdminDashboard';
import Contact from './pages/Contact';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Certificate from './pages/Certificate';
import Verify from './pages/Verify';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';     
import RefundPolicy from './pages/RefundPolicy';
import CourseView from './pages/CourseView'; 
import Maintenance from './pages/Maintenance';

// --- IMPORT COMPONENTS ---
import ChatWidget from './components/ChatWidget';
import ScrollToTop from './components/ScrollToTop';  

// --- 1. Protection Wrapper ---
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// --- 2. Admin Protection Wrapper ---
const AdminRoute = ({ children }) => {
  const role = localStorage.getItem('user_role');
  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};


function App() {
  // =====================================================
  // 1. MAINTENANCE MODE LOGIC
  // =====================================================
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);
  const userRole = localStorage.getItem('user_role'); 

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/settings`)
      .then(res => {
        setIsMaintenance(res.data.maintenance);
        setCheckingMaintenance(false);
      })
      .catch((e) => {
        console.error("Maintenance check failed:", e);
        setCheckingMaintenance(false);
      });
  }, []);

  // 2. CHECKING STATE (Show spinner/blank while checking)
  if (checkingMaintenance) return <div className="h-screen w-screen bg-black" />;

  // 3. BLOCK ACCESS IF MAINTENANCE IS ON (And user is not Admin)
  // We allow access to '/login' so Admins can get in to turn it off.
  if (isMaintenance && userRole !== 'admin' && !window.location.pathname.includes('/login')) {
     return <Maintenance />;
  }
  // =====================================================

  return (
    <BrowserRouter>
    <ScrollToTop />
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/verify/:certId" element={<Verify />} />
        <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        
        {/* --- Course View (Public/Private logic handled inside) --- */}
        <Route path="/courses/:id" element={<CourseView />} />
        <Route path="/course/:id" element={<Navigate to="/courses/:id" replace />} />

        {/* --- Protected Routes --- */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/payment-success" 
          element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/certificate/:courseId" 
          element={
            <ProtectedRoute>
              <Certificate />
            </ProtectedRoute>
          } 
        />

        {/* --- Admin Routes --- */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            </ProtectedRoute>
          } 
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <ChatWidget />
    </BrowserRouter>
  );
}

export default App;