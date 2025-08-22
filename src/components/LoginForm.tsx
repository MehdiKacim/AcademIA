import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToSignup: () => void; // New prop to switch to signup
}

export const LoginForm = ({ onSuccess, onSwitchToSignup }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    setIsLoading(true);
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

  return (
    <form onSubmit={handleLogin} className="grid gap-4"> {/* Added form tag and onSubmit handler */}
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
      <Button type="submit" className="w-full" disabled={isLoading}> {/* Changed to type="submit" */}
        {isLoading ? "Connexion en cours..." : "Se connecter"}
      </Button>
      <div className="text-sm text-muted-foreground text-center mt-2">
        Pas de compte?{" "}
        <Button variant="link" onClick={onSwitchToSignup} className="p-0 h-auto text-primary hover:underline">
          Créer un compte
        </Button>
      </div>
    </form>
  );
};