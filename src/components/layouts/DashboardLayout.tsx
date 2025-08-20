import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, PlusSquare, BarChart2, User, LogOut, Settings, GraduationCap, PenTool, Users, NotebookText, School, Search, ArrowLeft } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Import Tooltip components
import { useRole } from "@/contexts/RoleContext";
import AiAPersistentChat from "@/components/AiAPersistentChat";
import { useCourseChat } from "@/contexts/CourseChatContext";
import FloatingAiAChatButton from "@/components/FloatingAiAChatButton";
import GlobalSearchOverlay from "@/components/GlobalSearchOverlay";
import DataModelModal from "@/components/DataModelModal";
import React, { useState, useEffect, useCallback } from "react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  to?: string; // For actual route links
  onClick?: () => void; // For navigation level triggers
  type: 'link' | 'trigger'; // Explicitly define type
  items?: { to: string; label: string; icon?: React.ElementType; type: 'link' }[]; // Sub-items for dropdown/trigger, explicitly typed as 'link'
}

const DashboardLayout = () => {
  const isMobile = useIsMobile();
  const { currentUser, currentRole, setCurrentUser } = useRole();
  const { openChat } = useCourseChat();
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [isDataModelModalOpen, setIsDataModelModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [currentNavLevel, setCurrentNavLevel] = useState<string | null>(null);

  const handleLogout = () => {
    setCurrentUser(null);
    navigate("/");
  };

  useEffect(() => {
    // This effect is primarily for desktop navigation highlighting
    // For mobile, BottomNavigationBar manages its own level
    if (currentRole === 'creator') {
      if (location.pathname === '/courses' || location.pathname === '/create-course') {
        setCurrentNavLevel('courses');
      } else {
        setCurrentNavLevel(null);
      }
    } else {
      setCurrentNavLevel(null);
    }
  }, [location.pathname, currentRole]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isModifierPressed = event.ctrlKey || event.metaKey;

    if (currentUser) {
      if (isModifierPressed && event.key === 'f') {
        event.preventDefault();
        setIsSearchOverlayOpen(true);
      } else if (isModifierPressed && event.key === 'm') {
        event.preventDefault();
        setIsDataModelModalOpen(true);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const getMainNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      { to: "/dashboard", icon: Home, label: "Tableau de bord", type: 'link' },
    ];

    if (currentRole === 'student') {
      return [
        ...baseItems,
        { to: "/courses", icon: BookOpen, label: "Mes Cours", type: 'link' },
        { to: "/all-notes", icon: NotebookText, label: "Mes Notes", type: 'link' },
      ];
    } else if (currentRole === 'creator') {
      return [
        ...baseItems,
        {
          icon: BookOpen,
          label: "Cours",
          type: 'trigger',
          onClick: () => setCurrentNavLevel('courses'), // This is for desktop menu behavior
          items: [
            { to: "/courses", label: "Mes Cours", icon: BookOpen, type: 'link' },
            { to: "/create-course", label: "Créer un cours", icon: PlusSquare, type: 'link' },
          ],
        },
        { to: "/class-management", icon: School, label: "Gestion des Classes", type: 'link' },
        { to: "/analytics", icon: BarChart2, label: "Analytiques", type: 'link' },
      ];
    } else if (currentRole === 'tutor') {
      return [
        ...baseItems,
        { to: "/class-management", icon: School, label: "Gestion des Élèves", type: 'link' },
        { to: "/analytics", icon: BarChart2, label: "Suivi des Élèves", type: 'link' },
      ];
    }
    return baseItems;
  };

  // This function is now primarily for desktop rendering logic,
  // as BottomNavigationBar handles its own sub-menu display based on the full navItems structure.
  const navItemsToDisplayForDesktop = currentNavLevel === 'courses' && currentRole === 'creator'
    ? [
        { icon: ArrowLeft, label: "Retour", type: 'trigger', onClick: () => setCurrentNavLevel(null) },
        { to: "/courses", label: "Mes Cours", icon: BookOpen, type: 'link' },
        { to: "/create-course", label: "Créer un cours", icon: PlusSquare, type: 'link' },
      ]
    : getMainNavItems();


  return (
    <div className="flex flex-col min-h-screen bg-muted/40 overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 px-2 py-4 flex items-center justify-between border-b backdrop-blur-lg bg-background/80">
        <Logo />
        {!isMobile && (
          <nav className="flex flex-grow justify-center items-center gap-2 sm:gap-4 flex-wrap">
            {navItemsToDisplayForDesktop.map((item) => (
              item.type === 'link' && item.to ? (
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
              ) : item.type === 'trigger' && item.onClick ? (
                <Button
                  key={item.label}
                  variant="ghost"
                  onClick={item.onClick}
                  className="flex items-center p-2 rounded-md text-sm font-medium whitespace-nowrap hover:bg-accent hover:text-accent-foreground"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              ) : null
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          {!isMobile && currentUser && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setIsSearchOverlayOpen(true)}>
                  <Search className="h-5 w-5" />
                  <span className="sr-only">Recherche globale</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Recherche (Ctrl + F)</p>
              </TooltipContent>
            </Tooltip>
          )}

          <ThemeToggle />
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
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Mon profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
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
      {/* Pass the full hierarchical navItems to BottomNavigationBar */}
      <BottomNavigationBar navItems={getMainNavItems()} onOpenGlobalSearch={currentUser ? () => setIsSearchOverlayOpen(true) : undefined} currentUser={currentUser} />
      {currentUser && <AiAPersistentChat />}
      {currentUser && <FloatingAiAChatButton />}
      {currentUser && <GlobalSearchOverlay isOpen={isSearchOverlayOpen} onClose={() => setIsSearchOverlayOpen(false)} />}
      {currentUser && <DataModelModal isOpen={isDataModelModalOpen} onClose={() => setIsDataModelModalOpen(false)} />}
    </div>
  );
};

export default DashboardLayout;