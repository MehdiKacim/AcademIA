import React from 'react';
import { useRole } from '@/contexts/RoleContext';
import SplashScreen from '@/components/SplashScreen';
import { Profile as ProfileType } from '@/lib/dataModels';

interface AuthLoaderProps {
  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (isOpen: boolean) => void;
  onAuthTransition: (message: string, callback?: () => void, duration?: number) => void;
  onInitiateThemeChange: (newTheme: ProfileType['theme']) => void;
  AuthenticatedAppRoutes: React.ComponentType<{
    isAdminModalOpen: boolean;
    setIsAdminModalOpen: (isOpen: boolean) => void;
    onAuthTransition: (message: string, callback?: () => void, duration?: number) => void;
    onInitiateThemeChange: (newTheme: ProfileType['theme']) => void;
  }>;
}

const AuthLoader: React.FC<AuthLoaderProps> = ({
  isAdminModalOpen,
  setIsAdminModalOpen,
  onAuthTransition,
  onInitiateThemeChange,
  AuthenticatedAppRoutes,
}) => {
  const { isLoadingUser } = useRole();

  if (isLoadingUser) {
    return <SplashScreen onComplete={() => { /* No-op, as isLoadingUser will become false */ }} />;
  }

  return (
    <AuthenticatedAppRoutes
      isAdminModalOpen={isAdminModalOpen}
      setIsAdminModalOpen={setIsAdminModalOpen}
      onAuthTransition={onAuthTransition}
      onInitiateThemeChange={onInitiateThemeChange}
    />
  );
};

export default AuthLoader;