import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';
import { User as UserIcon, Shield, Mail, Key } from 'lucide-react';

export const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await authApi.getCurrentUser();
        setProfile(data);
      } catch (err) {
        setAlert({ type: 'danger', message: err.userMessage || 'Failed to load profile details' });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading user profile..." />;
  }

  const user = profile || authUser;
  const initials = (user?.username || 'U').slice(0, 2).toUpperCase();

  const getRoleColor = (role) => {
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

  const getRoleDescription = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'Full System Administrator: Can manage all students, faculty staff, departments, courses, and security configurations.';
      case 'FACULTY':
        return 'Teaching Faculty: Can manage courses, mark attendance, enter examination marks, and publish assignments.';
      case 'STUDENT':
        return 'Enrolled Student: Can view course catalog, personal attendance history, examination marks, and assigned coursework.';
      default:
        return 'Standard User';
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Personal account and security details</p>
        </div>
      </div>

      {alert && (
        <AlertMessage
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="card profile-card">
        <div className="profile-header">
          <div className="profile-avatar">{initials}</div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {user?.username}
            </h2>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`badge ${getRoleColor(user?.role)}`}>
                <Shield size={12} /> {user?.role}
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="profile-field">
            <span className="profile-label">User ID</span>
            <span className="profile-value">#{user?.id}</span>
          </div>

          <div className="profile-field">
            <span className="profile-label">Username</span>
            <span className="profile-value">{user?.username}</span>
          </div>

          <div className="profile-field">
            <span className="profile-label">Email Address</span>
            <span className="profile-value">{user?.email || '—'}</span>
          </div>

          <div className="profile-field">
            <span className="profile-label">Account Role</span>
            <span className="profile-value">
              <span className={`badge ${getRoleColor(user?.role)}`}>{user?.role}</span>
            </span>
          </div>

          <div className="profile-field" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            <span className="profile-label">Assigned Permissions</span>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {getRoleDescription(user?.role)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
