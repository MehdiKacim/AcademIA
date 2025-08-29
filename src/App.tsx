import React, { useState, useEffect, useCallback } from 'react';
import { Toaster } from "@/components/ui/sonner"; // Changed import name to Toaster
import { TooltipProvider } from "@radix-ui/react-tooltip"; // Corrected import path
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CreateCourse from "./pages/CreateCourse";
import Analytics from "./pages/Analytics";
import CourseDetail from "./pages/CourseDetail";
import ModuleDetail from "./pages/ModuleDetail";
import AllNotes from "./pages/AllNotes";
import CurriculumManagementPage from "./pages/CurriculumManagementPage";
import ClassManagementPage from "./pages/ClassManagementPage";
import StudentManagementPage from "./pages/StudentManagementPage";
import AdminUserManagementPage from "./pages/AdminUserManagementPage";
import SubjectManagementPage from "./pages/SubjectManagementPage";
import PedagogicalManagementPage from "./pages/PedagogicalManagementPage";
import SchoolYearManagementPage from "./pages/SchoolYearManagementPage";
import ProfessorSubjectAssignmentPage from "./pages/ProfessorSubjectAssignmentPage";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import DataModelViewer from "./pages/DataModelViewer";
import Messages from "./pages/Messages";
import About from "./pages/About"; // Import About page
// Removed import for NotificationsPage
import { ThemeProvider } from "./components/theme-provider";
import SplashScreen from "./components/SplashScreen";
import { RoleProvider, useRole } from "./contexts/RoleContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { CourseChatProvider } from "./contexts/CourseChatContext";
import AdminModal from "./components/AdminModal";
import GenericNavItemsPage from "./pages/GenericNavItemsPage";
import RoleNavConfigsPage from "./pages/RoleNavConfigsPage";
import EstablishmentManagementPage from "./pages/EstablishmentManagementPage"; // New: Import EstablishmentManagementPage
import ThemeTransitionOverlay from "./components/ThemeTransitionOverlay"; // Import the new component
import { useTheme } from "next-themes"; // Import useTheme from next-themes
import AuthPage from './pages/AuthPage'; // New: Import AuthPage
import ResetPassword from './pages/ResetPassword'; // New: Import ResetPassword

const queryClient = new QueryClient();

