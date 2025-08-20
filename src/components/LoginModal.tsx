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
import { getUserByEmail, getUserByUsername } from "@/lib/studentData"; // Import user lookup functions
import { showError, showSuccess } from "@/utils/toast";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterClick: () => void;
}

const LoginModal = ({ isOpen, onClose, onRegisterClick }: LoginModalProps) => {
  const [identifier, setIdentifier] = useState(""); // Can be email or username
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setCurrentUser } = useRole();

  const handleLogin = () => {
    const userByEmail = getUserByEmail(identifier);
    const userByUsername = getUserByUsername(identifier);

    const user = userByEmail || userByUsername;

    if (user && user.passwordHash === password) { // For demo, passwordHash is plain password
      setCurrentUser(user);
      showSuccess(`Bienvenue, ${user.username} !`);
      navigate("/dashboard");
      onClose();
    } else {
      showError("Identifiant ou mot de passe incorrect.");
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
              <Label htmlFor="identifier">Email ou Nom d'utilisateur</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="m@example.com ou mon_pseudo"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
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