import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export const AlertMessage = ({ type = 'info', message, onClose, className = '' }) => {
  if (!message) return null;

  const iconMap = {
    danger: <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />,
    error: <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />,
    success: <CheckCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />,
    warning: <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />,
    info: <Info size={18} style={{ flexShrink: 0, marginTop: 2 }} />
  };

  const alertTypeClass = type === 'error' ? 'alert-danger' : `alert-${type}`;

  return (
    <div className={`alert ${alertTypeClass} ${className}`} role="alert">
      {iconMap[type] || iconMap.info}
      <div style={{ flex: 1 }}>{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          aria-label="Close"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 2,
            color: 'inherit',
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default AlertMessage;
