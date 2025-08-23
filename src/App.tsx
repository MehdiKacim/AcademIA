import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate, useNavigate } from "react-router-dom";
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
import EstablishmentManagementPage from "./pages/EstablishmentManagementPage";
import CurriculumManagementPage from "./pages/CurriculumManagementPage";
import ClassManagementPage from "./pages/ClassManagementPage";
import StudentManagementPage from "./pages/StudentManagementPage"; // Updated import
import AdminUserManagementPage from "./pages/AdminUserManagementPage"; // New import
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

const queryClient = new QueryClient();

const AppWithThemeProvider = () => {
  const { currentUserProfile, isLoadingUser, currentRole } = useRole();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Determine the initial theme based on user profile or system preference
  const initialTheme = currentUserProfile?.theme || "system";

  return (
    <ThemeProvider defaultTheme={initialTheme} storageKey="vite-ui-theme" attribute="class">
      <QueryClientProvider client={queryClient}>
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
          {isLoadingUser ? (
            <SplashScreen onComplete={() => { /* No-op, as isLoadingUser will become false */ }} />
          ) : (
            <BrowserRouter>
              <Routes>
                <Route path="/" element={currentUserProfile ? <Navigate to="/dashboard" replace /> : <Index setIsAdminModalOpen={setIsAdminModalOpen} />} /> 

                <Route element={<ProtectedRoute />}>
                  <Route element={<DashboardLayout setIsAdminModalOpen={setIsAdminModalOpen} />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/courses/:courseId" element={<CourseDetail />} />
                    <Route path="/courses/:courseId/modules/:moduleIndex" element={<ModuleDetail />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/all-notes" element={<AllNotes />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/data-model" element={<DataModelViewer />} />
                    
                    {/* Admin-specific routes */}
                    <Route element={<ProtectedRoute allowedRoles={['administrator']} />}>
                      <Route path="/admin-users" element={<AdminUserManagementPage />} /> {/* New Admin User Management */}
                      <Route path="/curricula" element={<CurriculumManagementPage />} />
                      <Route path="/classes" element={<ClassManagementPage />} />
                      <Route path="/students" element={<StudentManagementPage />} /> {/* Admin can also manage students here */}
                    </Route>

                    {/* Gestion Admin-specific routes */}
                    <Route element={<ProtectedRoute allowedRoles={['administrator', 'gestion_admin']} />}>
                      <Route path="/establishments" element={<EstablishmentManagementPage />} />
                      <Route path="/admin-users" element={<AdminUserManagementPage />} /> {/* Gestion Admin can also manage users (limited) */}
                    </Route>

                    {/* Creator-specific routes */}
                    <Route element={<ProtectedRoute allowedRoles={['creator']} />}>
                      <Route path="/create-course" element={<CreateCourse />} />
                      <Route path="/create-course/:courseId" element={<CreateCourse />} />
                      {/* Creator can also manage classes and students via StudentManagementPage */}
                      <Route path="/classes" element={<ClassManagementPage />} />
                      <Route path="/students" element={<StudentManagementPage />} />
                      <Route path="/curricula" element={<CurriculumManagementPage />} /> {/* Creators can also manage curricula */}
                    </Route>

                    {/* Tutor-specific routes */}
                    <Route element={<ProtectedRoute allowedRoles={['tutor']} />}>
                      {/* Tutor can manage classes and students via StudentManagementPage */}
                      <Route path="/classes" element={<ClassManagementPage />} />
                      <Route path="/students" element={<StudentManagementPage />} />
                    </Route>

                    {/* Redirect for students trying to access creator/admin pages */}
                    {currentRole === 'student' && (
                      <>
                        <Route path="/create-course" element={<Navigate to="/courses" replace />} />
                        <Route path="/admin-users" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/establishments" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/curricula" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/classes" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/students" element={<Navigate to="/dashboard" replace />} />
                      </>
                    )}
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          )}
          <AdminModal 
            isOpen={isAdminModalOpen} 
            onClose={() => setIsAdminModalOpen(false)} 
          />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

const App = () => (
  <RoleProvider>
    <CourseChatProvider>
      <AppWithThemeProvider />
    </CourseChatProvider>
  </RoleProvider>
);

export default App;