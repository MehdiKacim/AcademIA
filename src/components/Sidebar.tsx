import { NavLink } from "react-router-dom";
import { Home, BookOpen, PlusSquare, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "./Logo";

const Sidebar = () => {
  const navItems = [
    { to: "/dashboard", icon: Home, label: "Tableau de bord" },
    { to: "/courses", icon: BookOpen, label: "Mes Cours" },
    { to: "/create-course", icon: PlusSquare, label: "Créer un cours" },
    { to: "/analytics", icon: BarChart2, label: "Progression" },
  ];

  return (
    <aside className="hidden md:flex md:flex-col w-64 flex-shrink-0 border-r bg-background">
      <div className="p-4 border-b">
        <Logo />
      </div>
      <nav className="flex flex-col p-4 space-y-2">
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
            <item.icon className="mr-3 h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;