import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { X, Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, ExternalLink, ArrowLeft, ChevronDown } from "lucide-react"; // Added ArrowLeft, ChevronDown
import { NavItem } from "@/lib/dataModels";
import { cn } from "@/lib/utils";
import { useLocation } from 'react-router-dom';

// Map icon_name strings to Lucide React components
const iconMap: { [key: string]: React.ElementType } = {
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, ExternalLink, ArrowLeft, ChevronDown
};

interface DesktopImmersiveSubmenuProps {
  parentItem: NavItem | null; // The initial parent item that opened this submenu
  onClose: () => void; // Function to close the entire immersive submenu
  onItemClick: (item: NavItem) => void; // Function to handle final navigation/action and close the submenu
}

const DesktopImmersiveSubmenu = ({ parentItem, onClose, onItemClick }: DesktopImmersiveSubmenuProps) => {
  const location = useLocation();
  const [currentSubmenuStack, setCurrentSubmenuStack] = useState<NavItem[]>([]); // Stack for nested navigation

  // Initialize stack when parentItem changes
  useEffect(() => {
    if (parentItem) {
      setCurrentSubmenuStack([parentItem]);
    } else {
      setCurrentSubmenuStack([]);
    }
  }, [parentItem]);

  const handleInternalItemClick = useCallback((item: NavItem) => {
    const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);

    if (isCategory && item.children && item.children.length > 0) {
      // If it's a category with children, push it onto the stack
      setCurrentSubmenuStack(prevStack => [...prevStack, item]);
    } else {
      // If it's a route or action, trigger the external onItemClick and close the submenu
      onItemClick(item);
    }
  }, [onItemClick]);

  const handleBack = useCallback(() => {
    setCurrentSubmenuStack(prevStack => prevStack.slice(0, prevStack.length - 1));
  }, []);

  if (!parentItem || currentSubmenuStack.length === 0) {
    return null;
  }

  const currentDisplayItem = currentSubmenuStack[currentSubmenuStack.length - 1];
  const currentChildrenToDisplay = currentDisplayItem.children || [];
  const showBackButton = currentSubmenuStack.length > 1;

  const currentParentIconComponent = currentDisplayItem.icon_name ? (iconMap[currentDisplayItem.icon_name] || Info) : Info;

  return (
    <AnimatePresence>
      {parentItem && ( // Only render if there's an initial parentItem
        <motion.nav
          initial={{ y: '-100%' }}
          animate={{ y: '0%' }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-[64px] left-0 right-0 z-40 hidden md:flex flex-col h-56 px-4 py-3 backdrop-blur-lg bg-background/80 shadow-lg overflow-hidden"
        >
          <div className="flex items-center justify-between pb-2 mb-4"> {/* Removed border-b border-border, changed pb-3 to pb-2 */}
            <div className="flex items-center gap-3">
              {showBackButton && (
                <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full h-10 w-10 bg-muted/20 hover:bg-muted/40">
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">Retour</span>
                </Button>
              )}
              <currentParentIconComponent className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">{currentDisplayItem.label}</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
              <span className="sr-only">Fermer le sous-menu</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-hidden">
            {currentChildrenToDisplay.map(item => {
              const IconComponent = item.icon_name ? (iconMap[item.icon_name] || Info) : Info;
              const isLinkActive = item.route && (location.pathname + location.search).startsWith(item.route);
              const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => handleInternalItemClick(item)}
                  className={cn(
                    "android-tile flex-col items-start justify-start h-auto min-h-[80px] text-left w-full",
                    "rounded-android-tile hover:scale-[1.02] transition-transform",
                    isLinkActive ? "active" : "",
                    "transition-all duration-200 ease-in-out"
                  )}
                  target={item.is_external ? "_blank" : undefined}
                >
                  <div className="icon-container rounded-lg mb-2">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <span className="title text-base font-medium line-clamp-2">{item.label}</span>
                  {item.description && (
                    <span className="subtitle text-xs line-clamp-2">{item.description}</span> {/* Changed text-sm to text-xs */}
                  )}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs leading-none">
                      {item.badge}
                    </span>
                  )}
                  {isCategory && <ChevronDown className="absolute bottom-2 right-2 h-4 w-4 text-muted-foreground" />} {/* Added chevron for categories */}
                  {item.is_external && !isCategory && <ExternalLink className="absolute bottom-2 right-2 h-4 w-4 text-muted-foreground" />} {/* Only show external link icon if not a category */}
                </Button>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};

export default DesktopImmersiveSubmenu;