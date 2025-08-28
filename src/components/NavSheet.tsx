import React, { useState, useCallback, useEffect } from 'react';
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

const iconMap: { [key: string]: React.ElementType } = {
  Home: Home, MessageSquare: MessageSquare, Search: Search, User: User, LogOut: LogOut, Settings: Settings, Info: Info, BookOpen: BookOpen, Sun: Sun, Moon: Moon, ChevronUp: ChevronUp, ExternalLink: ExternalLink, Menu: Menu, BotMessageSquare: BotMessageSquare, SlidersHorizontal: SlidersHorizontal, MessageSquareQuote: MessageSquareQuote, ShieldCheck: ShieldCheck, Target: Target, BellRing: BellRing, ChevronDown: ChevronDown,
};

interface NavSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
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
  onOpenChange,
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

  const swipeHandlers = useSwipeable({
    onSwipedUp: () => { // Swipe UP to OPEN (for bottom sheet)
      if (isMobile && !isOpen) { // If mobile and sheet is currently closed
        onOpenChange(true); // Call onOpenChange to open it
      }
    },
    onSwipedDown: () => { // Swipe DOWN to CLOSE (for bottom sheet)
      if (isMobile && isOpen) { // If mobile and sheet is currently open
        onOpenChange(false); // Call onOpenChange to close it
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

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
        // Add "Messagerie" as a top-level item
        itemsToFilter.push({ id: 'nav-messages', label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', is_external: false, type: 'route', order_index: 100, badge: unreadMessagesCount });
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
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom" // Changed to bottom
        className={cn(
          "w-full flex flex-col p-0 backdrop-blur-lg bg-background/80 rounded-t-lg", // Changed rounded-b-lg to rounded-t-lg
          isMobile ? "h-full" : "h-[calc(100vh-68px)]", // Keep height logic
          isMobile ? "bottom-0" : "top-[68px]" // Adjust position for mobile bottom sheet
        )}
        {...swipeHandlers}
      >
        <SheetHeader className="p-4 flex-shrink-0 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {drawerNavStack.length > 0 ? (
                <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full h-10 w-10 bg-muted/20 hover:bg-muted/40">
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">Retour</span>
                </Button>
              ) : (
                <div className="w-10 h-10"></div>
              )}
            </div>

            {/* Placeholder for right side to maintain spacing */}
            <div className="w-10 h-10"></div> 
          </div >
          <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
          <SheetDescription className="sr-only">Accédez aux différentes sections de l'application.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-grow p-4">
          {drawerNavStack.length > 0 && (
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <CurrentDrawerIconComponent className="h-6 w-6 text-primary" />
              {currentDrawerTitle}
            </h2>
          )}
          <motion.div
            key={drawerNavStack.length}
            initial={{ opacity: 0, x: drawerNavStack.length > 0 ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: drawerNavStack.length > 0 ? -50 : 50 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4"
          >
            {currentItemsToDisplay.length === 0 ? ( // Simplified condition
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
                      "android-tile flex-row items-center justify-start h-auto min-h-[60px] text-left w-full",
                      "rounded-android-tile hover:scale-[1.02] transition-transform",
                      isLinkActive ? "active" : "",
                      "transition-all duration-200 ease-in-out"
                    )}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="icon-container rounded-lg mr-3">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span className="title text-base font-medium line-clamp-2 flex-grow">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs leading-none">
                        {item.badge}
                      </span>
                    )}
                    {item.is_external && <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />}
                    {isCategory && <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground rotate-90" />}
                  </Button>
                );
              })
            )}
          </motion.div>
        </ScrollArea>

        {/* Bottom action bar - Simplified */}
        <div className="p-4 border-t border-border flex-shrink-0 space-y-2">
          {isMobile && (
            <div className="flex justify-center pt-2">
              <div className="w-1/4 h-1 bg-muted-foreground rounded-full" />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NavSheet;