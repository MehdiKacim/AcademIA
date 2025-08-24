import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Search, Home, MessageSquare, User, Settings, LogOut, LogIn, Info, MoreHorizontal, X, ArrowLeft, ArrowRight } from "lucide-react"; // Added ArrowRight
import { NavItem } from "@/lib/dataModels";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { useRole } from "@/contexts/RoleContext";
import AuthMenu from "./AuthMenu";
import { Input } from "@/components/ui/input"; // Import Input for search

interface BottomNavigationBarProps {
  allNavItemsForDrawer: NavItem[]; // All nested navigation items for the "More" drawer
  onOpenGlobalSearch?: () => void;
  currentUser: any; // Profile type
  onOpenAboutModal: () => void;
  isMoreDrawerOpen: boolean; // State for the "More" drawer
  setIsMoreDrawerOpen: (isOpen: boolean) => void; // Setter for the "More" drawer
}

const BottomNavigationBar = ({ allNavItemsForDrawer, onOpenGlobalSearch, currentUser, onOpenAboutModal, isMoreDrawerOpen, setIsMoreDrawerOpen }: BottomNavigationBarProps) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useRole();

  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isAuthDrawerOpen, setIsAuthDrawerOpen] = useState(false);

  // State for drill-down navigation in "More" drawer
  const [currentDrawerItems, setCurrentDrawerItems] = useState<NavItem[]>([]);
  const [drawerTitle, setDrawerTitle] = useState("Menu");
  const [drawerDescription, setDrawerDescription] = useState("Toutes les options de navigation.");
  const [drawerHistory, setDrawerHistory] = useState<{ items: NavItem[], title: string, description: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState(''); // New state for search input

  // Function to get top-level items for the drawer, excluding those already in the fixed bottom nav
  const getTopLevelDrawerItems = React.useCallback(() => {
    const fixedItemPaths = new Set(fixedBottomNavItems.map(item => item.to).filter(Boolean));
    const fixedItemLabels = new Set(fixedBottomNavItems.map(item => item.label));

    return allNavItemsForDrawer.filter(drawerItem =>
      (drawerItem.to && !fixedItemPaths.has(drawerItem.to)) || (!drawerItem.to && !fixedItemLabels.has(drawerItem.label))
    );
  }, [allNavItemsForDrawer]);

  // Initialize currentDrawerItems when the drawer opens
  React.useEffect(() => {
    if (isMoreDrawerOpen) {
      setCurrentDrawerItems(getTopLevelDrawerItems());
      setDrawerTitle("Menu");
      setDrawerDescription("Toutes les options de navigation.");
      setDrawerHistory([]);
      setSearchQuery(''); // Clear search when drawer opens
    }
  }, [isMoreDrawerOpen, getTopLevelDrawerItems]);

  if (!isMobile) {
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    navigate("/");
    setIsProfileDrawerOpen(false);
  };

  const handleAuthSuccess = () => {
    setIsAuthDrawerOpen(false);
    navigate("/dashboard");
  };

  // Define the core fixed navigation items for the bottom bar
  const fixedBottomNavItems: NavItem[] = [
    { to: "/dashboard", icon: Home, label: "Accueil", type: 'link' },
    { to: "/messages", icon: MessageSquare, label: "Messages", type: 'link', badge: allNavItemsForDrawer.find(item => item.to === "/messages")?.badge || 0 },
    { icon: Search, label: "Recherche", type: 'trigger', onClick: onOpenGlobalSearch },
    {
      icon: User,
      label: "Profil",
      type: 'trigger',
      onClick: () => setIsProfileDrawerOpen(true),
    },
  ];

  // If not logged in, replace "Profile" with "Authentification"
  const dynamicFixedBottomNavItems: NavItem[] = currentUser
    ? fixedBottomNavItems
    : fixedBottomNavItems.map(item =>
        item.label === "Profil"
          ? { icon: LogIn, label: "Authentification", type: 'trigger', onClick: () => setIsAuthDrawerOpen(true) }
          : item
      );

  // Determine if "More" button should be shown
  const showMoreButton = getTopLevelDrawerItems().length > 0;

  const handleDrawerItemClick = (item: NavItem) => {
    if (item.type === 'link' && item.to) {
      navigate(item.to);
      setIsMoreDrawerOpen(false);
    } else if (item.type === 'trigger' && item.items) {
      // Save current state to history
      setDrawerHistory(prev => [...prev, { items: currentDrawerItems, title: drawerTitle, description: drawerDescription }]);
      // Navigate to sub-items
      setCurrentDrawerItems(item.items);
      setDrawerTitle(item.label);
      setDrawerDescription(item.description || `Options pour ${item.label}`);
      setSearchQuery(''); // Clear search when drilling down
    } else if (item.onClick) {
      item.onClick();
      setIsMoreDrawerOpen(false);
    }
  };

  const handleBackInDrawer = () => {
    const previousState = drawerHistory.pop();
    if (previousState) {
      setCurrentDrawerItems(previousState.items);
      setDrawerTitle(previousState.title);
      setDrawerDescription(previousState.description);
      setDrawerHistory([...drawerHistory]); // Update history to trigger re-render
      setSearchQuery(''); // Clear search when going back
    }
  };

  // Filter items for display in the drawer based on search query
  const filteredDisplayItems = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return currentDrawerItems;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return currentDrawerItems.filter(item =>
      item.label.toLowerCase().includes(lowerCaseQuery) ||
      (item.description && item.description.toLowerCase().includes(lowerCaseQuery)) ||
      (item.items && item.items.some(subItem => subItem.label.toLowerCase().includes(lowerCaseQuery)))
    );
  }, [currentDrawerItems, searchQuery]);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t backdrop-blur-lg bg-background/80 py-1 px-2 shadow-lg md:hidden">
        {dynamicFixedBottomNavItems.map((item: NavItem) => { // Explicitly type item as NavItem
          // Ensure item.to is only accessed if item.type is 'link'
          const isLinkActive = item.type === 'link' && item.to && (location.pathname + location.search).startsWith(item.to);

          if (item.type === 'link' && item.to) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center py-2 px-2 rounded-md text-xs font-medium transition-colors relative flex-shrink-0 w-1/5", // Use w-1/5 for even distribution
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
                className="flex flex-col items-center py-2 px-2 rounded-md text-xs font-medium transition-colors h-auto text-muted-foreground hover:text-foreground flex-shrink-0 w-1/5" // Use w-1/5
              >
                <item.icon className="h-5 w-5 mb-1" />
                {item.label}
              </Button>
            );
          }
          return null;
        })}

        {showMoreButton && (
          <Button
            variant="ghost"
            onClick={() => setIsMoreDrawerOpen(true)}
            className="flex flex-col items-center py-2 px-2 rounded-md text-xs font-medium transition-colors h-auto text-muted-foreground hover:text-foreground flex-shrink-0 w-1/5" // Use w-1/5
          >
            <MoreHorizontal className="h-5 w-5 mb-1" />
            Menu
          </Button>
        )}
      </div>

      {/* Profile/Settings Drawer for Mobile */}
      {currentUser && (
        <Drawer open={isProfileDrawerOpen} onOpenChange={setIsProfileDrawerOpen}>
          <DrawerContent className="h-auto mt-24 rounded-t-lg backdrop-blur-lg bg-background/80">
            <div className="mx-auto w-full max-w-sm">
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
                {/* Removed DrawerClose button as swipe-to-dismiss is enabled */}
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Authentication Drawer for Mobile */}
      {!currentUser && (
        <Drawer open={isAuthDrawerOpen} onOpenChange={setIsAuthDrawerOpen}>
          <DrawerContent className="h-auto mt-24 rounded-t-lg backdrop-blur-lg bg-background/80">
            <div className="mx-auto w-full max-w-sm">
              <AuthMenu onClose={() => setIsAuthDrawerOpen(false)} onLoginSuccess={handleAuthSuccess} />
              <DrawerFooter>
                {/* Removed DrawerClose button as swipe-to-dismiss is enabled */}
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* "More" Navigation Drawer for Mobile */}
      <Drawer open={isMoreDrawerOpen} onOpenChange={setIsMoreDrawerOpen}>
        <DrawerContent className="h-[90vh] mt-24 rounded-t-lg flex flex-col backdrop-blur-lg bg-background/80">
          <div className="mx-auto w-full max-w-md flex-grow flex flex-col">
            <DrawerHeader className="text-center">
              <div className="flex items-center justify-between">
                {drawerHistory.length > 0 && (
                  <Button variant="ghost" size="icon" onClick={handleBackInDrawer} className="absolute left-4">
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Retour</span>
                  </Button>
                )}
                <DrawerTitle className={cn("flex-grow text-center", drawerHistory.length > 0 ? "ml-8" : "")}>{drawerTitle}</DrawerTitle>
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" className="absolute right-4">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Fermer le menu</span>
                  </Button>
                </DrawerClose>
              </div>
              <DrawerDescription className="text-center">{drawerDescription}</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 border-b border-border">
              <Input
                placeholder="Rechercher dans le menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-2">
              {filteredDisplayItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Aucun élément trouvé pour "{searchQuery}".</p>
              ) : (
                filteredDisplayItems.map((item) => {
                  const isLinkActive = item.to && (location.pathname + location.search).startsWith(item.to);
                  return (
                    <Button
                      key={item.to || item.label}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start",
                        isLinkActive ? "bg-accent text-accent-foreground" : ""
                      )}
                      onClick={() => handleDrawerItemClick(item)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="ml-auto bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs">
                          {item.badge}
                        </span>
                      )}
                      {item.type === 'trigger' && item.items && (
                        <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  );
                })
              )}
            </div>
            <DrawerFooter>
              {/* No need for a close button here, as it's in the header and swipe-to-dismiss is enabled */}
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default BottomNavigationBar;