import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  BookOpen,
  Briefcase,
  UserPlus,
  CalendarCheck,
  Award,
  FileText,
  User,
  GraduationCap
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, hasRole } = useAuth();

  const handleLinkClick = () => {
    if (window.innerWidth <= 900 && onClose) {
      onClose();
    }
  };

  return (
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-icon">
            <GraduationCap size={20} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
            Student System
          </span>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          {/* Admin and Faculty can access Students */}
          {hasRole('ADMIN', 'FACULTY') && (
            <NavLink
              to="/students"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <Users size={18} />
              <span>Students</span>
            </NavLink>
          )}

          {/* Admin only: Departments */}
          {hasRole('ADMIN') && (
            <NavLink
              to="/departments"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <Building2 size={18} />
              <span>Departments</span>
            </NavLink>
          )}

          {/* Admin and Faculty: Faculty directory */}
          {hasRole('ADMIN', 'FACULTY') && (
            <NavLink
              to="/faculty"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <Briefcase size={18} />
              <span>Faculty</span>
            </NavLink>
          )}

          {/* All roles: Courses */}
          <NavLink
            to="/courses"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            <BookOpen size={18} />
            <span>{hasRole('STUDENT') ? 'My Courses' : 'Courses'}</span>
          </NavLink>

          {/* Admin and Faculty: Enrollment */}
          {hasRole('ADMIN', 'FACULTY') && (
            <NavLink
              to="/enrollment"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <UserPlus size={18} />
              <span>Enrollment</span>
            </NavLink>
          )}

          {/* All roles: Attendance */}
          <NavLink
            to="/attendance"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            <CalendarCheck size={18} />
            <span>{hasRole('STUDENT') ? 'My Attendance' : 'Attendance'}</span>
          </NavLink>

          {/* All roles: Marks */}
          <NavLink
            to="/marks"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            <Award size={18} />
            <span>{hasRole('STUDENT') ? 'My Marks' : 'Marks & Grades'}</span>
          </NavLink>

          {/* All roles: Assignments */}
          <NavLink
            to="/assignments"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            <FileText size={18} />
            <span>Assignments</span>
          </NavLink>

          {/* All roles: Profile */}
          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            <User size={18} />
            <span>My Profile</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'center' }}>
            College Management System v1.0
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
