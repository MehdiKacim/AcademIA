import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, PlusSquare, BarChart2, User, LogOut, Settings, GraduationCap, PenTool, Users, NotebookText, School, Search, ArrowLeft, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, BarChartBig } from "lucide-react"; // Added BriefcaseBusiness for Administration and new analytics icons
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
} from "@/components/ui/tooltip";
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
  to?: string;
  onClick?: () => void;
  type: 'link' | 'trigger';
  items?: { to: string; label: string; icon?: React.ElementType; type: 'link' }[];
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
    // Determine currentNavLevel based on the new direct paths
    if (currentRole === 'creator') {
      if (location.pathname === '/courses' || location.pathname.startsWith('/create-course')) {
        setCurrentNavLevel('courses');
      } else if (location.pathname.startsWith('/establishments') || location.pathname.startsWith('/curricula') || location.pathname.startsWith('/classes') || location.pathname.startsWith('/students')) {
        setCurrentNavLevel('administration');
      } else if (location.pathname.startsWith('/analytics')) {
        setCurrentNavLevel('creator-analytics');
      } else {
        setCurrentNavLevel(null);
      }
    } else if (currentRole === 'tutor') {
      if (location.pathname.startsWith('/classes') || location.pathname.startsWith('/students')) {
        setCurrentNavLevel('user-management');
      } else if (location.pathname.startsWith('/analytics')) {
        setCurrentNavLevel('tutor-analytics');
      } else {
        setCurrentNavLevel(null);
      }
    } else if (currentRole === 'student') {
      if (location.pathname.startsWith('/analytics')) {
        setCurrentNavLevel('student-analytics');
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
        {
          icon: BarChart2,
          label: "Analytiques",
          type: 'trigger',
          onClick: () => setCurrentNavLevel('student-analytics'),
          items: [
            { to: "/analytics?view=personal", label: "Mes Statistiques", icon: UserRoundCog, type: 'link' },
            { to: "/analytics?view=quiz-performance", label: "Performance Quiz", icon: ClipboardCheck, type: 'link' },
            { to: "/analytics?view=aia-engagement", label: "Engagement AiA", icon: BotMessageSquare, type: 'link' },
          ],
        },
      ];
    } else if (currentRole === 'creator') {
      return [
        ...baseItems,
        {
          icon: BookOpen,
          label: "Cours",
          type: 'trigger',
          onClick: () => setCurrentNavLevel('courses'),
          items: [
            { to: "/courses", label: "Mes Cours", icon: BookOpen, type: 'link' },
            { to: "/create-course", label: "Créer un cours", icon: PlusSquare, type: 'link' },
          ],
        },
        {
          icon: BriefcaseBusiness,
          label: "Administration",
          type: 'trigger',
          onClick: () => setCurrentNavLevel('administration'),
          items: [
            { to: "/establishments", label: "Établissements", icon: School, type: 'link' },
            { to: "/curricula", label: "Cursus", icon: LayoutList, type: 'link' },
            { to: "/classes", label: "Classes", icon: Users, type: 'link' },
            { to: "/students", label: "Élèves", icon: GraduationCap, type: 'link' },
          ],
        },
        {
          icon: BarChart2,
          label: "Analytiques",
          type: 'trigger',
          onClick: () => setCurrentNavLevel('creator-analytics'),
          items: [
            { to: "/analytics?view=overview", label: "Vue d'ensemble", icon: LayoutDashboard, type: 'link' },
            { to: "/analytics?view=course-performance", label: "Performance des Cours", icon: LineChart, type: 'link' },
            { to: "/analytics?view=student-engagement", label: "Engagement Élèves", icon: UsersRound, type: 'link' },
          ],
        },
      ];
    } else if (currentRole === 'tutor') {
      return [
        ...baseItems,
        {
          icon: Users,
          label: "Gestion des Utilisateurs",
          type: 'trigger',
          onClick: () => setCurrentNavLevel('user-management'),
          items: [
            { to: "/classes", label: "Mes Classes", icon: Users, type: 'link' },
            { to: "/students", label: "Tous les Élèves", icon: GraduationCap, type: 'link' },
          ],
        },
        {
          icon: BarChart2,
          label: "Analytiques",
          type: 'trigger',
          onClick: () => setCurrentNavLevel('tutor-analytics'),
          items: [
            { to: "/analytics?view=student-monitoring", label: "Suivi des Élèves", icon: UserRoundSearch, type: 'link' },
            { to: "/analytics?view=alerts", label: "Alertes & Recommandations", icon: BellRing, type: 'link' },
            { to: "/analytics?view=class-performance", label: "Performance par Classe", icon: BarChartBig, type: 'link' },
          ],
        },
      ];
    }
    return baseItems;
  };

  const navItemsToDisplayForDesktop = () => {
    if (currentNavLevel === 'courses' && currentRole === 'creator') {
      return [
        { icon: ArrowLeft, label: "Retour", type: 'trigger', onClick: () => setCurrentNavLevel(null) },
        { to: "/courses", label: "Mes Cours", icon: BookOpen, type: 'link' },
        { to: "/create-course", label: "Créer un cours", icon: PlusSquare, type: 'link' },
      ];
    } else if (currentNavLevel === 'administration' && currentRole === 'creator') {
      return [
        { icon: ArrowLeft, label: "Retour", type: 'trigger', onClick: () => setCurrentNavLevel(null) },
        { to: "/establishments", label: "Établissements", icon: School, type: 'link' },
        { to: "/curricula", label: "Cursus", icon: LayoutList, type: 'link' },
        { to: "/classes", label: "Classes", icon: Users, type: 'link' },
        { to: "/students", label: "Élèves", icon: GraduationCap, type: 'link' },
      ];
    } else if (currentNavLevel === 'user-management' && currentRole === 'tutor') {
      return [
        { icon: ArrowLeft, label: "Retour", type: 'trigger', onClick: () => setCurrentNavLevel(null) },
        { to: "/classes", label: "Mes Classes", icon: Users, type: 'link' },
        { to: "/students", label: "Tous les Élèves", icon: GraduationCap, type: 'link' },
      ];
    } else if (currentNavLevel === 'student-analytics' && currentRole === 'student') {
      const analyticsItems = getMainNavItems().find(item => item.label === 'Analytiques')?.items;
      return [
        { icon: ArrowLeft, label: "Retour", type: 'trigger', onClick: () => setCurrentNavLevel(null) },
        ...(analyticsItems || []),
      ];
    } else if (currentNavLevel === 'creator-analytics' && currentRole === 'creator') {
      const analyticsItems = getMainNavItems().find(item => item.label === 'Analytiques')?.items;
      return [
        { icon: ArrowLeft, label: "Retour", type: 'trigger', onClick: () => setCurrentNavLevel(null) },
        ...(analyticsItems || []),
      ];
    } else if (currentNavLevel === 'tutor-analytics' && currentRole === 'tutor') {
      const analyticsItems = getMainNavItems().find(item => item.label === 'Analytiques')?.items;
      return [
        { icon: ArrowLeft, label: "Retour", type: 'trigger', onClick: () => setCurrentNavLevel(null) },
        ...(analyticsItems || []),
      ];
    }
    return getMainNavItems();
  };


  return (
    <div className="flex flex-col min-h-screen bg-muted/40 overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 px-2 py-4 flex items-center justify-between border-b backdrop-blur-lg bg-background/80">
        <Logo />
        {!isMobile && (
          <nav className="flex flex-grow justify-center items-center gap-2 sm:gap-4 flex-wrap">
            {navItemsToDisplayForDesktop().map((item) => {
              const isCurrentPathActive = item.to && location.pathname.startsWith(item.to);
              const isTriggerActive = item.type === 'trigger' && currentNavLevel === item.label.toLowerCase().replace(/\s/g, '-'); // Normalize label for comparison

              return item.type === 'link' && item.to ? (
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
                  className={cn(
                    "flex items-center p-2 rounded-md text-sm font-medium whitespace-nowrap",
                    isTriggerActive || isCurrentPathActive // Check if trigger itself is active or if a sub-path is active
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              ) : null
            })}
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
      <BottomNavigationBar navItems={getMainNavItems()} onOpenGlobalSearch={currentUser ? () => setIsSearchOverlayOpen(true) : undefined} currentUser={currentUser} />
      {currentUser && <AiAPersistentChat />}
      {currentUser && <FloatingAiAChatButton />}
      {currentUser && <GlobalSearchOverlay isOpen={isSearchOverlayOpen} onClose={() => setIsSearchOverlayOpen(false)} />}
      {currentUser && <DataModelModal isOpen={isDataModelModalOpen} onClose={() => setIsDataModelModalOpen(false)} />}
    </div>
  );
};

export default DashboardLayout;