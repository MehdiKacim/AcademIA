import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, PlusSquare, BarChart2, User, LogOut, Settings, Info, GraduationCap, PenTool, Users, NotebookText, School, Search, ArrowLeft, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, MessageSquare, LogIn, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, X, Menu, ChevronDown, ExternalLink } from "lucide-react";
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
  DropdownMenuSub, // Import for nested menus
  DropdownMenuSubTrigger, // Import for nested menus
  DropdownMenuSubContent, // Import for nested menus
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
import DesktopImmersiveSubmenu from "@/components/DesktopImmersiveSubmenu"; // Import the new component

interface DashboardLayoutProps {
  setIsAdminModalOpen: (isOpen: boolean) => void;
  onInitiateThemeChange: (newTheme: string) => void;
}

// Map icon_name strings to Lucide React components
const iconMap: { [key: string]: React.ElementType } = {
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, ExternalLink,
};

const DashboardLayout = ({ setIsAdminModalOpen, onInitiateThemeChange }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();
  const { currentUserProfile, isLoadingUser, currentRole, signOut, navItems } = useRole();
  const { isChatOpen, openChat, closeChat } = useCourseChat();
  const [isGlobalSearchOverlayOpen, setIsGlobalSearchOverlayOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isMobileNavSheetOpen, setIsMobileNavSheetOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // State for desktop submenu
  const [activeDesktopSubmenuParent, setActiveDesktopSubmenuParent] = useState<NavItem | null>(null);

  // Refs for click outside logic
  const headerRef = useRef<HTMLElement>(null);
  const submenuRef = useRef<HTMLElement>(null); // This ref is now for the DesktopImmersiveSubmenu

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

  // Handle clicks outside the header/submenu to close the submenu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeDesktopSubmenuParent &&
        headerRef.current && !headerRef.current.contains(event.target as Node) &&
        submenuRef.current && !submenuRef.current.contains(event.target as Node)
      ) {
        setActiveDesktopSubmenuParent(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDesktopSubmenuParent]);

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

  // Handler for navigation items (both top-level direct links and submenu items)
  const handleNavItemClick = useCallback((item: NavItem) => {
    if (item.route) {
      if (item.is_external) {
        window.open(item.route, '_blank');
      } else if (item.route.startsWith('#')) {
        navigate(`/${item.route}`);
      } else {
        navigate(item.route);
      }
    } else if (item.onClick) {
      item.onClick();
    }
    // When an item in the submenu is clicked, close the submenu
    setActiveDesktopSubmenuParent(null); 
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <header
        ref={headerRef} // Attach ref to header
        onClick={handleHeaderClick}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between shadow-sm backdrop-blur-lg bg-background/80", // Removed border-b
          !isMobile && currentUserProfile && "opacity-100 pointer-events-auto"
        )}
      >
        <div className="flex items-center gap-4">
          <Logo />
          {/* Top-level Navigation Items for Desktop */}
          {!isMobile && currentUserProfile && (
            <nav className="hidden md:flex items-center gap-4">
              {fullNavTreeWithActions.filter(item => !item.parent_nav_item_id).map(item => {
                const IconComponent = item.icon_name ? (iconMap[item.icon_name] || Info) : Info;
                const isLinkActive = item.route && (location.pathname + location.search).startsWith(item.route);
                const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);

                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => {
                      if (isCategory) {
                        // Toggle the active submenu parent
                        setActiveDesktopSubmenuParent(activeDesktopSubmenuParent?.id === item.id ? null : item);
                      } else {
                        handleNavItemClick(item); // Use the unified handler for direct links/actions
                      }
                    }}
                    className={cn(
                      "group inline-flex h-9 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                      isLinkActive || (activeDesktopSubmenuParent?.id === item.id) ? "text-primary font-semibold" : "text-muted-foreground"
                    )}
                  >
                    <IconComponent className="mr-2 h-4 w-4" />
                    {item.label}
                    {isCategory && <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                    {item.route === '/messages' && item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-1 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
                        {item.badge}
                      </span>
                    )}
                  </Button>
                );
              })}
            </nav>
          )}
        </div>
        {/* Utility buttons for desktop (Search, AiA Chat, User Dropdown, Theme Toggle, About) */}
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

      {/* Dynamic Submenu Bar for Desktop */}
      {!isMobile && currentUserProfile && (
        <DesktopImmersiveSubmenu
          ref={submenuRef} // Attach ref to submenu
          parentItem={activeDesktopSubmenuParent}
          onClose={() => setActiveDesktopSubmenuParent(null)}
          onItemClick={handleNavItemClick}
        />
      )}

      <main
        className={cn(
          "flex-grow p-4 sm:p-6 md:p-8 overflow-y-auto",
          // Adjust padding-top based on whether the submenu is present
          !isMobile && currentUserProfile && activeDesktopSubmenuParent ? "pt-[292px]" : "pt-20 md:pt-24" // 68px (header) + 224px (submenu) = 292px
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
          isMobile={isMobile}
          isDesktopImmersiveOpen={false} // No longer used for desktop immersive
          onCloseDesktopImmersive={() => {}} // No longer used
          desktopImmersiveParent={null} // No longer used
        />
      )}
      {currentUserProfile && <AiAPersistentChat />}
      {currentUserProfile && <GlobalSearchOverlay isOpen={isGlobalSearchOverlayOpen} onClose={() => setIsGlobalSearchOverlayOpen(false)} />}
    </div>
  );
};

export default DashboardLayout;