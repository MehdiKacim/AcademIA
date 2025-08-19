import React, { createContext, useContext, useState, ReactNode } from 'react';

type UserRole = 'student' | 'creator' | 'tutor';

interface RoleContextType {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('student'); // Rôle par défaut

  const setRole = (role: UserRole) => {
    setCurrentRole(role);
  };

  return (
    <RoleContext.Provider value={{ currentRole, setRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};