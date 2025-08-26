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
import { ArrowLeft, X, Search, Menu, User, LogOut, Settings, Info, BookOpen, Sun, Moon, ChevronUp, ExternalLink, BotMessageSquare, SlidersHorizontal, MessageSquareQuote, ShieldCheck, Target, Home, MessageSquare, BellRing } from "lucide-react"; // Added BellRing
import { NavItem, Profile } from "@/lib/dataModels";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useSwipeable } from 'react-swipeable';
import { useTheme } from 'next-themes';
import { ThemeToggle } from './theme-toggle';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar components

const iconMap: { [key: string]: React.ElementType } = {
  Home: Home,
  MessageSquare: MessageSquare,
  Search: Search,
  User: User,
  LogOut: LogOut,
  Settings: Settings,
  Info: Info,
  BookOpen: BookOpen,
  Sun: Sun,
  Moon: Moon,
  ChevronUp: ChevronUp,
  ExternalLink: ExternalLink,
  Menu: Menu,
  BotMessageSquare: BotMessageSquare,
  SlidersHorizontal: SlidersHorizontal,
  MessageSquareQuote: MessageSquareQuote,
  ShieldCheck: ShieldCheck,
  Target: Target,
  BellRing: BellRing, // Added BellRing to iconMap
};

interface MobileNavSheetProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  onOpenGlobalSearch: () => void;
  onOpenAboutModal: () => void;
  onOpenAuthModal: () => void;
  unreadMessagesCount: number;
}

