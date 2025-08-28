import React from 'react';
import { cn } from "@/lib/utils";

interface LogoProps {
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  onLogoClick?: () => void; // New prop for click handler
}

const Logo = ({ iconClassName, textClassName, showText = true, onLogoClick = () => {} }: LogoProps) => { // Ajout d'une fonction vide par défaut
  return (
    <div className="flex items-center gap-2" onClick={onLogoClick}> {/* Attach onClick handler here */}
      <div className={cn("w-8 h-8", iconClassName)}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="50%" stopColor="hsl(var(--foreground))" />
              <stop offset="100%" stopColor="hsl(var(--primary))" />
            </linearGradient>
          </defs>
          {/* Orbits */}
          <ellipse cx="50" cy="50" rx="45" ry="20" stroke="url(#logoGradient)" strokeWidth="3" fill="none" transform="rotate(30 50 50)" />
          <ellipse cx="50" cy="50" rx="45" ry="20" stroke="url(#logoGradient)" strokeWidth="3" fill="none" transform="rotate(-30 50 50)" />
          <ellipse cx="50" cy="50" rx="20" ry="45" stroke="url(#logoGradient)" strokeWidth="3" fill="none" />
          
          {/* Nucleus */}
          <circle cx="50" cy="50" r="10" fill="url(#logoGradient)" />

          {/* Electrons using SVG animation */}
          <circle r="5" fill="url(#logoGradient)">
            <animateMotion dur="4s" repeatCount="indefinite" path="M 50,30 A 45 20 30 1 1 49.9,30.1 Z" />
          </circle>
          <circle r="5" fill="url(#logoGradient)">
             <animateMotion dur="5s" repeatCount="indefinite" path="M 50,70 A 45 20 -30 1 1 49.9,70.1 Z" />
          </circle>
          <circle r="5" fill="url(#logoGradient)">
             <animateMotion dur="6s" repeatCount="indefinite" path="M 30,50 A 20 45 0 1 1 29.9,50.1 Z" />
          </circle>
        </svg>
      </div>
      {showText && (
        <h1 className={cn(
          "text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan",
          textClassName
        )}>
          AcademIA
        </h1>
      )}
    </div>
  );
};

export default Logo;