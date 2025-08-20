import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/utils/toast";
import { Student } from "@/lib/dataModels"; // Import Student type

interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Student;
  onSave: (updatedUser: Student) => void;
}

const EditProfileDialog = ({ isOpen, onClose, currentUser, onSave }: EditProfileDialogProps) => {
  const [firstName, setFirstName] = useState(currentUser.firstName);
  const [lastName, setLastName] = useState(currentUser.lastName);
  const [email, setEmail] = useState(currentUser.email);

  useEffect(() => {
    if (isOpen) {
      setFirstName(currentUser.firstName);
      setLastName(currentUser.lastName);
      setEmail(currentUser.email);
    }
  }, [isOpen, currentUser]);

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      showError("Tous les champs sont requis.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      showError("Veuillez entrer une adresse email valide.");
      return;
    }

    const updatedUser: Student = {
      ...currentUser,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
    };
    onSave(updatedUser);
    showSuccess("Profil mis à jour avec succès !");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier le profil</DialogTitle>
          <DialogDescription>
            Mettez à jour les informations de votre profil. Cliquez sur enregistrer lorsque vous avez terminé.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firstName" className="text-right">
              Prénom
            </Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lastName" className="text-right">
              Nom
            </Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Enregistrer les modifications</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;