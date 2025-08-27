import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { X, ArrowLeft, ExternalLink, ChevronDown, Info, Search } from "lucide-react";
import { NavItem, Profile } from "@/lib/dataModels";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { useCourseChat } from '@/contexts/CourseChatContext';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area"; // Added ScrollArea import

interface DesktopSubMenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  parentItem: NavItem | null;
  iconMap: { [key: string]: React.ElementType };
  unreadMessagesCount: number;
}

const DesktopSubMenuOverlay = ({ isOpen, onClose, parentItem, iconMap, unreadMessagesCount }: DesktopSubMenuOverlayProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUserProfile } = useRole();
  const { openChat } = useCourseChat();

  const [currentStack, setCurrentStack] = useState<NavItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && parentItem) {
      setCurrentStack([parentItem]);
      setSearchQuery('');
    } else if (!isOpen) {
      setCurrentStack([]);
      setSearchQuery('');
    }
  }, [isOpen, parentItem]);

  const handleItemClick = useCallback((item: NavItem) => {
    const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);

    if (isCategory) {
      setCurrentStack(prevStack => [...prevStack, item]);
      setSearchQuery('');
    } else if (item.route) {
      if (item.is_external) {
        window.open(item.route, '_blank');
      } else if (item.route.startsWith('#')) {
        navigate(`/${item.route}`);
      } else {
        navigate(item.route);
      }
      onClose(); // Close the overlay after navigation
    } else if (item.onClick) {
      if (item.id === 'nav-global-search') {
        // This action is handled by DashboardLayout, just close the overlay
      } else if (item.id === 'nav-aia-chat') {
        openChat();
      } else {
        item.onClick();
      }
      onClose(); // Close the overlay after action
    }
  }, [navigate, onClose, openChat]);

  const handleBack = useCallback(() => {
    if (currentStack.length === 1) {
      onClose(); // Close the entire overlay if at the first level
    } else {
      setCurrentStack(prevStack => {
        const newStack = [...prevStack];
        newStack.pop();
        return newStack;
      });
      setSearchQuery('');
    }
  }, [currentStack.length, onClose]);

  const currentParentInStack = currentStack[currentStack.length - 1];
  const itemsToDisplay = React.useMemo(() => {
    if (!currentParentInStack) return [];

    let filtered = (currentParentInStack.children || []).filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => a.order_index - b.order_index);

    // Apply badge for messages
    return filtered.map(item => {
      if (item.route === '/messages') {
        return { ...item, badge: unreadMessagesCount };
      }
      return item;
    });
  }, [currentParentInStack, searchQuery, unreadMessagesCount]);

  const currentTitle = currentParentInStack?.label || "Sous-menus";
  const CurrentIconComponent = currentParentInStack?.icon_name ? (iconMap[currentParentInStack.icon_name] || Info) : Info;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed top-[68px] left-0 right-0 z-40 w-full bg-background/80 backdrop-blur-lg border-b border-border shadow-lg py-3 px-4"
        >
          <div className="max-w-7xl mx-auto flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full h-8 w-8 bg-muted/20 hover:bg-muted/40">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Retour</span>
                </Button>
                <CurrentIconComponent className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">{currentTitle}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8 bg-muted/20 hover:bg-muted/40">
                <X className="h-4 w-4" aria-label="Fermer le menu" />
                <span className="sr-only">Fermer</span>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Rechercher dans ${currentTitle}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow h-8 text-sm rounded-md"
              />
            </div>

            <ScrollArea className="h-auto max-h-40 pb-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {itemsToDisplay.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-2 col-span-full">Aucun élément trouvé.</p>
                ) : (
                  itemsToDisplay.map(item => {
                    const ItemIconComponent = item.icon_name ? (iconMap[item.icon_name] || Info) : Info;
                    const isLinkActive = item.route && (location.pathname + location.search).startsWith(item.route);
                    const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);

                    return (
                      <Button
                        key={item.id}
                        variant="ghost"
                        className={cn(
                          "android-tile flex-row items-center justify-start h-auto min-h-[48px] text-left w-full p-2",
                          "rounded-md hover:scale-[1.01] transition-transform",
                          isLinkActive ? "active" : "",
                          "transition-all duration-200 ease-in-out"
                        )}
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="icon-container rounded-sm mr-2">
                          <ItemIconComponent className="h-5 w-5" />
                        </div>
                        <span className="title text-sm font-medium line-clamp-1 flex-grow">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="ml-1 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
                            {item.badge}
                          </span>
                        )}
                        {item.is_external && <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />}
                        {isCategory && <ChevronDown className="h-3 w-3 ml-auto text-muted-foreground rotate-90" />}
                      </Button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DesktopSubMenuOverlay;