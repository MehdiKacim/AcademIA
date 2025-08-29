import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Profile, NavItem } from '@/lib/dataModels';
import { updateProfile } from '@/lib/studentData';
import { showError } from '@/utils/toast';
import { getProfileById } from '@/lib/studentData';
import { loadNavItems } from '@/lib/navItems';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface RoleContextType {
  currentUserProfile: Profile | null;
  setCurrentUserProfile: (profile: Profile | null) => void;
  currentRole: Profile['role'] | null;
  isLoadingUser: boolean;
  updateUserTheme: (theme: Profile['theme']) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUserProfile: (userId: string, user?: SupabaseUser) => Promise<void>;
  navItems: NavItem[];
  dynamicRoutes: NavItem[];
  onAuthTransition: (message: string, callback?: () => void, duration?: number) => void; // Add onAuthTransition to context type
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children, onAuthTransition }: { children: ReactNode; onAuthTransition: (message: string, callback?: () => void, duration?: number) => void }) => {
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [dynamicRoutes, setDynamicRoutes] = useState<NavItem[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string, userFromSession?: SupabaseUser) => {
    setIsLoadingUser(true);
    
    let userToCheck: SupabaseUser | null = userFromSession || null;
    let sessionError: any = null;

    if (!userToCheck) {
      const { data: userSessionData, error: getUserError } = await supabase.auth.getUser();
      userToCheck = userSessionData.user;
      sessionError = getUserError;
    }

    if (sessionError) {
      if (sessionError.message === 'Auth session missing!') {
        // console.info("[RoleContext] Info: Auth session missing during profile fetch (expected for unauthenticated users).");
      } else {
        console.error("[RoleContext] Error fetching user session for confirmation check:", sessionError);
      }
      setCurrentUserProfile(null);
      setNavItems([]);
      setDynamicRoutes([]);
      setIsLoadingUser(false);
      return;
    }

    if (userToCheck && !userToCheck.email_confirmed_at) {
      console.warn("[RoleContext] DIAGNOSTIC: User email is NOT confirmed:", userToCheck.email);
      showError("DIAGNOSTIC: Votre email n'est pas confirmé. Veuillez vérifier vos paramètres Supabase (Email Confirm).");
    } else if (userToCheck) {
      // console.log("[RoleContext] DIAGNOSTIC: User email IS confirmed:", userToCheck.email);
      // console.log("[RoleContext] DIAGNOSTIC: User JWT role from user_metadata:", userToCheck.user_metadata.role);
    }

    const profile = await getProfileById(userId);
    
    if (profile) {
      setCurrentUserProfile(profile);

      try {
        const loadedNavItems = await loadNavItems(profile.role, 0);
        setNavItems(loadedNavItems);

        const flattenAndFilterRoutes = (items: NavItem[]): NavItem[] => {
          let routes: NavItem[] = [];
          items.forEach(item => {
            if (item.route && !item.route.startsWith('#') && !item.is_external) {
              routes = routes.concat(item);
            }
            if (item.children) {
              routes = routes.concat(flattenAndFilterRoutes(item.children));
            }
          });
          return routes;
        };
        const flattenedRoutes = flattenAndFilterRoutes(loadedNavItems);
        setDynamicRoutes(flattenedRoutes);
      } catch (navError) {
        console.error("[RoleContext] Error loading nav items:", navError);
        showError("Erreur lors du chargement des menus de navigation.");
        setNavItems([]);
        setDynamicRoutes([]);
      }

    } else {
      setCurrentUserProfile(null);
      setNavItems([]);
      setDynamicRoutes([]);
    }
    setIsLoadingUser(false);
  }, []);

  useEffect(() => {
    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        fetchUserProfile(session.user.id, session.user);
      } else {
        setCurrentUserProfile(null);
        setNavItems([]);
        setDynamicRoutes([]);
        setIsLoadingUser(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user.id, session.user);
      } else {
        setIsLoadingUser(false);
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [fetchUserProfile]);

  const updateUserTheme = async (theme: Profile['theme']) => {
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
    setIsLoadingUser(true);
    console.log("[RoleContext] Attempting to sign out...");

    const performSignOut = async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("[RoleContext] Error signing out:", error);
        showError(`Erreur lors de la déconnexion: ${error.message}`);
      } else {
        console.log("[RoleContext] Signed out successfully.");
        setCurrentUserProfile(null);
        setNavItems([]);
        setDynamicRoutes([]);
      }
      setIsLoadingUser(false);
    };

    onAuthTransition("Déconnexion en cours...", performSignOut);
  };

  const currentRole = currentUserProfile ? currentUserProfile.role : null;

  return (
    <RoleContext.Provider value={{ currentUserProfile, setCurrentUserProfile, currentRole, isLoadingUser, updateUserTheme, signOut: handleSignOut, fetchUserProfile, navItems, dynamicRoutes, onAuthTransition }}>
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