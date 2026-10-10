import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';



import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import { Suspense, lazy } from 'react';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Reports = lazy(() => import('./pages/Reports'));
const Timeline = lazy(() => import('./pages/Timeline'));
const Trends = lazy(() => import('./pages/Trends'));
const RiskAssessmentPage = lazy(() => import('./pages/RiskAssessment'));
const FutureOutlookPage = lazy(() => import('./pages/FutureOutlook'));
const SpecialtyGuidancePage = lazy(() => import('./pages/SpecialtyGuidance'));
const CareNearMe = lazy(() => import('./pages/CareNearMe'));
const SoftwareValidation = lazy(() => import('./pages/admin/SoftwareValidation'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminFacilities = lazy(() => import('./pages/admin/AdminFacilities'));
const AdminSpecialties = lazy(() => import('./pages/admin/AdminSpecialties'));
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs'));
const FamilyAlerts = lazy(() => import('./pages/FamilyAlerts'));














import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Initializing Meditrack...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Verifying permissions...</p>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}


const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
              <Route path="reports" element={<Suspense fallback={<PageLoader />}><Reports /></Suspense>} />
              <Route path="timeline" element={<Suspense fallback={<PageLoader />}><Timeline /></Suspense>} />
              <Route path="trends" element={<Suspense fallback={<PageLoader />}><Trends /></Suspense>} />
              <Route path="risk-assessment" element={<Suspense fallback={<PageLoader />}><RiskAssessmentPage /></Suspense>} />
              <Route path="future-outlook" element={<Suspense fallback={<PageLoader />}><FutureOutlookPage /></Suspense>} />
              <Route path="specialty-guidance" element={<Suspense fallback={<PageLoader />}><SpecialtyGuidancePage /></Suspense>} />
              <Route path="care-near-me" element={<Suspense fallback={<PageLoader />}><CareNearMe /></Suspense>} />
              <Route path="family-alerts" element={<Suspense fallback={<PageLoader />}><FamilyAlerts /></Suspense>} />
              <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
              <Route path="settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
              <Route path="admin/users" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminUsers /></Suspense></AdminRoute>} />
              <Route path="admin/hospitals" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminFacilities /></Suspense></AdminRoute>} />
              <Route path="admin/specialties" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminSpecialties /></Suspense></AdminRoute>} />
              <Route path="admin/system-logs" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminLogs /></Suspense></AdminRoute>} />
              <Route path="admin/software-validation" element={<AdminRoute><Suspense fallback={<PageLoader />}><SoftwareValidation /></Suspense></AdminRoute>} />
            </Route>
          </Routes>
        </Router>
      </SettingsProvider>
    </AuthProvider>
  );
}
