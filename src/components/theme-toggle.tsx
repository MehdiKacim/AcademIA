"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useRole } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Profile } from "@/lib/dataModels" // Import Profile type

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { currentUserProfile, updateUserTheme } = useRole();

  // Sync theme from user profile to next-themes when profile loads
  React.useEffect(() => {
    if (currentUserProfile?.theme && currentUserProfile.theme !== theme) {
      setTheme(currentUserProfile.theme);
    }
  }, [currentUserProfile?.theme, theme, setTheme]);

  const handleThemeChange = (newTheme: Profile['theme']) => {
    setTheme(newTheme);
    if (currentUserProfile) {
      updateUserTheme(newTheme); // Save to Supabase
    }
    console.log("Theme changed to:", newTheme);
  }

  return (
    <Select value={theme} onValueChange={handleThemeChange}>
      <SelectTrigger className="w-[180px]">
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
        <SelectValue placeholder="Sélectionner un thème" />
      </SelectTrigger>
      <SelectContent className="backdrop-blur-lg bg-background/80">
        <SelectItem value="light">Clair</SelectItem>
        <SelectItem value="dark">Sombre</SelectItem>
        <SelectItem value="dark-purple">Violet Sombre</SelectItem>
      </SelectContent>
    </Select>
  )
}