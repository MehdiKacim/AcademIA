import React, { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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
  triggerContent: React.ReactNode; // Nouvelle prop pour le contenu du bouton déclencheur
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
        <Button variant="outline" size="icon">
          {triggerContent} {/* Utilise le contenu passé pour le bouton */}
        </Button>
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