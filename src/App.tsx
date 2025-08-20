import React, { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom"; // Import Outlet
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
import ClassManagement from "./pages/ClassManagement";
// import GlobalSearch from "./pages/GlobalSearch"; // Removed GlobalSearch import
import { ThemeProvider } from "./components/theme-provider";
import SplashScreen from "./components/SplashScreen";
import { RoleProvider } from "./contexts/RoleContext";
import { CourseChatProvider } from "./contexts/CourseChatContext";

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
                {/* Envelopper la route de la page d'accueil avec les fournisseurs de contexte */}
                <Route element={
                  <RoleProvider>
                    <CourseChatProvider>
                      <Outlet /> {/* Outlet rend le composant enfant (Index) */}
                    </CourseChatProvider>
                  </RoleProvider>
                }>
                  <Route path="/" element={<Index />} />
                </Route>

                {/* Routes with Dashboard Layout, wrapped by RoleProvider and CourseChatProvider */}
                <Route element={
                  <RoleProvider>
                    <CourseChatProvider>
                      <DashboardLayout />
                    </CourseChatProvider>
                  </RoleProvider>
                }>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/courses/:courseId" element={<CourseDetail />} />
                  <Route path="/courses/:courseId/modules/:moduleIndex" element={<ModuleDetail />} />
                  <Route path="/create-course" element={<CreateCourse />} />
                  <Route path="/create-course/:courseId" element={<CreateCourse />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/all-notes" element={<AllNotes />} />
                  <Route path="/class-management" element={<ClassManagement />} />
                  {/* Removed Global Search Route */}
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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