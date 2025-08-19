import React, { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button"; // Garder l'import pour d'autres usages si nécessaire
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

interface NavItem {
  to: string;
  icon?: React.ElementType;
  label: string;
}

interface MobileSheetNavProps {
  navItems: NavItem[];
  onLinkClick?: () => void;
  children?: React.ReactNode;
  triggerContent: React.ReactNode; // Contenu du déclencheur
}

const MobileSheetNav = ({ navItems, onLinkClick, children, triggerContent }: MobileSheetNavProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLinkClick = () => {
    setIsOpen(false);
    if (onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {/* Remplacé Button par un span avec les styles de bouton pour le débogage */}
        <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10">
          {triggerContent}
        </span>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <div className="p-4 border-b">
          <Logo />
        </div>
        <nav className="flex flex-col gap-2 p-4 flex-grow">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                cn(
                  "flex items-center p-3 rounded-md text-base font-medium",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              {item.icon && <item.icon className="mr-3 h-5 w-5" />}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t flex flex-col gap-4">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileSheetNav;