import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { NavItem } from "@/lib/dataModels";
import { cn } from "@/lib/utils";
import {
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, ExternalLink, ChevronDown
} from "lucide-react";

// Map icon_name strings to Lucide React components
const iconMap: { [key: string]: React.ElementType } = {
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, ExternalLink, ChevronDown,
};

interface SecondaryNavigationBarProps {
  navItems: NavItem[];
  onItemClick: (item: NavItem) => void;
}

const SecondaryNavigationBar = ({ navItems, onItemClick }: SecondaryNavigationBarProps) => {
  const location = useLocation();

  return (
    <nav className="fixed top-[68px] left-0 right-0 z-40 hidden md:flex items-center justify-start h-12 px-4 border-b backdrop-blur-lg bg-background/80 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
      {navItems.map(item => {
        const IconComponent = item.icon_name ? (iconMap[item.icon_name] || Info) : Info;
        const isLinkActive = item.route && (location.pathname + location.search).startsWith(item.route);

        const commonButtonClasses = cn(
          "group inline-flex h-9 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
          isLinkActive ? "text-primary font-semibold" : "text-muted-foreground"
        );

        // In the secondary bar, all items are treated as direct clickable items (routes or actions).
        // Categories within this bar will simply act as clickable items, not open further sub-menus.
        return (
          <Button
            key={item.id}
            variant="ghost"
            onClick={(e) => {
              e.preventDefault(); // Prevent default form submission if button is inside a form
              onItemClick(item);
            }}
            className={commonButtonClasses}
            target={item.is_external ? "_blank" : undefined} // Apply target for external links
          >
            <IconComponent className="mr-2 h-4 w-4" />
            {item.label}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="ml-1 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
                {item.badge}
              </span>
            )}
            {item.is_external && <ExternalLink className="ml-auto h-3 w-3" />}
          </Button>
        );
      })}
    </nav>
  );
};

export default SecondaryNavigationBar;