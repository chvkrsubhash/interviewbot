import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import LandingPage from './pages/LandingPage';
import { Login, Signup, ForgotPassword, OTPVerification } from './pages/AuthPages';

// Candidate portal
import CandidateDashboard from './pages/Candidate/Dashboard';
import InterviewSetup from './pages/Candidate/InterviewSetup';
import InterviewSimulation from './pages/Candidate/Simulation';
import InterviewReport from './pages/Candidate/Report';
import CodingEditor from './pages/Candidate/CodingEditor';
import Leaderboard from './pages/Candidate/Leaderboard';
import PlansPage from './pages/Candidate/Plans';
import ProfilePage from './pages/Candidate/Profile';

// Recruiter portal
import RecruiterDashboard from './pages/Recruiter/Dashboard';

// Admin portal
import AdminDashboard from './pages/Admin/Dashboard';
import AdminTemplates from './pages/Admin/Templates';

// Sidebar
import Sidebar from './components/Sidebar';
import GlobalAnnouncementBanner from './components/GlobalAnnouncementBanner';

// Gate controls
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-950">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 text-slate-800 dark:text-dark-50 transition-colors duration-300">
      {/* Global Announcement / Verification Banner */}
      <GlobalAnnouncementBanner />
      {/* Persistent Left Sidebar */}
      <Sidebar />
      
      {/* Scrollable Dashboard view */}
      <main className="pl-72 pr-6 pt-6 pb-12 min-h-screen flex flex-col gap-6">
        {children}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/otp-verification" element={<OTPVerification />} />

            {/* Candidate Protected Portal */}
            <Route
              path="/candidate"
              element={
                <ProtectedRoute allowedRoles={['candidate']}>
                  <CandidateDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/setup"
              element={
                <ProtectedRoute allowedRoles={['candidate']}>
                  <InterviewSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/simulate"
              element={
                <ProtectedRoute allowedRoles={['candidate']}>
                  <InterviewSimulation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/report/:id"
              element={
                <ProtectedRoute allowedRoles={['candidate']}>
                  <InterviewReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/coding"
              element={
                <ProtectedRoute allowedRoles={['candidate']}>
                  <CodingEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/leaderboard"
              element={
                <ProtectedRoute allowedRoles={['candidate']}>
                  <Leaderboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/plans"
              element={
                <ProtectedRoute allowedRoles={['candidate']}>
                  <PlansPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/profile"
              element={
                <ProtectedRoute allowedRoles={['candidate', 'recruiter', 'admin']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Recruiter Protected Portal */}
            <Route
              path="/recruiter"
              element={
                <ProtectedRoute allowedRoles={['recruiter']}>
                  <RecruiterDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/reports"
              element={
                <ProtectedRoute allowedRoles={['recruiter']}>
                  <RecruiterDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/schedule"
              element={
                <ProtectedRoute allowedRoles={['recruiter']}>
                  <RecruiterDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Portal */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/income"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/plans"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/maintenance"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/questions"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/templates"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminTemplates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/broadcast"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
