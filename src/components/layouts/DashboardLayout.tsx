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
import GlobalSearchOverlay from "@/components/GlobalSearchOverlay"; // Changed import name back
import React, { useState, useEffect, useCallback, useRef } from "react";
import { getUnreadMessageCount } from "@/lib/messageData";
import { supabase } from "@/integrations/supabase/client";
import { NavItem } from "@/lib/dataModels";
// Removed AboutModal import
import MobileNavSheet from "@/components/MobileNavSheet";
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion'; // Import motion and AnimatePresence
import AiAPersistentChat from "@/components/AiAPersistentChat"; // Import AiAPersistentChat

interface DashboardLayoutProps {
  setIsAdminModalOpen: (isOpen: boolean) => void;
  onInitiateThemeChange: (newTheme: string) => void; // New prop
}

// Map icon_name strings to Lucide React components
const iconMap: { [key: string]: React.ElementType } = {
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck,
};

const DashboardLayout = ({ setIsAdminModalOpen, onInitiateThemeChange }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();
  const { currentUserProfile, isLoadingUser, currentRole, signOut, navItems } = useRole(); // Removed unreadNotificationsCount
  const { isChatOpen, openChat, closeChat } = useCourseChat(); // Updated useCourseChat
  const [isGlobalSearchOverlayOpen, setIsGlobalSearchOverlayOpen] = useState(false); // New state for GlobalSearchOverlay
  const [unreadMessages, setUnreadMessages] = useState(0);
  // Removed isAuthModalOpen state
  // Removed isAboutModalOpen state
  const [isMobileNavSheetOpen, setIsMobileNavSheetOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [desktopNavStack, setDesktopNavStack] = useState<NavItem[]>([]);
  const [isDesktopOverlayOpen, setIsDesktopOverlayOpen] = useState(false);

  const [isDesktopMenuVisible, setIsDesktopMenuVisible] = useState(true);

  // Helper function to inject onClick handlers for specific action items
  const injectActionHandlers = useCallback((items: NavItem[]): NavItem[] => {
    return items.map(item => {
      let newItem = { ...item };
      if (newItem.id === 'nav-global-search') {
        newItem.onClick = () => setIsGlobalSearchOverlayOpen(true); // Open GlobalSearchOverlay
      } else if (newItem.id === 'nav-aia-chat') {
        newItem.onClick = () => openChat(); // Open AiA persistent chat
      }
      // For 'nav-about', it's now a route, so no onClick needed here.
      if (newItem.children && newItem.children.length > 0) {
        newItem.children = injectActionHandlers(newItem.children);
      }
      return newItem;
    });
  }, [setIsGlobalSearchOverlayOpen, openChat]); // Add dependencies

  const fullNavTreeWithActions = React.useMemo((): NavItem[] => {
    // Pass unreadMessages to loadNavItems
    const updatedNavItems = navItems.map(item => {
      if (item.route === '/messages') {
        return { ...item, badge: unreadMessages };
      }
      // Removed badge for notifications
      return item;
    });
    return injectActionHandlers(updatedNavItems);
  }, [navItems, injectActionHandlers, unreadMessages]); // Removed unreadNotificationsCount from dependencies

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

  // Removed handleAuthSuccess

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isModifierPressed = event.ctrlKey || event.metaKey;

    if (isModifierPressed && event.shiftKey && event.key === 'S') {
      event.preventDefault();
      setIsAdminModalOpen(true);
    } else if (currentUserProfile && isModifierPressed && event.key === 'f') {
      event.preventDefault();
      setIsGlobalSearchOverlayOpen(true); // Open GlobalSearchOverlay
    }
  }, [currentUserProfile, setIsAdminModalOpen, setIsGlobalSearchOverlayOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    if (isMobile || !currentUserProfile) {
      setIsDesktopMenuVisible(true);
      return;
    }
    setIsDesktopMenuVisible(true);
  }, [isMobile, currentUserProfile]);

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

  const handleDesktopCategoryClick = (categoryItem: NavItem) => {
    setDesktopNavStack(prevStack => [...prevStack, categoryItem]);
    setIsDesktopOverlayOpen(true);
  };

  const handleDesktopBackToCategories = () => {
    setDesktopNavStack(prevStack => {
      const newStack = [...prevStack];
      newStack.pop();
      if (newStack.length === 0) {
        setIsDesktopOverlayOpen(false);
      }
      return newStack;
    });
  };

  const headerNavItems = fullNavTreeWithActions; // Use the tree with injected actions

  const outletContextValue = React.useMemo(() => ({ setIsAdminModalOpen, onInitiateThemeChange }), [setIsAdminModalOpen, onInitiateThemeChange]);

  // Removed globalSwipeHandlers from the main div.
  // The swipe-right-to-go-back gesture will now be handled by MobileNavSheet.

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

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <header
        onClick={handleHeaderClick} // Add onClick for double-tap detection
        className={cn(
          "fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between border-b backdrop-blur-lg bg-background/80 shadow-sm",
          !isMobile && currentUserProfile && "opacity-100 pointer-events-auto"
        )}
      >
        <div className="flex items-center gap-4">
          <Logo />
        </div>
        {!isMobile && currentUserProfile && headerNavItems.length > 0 && (
          <nav className="flex flex-grow justify-center items-center gap-2 sm:gap-4 flex-wrap">
            {headerNavItems.map(item => {
              const IconComponent = iconMap[item.icon_name || 'Info'] || Info;
              const isCategoryWithChildren = item.type === 'category_or_action' && item.children && item.children.length > 0;
              const isActionItem = item.type === 'category_or_action' && !item.children; // Action items have no children

              if (isCategoryWithChildren) {
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => handleDesktopCategoryClick(item)}
                    className="flex items-center p-2 rounded-md text-sm font-medium whitespace-nowrap hover:bg-accent hover:text-accent-foreground"
                  >
                    {React.createElement(IconComponent, { className: "mr-2 h-4 w-4" })}
                    {item.label}
                  </Button>
                );
              } else if (isActionItem) {
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={(e) => {
                      if (item.onClick) {
                        e.preventDefault(); // Prevent any default button behavior if onClick is present
                        item.onClick();
                      }
                    }}
                    className="flex items-center p-2 rounded-md text-sm font-medium whitespace-nowrap hover:bg-accent hover:text-accent-foreground"
                  >
                    {React.createElement(IconComponent, { className: "mr-2 h-4 w-4" })}
                    {item.label}
                    {item.route === '/messages' && item.badge !== undefined && item.badge > 0 && ( // Only for messages
                      <span className="ml-1 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
                        {item.badge}
                      </span>
                    )}
                  </Button>
                );
              } else { // This is for type 'route'
                const isLinkActive = item.route && (location.pathname + location.search).startsWith(item.route);
                return (
                  <NavLink
                    key={item.id}
                    to={item.route!}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center p-2 rounded-md text-sm font-medium whitespace-nowrap",
                        isActive || isLinkActive
                          ? "text-primary font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )
                    }
                    onClick={(e) => {
                      if (item.onClick) { // Still allow onClick for NavLink if present (e.g. search)
                        e.preventDefault();
                        item.onClick();
                      }
                    }}
                  >
                    {React.createElement(IconComponent, { className: "mr-2 h-4 w-4" })}
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
                <Button variant="outline" size="icon" onClick={() => setIsGlobalSearchOverlayOpen(true)}> {/* Updated call */}
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
                <Button variant="outline" size="icon" onClick={() => openChat()}> {/* New AiA button */}
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
            <Button variant="outline" onClick={() => navigate('/auth')}> {/* Redirect to AuthPage */}
              <LogIn className="h-5 w-5 mr-2" /> Connexion
            </Button>
          )}
          <ThemeToggle onInitiateThemeChange={onInitiateThemeChange} /> {/* Pass the handler here */}
          <Button variant="ghost" size="icon" onClick={() => navigate('/about')} className="hidden sm:flex"> {/* Navigate to /about */}
            <Info className="h-5 w-5" />
            <span className="sr-only">À propos</span>
          </Button>
        </div>
      </header>

      {/* Desktop Category Items Overlay (Full-width drawer) */}
      {!isMobile && isDesktopOverlayOpen && (
        <div className="fixed top-[68px] left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border shadow-lg py-4 px-4 md:px-8">
          <div className="max-w-7xl mx-auto flex flex-col gap-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {desktopNavStack.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={handleDesktopBackToCategories} className="mr-2">
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Retour</span>
                  </Button>
                )}
                {desktopNavStack.length > 0 ? (
                  <>
                    {React.createElement(iconMap[desktopNavStack[desktopNavStack.length - 1].icon_name || 'Info'], { className: "h-6 w-6 text-primary" })}
                    {desktopNavStack[desktopNavStack.length - 1].label}
                  </>
                ) : "Menu"}
              </h2>
              <Button variant="ghost" onClick={() => { setIsDesktopOverlayOpen(false); setDesktopNavStack([]); }}>
                <X className="h-5 w-5 mr-2" /> Fermer
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {desktopNavStack.length > 0 && desktopNavStack[desktopNavStack.length - 1].children?.map((item) => {
                const isLinkActive = item.route && (location.pathname + location.search).startsWith(item.route);
                const IconComponent = iconMap[item.icon_name || 'Info'] || Info;
                const isSubCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined) && item.children && item.children.length > 0;

                return (
                  <Button
                    key={item.id}
                    variant="outline"
                    onClick={() => {
                      if (isSubCategory) {
                        handleDesktopCategoryClick(item);
                      } else {
                        setIsDesktopOverlayOpen(false);
                        setDesktopNavStack([]);
                        if (item.route) {
                          navigate(item.route);
                        } else if (item.onClick) {
                          item.onClick();
                        }
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-android-tile border text-center h-24", // Apply rounded-android-tile
                      isLinkActive ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent hover:text-accent-foreground",
                      "transition-all duration-200 ease-in-out"
                    )}
                  >
                    <IconComponent className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium line-clamp-1">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
                        {item.badge}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main
        className={cn(
          "flex-grow p-4 sm:p-6 md:p-8 pt-20 md:pt-24 overflow-y-auto", // Adjusted padding-top
          !isMobile && isDesktopOverlayOpen && "pt-[calc(68px+1rem+100px)]"
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname} // Key change triggers animation
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full" // Ensure it takes full space
          >
            <Outlet context={outletContextValue} />
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="p-4 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} AcademIA. Tous droits réservés.{" "}
        <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground" onClick={() => navigate('/about')}> {/* Navigate to /about */}
          À propos
        </Button>
      </footer>
      
      {currentUserProfile && (
        <MobileNavSheet
          isOpen={isMobileNavSheetOpen}
          onClose={() => setIsMobileNavSheetOpen(false)}
          navItems={fullNavTreeWithActions} // Use the tree with injected actions
          onOpenGlobalSearch={() => setIsGlobalSearchOverlayOpen(true)} // Updated prop
          onOpenAiAChat={() => openChat()} // New prop
          // Removed onOpenAboutModal
          onOpenAuthModal={() => navigate('/auth')} // Redirect to AuthPage
          unreadMessagesCount={unreadMessages}
          onInitiateThemeChange={onInitiateThemeChange} // Pass the handler here
        />
      )}
      {currentUserProfile && <AiAPersistentChat />} {/* Render AiAPersistentChat */}
      {currentUserProfile && <GlobalSearchOverlay isOpen={isGlobalSearchOverlayOpen} onClose={() => setIsGlobalSearchOverlayOpen(false)} />} {/* Render GlobalSearchOverlay */}
      {/* Removed AuthModal */}
      {/* Removed AboutModal */}
    </div>
  );
};

export default DashboardLayout;