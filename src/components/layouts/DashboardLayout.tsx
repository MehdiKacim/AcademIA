import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, PlusSquare, BarChart2, User, LogOut, Settings, Info, GraduationCap, PenTool, Users, NotebookText, School, Search, ArrowLeft, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, MessageSquare, LogIn, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, X, Menu, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { ThemeToggle } from "../theme-toggle";
import { Button } from "@/components/ui/button";
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
import GlobalSearchOverlay from "@/components/GlobalSearchOverlay";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { getUnreadMessageCount } from "@/lib/messageData";
import { supabase } from "@/integrations/supabase/client";
import { NavItem, Profile } from "@/lib/dataModels";
import NavSheet from "@/components/NavSheet";
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import AiAPersistentChat from "@/components/AiAPersistentChat";
import DesktopSubMenuOverlay from "@/components/DesktopSubMenuOverlay"; // Import the new component

interface DashboardLayoutProps {
  setIsAdminModalOpen: (isOpen: boolean) => void;
  onInitiateThemeChange: (newTheme: string) => void;
}

// Map icon_name strings to Lucide React components
const iconMap: { [key: string]: React.ElementType } = {
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck,
};

const DashboardLayout = ({ setIsAdminModalOpen, onInitiateThemeChange }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();
  const { currentUserProfile, isLoadingUser, currentRole, signOut, navItems } = useRole();
  const { isChatOpen, openChat, closeChat } = useCourseChat();
  const [isGlobalSearchOverlayOpen, setIsGlobalSearchOverlayOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isMobileNavSheetOpen, setIsMobileNavSheetOpen] = useState(false);
  const [isDesktopSubMenuOpen, setIsDesktopSubMenuOpen] = useState(false); // New state for desktop sub-menu overlay
  const [desktopSubMenuParent, setDesktopSubMenuParent] = useState<NavItem | null>(null); // New state for parent item
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to inject onClick handlers for specific action items
  const injectActionHandlers = useCallback((items: NavItem[]): NavItem[] => {
    return items.map(item => {
      let newItem = { ...item };
      if (newItem.id === 'nav-global-search') {
        newItem.onClick = () => setIsGlobalSearchOverlayOpen(true);
      } else if (newItem.id === 'nav-aia-chat') {
        newItem.onClick = () => openChat();
      }
      if (newItem.children && newItem.children.length > 0) {
        newItem.children = injectActionHandlers(newItem.children);
      }
      return newItem;
    });
  }, [setIsGlobalSearchOverlayOpen, openChat]);

  const fullNavTreeWithActions = React.useMemo((): NavItem[] => {
    const updatedNavItems = navItems.map(item => {
      if (item.route === '/messages') {
        return { ...item, badge: unreadMessages };
      }
      return item;
    });
    return injectActionHandlers(updatedNavItems);
  }, [navItems, injectActionHandlers, unreadMessages]);

  useEffect(() => {
    if (currentUserProfile && navItems.length > 0) {
      // console.log("[DashboardLayout] Current User Profile:", currentUserProfile);
      // console.log("[DashboardLayout] Current Nav Items (from RoleContext):", navItems);
    } else if (currentUserProfile && navItems.length === 0) {
      // console.log("[DashboardLayout] Current User Profile:", currentUserProfile, "but navItems is empty.");
    }
  }, [currentUserProfile, navItems]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isModifierPressed = event.ctrlKey || event.metaKey;

    if (isModifierPressed && event.shiftKey && event.key === 'S') {
      event.preventDefault();
      setIsAdminModalOpen(true);
    } else if (currentUserProfile && isModifierPressed && event.key === 'f') {
      event.preventDefault();
      setIsGlobalSearchOverlayOpen(true);
    }
  }, [currentUserProfile, setIsAdminModalOpen, setIsGlobalSearchOverlayOpen]);

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
        const initialCount = await getUnreadMessageCount(currentUserProfile.id);
        setUnreadMessages(initialCount);

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

  const headerNavItems = fullNavTreeWithActions;

  const outletContextValue = React.useMemo(() => ({ setIsAdminModalOpen, onInitiateThemeChange }), [setIsAdminModalOpen, onInitiateThemeChange]);

  const headerDoubleTapRef = useRef({ lastTap: 0 });
  const handleHeaderClick = useCallback(() => {
    if (isMobile && currentUserProfile) {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300; // milliseconds
      if (now - headerDoubleTapRef.current.lastTap < DOUBLE_TAP_DELAY) {
        setIsMobileNavSheetOpen(true);
        headerDoubleTapRef.current.lastTap = 0; // Reset to prevent triple taps
      } else {
        headerDoubleTapRef.current.lastTap = now;
      }
    }
  }, [isMobile, currentUserProfile]);

  const handleDesktopNavItemClick = useCallback((item: NavItem) => {
    if (item.children && item.children.length > 0) {
      setDesktopSubMenuParent(item);
      setIsDesktopSubMenuOpen(true);
    } else if (item.route) {
      if (item.is_external) {
        window.open(item.route, '_blank');
      } else if (item.route.startsWith('#')) {
        navigate(`/${item.route}`);
      } else {
        navigate(item.route);
      }
      setIsDesktopSubMenuOpen(false); // Close sub-menu if open
    } else if (item.onClick) {
      item.onClick();
      setIsDesktopSubMenuOpen(false); // Close sub-menu if open
    }
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <header
        onClick={handleHeaderClick}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between border-b backdrop-blur-lg bg-background/80 shadow-sm",
          !isMobile && currentUserProfile && "opacity-100 pointer-events-auto"
        )}
      >
        <div className="flex items-center gap-4">
          <Logo />
        </div>
        {!isMobile && currentUserProfile && headerNavItems.length > 0 && (
          <nav className="flex-grow flex justify-center"> {/* This div will center the buttons */}
            {headerNavItems.filter(item => !item.parent_nav_item_id).map(item => { // Filter for top-level items
                const IconComponent = iconMap[item.icon_name || 'Info'] || Info;
                const isLinkActive = item.route && (location.pathname + location.search).startsWith(item.route);

                const commonButtonClasses = cn(
                  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                  isLinkActive ? "text-primary font-semibold" : "text-muted-foreground"
                );

                if (item.children && item.children.length > 0) {
                    return (
                        <Button
                            key={item.id}
                            variant="ghost"
                            onClick={() => handleDesktopNavItemClick(item)}
                            className={commonButtonClasses}
                        >
                            <IconComponent className="mr-2 h-4 w-4" />
                            {item.label}
                        </Button>
                    );
                } else if (item.onClick) {
                    return (
                        <Button
                            key={item.id}
                            variant="ghost"
                            onClick={(e) => {
                                e.preventDefault(); // Prevent default form submission if button is inside a form
                                handleDesktopNavItemClick(item);
                            }}
                            className={commonButtonClasses}
                        >
                            <IconComponent className="mr-2 h-4 w-4" />
                            {item.label}
                            {item.route === '/messages' && item.badge !== undefined && item.badge > 0 && (
                                <span className="ml-1 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
                                    {item.badge}
                                </span>
                            )}
                        </Button>
                    );
                } else { // item.type === 'route'
                    return (
                        <NavLink
                            key={item.id}
                            to={item.route!}
                            className={commonButtonClasses}
                            target={item.is_external ? "_blank" : undefined}
                            onClick={() => setIsDesktopSubMenuOpen(false)} // Close sub-menu if open
                        >
                            <IconComponent className="mr-2 h-4 w-4" />
                            {item.label}
                            {item.route === '/messages' && item.badge !== undefined && item.badge > 0 && (
                                <span className="ml-1 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
                                    {item.badge}
                                </span>
                            )}
                        </NavLink>
                    );
                }
            })}
          </nav>
        )}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          {currentUserProfile && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setIsGlobalSearchOverlayOpen(true)}>
                  <Search className="h-5 w-5" />
                  <span className="sr-only">Recherche globale</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="backdrop-blur-lg bg-background/80 z-50">
                <p>Recherche (Ctrl + F)</p>
              </TooltipContent>
            </Tooltip>
          )}

          {currentUserProfile && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => openChat()}>
                  <BotMessageSquare className="h-5 w-5" />
                  <span className="sr-only">AiA Chat</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="backdrop-blur-lg bg-background/80 z-50">
                <p>AiA Chat</p>
              </TooltipContent>
            </Tooltip>
          )}

          {currentUserProfile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Menu utilisateur</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="backdrop-blur-lg bg-background/80">
                <DropdownMenuLabel>{currentUserProfile.first_name} {currentUserProfile.last_name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" /> Mon Profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" /> Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {!currentUserProfile && (
            <Button variant="outline" onClick={() => navigate('/auth')}>
              <LogIn className="h-5 w-5 mr-2" /> Connexion
            </Button>
          )}
          <ThemeToggle onInitiateThemeChange={onInitiateThemeChange} />
          <Button variant="ghost" size="icon" onClick={() => navigate('/about')} className="hidden sm:flex">
            <Info className="h-5 w-5" />
            <span className="sr-only">À propos</span>
          </Button>
        </div>
      </header>

      <main
        className={cn(
          "flex-grow p-4 sm:p-6 md:p-8 pt-20 md:pt-24 overflow-y-auto",
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
          >
            <Outlet context={outletContextValue} />
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="p-4 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} AcademIA. Tous droits réservés.{" "}
        <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground" onClick={() => navigate('/about')}>
          À propos
        </Button>
      </footer>
      
      {currentUserProfile && (
        <NavSheet
          isOpen={isMobileNavSheetOpen}
          onClose={() => setIsMobileNavSheetOpen(false)}
          navItems={fullNavTreeWithActions}
          onOpenGlobalSearch={() => setIsGlobalSearchOverlayOpen(true)}
          onOpenAiAChat={() => openChat()}
          onOpenAuthModal={() => navigate('/auth')}
          unreadMessagesCount={unreadMessages}
          onInitiateThemeChange={onInitiateThemeChange}
          isMobile={isMobile} // Pass isMobile prop
          isDesktopImmersiveOpen={isDesktopSubMenuOpen} // Use new state
          onCloseDesktopImmersive={() => setIsDesktopSubMenuOpen(false)} // Use new state
          desktopImmersiveParent={desktopSubMenuParent} // Use new state
        />
      )}
      {currentUserProfile && <AiAPersistentChat />}
      {currentUserProfile && <GlobalSearchOverlay isOpen={isGlobalSearchOverlayOpen} onClose={() => setIsGlobalSearchOverlayOpen(false)} />}
      {currentUserProfile && (
        <DesktopSubMenuOverlay
          isOpen={isDesktopSubMenuOpen}
          onClose={() => setIsDesktopSubMenuOpen(false)}
          parentItem={desktopSubMenuParent}
          iconMap={iconMap}
          unreadMessagesCount={unreadMessages}
        />
      )}
    </div>
  );
};

export default DashboardLayout;