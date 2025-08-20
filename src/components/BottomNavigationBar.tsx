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
}

interface BottomNavigationBarProps {
  navItems: NavItem[];
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

  const displayedNavItems = currentMobileNavLevel === 'courses'
    ? navItems.find(item => item.label === 'Cours' && item.type === 'trigger')?.items || []
    : navItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t backdrop-blur-lg bg-background/80 p-2 shadow-lg md:hidden">
      {currentMobileNavLevel ? (
        // Display back button and sub-items
        <>
          <Button
            variant="ghost"
            onClick={() => setCurrentMobileNavLevel(null)}
            className="flex flex-col items-center p-2 rounded-md text-xs font-medium transition-colors h-auto text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5 mb-1" />
            Retour
          </Button>
          {displayedNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to!} // 'to' is guaranteed for sub-items
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
          ))}
        </>
      ) : (
        // Display main navigation items
        <>
          {displayedNavItems.map((item) => (
            item.type === 'link' && item.to ? (
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
            ) : item.type === 'trigger' && item.label === 'Cours' ? ( // Special handling for 'Cours' trigger
              <Button
                key={item.label}
                variant="ghost"
                onClick={() => setCurrentMobileNavLevel('courses')}
                className="flex flex-col items-center p-2 rounded-md text-xs font-medium transition-colors h-auto text-muted-foreground hover:text-foreground"
              >
                <item.icon className="h-5 w-5 mb-1" />
                {item.label}
              </Button>
            ) : null
          ))}
          {/* Dedicated Global Search Button for mobile, always visible */}
          <Button
            variant="ghost"
            onClick={onOpenGlobalSearch}
            className="flex flex-col items-center p-2 rounded-md text-xs font-medium transition-colors h-auto text-muted-foreground hover:text-foreground"
          >
            <Search className="h-5 w-5 mb-1" />
            Recherche
          </Button>
        </>
      )}
    </div>
  );
};

export default BottomNavigationBar;