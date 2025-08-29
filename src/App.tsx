import React, { useState, useEffect, useCallback } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
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
import About from "./pages/About";
import { ThemeProvider } from "./components/theme-provider";
import SplashScreen from "./components/SplashScreen";
import { RoleProvider, useRole } from "./contexts/RoleContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { CourseChatProvider } from "./contexts/CourseChatContext";
import AdminModal from "./components/AdminModal";
import GenericNavItemsPage from "./pages/GenericNavItemsPage";
import RoleNavConfigsPage from "./pages/RoleNavConfigsPage";
import EstablishmentManagementPage from "./pages/EstablishmentManagementPage";
import ThemeTransitionOverlay from "./components/ThemeTransitionOverlay";
import { useTheme } from "next-themes";
import AuthPage from './pages/AuthPage';
import ResetPassword from './pages/ResetPassword';
import { Profile as ProfileType } from './lib/dataModels'; // Import Profile type

const queryClient = new QueryClient();

const AuthenticatedAppRoutes = ({ isAdminModalOpen, setIsAdminModalOpen, onAuthTransition, onInitiateThemeChange }: { isAdminModalOpen: boolean; setIsAdminModalOpen: (isOpen: boolean) => void; onAuthTransition: (message: string, callback?: () => void, duration?: number) => void; onInitiateThemeChange: (newTheme: ProfileType['theme']) => void; }) => {
  const { currentUserProfile, isLoadingUser, dynamicRoutes } = useRole();
  const { setTheme } = useTheme();

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
    "/about": About,
    "/data-model": DataModelViewer,
    "/admin-users": AdminUserManagementPage,
    "/establishments": EstablishmentManagementPage,
    "/subjects": SubjectManagementPage,
    "/school-years": SchoolYearManagementPage,
    "/professor-assignments": ProfessorSubjectAssignmentPage,
    "/curricula": CurriculumManagementPage,
    "/classes": ClassManagementPage,
    "/students": StudentManagementPage,
    "/pedagogical-management": PedagogicalManagementPage,
    "/admin-menu-management/generic-items": GenericNavItemsPage,
    "/admin-menu-management/role-configs": RoleNavConfigsPage,
  };

  useEffect(() => {
    if (currentUserProfile && dynamicRoutes.length > 0) {
      // console.log("[App.tsx] dynamicRoutes from RoleContext (in useEffect):", dynamicRoutes.map(r => r.route));
    }
  }, [dynamicRoutes, currentUserProfile]);

  if (isLoadingUser) {
    return <SplashScreen onComplete={() => { /* No-op, as isLoadingUser will become false */ }} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={currentUserProfile ? <Navigate to="/dashboard" replace /> : <Index setIsAdminModalOpen={setIsAdminModalOpen} onInitiateThemeChange={onInitiateThemeChange} onAuthTransition={onAuthTransition} />} />
        <Route path="/auth" element={<AuthPage onAuthTransition={onAuthTransition} />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout setIsAdminModalOpen={setIsAdminModalOpen} onInitiateThemeChange={onInitiateThemeChange} />}>
            <Route path="/admin-menu-management" element={<Navigate to="/admin-menu-management/generic-items" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/messages" element={<Messages />} />
            {dynamicRoutes.map(item => {
              const Component = baseRouteComponentMap[item.route!];
              if (Component && item.route !== "/dashboard" && !["/profile", "/settings", "/messages", "/about"].includes(item.route!)) {
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
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </BrowserRouter>
  );
};

const App = () => {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const { setTheme } = useTheme();

  const [isOverlayActive, setIsOverlayActive] = useState(false);
  const [overlayMessage, setOverlayMessage] = useState('');

  const triggerOverlay = useCallback((message: string, callback?: () => void, duration: number = 1500) => {
    setOverlayMessage(message);
    setIsOverlayActive(true);

    const callbackTimer = setTimeout(() => {
      if (callback) {
        callback();
      }
    }, duration);

    const hideOverlayTimer = setTimeout(() => {
      setIsOverlayActive(false);
      setOverlayMessage('');
    }, duration + 500);

    return () => {
      clearTimeout(callbackTimer);
      clearTimeout(hideOverlayTimer);
    };
  }, []);

  const handleInitiateThemeChange = useCallback((newTheme: ProfileType['theme']) => {
    const themeDisplayNameMap: { [key: string]: string } = {
      'light': 'Clair',
      'dark': 'Sombre',
      'dark-purple': 'Violet Sombre',
      'system': 'Système',
    };
    const displayName = themeDisplayNameMap[newTheme] || newTheme;

    triggerOverlay(`Changement de thème vers ${displayName}...`, () => {
      setTheme(newTheme);
    }, 1000);
  }, [triggerOverlay, setTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider storageKey="vite-ui-theme" attribute="data-theme">
        <TooltipProvider>
          <React.Fragment>
            <Toaster
              position="top-center"
              richColors
              closeButton
              containerClassName="fixed inset-x-0 top-0 z-[9999] flex flex-col items-center p-4"
              toastOptions={{
                duration: 5000,
                classNames: {
                  success: "bg-transparent border-transparent",
                  error: "bg-transparent border-transparent",
                  loading: "bg-transparent border-transparent",
                },
              }}
            />
            <RoleProvider onAuthTransition={triggerOverlay}>
              <CourseChatProvider>
                <AuthenticatedAppRoutes isAdminModalOpen={isAdminModalOpen} setIsAdminModalOpen={setIsAdminModalOpen} onAuthTransition={triggerOverlay} onInitiateThemeChange={handleInitiateThemeChange} />
              </CourseChatProvider>
            </RoleProvider>
            {isOverlayActive && (
              <ThemeTransitionOverlay
                isOpen={isOverlayActive}
                message={overlayMessage}
              />
            )}
          </React.Fragment>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;