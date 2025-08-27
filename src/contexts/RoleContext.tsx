import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Profile, NavItem } from '@/lib/dataModels'; // Import Profile and NavItem interface
import { updateProfile } from '@/lib/studentData'; // Import updateProfile
import { showError } from '@/utils/toast'; // Import showError for diagnostic message
import { getProfileById } from '@/lib/studentData'; // Import getProfileById
import { loadNavItems } from '@/lib/navItems'; // Import loadNavItems
import { User as SupabaseUser } from '@supabase/supabase-js'; // Import Supabase User type
import { getUnreadNotificationCount } from '@/lib/notificationData'; // New: Import getUnreadNotificationCount

interface RoleContextType {
  currentUserProfile: Profile | null;
  setCurrentUserProfile: (profile: Profile | null) => void;
  currentRole: Profile['role'] | null; // Use Profile['role'] directly
  isLoadingUser: boolean; // New loading state
  updateUserTheme: (theme: Profile['theme']) => Promise<void>; // Updated: New function to update theme, now accepts Profile['theme']
  signOut: () => Promise<void>; // Add signOut function
  fetchUserProfile: (userId: string, user?: SupabaseUser) => Promise<void>; // Add optional user parameter
  navItems: NavItem[]; // Expose structured nav items
  dynamicRoutes: NavItem[]; // Expose flattened dynamic routes for React Router
  unreadNotificationsCount: number; // New: Expose unread notifications count
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [navItems, setNavItems] = useState<NavItem[]>([]); // State for structured nav items
  const [dynamicRoutes, setDynamicRoutes] = useState<NavItem[]>([]); // State for flattened dynamic routes
  const [isLoadingUser, setIsLoadingUser] = useState(true); // Initialize as true
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0); // New: State for unread notifications

  const fetchUserProfile = useCallback(async (userId: string, userFromSession?: SupabaseUser) => {
    setIsLoadingUser(true);
    // console.log("[RoleContext] fetchUserProfile: Starting for userId:", userId);
    
    let userToCheck: SupabaseUser | null = userFromSession || null;
    let sessionError: any = null;

    if (!userToCheck) {
      const { data: userSessionData, error: getUserError } = await supabase.auth.getUser();
      userToCheck = userSessionData.user;
      sessionError = getUserError;
    }

    if (sessionError) {
      // Check if it's the expected "Auth session missing!" error
      if (sessionError.message === 'Auth session missing!') {
        // console.info("[RoleContext] Info: Auth session missing during profile fetch (expected for unauthenticated users).");
      } else {
        // console.error("[RoleContext] Error fetching user session for confirmation check:", sessionError);
      }
      setCurrentUserProfile(null);
      setNavItems([]);
      setDynamicRoutes([]);
      setUnreadNotificationsCount(0); // Clear notifications
      setIsLoadingUser(false);
      return;
    }

    if (userToCheck && !userToCheck.email_confirmed_at) {
      // console.warn("[RoleContext] DIAGNOSTIC: User email is NOT confirmed:", userToCheck.email);
      showError("DIAGNOSTIC: Votre email n'est pas confirmé. Veuillez vérifier vos paramètres Supabase (Email Confirm).");
    } else if (userToCheck) {
      // console.log("[RoleContext] DIAGNOSTIC: User email IS confirmed:", userToCheck.email);
      // console.log("[RoleContext] DIAGNOSTIC: User JWT role from user_metadata:", userToCheck.user_metadata.role); // <-- NOUVEAU LOG ICI
    }

    const profile = await getProfileById(userId); // Use the updated getProfileById
    
    if (profile) {
      // console.log("[RoleContext] fetchUserProfile: Profile fetched:", profile);
      // console.log("[RoleContext] fetchUserProfile: Profile role:", profile.role); // Log the role
      setCurrentUserProfile(profile);

      // Fetch unread notifications count
      const unreadNotifs = await getUnreadNotificationCount(userId);
      setUnreadNotificationsCount(unreadNotifs);

      // Now load nav items based on the fetched profile's role
      try {
        const loadedNavItems = await loadNavItems(profile.role, 0, unreadNotifs); // Pass unreadNotifs
        setNavItems(loadedNavItems);
        // console.log("[RoleContext] fetchUserProfile: Nav items loaded (count):", loadedNavItems.length, "items:", loadedNavItems);

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
        // console.log("[RoleContext] fetchUserProfile: Flattened dynamic routes for React Router (count):", flattenedRoutes.length, "routes:", flattenedRoutes.map(r => r.route)); // <-- ADDED LOG HERE
      } catch (navError) {
        // console.error("[RoleContext] Error loading nav items:", navError);
        showError("Erreur lors du chargement des menus de navigation.");
        setNavItems([]);
        setDynamicRoutes([]);
      }

    } else {
      // console.log("[RoleContext] fetchUserProfile: No profile found for userId:", userId);
      setCurrentUserProfile(null);
      setNavItems([]);
      setDynamicRoutes([]);
      setUnreadNotificationsCount(0); // Clear notifications
    }
    // console.log("[RoleContext] fetchUserProfile: Setting isLoadingUser to false. Final dynamicRoutes (map):", dynamicRoutes.map(r => r.route)); // Add this line
    setIsLoadingUser(false);
    // console.log("[RoleContext] fetchUserProfile: Finished for userId:", userId);
  }, []); // No dependencies needed for useCallback as it's only called once or on auth state change

  useEffect(() => {
    // console.log("[RoleContext] onAuthStateChange: Setting up subscription.");
    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange(async (event, session) => { // Added default empty object to data
      // console.log("[RoleContext] Auth state changed:", event, "Session exists:", !!session);
      if (session) {
        // User is logged in
        fetchUserProfile(session.user.id, session.user); // Pass session.user
      } else {
        // User is logged out
        // console.log("[RoleContext] User logged out, clearing profile and nav items.");
        setCurrentUserProfile(null);
        setNavItems([]); // Clear nav items
        setDynamicRoutes([]); // Clear dynamic routes
        setUnreadNotificationsCount(0); // Clear notifications
        setIsLoadingUser(false);
      }
    });

    // Initial check for session
    // console.log("[RoleContext] Initial session check.");
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // console.log("[RoleContext] Initial session found, fetching user profile.");
        fetchUserProfile(session.user.id, session.user); // Pass session.user
      } else {
        // console.log("[RoleContext] No initial session found, setting isLoadingUser to false.");
        setIsLoadingUser(false);
      }
    });

    return () => {
      // console.log("[RoleContext] Cleaning up auth state subscription.");
      if (subscription) { // Check if subscription exists before unsubscribing
        subscription.unsubscribe();
      }
    };
  }, [fetchUserProfile]); // Dependency on fetchUserProfile

  // New useEffect for real-time notification updates
  useEffect(() => {
    let notificationChannel: any;
    if (currentUserProfile?.id) {
      notificationChannel = supabase
        .channel(`notifications_channel_${currentUserProfile.id}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${currentUserProfile.id}`
          },
          async (payload) => {
            // console.log("[RoleContext] Notification change detected:", payload);
            const newCount = await getUnreadNotificationCount(currentUserProfile.id);
            setUnreadNotificationsCount(newCount);
            // Also re-fetch nav items to update the badge
            const loadedNavItems = await loadNavItems(currentUserProfile.role, 0, newCount);
            setNavItems(loadedNavItems);
          }
        )
        .subscribe();
    }

    return () => {
      if (notificationChannel) {
        supabase.removeChannel(notificationChannel);
      }
    };
  }, [currentUserProfile?.id, currentUserProfile?.role]); // Re-subscribe if user or role changes

  const updateUserTheme = async (theme: Profile['theme']) => { // Updated type here
    if (currentUserProfile) {
      try {
        const updatedProfile = await updateProfile({ id: currentUserProfile.id, theme });
        if (updatedProfile) {
          setCurrentUserProfile(updatedProfile);
        }
      } catch (error) {
        // console.error("Error updating user theme:", error);
      }
    }
  };

  const handleSignOut = async () => {
    setIsLoadingUser(true); // Set loading state while signing out
    // console.log("[RoleContext] Signing out...");
    const { error } = await supabase.auth.signOut();
    if (error) {
      // console.error("Error signing out:", error);
      showError(`Erreur lors de la déconnexion: ${error.message}`);
    } else {
      // console.log("[RoleContext] Signed out successfully.");
      setCurrentUserProfile(null); // Clear profile on successful sign out
      setNavItems([]); // Clear nav items
      setDynamicRoutes([]); // Clear dynamic routes
      setUnreadNotificationsCount(0); // Clear notifications
      // The onAuthStateChange listener will also catch this and update state
    }
    setIsLoadingUser(false); // Reset loading state
  };

  const currentRole = currentUserProfile ? currentUserProfile.role : null;

  return (
    <RoleContext.Provider value={{ currentUserProfile, setCurrentUserProfile, currentRole, isLoadingUser, updateUserTheme, signOut: handleSignOut, fetchUserProfile, navItems, dynamicRoutes, unreadNotificationsCount }}>
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