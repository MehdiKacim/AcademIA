import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Search, Menu, User, LogOut, Settings, Info, BookOpen, Sun, Moon, ChevronUp, ExternalLink, BotMessageSquare, SlidersHorizontal, MessageSquareQuote, ShieldCheck, Target, Home, MessageSquare, BellRing, ChevronDown, ArrowLeft, SunMoon, UserCog, LayoutDashboard } from "lucide-react"; // Added UserCog, LayoutDashboard
import { NavItem, Profile } from "@/lib/dataModels";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from 'next-themes';
import { ThemeToggle } from './theme-toggle';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from './Logo';
import { useCourseChat } from '@/contexts/CourseChatContext';
import MobileDrawer from './MobileDrawer';
import packageJson from '../../package.json';
import { MadeWithDyad } from './made-with-dyad';

const iconMap: { [key: string]: React.ElementType } = {
  Home: Home, MessageSquare: MessageSquare, Search: Search, User: User, LogOut: LogOut, Settings: Settings, Info: Info, BookOpen: BookOpen, Sun: Sun, Moon: Moon, ChevronUp: ChevronUp, ExternalLink: ExternalLink, Menu: Menu, BotMessageSquare: BotMessageSquare, SlidersHorizontal: SlidersHorizontal, MessageSquareQuote: MessageSquareQuote, ShieldCheck: ShieldCheck, Target: Target, BellRing: BellRing, ChevronDown: ChevronDown, ArrowLeft: ArrowLeft, SunMoon: SunMoon, UserCog: UserCog, LayoutDashboard: LayoutDashboard, // Added UserCog, LayoutDashboard
};

interface NavSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  navItems: NavItem[]; // Full nav tree
  onOpenGlobalSearch: () => void;
  onOpenAiAChat: () => void;
  onOpenAuthModal: () => void;
  unreadMessagesCount: number;
  isMobile: boolean; // To differentiate mobile vs desktop behavior
}

const containerVariants = {
  hidden: { opacity: 0, transition: { staggerChildren: 0.05, staggerDirection: -1 } },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

// Create a MotionButton component by wrapping the shadcn Button with framer-motion
const MotionButton = motion(Button);

const NavSheet = ({
  isOpen,
  onOpenChange,
  navItems,
  onOpenGlobalSearch,
  onOpenAiAChat,
  onOpenAuthModal,
  unreadMessagesCount,
  isMobile,
}: NavSheetProps) => {
  const { currentUserProfile, signOut, currentRole } = useRole();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { openChat } = useCourseChat();

  const [drawerNavStack, setDrawerNavStack] = useState<NavItem[]>([]);

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
    { id: 'profile-about', label: 'À propos', icon_name: 'Info', route: '/about', is_external: false, type: 'route', order_index: 3 }, // About link
    { id: 'profile-logout', label: 'Déconnexion', icon_name: 'LogOut', is_external: false, type: 'category_or_action', onClick: handleLogout, order_index: 4 },
  ];

  const staticAnonNavItems: NavItem[] = [
    { id: 'home-anon', label: "Accueil", icon_name: 'Home', route: '/', is_external: false, order_index: 0, type: 'route' },
    { id: 'aia-bot-link', label: "AiA Bot", icon_name: 'BotMessageSquare', route: '#aiaBot', is_external: false, order_index: 1, type: 'route' },
    { id: 'methodology-link', label: "Méthodologie", icon_name: 'SlidersHorizontal', route: '#methodologie', is_external: false, order_index: 2, type: 'route' },
    { id: 'about-link', label: "À propos", icon_name: 'Info', route: '/about', is_external: false, order_index: 3, type: 'route' },
    { id: 'login-link', label: "Connexion", icon_name: 'LogIn', route: '/auth', is_external: false, order_index: 5, type: 'route' },
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
      } else {
        itemsToFilter = staticAnonNavItems;
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
  }, [navItems, drawerNavStack, currentUserProfile, staticProfileActions, staticAnonNavItems, unreadMessagesCount]);

  return (
    <MobileDrawer isOpen={isOpen} onClose={() => onOpenChange(false)}>
      {/* Simplified Header Section */}
      <div className="pt-8 px-4 pb-4 flex-shrink-0 flex items-center justify-between">
        {/* Placeholder to maintain spacing, removed back button from here */}
        <div className="h-10 w-10" /> 
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: isOpen ? 360 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <Logo iconClassName="h-10 w-10" showText={false} disableInternalAnimation={isOpen} />
        </motion.div>
        <MotionButton variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full h-10 w-10 bg-muted/20 hover:bg-muted/40" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <X className="h-5 w-5" />
          <span className="sr-only">Fermer le menu</span>
        </MotionButton>
      </div>

      {/* New: Back button section, outside the header */}
      {drawerNavStack.length > 0 && (
        <div className="px-4 mb-4 flex-shrink-0">
          <MotionButton variant="ghost" onClick={handleBack} className="w-full justify-start rounded-android-tile" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="text-base font-medium">Retour</span>
          </MotionButton>
        </div>
      )}

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
            <MotionButton variant="ghost" size="sm" className="flex-shrink-0" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <User className="h-4 w-4 mr-2" /> Voir le profil
            </MotionButton>
          </div>
        )}
        {currentUserProfile && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-sm text-muted-foreground text-center mb-4"
          >
            Bonjour, {currentUserProfile.first_name} ! Prêt à apprendre ?
          </motion.p>
        )}
        <motion.div
          key={drawerNavStack.length} // Key to trigger AnimatePresence for the grid
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
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
                <motion.div key={item.id} variants={itemVariants}> {/* Wrap each button in motion.div */}
                  <MotionButton
                    variant="ghost"
                    whileHover={{ scale: 1.02, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }} // Subtle lift and shadow on hover
                    whileTap={{ scale: 0.98 }} // Slight press effect on tap
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
                    {isCategory && (
                      <motion.div
                        animate={{ rotate: drawerNavStack.some(d => d.id === item.id) ? 180 : 0 }} // Animate rotation based on stack presence, 0 for default, 180 for open
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="h-4 w-4 ml-auto text-muted-foreground"
                      >
                        <ChevronDown />
                      </motion.div>
                    )}
                  </MotionButton>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </ScrollArea>
    </MobileDrawer>
  );
};

export default NavSheet;