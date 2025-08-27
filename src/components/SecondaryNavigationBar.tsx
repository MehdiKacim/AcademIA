import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { NavItem, Profile } from "@/lib/dataModels";
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

  // Recursive function to render dropdown menu items
  const renderDropdownItems = (items: NavItem[], level: number = 0) => {
    return items.map(item => {
      const IconComponent = item.icon_name ? (iconMap[item.icon_name] || Info) : Info;
      const isLinkActive = item.route && (location.pathname + location.search).startsWith(item.route);

      if (item.children && item.children.length > 0) {
        return (
          <DropdownMenuSub key={item.id}>
            <DropdownMenuSubTrigger className={cn(isLinkActive && "text-primary font-semibold")}>
              <IconComponent className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="backdrop-blur-lg bg-background/80">
              {renderDropdownItems(item.children, level + 1)}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        );
      } else {
        return (
          <DropdownMenuItem
            key={item.id}
            onClick={() => onItemClick(item)}
            className={cn(isLinkActive && "text-primary font-semibold")}
          >
            <IconComponent className="mr-2 h-4 w-4" />
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="ml-auto bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
                {item.badge}
              </span>
            )}
            {item.is_external && <ExternalLink className="ml-auto h-3 w-3" />}
          </DropdownMenuItem>
        );
      }
    });
  };

  return (
    <nav className="fixed top-[68px] left-0 right-0 z-40 hidden md:flex items-center justify-start h-12 px-4 border-b backdrop-blur-lg bg-background/80 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
      {navItems.map(item => {
        const IconComponent = item.icon_name ? (iconMap[item.icon_name] || Info) : Info;
        const isLinkActive = item.route && (location.pathname + location.search).startsWith(item.route);

        const commonButtonClasses = cn(
          "group inline-flex h-9 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
          isLinkActive ? "text-primary font-semibold" : "text-muted-foreground"
        );

        if (item.children && item.children.length > 0) {
          return (
            <DropdownMenu key={item.id}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={commonButtonClasses}
                >
                  <IconComponent className="mr-2 h-4 w-4" />
                  {item.label}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="backdrop-blur-lg bg-background/80">
                {renderDropdownItems(item.children)}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        } else if (item.onClick) {
          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={(e) => {
                e.preventDefault();
                onItemClick(item);
              }}
              className={commonButtonClasses}
            >
              <IconComponent className="mr-2 h-4 w-4" />
              {item.label}
              {item.route === '/messages' && item.badge !== undefined && item.badge > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
                  {item.badge}
                </span>
              )}
            </Button>
          );
        } else { // item.type === 'route'
          return (
            <NavLink
              key={item.id}
              to={item.route!}
              className={commonButtonClasses}
              target={item.is_external ? "_blank" : undefined}
            >
              <IconComponent className="mr-2 h-4 w-4" />
              {item.label}
              {item.route === '/messages' && item.badge !== undefined && item.badge > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        }
      })}
    </nav>
  );
};

export default SecondaryNavigationBar;