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
import { ArrowLeft, X, Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, Link as LinkIcon, ExternalLink, BarChart2, Wifi, Bluetooth, Moon, Sun, Flashlight } from "lucide-react";
import { NavItem, Profile } from "@/lib/dataModels";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useSwipeable } from 'react-swipeable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTheme } from 'next-themes';
import { ThemeToggle } from './theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Map icon_name strings to Lucide React components
const iconMap: { [key: string]: React.ElementType } = {
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, LinkIcon, ExternalLink, BarChart2, Wifi, Bluetooth, Moon, Sun, Flashlight
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
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Swipe handlers for closing the sheet on mobile
  const swipeHandlers = useSwipeable({
    onSwipedDown: onClose,
    preventScrollOnSwipe: true,
    trackMouse: true,
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

  // Moved handleToggleTheme here
  const handleToggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const currentItemsToDisplay = React.useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    let itemsToFilter: NavItem[] = [];

    if (drawerNavStack.length === 0) {
      itemsToFilter = navItems.filter(item => item.parent_nav_item_id === null || item.parent_nav_item_id === undefined);
    } else {
      const activeCategory = drawerNavStack[drawerNavStack.length - 1];
      itemsToFilter = activeCategory.children || [];
    }

    // Add ThemeToggle and Profile Dropdown as virtual NavItems if at the root level
    if (drawerNavStack.length === 0 && currentUserProfile) {
      itemsToFilter.push(
        {
          id: 'theme-toggle-item',
          label: 'Thème',
          icon_name: theme === 'dark' ? 'Sun' : 'Moon',
          is_external: false,
          type: 'category_or_action',
          onClick: handleToggleTheme, // Now correctly referenced
          order_index: 998, // High order to place it near the bottom
        },
        {
          id: 'profile-menu-item',
          label: 'Mon Compte',
          icon_name: 'User',
          is_external: false,
          type: 'category_or_action',
          onClick: () => {}, // Placeholder, actual dropdown handled in render
          order_index: 999, // Highest order to place it at the very bottom
        }
      );
    }


    return itemsToFilter.filter(item =>
      item.label.toLowerCase().includes(lowerCaseQuery) ||
      (item.description && item.description.toLowerCase().includes(lowerCaseQuery))
    ).sort((a, b) => a.order_index - b.order_index);
  }, [navItems, drawerNavStack, searchQuery, currentUserProfile, theme, handleToggleTheme]); // Added handleToggleTheme to dependencies

  const currentDrawerTitle = drawerNavStack.length > 0 ? drawerNavStack[drawerNavStack.length - 1].label : "Menu";
  const currentDrawerIcon = drawerNavStack.length > 0 ? iconMap[drawerNavStack[drawerNavStack.length - 1].icon_name || 'Info'] : null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="top"
        className="w-full h-[calc(100vh-68px)] flex flex-col p-0 backdrop-blur-lg bg-background/80 rounded-b-lg"
        {...swipeHandlers}
      >
        <div className="p-4 flex-shrink-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <span className="font-medium">{format(currentTime, 'HH:mm')}</span>
            <span className="font-medium">{format(currentTime, 'EEE. dd MMM', { locale: fr })}</span>
          </div>

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
              <div className="w-10 h-10"></div> // Placeholder to keep alignment
            )}
            <SheetTitle className="flex-grow text-center flex items-center justify-center gap-2">
              {currentDrawerIcon && React.createElement(currentDrawerIcon, { className: "h-6 w-6 text-primary" })}
              {currentDrawerTitle}
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10">
              <X className="h-5 w-5" />
              <span className="sr-only">Fermer le menu</span>
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-grow p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {currentItemsToDisplay.length === 0 && searchQuery.trim() !== '' ? (
              <p className="text-muted-foreground text-center py-4 col-span-full">Aucun élément trouvé pour "{searchQuery}".</p>
            ) : currentItemsToDisplay.length === 0 && searchQuery.trim() === '' ? (
              <p className="text-muted-foreground text-center py-4 col-span-full">Aucun élément de menu configuré pour ce rôle.</p>
            ) : (
              currentItemsToDisplay.map((item) => {
                const IconComponent = iconMap[item.icon_name || 'Info'] || Info;
                const isLinkActive = item.route && (location.pathname + location.search).startsWith(item.route);

                // Special handling for ThemeToggle and Profile Dropdown
                if (item.id === 'theme-toggle-item') {
                  return (
                    <div key={item.id} className="col-span-full"> {/* Make theme toggle full width */}
                      <div className="android-tile flex-row items-center justify-between h-auto min-h-[60px] text-left w-full !p-3">
                        <div className="flex items-center gap-3">
                          <div className="icon-container">
                            <IconComponent className="h-6 w-6" />
                          </div>
                          <span className="title text-base font-medium">{item.label}</span>
                        </div>
                        <ThemeToggle /> {/* Render the actual ThemeToggle component */}
                      </div>
                    </div>
                  );
                } else if (item.id === 'profile-menu-item' && currentUserProfile) {
                  return (
                    <div key={item.id} className="col-span-full"> {/* Make profile menu full width */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="android-tile flex-row items-center justify-between h-auto min-h-[60px] text-left w-full !p-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="icon-container">
                                <IconComponent className="h-6 w-6" />
                              </div>
                              <span className="title text-base font-medium">{currentUserProfile.first_name} {currentUserProfile.last_name}</span>
                            </div>
                            <ChevronUp className="h-5 w-5 rotate-90" /> {/* Placeholder for dropdown arrow */}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="backdrop-blur-lg bg-background/80 z-[999]">
                          <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { navigate("/profile"); onClose(); }}>
                            <User className="mr-2 h-4 w-4" /> Mon profil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { navigate("/settings"); onClose(); }}>
                            <Settings className="mr-2 h-4 w-4" /> Paramètres
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                }

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
                  </Button>
                );
              })
            )}
          </div>
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