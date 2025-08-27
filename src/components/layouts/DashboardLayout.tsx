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
import { NavItem, Profile } from "@/lib/dataModels";
// Removed AboutModal import
import MobileNavSheet from "@/components/MobileNavSheet";
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion'; // Import motion and AnimatePresence
import AiAPersistentChat from "@/components/AiAPersistentChat"; // Import AiAPersistentChat
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";

interface DashboardLayoutProps {
  setIsAdminModalOpen: (isOpen: boolean) => void;
  onInitiateThemeChange: (newTheme: string) => void; // New prop
}

// Map icon_name strings to Lucide React components
const iconMap: { [key: string]: React.ElementType } = {
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck,
};

// ListItem component for NavigationMenuContent
const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { icon?: React.ElementType; onClick?: () => void; target?: string }
>(({ className, title, children, icon: Icon, onClick, target, ...props }, ref) => {
  const content = (
    <div className="text-sm font-medium leading-none flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4 text-primary" />}
      {title}
    </div>
  );

  const description = children && (
    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
      {children}
    </p>
  );

  const commonClasses = cn(
    "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
    className
  );

  if (onClick) {
    return (
      <li>
        <Button
          variant="ghost"
          className={cn(commonClasses, "h-auto w-full justify-start text-left")}
          onClick={onClick}
          ref={ref as any} // Cast ref for Button
          {...props}
        >
          {content}
          {description}
        </Button>
      </li>
    );
  }

  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={commonClasses}
          target={target} // Pass target prop
          {...props}
        >
          {content}
          {description}
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";


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

  // Removed desktopNavStack, isDesktopOverlayOpen, isDesktopMenuVisible states and their related logic

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
          <NavigationMenu className="flex-grow"> {/* Keep flex-grow */}
            <NavigationMenuList className="justify-center"> {/* Add justify-center here */}
                {headerNavItems.map(item => {
                    const IconComponent = iconMap[item.icon_name || 'Info'] || Info;
                    const isCategoryWithChildren = item.type === 'category_or_action' && item.children && item.children.length > 0;
                    const isActionItem = item.type === 'category_or_action' && !item.children;

                    if (isCategoryWithChildren) {
                        return (
                            <NavigationMenuItem key={item.id}>
                                <NavigationMenuTrigger className="flex items-center gap-2">
                                    <IconComponent className="h-4 w-4" />
                                    {item.label}
                                </NavigationMenuTrigger>
                                <NavigationMenuContent className="p-4 bg-background/80 backdrop-blur-lg rounded-lg shadow-lg">
                                    <ul className="grid w-[400px] gap-3 p-2 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                                        {item.children?.map(child => {
                                            const ChildIconComponent = iconMap[child.icon_name || 'Info'] || Info;
                                            return (
                                                <ListItem
                                                    key={child.id}
                                                    title={child.label}
                                                    href={child.route || '#'}
                                                    onClick={child.onClick}
                                                    icon={ChildIconComponent}
                                                    target={child.is_external ? "_blank" : undefined}
                                                >
                                                    {child.description}
                                                </ListItem>
                                            );
                                        })}
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>
                        );
                    } else if (isActionItem) {
                        return (
                            <NavigationMenuItem key={item.id}>
                                <Button
                                    variant="ghost"
                                    onClick={(e) => {
                                        if (item.onClick) {
                                            e.preventDefault();
                                            item.onClick();
                                        }
                                    }}
                                    className="flex items-center p-2 rounded-md text-sm font-medium whitespace-nowrap hover:bg-accent hover:text-accent-foreground"
                                >
                                    <IconComponent className="mr-2 h-4 w-4" />
                                    {item.label}
                                    {item.route === '/messages' && item.badge !== undefined && item.badge > 0 && (
                                        <span className="ml-1 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
                                            {item.badge}
                                        </span>
                                    )}
                                </Button>
                            </NavigationMenuItem>
                        );
                    } else { // item.type === 'route'
                        const isLinkActive = item.route && (location.pathname + location.search).startsWith(item.route);
                        return (
                            <NavigationMenuItem key={item.id}>
                                <NavigationMenuLink asChild>
                                    <NavLink
                                        to={item.route!}
                                        className={cn(
                                            "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                                            isLinkActive ? "text-primary font-semibold" : "text-muted-foreground"
                                        )}
                                        target={item.is_external ? "_blank" : undefined}
                                    >
                                        <IconComponent className="mr-2 h-4 w-4" />
                                        {item.label}
                                        {item.route === '/messages' && item.badge !== undefined && item.badge > 0 && (
                                            <span className="ml-1 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
                                                {item.badge}
                                            </span>
                                        )}
                                    </NavLink>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        );
                    }
                })}
            </NavigationMenuList>
            <NavigationMenuViewport className="absolute top-full flex justify-center w-full h-[var(--radix-navigation-menu-viewport-height)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%] md:w-[var(--radix-navigation-menu-viewport-width)] lg:w-[var(--radix-navigation-menu-viewport-width)] bg-background/80 backdrop-blur-lg rounded-b-lg shadow-lg z-40" />
        </NavigationMenu>
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

      {/* Removed Desktop Category Items Overlay */}

      <main
        className={cn(
          "flex-grow p-4 sm:p-6 md:p-8 pt-20 md:pt-24 overflow-y-auto", // Adjusted padding-top
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