import React, { useState } from 'react';
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
import { supabase } from "@/integrations/supabase/client";

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordDialog = ({ isOpen, onClose }: ChangePasswordDialogProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (!newPassword.trim() || !confirmNewPassword.trim()) {
      showError("Veuillez remplir tous les champs.");
      return;
    }
    if (newPassword.trim().length < 6) {
      showError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword.trim() !== confirmNewPassword.trim()) {
      showError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword.trim(),
      });

      if (error) {
        console.error("Error changing password:", error);
        showError(`Erreur lors du changement de mot de passe: ${error.message}`);
      } else {
        showSuccess("Mot de passe mis à jour avec succès !");
        onClose();
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (error: any) {
      console.error("Unexpected error changing password:", error);
      showError(`Une erreur inattendue est survenue: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] backdrop-blur-lg bg-background/80 rounded-android-tile">
        <div className="flex flex-col"> {/* Wrap children in a single div */}
          <DialogHeader>
            <DialogTitle>Changer le mot de passe</DialogTitle>
            <DialogDescription>
              Entrez votre nouveau mot de passe.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newPassword" className="text-right">
                Nouveau mot de passe
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confirmNewPassword" className="text-right">
                Confirmer le mot de passe
              </Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handlePasswordChange} disabled={isLoading}>
              {isLoading ? "Mise à jour..." : "Changer le mot de passe"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;