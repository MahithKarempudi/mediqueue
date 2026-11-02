import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { UnauthorizedPage } from '@/pages/auth/UnauthorizedPage';

// Role Dashboards
import { PatientDashboard } from '@/pages/patient/PatientDashboard';
import { StaffDashboard } from '@/pages/staff/StaffDashboard';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { GovernmentDashboard } from '@/pages/government/GovernmentDashboard';
import { SuperAdminDashboard } from '@/pages/superadmin/SuperAdminDashboard';

// Patient Portal Views
import { HospitalDirectoryPage } from '@/pages/patient/HospitalDirectoryPage';
import { BookAppointmentPage } from '@/pages/patient/BookAppointmentPage';
import { LiveQueueTrackerPage } from '@/pages/patient/LiveQueueTrackerPage';
import { PatientReportsPage } from '@/pages/patient/PatientReportsPage';
import { PatientBillingPage } from '@/pages/patient/PatientBillingPage';
import { PatientTimelinePage } from '@/pages/patient/PatientTimelinePage';
import { EmergencyRoutingPage } from '@/pages/patient/EmergencyRoutingPage';
import { AiAppointmentBookingPage } from '@/pages/patient/AiAppointmentBookingPage';

// Hospital Staff Portal Views
import { WardBedsPage } from '@/pages/staff/WardBedsPage';
import { PatientRegistrationPage } from '@/pages/staff/PatientRegistrationPage';
import { DoctorOpdQueuePage } from '@/pages/staff/DoctorOpdQueuePage';
import { IpdAdmissionsPage } from '@/pages/staff/IpdAdmissionsPage';
import { DiagnosticOrdersPage } from '@/pages/staff/DiagnosticOrdersPage';
import { StaffBillingPage } from '@/pages/staff/StaffBillingPage';

// Hospital Admin Portal Views
import { AdminBedsPage } from '@/pages/admin/AdminBedsPage';
import { AdminDepartmentsPage } from '@/pages/admin/AdminDepartmentsPage';
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage';
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage';

// Government Portal Views
import { GovernmentSurgePage } from '@/pages/government/GovernmentSurgePage';
import { GovernmentReportsPage } from '@/pages/government/GovernmentReportsPage';

// Super Admin Portal Views
import { HospitalOnboardingPage } from '@/pages/superadmin/HospitalOnboardingPage';
import { AccountProvisioningPage } from '@/pages/superadmin/AccountProvisioningPage';
import { SuperAdminLogsPage } from '@/pages/superadmin/SuperAdminLogsPage';

const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/patient/dashboard" replace />;

  switch (user.role) {
    case 'patient':
      return <Navigate to="/patient/dashboard" replace />;
    case 'staff':
      return <Navigate to="/staff/dashboard" replace />;
    case 'hospital_admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'government_officer':
      return <Navigate to="/government/dashboard" replace />;
    case 'super_admin':
      return <Navigate to="/superadmin/dashboard" replace />;
    default:
      return <Navigate to="/patient/dashboard" replace />;
  }
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Patient Portal Routes */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={['patient', 'super_admin']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/patient/dashboard" replace />} />
            <Route path="dashboard" element={<PatientDashboard />} />
            <Route path="hospitals" element={<HospitalDirectoryPage />} />
            <Route path="book" element={<BookAppointmentPage />} />
            <Route path="ai-booking" element={<AiAppointmentBookingPage />} />
            <Route path="ai-assistant" element={<AiAppointmentBookingPage />} />
            <Route path="queue" element={<LiveQueueTrackerPage />} />
            <Route path="reports" element={<PatientReportsPage />} />
            <Route path="billing" element={<PatientBillingPage />} />
            <Route path="timeline" element={<PatientTimelinePage />} />
            <Route path="emergency" element={<EmergencyRoutingPage />} />
          </Route>

          {/* Hospital Staff Portal Routes */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={['staff', 'super_admin']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/staff/dashboard" replace />} />
            <Route path="dashboard" element={<StaffDashboard />} />
            <Route path="patients" element={<PatientRegistrationPage />} />
            <Route path="registration" element={<PatientRegistrationPage />} />
            <Route path="opd" element={<DoctorOpdQueuePage />} />
            <Route path="opd-queue" element={<DoctorOpdQueuePage />} />
            <Route path="beds" element={<WardBedsPage />} />
            <Route path="admissions" element={<IpdAdmissionsPage />} />
            <Route path="diagnostics" element={<DiagnosticOrdersPage />} />
            <Route path="billing" element={<StaffBillingPage />} />
            <Route path="ai-booking" element={<AiAppointmentBookingPage />} />
          </Route>

          {/* Hospital Admin Portal Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['hospital_admin', 'super_admin']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="beds" element={<AdminBedsPage />} />
            <Route path="departments" element={<AdminDepartmentsPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
          </Route>

          {/* Government Officer Routes */}
          <Route
            path="/government"
            element={
              <ProtectedRoute allowedRoles={['government_officer', 'super_admin']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/government/dashboard" replace />} />
            <Route path="dashboard" element={<GovernmentDashboard />} />
            <Route path="surge-map" element={<GovernmentSurgePage />} />
            <Route path="surge" element={<GovernmentSurgePage />} />
            <Route path="reports" element={<GovernmentReportsPage />} />
          </Route>

          {/* Super Admin Routes */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="hospitals" element={<HospitalOnboardingPage />} />
            <Route path="accounts" element={<AccountProvisioningPage />} />
            <Route path="logs" element={<SuperAdminLogsPage />} />
          </Route>

          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
