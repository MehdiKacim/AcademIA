import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { Profile } from '@/lib/dataModels'; // Import Profile to use its role type

interface ProtectedRouteProps {
  allowedRoles?: Array<Profile['role']>; // Use Profile['role'] for consistency
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();

  if (isLoadingUser) {
    // Optionally render a loading spinner or null while user status is being determined
    return null; // Or a loading component if you want to show something
  }

  if (!currentUserProfile) {
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