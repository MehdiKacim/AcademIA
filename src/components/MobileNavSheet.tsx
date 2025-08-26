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
// Keep only essential icons for now for diagnostic
import { ArrowLeft, X, Search, Menu, User, LogOut, Settings, Info, BookOpen, Sun, Moon, ChevronUp, ExternalLink, BotMessageSquare, SlidersHorizontal, MessageSquareQuote, ShieldCheck, Target } from "lucide-react";
import { NavItem, Profile } from "@/lib/dataModels";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useSwipeable } from 'react-swipeable';
import { useTheme } from 'next-themes';
import { ThemeToggle } from './theme-toggle';
import { motion, AnimatePresence } from 'framer-motion'; // Import framer-motion

// Map icon_name strings to Lucide React components (reduced for diagnostic)
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
  const { theme, setTheme } = useTheme();

  const [drawerNavStack, setDrawerNavStack] = useState<NavItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const swipeHandlers = useSwipeable({
    onSwipedDown: onClose,
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

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
      setSearchQuery('');
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
    setSearchQuery('');
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut();
    onClose();
    navigate("/");
  }, [signOut, onClose, navigate]);

  const handleToggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // Define virtual NavItems for profile actions
  const profileActions: NavItem[] = [
    { id: 'profile-view', label: 'Mon profil', icon_name: 'User', is_external: false, type: 'route', route: '/profile', order_index: 0 },
    { id: 'profile-settings', label: 'Paramètres', icon_name: 'Settings', is_external: false, type: 'route', route: '/settings', order_index: 1 },
    { id: 'profile-logout', label: 'Déconnexion', icon_name: 'LogOut', is_external: false, type: 'category_or_action', onClick: handleLogout, order_index: 2 },
  ];

  const currentItemsToDisplay = React.useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    let itemsToFilter: NavItem[] = [];

    if (drawerNavStack.length === 0) {
      itemsToFilter = navItems.filter(item => item.parent_nav_item_id === null || item.parent_nav_item_id === undefined);
    } else {
      const activeCategory = drawerNavStack[drawerNavStack.length - 1];
      // If the active category is the virtual "Mon Compte" category, show its actions
      if (activeCategory.id === 'profile-category') {
        itemsToFilter = profileActions;
      } else {
        itemsToFilter = activeCategory.children || [];
      }
    }

    // Add ThemeToggle and a virtual "Mon Compte" category at the root level
    if (drawerNavStack.length === 0 && currentUserProfile) {
      itemsToFilter.push(
        {
          id: 'theme-toggle-item',
          label: 'Thème',
          icon_name: theme === 'dark' ? 'Sun' : 'Moon',
          is_external: false,
          type: 'category_or_action',
          onClick: handleToggleTheme,
          order_index: 998,
        },
        {
          id: 'profile-category', // This is now a category
          label: 'Mon Compte',
          icon_name: 'User',
          is_external: false,
          type: 'category_or_action',
          children: profileActions, // Its children are the profile actions
          order_index: 999,
        }
      );
    }

    return itemsToFilter.filter(item =>
      item.label.toLowerCase().includes(lowerCaseQuery) ||
      (item.description && item.description.toLowerCase().includes(lowerCaseQuery))
    ).sort((a, b) => a.order_index - b.order_index);
  }, [navItems, drawerNavStack, searchQuery, currentUserProfile, theme, handleToggleTheme, profileActions]);

  const currentDrawerTitle = drawerNavStack.length > 0 ? drawerNavStack[drawerNavStack.length - 1].label : "Menu";
  const currentDrawerIconName = drawerNavStack.length > 0
    ? drawerNavStack[drawerNavStack.length - 1].icon_name
    : 'Menu'; // Default icon for the root "Menu"
  const CurrentDrawerIconComponent = iconMap[currentDrawerIconName || 'Info'] || Info; // Fallback to 'Info' if name is undefined

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="top"
        className="w-full h-[calc(100vh-68px)] flex flex-col p-0 backdrop-blur-lg bg-background/80 rounded-b-lg"
        {...swipeHandlers}
      >
        <div className="p-4 flex-shrink-0">
          <div className="android-search-bar mb-4">
            <Search className="h-5 w-5 text-android-on-surface-variant" />
            <Input
              placeholder={drawerNavStack.length > 0 ? `Rechercher dans ${currentDrawerTitle}...` : "Rechercher une catégorie ou un élément..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full !p-0 !bg-transparent !border-none !ring-0 !shadow-none"
            />
          </div>

          <div className="flex items-center justify-between">
            {drawerNavStack.length > 0 ? (
              <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full h-10 w-10">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Retour</span>
              </Button>
            ) : (
              <div className="w-10 h-10"></div> {/* Placeholder to keep alignment */}
            )}
            <SheetTitle className="flex-grow text-center flex items-center justify-center gap-2">
              {/* Dynamic icon and title */}
              {React.createElement(CurrentDrawerIconComponent, { className: "h-6 w-6 text-primary" })}
              {currentDrawerTitle}
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10">
              <X className="h-5 w-5" />
              <span className="sr-only">Fermer le menu</span>
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-grow p-4">
          <motion.div 
            key={drawerNavStack.length} // Key change to trigger exit/enter animations
            initial={{ opacity: 0, x: drawerNavStack.length > 0 ? 50 : -50 }} // Slide in from right if deeper, left if shallower
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: drawerNavStack.length > 0 ? -50 : 50 }} // Slide out to left if deeper, right if shallower
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-4"
          >
            {currentItemsToDisplay.length === 0 && searchQuery.trim() !== '' ? (
              <p className="text-muted-foreground text-center py-4 col-span-full">Aucun élément trouvé pour "{searchQuery}".</p>
            ) : currentItemsToDisplay.length === 0 && searchQuery.trim() === '' ? (
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
                      "android-tile flex-col items-start justify-start h-auto min-h-[100px] text-left w-full",
                      isLinkActive ? "active" : "",
                      "transition-all duration-200 ease-in-out"
                    )}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="icon-container">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span className="title text-base font-medium line-clamp-2">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs leading-none">
                        {item.badge}
                      </span>
                    )}
                    {item.is_external && <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />}
                    {isCategory && <ChevronUp className="h-4 w-4 ml-auto text-muted-foreground rotate-90" />} {/* Indicate category */}
                  </Button>
                );
              })
            )}
          </motion.div>
        </ScrollArea>

        <div className="p-4 border-t border-border flex-shrink-0 space-y-2">
          <div className="flex justify-between gap-2">
            {currentUserProfile ? (
              <Button variant="destructive" className="android-footer-button flex-grow" onClick={handleLogout}>
                <LogOut className="h-5 w-5" /> Déconnexion
              </Button>
            ) : (
              <Button variant="default" className="android-footer-button flex-grow" onClick={onOpenAuthModal}>
                <User className="h-5 w-5" /> Se connecter
              </Button>
            )}
            <Button variant="outline" className="android-footer-button flex-grow" onClick={onOpenAboutModal}>
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