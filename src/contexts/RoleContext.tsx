import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Profile } from '@/lib/dataModels'; // Import Profile interface
import { updateProfile } from '@/lib/studentData'; // Import updateProfile

interface RoleContextType {
  currentUserProfile: Profile | null;
  setCurrentUserProfile: (profile: Profile | null) => void;
  currentRole: 'student' | 'creator' | 'tutor' | null;
  isLoadingUser: boolean; // New loading state
  updateUserTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>; // New function to update theme
  signOut: () => Promise<void>; // Add signOut function
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { ReactNode }) => {
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true); // Initialize as true

  useEffect(() => {
    const fetchUserProfile = async (userId: string) => {
      setIsLoadingUser(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        setCurrentUserProfile(null);
      } else if (data) {
        setCurrentUserProfile(data);
      }
      setIsLoadingUser(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // User is logged in
        fetchUserProfile(session.user.id);
      } else {
        // User is logged out
        setCurrentUserProfile(null);
        setIsLoadingUser(false);
      }
    });

    // Initial check for session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setIsLoadingUser(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateUserTheme = async (theme: 'light' | 'dark' | 'system') => {
    if (currentUserProfile) {
      try {
        const updatedProfile = await updateProfile({ id: currentUserProfile.id, theme });
        if (updatedProfile) {
          setCurrentUserProfile(updatedProfile);
        }
      } catch (error) {
        console.error("Error updating user theme:", error);
      }
    }
  };

  const handleSignOut = async () => {
    setIsLoadingUser(true); // Set loading state while signing out
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      // Optionally show an error toast
    } else {
      setCurrentUserProfile(null); // Clear profile on successful sign out
      // The onAuthStateChange listener will also catch this and update state
    }
    setIsLoadingUser(false); // Reset loading state
  };

  const currentRole = currentUserProfile ? currentUserProfile.role : null;

  return (
    <RoleContext.Provider value={{ currentUserProfile, setCurrentUserProfile, currentRole, isLoadingUser, updateUserTheme, signOut: handleSignOut }}>
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