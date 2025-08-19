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
import { useNavigate } from "react-router-dom"; // Utiliser useNavigate au lieu de Link direct
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRole } from "@/contexts/RoleContext"; // Importer useRole
import { dummyStudents } from "@/lib/studentData"; // Importer les élèves fictifs
import { showError, showSuccess } from "@/utils/toast"; // Importer les toasts

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterClick: () => void;
}

const LoginModal = ({ isOpen, onClose, onRegisterClick }: LoginModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // Pour l'instant, le mot de passe n'est pas validé
  const navigate = useNavigate();
  const { setRole } = useRole();

  const handleLogin = () => {
    const student = dummyStudents.find(s => s.email === email);

    if (student) {
      // Pour l'instant, nous ne validons pas le mot de passe.
      // Dans une vraie application, vous auriez une logique d'authentification backend ici.
      setRole('student'); // Définir le rôle sur 'student'
      showSuccess(`Bienvenue, ${student.firstName} ${student.lastName} !`); // Utiliser prénom et nom
      navigate("/dashboard");
      onClose();
    } else {
      showError("Email ou mot de passe incorrect.");
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