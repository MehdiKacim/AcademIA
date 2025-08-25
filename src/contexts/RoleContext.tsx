"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Profile, NavItem } from '@/lib/dataModels'; // Import Profile and NavItem interface
import { updateProfile } from '@/lib/studentData'; // Import updateProfile
import { showError } from '@/utils/toast'; // Import showError for diagnostic message
import { getProfileById } from '@/lib/studentData'; // Import getProfileById
import { loadNavItems } from '@/lib/navItems'; // Import loadNavItems

interface RoleContextType {
  currentUserProfile: Profile | null;
  setCurrentUserProfile: (profile: Profile | null) => void;
  currentRole: Profile['role'] | null; // Use Profile['role'] directly
  isLoadingUser: boolean; // New loading state
  updateUserTheme: (theme: Profile['theme']) => Promise<void>; // Updated: New function to update theme, now accepts Profile['theme']
  signOut: () => Promise<void>; // Add signOut function
  fetchUserProfile: (userId: string) => Promise<void>; // Add fetchUserProfile
  navItems: NavItem[]; // Expose structured nav items
  dynamicRoutes: NavItem[]; // Expose flattened dynamic routes for React Router
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [navItems, setNavItems] = useState<NavItem[]>([]); // State for structured nav items
  const [dynamicRoutes, setDynamicRoutes] = useState<NavItem[]>([]); // State for flattened dynamic routes
  const [isLoadingUser, setIsLoadingUser] = useState(true); // Initialize as true

  const fetchUserProfile = useCallback(async (userId: string) => {
    setIsLoadingUser(true);
    
    // Fetch the full user object from the session to check email_confirmed_at
    const { data: userSession, error: sessionError } = await supabase.auth.getUser(); 
    if (sessionError) {
      console.error("Error fetching user session for confirmation check:", sessionError);
      setCurrentUserProfile(null);
      setNavItems([]);
      setDynamicRoutes([]);
      setIsLoadingUser(false);
      return;
    }

    if (userSession.user && !userSession.user.email_confirmed_at) {
      console.warn("DIAGNOSTIC: User email is NOT confirmed:", userSession.user.email);
      // Temporarily show an an error to highlight this to the user
      showError("DIAGNOSTIC: Votre email n'est pas confirmé. Veuillez vérifier vos paramètres Supabase (Email Confirm).");
    } else if (userSession.user) {
      console.log("DIAGNOSTIC: User email IS confirmed:", userSession.user.email);
    }

    const profile = await getProfileById(userId); // Use the updated getProfileById
    
    if (profile) {
      setCurrentUserProfile(profile);
      // Now load nav items based on the fetched profile's role
      const loadedNavItems = await loadNavItems(profile.role, 0); // Removed establishment_id
      setNavItems(loadedNavItems);

      // Flatten the tree to get all routes for React Router
      const flattenAndFilterRoutes = (items: NavItem[]): NavItem[] => {
        let routes: NavItem[] = [];
        items.forEach(item => {
          if (item.route && !item.route.startsWith('#') && !item.is_external) {
            routes.push(item);
          }
          if (item.children) {
            routes = routes.concat(flattenAndFilterRoutes(item.children));
          }
        });
        return routes;
      };
      const flattenedRoutes = flattenAndFilterRoutes(loadedNavItems);
      setDynamicRoutes(flattenedRoutes);
      console.log("[RoleContext] Flattened dynamic routes for React Router:", flattenedRoutes);

    } else {
      setCurrentUserProfile(null);
      setNavItems([]);
      setDynamicRoutes([]);
    }
    setIsLoadingUser(false);
  }, []); // No dependencies needed for useCallback as it's only called once or on auth state change

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // User is logged in
        fetchUserProfile(session.user.id);
      } else {
        // User is logged out
        setCurrentUserProfile(null);
        setNavItems([]);
        setDynamicRoutes([]);
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
  }, [fetchUserProfile]); // Dependency on fetchUserProfile

  const updateUserTheme = async (theme: Profile['theme']) => { // Updated type here
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
      setNavItems([]);
      setDynamicRoutes([]);
      // The onAuthStateChange listener will also catch this and update state
    }
    setIsLoadingUser(false); // Reset loading state
  };

  const currentRole = currentUserProfile ? currentUserProfile.role : null;

  return (
    <RoleContext.Provider value={{ currentUserProfile, setCurrentUserProfile, currentRole, isLoadingUser, updateUserTheme, signOut: handleSignOut, fetchUserProfile, navItems, dynamicRoutes }}>
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