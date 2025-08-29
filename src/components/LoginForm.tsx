import React, { useState } from "react";
import { Button, MotionButton } from "@/components/ui/button"; // Import MotionButton
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import LoadingSpinner from "@/components/LoadingSpinner"; // Import LoadingSpinner

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToSignup: () => void; // Re-added prop for consistency with AuthPage
  onForgotPasswordClick: () => void; // New prop
  onAuthTransition: (message: string, callback?: () => void) => void; // New prop
}

export const LoginForm = ({ onSuccess, onSwitchToSignup, onForgotPasswordClick, onAuthTransition }: LoginFormProps) => { // Add onAuthTransition prop
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    setIsLoading(true);

    const performLogin = async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        console.error("Login error:", error);
        showError(`Erreur de connexion: ${error.message}`);
      } else if (data.user) {
        onSuccess();
      }
      setIsLoading(false);
    };

    onAuthTransition("Connexion en cours...", performLogin); // Trigger overlay before actual login
  };

  return (
    <form onSubmit={handleLogin} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email" // Unique ID
          type="email"
          placeholder="m@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email" // Added autocomplete
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="login-password">Mot de passe</Label>
        <Input
          id="login-password" // Unique ID
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password" // Added autocomplete
        />
      </div>
      <MotionButton type="submit" className="w-full" disabled={isLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        {isLoading ? <LoadingSpinner iconClassName="h-4 w-4 mr-2" /> : "Se connecter"}
      </MotionButton>
    </form>
  );
};