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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addStudent, dummyStudents } from "@/lib/studentData"; // Import addStudent and dummyStudents
import { showSuccess, showError } from "@/utils/toast";
import { Student } from "@/lib/dataModels"; // Import Student type

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}

const RegisterModal = ({ isOpen, onClose, onLoginClick }: RegisterModalProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState(''); // Nouveau: état pour le username
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    if (!firstName.trim() || !lastName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      showError("Tous les champs sont requis.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      showError("Veuillez entrer une adresse email valide.");
      return;
    }
    if (dummyStudents.some(s => s.email === email)) {
      showError("Cet email est déjà utilisé.");
      return;
    }
    if (dummyStudents.some(s => s.username === username)) {
      showError("Ce nom d'utilisateur est déjà pris.");
      return;
    }

    const newStudent: Student = {
      id: `student${Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim(), // Sauvegarde du username
      email: email.trim(),
      classId: undefined,
      establishmentId: undefined,
      enrolledCoursesProgress: [],
    };

    addStudent(newStudent); // Ajout du nouvel élève
    showSuccess("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
    onClose();
    onLoginClick(); // Rediriger vers le modal de connexion
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-sm p-0 border-primary/20 shadow-lg shadow-primary/10">
        <Card className="border-none shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl">Créer un compte</CardTitle>
            <CardDescription>
              Rejoignez AcademIA pour commencer votre parcours d'apprentissage.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" type="text" placeholder="John" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" type="text" placeholder="Doe" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input id="username" type="text" placeholder="john_doe" required value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
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
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" onClick={handleRegister}>S'inscrire</Button>
            <div className="text-sm text-muted-foreground">
              Déjà un compte?{" "}
              <Button variant="link" onClick={onLoginClick} className="p-0 h-auto text-primary hover:underline">
                Se connecter
              </Button>
            </div>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterModal;