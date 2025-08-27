import React, { useState, useEffect, useCallback } from 'react';
import { Toaster } from "@/components/ui/sonner"; // Changed import name to Toaster
import { TooltipProvider } from "@/components/ui/tooltip";
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
// Removed import for NotificationsPage
import { ThemeProvider } from "./components/theme-provider";
import SplashScreen from "./components/SplashScreen";
import { RoleProvider, useRole } from "./contexts/RoleContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { CourseChatProvider } from "./contexts/CourseChatContext";
import AdminModal from "./components/AdminModal";
import GenericNavItemsPage from "./pages/GenericNavItemsPage";
import RoleNavConfigsPage from "./pages/RoleNavConfigsPage";
import ThemeTransitionOverlay from "./components/ThemeTransitionOverlay"; // Import the new component
import { useTheme } from "next-themes"; // Import useTheme from next-themes

const queryClient = new QueryClient();

const AuthenticatedAppRoutes = ({ isAdminModalOpen, setIsAdminModalOpen }: { isAdminModalOpen: boolean; setIsAdminModalOpen: (isOpen: boolean) => void }) => {
  const { currentUserProfile, isLoadingUser, dynamicRoutes } = useRole();
  const { setTheme } = useTheme(); // Get setTheme from next-themes

  const [isThemeTransitionActive, setIsThemeTransitionActive] = useState(false);
  const [transitioningToThemeName, setTransitioningToThemeName] = useState('');

  const initialTheme = currentUserProfile?.theme || "dark";

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
    // Removed static routes from here
    "/data-model": DataModelViewer,
    "/admin-users": AdminUserManagementPage,
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

  const handleInitiateThemeChange = useCallback((newTheme: typeof initialTheme) => {
    const themeDisplayNameMap: { [key: string]: string } = {
      'light': 'Clair',
      'dark': 'Sombre',
      'dark-purple': 'Violet Sombre',
      'system': 'Système',
    };
    const displayName = themeDisplayNameMap[newTheme] || newTheme;

    setTransitioningToThemeName(displayName);
    setIsThemeTransitionActive(true);
    setTheme(newTheme); // Applique le thème immédiatement en arrière-plan

    // Cache la superposition après la durée de l'animation
    setTimeout(() => {
      setIsThemeTransitionActive(false);
    }, 1500); // Durée ajustée pour correspondre à l'animation de la superposition
  }, [setTheme]);

  if (isLoadingUser) {
    // console.log("[App.tsx] AuthenticatedAppRoutes: isLoadingUser is true, rendering SplashScreen.");
    return <SplashScreen onComplete={() => { /* No-op, as isLoadingUser will become false */ }} />;
  }

  // console.log("[App.tsx] AuthenticatedAppRoutes: isLoadingUser is false. Rendering BrowserRouter. Current dynamicRoutes:", dynamicRoutes.map(r => r.route));
  // console.log("[App.tsx] AuthenticatedAppRoutes: currentUserProfile:", currentUserProfile);

  return (
    <ThemeProvider defaultTheme={initialTheme} storageKey="vite-ui-theme" attribute="data-theme">
      <TooltipProvider>
        <React.Fragment> {/* Wrap multiple children in a Fragment */}
          <Toaster 
            position="top-center" 
            containerClassName="fixed top-16 left-0 right-0 z-[9999] flex flex-col" // Positionnement explicite du conteneur
            toastOptions={{
              duration: 5000,
              classNames: {
                toast: "!w-full !max-w-full rounded-lg border border-border shadow-md backdrop-blur-lg bg-background/60", // Styles pour les toasts individuels
                success: "bg-success text-success-foreground border-success",
                error: "bg-destructive text-destructive-foreground border-destructive",
                loading: "bg-primary text-primary-foreground border-primary",
              },
            }}
          />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={currentUserProfile ? <Navigate to="/dashboard" replace /> : <Index setIsAdminModalOpen={setIsAdminModalOpen} />} /> 

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
                    if (Component && item.route !== "/dashboard" && !["/profile", "/settings", "/messages"].includes(item.route!)) { // Removed "/notifications"
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
          {isThemeTransitionActive && (
            <ThemeTransitionOverlay
              isOpen={isThemeTransitionActive}
              targetThemeName={transitioningToThemeName}
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