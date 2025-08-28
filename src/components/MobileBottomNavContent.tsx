import React from 'react';
import { Button } from "@/components/ui/button";
import { Search, BotMessageSquare, User, LogIn, Settings, LogOut } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { useRole } from "@/contexts/RoleContext";
import { useNavigate } from "react-router-dom";
import { Profile } from "@/lib/dataModels";
import Logo from './Logo';

interface MobileBottomNavContentProps {
  onOpenGlobalSearch?: () => void;
  onOpenAiAChat?: () => void;
  onOpenMobileNavSheet: () => void;
  onInitiateThemeChange: (newTheme: Profile['theme']) => void;
  isAuthenticated: boolean;
  unreadMessagesCount?: number; // Make optional for unauthenticated case
}

const MobileBottomNavContent = ({
  onOpenGlobalSearch,
  onOpenAiAChat,
  onOpenMobileNavSheet,
  onInitiateThemeChange,
  isAuthenticated,
  unreadMessagesCount = 0, // Default to 0 if not provided
}: MobileBottomNavContentProps) => {
  const { currentUserProfile, signOut } = useRole();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const commonButtonClasses = "rounded-full h-10 w-10 bg-muted/20 hover:bg-muted/40";
  const centralLogoButtonClasses = "relative rounded-full h-14 w-14 shadow-lg -mt-10 border-2 border-primary ring-2 ring-primary/50 bg-background/80";

  return (
    <div className="flex items-center justify-around w-full h-[68px] px-4 py-3">
      {isAuthenticated ? (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onOpenGlobalSearch} className={commonButtonClasses}>
                <Search className="h-5 w-5" />
                <span className="sr-only">Recherche globale</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="backdrop-blur-lg bg-background/80 z-50">
              <p>Recherche (Ctrl + F)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onOpenAiAChat} className={commonButtonClasses}>
                <BotMessageSquare className="h-5 w-5" />
                <span className="sr-only">AiA Chat</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="backdrop-blur-lg bg-background/80 z-50">
              <p>AiA Chat</p>
            </TooltipContent>
          </Tooltip>

          {/* Central Logo Button - Authenticated */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenMobileNavSheet}
            className={centralLogoButtonClasses}
          >
            <Logo iconClassName="h-8 w-8" showText={false} />
            <span className="sr-only">Ouvrir le menu</span>
            {unreadMessagesCount > 0 && (
              <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {unreadMessagesCount}
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={commonButtonClasses}>
                <User className="h-5 w-5" />
                <span className="sr-only">Menu utilisateur</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="backdrop-blur-lg bg-background/80">
              <DropdownMenuLabel>{currentUserProfile?.first_name} {currentUserProfile?.last_name}</DropdownMenuLabel>
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

          <ThemeToggle onInitiateThemeChange={onInitiateThemeChange} />
        </>
      ) : (
        // Unauthenticated layout: only central logo (navigates to auth) and theme toggle
        <div className="flex items-center justify-center w-full h-full"> {/* Use justify-center for centering */}
          {/* Central Logo Button - Unauthenticated */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/auth')}
            className={centralLogoButtonClasses}
          >
            <Logo iconClassName="h-8 w-8" showText={false} />
            <span className="sr-only">Connexion</span>
          </Button>
          <div className="absolute right-4"> {/* Position theme toggle absolutely to the right */}
            <ThemeToggle onInitiateThemeChange={onInitiateThemeChange} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileBottomNavContent;