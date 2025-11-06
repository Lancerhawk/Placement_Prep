import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen() {
  const { initializing, status } = useAuth();
  if (!initializing) return null;

  return (
    <div style={overlayStyle}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={cardStyle}>
        <div style={spinnerStyle} />
        <div style={textStyle}>{status || 'Loading...'}</div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.92)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

const cardStyle: React.CSSProperties = {
  background: '#111318',
  borderRadius: 12,
  boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
  border: '1px solid #262a36',
  padding: '28px 32px',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  minWidth: 260,
};

const textStyle: React.CSSProperties = {
  fontSize: 16,
  color: '#e5e7eb',
  fontWeight: 500,
};

const spinnerStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  border: '3px solid #2a2f3a',
  borderTopColor: '#6366f1',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
} as React.CSSProperties;


