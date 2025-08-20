import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react"; // Import Search icon if still needed for other purposes, otherwise remove

interface NavItem {
  label: string;
  icon: React.ElementType;
  to?: string; // Pour les liens react-router-dom
  onClick?: () => void; // Pour les liens de défilement de section
  isActive?: boolean; // Pour indiquer l'état actif des liens de défilement
}

interface BottomNavigationBarProps {
  navItems: NavItem[];
}

const BottomNavigationBar = ({ navItems }: BottomNavigationBarProps) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null; // Ne pas afficher sur les écrans non mobiles
  }

  // Filter out the global search item if it exists, as it's now a dialog
  const filteredNavItems = navItems.filter(item => item.to !== "/global-search");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t backdrop-blur-lg bg-background/80 p-2 shadow-lg md:hidden">
      {filteredNavItems.map((item) => (
        item.to ? (
          <NavLink
            key={item.label}
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
        ) : (
          <Button
            key={item.label}
            variant="ghost"
            onClick={item.onClick}
            className={cn(
              "flex flex-col items-center p-2 rounded-md text-xs font-medium transition-colors h-auto",
              item.isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5 mb-1" />
            {item.label}
          </Button>
        )
      ))}
    </div>
  );
};

export default BottomNavigationBar;