const AuthenticatedAppRoutes = ({ isAdminModalOpen, setIsAdminModalOpen }: { isAdminModalOpen: boolean; setIsAdminModalOpen: (isOpen: boolean) => void }) => {
  const { currentUserProfile, isLoadingUser, dynamicRoutes } = useRole();
  const { setTheme } = useTheme(); // Get setTheme from next-themes

  const [isOverlayActive, setIsOverlayActive] = useState(false); // Renamed from isThemeTransitionActive
  const [overlayMessage, setOverlayMessage] = useState(''); // Renamed from transitioningToThemeName

  // New generic function to trigger the overlay animation
  const triggerOverlay = useCallback((message: string, callback?: () => void, duration: number = 1500) => {
    setOverlayMessage(message);
    setIsOverlayActive(true);

    // Execute callback after the initial animation duration
    const callbackTimer = setTimeout(() => {
      if (callback) {
        callback();
      }
    }, duration);

    // Hide the overlay after a slightly longer duration
    const hideOverlayTimer = setTimeout(() => {
      setIsOverlayActive(false);
      setOverlayMessage(''); // Clear message after hiding
    }, duration + 500); // Give a bit more time for UI to settle

    return () => {
      clearTimeout(callbackTimer);
      clearTimeout(hideOverlayTimer);
    };
  }, []); // No dependencies needed for useCallback as it's only called once or on auth state change

  const handleInitiateThemeChange = useCallback((newTheme: string) => { // Changed newTheme type to string
    const themeDisplayNameMap: { [key: string]: string } = {
      'light': 'Clair',
      'dark': 'Sombre',
      'dark-purple': 'Violet Sombre',
      'system': 'Système',
    };
    const displayName = themeDisplayNameMap[newTheme] || newTheme;

    triggerOverlay(`Changement de thème vers ${displayName}...`, () => {
      setTheme(newTheme); // Apply the theme after the overlay starts
    }, 1000); // Shorter duration for theme change animation
  }, [triggerOverlay, setTheme]);


  // Define a base map of route paths to components
  const baseRouteComponentMap: { [key: string]: React.ElementType } = {
    "/dashboard": Dashboard,
    "/courses": Courses,
    "/create-course": CreateCourse,
    "/create-course/:courseId": CreateCourse,
    "/analytics": Analytics,
    "/courses/:courseId": CourseDetail,
    "/courses/:courseId/modules/:moduleIndex": ModuleDetail,
    "/all-notes": AllNotes,
    "/about": About, // Add About page to the map
    // Removed static routes from here
    "/data-model": DataModelViewer,
    "/admin-users": AdminUserManagementPage,
    "/establishments": EstablishmentManagementPage, // New: Add EstablishmentManagementPage to the map
    "/subjects": SubjectManagementPage,
    "/school-years": SchoolYearManagementPage,
    "/professor-assignments": ProfessorSubjectAssignmentPage,
    "/curricula": CurriculumManagementPage,
    "/classes": ClassManagementPage,
    "/students": StudentManagementPage,
    "/pedagogical-management": PedagogicalManagementPage,
    "/admin-menu-management/generic-items": GenericNavItemsPage,
    "/admin-menu-management/role-configs": RoleNavConfigsPage,
    // Removed NotificationsPage from the map
  };

  useEffect(() => {
    // console.log("[App.tsx] baseRouteComponentMap keys:", Object.keys(baseRouteComponentMap));
    // console.log("[App.tsx] dynamicRoutes from RoleContext (in useEffect):", dynamicRoutes.map(r => r.route));
    // console.log("[App.tsx] currentUserProfile (in useEffect):", currentUserProfile);
  }, [dynamicRoutes, currentUserProfile]);


  if (isLoadingUser) {
    // console.log("[App.tsx] AuthenticatedAppRoutes: isLoadingUser is true, rendering SplashScreen.");
    return <SplashScreen onComplete={() => { /* No-op, as isLoadingUser will become false */ }} />;
  }

  // console.log("[App.tsx] AuthenticatedAppRoutes: isLoadingUser is false. Rendering BrowserRouter. Current dynamicRoutes:", dynamicRoutes.map(r => r.route));
  // console.log("[App.tsx] AuthenticatedAppRoutes: currentUserProfile:", currentUserProfile);

  return (
    <ThemeProvider storageKey="vite-ui-theme" attribute="data-theme"> {/* Removed defaultTheme prop */}
      <TooltipProvider>
        <React.Fragment> {/* Wrap multiple children in a Fragment */}
          <Toaster
            position="top-center"
            richColors // Added richColors
            closeButton // Added closeButton
            containerClassName="fixed inset-x-0 top-0 z-[9999] flex flex-col items-center p-4" // Positionnement explicite du conteneur
            toastOptions={{
              duration: 5000,
              // Removed classNames.toast as it's handled by custom component
              classNames: {
                // These classNames will apply to the sonner wrapper, but the custom component will handle its own styling
                success: "bg-transparent border-transparent", 
                error: "bg-transparent border-transparent",
                loading: "bg-transparent border-transparent",
              },
            }}
          />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={currentUserProfile ? <Navigate to="/dashboard" replace /> : <Index setIsAdminModalOpen={setIsAdminModalOpen} onInitiateThemeChange={handleInitiateThemeChange} onAuthTransition={triggerOverlay} />} />
              <Route path="/auth" element={<AuthPage onAuthTransition={triggerOverlay} />} /> {/* Pass triggerOverlay */}
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/about" element={<About />} /> {/* New About page route */}

              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout setIsAdminModalOpen={setIsAdminModalOpen} onInitiateThemeChange={handleInitiateThemeChange} />}> {/* Pass the handler */}
                  <Route path="/admin-menu-management" element={<Navigate to="/admin-menu-management/generic-items" replace />} />
                  {/* Always include the Dashboard route */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  {/* Static routes */}
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/messages" element={<Messages />} />
                  {/* Removed NotificationsPage route */}
                  {/* Dynamic routes */}
                  {dynamicRoutes.map(item => {
                    const Component = baseRouteComponentMap[item.route!];
                    // Only render if component exists and it's not a static route (already handled)
                    if (Component && item.route !== "/dashboard" && !["/profile", "/settings", "/messages", "/about"].includes(item.route!)) { // Removed "/notifications", added "/about"
                      // console.log(`[App.tsx] Mapping dynamic route: ${item.route} to Component: ${Component.name}`);
                      return (
                        <Route
                          key={item.id}
                          path={item.route}
                          element={<Component />}
                        />
                      );
                    }
                    return null;
                  })}
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <AdminModal
            isOpen={isAdminModalOpen}
            onClose={() => setIsAdminModalOpen(false)}
          />
          {isOverlayActive && ( // Use isOverlayActive
            <ThemeTransitionOverlay
              isOpen={isOverlayActive}
              message={overlayMessage} // Pass overlayMessage
            />
          )}
        </React.Fragment>
      </TooltipProvider>
    </ThemeProvider>
  );
};

const App = () => {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <RoleProvider>
        <CourseChatProvider>
          <AuthenticatedAppRoutes isAdminModalOpen={isAdminModalOpen} setIsAdminModalOpen={setIsAdminModalOpen} />
        </CourseChatProvider>
      </RoleProvider>
    </QueryClientProvider>
  );
};

export default App;