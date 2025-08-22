import React, { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom"; // Import Navigate
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
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import DataModelViewer from "./pages/DataModelViewer";
import Messages from "./pages/Messages";
import { ThemeProvider } from "./components/theme-provider";
import SplashScreen from "./components/SplashScreen";
import { RoleProvider, useRole } from "./contexts/RoleContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { CourseChatProvider } from "./contexts/CourseChatContext"; // Import CourseChatProvider

const queryClient = new QueryClient();

// A wrapper component to get the theme from useRole and pass it to ThemeProvider
const AppWithThemeProvider = () => {
  const { currentUserProfile, isLoadingUser } = useRole();
  // Removed local showSplash state, will rely solely on isLoadingUser for splash screen

  // Determine the initial theme based on user profile or system preference
  const initialTheme = currentUserProfile?.theme || "system";

  return (
    <ThemeProvider defaultTheme={initialTheme} storageKey="vite-ui-theme" attribute="class">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner 
            position="top-center" 
            className="!left-0 !right-0 !w-full !max-w-full !translate-x-0 top-16 z-[9999]" 
            toastOptions={{
              className: "rounded-none border-x-0 border-t-0 shadow-none",
              duration: 5000,
            }}
          />
          {isLoadingUser ? ( // Show splash ONLY if loading user
            <SplashScreen onComplete={() => { /* No-op, as isLoadingUser will become false */ }} />
          ) : (
            <BrowserRouter>
              <Routes>
                {/* If user is logged in, redirect from "/" to "/dashboard" */}
                <Route path="/" element={currentUserProfile ? <Navigate to="/dashboard" replace /> : <Index />} /> 

                {/* Protected routes requiring authentication */}
                <Route element={<ProtectedRoute />}> {/* All child routes require login */}
                  <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/courses/:courseId" element={<CourseDetail />} />
                    <Route path="/courses/:courseId/modules/:moduleIndex" element={<ModuleDetail />} />
                    <Route path="/create-course" element={<CreateCourse />} />
                    <Route path="/create-course/:courseId" element={<CreateCourse />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/all-notes" element={<AllNotes />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/establishments" element={<EstablishmentManagementPage />} />
                    <Route path="/curricula" element={<CurriculumManagementPage />} />
                    <Route path="/classes" element={<ClassManagementPage />} />
                    <Route path="/students" element={<StudentManagementPage />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/data-model" element={<DataModelViewer />} />
                  </Route>
                </Route>

                {/* Catch-all route for 404 Not Found */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          )}
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