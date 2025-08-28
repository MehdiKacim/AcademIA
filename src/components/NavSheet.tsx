import React, { useState, useCallback, useEffect } from 'react';
import {
  // Removed SheetHeader, SheetTitle, SheetDescription imports as they are no longer used directly
} from "@/components/ui/sheet"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, X, Search, Menu, User, LogOut, Settings, Info, BookOpen, Sun, Moon, ChevronUp, ExternalLink, BotMessageSquare, SlidersHorizontal, MessageSquareQuote, ShieldCheck, Target, Home, MessageSquare, BellRing, ChevronDown } from "lucide-react";
import { NavItem, Profile } from "@/lib/dataModels";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useSwipeable } from 'react-swipeable';
import { useTheme } from 'next-themes';
import { ThemeToggle } from './theme-toggle';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from './Logo';
import { useCourseChat } from '@/contexts/CourseChatContext';
import MobileBottomNavContent from './MobileBottomNavContent'; // Import MobileBottomNavContent
import MobileDrawer from './MobileDrawer'; // Import the new custom drawer

const iconMap: { [key: string]: React.ElementType } = {
  Home: Home, MessageSquare: MessageSquare, Search: Search, User: User, LogOut: LogOut, Settings: Settings, Info: Info, BookOpen: BookOpen, Sun: Sun, Moon: Moon, ChevronUp: ChevronUp, ExternalLink: ExternalLink, Menu: Menu, BotMessageSquare: BotMessageSquare, SlidersHorizontal: SlidersHorizontal, MessageSquareQuote: MessageSquareQuote, ShieldCheck: ShieldCheck, Target: Target, BellRing: BellRing, ChevronDown: ChevronDown,
};

interface NavSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void; // Renamed prop
  navItems: NavItem[]; // Full nav tree
  onOpenGlobalSearch: () => void;
  onOpenAiAChat: () => void;
  onOpenAuthModal: () => void;
  unreadMessagesCount: number;
  onInitiateThemeChange: (newTheme: Profile['theme']) => void;
  isMobile: boolean; // To differentiate mobile vs desktop behavior
}

