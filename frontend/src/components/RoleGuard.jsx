import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const RoleGuard = ({ allowedRoles = [], children, fallback = null }) => {
  const { user, hasRole } = useAuth();

  if (!user) return null;

  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    if (fallback) return fallback;

    return (
      <div className="card" style={{ maxWidth: 500, margin: '48px auto', textAlign: 'center', padding: 36 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16
          }}
        >
          <ShieldAlert size={28} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
          Your current role (<strong>{user.role}</strong>) does not have permission to view or manage this section.
        </p>
      </div>
    );
  }

  return children;
};

export default RoleGuard;
