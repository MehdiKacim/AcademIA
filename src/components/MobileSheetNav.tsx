import React, { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

interface NavItem {
  to: string;
  icon?: React.ElementType; // Icon is optional for Index page nav
  label: string;
}

interface MobileSheetNavProps {
  navItems: NavItem[];
  onLinkClick?: () => void;
  children?: React.ReactNode; // For additional content like ThemeToggle, auth buttons
}

const MobileSheetNav = ({ navItems, onLinkClick, children }: MobileSheetNavProps) => {
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
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
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