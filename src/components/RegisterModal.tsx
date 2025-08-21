import React, { useState, useEffect, useRef } from "react";
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
} from "@/components/ui/dialog";
import { getProfileByUsername } from "@/lib/studentData"; // Import profile lookup functions
import { showSuccess, showError } from "@/utils/toast";
import { Profile } from "@/lib/dataModels";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}

const RegisterModal = ({ isOpen, onClose, onLoginClick }: RegisterModalProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'creator' | 'tutor'>('student'); // Default role

  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset states when modal closes
      setFirstName('');
      setLastName('');
      setUsername('');
      setEmail('');
      setPassword('');
      setRole('student');
      setUsernameAvailable(null);
      setUsernameCheckLoading(false);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    }
  }, [isOpen]);

  const checkUsernameAvailability = async (currentUsername: string) => {
    if (currentUsername.trim() === '') {
      setUsernameAvailable(null);
      setUsernameCheckLoading(false);
      return;
    }

    setUsernameCheckLoading(true);
    setUsernameAvailable(null);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      const isTaken = await getProfileByUsername(currentUsername);
      setUsernameAvailable(!isTaken);
      setUsernameCheckLoading(false);
    }, 500);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    checkUsernameAvailability(newUsername);
  };

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      showError("Tous les champs sont requis.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      showError("Veuillez entrer une adresse email valide.");
      return;
    }
    
    if (usernameAvailable === false) {
      showError("Ce nom d'utilisateur est déjà pris. Veuillez en choisir un autre.");
      return;
    }
    if (usernameAvailable === null || usernameCheckLoading) {
      showError("Veuillez attendre la vérification du nom d'utilisateur.");
      return;
    }

    // Supabase signup
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          username: username.trim(),
          role: role,
        },
      },
    });

    if (error) {
      console.error("Signup error:", error);
      if (error.message.includes('User already registered')) {
        showError("Cet email est déjà enregistré. Veuillez vous connecter.");
      } else {
        showError(`Erreur d'inscription: ${error.message}`);
      }
    } else if (data.user) {
      // User created, but session might not be immediate if email confirmation is required
      // Manually insert profile data as the handle_new_user trigger might not have all metadata
      const { error: profileInsertError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          username: username.trim(),
          email: email.trim(), // Store email in profile for easier access
          role: role,
        });

      if (profileInsertError) {
        console.error("Error inserting profile after signup:", profileInsertError);
        showError(`Erreur lors de la création du profil: ${profileInsertError.message}`);
        return;
      }

      showSuccess("Compte créé avec succès !");
      onClose(); // Close the modal
    }
  };

  const isRegisterButtonDisabled = !firstName.trim() || !lastName.trim() || !username.trim() || !email.trim() || !password.trim() || usernameCheckLoading || usernameAvailable === false || usernameAvailable === null;

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
              <div className="relative">
                <Input id="username" type="text" placeholder="john_doe" required value={username} onChange={handleUsernameChange} />
                {usernameCheckLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
                )}
                {usernameAvailable === true && !usernameCheckLoading && username.trim() !== '' && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
                {usernameAvailable === false && !usernameCheckLoading && username.trim() !== '' && (
                  <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
                )}
              </div>
              {username.trim() !== '' && !usernameCheckLoading && usernameAvailable !== null && (
                <p className={`text-sm ${usernameAvailable ? 'text-green-600' : 'text-red-600'}`}>
                  {usernameAvailable ? "Nom d'utilisateur disponible." : "Ce nom d'utilisateur est déjà pris."}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Je suis un(e)</Label>
              <Select value={role} onValueChange={(value: 'student' | 'creator' | 'tutor') => setRole(value)}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Élève</SelectItem>
                  <SelectItem value="creator">Créateur (Professeur)</SelectItem>
                  <SelectItem value="tutor" disabled>Tuteur (Bientôt disponible)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" onClick={handleRegister} disabled={isRegisterButtonDisabled}>S'inscrire</Button>
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