import React, { useState, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, X, Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, Link as LinkIcon, ExternalLink, BarChart2 } from "lucide-react";
import { NavItem, Profile } from "@/lib/dataModels";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useSwipeable } from 'react-swipeable'; // Import useSwipeable

// Map icon_name strings to Lucide React components
const iconMap: { [key: string]: React.ElementType } = {
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, LinkIcon, ExternalLink, BarChart2
};

interface MobileNavSheetProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[]; // Full structured nav items for the current user's role
  onOpenGlobalSearch: () => void;
  onOpenAboutModal: () => void;
  onOpenAuthModal: () => void;
  unreadMessagesCount: number;
}

const MobileNavSheet = ({ isOpen, onClose, navItems, onOpenGlobalSearch, onOpenAboutModal, onOpenAuthModal, unreadMessagesCount }: MobileNavSheetProps) => {
  const { currentUserProfile, signOut } = useRole();
  const navigate = useNavigate();
  const location = useLocation();

  const [drawerNavStack, setDrawerNavStack] = useState<NavItem[]>([]); // Stack for nested navigation
  const [searchQuery, setSearchQuery] = useState('');

  // Swipe handlers for closing the sheet on mobile
  const swipeHandlers = useSwipeable({
    onSwipedDown: onClose, // Close the sheet when swiped down
    preventScrollOnSwipe: true,
    trackMouse: true, // For testing on desktop
  });

  // Reset stack and search when sheet opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setDrawerNavStack([]);
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleItemClick = useCallback((item: NavItem) => {
    const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);

    if (isCategory) {
      setDrawerNavStack(prevStack => [...prevStack, item]);
      setSearchQuery(''); // Clear search when entering a category
    } else if (item.route) {
      if (item.is_external) {
        window.open(item.route, '_blank');
      } else if (item.route.startsWith('#')) {
        // Handle hash links for the Index page
        navigate(`/${item.route}`);
      } else {
        navigate(item.route);
      }
      onClose(); // Close sheet after navigation
    } else if (item.onClick) {
      item.onClick();
      if (item.label !== "Recherche") { // Keep search overlay open if it's the search button
        onClose();
      }
    }
  }, [navigate, onClose]);

  const handleBack = useCallback(() => {
    setDrawerNavStack(prevStack => {
      const newStack = [...prevStack];
      newStack.pop();
      return newStack;
    });
    setSearchQuery(''); // Clear search when going back
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut();
    onClose();
    navigate("/");
  }, [signOut, onClose, navigate]);

  const currentItemsToDisplay = React.useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    let itemsToFilter: NavItem[] = [];

    if (drawerNavStack.length === 0) {
      itemsToFilter = navItems.filter(item => item.parent_nav_item_id === null || item.parent_nav_item_id === undefined);
    } else {
      const activeCategory = drawerNavStack[drawerNavStack.length - 1];
      itemsToFilter = activeCategory.children || [];
    }

    return itemsToFilter.filter(item =>
      item.label.toLowerCase().includes(lowerCaseQuery) ||
      (item.description && item.description.toLowerCase().includes(lowerCaseQuery))
    ).sort((a, b) => a.order_index - b.order_index);
  }, [navItems, drawerNavStack, searchQuery]);

  const currentDrawerTitle = drawerNavStack.length > 0 ? drawerNavStack[drawerNavStack.length - 1].label : "Menu";
  const currentDrawerIcon = drawerNavStack.length > 0 ? iconMap[drawerNavStack[drawerNavStack.length - 1].icon_name || 'Info'] : null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="top" // Changed from "left" to "top"
        className="w-full h-[calc(100vh-68px)] flex flex-col p-0 backdrop-blur-lg bg-background/80 rounded-b-lg" // Adjusted height and added rounded-b-lg
        {...swipeHandlers} // Apply swipe handlers here
      >
        <SheetHeader className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            {drawerNavStack.length > 0 ? (
              <Button variant="ghost" size="icon" onClick={handleBack} className="absolute left-4">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Retour</span>
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={onClose} className="absolute left-4">
                <X className="h-5 w-5" />
                <span className="sr-only">Fermer le menu</span>
              </Button>
            )}
            <SheetTitle className="flex-grow text-center flex items-center justify-center gap-2">
              {currentDrawerIcon && React.createElement(currentDrawerIcon, { className: "h-6 w-6 text-primary" })}
              {currentDrawerTitle}
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-4">
              <X className="h-5 w-5" />
              <span className="sr-only">Fermer le menu</span>
            </Button>
          </div>
          <SheetDescription className="text-center">
            {drawerNavStack.length > 0 ? `Éléments de la catégorie ${currentDrawerTitle}` : "Toutes les options de navigation."}
          </SheetDescription>
        </SheetHeader>

        {currentUserProfile && (
          <div className="p-4 border-b border-border flex-shrink-0">
            <Input
              placeholder={drawerNavStack.length > 0 ? `Rechercher dans ${currentDrawerTitle}...` : "Rechercher une catégorie ou un élément..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
        )}

        <ScrollArea className="flex-grow p-4">
          <div className="grid grid-cols-1 gap-3">
            {currentItemsToDisplay.length === 0 && searchQuery.trim() !== '' ? (
              <p className="text-muted-foreground text-center py-4">Aucun élément trouvé pour "{searchQuery}".</p>
            ) : currentItemsToDisplay.length === 0 && searchQuery.trim() === '' ? (
              <p className="text-muted-foreground text-center py-4">Aucun élément de menu configuré pour ce rôle.</p>
            ) : (
              currentItemsToDisplay.map((item) => {
                const IconComponent = iconMap[item.icon_name || 'Info'] || Info;
                const isLinkActive = item.route && (location.pathname + location.search).startsWith(item.route);

                return (
                  <Button
                    key={item.id}
                    variant="outline"
                    className={cn(
                      "flex items-center justify-start h-auto py-3 px-4 text-left w-full",
                      isLinkActive ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent hover:text-accent-foreground",
                      "transition-all duration-200 ease-in-out"
                    )}
                    onClick={() => handleItemClick(item)}
                  >
                    <IconComponent className="h-5 w-5 mr-3" />
                    <span className="text-base font-medium flex-grow text-left">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs leading-none">
                        {item.badge}
                      </span>
                    )}
                    {item.is_external && <ExternalLink className="h-4 w-4 ml-2 text-muted-foreground" />}
                  </Button>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border flex-shrink-0 space-y-2">
          {currentUserProfile ? (
            <Button variant="destructive" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Déconnexion
            </Button>
          ) : (
            <Button variant="default" className="w-full" onClick={onOpenAuthModal}>
              <User className="mr-2 h-4 w-4" /> Se connecter
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={onOpenAboutModal}>
            <Info className="mr-2 h-4 w-4" /> À propos
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavSheet;