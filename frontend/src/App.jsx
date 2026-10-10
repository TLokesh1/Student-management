import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import AppLayout from './components/Layout/AppLayout';

// Pages
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import StudentsPage from './pages/Students/StudentsPage';
import DepartmentsPage from './pages/Departments/DepartmentsPage';
import FacultyPage from './pages/Faculty/FacultyPage';
import CoursesPage from './pages/Courses/CoursesPage';
import AttendancePage from './pages/Attendance/AttendancePage';
import MarksPage from './pages/Marks/MarksPage';
import AssignmentsPage from './pages/Assignments/AssignmentsPage';
import EnrollmentPage from './pages/Enrollment/EnrollmentPage';
import ProfilePage from './pages/Profile/ProfilePage';

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes wrapped in AppLayout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Admin and Faculty only: Students */}
            <Route
              path="students"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'FACULTY']}>
                  <StudentsPage />
                </RoleGuard>
              }
            />

            {/* Admin only: Departments */}
            <Route
              path="departments"
              element={
                <RoleGuard allowedRoles={['ADMIN']}>
                  <DepartmentsPage />
                </RoleGuard>
              }
            />

            {/* Admin and Faculty: Faculty directory */}
            <Route
              path="faculty"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'FACULTY']}>
                  <FacultyPage />
                </RoleGuard>
              }
            />

            {/* All roles: Courses */}
            <Route path="courses" element={<CoursesPage />} />

            {/* Admin and Faculty: Enrollment */}
            <Route
              path="enrollment"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'FACULTY']}>
                  <EnrollmentPage />
                </RoleGuard>
              }
            />

            {/* All roles: Attendance */}
            <Route path="attendance" element={<AttendancePage />} />

            {/* All roles: Marks */}
            <Route path="marks" element={<MarksPage />} />

            {/* All roles: Assignments */}
            <Route path="assignments" element={<AssignmentsPage />} />

            {/* All roles: Profile */}
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