const NavSheet = ({
  isOpen,
  onOpenChange, // Renamed prop
  navItems,
  onOpenGlobalSearch,
  onOpenAiAChat,
  onOpenAuthModal,
  unreadMessagesCount,
  onInitiateThemeChange,
  isMobile,
}: NavSheetProps) => {
  const { currentUserProfile, signOut } = useRole();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { openChat } = useCourseChat();

  const [drawerNavStack, setDrawerNavStack] = useState<NavItem[]>([]);

  // No longer need swipeHandlers here, they are in MobileDrawer

  // Reset stack when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setDrawerNavStack([]);
    }
  }, [isOpen]);

  const handleItemClick = useCallback((item: NavItem) => {
    const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);

    if (isCategory) {
      setDrawerNavStack(prevStack => [...prevStack, item]);
    } else if (item.route) {
      if (item.is_external) {
        window.open(item.route, '_blank');
      } else if (item.route.startsWith('#')) {
        navigate(`/${item.route}`);
      } else {
        navigate(item.route);
      }
      onOpenChange(false); // Close the sheet after navigation
    } else if (item.onClick) {
      if (item.id === 'nav-global-search') {
        onOpenGlobalSearch();
      } else if (item.id === 'nav-aia-chat') {
        onOpenAiAChat();
      } else {
        item.onClick();
      }
      onOpenChange(false); // Close the sheet after action
    }
  }, [navigate, onOpenChange, onOpenGlobalSearch, onOpenAiAChat]);

  const handleBack = useCallback(() => {
    setDrawerNavStack(prevStack => {
      const newStack = [...prevStack];
      newStack.pop();
      return newStack;
    });
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut();
    onOpenChange(false);
    navigate("/");
  }, [signOut, onOpenChange, navigate]);

  const staticProfileActions: NavItem[] = [
    { id: 'profile-view', label: 'Mon profil', icon_name: 'User', is_external: false, type: 'route', route: '/profile', order_index: 0 },
    { id: 'profile-settings', label: 'Paramètres', icon_name: 'Settings', is_external: false, type: 'route', route: '/settings', order_index: 1 },
    { id: 'profile-logout', label: 'Déconnexion', icon_name: 'LogOut', is_external: false, type: 'category_or_action', onClick: handleLogout, order_index: 2 },
  ];

  const currentItemsToDisplay = React.useMemo(() => {
    let itemsToFilter: NavItem[] = [];

    if (drawerNavStack.length === 0) {
      // For mobile, if stack is empty, show top-level items
      itemsToFilter = navItems.filter(item =>
        (item.parent_nav_item_id === null || item.parent_nav_item_id === undefined)
      );
      if (currentUserProfile) {
        // Add "Mon Compte" as a category in the main list
        itemsToFilter.push({
          id: 'profile-category',
          label: 'Mon Compte',
          icon_name: 'User',
          is_external: false,
          type: 'category_or_action',
          children: staticProfileActions,
          order_index: 999,
        });
        // Removed "Messagerie" as a top-level item here, it's now in MobileBottomNavContent
      }
    } else {
      // For mobile, show children of the active category
      const activeCategory = drawerNavStack[drawerNavStack.length - 1];
      if (activeCategory?.id === 'profile-category') {
        itemsToFilter = staticProfileActions;
      } else {
        itemsToFilter = (activeCategory && Array.isArray(activeCategory.children)) ? activeCategory.children : [];
      }
    }

    return itemsToFilter.sort((a, b) => a.order_index - b.order_index);
  }, [navItems, drawerNavStack, currentUserProfile, staticProfileActions, unreadMessagesCount]);

  const currentDrawerTitle = drawerNavStack.length > 0 ? drawerNavStack[drawerNavStack.length - 1].label : "Menu";
  const currentDrawerIconName = drawerNavStack.length > 0
    ? drawerNavStack[drawerNavStack.length - 1].icon_name
    : 'Menu';
  const CurrentDrawerIconComponent = iconMap[currentDrawerIconName || 'Info'] || Info;

  return (
    <MobileDrawer isOpen={isOpen} onClose={() => onOpenChange(false)}>
      <div className="p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {drawerNavStack.length > 0 ? (
              <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full h-10 w-10 bg-muted/20 hover:bg-muted/40">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Retour</span>
              </Button>
            ) : (
              <div className="h-10 w-10" /> 
            )}
            <CurrentDrawerIconComponent className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">{currentDrawerTitle}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full h-10 w-10 bg-muted/20 hover:bg-muted/40">
            <X className="h-5 w-5" />
            <span className="sr-only">Fermer le menu</span>
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-grow p-4">
        {currentUserProfile && drawerNavStack.length === 0 && (
          <div 
            className="flex items-center gap-3 p-4 mb-4 bg-muted/15 rounded-lg shadow-sm cursor-pointer hover:bg-muted/20 transition-colors duration-200 ease-in-out"
            onClick={() => {
              navigate("/profile");
              onOpenChange(false);
            }}
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentUserProfile.first_name} ${currentUserProfile.last_name}`} />
              <AvatarFallback>{currentUserProfile.first_name[0]}{currentUserProfile.last_name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <p className="font-semibold text-lg">{currentUserProfile.first_name} {currentUserProfile.last_name}</p>
              <p className="text-sm text-muted-foreground">{currentUserProfile.email}</p>
            </div>
            <Button variant="ghost" size="sm" className="flex-shrink-0">
              <User className="h-4 w-4 mr-2" /> Voir le profil
            </Button>
          </div>
        )}
        <motion.div
          key={drawerNavStack.length}
          initial={{ opacity: 0, x: drawerNavStack.length > 0 ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: drawerNavStack.length > 0 ? -50 : 50 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4"
        >
          {currentItemsToDisplay.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 col-span-full">Aucun élément de menu configuré pour ce rôle.</p>
          ) : (
            currentItemsToDisplay.map((item) => {
              const IconComponent = iconMap[item.icon_name || 'Info'] || Info;
              const isLinkActive = item.route && (location.pathname + location.search).startsWith(item.route);
              const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "flex flex-row items-center justify-start h-auto min-h-[60px] text-left w-full px-3 py-2 rounded-lg shadow-sm", // Adjusted min-height, padding, and rounded-lg, added shadow-sm
                    "hover:bg-muted/20 hover:shadow-md transition-all duration-200 ease-in-out", // Subtle hover with shadow
                    isLinkActive ? "bg-primary/20 text-primary font-semibold shadow-md border-l-4 border-primary" : "text-foreground", // Active state with stronger background and shadow
                    isCategory ? "bg-muted/15" : "" // Subtle background for categories
                  )}
                  onClick={() => handleItemClick(item)}
                >
                  <div className={cn("flex items-center justify-center rounded-md mr-3", isLinkActive ? "bg-primary/30" : "bg-muted/20")}> {/* Smaller rounded-md for icon container */}
                    <IconComponent className="h-6 w-6" /> {/* Slightly larger icon */}
                  </div>
                  <span className="title text-base font-medium line-clamp-2 flex-grow">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs leading-none">
                      {item.badge}
                    </span>
                  )}
                  {item.is_external && <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />}
                  {isCategory && <ChevronDown className={cn("h-4 w-4 ml-auto text-muted-foreground transition-transform duration-200", drawerNavStack.some(d => d.id === item.id) ? "rotate-180" : "rotate-90")} />}
                </Button>
              );
            })
          )}
        </motion.div>
      </ScrollArea>

      {/* New Footer for NavSheet */}
      <div className="p-4 border-t border-border flex-shrink-0 flex items-center justify-between">
        <Button variant="ghost" onClick={() => { navigate('/about'); onOpenChange(false); }} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <Info className="h-5 w-5" /> À propos
        </Button>
        <ThemeToggle onInitiateThemeChange={onInitiateThemeChange} />
      </div>
    </MobileDrawer>
  );
};

export default NavSheet;