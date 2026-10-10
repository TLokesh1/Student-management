import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Menu, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'badge-primary';
      case 'FACULTY':
        return 'badge-warning';
      case 'STUDENT':
        return 'badge-success';
      default:
        return 'badge-gray';
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          className="menu-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>
        <Link to="/dashboard" className="navbar-brand">
          <div className="brand-icon">
            <GraduationCap size={20} />
          </div>
          <span>Academic Portal</span>
        </Link>
      </div>

      <div className="navbar-right">
        {user && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {user.username}
              </span>
              <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                {user.role}
              </span>
            </div>

            <Link
              to="/profile"
              className="btn btn-secondary btn-sm"
              title="View Profile"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <UserIcon size={16} />
              <span className="hide-on-mobile">Profile</span>
            </Link>

            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              title="Sign Out"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={16} />
              <span className="hide-on-mobile">Logout</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
