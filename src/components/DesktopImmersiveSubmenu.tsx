import React from 'react';
import { motion, AnimatePresence }f from 'framer-motion';
import { Button } from "@/components/ui/button";
import { X, Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, ExternalLink } from "lucide-react";
import { NavItem } from "@/lib/dataModels";
import { cn } from "@/lib/utils";
import { useLocation } from 'react-router-dom';

// Map icon_name strings to Lucide React components
const iconMap: { [key: string]: React.ElementType } = {
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, ExternalLink,
};

interface DesktopImmersiveSubmenuProps {
  parentItem: NavItem | null;
  onClose: () => void;
  onItemClick: (item: NavItem) => void;
}

const DesktopImmersiveSubmenu = ({ parentItem, onClose, onItemClick }: DesktopImmersiveSubmenuProps) => {
  const location = useLocation();

  if (!parentItem || !parentItem.children || parentItem.children.length === 0) {
    return null;
  }

  const parentIconComponent = parentItem.icon_name ? (iconMap[parentItem.icon_name] || Info) : Info;

  return (
    <AnimatePresence>
      {parentItem && (
        <motion.nav
          initial={{ y: '-100%' }}
          animate={{ y: '0%' }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          ref={null} // No need for ref here, it's a direct child of main
          className="fixed top-[68px] left-0 right-0 z-40 hidden md:flex flex-col h-48 p-4 border-b backdrop-blur-lg bg-background/80 shadow-lg overflow-hidden" // Removed py-3, added p-4, removed overflow-y-auto
        >
          <div className="flex items-center justify-between border-b border-border pb-2 mb-4"> {/* Removed pb-4, mb-4, added pb-2 */}
            <div className="flex items-center gap-3">
              <parentIconComponent className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">{parentItem.label}</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
              <span className="sr-only">Fermer le sous-menu</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-hidden"> {/* Removed flex-grow, added overflow-hidden */}
            {parentItem.children.map(item => {
              const IconComponent = item.icon_name ? (iconMap[item.icon_name] || Info) : Info;
              const isLinkActive = item.route && (location.pathname + location.search).startsWith(item.route);

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => onItemClick(item)}
                  className={cn(
                    "android-tile flex-col items-start justify-start h-auto min-h-[100px] text-left w-full",
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
                    <span className="subtitle text-sm line-clamp-2">{item.description}</span>
                  )}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs leading-none">
                      {item.badge}
                    </span>
                  )}
                  {item.is_external && <ExternalLink className="absolute bottom-2 right-2 h-4 w-4 text-muted-foreground" />}
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