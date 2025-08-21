import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom"; // Import useNavigate
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft, MessageSquare, User, Settings, LogOut, LogIn } from "lucide-react"; // Import User, Settings, LogOut, LogIn
import { NavItem } from "@/lib/dataModels";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
  DrawerTrigger,
} from "@/components/ui/drawer"; // Import Drawer components
import { useRole } from "@/contexts/RoleContext"; // Corrected import path
import AuthMenu from "./AuthMenu"; // Import the new AuthMenu component

interface BottomNavigationBarProps {
  navItems: NavItem[];
  onOpenGlobalSearch?: () => void;
  currentUser: any; // Profile type
}

const BottomNavigationBar = ({ navItems, onOpenGlobalSearch, currentUser }: BottomNavigationBarProps) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate
  const { signOut } = useRole(); // Get signOut from useRole

  const [currentMobileNavLevel, setCurrentMobileNavLevel] = useState<string | null>(null);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false); // State for the profile drawer
  const [isAuthDrawerOpen, setIsAuthDrawerOpen] = useState(false); // New state for auth drawer

  if (!isMobile) {
    return null; // Do not display on non-mobile screens
  }

  const handleLogout = async () => { // Make it async
    await signOut(); // Call the signOut function from context
    navigate("/");
    setIsProfileDrawerOpen(false); // Close drawer after logout
  };

  const handleAuthSuccess = () => {
    setIsAuthDrawerOpen(false); // Close auth drawer on success
    navigate("/dashboard"); // Redirect to dashboard after login/signup
  };

  const activeParentTrigger = navItems.find(item => item.label === currentMobileNavLevel && item.type === 'trigger');

  let itemsToRender: NavItem[] = [];

  if (activeParentTrigger && activeParentTrigger.items) {
    itemsToRender = [
      {
        icon: ArrowLeft,
        label: "Retour",
        type: 'trigger',
        onClick: () => setCurrentMobileNavLevel(null),
      },
      ...activeParentTrigger.items.map(subItem => ({ ...subItem, type: 'link' as const, icon: subItem.icon })),
    ];
  } else {
    itemsToRender = navItems.map(item => {
      if (item.type === 'trigger' && item.items) {
        return {
          ...item,
          onClick: () => setCurrentMobileNavLevel(item.label),
          to: undefined,
        };
      }
      return item;
    });
    // Add a dedicated profile/settings button to the main mobile nav
    if (currentUser) {
      itemsToRender.push({
        icon: User,
        label: "Profil",
        type: 'trigger', // Use trigger to open the drawer
        onClick: () => setIsProfileDrawerOpen(true),
      });
    } else {
      // Add "Authentification" button for unauthenticated users
      itemsToRender.push({
        icon: LogIn,
        label: "Connexion", // Changed label to "Connexion" for simplicity
        type: 'trigger',
        onClick: () => setIsAuthDrawerOpen(true),
      });
    }
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center border-t backdrop-blur-lg bg-background/80 py-1 px-2 shadow-lg md:hidden overflow-x-auto flex-nowrap">
        {itemsToRender.map((item) => {
          if (item.type === 'link' && item.to) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center py-2 px-2 rounded-md text-xs font-medium transition-colors relative flex-shrink-0 min-w-[80px]",
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
                className="flex flex-col items-center py-2 px-2 rounded-md text-xs font-medium transition-colors h-auto text-muted-foreground hover:text-foreground flex-shrink-0 min-w-[80px]"
              >
                <item.icon className="h-5 w-5 mb-1" />
                {item.label}
              </Button>
            );
          }
          return null;
        })}

        {onOpenGlobalSearch && !activeParentTrigger && currentUser && ( // Only show search if logged in
          <Button
            variant="ghost"
            onClick={onOpenGlobalSearch}
            className="flex flex-col items-center py-2 px-2 rounded-md text-xs font-medium transition-colors h-auto text-muted-foreground hover:text-foreground flex-shrink-0 min-w-[80px]"
          >
            <Search className="h-5 w-5 mb-1" />
            Recherche
          </Button>
        )}
      </div>

      {/* Profile/Settings Drawer for Mobile */}
      {currentUser && (
        <Drawer open={isProfileDrawerOpen} onOpenChange={setIsProfileDrawerOpen}>
          {/* The DrawerTrigger is handled by the 'Profil' button's onClick */}
          <DrawerContent className="h-auto mt-24 rounded-t-lg">
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
                  className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                </Button>
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline">Fermer</Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Authentication Drawer for Mobile */}
      {!currentUser && (
        <Drawer open={isAuthDrawerOpen} onOpenChange={setIsAuthDrawerOpen}>
          <DrawerContent className="h-auto mt-24 rounded-t-lg">
            <div className="mx-auto w-full max-w-sm">
              <AuthMenu onClose={() => setIsAuthDrawerOpen(false)} onLoginSuccess={handleAuthSuccess} />
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline">Fermer</Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
};

export default BottomNavigationBar;