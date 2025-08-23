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
import { Profile } from "@/lib/dataModels"; // Import Profile interface
import { updateProfile } from "@/lib/studentData"; // Import updateProfile
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client

interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: Profile; // Now expects a Profile object
  onSave: (updatedProfile: Profile) => void;
}

const EditProfileDialog = ({ isOpen, onClose, currentUserProfile, onSave }: EditProfileDialogProps) => {
  const [firstName, setFirstName] = useState(currentUserProfile.first_name || '');
  const [lastName, setLastName] = useState(currentUserProfile.last_name || '');
  const [username, setUsername] = useState(currentUserProfile.username);
  const [email, setEmail] = useState(''); // Email is from auth.users, not directly in profile

  useEffect(() => {
    if (isOpen && currentUserProfile) {
      setFirstName(currentUserProfile.first_name || '');
      setLastName(currentUserProfile.last_name || '');
      setUsername(currentUserProfile.username);
      // Fetch email from auth.users
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setEmail(user.email || '');
        }
      });
    }
  }, [isOpen, currentUserProfile]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !username.trim() || !email.trim()) {
      showError("Tous les champs sont requis.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      showError("Veuillez entrer une adresse email valide.");
      return;
    }

    try {
      // Update profile table
      const updatedProfileData: Partial<Profile> = {
        id: currentUserProfile.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim(),
        email: email.trim(), // Update email in profile table as well
      };
      const savedProfile = await updateProfile(updatedProfileData);

      // Update auth.users email if changed
      if (email.trim() !== (await supabase.auth.getUser()).data.user?.email) {
        const { error: emailUpdateError } = await supabase.auth.updateUser({ email: email.trim() });
        if (emailUpdateError) {
          console.error("Error updating user email:", emailUpdateError);
          showError(`Erreur lors de la mise à jour de l'email: ${emailUpdateError.message}`);
          return;
        }
      }

      if (savedProfile) {
        onSave(savedProfile); // Pass the updated profile back to the parent
        showSuccess("Profil mis à jour avec succès !");
        onClose();
      } else {
        showError("Échec de la mise à jour du profil.");
      }
    } catch (error: any) {
      console.error("Error saving profile:", error);
      showError(`Erreur lors de la sauvegarde du profil: ${error.message}`);
    }
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
            <Label htmlFor="username" className="text-right">
              Nom d'utilisateur
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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