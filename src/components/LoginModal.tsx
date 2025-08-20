import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRole } from "@/contexts/RoleContext";
import { getProfileByUsername, getProfileByEmail } from "@/lib/studentData"; // Import profile lookup functions
import { showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterClick: () => void;
}

const LoginModal = ({ isOpen, onClose, onRegisterClick }: LoginModalProps) => {
  const [email, setEmail] = useState(""); // Supabase uses email for login
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setCurrentUserProfile } = useRole();

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      console.error("Login error:", error);
      showError(`Erreur de connexion: ${error.message}`);
    } else if (data.user) {
      // Fetch profile after successful login
      const profile = await getProfileByUsername(data.user.user_metadata.username); // Assuming username is in user_metadata
      if (profile) {
        setCurrentUserProfile(profile);
        showSuccess(`Bienvenue, ${profile.username} !`);
        navigate("/dashboard");
        onClose();
      } else {
        showError("Profil utilisateur introuvable après connexion.");
        await supabase.auth.signOut(); // Log out if profile not found
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-sm p-0 border-primary/20 shadow-lg shadow-primary/10">
        <Card className="border-none shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl">Connexion</CardTitle>
            <CardDescription>
              Entrez vos identifiants pour accéder à votre espace.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" onClick={handleLogin}>Se connecter</Button>
            <div className="text-sm text-muted-foreground">
              Pas de compte?{" "}
              <Button variant="link" onClick={onRegisterClick} className="p-0 h-auto text-primary hover:underline">
                Créer un compte
              </Button>
            </div>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;