const MobileNavSheet = ({ isOpen, onClose, navItems, onOpenGlobalSearch, onOpenAboutModal, onOpenAuthModal, unreadMessagesCount }: MobileNavSheetProps) => {
  const { currentUserProfile, signOut } = useRole();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const [drawerNavStack, setDrawerNavStack] = useState<NavItem[]>([]);
  // Removed searchQuery state

  const swipeHandlers = useSwipeable({
    onSwipedDown: onClose,
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  React.useEffect(() => {
    if (!isOpen) {
      setDrawerNavStack([]);
      // Removed setSearchQuery('');
    }
  }, [isOpen]);

  const handleItemClick = useCallback((item: NavItem) => {
    const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);

    if (isCategory) {
      setDrawerNavStack(prevStack => [...prevStack, item]);
      // Removed setSearchQuery('');
    } else if (item.route) {
      if (item.is_external) {
        window.open(item.route, '_blank');
      } else if (item.route.startsWith('#')) {
        navigate(`/${item.route}`);
      } else {
        navigate(item.route);
      }
      onClose();
    } else if (item.onClick) {
      item.onClick();
      if (item.label !== "Recherche") {
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
    // Removed searchQuery state
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut();
    onClose();
    navigate("/");
  }, [signOut, onClose, navigate]);

  // Define static NavItems for profile actions
  const staticProfileActions: NavItem[] = [
    { id: 'profile-view', label: 'Mon profil', icon_name: 'User', is_external: false, type: 'route', route: '/profile', order_index: 0 },
    { id: 'profile-settings', label: 'Paramètres', icon_name: 'Settings', is_external: false, type: 'route', route: '/settings', order_index: 1 },
    { id: 'profile-logout', label: 'Déconnexion', icon_name: 'LogOut', is_external: false, type: 'category_or_action', onClick: handleLogout, order_index: 2 },
  ];

  // Define static top-level items (excluding Messages and Notifications, now in header)
  const staticTopLevelItems: NavItem[] = [];

  const currentItemsToDisplay = React.useMemo(() => {
    let itemsToFilter: NavItem[] = [];

    if (drawerNavStack.length === 0) {
      // Combine dynamic navItems with static top-level items
      itemsToFilter = [...navItems.filter(item => 
        (item.parent_nav_item_id === null || item.parent_nav_item_id === undefined)
      ), ...staticTopLevelItems];

      if (currentUserProfile) {
        itemsToFilter.push({
          id: 'profile-category',
          label: 'Mon Compte',
          icon_name: 'User',
          is_external: false,
          type: 'category_or_action',
          children: staticProfileActions, // Use static profile actions
          order_index: 999,
        });
      }
    } else {
      const activeCategory = drawerNavStack[drawerNavStack.length - 1];
      if (activeCategory.id === 'profile-category') {
        itemsToFilter = staticProfileActions; // Always show static profile actions
      } else {
        itemsToFilter = activeCategory.children || [];
      }
    }
    
    return itemsToFilter.sort((a, b) => a.order_index - b.order_index);
  }, [navItems, drawerNavStack, currentUserProfile, staticProfileActions, staticTopLevelItems]);

  const currentDrawerTitle = drawerNavStack.length > 0 ? drawerNavStack[drawerNavStack.length - 1].label : "Menu";
  const currentDrawerIconName = drawerNavStack.length > 0
    ? drawerNavStack[drawerNavStack.length - 1].icon_name
    : 'Menu';
  const CurrentDrawerIconComponent = iconMap[currentDrawerIconName || 'Info'] || Info;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="top"
        className="w-full h-full flex flex-col p-0 backdrop-blur-lg bg-background/80 rounded-b-lg"
        {...swipeHandlers}
      >
        {/* Custom Header for Mobile Nav Sheet */}
        <div className="p-4 flex-shrink-0 border-b border-border">
          <div className="flex items-center justify-between">
            {/* Left side: Back button and current menu label */}
            <div className="flex items-center gap-2">
              {drawerNavStack.length > 0 ? (
                <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full h-10 w-10">
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">Retour</span>
                </Button>
              ) : (
                <div className="w-10 h-10"></div> // Placeholder for alignment
              )}
              <span className="text-sm font-medium text-muted-foreground">
                {currentDrawerTitle}
              </span>
            </div>

            {/* Right side: Quick access items */}
            <div className="flex items-center gap-2">
              {currentUserProfile && (
                <>
                  {/* Messages with badge */}
                  <Button variant="ghost" size="icon" onClick={() => handleItemClick({ id: 'static-messages', label: 'Messagerie', icon_name: 'MessageSquare', is_external: false, type: 'route', route: '/messages', order_index: 100, badge: unreadMessagesCount })} className="relative">
                    <MessageSquare className="h-5 w-5" />
                    {unreadMessagesCount > 0 && (
                      <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
                        {unreadMessagesCount}
                      </span>
                    )}
                    <span className="sr-only">Messagerie</span>
                  </Button>
                  {/* User Profile/Account (Avatar/Name) */}
                  <Button variant="ghost" size="icon" onClick={() => handleItemClick({ id: 'profile-category', label: 'Mon Compte', icon_name: 'User', is_external: false, type: 'category_or_action', children: staticProfileActions, order_index: 999 })} className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentUserProfile.first_name} ${currentUserProfile.last_name}`} />
                      <AvatarFallback>{currentUserProfile.first_name[0]}{currentUserProfile.last_name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Mon Compte</span>
                  </Button>
                </>
              )}
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10">
                <X className="h-5 w-5" />
                <span className="sr-only">Fermer</span>
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-grow p-4">
          <motion.div 
            key={drawerNavStack.length}
            initial={{ opacity: 0, x: drawerNavStack.length > 0 ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: drawerNavStack.length > 0 ? -50 : 50 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-4"
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
                      "android-tile flex-col items-start justify-start h-auto min-h-[80px] text-left w-full",
                      "rounded-android-tile",
                      isLinkActive ? "active" : "",
                      "transition-all duration-200 ease-in-out"
                    )}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="icon-container">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span className="title text-base font-medium line-clamp-2">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && ( // Apply badge to messages
                      <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs leading-none">
                        {item.badge}
                      </span>
                    )}
                    {item.is_external && <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />}
                    {isCategory && <ChevronUp className="h-4 w-4 ml-auto text-muted-foreground rotate-90" />}
                  </Button>
                );
              })
            )}
          </motion.div>
        </ScrollArea>

        <div className="p-4 border-t border-border flex-shrink-0 space-y-2">
          <div className="flex justify-between gap-2">
            {currentUserProfile ? (
              <Button variant="destructive" className="android-footer-button flex-grow rounded-android-tile" onClick={handleLogout}>
                <LogOut className="h-5 w-5" /> Déconnexion
              </Button>
            ) : (
              <Button variant="default" className="android-footer-button flex-grow rounded-android-tile" onClick={onOpenAuthModal}>
                <User className="h-5 w-5" /> Se connecter
              </Button>
            )}
            <Button variant="outline" className="android-footer-button flex-grow rounded-android-tile" onClick={onOpenAboutModal}>
              <Info className="h-5 w-5" /> À propos
            </Button>
          </div>
          <div className="flex justify-center pt-2">
            <div className="w-1/4 h-1 bg-muted-foreground rounded-full" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavSheet;