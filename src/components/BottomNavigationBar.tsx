import {
      Home,
      MessageSquare,
      Search,
      User,
      LogOut,
      LogIn,
      ArrowLeft,
      X,
      Settings,
      Info,
      ArrowRight,
      ChevronUp,
      BookOpen, // For Apprentissage/Contenu category
      TrendingUp, // For Progression category
      Users, // For Pédagogie category
      BarChart2, // For Analytiques category
      BriefcaseBusiness, // For Administration category
      LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog,
      GraduationCap, // Added GraduationCap icon
      PenTool, // Added PenTool icon
      NotebookText, // Added NotebookText icon
      School, // Added School icon
      LayoutList, // Added LayoutList icon
      UserRoundCog, // Added UserRoundCog icon
      ClipboardCheck, // Added ClipboardCheck icon
      BotMessageSquare, // Added BotMessageSquare icon
      BookMarked, // Added BookMarked icon
      CalendarDays, // Added CalendarDays icon
      UserCheck, // Added UserCheck icon
      PlusSquare, // Added PlusSquare icon
    } from "lucide-react";
    import { NavLink, useNavigate, useLocation } from "react-router-dom";
    import React, { useCallback, useState, useEffect, useRef } from "react";
    import { useIsMobile } from "@/hooks/use-mobile";
    import { cn } from "@/lib/utils";
    import { NavItem } from "@/lib/dataModels";
    import { useRole } from "@/contexts/RoleContext";
    import {
      Drawer,
      DrawerContent,
      DrawerHeader,
      DrawerTitle,
      DrawerDescription,
      DrawerFooter,
      DrawerClose,
    } from "@/components/ui/drawer";
    import AuthMenu from "./AuthMenu";
    import { Input } from "@/components/ui/input";
    import { Button } from "@/components/ui/button";
    import { useSwipeable } from 'react-swipeable';
    // Removed import for loadNavItems from "@/lib/navItems"

    interface BottomNavigationBarProps {
      allNavItemsForDrawer: NavItem[]; // This will now be used only for authenticated users' drawer
      onOpenGlobalSearch?: () => void;
      currentUser?: { name?: string; id?: string };
      onOpenAboutModal: () => void;
      onOpenAuthModal: () => void; // New prop
      isMoreDrawerOpen: boolean;
      setIsMoreDrawerOpen: (isOpen: boolean) => void;
      unreadMessagesCount: number;
    }

    // Map icon_name strings to Lucide React components
    const iconMap: { [key: string]: React.ElementType } = {
      Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, LogIn
    };

    const BottomNavigationBar = ({
      allNavItemsForDrawer, // This prop is now primarily for authenticated users' drawer
      onOpenGlobalSearch,
      currentUser,
      onOpenAboutModal,
      onOpenAuthModal, // Use new prop
      isMoreDrawerOpen,
      setIsMoreDrawerOpen,
      unreadMessagesCount,
    }: BottomNavigationBarProps) => {
      const isMobile = useIsMobile();
      const location = useLocation();
      const navigate = useNavigate();
      const { signOut, currentRole, currentUserProfile } = useRole(); // Get currentUserProfile

      const [searchQuery, setSearchQuery] = useState("");
      // Removed drawerContent and activeCategoryLabel/Icon states
      const [drawerNavStack, setDrawerNavStack] = useState<NavItem[]>([]); // New: Stack for drawer navigation

      // Removed dynamicNavItems state and its useEffect for loading. It now comes from props.
      // const [dynamicNavItems, setDynamicNavItems] = useState<NavItem[]>([]); 
      // useEffect(() => {
      //   if (currentUser) { // Only load dynamic nav items if user is authenticated
      //     const fetchNavItems = async () => {
      //       // console.log("[BottomNavigationBar] fetchNavItems: Starting to load nav items for role:", currentRole, "establishment:", currentUserProfile?.establishment_id);
      //       const loadedItems = await loadNavItems(currentRole, unreadMessages, currentUserProfile?.establishment_id);
      //       setDynamicNavItems(loadedItems);
      //       // console.log("[BottomNavigationBar] fetchNavItems: Loaded dynamicNavItems (raw from loadNavItems):", loadedItems);
      //     };
      //     fetchNavItems();
      //   } else {
      //     setDynamicNavItems([]); // Clear dynamic nav items if not authenticated
      //     // console.log("[BottomNavigationBar] User not authenticated, dynamicNavItems cleared.");
      //   }
      // }, [currentRole, unreadMessages, currentUserProfile?.establishment_id, currentUser]);

      const handleCategoryClick = useCallback((categoryItem: NavItem) => {
        // console.log("[BottomNavigationBar] handleCategoryClick: Pushing category to stack:", categoryItem.label);
        setDrawerNavStack(prevStack => [...prevStack, categoryItem]);
        setSearchQuery(''); // Clear search when entering a category
      }, []);

      const fixedBottomNavItems = React.useMemo<NavItem[]>(() => {
        // console.log("[BottomNavigationBar] fixedBottomNavItems memo re-calculated. Input allNavItemsForDrawer:", allNavItemsForDrawer);
        if (!currentUser) {
          return [
            // Removed 'Accueil' entry as requested
            { id: 'auth-anon', icon_name: 'LogIn', label: "Authentification", is_external: false, onClick: onOpenAuthModal, order_index: 1, type: 'category_or_action' } // Direct call to onOpenAuthModal
          ];
        }
        // For authenticated users, return an empty array to only show the "Menu" button
        return [];
      }, [currentUser, unreadMessagesCount, onOpenGlobalSearch, setIsMoreDrawerOpen, allNavItemsForDrawer, handleCategoryClick, onOpenAuthModal]);

      // This memo now prepares the list of items to display in the drawer,
      // distinguishing between top-level direct links and categories.
      const currentDrawerItemsToDisplay = React.useMemo(() => {
        // console.log("[BottomNavigationBar] currentDrawerItemsToDisplay memo re-calculated. Input allNavItemsForDrawer:", allNavItemsForDrawer);
        const lowerCaseQuery = searchQuery.toLowerCase();
        let itemsToFilter: NavItem[] = [];

        if (!currentUser) {
          // For anonymous users, provide a static list of top-level items
          itemsToFilter = [
            { id: 'home-anon-drawer', label: "Accueil", icon_name: 'Home', route: '/', is_external: false, order_index: 0, children: [], type: 'route' },
            { id: 'aia-drawer', label: "AiA Bot", icon_name: 'BotMessageSquare', route: '#aiaBot', is_external: false, order_index: 1, children: [], type: 'route' },
            { id: 'methodology-drawer', label: "Méthodologie", icon_name: 'SlidersHorizontal', route: '#methodologie', is_external: false, order_index: 2, children: [], type: 'route' },
            { id: 'about-drawer', label: "À propos", icon_name: 'Info', is_external: false, onClick: onOpenAboutModal, order_index: 3, children: [], type: 'category_or_action' },
            { id: 'auth-anon-drawer', label: "Authentification", icon_name: 'LogIn', is_external: false, onClick: onOpenAuthModal, order_index: 4, children: [], type: 'category_or_action' } // Added Authentification
          ].sort((a, b) => a.order_index - b.order_index);
        } else if (drawerNavStack.length === 0) {
          // For authenticated users, show top-level items (direct links or categories)
          itemsToFilter = allNavItemsForDrawer.filter(item => item.parent_nav_item_id === null || item.parent_nav_item_id === undefined);
        } else {
          // Show children of the active category (top of the stack)
          const activeCategory = drawerNavStack[drawerNavStack.length - 1];
          itemsToFilter = activeCategory.children || [];
        }
        // console.log("[BottomNavigationBar] currentDrawerItemsToDisplay: Items before filtering by search:", itemsToFilter);

        const filteredAndSorted = itemsToFilter.filter(item =>
          item.label.toLowerCase().includes(lowerCaseQuery) ||
          (item.description && item.description.toLowerCase().includes(lowerCaseQuery))
        ).sort((a, b) => a.order_index - b.order_index); // Ensure items are sorted
        // console.log("[BottomNavigationBar] currentDrawerItemsToDisplay: Filtered and sorted result:", filteredAndSorted);
        return filteredAndSorted;
      }, [currentUser, allNavItemsForDrawer, drawerNavStack, searchQuery, onOpenAboutModal, onOpenAuthModal]);


      const handleLogout = async () => {
        await signOut();
        navigate("/");
        setIsMoreDrawerOpen(false);
        setDrawerNavStack([]); // Reset stack on logout
        setSearchQuery('');
      };

      const handleAuthSuccess = () => {
        setIsMoreDrawerOpen(false);
        setDrawerNavStack([]); // Reset stack on login success
        setSearchQuery('');
        navigate("/dashboard");
      };

      const handleDrawerItemClick = (item: NavItem) => {
        const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);
        if (isCategory) {
          handleCategoryClick(item); // Push category to stack
        } else if (item.route) {
          if (item.route.startsWith('#')) {
            // Handle hash links for the Index page
            navigate(`/${item.route}`);
          } else {
            navigate(item.route);
          }
          setIsMoreDrawerOpen(false);
          setDrawerNavStack([]); // Reset stack on direct navigation
          setSearchQuery('');
        } else if (item.onClick) {
          item.onClick();
          if (item.label !== "Recherche") { // Keep search drawer open if it's the search button
            setIsMoreDrawerOpen(false);
            setDrawerNavStack([]); // Reset stack on action
            setSearchQuery('');
          }
        }
      };

      const handleBackInDrawer = () => {
        // console.log("[BottomNavigationBar] handleBackInDrawer: Popping from stack.");
        setDrawerNavStack(prevStack => {
          const newStack = [...prevStack];
          newStack.pop(); // Remove the current category
          return newStack;
        });
        setSearchQuery(''); // Clear search when going back
      };

      const swipeHandlers = useSwipeable({
        onSwipedUp: () => {
          if (isMobile && !isMoreDrawerOpen) {
            setIsMoreDrawerOpen(true);
          }
        },
        preventScrollOnSwipe: true,
        trackMouse: true,
      });

      useEffect(() => {
        if (!isMoreDrawerOpen) {
          setDrawerNavStack([]); // Reset stack when drawer closes
          setSearchQuery('');
        }
      }, [isMoreDrawerOpen]);

      const currentDrawerTitle = drawerNavStack.length > 0 ? drawerNavStack[drawerNavStack.length - 1].label : "Menu";
      const currentDrawerIcon = drawerNavStack.length > 0 ? iconMap[drawerNavStack[drawerNavStack.length - 1].icon_name || 'Info'] : null;


      if (!isMobile) {
        return null;
      }

      return (
        <>
          <div
            {...swipeHandlers}
            className="fixed bottom-[env(safe-area-inset-bottom)] left-0 right-0 z-40 flex items-center justify-around border-t backdrop-blur-lg bg-background/80 py-1 px-2 shadow-lg md:hidden"
          >
            {fixedBottomNavItems.map((item: NavItem) => {
              const IconComponent = iconMap[item.icon_name || 'Info'] || Info;
              const commonClasses = cn(
                "flex flex-col items-center py-2 px-2 rounded-md text-xs font-medium transition-colors relative flex-shrink-0",
                fixedBottomNavItems.length === 1 ? "w-full" : "w-1/5", // Make full width if only one item
                "text-muted-foreground hover:text-foreground" // Default text color
              );

              const childrenContent = (
                <React.Fragment>
                  <IconComponent className="h-5 w-5 mb-1" />
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
                      {item.badge}
                    </span>
                  )}
                </React.Fragment>
              );

              if (item.onClick) {
                // Render as Button if it has an onClick handler
                return (
                  <Button
                    key={item.id}
                    variant="ghost" // Use ghost variant for a similar look to NavLink
                    className={commonClasses}
                    onClick={() => handleDrawerItemClick(item)}
                  >
                    {childrenContent}
                  </Button>
                );
              } else {
                // Render as NavLink for actual routes
                const isLinkActive = 
                  (item.route === '/' && location.pathname === '/' && !location.hash) ||
                  (item.route && !item.route.startsWith('#') && location.pathname.startsWith(item.route));

                return (
                  <NavLink
                    key={item.id}
                    to={item.route || '#'}
                    className={({ isActive }) =>
                      cn(
                        commonClasses,
                        isActive || isLinkActive
                          ? "text-primary" // Active link color
                          : ""
                      )
                    }
                  >
                    {childrenContent}
                  </NavLink>
                );
              }
            })}

            <Button
              variant="ghost"
              onClick={() => setIsMoreDrawerOpen(true)}
              className={cn(
                "flex flex-col items-center py-2 px-2 rounded-md text-xs font-medium transition-colors h-auto text-muted-foreground hover:text-foreground flex-shrink-0",
                fixedBottomNavItems.length === 0 ? "w-full" : "w-1/5" // Make it full width if no other fixed items
              )}
            >
              <React.Fragment> {/* Wrap children with Fragment */}
                <ChevronUp className="h-5 w-5 mb-1 animate-bounce-slow" />
                Menu
              </React.Fragment>
            </Button>
          </div>

          <Drawer open={isMoreDrawerOpen} onOpenChange={setIsMoreDrawerOpen}>
            <DrawerContent side="bottom" className="h-[calc(100vh-68px)] mt-0 rounded-t-lg flex flex-col backdrop-blur-lg bg-background/80 z-50">
              <div className="mx-auto w-full max-w-md flex-grow flex flex-col">
                <DrawerHeader className="text-center">
                  <div className="flex items-center justify-between">
                    {drawerNavStack.length > 0 && (
                      <Button variant="ghost" size="icon" onClick={handleBackInDrawer} className="absolute left-4">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">Retour</span>
                      </Button>
                    )}
                    <DrawerTitle className="flex-grow text-center flex items-center justify-center gap-2">
                      <React.Fragment> {/* Wrap content of DrawerTitle */}
                        {currentDrawerIcon && React.createElement(currentDrawerIcon, { className: "h-6 w-6 text-primary" })}
                        {currentDrawerTitle}
                      </React.Fragment>
                    </DrawerTitle>
                    <DrawerClose asChild>
                      {/* Simplified DrawerClose button */}
                      <Button variant="ghost" size="icon" className="absolute right-4">
                        <X className="h-5 w-5" />
                      </Button>
                    </DrawerClose>
                  </div>
                  <DrawerDescription className="text-center">
                    {drawerNavStack.length > 0 ? `Éléments de la catégorie ${currentDrawerTitle}` : "Toutes les options de navigation."}
                  </DrawerDescription>
                </DrawerHeader>
                {currentUser && (
                  <div className="p-4 border-b border-border">
                    <Input
                      placeholder={drawerNavStack.length > 0 ? `Rechercher dans ${currentDrawerTitle}...` : "Rechercher une catégorie ou un élément..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                  {currentDrawerItemsToDisplay.length === 0 && searchQuery.trim() !== '' ? (
                    <p className="text-muted-foreground text-center py-4 col-span-full">Aucun élément trouvé pour "{searchQuery}".</p>
                  ) : currentDrawerItemsToDisplay.length === 0 && searchQuery.trim() === '' ? (
                    <p className="text-muted-foreground text-center py-4 col-span-full">Aucun élément de menu configuré pour ce rôle.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {currentDrawerItemsToDisplay.map((item) => {
                        const IconComponent = iconMap[item.icon_name || 'Info'] || Info;
                        const isLinkActive = item.route && (location.pathname + location.search).startsWith(item.route);
                        const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);

                        return (
                          <Button
                            key={item.id}
                            variant="ghost"
                            className={cn(
                              "android-tile flex-col items-start justify-start h-auto min-h-[80px] text-left w-full",
                              "rounded-android-tile",
                              isLinkActive ? "active" : "",
                              "transition-all duration-200 ease-in-out"
                            )}
                            onClick={() => handleDrawerItemClick(item)}
                          >
                            <React.Fragment> {/* Wrap children with Fragment */}
                              <IconComponent className="h-6 w-6" />
                              <span className="title text-base font-medium line-clamp-2">{item.label}</span>
                              {item.badge !== undefined && item.badge > 0 && (
                                <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs leading-none">
                                  {item.badge}
                                </span>
                              )}
                            </React.Fragment>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <DrawerFooter>
                  {/* Removed AuthMenu from here */}
                  {currentUser && drawerNavStack.length === 0 && ( // Show logout only in top-level categories view for authenticated users
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                    </Button>
                  )}
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </>
      );
    };

    export default BottomNavigationBar;