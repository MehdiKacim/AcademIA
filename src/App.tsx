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
import StudentManagementPage from "./pages/StudentManagementPage";
import AdminUserManagementPage from "./pages/AdminUserManagementPage";
import SubjectManagementPage from "./pages/SubjectManagementPage";
import PedagogicalManagementPage from "./pages/PedagogicalManagementPage";
import SchoolYearManagementPage from "./pages/SchoolYearManagementPage";
import ProfessorSubjectAssignmentPage from "./pages/ProfessorSubjectAssignmentPage"; // New import
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

  // Determine the initial theme based on user profile or default to 'modern-blue'
  const initialTheme = currentUserProfile?.theme || "modern-blue";

  return (
    <ThemeProvider defaultTheme={initialTheme} storageKey="vite-ui-theme" attribute="data-theme">
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

                <Route element={<ProtectedRoute />}> {/* Base protected route for all logged-in users */}
                  <Route element={<DashboardLayout setIsAdminModalOpen={setIsAdminModalOpen} />}>
                    {/* Common routes for all authenticated users */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/courses/:courseId" element={<CourseDetail />} />
                    <Route path="/courses/:courseId/modules/:moduleIndex" element={<ModuleDetail />} />
                    <Route path="/all-notes" element={<AllNotes />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/data-model" element={<DataModelViewer />} />
                    
                    {/* Routes accessible by Administrator, Director, Deputy Director */}
                    <Route element={<ProtectedRoute allowedRoles={['administrator', 'director', 'deputy_director']} />}>
                      <Route path="/admin-users" element={<AdminUserManagementPage />} />
                      <Route path="/establishments" element={<EstablishmentManagementPage />} />
                    </Route>

                    {/* Routes accessible by Director, Deputy Director */}
                    <Route element={<ProtectedRoute allowedRoles={['director', 'deputy_director']} />}>
                      <Route path="/subjects" element={<SubjectManagementPage />} />
                      <Route path="/school-years" element={<SchoolYearManagementPage />} />
                      <Route path="/professor-assignments" element={<ProfessorSubjectAssignmentPage />} />
                      <Route path="/curricula" element={<CurriculumManagementPage />} />
                      <Route path="/classes" element={<ClassManagementPage />} />
                      <Route path="/students" element={<StudentManagementPage />} />
                      <Route path="/pedagogical-management" element={<PedagogicalManagementPage />} />
                      <Route path="/analytics" element={<Analytics />} />
                    </Route>

                    {/* Routes accessible by Administrator, Director, Deputy Director, Professeur */}
                    {/* Removed Administrator from /curricula */}
                    {/* <Route element={<ProtectedRoute allowedRoles={['administrator', 'director', 'deputy_director', 'professeur']} />}>
                      <Route path="/curricula" element={<CurriculumManagementPage />} />
                    </Route> */}

                    {/* Routes accessible by Administrator, Director, Deputy Director, Professeur, Tutor */}
                    {/* Removed Administrator from /classes, /students, /pedagogical-management */}
                    {/* <Route element={<ProtectedRoute allowedRoles={['administrator', 'director', 'deputy_director', 'professeur', 'tutor']} />}>
                      <Route path="/classes" element={<ClassManagementPage />} />
                      <Route path="/students" element={<StudentManagementPage />} />
                      <Route path="/pedagogical-management" element={<PedagogicalManagementPage />} />
                    </Route> */}

                    {/* Routes accessible by Professeur only */}
                    <Route element={<ProtectedRoute allowedRoles={['professeur']} />}>
                      <Route path="/create-course" element={<CreateCourse />} />
                      <Route path="/create-course/:courseId" element={<CreateCourse />} />
                    </Route>

                    {/* Specific redirects for roles that shouldn't access certain pages, even if the base ProtectedRoute allows it */}
                    {/* These are for UX, to redirect from a page that might be technically accessible but semantically wrong */}
                    {currentRole === 'student' && (
                      <>
                        <Route path="/create-course" element={<Navigate to="/courses" replace />} />
                        <Route path="/admin-users" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/establishments" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/curricula" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/classes" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/students" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/subjects" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/pedagogical-management" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/school-years" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/professor-assignments" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
                      </>
                    )}
                    {/* Directors/Deputy Directors should not access professeur-only pages like create-course */}
                    {(currentRole === 'director' || currentRole === 'deputy_director') && (
                      <Route path="/create-course" element={<Navigate to="/dashboard" replace />} />
                    )}
                    {/* Professeurs/Tutors should not access admin/director-only pages like establishments or admin-users */}
                    {(currentRole === 'professeur' || currentRole === 'tutor') && (
                      <>
                        <Route path="/admin-users" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/establishments" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/subjects" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/school-years" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/professor-assignments" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/curricula" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/classes" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/students" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/pedagogical-management" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
                      </>
                    )}
                    {/* Administrator specific redirects */}
                    {currentRole === 'administrator' && (
                      <>
                        <Route path="/curricula" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/subjects" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/classes" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/students" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/pedagogical-management" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/school-years" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/professor-assignments" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/create-course" element={<Navigate to="/dashboard" replace />} />
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