import React, { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
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
import EstablishmentManagementPage from "./pages/EstablishmentManagementPage"; // New import
import CurriculumManagementPage from "./pages/CurriculumManagementPage";   // New import
import ClassManagementPage from "./pages/ClassManagementPage";             // New import
import StudentManagementPage from "./pages/StudentManagementPage";         // New import
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import DataModelViewer from "./pages/DataModelViewer";
import { ThemeProvider } from "./components/theme-provider";
import SplashScreen from "./components/SplashScreen";
import { RoleProvider } from "./contexts/RoleContext";
import { CourseChatProvider } from "./contexts/CourseChatContext";
import ProtectedRoute from "./components/ProtectedRoute"; // Import ProtectedRoute

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme" attribute="class">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {showSplash ? (
            <SplashScreen onComplete={() => setShowSplash(false)} />
          ) : (
            <BrowserRouter>
              <Routes>
                {/* Public route for the landing page */}
                <Route element={
                  <RoleProvider>
                    <CourseChatProvider>
                      <Outlet />
                    </CourseChatProvider>
                  </RoleProvider>
                }>
                  <Route path="/" element={<Index />} />
                </Route>

                {/* Protected routes requiring authentication */}
                <Route element={
                  <RoleProvider>
                    <CourseChatProvider>
                      <ProtectedRoute /> {/* All child routes require login */}
                    </CourseChatProvider>
                  </RoleProvider>
                }>
                  <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/courses/:courseId" element={<CourseDetail />} />
                    <Route path="/courses/:courseId/modules/:moduleIndex" element={<ModuleDetail />} />
                    <Route path="/create-course" element={<CreateCourse />} />
                    <Route path="/create-course/:courseId" element={<CreateCourse />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/all-notes" element={<AllNotes />} />
                    {/* New routes for management pages */}
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

export default App;