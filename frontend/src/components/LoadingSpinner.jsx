import React from 'react';

export const LoadingSpinner = ({ message = 'Loading...', size = 'default' }) => {
  return (
    <div className="loading-container">
      <div className={`spinner ${size === 'sm' ? 'spinner-sm' : ''}`} />
      {message && <p style={{ fontSize: '0.875rem' }}>{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
