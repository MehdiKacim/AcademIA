"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useRole } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Profile } from "@/lib/dataModels" // Import Profile type
import { cn } from "@/lib/utils"; // Import cn for conditional styling

interface ThemeToggleProps {
  onInitiateThemeChange: (newTheme: Profile['theme']) => void;
}

export function ThemeToggle({ onInitiateThemeChange }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const { currentUserProfile, updateUserTheme } = useRole();

  // Sync theme from user profile to next-themes when profile loads
  React.useEffect(() => {
    if (currentUserProfile?.theme && currentUserProfile.theme !== theme) {
      setTheme(currentUserProfile.theme);
    }
  }, [currentUserProfile?.theme, theme, setTheme]);

  const handleThemeChange = (newTheme: Profile['theme']) => {
    onInitiateThemeChange(newTheme); // Appelle la fonction passée en prop pour gérer l'animation
    if (currentUserProfile) {
      updateUserTheme(newTheme); // Sauvegarde dans Supabase
    }
    // console.log("Theme change initiated for:", newTheme);
  }

  return (
    <Select value={theme} onValueChange={handleThemeChange}>
      <SelectTrigger className={cn(
        "w-fit px-3 py-2 rounded-full", // Make it fit content and rounded
        "border-none bg-muted/50 hover:bg-muted/80", // Android-like background
        "text-muted-foreground hover:text-foreground" // Text color
      )}>
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
        {/* Removed SelectValue to make it icon-only for compact display */}
      </SelectTrigger>
      <SelectContent className="backdrop-blur-lg bg-background/80 rounded-android-tile">
        <SelectItem value="light">Clair</SelectItem>
        <SelectItem value="dark">Sombre</SelectItem>
        <SelectItem value="dark-purple">Violet Sombre</SelectItem>
      </SelectContent>
    </Select>
  )
}