import React from 'react';
import { Button } from "@/components/ui/button";
import { Search, BotMessageSquare, User, LogIn, Settings, LogOut, MessageSquare } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle"; 
import { useRole } from "@/contexts/RoleContext";
import { useNavigate } from "react-router-dom";
import { Profile } from "@/lib/dataModels";
import Logo from './Logo';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Create a MotionButton component by wrapping the shadcn Button with framer-motion
const MotionButton = motion(Button);

interface MobileBottomNavContentProps {
  onOpenGlobalSearch?: () => void;
  onOpenAiAChat?: () => void;
  onToggleMobileNavSheet: () => void;
  isAuthenticated: boolean;
  unreadMessagesCount?: number;
  isMobileNavSheetOpen: boolean; // New prop to control animation
  onInitiateThemeChange: (newTheme: Profile['theme']) => void; // Add onInitiateThemeChange prop
}

const MobileBottomNavContent = ({
  onOpenGlobalSearch,
  onOpenAiAChat,
  onToggleMobileNavSheet,
  isAuthenticated,
  unreadMessagesCount = 0,
  isMobileNavSheetOpen,
  onInitiateThemeChange, // Destructure the new prop
}: MobileBottomNavContentProps) => {
  const { currentUserProfile, signOut } = useRole();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // Unified button classes for the 4 peripheral buttons
  const peripheralNavButtonClasses = "rounded-full h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 bg-muted/20 hover:bg-muted/40 flex items-center justify-center";
  
  // Removed buttonPressAnimation as per user request

  return (
    <div className="flex items-center justify-around w-full h-full relative px-2">
      {isAuthenticated ? (
        <>
          {/* Search Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <MotionButton variant="ghost" size="icon" onClick={onOpenGlobalSearch} className={peripheralNavButtonClasses}>
                <Search className="h-5 w-5" />
                <span className="sr-only">Recherche globale</span>
              </MotionButton>
            </TooltipTrigger>
            <TooltipContent className="backdrop-blur-lg bg-background/80 z-50">
              <p>Recherche (Ctrl + F)</p>
            </TooltipContent>
          </Tooltip>

          {/* AiA Chat Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <MotionButton variant="ghost" size="icon" onClick={onOpenAiAChat} className={peripheralNavButtonClasses}>
                <BotMessageSquare className="h-5 w-5" />
                <span className="sr-only">AiA Chat</span>
              </MotionButton>
            </TooltipTrigger>
            <TooltipContent className="backdrop-blur-lg bg-background/80 z-50">
              <p>AiA Chat</p>
            </TooltipContent>
          </Tooltip>

          {/* Central Menu/Logo Button */}
          <div className={cn(
              "relative rounded-full flex items-center justify-center",
              "h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28", // Wrapper size
              "translate-y-[-34px] z-[1000]", // Lifted position and increased z-index to 1000
              "transition-all duration-300 ease-in-out", // For smooth ring transition
              isMobileNavSheetOpen ? "ring-2 ring-primary" : "ring-0" // Conditional ring for active state
          )}>
            <MotionButton
                variant="ghost"
                size="icon"
                onClick={() => onToggleMobileNavSheet()}
                className={cn(
                    "absolute inset-0 m-auto rounded-full", // Position inside wrapper
                    "h-15 w-15 sm:h-19 sm:w-19 md:h-23 md:w-23", // Adjusted button size for a slightly more visible border
                    "backdrop-blur-lg bg-background/80 text-foreground hover:bg-muted/40", // Blurred background for the button itself
                    "flex items-center justify-center" // Ensure content is centered
                )}
                animate={{ rotate: isMobileNavSheetOpen ? 360 : 0 }} // Apply rotation here
                transition={{ duration: 1.5, ease: "easeInOut" }}
            >
              <Logo iconClassName="h-10 w-10" showText={false} disableInternalAnimation={false} /> {/* Pass disableInternalAnimation={false} */}
              <span className="sr-only">Ouvrir le menu</span>
              {unreadMessagesCount > 0 && (
                <span className="absolute top-[-4px] right-[-4px] transform translate-x-0 translate-y-0 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {unreadMessagesCount}
                </span>
              )}
            </MotionButton>
          </div>

          {/* User Dropdown Button */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <MotionButton variant="ghost" size="icon" className={peripheralNavButtonClasses}>
                    <User className="h-5 w-5" />
                    <span className="sr-only">Menu utilisateur</span>
                  </MotionButton>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent className="backdrop-blur-lg bg-background/80 z-50">
                <p>Menu utilisateur</p>
              </TooltipContent>
            </Tooltip>
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

          {/* Messages Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <MotionButton variant="ghost" size="icon" onClick={() => navigate('/messages')} className={peripheralNavButtonClasses}>
                <MessageSquare className="h-5 w-5" />
                <span className="sr-only">Messagerie</span>
              </MotionButton>
            </TooltipTrigger>
            <TooltipContent className="backdrop-blur-lg bg-background/80 z-50">
              <p>Messagerie</p>
            </TooltipContent>
          </Tooltip>
        </>
      ) : (
        <div className="flex items-center justify-around w-full h-full px-2">
          {/* Left side: Login button */}
          <MotionButton variant="outline" onClick={() => navigate('/auth')} className={peripheralNavButtonClasses}>
            <LogIn className="h-5 w-5" />
            <span className="sr-only">Connexion</span>
          </MotionButton>

          {/* Central Menu/Logo Button for unauthenticated */}
          <div className={cn(
              "relative rounded-full flex items-center justify-center",
              "h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28", // Wrapper size
              "translate-y-[-34px] z-[1000]", // Lifted position and increased z-index to 1000
              "transition-all duration-300 ease-in-out", // For smooth ring transition
              isMobileNavSheetOpen ? "ring-2 ring-primary" : "ring-0" // Conditional ring for active state
          )}>
            <MotionButton
                variant="ghost"
                size="icon"
                onClick={() => onToggleMobileNavSheet()}
                className={cn(
                    "absolute inset-0 m-auto rounded-full", // Position inside wrapper
                    "h-15 w-15 sm:h-19 sm:w-19 md:h-23 md:w-23", // Adjusted button size for a slightly more visible border
                    "backdrop-blur-lg bg-background/80 text-foreground hover:bg-muted/40", // Blurred background for the button itself
                    "flex items-center justify-center" // Ensure content is centered
                )}
                animate={{ rotate: isMobileNavSheetOpen ? 360 : 0 }} // Apply rotation here
                transition={{ duration: 1.5, ease: "easeInOut" }}
            >
              <Logo iconClassName="h-10 w-10" showText={false} disableInternalAnimation={false} /> {/* Pass disableInternalAnimation={false} */}
              <span className="sr-only">Ouvrir le menu</span>
            </MotionButton>
          </div>

          {/* Right side: Theme Toggle */}
          <ThemeToggle onInitiateThemeChange={onInitiateThemeChange} className={peripheralNavButtonClasses} />
        </div>
      )}
    </div>
  );
};

export default MobileBottomNavContent;