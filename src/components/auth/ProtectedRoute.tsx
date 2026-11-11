import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const checkIsExpired = (expiresAt: string | null): boolean => {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading, hasRole, isSessionExpired, sessionExpiresAt } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F4F6F9]">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 shadow-clinical-md">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-teal-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-700">
            Initializing MediQueue Clinical Workspace...
          </p>
        </div>
      </div>
    );
  }

  // Handle expired sessions
  if (isSessionExpired || checkIsExpired(sessionExpiresAt)) {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          reason: 'session_expired',
          from: location.pathname,
        }}
        replace
      />
    );
  }

  if (!user) {
    return <Navigate to="/patient/dashboard" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          currentRole: user.role,
          requiredRoles: allowedRoles,
          from: location.pathname,
        }}
        replace
      />
    );
  }

  return <>{children}</>;
};
