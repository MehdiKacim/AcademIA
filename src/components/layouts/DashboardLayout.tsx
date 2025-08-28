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
import DesktopImmersiveSubmenu from "@/components/DesktopImmersiveSubmenu";
import MobileBottomNavContent from "@/components/MobileBottomNavContent"; // Import the new component

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
    const isModifierPressed = event.ctrlKey || event.shiftKey;

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
            async (payload) => { // Marked as async
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
            async (payload) => { // Marked as async
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

  // Handler for navigation items (both top-level direct links and submenu items)
  const handleNavItemClick = useCallback((item: NavItem) => {
    const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);

    if (isCategory && item.children && item.children.length > 0) {
      setActiveDesktopSubmenuParent(item); // Open immersive submenu
    } else if (item.route) {
      if (item.is_external) {
        window.open(item.route, '_blank');
      } else if (item.route.startsWith('#')) {
        navigate(`/${item.route}`);
      } else {
        navigate(item.route);
      }
      setActiveDesktopSubmenuParent(null); // Close submenu on direct navigation
    } else if (item.onClick) {
      item.onClick();
      setActiveDesktopSubmenuParent(null); // Close submenu on action
    }
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <header
        ref={headerRef} // Attach ref to header
        className={cn(
          "fixed left-0 right-0 z-50 px-4 py-3 flex items-center justify-between shadow-sm backdrop-blur-lg bg-background/80 h-[68px]", // Added h-[68px]
          isMobile ? "hidden" : (currentUserProfile && "opacity-100 pointer-events-auto") // Hide on mobile, show on desktop if logged in
        )}
      >
        {/* Header content based on authentication and mobile status */}
        {currentUserProfile ? (
          // Logged in user header (Desktop only)
          !isMobile && (
            <div className="flex items-center justify-between w-full gap-4">
              <Logo iconClassName="h-8 w-8" showText={false} /> {/* Logo on the left */}

              {/* Main Navigation Items in the center */}
              <nav className="flex items-center gap-2">
                {fullNavTreeWithActions.map(item => (
                  <React.Fragment key={item.id}>
                    {item.type === 'category_or_action' && item.children && item.children.length > 0 ? (
                      // This is a category that should open the immersive submenu
                      <Button
                        variant="ghost"
                        onClick={() => handleNavItemClick(item)}
                        className={cn(
                          "flex items-center gap-1",
                          activeDesktopSubmenuParent?.id === item.id ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {React.createElement(iconMap[item.icon_name || 'Info'] || Info, { className: "h-5 w-5" })}
                        {item.label}
                        <ChevronDown className="ml-1 h-4 w-4" />
                      </Button>
                    ) : (
                      // This is a direct route or an action without children
                      <Button
                        key={item.id}
                        variant="ghost"
                        onClick={() => handleNavItemClick(item)}
                        className={cn(
                          "flex items-center gap-1",
                          (item.route && (location.pathname + location.search).startsWith(item.route)) ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {React.createElement(iconMap[item.icon_name || 'Info'] || Info, { className: "h-5 w-5" })}
                        {item.label}
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="ml-auto bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs leading-none">
                            {item.badge}
                          </span>
                        )}
                        {item.is_external && <ExternalLink className="ml-auto h-4 w-4" />}
                      </Button>
                    )}
                  </React.Fragment>
                ))}
              </nav>

              {/* Utility Items on the right */}
              <div className="flex items-center gap-2">
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

                <ThemeToggle onInitiateThemeChange={onInitiateThemeChange} />
              </div>
            </div>
          )
        ) : (
          // Not logged in user header (same as before for Index page)
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Logo />
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle onInitiateThemeChange={onInitiateThemeChange} />
              <Button variant="outline" onClick={() => navigate('/auth')}>
                <LogIn className="h-5 w-5 mr-2" /> Connexion
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Dynamic Submenu Bar for Desktop */}
      {!isMobile && currentUserProfile && (
        <DesktopImmersiveSubmenu
          ref={submenuRef} // Attach ref here
          parentItem={activeDesktopSubmenuParent}
          onClose={() => setActiveDesktopSubmenuParent(null)}
          onItemClick={handleNavItemClick}
        />
      )}

      <main
        className={cn(
          "flex-grow px-4 sm:px-6 md:px-8 overflow-y-auto",
          isMobile
            ? "pt-[calc(68px+env(safe-area-inset-top))] pb-[calc(68px+env(safe-area-inset-bottom))]" // Mobile: 68px from top, bottom padding for persistent footer
            : (
                currentUserProfile && activeDesktopSubmenuParent
                  ? "pt-[calc(68px+224px+env(safe-area-inset-top))] pb-4" // Desktop with submenu (68px header + 224px submenu), standard bottom padding
                  : "pt-[calc(68px+env(safe-area-inset-top))] pb-4" // Desktop without submenu, standard bottom padding
              )
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
      
      {currentUserProfile && isMobile && ( // Only render NavSheet if mobile
        <>
          <NavSheet
            isOpen={isMobileNavSheetOpen}
            onOpenChange={setIsMobileNavSheetOpen}
            navItems={fullNavTreeWithActions}
            onOpenGlobalSearch={() => setIsGlobalSearchOverlayOpen(true)}
            onOpenAiAChat={() => openChat()}
            onOpenAuthModal={() => navigate('/auth')}
            unreadMessagesCount={unreadMessages}
            onInitiateThemeChange={onInitiateThemeChange}
            isMobile={isMobile}
          />
          {/* Persistent mobile bottom navigation bar */}
          <div className="fixed bottom-0 left-0 right-0 z-[996] px-4 py-3 flex items-center justify-between shadow-sm backdrop-blur-lg bg-background/80 h-[68px]">
            <MobileBottomNavContent
              onOpenGlobalSearch={() => setIsGlobalSearchOverlayOpen(true)}
              onOpenAiAChat={() => openChat()}
              onOpenMobileNavSheet={() => setIsMobileNavSheetOpen(true)}
              onInitiateThemeChange={onInitiateThemeChange}
              isAuthenticated={true}
              unreadMessagesCount={unreadMessages} // Pass unread messages count
              isMobileNavSheetOpen={isMobileNavSheetOpen} // Pass the state here
            />
          </div>
        </>
      )}
      {currentUserProfile && <AiAPersistentChat />}
      {currentUserProfile && <GlobalSearchOverlay isOpen={isGlobalSearchOverlayOpen} onClose={() => setIsGlobalSearchOverlayOpen(false)} />}
    </div>
  );
};

export default DashboardLayout;