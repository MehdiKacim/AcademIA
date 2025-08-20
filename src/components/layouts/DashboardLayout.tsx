import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, BookOpen, PlusSquare, BarChart2, User, LogOut, Settings, GraduationCap, PenTool, Users, NotebookText, School, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { ThemeToggle } from "../theme-toggle";
import { Button } from "@/components/ui/button";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRole } from "@/contexts/RoleContext";
import AiAPersistentChat from "@/components/AiAPersistentChat";
import { useCourseChat } from "@/contexts/CourseChatContext";
import FloatingAiAChatButton from "@/components/FloatingAiAChatButton";
import GlobalSearchOverlay from "@/components/GlobalSearchOverlay";
import React, { useState } from "react";

interface NavItem {
  to?: string;
  icon: React.ElementType;
  label: string;
  type?: 'link' | 'dropdown';
  items?: { to: string; label: string; icon?: React.ElementType }[];
}

const DashboardLayout = () => {
  const isMobile = useIsMobile();
  const { currentUser, currentRole, setCurrentUser } = useRole();
  const { openChat } = useCourseChat();
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setCurrentUser(null);
    navigate("/");
  };

  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      { to: "/dashboard", icon: Home, label: "Tableau de bord", type: 'link' },
    ];

    if (currentRole === 'student') {
      return [
        ...baseItems,
        { to: "/courses", icon: BookOpen, label: "Mes Cours", type: 'link' },
        { to: "/all-notes", icon: NotebookText, label: "Mes Notes", type: 'link' },
      ];
    } else if (currentRole === 'creator') {
      return [
        ...baseItems,
        {
          type: 'dropdown',
          icon: BookOpen,
          label: "Cours",
          items: [
            { to: "/courses", label: "Mes Cours", icon: BookOpen },
            { to: "/create-course", label: "Créer un cours", icon: PlusSquare },
          ],
        },
        { to: "/class-management", icon: School, label: "Gestion des Classes", type: 'link' },
        { to: "/analytics", icon: BarChart2, label: "Analytiques", type: 'link' },
      ];
    } else if (currentRole === 'tutor') {
      return [
        ...baseItems,
        { to: "/class-management", icon: School, label: "Gestion des Élèves", type: 'link' },
        { to: "/analytics", icon: BarChart2, label: "Suivi des Élèves", type: 'link' },
      ];
    }
    return baseItems;
  };

  const navItems = getNavItems();

  // For BottomNavigationBar, we need a flat list of links
  const bottomNavItems = navItems.flatMap(item => {
    if (item.type === 'link' && item.to) {
      return [{ to: item.to, icon: item.icon, label: item.label }];
    } else if (item.type === 'dropdown' && item.items) {
      // For mobile, keep them as separate links for simplicity
      return item.items.map(subItem => ({ to: subItem.to, icon: subItem.icon || item.icon, label: subItem.label }));
    }
    return [];
  });

  return (
    <div className="flex flex-col min-h-screen bg-muted/40 overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 px-2 py-4 flex items-center justify-between border-b backdrop-blur-lg bg-background/80">
        <Logo />
        {/* Navigation pour les écrans non mobiles */}
        {!isMobile && (
          <nav className="flex flex-grow justify-center items-center gap-2 sm:gap-4 flex-wrap">
            {navItems.map((item) => (
              item.type === 'link' && item.to ? (
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
              ) : item.type === 'dropdown' && item.items ? (
                <DropdownMenu key={item.label}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center p-2 rounded-md text-sm font-medium whitespace-nowrap hover:bg-accent hover:text-accent-foreground"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {item.items.map((subItem) => (
                      <DropdownMenuItem key={subItem.to} onClick={() => navigate(subItem.to)}>
                        {subItem.icon && <subItem.icon className="mr-2 h-4 w-4" />}
                        <span>{subItem.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          {/* Global Search Button (Desktop only) */}
          {!isMobile && (
            <Button variant="outline" size="icon" onClick={() => setIsSearchOverlayOpen(true)}>
              <Search className="h-5 w-5" />
              <span className="sr-only">Recherche globale</span>
            </Button>
          )}

          <ThemeToggle />
          {/* Menu déroulant pour les actions utilisateur */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">Menu utilisateur</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Mon profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className={cn("flex-grow p-4 sm:p-6 md:p-8 pt-24 md:pt-32", isMobile && "pb-20")}>
        <Outlet />
      </main>
      <BottomNavigationBar navItems={bottomNavItems} onOpenGlobalSearch={() => setIsSearchOverlayOpen(true)} />
      <AiAPersistentChat />
      <FloatingAiAChatButton />
      <GlobalSearchOverlay isOpen={isSearchOverlayOpen} onClose={() => setIsSearchOverlayOpen(false)} />
    </div>
  );
};

export default DashboardLayout;