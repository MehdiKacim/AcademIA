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

interface BottomNavigationBarProps {
  allNavItemsForDrawer: NavItem[];
  onOpenGlobalSearch?: () => void;
  currentUser?: { name?: string; id?: string };
  onOpenAboutModal: () => void;
  isMoreDrawerOpen: boolean;
  setIsMoreDrawerOpen: (isOpen: boolean) => void;
  unreadMessagesCount: number;
}

// Define category metadata (icons, labels)
const categoriesConfig: { [key: string]: { label: string; icon: React.ElementType } } = {
  "Général": { label: "Général", icon: Home },
  "Apprentissage": { label: "Apprentissage", icon: BookOpen },
  "Progression": { label: "Progression", icon: TrendingUp },
  "Contenu": { label: "Contenu", icon: BookOpen },
  "Pédagogie": { label: "Pédagogie", icon: Users },
  "Analytiques": { label: "Analytiques", icon: BarChart2 },
  "Administration": { label: "Administration", icon: BriefcaseBusiness },
  "Autres": { label: "Autres", icon: Info }, // Fallback category
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
  const { signOut } = useRole();

  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isAuthDrawerOpen, setIsAuthDrawerOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [drawerContent, setDrawerContent] = useState<'categories' | 'items'>('categories');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeCategoryIcon, setActiveCategoryIcon] = useState<React.ElementType | null>(null);

  // Memoize fixedBottomNavItems to ensure its reference stability
  const fixedBottomNavItems = React.useMemo<NavItem[]>(() => {
    return [
      {
        to: "/dashboard",
        icon: Home,
        label: "Accueil",
        type: "link",
      },
      {
        to: "/messages",
        icon: MessageSquare,
        label: "Messages",
        type: "link",
        badge: unreadMessagesCount,
      },
      {
        icon: Search,
        label: "Recherche",
        type: "trigger",
        onClick: onOpenGlobalSearch,
      },
      {
        icon: User,
        label: "Profil",
        type: "trigger",
        onClick: () => setIsProfileDrawerOpen(true),
      },
    ];
  }, [onOpenGlobalSearch, unreadMessagesCount, setIsProfileDrawerOpen]);

  // If not logged in, replace "Profil" with "Authentification"
  const dynamicFixedBottomNavItems: NavItem[] = currentUser
    ? fixedBottomNavItems
    : fixedBottomNavItems.map(item =>
        item.label === "Profil"
          ? { icon: LogIn, label: "Authentification", type: 'trigger', onClick: () => setIsAuthDrawerOpen(true) }
          : item
      );

  // Filter out items that are already in the fixed bottom nav
  const drawerItems = React.useMemo(() => {
    const fixedItemPaths = new Set(
      fixedBottomNavItems.map((item) => item.to).filter(Boolean)
    );
    const fixedItemLabels = new Set(
      fixedBottomNavItems.map((item) => item.label)
    );

    return allNavItemsForDrawer.filter(
      (drawerItem) =>
        (drawerItem.to && !fixedItemPaths.has(drawerItem.to)) ||
        (!drawerItem.to && !fixedItemLabels.has(drawerItem.label))
    );
  }, [allNavItemsForDrawer, fixedBottomNavItems]);

  // Group and sort drawer items by category
  const groupedDrawerItems = React.useMemo(() => {
    const groups: { [key: string]: NavItem[] } = {};
    drawerItems.forEach(item => {
      const category = item.category || "Autres";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });

    // Sort categories alphabetically, then items within categories by label
    return Object.keys(groups).sort().map(category => ({
      category,
      items: groups[category].sort((a, b) => a.label.localeCompare(b.label))
    }));
  }, [drawerItems]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
    setIsProfileDrawerOpen(false);
  };

  const handleAuthSuccess = () => {
    setIsAuthDrawerOpen(false);
    navigate("/dashboard");
  };

  const handleDrawerItemClick = (item: NavItem) => {
    if (item.type === 'link' && item.to) {
      navigate(item.to);
      setIsMoreDrawerOpen(false);
      // Reset drawer state when navigating
      setDrawerContent('categories');
      setActiveCategory(null);
      setActiveCategoryIcon(null);
      setSearchQuery('');
    } else if (item.onClick) {
      item.onClick();
      setIsMoreDrawerOpen(false);
      // Reset drawer state when triggering an action
      setDrawerContent('categories');
      setActiveCategory(null);
      setActiveCategoryIcon(null);
      setSearchQuery('');
    }
  };

  const handleCategoryClick = (categoryLabel: string, categoryIcon: React.ElementType) => {
    setActiveCategory(categoryLabel);
    setActiveCategoryIcon(categoryIcon);
    setDrawerContent('items');
    setSearchQuery(''); // Clear search when entering a category
  };

  const handleBackToCategories = () => {
    setDrawerContent('categories');
    setActiveCategory(null);
    setActiveCategoryIcon(null);
    setSearchQuery(''); // Clear search when going back to categories
  };

  // Filter items for display in the drawer based on search query and current view
  const filteredDisplayContent = React.useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();

    if (drawerContent === 'categories') {
      const filteredCategories = groupedDrawerItems.filter(group =>
        categoriesConfig[group.category]?.label.toLowerCase().includes(lowerCaseQuery) ||
        group.items.some(item => item.label.toLowerCase().includes(lowerCaseQuery) || (item.description && item.description.toLowerCase().includes(lowerCaseQuery)))
      );
      return filteredCategories;
    } else { // drawerContent === 'items'
      const currentCategoryItems = groupedDrawerItems.find(group => group.category === activeCategory)?.items || [];
      const filteredItems = currentCategoryItems.filter(item =>
        item.label.toLowerCase().includes(lowerCaseQuery) ||
        (item.description && item.description.toLowerCase().includes(lowerCaseQuery))
      );
      return [{ category: activeCategory || "Autres", items: filteredItems }]; // Wrap in an array for consistent rendering
    }
  }, [groupedDrawerItems, searchQuery, drawerContent, activeCategory]);

  // Swipe handlers for opening the "More" drawer on mobile
  const swipeHandlers = useSwipeable({
    onSwipedUp: () => {
      if (isMobile && !isMoreDrawerOpen && !isProfileDrawerOpen && !isAuthDrawerOpen) {
        setIsMoreDrawerOpen(true);
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  // Reset drawer state when it closes
  useEffect(() => {
    if (!isMoreDrawerOpen) {
      setDrawerContent('categories');
      setActiveCategory(null);
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
        {dynamicFixedBottomNavItems.map((item: NavItem) => {
          const isLinkActive = item.type === 'link' && item.to && (location.pathname + location.search).startsWith(item.to);

          if (item.type === 'link' && item.to) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center py-2 px-2 rounded-md text-xs font-medium transition-colors relative flex-shrink-0 w-1/5",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )
                }
              >
                <item.icon className="h-5 w-5 mb-1" />
                {item.label}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          }
          if (item.type === 'trigger' && item.onClick) {
            return (
              <Button
                key={item.label}
                variant="ghost"
                onClick={item.onClick}
                className="flex flex-col items-center py-2 px-2 rounded-md text-xs font-medium transition-colors h-auto text-muted-foreground hover:text-foreground flex-shrink-0 w-1/5"
              >
                <item.icon className="h-5 w-5 mb-1" />
                {item.label}
              </Button>
            );
          }
          return null;
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

      {/* Profile/Settings Drawer for Mobile */}
      {currentUser && (
        <Drawer open={isProfileDrawerOpen} onOpenChange={setIsProfileDrawerOpen}>
          <DrawerContent side="bottom" className="h-auto max-h-[90vh] mt-24 rounded-t-lg flex flex-col backdrop-blur-lg bg-background/80">
            <div className="mx-auto w-full max-w-sm flex-grow flex flex-col">
              <DrawerHeader className="text-left">
                <DrawerTitle>Mon Compte</DrawerTitle>
                <DrawerDescription>Gérez votre profil et vos paramètres.</DrawerDescription>
              </DrawerHeader>
              <div className="p-4 pb-0 space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    navigate("/profile");
                    setIsProfileDrawerOpen(false);
                  }}
                >
                  <User className="mr-2 h-4 w-4" /> Mon profil
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    navigate("/settings");
                    setIsProfileDrawerOpen(false);
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" /> Paramètres
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    onOpenAboutModal();
                    setIsProfileDrawerOpen(false);
                  }}
                >
                  <Info className="mr-2 h-4 w-4" /> À propos
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                </Button>
              </div>
              <DrawerFooter>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Authentication Drawer for Mobile */}
      {!currentUser && (
        <Drawer open={isAuthDrawerOpen} onOpenChange={setIsAuthDrawerOpen}>
          <DrawerContent side="bottom" className="h-auto mt-24 rounded-t-lg backdrop-blur-lg bg-background/80">
            <div className="mx-auto w-full max-w-sm">
              <AuthMenu onClose={() => setIsAuthDrawerOpen(false)} onLoginSuccess={handleAuthSuccess} />
              <DrawerFooter>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* "More" Navigation Drawer for Mobile (Quick Settings style with categories) */}
      <Drawer open={isMoreDrawerOpen} onOpenChange={setIsMoreDrawerOpen}>
        <DrawerContent side="bottom" className="h-[calc(100vh-68px)] mt-0 rounded-t-lg flex flex-col backdrop-blur-lg bg-background/80">
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
                  {drawerContent === 'items' ? activeCategory : "Menu"}
                </DrawerTitle>
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" className="absolute right-4">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Fermer le menu</span>
                  </Button>
                </DrawerClose>
              </div>
              <DrawerDescription className="text-center">
                {drawerContent === 'items' ? `Éléments de la catégorie ${activeCategory}` : "Toutes les options de navigation."}
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 border-b border-border">
              <Input
                placeholder={drawerContent === 'categories' ? "Rechercher une catégorie ou un élément..." : `Rechercher dans ${activeCategory}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {filteredDisplayContent.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Aucun élément trouvé pour "{searchQuery}".</p>
              ) : (
                filteredDisplayContent.map((group) => (
                  <div key={group.category} className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {drawerContent === 'categories' ? (
                        // Display categories as buttons
                        group.items.length > 0 && ( // Only show category button if it has items (or if search matches category label)
                          <Button
                            variant="outline"
                            className={cn(
                              "flex flex-col items-center justify-center h-24 w-full text-center p-2",
                              "hover:bg-accent hover:text-accent-foreground",
                              "transition-all duration-200 ease-in-out"
                            )}
                            onClick={() => handleCategoryClick(group.category, categoriesConfig[group.category]?.icon || Info)}
                          >
                            {React.createElement(categoriesConfig[group.category]?.icon || Info, { className: "h-6 w-6 mb-2" })}
                            <span className="text-xs font-medium line-clamp-2">{categoriesConfig[group.category]?.label || group.category}</span>
                          </Button>
                        )
                      ) : (
                        // Display items within the active category
                        group.items.map((item) => {
                          const isLinkActive = item.to && (location.pathname + location.search).startsWith(item.to);
                          return (
                            <Button
                              key={item.to || item.label}
                              variant="outline"
                              className={cn(
                                "flex flex-col items-center justify-center h-24 w-full text-center p-2",
                                isLinkActive ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent hover:text-accent-foreground",
                                "transition-all duration-200 ease-in-out"
                              )}
                              onClick={() => handleDrawerItemClick(item)}
                            >
                              <item.icon className="h-6 w-6 mb-2" />
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
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default BottomNavigationBar;