import { NavLink, Outlet } from "react-router-dom";
import { Home, BookOpen, PlusSquare, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { ThemeToggle } from "../theme-toggle";
import { Button } from "@/components/ui/button";

const DashboardLayout = () => {
  const navItems = [
    { to: "/dashboard", icon: Home, label: "Tableau de bord" },
    { to: "/courses", icon: BookOpen, label: "Mes Cours" },
    { to: "/create-course", icon: PlusSquare, label: "Créer un cours" },
    { to: "/analytics", icon: BarChart2, label: "Progression" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <header className="fixed top-0 left-0 right-0 z-50 p-4 flex flex-wrap items-center justify-between md:justify-start border-b backdrop-blur-lg bg-background/80">
        <Logo />
        <nav className="flex-grow flex justify-center items-center gap-2 sm:gap-4 md:gap-6 mt-2 md:mt-0 order-3 md:order-none w-full md:w-auto">
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
        <div className="flex items-center gap-2 sm:gap-4 order-2 md:order-none">
          <ThemeToggle />
          {/* Placeholder for logout button - in a real app, this would trigger auth logout */}
          <NavLink to="/">
            <Button variant="outline">Déconnexion</Button>
          </NavLink>
        </div>
      </header>
      <main className="flex-grow p-4 sm:p-6 md:p-8 pt-20"> {/* Added pt-20 to account for fixed header */}
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;