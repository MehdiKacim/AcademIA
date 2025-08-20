import React, { useState, useEffect } from "react";
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

  // Reset nav level if user navigates away from a sub-level path
  useEffect(() => {
    const isCoursesPath = location.pathname.startsWith('/courses') || location.pathname.startsWith('/create-course');
    if (!isCoursesPath && currentMobileNavLevel === 'courses') {
      setCurrentMobileNavLevel(null);
    }
  }, [location.pathname, currentMobileNavLevel]);

  if (!isMobile) {
    return null; // Do not display on non-mobile screens
  }

  // Find the 'Cours' trigger item to get its sub-items
  const coursesTriggerItem = navItems.find(item => item.label === 'Cours' && item.type === 'trigger');
  const coursesSubItems = coursesTriggerItem?.items || [];

  // Helper function to render a single nav item
  const renderNavItem = (item: NavItem) => {
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
    // This handles the 'Cours' trigger for creators, and also Index page scroll triggers
    if (item.type === 'trigger' && item.onClick) {
      return (
        <Button
          key={item.label}
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
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t backdrop-blur-lg bg-background/80 p-2 shadow-lg md:hidden">
      {currentMobileNavLevel === 'courses' ? (
        // Display back button and sub-items for 'Courses'
        <>
          <Button
            variant="ghost"
            onClick={() => setCurrentMobileNavLevel(null)}
            className="flex flex-col items-center p-2 rounded-md text-xs font-medium transition-colors h-auto text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5 mb-1" />
            Retour
          </Button>
          {coursesSubItems.map(renderNavItem)}
        </>
      ) : (
        // Display main navigation items
        <>
          {navItems.map((item) => {
            // Special handling for the 'Cours' trigger in the main level
            if (item.type === 'trigger' && item.label === 'Cours') {
              return (
                <Button
                  key={item.label}
                  variant="ghost"
                  onClick={() => setCurrentMobileNavLevel('courses')}
                  className="flex flex-col items-center p-2 rounded-md text-xs font-medium transition-colors h-auto text-muted-foreground hover:text-foreground"
                >
                  <item.icon className="h-5 w-5 mb-1" />
                  {item.label}
                </Button>
              );
            }
            return renderNavItem(item); // Render other main items
          })}
        </>
      )}

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