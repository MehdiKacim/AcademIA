import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft } from "lucide-react";

interface NavItem {
  to?: string;
  icon: React.ElementType;
  label: string;
  type?: 'link' | 'trigger'; // 'trigger' for items that open a sub-menu
  items?: { to: string; label: string; icon?: React.ElementType }[]; // Sub-items for dropdown/trigger
  onClick?: () => void; // Added for generic trigger items
}

interface BottomNavigationBarProps {
  navItems: NavItem[]; // This now receives the full hierarchical structure
  onOpenGlobalSearch: () => void;
}

const BottomNavigationBar = ({ navItems, onOpenGlobalSearch }: BottomNavigationBarProps) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [currentMobileNavLevel, setCurrentMobileNavLevel] = useState<string | null>(null);

  if (!isMobile) {
    return null; // Do not display on non-mobile screens
  }

  const coursesTriggerItem = navItems.find(item => item.label === 'Cours' && item.type === 'trigger');
  const coursesSubItems = coursesTriggerItem?.items || [];

  // Determine which items to display
  let itemsToDisplayInBar: NavItem[] = [];

  if (currentMobileNavLevel === 'courses') {
    // Display 'Retour' and sub-menu items
    itemsToDisplayInBar = [
      {
        icon: ArrowLeft,
        label: "Retour",
        type: 'trigger',
        onClick: () => setCurrentMobileNavLevel(null),
      },
      ...coursesSubItems,
    ];
  } else {
    // Display main navigation items, but handle the 'Cours' trigger specifically
    itemsToDisplayInBar = navItems.map(item => {
      if (item.type === 'trigger' && item.label === 'Cours') {
        // This is the main 'Cours' button that opens the sub-menu
        return {
          ...item, // Keep original properties
          onClick: () => setCurrentMobileNavLevel('courses'), // Override onClick to open sub-menu
          to: undefined, // Ensure it's not treated as a link
        };
      }
      return item; // Other main nav items (links)
    });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t backdrop-blur-lg bg-background/80 p-2 shadow-lg md:hidden">
      {itemsToDisplayInBar.map((item) => { // Use itemsToDisplayInBar here
        if (item.type === 'link' && item.to) {
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center p-2 rounded-md text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5 mb-1" />
              {item.label}
            </NavLink>
          );
        }
        // This covers 'Retour' and the main 'Cours' trigger (if it's in itemsToDisplayInBar)
        if (item.type === 'trigger' && item.onClick) {
          return (
            <Button
              key={item.label} // Use item.label as key, should be unique for these cases
              variant="ghost"
              onClick={item.onClick}
              className="flex flex-col items-center p-2 rounded-md text-xs font-medium transition-colors h-auto text-muted-foreground hover:text-foreground"
            >
              <item.icon className="h-5 w-5 mb-1" />
              {item.label}
            </Button>
          );
        }
        return null;
      })}

      {/* Dedicated Global Search Button for mobile, always visible */}
      <Button
        variant="ghost"
        onClick={onOpenGlobalSearch}
        className="flex flex-col items-center p-2 rounded-md text-xs font-medium transition-colors h-auto text-muted-foreground hover:text-foreground"
      >
        <Search className="h-5 w-5 mb-1" />
        Recherche
      </Button>
    </div>
  );
};

export default BottomNavigationBar;