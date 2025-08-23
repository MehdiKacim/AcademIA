import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, PlusSquare, BarChart2, User, LogOut, Settings, GraduationCap, PenTool, Users, NotebookText, School, Search, ArrowLeft, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, MessageSquare, LogIn, Info, Building2 } from "lucide-react";
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
import FloatingAiAChatButton from "@/components/FloatingAiAChatButton";
import GlobalSearchOverlay from "@/components/GlobalSearchOverlay";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { getUnreadMessageCount } from "@/lib/messageData";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/lib/dataModels";
import { NavItem } from "@/lib/dataModels";
import AuthModal from "@/components/AuthModal";
import AboutModal from "@/components/AboutModal";

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
  const navigate = useNavigate();
  const location = useLocation();

  const [currentNavLevel, setCurrentNavLevel] = useState<string | null>(null);
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

  useEffect(() => {
    const mainItems = getMainNavItems();
    let foundParentLabel: string | null = null;

    for (const item of mainItems) {
      if (item.type === 'trigger' && item.items) {
        const currentFullPath = location.pathname + location.search;
        if (item.items.some(subItem => subItem.to && currentFullPath.startsWith(subItem.to))) {
          foundParentLabel = item.label.toLowerCase().replace(/\s/g, '-');
          break;
        }
      }
    }
    setCurrentNavLevel(foundParentLabel);
  }, [location.pathname, location.search, currentRole]);


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
    const fetchUnreadCount = async () => {
      if (currentUserProfile?.id) {
        const count = await getUnreadMessageCount(currentUserProfile.id);
        setUnreadMessages(count);

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
            (payload) => {
              setUnreadMessages(prev => prev + 1);
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
            (payload) => {
              const updatedMessage = payload.new as Message;
              if (updatedMessage.is_read && !updatedMessage.is_archived && (payload.old as Message)?.is_read === false) {
                setUnreadMessages(prev => Math.max(0, prev - 1));
              }
              if (updatedMessage.is_archived && (payload.old as Message)?.is_read === false && !updatedMessage.is_read) {
                 setUnreadMessages(prev => Math.max(0, prev - 1));
              }
            }
          )
          .subscribe();
      }
    };

    fetchUnreadCount();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [currentUserProfile?.id]);


  const getMainNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      { to: "/dashboard", icon: Home, label: "Accueil", type: 'link' },
      { to: "/messages", icon: MessageSquare, label: "Messages", type: 'link', badge: unreadMessages },
    ];

    if (currentRole === 'student') {
      return [
        ...baseItems,
        {
          icon: GraduationCap,
          label: "Apprentissage",
          type: 'trigger',
          onClick: () => setCurrentNavLevel('apprentissage'),
          items: [
            { to: "/courses", label: "Mes Cours", icon: BookOpen, type: 'link' },
            { to: "/all-notes", label: "Mes Notes", icon: NotebookText, type: 'link' },
          ],
        },
        {
          icon: BarChart2,
          label: "Progression",
          type: 'trigger',
          onClick: () => setCurrentNavLevel('progression'),
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
          label: "Contenu",
          type: 'trigger',
          onClick: () => setCurrentNavLevel('contenu'),
          items: [
            { to: "/courses", label: "Mes Cours", icon: BookOpen, type: 'link' },
            { to: "/create-course", label: "Créer un cours", icon: PlusSquare, type: 'link' },
          ],
        },
        {
          icon: Users,
          label: "Gestion",
          type: 'trigger',
          onClick: () => setCurrentNavLevel('gestion'),
          items: [
            { to: "/classes", label: "Mes Classes", icon: Users, type: 'link' },
            { to: "/students", label: "Mes Élèves", icon: GraduationCap, type: 'link' },
          ],
        },
        {
          icon: BarChart2,
          label: "Analytiques",
          type: 'trigger',
          onClick: () => setCurrentNavLevel('analytiques'),
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
          icon: UsersRound,
          label: "Suivi",
          type: 'trigger',
          onClick: () => setCurrentNavLevel('suivi'),
          items: [
            { to: "/classes", label: "Mes Classes", icon: Users, type: 'link' },
            { to: "/students", label: "Mes Élèves", icon: GraduationCap, type: 'link' },
          ],
        },
        {
          icon: BarChart2,
          label: "Analytiques",
          type: 'trigger',
          onClick: () => setCurrentNavLevel('analytiques'),
          items: [
            { to: "/analytics?view=student-monitoring", label: "Suivi des Élèves", icon: UserRoundSearch, type: 'link' },
            { to: "/analytics?view=alerts", label: "Alertes & Recommandations", icon: BellRing, type: 'link' },
            { to: "/analytics?view=class-performance", label: "Performance par Classe", icon: BarChart2, type: 'link' },
          ],
        },
      ];
    } else if (currentRole === 'administrator') {
      return [
        ...baseItems,
        {
          icon: BriefcaseBusiness,
          label: "Administration",
          type: 'trigger',
          onClick: () => setCurrentNavLevel('administration'),
          items: [
            { to: "/admin-users", label: "Gestion des Utilisateurs", icon: UserRoundCog, type: 'link' }, // New link
            { to: "/establishments", label: "Établissements", icon: Building2, type: 'link' },
            { to: "/curricula", label: "Cursus", icon: LayoutList, type: 'link' },
            { to: "/classes", label: "Classes", icon: Users, type: 'link' },
            { to: "/students", label: "Gestion Élèves", icon: GraduationCap, type: 'link' },
            { to: "/analytics?view=overview", label: "Analytiques Globales", icon: LayoutDashboard, type: 'link' },
          ],
        },
      ];
    } else if (currentRole === 'gestion_admin') { // New role: gestion_admin
      return [
        ...baseItems,
        {
          icon: BriefcaseBusiness,
          label: "Gestion",
          type: 'trigger',
          onClick: () => setCurrentNavLevel('gestion'),
          items: [
            { to: "/establishments", label: "Établissements", icon: Building2, type: 'link' },
            { to: "/admin-users", label: "Gestion des Utilisateurs", icon: UserRoundCog, type: 'link' }, // Added for gestion_admin
          ],
        },
      ];
    }
    return baseItems;
  };

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

  const navItemsToDisplayForDesktop = () => {
    const mainItems = getMainNavItems();
    const activeParent = mainItems.find(item => item.type === 'trigger' && item.label.toLowerCase().replace(/\s/g, '-') === currentNavLevel);

    if (activeParent && activeParent.items) {
      return [
        { icon: ArrowLeft, label: "Retour", type: 'trigger', onClick: () => setCurrentNavLevel(null) },
        ...activeParent.items,
      ];
    }
    return mainItems;
  };

  const handleScroll = useCallback(() => {
    resetAndShowButton();
  }, [resetAndShowButton]);

  const handleClick = useCallback(() => {
    resetAndShowButton();
  }, [resetAndShowButton]);

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
            {navItemsToDisplayForDesktop().map((item) => {
              const isLinkActive = item.to && (location.pathname + location.search).startsWith(item.to);
              const isTriggerActive = item.type === 'trigger' && (
                currentNavLevel === item.label.toLowerCase().replace(/\s/g, '-') ||
                getIsParentTriggerActive(item)
              );

              return item.type === 'link' && item.to ? (
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
              ) : item.type === 'trigger' && item.onClick ? (
                <Button
                  key={item.label}
                  variant="ghost"
                  onClick={item.onClick}
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
              ) : null
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
            <span className="text-sm font-medium text-muted-foreground hidden md:block">
              Bonjour, {currentUserProfile.first_name} !
            </span>
          )}
        </div>
      </header>
      <main
        className={cn("flex-grow p-4 sm:p-6 md:p-8 pt-24 md:pt-32 overflow-y-auto", isMobile && "pb-20")}
        onScroll={handleScroll}
        onClick={handleClick}
      >
        <Outlet />
      </main>
      <footer className="p-4 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} AcademIA. Tous droits réservés.{" "}
        <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground" onClick={() => setIsAboutModalOpen(true)}>
          À propos
        </Button>
      </footer>
      <BottomNavigationBar navItems={getMainNavItems()} onOpenGlobalSearch={currentUserProfile ? () => setIsSearchOverlayOpen(true) : undefined} currentUser={currentUserProfile} onOpenAboutModal={() => setIsAboutModalOpen(true)} />
      {currentUserProfile && <AiAPersistentChat />}
      {currentUserProfile && <FloatingAiAChatButton isVisible={isFloatingButtonActuallyVisible} />}
      {currentUserProfile && <GlobalSearchOverlay isOpen={isSearchOverlayOpen} onClose={() => setIsSearchOverlayOpen(false)} />}
      {!currentUserProfile && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={handleAuthSuccess} />}
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
    </div>
  );
};

export default DashboardLayout;