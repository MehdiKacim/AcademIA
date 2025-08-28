import React from 'react';
import { Button } from "@/components/ui/button";
import { Search, BotMessageSquare, User, Menu, LogOut, Settings, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { useRole } from "@/contexts/RoleContext";
import { useCourseChat } from "@/contexts/CourseChatContext";
import { useNavigate } from "react-router-dom";
import { Profile } from "@/lib/dataModels";

interface MobileBottomNavContentProps {
  onOpenGlobalSearch: () => void;
  onOpenAiAChat: () => void;
  onOpenMobileNavSheet: () => void;
  onInitiateThemeChange: (newTheme: Profile['theme']) => void;
}

const MobileBottomNavContent = ({
  onOpenGlobalSearch,
  onOpenAiAChat,
  onOpenMobileNavSheet,
  onInitiateThemeChange,
}: MobileBottomNavContentProps) => {
  const { currentUserProfile, signOut } = useRole();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (!currentUserProfile) {
    return null; // Should not happen if this is only rendered for logged-in users
  }

  return (
    <div className="flex items-center justify-around w-full h-[68px] px-4 py-3">
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

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onOpenMobileNavSheet} className="rounded-full h-10 w-10 bg-muted/20 hover:bg-muted/40">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Ouvrir le menu</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="backdrop-blur-lg bg-background/80 z-50">
          <p>Menu</p>
        </TooltipContent>
      </Tooltip>

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

      <ThemeToggle onInitiateThemeChange={onInitiateThemeChange} />
    </div>
  );
};

export default MobileBottomNavContent;