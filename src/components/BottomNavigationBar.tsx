import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft, MessageSquare } from "lucide-react"; // Import MessageSquare
import { useRole } from "@/contexts/RoleContext"; // Import useRole
import { NavItem } from "@/lib/dataModels"; // Import NavItem from dataModels

interface BottomNavigationBarProps {
  navItems: NavItem[]; // This now receives the full hierarchical structure
  onOpenGlobalSearch?: () => void; // Made optional
  currentUser: any; // Accept currentUser prop
}

const BottomNavigationBar = ({ navItems, onOpenGlobalSearch, currentUser }: BottomNavigationBarProps) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [currentMobileNavLevel, setCurrentMobileNavLevel] = useState<string | null>(null); // Stores the label of the active parent trigger, e.g., 'Cours'

  if (!isMobile) {
    return null; // Do not display on non-mobile screens
  }

  // Find the currently active parent trigger item based on currentMobileNavLevel
  const activeParentTrigger = navItems.find(item => item.label === currentMobileNavLevel && item.type === 'trigger');

  let itemsToRender: NavItem[] = [];

  if (activeParentTrigger && activeParentTrigger.items) {
    // If a parent trigger is active, show its sub-items and a "Retour" button
    itemsToRender = [
      {
        icon: ArrowLeft,
        label: "Retour",
        type: 'trigger',
        onClick: () => setCurrentMobileNavLevel(null),
      },
      ...activeParentTrigger.items.map(subItem => ({ ...subItem, type: 'link' as const, icon: subItem.icon })), // Ensure icon is carried over and type is literal
    ];
  } else {
    // Otherwise, show the main navigation items
    itemsToRender = navItems.map(item => {
      if (item.type === 'trigger' && item.items) {
        // For a trigger item, override its onClick to set the mobile nav level
        return {
          ...item,
          onClick: () => setCurrentMobileNavLevel(item.label), // Set the label as the active level
          to: undefined, // Ensure it's not treated as a link
        };
      }
      return item; // Regular link items
    });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center border-t backdrop-blur-lg bg-background/80 py-1 px-2 shadow-lg md:hidden overflow-x-auto flex-nowrap">
      {itemsToRender.map((item) => {
        if (item.type === 'link' && item.to) {
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center py-1 px-1 rounded-md text-[0.65rem] font-medium transition-colors relative flex-shrink-0 min-w-[70px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4 mb-1" />
              {item.label}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        }
        if (item.type === 'trigger' && item.onClick) {
          return (
            <Button
              key={item.label}
              variant="ghost"
              onClick={item.onClick}
              className="flex flex-col items-center py-1 px-1 rounded-md text-[0.65rem] font-medium transition-colors h-auto text-muted-foreground hover:text-foreground flex-shrink-0 min-w-[70px]"
            >
              <item.icon className="h-4 w-4 mb-1" />
              {item.label}
            </Button>
          );
        }
        return null;
      })}

      {/* Dedicated Global Search Button for mobile, conditional on onOpenGlobalSearch prop */}
      {onOpenGlobalSearch && !activeParentTrigger && ( // Only show search if not in a sub-menu
        <Button
          variant="ghost"
          onClick={onOpenGlobalSearch}
          className="flex flex-col items-center py-1 px-1 rounded-md text-[0.65rem] font-medium transition-colors h-auto text-muted-foreground hover:text-foreground flex-shrink-0 min-w-[70px]"
        >
          <Search className="h-4 w-4 mb-1" />
          Recherche
        </Button>
      )}
    </div>
  );
};

export default BottomNavigationBar;