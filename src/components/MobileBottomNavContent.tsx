import React from 'react';
import { Button } from "@/components/ui/button";
import { Search, BotMessageSquare, User, LogIn, Settings, LogOut, MessageSquare } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle"; // Still needed for desktop header, but not directly in this component's main layout
import { useRole } from "@/contexts/RoleContext";
import { useNavigate } from "react-router-dom";
import { Profile } from "@/lib/dataModels";
import Logo from './Logo';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MobileBottomNavContentProps {
  onOpenGlobalSearch?: () => void;
  onOpenAiAChat?: () => void;
  onToggleMobileNavSheet: () => void;
  onInitiateThemeChange: (newTheme: Profile['theme']) => void;
  isAuthenticated: boolean;
  unreadMessagesCount?: number;
  isMobileNavSheetOpen: boolean; // New prop to control animation
}

const MobileBottomNavContent = ({
  onOpenGlobalSearch,
  onOpenAiAChat,
  onToggleMobileNavSheet,
  onInitiateThemeChange,
  isAuthenticated,
  unreadMessagesCount = 0,
  isMobileNavSheetOpen,
}: MobileBottomNavContentProps) => {
  const { currentUserProfile, signOut } = useRole();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const commonButtonClasses = "rounded-full h-12 w-12 bg-muted/20 hover:bg-muted/40";
  const centralLogoButtonClasses = cn(
    "relative rounded-full h-20 w-20 shadow-lg bg-background/80 mt-[-34px] z-[997] overflow-hidden" // Removed border-2 border-border
  );

  const buttonPressAnimation = {
    scale: 0.95,
    transition: { duration: 0.1, ease: "easeOut" },
  };

  return (
    <div className="flex items-center justify-between w-full h-full relative px-4">
      {isAuthenticated ? (
        <>
          {/* Left group of buttons */}
          <div className="flex items-center gap-16">
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileTap={buttonPressAnimation}>
                  <Button variant="ghost" size="icon" onClick={onOpenGlobalSearch} className={commonButtonClasses}>
                    <Search className="h-5 w-5" />
                    <span className="sr-only">Recherche globale</span>
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent className="backdrop-blur-lg bg-background/80 z-50">
                <p>Recherche (Ctrl + F)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileTap={buttonPressAnimation}>
                  <Button variant="ghost" size="icon" onClick={onOpenAiAChat} className={commonButtonClasses}>
                    <BotMessageSquare className="h-5 w-5" />
                    <span className="sr-only">AiA Chat</span>
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent className="backdrop-blur-lg bg-background/80 z-50">
                <p>AiA Chat</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Central button */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleMobileNavSheet()}
              className={centralLogoButtonClasses}
              asChild
            >
              <motion.div whileTap={buttonPressAnimation} className="flex items-center justify-center h-full w-full">
                {/* Removed the inner div that was simulating the top border */}
                <motion.div
                  animate={{ rotate: isMobileNavSheetOpen ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <Logo iconClassName="h-12 w-12" showText={false} />
                </motion.div>
                <span className="sr-only">Ouvrir le menu</span>
                {unreadMessagesCount > 0 && (
                  <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadMessagesCount}
                  </span>
                )}
              </motion.div>
            </Button>
          </div>

          {/* Right group of buttons */}
          <div className="flex items-center gap-16">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileTap={buttonPressAnimation}>
                  <Button variant="ghost" size="icon" className={commonButtonClasses}>
                    <User className="h-5 w-5" />
                    <span className="sr-only">Menu utilisateur</span>
                  </Button>
                </motion.div>
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

            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileTap={buttonPressAnimation}>
                  <Button variant="ghost" size="icon" onClick={() => navigate('/messages')} className={commonButtonClasses}>
                    <MessageSquare className="h-5 w-5" />
                    <span className="sr-only">Messagerie</span>
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent className="backdrop-blur-lg bg-background/80 z-50">
                <p>Messagerie</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between w-full h-full px-4">
          {/* Left side: Login button */}
          <Button variant="outline" onClick={() => navigate('/auth')} className={commonButtonClasses}>
            <LogIn className="h-5 w-5" />
            <span className="sr-only">Connexion</span>
          </Button>

          {/* Central button */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                console.log("Central button clicked!");
                onToggleMobileNavSheet(); // Open NavSheet for unauthenticated users
              }}
              className={centralLogoButtonClasses}
              asChild
            >
              <motion.div whileTap={buttonPressAnimation} className="flex items-center justify-center h-full w-full">
                {/* Removed the inner div that was simulating the top border */}
                <motion.div
                  animate={{ rotate: isMobileNavSheetOpen ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <Logo iconClassName="h-12 w-12" showText={false} />
                </motion.div>
                <span className="sr-only">Ouvrir le menu</span>
              </motion.div>
            </Button>
          </div>

          {/* Right side: MessageSquare button */}
          <Button variant="outline" onClick={() => navigate('/auth')} className={commonButtonClasses}>
            <MessageSquare className="h-5 w-5" />
            <span className="sr-only">Messagerie</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default MobileBottomNavContent;