"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Profile } from '@/lib/dataModels'; // Import Profile interface
import { updateProfile } from '@/lib/studentData'; // Import updateProfile
import { showError } from '@/utils/toast'; // Import showError for diagnostic message

interface RoleContextType {
  currentUserProfile: Profile | null;
  setCurrentUserProfile: (profile: Profile | null) => void;
  currentRole: 'student' | 'creator' | 'tutor' | null;
  isLoadingUser: boolean; // New loading state
  updateUserTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>; // New function to update theme
  signOut: () => Promise<void>; // Add signOut function
  fetchUserProfile: (userId: string) => Promise<void>; // Add fetchUserProfile
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true); // Initialize as true

  const fetchUserProfile = async (userId: string) => {
    setIsLoadingUser(true);
    
    // Fetch the full user object from the session to check email_confirmed_at
    const { data: userSession, error: sessionError } = await supabase.auth.getUser(); 
    if (sessionError) {
      console.error("Error fetching user session for confirmation check:", sessionError);
      setCurrentUserProfile(null);
      setIsLoadingUser(false);
      return;
    }

    if (userSession.user && !userSession.user.email_confirmed_at) {
      console.warn("DIAGNOSTIC: User email is NOT confirmed:", userSession.user.email);
      // Temporarily show an error to highlight this to the user
      showError("DIAGNOSTIC: Votre email n'est pas confirmé. Veuillez vérifier vos paramètres Supabase (Email Confirm).");
    } else if (userSession.user) {
      console.log("DIAGNOSTIC: User email IS confirmed:", userSession.user.email);
    }

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

  useEffect(() => {
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
    <RoleContext.Provider value={{ currentUserProfile, setCurrentUserProfile, currentRole, isLoadingUser, updateUserTheme, signOut: handleSignOut, fetchUserProfile }}>
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