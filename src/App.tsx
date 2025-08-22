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
import EstablishmentManagementPage from "./pages/EstablishmentManagementPage";
import CurriculumManagementPage from "./pages/CurriculumManagementPage";
import ClassManagementPage from "./pages/ClassManagementPage";
import StudentManagementPage from "./pages/StudentManagementPage";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import DataModelViewer from "./pages/DataModelViewer";
import Messages from "./pages/Messages";
// import About from "./pages/About"; // Removed direct import as it's now part of AboutModal
import { ThemeProvider } from "./components/theme-provider";
import SplashScreen from "./components/SplashScreen";
import { RoleProvider, useRole } from "./contexts/RoleContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CourseChatProvider } from "./contexts/CourseChatContext"; // Import CourseChatProvider

const queryClient = new QueryClient();

// A wrapper component to get the theme from useRole and pass it to ThemeProvider
const AppWithThemeProvider = () => {
  const { currentUserProfile, isLoadingUser } = useRole();
  const [showSplash, setShowSplash] = useState(true);

  // Determine the initial theme based on user profile or system preference
  const initialTheme = currentUserProfile?.theme || "system";

  React.useEffect(() => {
    // Only hide splash screen once user loading is complete
    if (!isLoadingUser) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 3000); // Affiche le splash screen pendant 3 secondes
      return () => clearTimeout(timer);
    }
  }, [isLoadingUser]);

  // Service Worker Update Logic
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      let registration: ServiceWorkerRegistration | null = null;

      const onUpdateFound = (reg: ServiceWorkerRegistration) => {
        const newWorker = reg.installing || reg.waiting;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available and ready to be activated
              toast.info("Une nouvelle version de l'application est disponible !", {
                action: (
                  <Button
                    onClick={() => {
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                      window.location.reload();
                    }}
                    size="sm"
                  >
                    Mettre à jour
                  </Button>
                ),
                duration: Infinity, // Keep toast visible until user acts
              });
            }
          });
        }
      };

      navigator.serviceWorker.register('/service-worker.js')
        .then((reg) => {
          registration = reg;
          console.log('SW registered: ', reg);

          // Check for updates immediately
          reg.update();

          // Listen for new updates
          reg.addEventListener('updatefound', () => onUpdateFound(reg));
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });

      // Also check for updates when the page gains focus (e.e., user returns to tab)
      const handleFocus = () => {
        if (registration) {
          registration.update();
        }
      };
      window.addEventListener('focus', handleFocus);

      return () => {
        if (registration) {
          registration.removeEventListener('updatefound', () => onUpdateFound(registration));
        }
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, []);


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
          {showSplash || isLoadingUser ? ( // Show splash if loading user or splash is active
            <SplashScreen onComplete={() => setShowSplash(false)} />
          ) : (
            <BrowserRouter>
              <Routes>
                {/* Public route for the landing page (Index.tsx) */}
                <Route path="/" element={<Index />} /> 
                {/* Public route for the About page (now handled by modal, so route removed) */}
                {/* <Route path="/about" element={<About />} /> */}

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