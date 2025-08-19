import { NavLink, Outlet } from "react-router-dom";
import { Home, BookOpen, PlusSquare, BarChart2 } from "lucide-react";
import { cn } => "@/lib/utils";
import Logo from "@/components/Logo";
import { ThemeToggle } from "../theme-toggle";
import { Button } from "@/components/ui/button";
import MobileSheetNav from "@/components/MobileSheetNav"; // Import MobileSheetNav

const DashboardLayout = () => {
  const navItems = [
    { to: "/dashboard", icon: Home, label: "Tableau de bord" },
    { to: "/courses", icon: BookOpen, label: "Mes Cours" },
    { to: "/create-course", icon: PlusSquare, label: "Créer un cours" },
    { to: "/analytics", icon: BarChart2, label: "Progression" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <header className="fixed top-0 left-0 right-0 z-50 px-2 py-4 flex items-center border-b backdrop-blur-lg bg-background/80">
        <Logo className="min-w-0" /> {/* Ajout de min-w-0 */}
        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-grow justify-center items-center gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center p-2 rounded-md text-sm font-medium",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-4 ml-auto">
          <ThemeToggle />
          {/* Placeholder for logout button - in a real app, this would trigger auth logout */}
          <NavLink to="/">
            <Button variant="outline">Déconnexion</Button>
          </NavLink>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2 ml-auto min-w-0"> {/* Ajout de min-w-0 */}
          <MobileSheetNav navItems={navItems}>
            <ThemeToggle />
            <NavLink to="/" className="w-full">
              <Button variant="outline" className="w-full">Déconnexion</Button>
            </NavLink>
          </MobileSheetNav>
        </div>
      </header>
      <main className="flex-grow p-4 sm:p-6 md:p-8 pt-16 sm:pt-20"> {/* Ajustement du padding supérieur */}
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;