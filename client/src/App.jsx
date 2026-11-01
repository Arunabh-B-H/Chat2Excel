import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import SupportBotModal from './components/SupportBotModal';
import ProtectedRoute from './components/ProtectedRoute';
import PricingModal from './components/PricingModal';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WorkspacePage from './pages/WorkspacePage';
import ViewExportPage from './pages/ViewExportPage';
import HistoryPage from './pages/HistoryPage';

function AppShell() {
  const location = useLocation();

  // /app has the sleek top-left corner logo trigger; / has its own landing navbar
  // Only show the navbar on other sub-pages (e.g. /history, /app/view/:id)
  const showNavbar = location.pathname !== '/' && !location.pathname.startsWith('/app');

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-slate-800 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {showNavbar && <Navbar />}

      <main className="flex-1 flex flex-col min-w-0">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Primary Unified Workspace Interface */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <WorkspacePage />
              </ProtectedRoute>
            }
          />

          {/* Dynamic View & Export Spreadsheet Routes */}
          <Route
            path="/app/view/:id"
            element={
              <ProtectedRoute>
                <ViewExportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/conversions/:id"
            element={
              <ProtectedRoute>
                <ViewExportPage />
              </ProtectedRoute>
            }
          />

          {/* Conversion History */}
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />

          {/* Backward-Compatible Redirects */}
          <Route path="/pricing" element={<Navigate to="/" replace />} />
          <Route path="/paste" element={<Navigate to="/app" replace />} />
          <Route path="/upload" element={<Navigate to="/app" replace />} />
          <Route path="/upload-screenshot" element={<Navigate to="/app" replace />} />
          <Route path="/screenshot" element={<Navigate to="/app" replace />} />
          <Route path="/ocr" element={<Navigate to="/app" replace />} />
          <Route path="/workspace" element={<Navigate to="/app" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Right-Side AI Support Bot */}
      <SupportBotModal />

      {/* Global Pricing & Razorpay Upgrade Modal */}
      <PricingModal />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </Router>
  );
}

export default App;
