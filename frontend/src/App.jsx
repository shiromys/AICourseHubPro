import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- IMPORT PAGES (Matching your exact folder structure) ---
import Home from './pages/Home';
import Login from './pages/login';       // <--- FIXED: lowercase 'l'
import Register from './pages/Register'; // <--- FIXED: file is Register.jsx
import Dashboard from './pages/dashboard'; // <--- FIXED: lowercase 'd'
import PaymentSuccess from './pages/PaymentSuccess';
import Pricing from './pages/Pricing';
import Courses from './pages/Courses';
import AdminDashboard from './pages/AdminDashboard';
import Contact from './pages/Contact';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Certificate from './pages/Certificate';
import Verify from './pages/Verify';
import ChatWidget from './components/ChatWidget';
import PrivacyPolicy from './pages/PrivacyPolicy'; // <--- IMPORT
import TermsOfUse from './pages/TermsOfUse';       // <--- IMPORT
import RefundPolicy from './pages/RefundPolicy'; 
import ScrollToTop from './components/ScrollToTop';  // <--- IMPORT

// --- IMPORT COMPONENTS ---
import TextCoursePlayer from './components/TextCoursePlayer'; 

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
  return (
    <BrowserRouter>
    <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Register />} /> {/* Maps /signup URL to Register.jsx */}
        <Route path="/register" element={<Register />} /> {/* Fallback */}
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Public Verification Route */}
        <Route path="/verify/:certId" element={<Verify />} />

        {/* Student Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/course/:id" 
          element={
            <ProtectedRoute>
              <TextCoursePlayer />
            </ProtectedRoute>
          } 
        />
        
        {/* IMPORTANT: Payment Success needs protection to access token */}
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
        

        {/* Admin Protected Route */}
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