import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';

interface ProtectedRouteProps {
  allowedRoles?: Array<'student' | 'creator' | 'tutor'>;
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { currentUser, currentRole } = useRole();

  if (!currentUser) {
    // User is not logged in, redirect to the home page
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && currentRole && !allowedRoles.includes(currentRole)) {
    // User is logged in but does not have the allowed role
    // Redirect to dashboard or a specific unauthorized page
    return <Navigate to="/dashboard" replace />; // Or a /unauthorized page
  }

  // User is logged in and has the allowed role (or no specific role is required)
  return <Outlet />;
};

export default ProtectedRoute;