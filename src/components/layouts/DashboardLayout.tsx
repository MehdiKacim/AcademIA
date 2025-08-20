import { NavLink, Outlet, useNavigate } from "react-router-dom"; // Import useNavigate
import { Home, BookOpen, PlusSquare, BarChart2, User, LogOut, Settings, GraduationCap, PenTool, Users, NotebookText, School, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { ThemeToggle } from "../theme-toggle";
import { Button } from "@/components/ui/button";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRole } from "@/contexts/RoleContext";
import AiAPersistentChat from "@/components/AiAPersistentChat";
import { useCourseChat } from "@/contexts/CourseChatContext";
import FloatingAiAChatButton from "@/components/FloatingAiAChatButton";
import GlobalSearchOverlay from "@/components/GlobalSearchOverlay";
import React, { useState } from "react";

const DashboardLayout = () => {
  const isMobile = useIsMobile();
  const { currentRole, setRole } = useRole();
  const { openChat } = useCourseChat();
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const getNavItems = () => {
    const baseItems = [
      { to: "/dashboard", icon: Home, label: "Tableau de bord" },
    ];

    if (currentRole === 'student') {
      return [
        ...baseItems,
        { to: "/courses", icon: BookOpen, label: "Mes Cours" },
        { to: "/all-notes", icon: NotebookText, label: "Mes Notes" },
      ];
    } else if (currentRole === 'creator') {
      return [
        ...baseItems,
        { to: "/courses", icon: BookOpen, label: "Mes Cours" },
        { to: "/create-course", icon: PlusSquare, label: "Créer un cours" },
        { to: "/class-management", icon: School, label: "Gestion des Classes" },
        // Analytics for creator will be integrated into Class Management
      ];
    } else if (currentRole === 'tutor') {
      return [
        ...baseItems,
        { to: "/analytics", icon: BarChart2, label: "Progression" },
        { to: "/all-notes", icon: NotebookText, label: "Mes Notes" },
      ];
    }
    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className="flex flex-col min-h-screen bg-muted/40 overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 px-2 py-4 flex items-center justify-between border-b backdrop-blur-lg bg-background/80">
        <Logo />
        {/* Navigation pour les écrans non mobiles */}
        {!isMobile && (
          <nav className="flex flex-grow justify-center items-center gap-2 sm:gap-4 flex-wrap">
            {navItems.filter(item => item.to).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center p-2 rounded-md text-sm font-medium whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          {/* Global Search Button (Desktop only) */}
          {!isMobile && (
            <Button variant="outline" size="icon" onClick={() => setIsSearchOverlayOpen(true)}>
              <Search className="h-5 w-5" />
              <span className="sr-only">Recherche globale</span>
            </Button>
          )}

          {/* Boutons de sélection de rôle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {currentRole === 'student' && <GraduationCap className="h-4 w-4" />}
                {currentRole === 'creator' && <PenTool className="h-4 w-4" />}
                {currentRole === 'tutor' && <Users className="h-4 w-4" />}
                <span className="hidden sm:inline-block">
                  {currentRole === 'student' ? 'Élève' : currentRole === 'creator' ? 'Créateur' : 'Tuteur'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Changer de rôle</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setRole('student')}>
                <GraduationCap className="mr-2 h-4 w-4" />
                <span>Élève</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRole('creator')}>
                <PenTool className="mr-2 h-4 w-4" />
                <span>Créateur</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRole('tutor')}>
                <Users className="mr-2 h-4 w-4" />
                <span>Tuteur</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />
          {/* Menu déroulant pour les actions utilisateur */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">Menu utilisateur</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}> {/* Use navigate */}
                <User className="mr-2 h-4 w-4" />
                <span>Mon profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}> {/* Use navigate */}
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/")}> {/* Use navigate */}
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className={cn("flex-grow p-4 sm:p-6 md:p-8 pt-24 md:pt-32", isMobile && "pb-20")}>
        <Outlet />
      </main>
      <BottomNavigationBar navItems={navItems} onOpenGlobalSearch={() => setIsSearchOverlayOpen(true)} />
      <AiAPersistentChat />
      <FloatingAiAChatButton />
      <GlobalSearchOverlay isOpen={isSearchOverlayOpen} onClose={() => setIsSearchOverlayOpen(false)} />
    </div>
  );
};

export default DashboardLayout;