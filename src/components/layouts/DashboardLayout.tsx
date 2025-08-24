import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, PlusSquare, BarChart2, User, LogOut, Settings, GraduationCap, PenTool, Users, NotebookText, School, Search, ArrowLeft, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, MessageSquare, LogIn, Info, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck } from "lucide-react";
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
import { useCourseChat } from "@/contexts/CourseChatContext";
import AiAPersistentChat from "@/components/AiAPersistentChat";
import FloatingAiAPersistentChat from "@/components/FloatingAiAPersistentChat";
import GlobalSearchOverlay from "@/components/GlobalSearchOverlay";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { getUnreadMessageCount } from "@/lib/messageData";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/lib/dataModels";
import { NavItem } from "@/lib/dataModels";
import AuthModal from "@/components/AuthModal";
import AboutModal from "@/components/AboutModal";
// Removed SwipeUpIndicator import
// Removed useSwipeable import

interface DashboardLayoutProps {
  setIsAdminModalOpen: (isOpen: boolean) => void;
}

const DashboardLayout = ({ setIsAdminModalOpen }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();
  const { currentUserProfile, currentRole, signOut } = useRole();
  const { isChatOpen } = useCourseChat();
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [currentNavLevel, setCurrentNavLevel] = useState<string | null>(null);
  const [isAiAChatButtonVisible, setIsAiAChatButtonVisible] = useState(true);
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoTapCountRef = useRef(0);

  const startAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
    }
    autoHideTimerRef.current = setTimeout(() => {
      setIsAiAChatButtonVisible(false);
    }, 5000);
  }, []);

  const resetAndShowButton = useCallback(() => {
    setIsAiAChatButtonVisible(true);
    startAutoHideTimer();
  }, [startAutoHideTimer]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isModifierPressed = event.ctrlKey || event.metaKey;

    if (isModifierPressed && event.shiftKey && event.key === 'S') {
      event.preventDefault();
      setIsAdminModalOpen(true);
    } else if (currentUserProfile && isModifierPressed && event.key === 'f') {
      event.preventDefault();
      setIsSearchOverlayOpen(true);
    }
  }, [currentUserProfile, setIsAdminModalOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    let channel: any;
    const fetchAndSubscribeUnreadCount = async () => {
      if (currentUserProfile?.id) {
        // Initial fetch
        const initialCount = await getUnreadMessageCount(currentUserProfile.id);
        setUnreadMessages(initialCount);

        // Set up real-time listener
        channel = supabase
          .channel(`unread_messages_${currentUserProfile.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `receiver_id=eq.${currentUserProfile.id}`
            },
            async (payload) => {
              // Re-fetch count on new message to ensure accuracy
              const newCount = await getUnreadMessageCount(currentUserProfile.id);
              setUnreadMessages(newCount);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'messages',
              filter: `receiver_id=eq.${currentUserProfile.id}`
            },
            async (payload) => {
              // Re-fetch count on message update (read status, archive status) to ensure accuracy
              const newCount = await getUnreadMessageCount(currentUserProfile.id);
              setUnreadMessages(newCount);
            }
          )
          .subscribe();
      }
    };

    fetchAndSubscribeUnreadCount();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [currentUserProfile?.id]);


  // This function generates the full, structured navigation tree for desktop sidebar
  const fullNavTree = React.useMemo((): NavItem[] => {
    const items: NavItem[] = [
      { to: "/dashboard", icon: Home, label: "Accueil", type: 'link', category: "Général" },
      { to: "/messages", icon: MessageSquare, label: "Messages", type: 'link', badge: unreadMessages, category: "Général" },
    ];

    if (currentRole === 'student') {
      items.push(
        { to: "/courses", icon: BookOpen, label: "Mes Cours", type: 'link', category: "Apprentissage" },
        { to: "/all-notes", icon: NotebookText, label: "Mes Notes", type: 'link', category: "Apprentissage" },
        { to: "/analytics?view=personal", label: "Mes Statistiques", icon: UserRoundCog, type: 'link', category: "Progression" },
        { to: "/analytics?view=quiz-performance", label: "Performance Quiz", icon: ClipboardCheck, type: 'link', category: "Progression" },
        { to: "/analytics?view=aia-engagement", label: "Engagement AiA", icon: BotMessageSquare, type: 'link', category: "Progression" },
      );
    } else if (currentRole === 'professeur') {
      items.push(
        { to: "/courses", icon: BookOpen, label: "Mes Cours", type: 'link', category: "Contenu" },
        { to: "/create-course", label: "Créer un cours", icon: PlusSquare, type: 'link', category: "Contenu" },
        { to: "/classes", label: "Mes Classes", icon: Users, type: 'link', category: "Gestion" },
        { to: "/students", label: "Mes Élèves", icon: GraduationCap, type: 'link', category: "Gestion" },
        { to: "/curricula", label: "Gestion Cursus", icon: LayoutList, type: 'link', category: "Gestion" },
        { to: "/subjects", label: "Gestion Matières", icon: BookText, type: 'link', category: "Gestion" },
        { to: "/pedagogical-management", label: "Gestion Pédagogique", icon: BookMarked, type: 'link', category: "Gestion" },
        { to: "/analytics?view=overview", label: "Vue d'ensemble", icon: LayoutDashboard, type: 'link', category: "Analytiques" },
        { to: "/analytics?view=course-performance", label: "Performance des Cours", icon: LineChart, type: 'link', category: "Analytiques" },
        { to: "/analytics?view=student-engagement", label: "Engagement Élèves", icon: UsersRound, type: 'link', category: "Analytiques" },
      );
    } else if (currentRole === 'tutor') {
      items.push(
        { to: "/classes", label: "Mes Classes", icon: Users, type: 'link', category: "Suivi" },
        { to: "/students", label: "Mes Élèves", icon: GraduationCap, type: 'link', category: "Suivi" },
        { to: "/pedagogical-management", label: "Gestion Pédagogique", icon: BookMarked, type: 'link', category: "Suivi" },
        { to: "/analytics?view=student-monitoring", label: "Suivi des Élèves", icon: UserRoundSearch, type: 'link', category: "Analytiques" },
        { to: "/analytics?view=alerts", label: "Alertes & Recommandations", icon: BellRing, type: 'link', category: "Analytiques" },
        { to: "/analytics?view=class-performance", label: "Performance par Classe", icon: BarChart2, type: 'link', category: "Analytiques" },
      );
    } else if (currentRole === 'administrator') {
      items.push(
        { to: "/establishments", label: "Gestion Établissements", icon: Building2, type: 'link', category: "Administration" },
        { to: "/admin-users", label: "Gestion Utilisateurs", icon: UserRoundCog, type: 'link', category: "Administration" },
        { to: "/curricula", label: "Gestion Cursus", icon: LayoutList, type: 'link', category: "Administration" },
        { to: "/subjects", label: "Gestion Matières", icon: BookText, type: 'link', category: "Administration" },
        { to: "/classes", label: "Gestion Classes", icon: Users, type: 'link', category: "Administration" },
        { to: "/pedagogical-management", label: "Gestion Pédagogique", icon: BookMarked, type: 'link', category: "Administration" },
        { to: "/school-years", label: "Gestion Années Scolaires", icon: CalendarDays, type: 'link', category: "Administration" },
        { to: "/professor-assignments", label: "Affectations Professeurs", icon: UserCheck, type: 'link', category: "Administration" },
        { to: "/analytics?view=establishment-admin", label: "Analytiques Établissement", icon: LayoutDashboard, type: 'link', category: "Analytiques" },
      );
    } else if (currentRole === 'director' || currentRole === 'deputy_director') {
      items.push(
        { to: "/curricula", label: "Gestion Cursus", icon: LayoutList, type: 'link', category: "Gestion Pédagogique" },
        { to: "/subjects", label: "Gestion Matières", icon: BookText, type: 'link', category: "Gestion Pédagogique" },
        { to: "/classes", label: "Gestion Classes", icon: Users, type: 'link', category: "Gestion Pédagogique" },
        { to: "/pedagogical-management", label: "Gestion des Élèves par Classe", icon: BookMarked, type: 'link', category: "Gestion Pédagogique" },
        { to: "/school-years", label: "Gestion Années Scolaires", icon: CalendarDays, type: 'link', category: "Gestion Pédagogique" },
        { to: "/professor-assignments", label: "Affectations Professeurs", icon: UserCheck, type: 'link', category: "Gestion Pédagogique" },
        { to: "/establishments", label: "Mon Établissement", icon: Building2, type: 'link', category: "Gestion Administrative" },
        { to: "/admin-users", label: "Gestion Professeurs", icon: UserRoundCog, type: 'link', category: "Gestion Administrative" },
        { to: "/students", label: "Gestion Élèves", icon: GraduationCap, type: 'link', category: "Gestion Administrative" },
        { to: "/analytics?view=establishment-admin", label: "Analytiques Établissement", icon: LayoutDashboard, type: 'link', category: "Analytiques" },
      );
    }

    return items;
  }, [currentRole, unreadMessages]);

  // Removed getIsParentTriggerActive as it's no longer needed for flat menu

  const handleLogoClick = useCallback(() => {
    logoTapCountRef.current += 1;
    if (logoTapCountRef.current >= 10) {
      setIsAdminModalOpen(true);
      logoTapCountRef.current = 0;
    }
    setTimeout(() => {
      logoTapCountRef.current = 0;
    }, 1000);
  }, [setIsAdminModalOpen]);

  useEffect(() => {
    startAutoHideTimer();
    return () => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
    };
  }, [startAutoHideTimer]);

  // Corrected visibility logic: visible if its own state is true AND chat is not open
  const floatingAiAChatButtonVisible = isAiAChatButtonVisible && !isChatOpen;

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <header className="fixed top-0 left-0 right-0 z-50 px-2 py-4 flex items-center justify-between border-b backdrop-blur-lg bg-background/80">
        <Logo onLogoClick={handleLogoClick} />
        {!isMobile && (
          <nav className="flex flex-grow justify-center items-center gap-2 sm:gap-4 flex-wrap">
            {fullNavTree.map((item) => {
              const isLinkActive = item.to && (location.pathname + location.search).startsWith(item.to);

              // Render all items as simple links for desktop
              return (
                <NavLink
                  key={item.to || item.label} // Use label as fallback key for non-link items if any
                  to={item.to || '#'} // Fallback to '#' for non-link items
                  onClick={item.onClick} // Keep onClick for trigger items
                  className={() =>
                    cn(
                      "flex items-center p-2 rounded-md text-sm font-medium whitespace-nowrap",
                      isLinkActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )
                  }
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-2 bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        )}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          {!isMobile && currentUserProfile && (
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
          <Button variant="outline" size="icon" onClick={() => setIsAboutModalOpen(true)} className="md:hidden">
            <Info className="h-5 w-5" />
            <span className="sr-only">À propos</span>
          </Button>
          <Button variant="outline" onClick={() => setIsAboutModalOpen(true)} className="hidden md:flex">
            <Info className="h-5 w-5 mr-2" /> À propos
          </Button>
          {!isMobile && !currentUserProfile && (
            <Button variant="outline" onClick={() => setIsAuthModalOpen(true)}>
              <LogIn className="h-5 w-5 mr-2" /> Authentification
            </Button>
          )}
          {currentUserProfile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium hidden md:block">
                    {currentUserProfile.first_name} {currentUserProfile.last_name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" /> Mon profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" /> Paramètres
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
      <main
        className={cn("flex-grow p-4 sm:p-6 md:p-8 pt-24 md:pt-32 overflow-y-auto", isMobile && "pb-20")}
      >
        <Outlet />
      </main>
      <footer className="p-4 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} AcademIA. Tous droits réservés.{" "}
        <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground" onClick={() => setIsAboutModalOpen(true)}>
          À propos
        </Button>
      </footer>
      <BottomNavigationBar
        allNavItemsForDrawer={fullNavTree}
        onOpenGlobalSearch={currentUserProfile ? () => setIsSearchOverlayOpen(true) : undefined}
        currentUser={currentUserProfile}
        onOpenAboutModal={() => setIsAboutModalOpen(true)}
        isMoreDrawerOpen={isMoreDrawerOpen}
        setIsMoreDrawerOpen={setIsMoreDrawerOpen}
        unreadMessagesCount={unreadMessages}
      />
      {currentUserProfile && <AiAPersistentChat />}
      {currentUserProfile && <FloatingAiAPersistentChat isVisible={floatingAiAChatButtonVisible} />}
      {currentUserProfile && <GlobalSearchOverlay isOpen={isSearchOverlayOpen} onClose={() => setIsSearchOverlayOpen(false)} />}
      {!currentUserProfile && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={handleAuthSuccess} />}
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
    </div>
  );
};

export default DashboardLayout;