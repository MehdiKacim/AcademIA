import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
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
import { ThemeProvider } from "./components/theme-provider";
import SplashScreen from "./components/SplashScreen";
import { RoleProvider, useRole } from "./contexts/RoleContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { CourseChatProvider } from "./contexts/CourseChatContext";
import AdminModal from "./components/AdminModal";
import GenericNavItemsPage from "./pages/GenericNavItemsPage"; // Import new page
import RoleNavConfigsPage from "./pages/RoleNavConfigsPage"; // Import new page

const queryClient = new QueryClient();

// This component will now be the direct child of RoleProvider
const AuthenticatedAppRoutes = () => {
  console.log("[AuthenticatedAppRoutes] Rendering AuthenticatedAppRoutes, attempting to useRole.");
  const { currentUserProfile, isLoadingUser, dynamicRoutes } = useRole();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Determine the initial theme based on user profile or default to 'system'
  const initialTheme = currentUserProfile?.theme || "system";

  // Component mapping for dynamic routes
  const routeComponentMap: { [key: string]: React.ElementType } = {
    "/dashboard": Dashboard,
    "/courses": Courses,
    "/create-course": CreateCourse,
    "/create-course/:courseId": CreateCourse,
    "/analytics": Analytics,
    "/courses/:courseId": CourseDetail,
    "/courses/:courseId/modules/:moduleIndex": ModuleDetail,
    "/all-notes": AllNotes,
    "/messages": Messages,
    "/profile": Profile,
    "/settings": Settings,
    "/data-model": DataModelViewer,
    "/admin-users": AdminUserManagementPage,
    "/subjects": SubjectManagementPage,
    "/school-years": SchoolYearManagementPage,
    "/professor-assignments": ProfessorSubjectAssignmentPage,
    "/curricula": CurriculumManagementPage,
    "/classes": ClassManagementPage,
    "/students": StudentManagementPage,
    "/pedagogical-management": PedagogicalManagementPage,
    "/admin-menu-management/generic-items": GenericNavItemsPage, // New route
    "/admin-menu-management/role-configs": RoleNavConfigsPage, // New route
  };

  if (isLoadingUser) {
    return <SplashScreen onComplete={() => { /* No-op, as isLoadingUser will become false */ }} />;
  }

  return (
    <ThemeProvider defaultTheme={initialTheme} storageKey="vite-ui-theme" attribute="data-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner 
          position="top-center" 
          className="top-16 z-[9999]"
          toastOptions={{
            duration: 5000,
            classNames: {
              toast: "w-full max-w-full rounded-none border-x-0 border-t-0 shadow-none",
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
              <Route element={<DashboardLayout setIsAdminModalOpen={setIsAdminModalOpen} />}>
                {/* Redirect for the parent category route */}
                <Route path="/admin-menu-management" element={<Navigate to="/admin-menu-management/generic-items" replace />} />
                {/* Dynamically generated routes */}
                {dynamicRoutes.map(item => {
                  const Component = routeComponentMap[item.route!];
                  return Component ? (
                    <Route
                      key={item.id}
                      path={item.route}
                      element={<Component />}
                    />
                  ) : null;
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
      </TooltipProvider>
    </ThemeProvider>
  );
};

const App = () => (
  <RoleProvider>
    {console.log("[App] RoleProvider is rendered.")}
    <AuthenticatedAppRoutes />
  </RoleProvider>
);

export default App;