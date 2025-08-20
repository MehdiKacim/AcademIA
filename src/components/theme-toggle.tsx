"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useRole } from "@/contexts/RoleContext"; // Import useRole

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { currentUserProfile, updateUserTheme } = useRole();

  // Sync theme from user profile to next-themes when profile loads
  React.useEffect(() => {
    if (currentUserProfile?.theme && currentUserProfile.theme !== theme) {
      setTheme(currentUserProfile.theme);
    }
  }, [currentUserProfile?.theme, theme, setTheme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (currentUserProfile) {
      updateUserTheme(newTheme); // Save to Supabase
    }
    console.log("Theme toggled to:", newTheme);
  }

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}