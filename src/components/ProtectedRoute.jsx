import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Spinner } from './ui';

export default function ProtectedRoute({ children }) {
  const { user, initializing } = useAuth();
  if (initializing) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spinner text="Loading…" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
