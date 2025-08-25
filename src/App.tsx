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
import { loadNavItems } from "./lib/navItems"; // Import loadNavItems
import { NavItem } from "./lib/dataModels"; // Import NavItem type
import AdminMenuManagementPage from "./pages/AdminMenuManagementPage"; // Import the new page

const queryClient = new QueryClient();

const AppWithThemeProvider = () => {
  const { currentUserProfile, isLoadingUser, currentRole } = useRole();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [dynamicRoutes, setDynamicRoutes] = useState<NavItem[]>([]);

  // Determine the initial theme based on user profile or default to 'modern-blue'
  const initialTheme = currentUserProfile?.theme || "modern-blue";

  useEffect(() => {
    const fetchNavRoutes = async () => {
      const items = await loadNavItems(currentRole);
      // Flatten the tree to get all routes
      const flattenAndFilterRoutes = (navItems: NavItem[]): NavItem[] => {
        let routes: NavItem[] = [];
        navItems.forEach(item => {
          if (item.route && !item.route.startsWith('#') && !item.is_external) {
            routes.push(item);
          }
          if (item.children) {
            routes = routes.concat(flattenAndFilterRoutes(item.children));
          }
        });
        return routes;
      };
      setDynamicRoutes(flattenAndFilterRoutes(items));
    };
    fetchNavRoutes();
  }, [currentRole]); // Re-fetch routes when role changes

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

                <Route element={<ProtectedRoute />}>
                  <Route element={<DashboardLayout setIsAdminModalOpen={setIsAdminModalOpen} />}>
                    {/* Dynamically generated routes */}
                    {dynamicRoutes.map(item => (
                      <Route
                        key={item.id}
                        path={item.route}
                        element={
                          // Render component based on route, using a switch or map
                          // This part needs to be manually mapped as element cannot be dynamic string
                          item.route === "/dashboard" ? <Dashboard /> :
                          item.route === "/courses" ? <Courses /> :
                          item.route === "/create-course" ? <CreateCourse /> :
                          item.route === "/create-course/:courseId" ? <CreateCourse /> :
                          item.route === "/analytics" ? <Analytics /> :
                          item.route === "/courses/:courseId" ? <CourseDetail /> :
                          item.route === "/courses/:courseId/modules/:moduleIndex" ? <ModuleDetail /> :
                          item.route === "/all-notes" ? <AllNotes /> :
                          item.route === "/messages" ? <Messages /> :
                          item.route === "/profile" ? <Profile /> :
                          item.route === "/settings" ? <Settings /> :
                          item.route === "/data-model" ? <DataModelViewer /> :
                          item.route === "/establishments" ? <EstablishmentManagementPage /> :
                          item.route === "/admin-users" ? <AdminUserManagementPage /> :
                          item.route === "/subjects" ? <SubjectManagementPage /> :
                          item.route === "/school-years" ? <SchoolYearManagementPage /> :
                          item.route === "/professor-assignments" ? <ProfessorSubjectAssignmentPage /> :
                          item.route === "/curricula" ? <CurriculumManagementPage /> :
                          item.route === "/classes" ? <ClassManagementPage /> :
                          item.route === "/students" ? <StudentManagementPage /> :
                          item.route === "/pedagogical-management" ? <PedagogicalManagementPage /> :
                          item.route === "/admin-menu-management" ? <AdminMenuManagementPage /> : // Added this line
                          <NotFound /> // Fallback for unmapped dynamic routes
                        }
                      />
                    ))}
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