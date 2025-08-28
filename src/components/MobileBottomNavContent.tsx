import React from 'react';
import { Button } from "@/components/ui/button";
import { Search, BotMessageSquare, User, LogIn, Settings, LogOut, MessageSquare, Menu } from "lucide-react"; // Added Menu icon
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

  const commonButtonClasses = "rounded-full h-10 w-10 bg-muted/20 hover:bg-muted/40";

  const buttonPressAnimation = {
    scale: 0.95,
    transition: { duration: 0.1, ease: "easeOut" },
  };

  return (
    <div className="flex items-center justify-around w-full h-[68px] px-4 py-3 relative">
      {isAuthenticated ? (
        <>
          {/* Left side buttons */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div whileTap={buttonPressAnimation}>
                <Button variant="ghost" size="icon" onClick={onToggleMobileNavSheet} className={commonButtonClasses}>
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Ouvrir le menu</span>
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent className="backdrop-blur-lg bg-background/80 z-50">
              <p>Menu</p>
            </TooltipContent>
          </Tooltip>

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

          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div whileTap={buttonPressAnimation}>
                <Button variant="ghost" size="icon" onClick={() => navigate('/messages')} className={commonButtonClasses}>
                  <MessageSquare className="h-5 w-5" />
                  <span className="sr-only">Messagerie</span>
                  {unreadMessagesCount > 0 && (
                    <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadMessagesCount}
                    </span>
                  )}
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent className="backdrop-blur-lg bg-background/80 z-50">
              <p>Messagerie</p>
            </TooltipContent>
          </Tooltip>

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
        </>
      ) : (
        <div className="flex items-center justify-around w-full h-full">
          {/* Left side: Menu button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div whileTap={buttonPressAnimation}>
                <Button variant="ghost" size="icon" onClick={onToggleMobileNavSheet} className={commonButtonClasses}>
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Ouvrir le menu</span>
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent className="backdrop-blur-lg bg-background/80 z-50">
              <p>Menu</p>
            </TooltipContent>
          </Tooltip>

          {/* Center: Login button */}
          <Button variant="outline" onClick={() => navigate('/auth')} className={commonButtonClasses}>
            <LogIn className="h-5 w-5" />
            <span className="sr-only">Connexion</span>
          </Button>

          {/* Right side: MessageSquare button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div whileTap={buttonPressAnimation}>
                <Button variant="ghost" size="icon" onClick={() => navigate('/auth')} className={commonButtonClasses}>
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
      )}
    </div>
  );
};

export default MobileBottomNavContent;