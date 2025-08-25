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
      LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, BookMarked, CalendarDays, UserCheck, PlusSquare, ClipboardCheck, BotMessageSquare,
      GraduationCap, // Added GraduationCap icon
      PenTool, // Added PenTool icon
      NotebookText, // Added NotebookText icon
      School, // Added School icon
      LayoutList, // Added LayoutList icon
      UserRoundCog, // Added UserRoundCog icon
    } from "lucide-react";
    import { NavLink, useNavigate, useLocation } from "react-router-dom";
    import React, { useCallback, useState, useEffect } from "react";
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
    import { loadNavItems } from "@/lib/navItems"; // Import loadNavItems

    interface BottomNavigationBarProps {
      allNavItemsForDrawer: NavItem[];
      onOpenGlobalSearch?: () => void;
      currentUser?: { name?: string; id?: string };
      onOpenAboutModal: () => void;
      isMoreDrawerOpen: boolean;
      setIsMoreDrawerOpen: (isOpen: boolean) => void;
      unreadMessagesCount: number;
    }

    // Map icon_name strings to Lucide React components
    const iconMap: { [key: string]: React.ElementType } = {
      Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck,
    };

    const BottomNavigationBar = ({
      allNavItemsForDrawer,
      onOpenGlobalSearch,
      currentUser,
      onOpenAboutModal,
      isMoreDrawerOpen,
      setIsMoreDrawerOpen,
      unreadMessagesCount,
    }: BottomNavigationBarProps) => {
      const isMobile = useIsMobile();
      const location = useLocation();
      const navigate = useNavigate();
      const { signOut, currentRole } = useRole();

      const [searchQuery, setSearchQuery] = useState("");
      const [drawerContent, setDrawerContent] = useState<'categories' | 'items'>('categories');
      const [activeCategoryLabel, setActiveCategoryLabel] = useState<string | null>(null);
      const [activeCategoryIcon, setActiveCategoryIcon] = useState<React.ElementType | null>(null);

      const [navItems, setNavItems] = useState<NavItem[]>([]); // State to store loaded nav items for the drawer

      useEffect(() => {
        const fetchNavItems = async () => {
          const loadedItems = await loadNavItems(currentRole, unreadMessagesCount);
          setNavItems(loadedItems);
        };
        fetchNavItems();
      }, [currentRole, unreadMessagesCount]); // Reload nav items when user role or unreadMessagesCount changes

      const handleCategoryClick = useCallback((categoryLabel: string, categoryIcon: React.ElementType) => {
        setActiveCategoryLabel(categoryLabel);
        setActiveCategoryIcon(categoryIcon);
        setDrawerContent('items');
        setSearchQuery('');
      }, []);

      const fixedBottomNavItems = React.useMemo<NavItem[]>(() => {
        if (!currentUser) {
          return [
            { id: 'home-anon', route: "/", icon_name: 'Home', label: "Accueil", is_root: true, is_external: false },
            { id: 'auth-anon', icon_name: 'LogIn', label: "Authentification", is_root: true, is_external: false, onClick: () => { setIsMoreDrawerOpen(true); handleCategoryClick("Accueil", iconMap['Home']); } }
          ];
        }
        // Filter navItems to only include those that are root and have no parent_id, and are allowed for the current role
        const rootItems = navItems.filter(item => item.is_root && !item.parent_nav_item_id); // Use parent_nav_item_id

        // Manually add search and messages, as they are special cases for the bottom bar
        const messagesItem = rootItems.find(item => item.label === "Messagerie"); // Changed label to "Messagerie"
        const searchItem = rootItems.find(item => item.label === "Recherche");

        const baseItems = [
          rootItems.find(item => item.label === "Accueil"),
          messagesItem ? { ...messagesItem, badge: unreadMessagesCount } : null,
          searchItem ? { ...searchItem, onClick: onOpenGlobalSearch } : null,
        ].filter(Boolean) as NavItem[];

        return baseItems;
      }, [currentUser, unreadMessagesCount, onOpenGlobalSearch, setIsMoreDrawerOpen, navItems, handleCategoryClick]);

      const groupedDrawerItems = React.useMemo(() => {
        const categories: { [key: string]: { label: string; order: number; icon: React.ElementType; items: NavItem[] } } = {};

        navItems.forEach(item => {
          if (item.is_root && !item.parent_nav_item_id) { // Check if it's a root item (category or direct link)
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
          .sort((a, b) => a.order - b.order);

        // Sort items within each category by their order_index
        sortedCategories.forEach(categoryGroup => {
          categoryGroup.items.sort((a, b) => a.order_index - b.order_index);
        });

        return sortedCategories;
      }, [navItems]);

      const handleLogout = async () => {
        await signOut();
        navigate("/");
        setIsMoreDrawerOpen(false);
        setDrawerContent('categories');
        setActiveCategoryLabel(null);
        setActiveCategoryIcon(null);
        setSearchQuery('');
      };

      const handleAuthSuccess = () => {
        setIsMoreDrawerOpen(false);
        setDrawerContent('categories');
        setActiveCategoryLabel(null);
        setActiveCategoryIcon(null);
        setSearchQuery('');
        navigate("/dashboard");
      };

      const handleDrawerItemClick = (item: NavItem) => {
        if (item.route) {
          navigate(item.route);
          setIsMoreDrawerOpen(false);
          setDrawerContent('categories');
          setActiveCategoryLabel(null);
          setActiveCategoryIcon(null);
          setSearchQuery('');
        } else if (item.onClick) {
          item.onClick();
          if (item.label !== "Recherche") {
            setIsMoreDrawerOpen(false);
            setDrawerContent('categories');
            setActiveCategoryLabel(null);
            setActiveCategoryIcon(null);
            setSearchQuery('');
          }
        }
      };

      const handleBackToCategories = () => {
        setDrawerContent('categories');
        setActiveCategoryLabel(null);
        setActiveCategoryIcon(null);
        setSearchQuery('');
      };

      const filteredDisplayContent = React.useMemo(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();

        if (drawerContent === 'categories') {
          return groupedDrawerItems.filter(group =>
            group.label.toLowerCase().includes(lowerCaseQuery) ||
            group.items.some(item => item.label.toLowerCase().includes(lowerCaseQuery) || (item.description && item.description.toLowerCase().includes(lowerCaseQuery)))
          );
        } else {
          const activeGroup = groupedDrawerItems.find(group => group.label === activeCategoryLabel);
          if (!activeGroup) return [];

          const filteredItems = activeGroup.items.filter(item =>
            item.label.toLowerCase().includes(lowerCaseQuery) ||
            (item.description && item.description.toLowerCase().includes(lowerCaseQuery))
          );
          return [{ label: activeGroup.label, order: activeGroup.order, icon: activeGroup.icon, items: filteredItems }];
        }
      }, [groupedDrawerItems, searchQuery, drawerContent, activeCategoryLabel]);

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
          setDrawerContent('categories');
          setActiveCategoryLabel(null);
          setActiveCategoryIcon(null);
          setSearchQuery('');
        }
      }, [isMoreDrawerOpen]);

      if (!isMobile) {
        return null;
      }

      return (
        <>
          <div
            {...swipeHandlers}
            className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t backdrop-blur-lg bg-background/80 py-1 px-2 shadow-lg md:hidden"
          >
            {fixedBottomNavItems.map((item: NavItem) => {
              const isLinkActive = 
                (item.route === '/' && location.pathname === '/' && !location.hash) ||
                (item.route && !item.route.startsWith('#') && location.pathname.startsWith(item.route));
              const IconComponent = iconMap[item.icon_name || 'Info'] || Info;

              return (
                <NavLink
                  key={item.id}
                  to={item.route || '#'}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center py-2 px-2 rounded-md text-xs font-medium transition-colors relative flex-shrink-0 w-1/5",
                      isActive || isLinkActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )
                  }
                  onClick={item.onClick ? () => handleDrawerItemClick(item) : undefined}
                >
                  <IconComponent className="h-5 w-5 mb-1" />
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}

            <Button
              variant="ghost"
              onClick={() => setIsMoreDrawerOpen(true)}
              className="flex flex-col items-center py-2 px-2 rounded-md text-xs font-medium transition-colors h-auto text-muted-foreground hover:text-foreground flex-shrink-0 w-1/5"
            >
              <ChevronUp className="h-5 w-5 mb-1 animate-bounce-slow" />
              Menu
            </Button>
          </div>

          <Drawer open={isMoreDrawerOpen} onOpenChange={setIsMoreDrawerOpen}>
            <DrawerContent side="bottom" className="h-[calc(100vh-68px)] mt-0 rounded-t-lg flex flex-col backdrop-blur-lg bg-background/80 z-50">
              <div className="mx-auto w-full max-w-md flex-grow flex flex-col">
                <DrawerHeader className="text-center">
                  <div className="flex items-center justify-between">
                    {drawerContent === 'items' && (
                      <Button variant="ghost" size="icon" onClick={handleBackToCategories} className="absolute left-4">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">Retour aux catégories</span>
                      </Button>
                    )}
                    <DrawerTitle className="flex-grow text-center flex items-center justify-center gap-2">
                      {drawerContent === 'items' && activeCategoryIcon && React.createElement(activeCategoryIcon, { className: "h-6 w-6 text-primary" })}
                      {drawerContent === 'items' ? activeCategoryLabel : "Menu"}
                    </DrawerTitle>
                    <DrawerClose asChild>
                      <Button variant="ghost" size="icon" className="absolute right-4">
                        <X className="h-5 w-5" />
                        <span className="sr-only">Fermer le menu</span>
                      </Button>
                    </DrawerClose>
                  </div>
                  <DrawerDescription className="text-center">
                    {drawerContent === 'items' ? `Éléments de la catégorie ${activeCategoryLabel}` : "Toutes les options de navigation."}
                  </DrawerDescription>
                </DrawerHeader>
                {currentUser && (
                  <div className="p-4 border-b border-border">
                    <Input
                      placeholder={drawerContent === 'categories' ? "Rechercher une catégorie ou un élément..." : `Rechercher dans ${activeCategoryLabel}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                  {filteredDisplayContent.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Aucun élément trouvé pour "{searchQuery}".</p>
                  ) : (
                    filteredDisplayContent.map((group) => (
                      <div key={group.label} className="space-y-2">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {drawerContent === 'categories' ? (
                            (group.items.length > 0 || (group.label.toLowerCase().includes(searchQuery.toLowerCase()) && searchQuery.trim() !== '')) && (
                              <Button
                                variant="outline"
                                className={cn(
                                  "flex flex-col items-center justify-center h-24 w-full text-center p-2",
                                  "hover:bg-accent hover:text-accent-foreground",
                                  "transition-all duration-200 ease-in-out"
                                )}
                                onClick={() => handleCategoryClick(group.label, group.icon)}
                              >
                                {React.createElement(group.icon, { className: "h-6 w-6 mb-2" })}
                                <span className="text-xs font-medium line-clamp-2">{group.label}</span>
                              </Button>
                            )
                          ) : (
                            group.items.map((item) => {
                              const isLinkActive = 
                                (item.route === '/' && location.pathname === '/' && !location.hash) ||
                                (item.route?.startsWith('#') && location.pathname === '/' && location.hash === item.route) ||
                                (item.route && !item.route.startsWith('#') && location.pathname.startsWith(item.route));
                              const IconComponent = iconMap[item.icon_name || 'Info'] || Info;
                              
                              return (
                                <Button
                                  key={item.id}
                                  variant="outline"
                                  className={cn(
                                    "flex flex-col items-center justify-center h-24 w-full text-center p-2",
                                    isLinkActive ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent hover:text-accent-foreground",
                                    "transition-all duration-200 ease-in-out"
                                  )}
                                  onClick={() => handleDrawerItemClick(item)}
                                >
                                  <IconComponent className="h-6 w-6 mb-2" />
                                  <span className="text-xs font-medium line-clamp-2">{item.label}</span>
                                  {item.badge !== undefined && item.badge > 0 && (
                                    <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
                                      {item.badge}
                                    </span>
                                  )}
                                </Button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <DrawerFooter>
                  {!currentUser && drawerContent === 'items' && activeCategoryLabel === 'Accueil' && (
                    <AuthMenu onClose={() => setIsMoreDrawerOpen(false)} onLoginSuccess={handleAuthSuccess} />
                  )}
                  {currentUser && drawerContent === 'items' && activeCategoryLabel === 'Accueil' && (
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