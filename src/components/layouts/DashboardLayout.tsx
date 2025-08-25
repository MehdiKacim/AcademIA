import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
    import { Home, BookOpen, PlusSquare, BarChart2, User, LogOut, Settings, Info, GraduationCap, PenTool, Users, NotebookText, School, Search, ArrowLeft, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, MessageSquare, LogIn, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, X } from "lucide-react";
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

    // Map icon_name strings to Lucide React components
    const iconMap: { [key: string]: React.ElementType } = {
      Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck,
    };

    const DashboardLayout = ({ setIsAdminModalOpen }: DashboardLayoutProps) => {
      const isMobile = useIsMobile();
      const { currentUserProfile, isLoadingUser, currentRole, signOut } = useRole();
      const { isChatOpen } = useCourseChat();
      const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
      const [unreadMessages, setUnreadMessages] = useState(0);
      const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
      const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
      const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
      const navigate = useNavigate();
      const location = useLocation();

      // States for desktop category navigation
      const [desktopActiveCategoryLabel, setDesktopActiveCategoryLabel] = useState<string | null>(null);
      const [desktopActiveCategoryIcon, setDesktopActiveCategoryIcon] = useState<React.ElementType | null>(null);
      const [desktopActiveCategoryItems, setDesktopActiveCategoryItems] = useState<NavItem[]>([]);
      const [isDesktopCategoryOverlayOpen, setIsDesktopCategoryOverlayOpen] = useState(false);

      const [isAiAChatButtonVisible, setIsAiAChatButtonVisible] = useState(true);
      const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
      const logoTapCountRef = useRef(0);

      const [navItems, setNavItems] = useState<NavItem[]>([]); // State to store loaded nav items

      useEffect(() => {
        const fetchNavItems = async () => {
          console.log("[DashboardLayout] fetchNavItems: Starting to load nav items for role:", currentRole, "establishment:", currentUserProfile?.establishment_id);
          const loadedItems = await loadNavItems(currentRole, unreadMessages, currentUserProfile?.establishment_id);
          setNavItems(loadedItems);
          console.log("[DashboardLayout] fetchNavItems: Loaded navItems (raw from loadNavItems):", loadedItems);
        };
        fetchNavItems();
      }, [currentRole, unreadMessages, currentUserProfile?.establishment_id]); // Reload nav items when user role, unreadMessages, or establishment changes

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
        console.log("[DashboardLayout] fullNavTree memo re-calculated. Input navItems:", navItems);
        return navItems;
      }, [navItems]);

      // Group fullNavTree items by category for desktop display, respecting order_index
      const groupedFullNavTree = React.useMemo(() => {
        const categories: { [key: string]: { label: string; order: number; icon: React.ElementType; items: NavItem[] } } = {};

        fullNavTree.forEach(item => {
          console.log("[DashboardLayout] groupedFullNavTree: Processing item:", item.label, "parent_nav_item_id:", item.parent_nav_item_id);
          if (item.parent_nav_item_id === null) { // Now directly use item.parent_nav_item_id === null
            const categoryLabel = item.label;
            const categoryOrder = item.order_index; // Use order_index from the configured item
            const categoryIcon = iconMap[item.icon_name || 'Info'] || Info;

            if (!categories[categoryLabel]) {
              categories[categoryLabel] = { label: categoryLabel, order: categoryOrder, icon: categoryIcon, items: [] };
            }

            if (item.children && item.children.length > 0) {
              item.children.forEach(child => {
                categories[categoryLabel].items.push(child);
              });
            } else if (item.route) { // Direct link at root level
              categories[categoryLabel].items.push(item);
            }
          }
        });

        // Convert to array and sort categories by their order
        const sortedCategories = Object.values(categories)
          .filter(group => group.items.length > 0)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        // Sort items within each category by their order_index
        sortedCategories.forEach(categoryGroup => {
          categoryGroup.items.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        });
        console.log("[DashboardLayout] groupedFullNavTree memo re-calculated. Result (sorted categories):", sortedCategories);
        return sortedCategories;
      }, [fullNavTree]);

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
                {groupedFullNavTree.map(categoryGroup => {
                  const IconComponent = categoryGroup.icon;

                  return (
                    <Button
                      key={categoryGroup.label}
                      variant="ghost"
                      onClick={() => handleDesktopCategoryClick(categoryGroup.label, categoryGroup.icon, categoryGroup.items)}
                      className="flex items-center p-2 rounded-md text-sm font-medium whitespace-nowrap hover:bg-accent hover:text-accent-foreground"
                    >
                      {React.createElement(IconComponent, { className: "mr-2 h-4 w-4" })}
                      {categoryGroup.label}
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
          {!isMobile && isDesktopCategoryOverlayOpen && desktopActiveCategoryLabel && (
            <div className="fixed top-[68px] left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border shadow-lg py-4 px-4 md:px-8">
              <div className="max-w-7xl mx-auto flex flex-col gap-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={handleDesktopBackToCategories} />
                    {desktopActiveCategoryIcon && React.createElement(desktopActiveCategoryIcon, { className: "h-6 w-6 text-primary" })}
                    {desktopActiveCategoryLabel}
                  </h2>
                  <Button variant="ghost" onClick={handleDesktopBackToCategories}>
                    <X className="h-5 w-5 mr-2" /> Fermer
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {desktopActiveCategoryItems.map((item) => {
                    const isLinkActive = item.route && (location.pathname + location.search).startsWith(item.route);
                    const IconComponent = iconMap[item.icon_name || 'Info'] || Info;

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