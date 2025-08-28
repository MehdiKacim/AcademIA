import React from 'react';
import { Button } from "@/components/ui/button";
import { Search, BotMessageSquare, User, Menu, LogOut, Settings, Info, LogIn } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { useRole } from "@/contexts/RoleContext";
import { useNavigate } from "react-router-dom";
import { Profile } from "@/lib/dataModels";
import Logo from './Logo'; // Import Logo

interface MobileBottomNavContentProps {
  onOpenGlobalSearch?: () => void; // Optional for unauthenticated
  onOpenAiAChat?: () => void;     // Optional for unauthenticated
  onOpenMobileNavSheet: () => void;
  onInitiateThemeChange: (newTheme: Profile['theme']) => void;
  isAuthenticated: boolean;
}

const MobileBottomNavContent = ({
  onOpenGlobalSearch,
  onOpenAiAChat,
  onOpenMobileNavSheet,
  onInitiateThemeChange,
  isAuthenticated,
}: MobileBottomNavContentProps) => {
  const { currentUserProfile, signOut } = useRole();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex items-center justify-around w-full h-[68px] px-4 py-3">
      {isAuthenticated && onOpenGlobalSearch && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onOpenGlobalSearch} className="rounded-full h-10 w-10 bg-muted/20 hover:bg-muted/40">
              <Search className="h-5 w-5" />
              <span className="sr-only">Recherche globale</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="backdrop-blur-lg bg-background/80 z-50">
            <p>Recherche (Ctrl + F)</p>
          </TooltipContent>
        </Tooltip>
      )}

      {isAuthenticated && onOpenAiAChat && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onOpenAiAChat} className="rounded-full h-10 w-10 bg-muted/20 hover:bg-muted/40">
              <BotMessageSquare className="h-5 w-5" />
              <span className="sr-only">AiA Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="backdrop-blur-lg bg-background/80 z-50">
            <p>AiA Chat</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Central Logo Button */}
      <Button variant="ghost" size="icon" onClick={onOpenMobileNavSheet} className="rounded-full h-14 w-14 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg -mt-4">
        <Logo iconClassName="h-8 w-8" showText={false} />
        <span className="sr-only">Ouvrir le menu</span>
      </Button>

      {isAuthenticated && currentUserProfile ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-muted/20 hover:bg-muted/40">
              <User className="h-5 w-5" />
              <span className="sr-only">Menu utilisateur</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="backdrop-blur-lg bg-background/80">
            <DropdownMenuLabel>{currentUserProfile.first_name} {currentUserProfile.last_name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" /> Mon Profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" /> Paramètres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="ghost" size="icon" onClick={() => navigate('/auth')} className="rounded-full h-10 w-10 bg-muted/20 hover:bg-muted/40">
          <LogIn className="h-5 w-5" />
          <span className="sr-only">Connexion</span>
        </Button>
      )}

      <ThemeToggle onInitiateThemeChange={onInitiateThemeChange} />
    </div>
  );
};

export default MobileBottomNavContent;