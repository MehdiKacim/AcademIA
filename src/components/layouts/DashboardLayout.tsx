import { NavLink, Outlet } from "react-router-dom";
import { Home, BookOpen, PlusSquare, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { ThemeToggle } from "../theme-toggle";
import { Button } from "@/components/ui/button";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { useIsMobile } from "@/hooks/use-mobile";

const DashboardLayout = () => {
  const isMobile = useIsMobile();

  const navItems = [
    { to: "/dashboard", icon: Home, label: "Tableau de bord" },
    { to: "/courses", icon: BookOpen, label: "Mes Cours" },
    { to: "/create-course", icon: PlusSquare, label: "Créer un cours" },
    { to: "/analytics", icon: BarChart2, label: "Progression" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-muted/40 overflow-x-hidden"> {/* Ajout de overflow-x-hidden */}
      <header className="fixed top-0 left-0 right-0 z-50 px-2 py-4 flex items-center justify-between border-b backdrop-blur-lg bg-background/80">
        <Logo />
        {/* Navigation pour les écrans non mobiles */}
        {!isMobile && (
          <nav className="flex flex-grow justify-center items-center gap-2 sm:gap-4 flex-wrap">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center p-2 rounded-md text-sm font-medium whitespace-nowrap",
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
        )}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          <ThemeToggle />
          <NavLink to="/">
            <Button variant="outline">Déconnexion</Button>
          </NavLink>
        </div>
      </header>
      <main className={cn("flex-grow p-4 sm:p-6 md:p-8 pt-16 sm:pt-20", isMobile && "pb-20")}>
        <Outlet />
      </main>
      <BottomNavigationBar navItems={navItems} />
    </div>
  );
};

export default DashboardLayout;