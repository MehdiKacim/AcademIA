import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '@/lib/dataModels';
import { loadUsers, getUserById } from '@/lib/studentData'; // Import loadUsers and getUserById

interface RoleContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  currentRole: 'student' | 'creator' | 'tutor' | null;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load user from localStorage on initial mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('currentUserId');
    if (storedUserId) {
      const users = loadUsers();
      const foundUser = users.find(u => u.id === storedUserId);
      if (foundUser) {
        setCurrentUser(foundUser);
      } else {
        localStorage.removeItem('currentUserId'); // Clear invalid ID
      }
    }
  }, []);

  // Persist user ID to localStorage whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUserId', currentUser.id);
    } else {
      localStorage.removeItem('currentUserId');
    }
  }, [currentUser]);

  const currentRole = currentUser ? currentUser.role : null;

  return (
    <RoleContext.Provider value={{ currentUser, setCurrentUser, currentRole }}>
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