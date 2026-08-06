import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { ToastProvider } from '@/components/ui/Toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingScreen } from '@/components/LoadingScreen';

import { AuthPage } from '@/pages/auth/AuthPage';

// Student pages
import { StudentDashboard } from '@/pages/student/StudentDashboard';
import { HadithsPage } from '@/pages/student/HadithsPage';
import { DailyLessonsPage } from '@/pages/student/DailyLessonsPage';
import { ProgressPage } from '@/pages/student/ProgressPage';
import { StudentCertificates } from '@/pages/student/CertificatesPage';

// Shared pages
import { MessagesPage } from '@/pages/shared/MessagesPage';
import { NotificationsPage } from '@/pages/shared/NotificationsPage';
import { ProfilePage } from '@/pages/shared/ProfilePage';
import { ManagementDashboard } from '@/pages/shared/ManagementDashboard';
import { StudentsManagementPage } from '@/pages/shared/StudentsManagementPage';
import { ApprovalsPage } from '@/pages/shared/ApprovalsPage';
import { StudentProgressPage } from '@/pages/shared/StudentProgressPage';
import { IssueCertificatesPage } from '@/pages/shared/IssueCertificatesPage';

// Admin pages
import { StaffManagementPage } from '@/pages/admin/StaffManagementPage';
import { HadithsManagementPage } from '@/pages/admin/HadithsManagementPage';
import { CyclesPage } from '@/pages/admin/CyclesPage';
import { SettingsPage, OperationLogPage, BackupsPage, FilesPage } from '@/pages/admin/AdminPages';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  const home = user.role === 'admin' ? '/admin' : user.role === 'supervisor' ? '/supervisor' : '/student';
  return <Navigate to={home} replace />;
}

function StudentApp() {
  return (
    <DashboardLayout basePath="/student">
      <Routes>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="daily" element={<DailyLessonsPage />} />
        <Route path="hadiths" element={<HadithsPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="certificates" element={<StudentCertificates />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

function SupervisorApp() {
  return (
    <DashboardLayout basePath="/supervisor">
      <Routes>
        <Route path="dashboard" element={<ManagementDashboard />} />
        <Route path="students" element={<StudentsManagementPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="student-progress" element={<StudentProgressPage />} />
        <Route path="issue-certificates" element={<IssueCertificatesPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="notifications" element={<NotificationsPage canSend />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

function AdminApp() {
  return (
    <DashboardLayout basePath="/admin">
      <Routes>
        <Route path="dashboard" element={<ManagementDashboard />} />
        <Route path="students" element={<StudentsManagementPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="student-progress" element={<StudentProgressPage />} />
        <Route path="issue-certificates" element={<IssueCertificatesPage />} />
        <Route path="supervisors" element={<StaffManagementPage role="supervisor" />} />
        <Route path="admins" element={<StaffManagementPage role="admin" />} />
        <Route path="manage-hadiths" element={<HadithsManagementPage />} />
        <Route path="cycles" element={<CyclesPage />} />
        <Route path="files" element={<FilesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="logs" element={<OperationLogPage />} />
        <Route path="backups" element={<BackupsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="notifications" element={<NotificationsPage canSend />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/" element={<RootRedirect />} />
            <Route path="/student/*" element={<ProtectedRoute roles={['student']}><StudentApp /></ProtectedRoute>} />
            <Route path="/supervisor/*" element={<ProtectedRoute roles={['supervisor']}><SupervisorApp /></ProtectedRoute>} />
            <Route path="/admin/*" element={<ProtectedRoute roles={['admin']}><AdminApp /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
