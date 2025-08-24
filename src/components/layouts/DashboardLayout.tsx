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
import SwipeUpIndicator from "@/components/SwipeUpIndicator"; // Import the new component

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
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false); // New state for "More" drawer
  const navigate = useNavigate();
  const location = useLocation();

  const [currentNavLevel, setCurrentNavLevel] = useState<string | null>(null); // State to manage drill-down navigation
  const [isFloatingButtonVisible, setIsFloatingButtonVisible] = useState(true);
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoTapCountRef = useRef(0);

  const startAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
    }
    autoHideTimerRef.current = setTimeout(() => {
      setIsFloatingButtonVisible(false);
    }, 5000);
  }, []);

  const resetAndShowButton = useCallback(() => {
    setIsFloatingButtonVisible(true);
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
    const baseItems: NavItem[] = [
      { to: "/dashboard", icon: Home, label: "Accueil", type: 'link' },
      { to: "/messages", icon: MessageSquare, label: "Messages", type: 'link', badge: unreadMessages },
    ];

    const roleSpecificItems: NavItem[] = [];

    if (currentRole === 'student') {
      roleSpecificItems.push(
        {
          icon: GraduationCap,
          label: "Apprentissage",
          type: 'trigger',
          items: [
            { to: "/courses", label: "Mes Cours", icon: BookOpen, type: 'link' },
            { to: "/all-notes", label: "Mes Notes", icon: NotebookText, type: 'link' },
          ],
        },
        {
          icon: BarChart2,
          label: "Progression",
          type: 'trigger',
          items: [
            { to: "/analytics?view=personal", label: "Mes Statistiques", icon: UserRoundCog, type: 'link' },
            { to: "/analytics?view=quiz-performance", label: "Performance Quiz", icon: ClipboardCheck, type: 'link' },
            { to: "/analytics?view=aia-engagement", label: "Engagement AiA", icon: BotMessageSquare, type: 'link' },
          ],
        },
      );
    } else if (currentRole === 'professeur') {
      roleSpecificItems.push(
        {
          icon: BookOpen,
          label: "Contenu",
          type: 'trigger',
          items: [
            { to: "/courses", label: "Mes Cours", icon: BookOpen, type: 'link' },
            { to: "/create-course", label: "Créer un cours", icon: PlusSquare, type: 'link' },
          ],
        },
        {
          icon: Users,
          label: "Gestion",
          type: 'trigger',
          items: [
            { to: "/classes", label: "Mes Classes", icon: Users, type: 'link' },
            { to: "/students", label: "Mes Élèves", icon: GraduationCap, type: 'link' },
            { to: "/curricula", label: "Gestion Cursus", icon: LayoutList, type: 'link' },
            { to: "/subjects", label: "Gestion Matières", icon: BookText, type: 'link' },
            { to: "/pedagogical-management", label: "Gestion Pédagogique", icon: BookMarked, type: 'link' },
          ],
        },
        {
          icon: BarChart2,
          label: "Analytiques",
          type: 'trigger',
          items: [
            { to: "/analytics?view=overview", label: "Vue d'ensemble", icon: LayoutDashboard, type: 'link' },
            { to: "/analytics?view=course-performance", label: "Performance des Cours", icon: LineChart, type: 'link' },
            { to: "/analytics?view=student-engagement", label: "Engagement Élèves", icon: UsersRound, type: 'link' },
          ],
        },
      );
    } else if (currentRole === 'tutor') {
      roleSpecificItems.push(
        {
          icon: UsersRound,
          label: "Suivi",
          type: 'trigger',
          items: [
            { to: "/classes", label: "Mes Classes", icon: Users, type: 'link' },
            { to: "/students", label: "Mes Élèves", icon: GraduationCap, type: 'link' },
            { to: "/pedagogical-management", label: "Gestion Pédagogique", icon: BookMarked, type: 'link' },
          ],
        },
        {
          icon: BarChart2,
          label: "Analytiques",
          type: 'trigger',
          items: [
            { to: "/analytics?view=student-monitoring", label: "Suivi des Élèves", icon: UserRoundSearch, type: 'link' },
            { to: "/analytics?view=alerts", label: "Alertes & Recommandations", icon: BellRing, type: 'link' },
            { to: "/analytics?view=class-performance", label: "Performance par Classe", icon: BarChart2, type: 'link' },
          ],
        },
      );
    } else if (currentRole === 'administrator') {
      roleSpecificItems.push(
        {
          icon: BriefcaseBusiness,
          label: "Administration",
          type: 'trigger',
          items: [
            { to: "/establishments", label: "Gestion Établissements", icon: Building2, type: 'link' },
            { to: "/admin-users", label: "Gestion Utilisateurs", icon: UserRoundCog, type: 'link' },
            { to: "/curricula", label: "Gestion Cursus", icon: LayoutList, type: 'link' },
            { to: "/subjects", label: "Gestion Matières", icon: BookText, type: 'link' },
            { to: "/classes", label: "Gestion Classes", icon: Users, type: 'link' },
            { to: "/pedagogical-management", label: "Gestion Pédagogique", icon: BookMarked, type: 'link' },
            { to: "/school-years", label: "Gestion Années Scolaires", icon: CalendarDays, type: 'link' },
            { to: "/professor-assignments", label: "Affectations Professeurs", icon: UserCheck, type: 'link' },
            { to: "/analytics?view=establishment-admin", label: "Analytiques Établissement", icon: LayoutDashboard, type: 'link' },
          ],
        },
      );
    } else if (currentRole === 'director' || currentRole === 'deputy_director') {
      roleSpecificItems.push(
        {
          icon: BookText,
          label: "Gestion Pédagogique",
          type: 'trigger',
          items: [
            { to: "/curricula", label: "Gestion Cursus", icon: LayoutList, type: 'link' },
            { to: "/subjects", label: "Gestion Matières", icon: BookText, type: 'link' },
            { to: "/classes", label: "Gestion Classes", icon: Users, type: 'link' },
            { to: "/pedagogical-management", label: "Gestion des Élèves par Classe", icon: BookMarked, type: 'link' },
            { to: "/school-years", label: "Gestion Années Scolaires", icon: CalendarDays, type: 'link' },
            { to: "/professor-assignments", label: "Affectations Professeurs", icon: UserCheck, type: 'link' },
          ],
        },
        {
          icon: UserCog,
          label: "Gestion Administrative",
          type: 'trigger',
          items: [
            { to: "/establishments", label: "Mon Établissement", icon: Building2, type: 'link' },
            { to: "/admin-users", label: "Gestion Professeurs", icon: UserRoundCog, type: 'link' },
            { to: "/students", label: "Gestion Élèves", icon: GraduationCap, type: 'link' },
          ],
        },
        {
          icon: TrendingUp,
          label: "Analytiques",
          type: 'trigger',
          items: [
            { to: "/analytics?view=establishment-admin", label: "Analytiques Établissement", icon: LayoutDashboard, type: 'link' },
          ],
        },
      );
    }

    return [...baseItems, ...roleSpecificItems];
  }, [currentRole, unreadMessages]);

  const getIsParentTriggerActive = (item: NavItem): boolean => {
    if (item.type !== 'trigger' || !item.items) return false;

    const currentFullPath = location.pathname + location.search;

    return item.items.some(subItem => {
      if (subItem.to) {
        return currentFullPath.startsWith(subItem.to);
      }
      return false;
    });
  };

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

  const isFloatingButtonActuallyVisible = isFloatingButtonVisible && !isChatOpen;

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <header className="fixed top-0 left-0 right-0 z-50 px-2 py-4 flex items-center justify-between border-b backdrop-blur-lg bg-background/80">
        <Logo onLogoClick={handleLogoClick} />
        {!isMobile && (
          <nav className="flex flex-grow justify-center items-center gap-2 sm:gap-4 flex-wrap">
            {fullNavTree.map((item) => {
              const isLinkActive = item.to && (location.pathname + location.search).startsWith(item.to);
              const isTriggerActive = item.type === 'trigger' && getIsParentTriggerActive(item);

              if (item.type === 'link' && item.to) {
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
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
              } else if (item.type === 'trigger' && item.items) {
                return (
                  <DropdownMenu key={item.label}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "flex items-center p-2 rounded-md text-sm font-medium whitespace-nowrap",
                          isTriggerActive
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="z-[1000]">
                      <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {item.items.map(subItem => (
                        <DropdownMenuItem key={subItem.to} onClick={() => navigate(subItem.to)}>
                          <subItem.icon className="mr-2 h-4 w-4" />
                          {subItem.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              return null;
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
      />
      {currentUserProfile && <AiAPersistentChat />}
      {currentUserProfile && <FloatingAiAPersistentChat isVisible={isFloatingButtonActuallyVisible} />}
      {currentUserProfile && <GlobalSearchOverlay isOpen={isSearchOverlayOpen} onClose={() => setIsSearchOverlayOpen(false)} />}
      {!currentUserProfile && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={handleAuthSuccess} />}
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
      {isMobile && <SwipeUpIndicator isVisible={!isMoreDrawerOpen && !isChatOpen && !isSearchOverlayOpen && !isAuthModalOpen && !isAboutModalOpen} />}
    </div>
  );
};

export default DashboardLayout;