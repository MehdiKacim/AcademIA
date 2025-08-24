import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, PlusSquare, BarChart2, User, LogOut, Settings, GraduationCap, PenTool, Users, NotebookText, School, Search, ArrowLeft, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, MessageSquare, LogIn, Info, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, X } from "lucide-react";
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
import { NavItem } from "@/lib/dataModels";
import AuthModal from "@/components/AuthModal";
import AboutModal from "@/components/AboutModal";
import { loadNavItems } from "@/lib/navItems"; // Import loadNavItems

interface DashboardLayoutProps {
  setIsAdminModalOpen: (isOpen: boolean) => void;
}

// Define category metadata (icons, labels) - Moved here to be the source of truth
const categoriesConfig: { [key: string]: { label: string; icon: React.ElementType } } = {
  "Accueil": { label: "Accueil", icon: Home },
  "Apprentissage": { label: "Apprentissage", icon: BookOpen },
  "Progression": { label: "Progression", icon: TrendingUp },
  "Contenu": { label: "Contenu", icon: BookOpen },
  "Pédagogie": { label: "Pédagogie", icon: Users },
  "Analytiques": { label: "Analytiques", icon: BarChart2 },
  "Administration": { label: "Administration", icon: BriefcaseBusiness },
  "Autres": { label: "Autres", icon: Info }, // Fallback category
};

