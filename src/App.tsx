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
import { AlertNotificationProvider } from './context/AlertNotificationContext';
import AlertPopupToast from './components/Alerts/AlertPopupToast';

import { 
  PageSkeleton,
  DashboardSkeleton,
  ReportsSkeleton,
  TimelineSkeleton,
  TrendsSkeleton,
  RiskAssessmentSkeleton,
  FutureOutlookSkeleton,
  SpecialtyGuidanceSkeleton,
  CareNearMeSkeleton,
  FamilyAlertsSkeleton,
  ProfileSkeleton,
  SettingsSkeleton,
  AdminTableSkeleton
} from './components/common/Skeleton';
import ErrorBoundary from './components/ErrorBoundary';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] dark:bg-[#050D18] p-4 sm:p-6 md:p-8 max-w-7xl xl:max-w-[1520px] mx-auto">
        <PageSkeleton />
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
      <div className="min-h-screen bg-[#F7F9FB] dark:bg-[#050D18] p-4 sm:p-6 md:p-8 max-w-7xl xl:max-w-[1520px] mx-auto">
        <AdminTableSkeleton />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AlertNotificationProvider>
          <Router>
            <AlertPopupToast />
            <ErrorBoundary title="MediTrack Application Error">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Suspense fallback={<DashboardSkeleton />}><Dashboard /></Suspense>} />
                  <Route path="reports" element={<Suspense fallback={<ReportsSkeleton />}><Reports /></Suspense>} />
                  <Route path="timeline" element={<Suspense fallback={<TimelineSkeleton />}><Timeline /></Suspense>} />
                  <Route path="trends" element={<Suspense fallback={<TrendsSkeleton />}><Trends /></Suspense>} />
                  <Route path="risk-assessment" element={<Suspense fallback={<RiskAssessmentSkeleton />}><RiskAssessmentPage /></Suspense>} />
                  <Route path="future-outlook" element={<Suspense fallback={<FutureOutlookSkeleton />}><FutureOutlookPage /></Suspense>} />
                  <Route path="specialty-guidance" element={<Suspense fallback={<SpecialtyGuidanceSkeleton />}><SpecialtyGuidancePage /></Suspense>} />
                  <Route path="care-near-me" element={<Suspense fallback={<CareNearMeSkeleton />}><CareNearMe /></Suspense>} />
                  <Route path="family-alerts" element={<Suspense fallback={<FamilyAlertsSkeleton />}><FamilyAlerts /></Suspense>} />
                  <Route path="profile" element={<Suspense fallback={<ProfileSkeleton />}><Profile /></Suspense>} />
                  <Route path="settings" element={<Suspense fallback={<SettingsSkeleton />}><Settings /></Suspense>} />
                  <Route path="admin/users" element={<AdminRoute><Suspense fallback={<AdminTableSkeleton title="User Management" subtitle="View, search, and manage system users" />}><AdminUsers /></Suspense></AdminRoute>} />
                  <Route path="admin/hospitals" element={<AdminRoute><Suspense fallback={<AdminTableSkeleton title="Hospital Facilities" subtitle="Configure and audit registered medical clinics and centers" />}><AdminFacilities /></Suspense></AdminRoute>} />
                  <Route path="admin/specialties" element={<AdminRoute><Suspense fallback={<AdminTableSkeleton title="Clinical Specialties" subtitle="Configure doctor specialty mappings and diagnostic guidelines" />}><AdminSpecialties /></Suspense></AdminRoute>} />
                  <Route path="admin/system-logs" element={<AdminRoute><Suspense fallback={<AdminTableSkeleton title="System Audit Logs" subtitle="Audit application security logs and system activity" />}><AdminLogs /></Suspense></AdminRoute>} />
                  <Route path="admin/software-validation" element={<AdminRoute><Suspense fallback={<AdminTableSkeleton title="Software Validation" subtitle="Automated validation test runner and compliance reports" />}><SoftwareValidation /></Suspense></AdminRoute>} />
                </Route>
                {/* Fallback 404 handler: redirect any unknown routes to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </Router>
        </AlertNotificationProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