// Map icon_name strings to Lucide React components
const iconMap: { [key: string]: React.ElementType } = {
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck,
};

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

  // States for desktop category navigation
  const [desktopActiveCategory, setDesktopActiveCategory] = useState<string | null>(null);
  const [isDesktopCategoryOverlayOpen, setIsDesktopCategoryOverlayOpen] = useState(false);

  const [isAiAChatButtonVisible, setIsAiAChatButtonVisible] = useState(true);
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoTapCountRef = useRef(0);

  const [navItems, setNavItems] = useState<NavItem[]>([]); // State to store loaded nav items

  useEffect(() => {
    const fetchNavItems = async () => {
      const loadedItems = await loadNavItems(currentRole);
      setNavItems(loadedItems);
    };
    fetchNavItems();
  }, [currentRole]); // Reload nav items when user role changes

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

  // This function generates the full, structured navigation tree for desktop sidebar
  const fullNavTree = React.useMemo((): NavItem[] => {
    // Augment navItems with badge for messages
    return navItems.map(item => {
      if (item.label === "Messages") {
        return { ...item, badge: unreadMessages };
      }
      return item;
    });
  }, [navItems, unreadMessages]);

  // Group fullNavTree items by category for desktop display
  const groupedFullNavTree = React.useMemo(() => {
    const groups: { [key: string]: NavItem[] } = {};
    fullNavTree.forEach(item => {
      // For top-level items, use their label as category if they are root and have no children
      // Otherwise, if they have children, they are a category
      const categoryLabel = item.is_root && item.children && item.children.length > 0 ? item.label : (item.parent_id ? fullNavTree.find(p => p.id === item.parent_id)?.label : item.label);
      
      if (categoryLabel) {
        if (!groups[categoryLabel]) {
          groups[categoryLabel] = [];
        }
        // Add only direct children to categories, or the item itself if it's a root item without children
        if (item.children && item.children.length > 0) {
          groups[categoryLabel].push(...item.children);
        } else if (item.is_root && !item.parent_id) {
          groups[categoryLabel].push(item);
        }
      }
    });

    // Filter out empty categories and sort items within categories
    const filteredGroups: { [key: string]: NavItem[] } = {};
    for (const category in groups) {
      const items = groups[category].filter(item => item.allowed_roles.includes(currentRole));
      if (items.length > 0) {
        filteredGroups[category] = items.sort((a, b) => a.order_index - b.order_index);
      }
    }

    return filteredGroups;
  }, [fullNavTree, currentRole]);

  // Handlers for desktop category navigation
  const handleDesktopCategoryClick = (categoryLabel: string) => {
    setDesktopActiveCategory(categoryLabel);
    setIsDesktopCategoryOverlayOpen(true); // Open the overlay
  };

  const handleDesktopBackToCategories = () => {
    setDesktopActiveCategory(null);
    setIsDesktopCategoryOverlayOpen(false); // Close the overlay
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

  const floatingAiAChatButtonVisible = isAiAChatButtonVisible && !isChatOpen;

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <header className="fixed top-0 left-0 right-0 z-50 px-2 py-4 flex items-center justify-between border-b backdrop-blur-lg bg-background/80">
        <Logo onLogoClick={handleLogoClick} />
        {!isMobile && currentUserProfile && (
          <nav className="flex flex-grow justify-center items-center gap-2 sm:gap-4 flex-wrap">
            {/* Render category buttons in the header for desktop */}
            {Object.keys(groupedFullNavTree).sort().map(category => {
              const categoryItems = groupedFullNavTree[category];
              if (categoryItems.length === 0) return null;

              const categoryConfig = categoriesConfig[category] || categoriesConfig["Autres"];
              const IconComponent = iconMap[categoryConfig.icon.name] || Info; // Use iconMap

              return (
                <Button
                  key={category}
                  variant="ghost"
                  onClick={() => handleDesktopCategoryClick(category)}
                  className="flex items-center p-2 rounded-md text-sm font-medium whitespace-nowrap hover:bg-accent hover:text-accent-foreground"
                >
                  {React.createElement(IconComponent, { className: "mr-2 h-4 w-4" })}
                  {categoryConfig.label}
                </Button>
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
              <TooltipContent className="backdrop-blur-lg bg-background/80 z-50">
                <p>Recherche (Ctrl + F)</p>
              </TooltipContent>
            </Tooltip>
          )}

          <ThemeToggle />
          {!isMobile && (
            <Button variant="outline" size="icon" onClick={() => setIsAboutModalOpen(true)}>
              <Info className="h-5 w-5" />
              <span className="sr-only">À propos</span>
            </Button>
          )}
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
              <DropdownMenuContent align="end" className="backdrop-blur-lg bg-background/80 z-50">
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

      {/* Desktop Category Items Overlay (Full-width drawer) */}
      {!isMobile && isDesktopCategoryOverlayOpen && desktopActiveCategory && (
        <div className="fixed top-[68px] left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border shadow-lg py-4 px-4 md:px-8">
          <div className="max-w-7xl mx-auto flex flex-col gap-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={handleDesktopBackToCategories} />
                {React.createElement(categoriesConfig[desktopActiveCategory]?.icon || Info, { className: "h-6 w-6 text-primary" })}
                {categoriesConfig[desktopActiveCategory]?.label || desktopActiveCategory}
              </h2>
              <Button variant="ghost" onClick={handleDesktopBackToCategories}>
                <X className="h-5 w-5 mr-2" /> Fermer
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {groupedFullNavTree[desktopActiveCategory]?.map((item) => {
                const isLinkActive = item.route && (location.pathname + location.search).startsWith(item.route);
                const IconComponent = iconMap[item.icon_name || 'Info'] || Info; // Use iconMap

                return (
                  <NavLink
                    key={item.id}
                    to={item.route || '#'}
                    onClick={() => {
                      // For trigger items, call onClick and close overlay
                      if (item.label === "Recherche" && item.route === null) { // Special handling for search trigger
                        setIsSearchOverlayOpen(true);
                        setIsDesktopCategoryOverlayOpen(false);
                      } else if (item.label === "À propos" && item.route === null) { // Special handling for about trigger
                        setIsAboutModalOpen(true);
                        setIsDesktopCategoryOverlayOpen(false);
                      } else {
                        setIsDesktopCategoryOverlayOpen(false); // Close overlay on item click
                      }
                    }}
                    className={() =>
                      cn(
                        "flex flex-col items-center justify-center p-4 rounded-lg border text-center h-24",
                        isLinkActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-accent hover:text-accent-foreground",
                        "transition-all duration-200 ease-in-out"
                      )
                    }
                  >
                    <IconComponent className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium line-clamp-1">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main
        className={cn(
          "flex-grow p-4 sm:p-6 md:p-8 pt-24 md:pt-32 overflow-y-auto",
          isMobile && "pb-20",
          !isMobile && isDesktopCategoryOverlayOpen && "pt-[calc(68px+1rem+100px)]"
        )}
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