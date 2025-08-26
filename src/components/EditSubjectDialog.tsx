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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { Subject } from "@/lib/dataModels"; // Removed Establishment import
import { updateSubjectInStorage } from "@/lib/courseData"; // Removed loadEstablishments
import { useRole } from '@/contexts/RoleContext';

interface EditSubjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
  onSave: (updatedSubject: Subject) => void;
}

const EditSubjectDialog = ({ isOpen, onClose, subject, onSave }: EditSubjectDialogProps) => {
  const { currentUserProfile, currentRole } = useRole();
  const [name, setName] = useState(subject.name);
  // Removed establishmentId state
  // Removed establishments state
  const [isLoading, setIsLoading] = useState(false);

  // Removed useEffect for fetching establishments

  useEffect(() => {
    if (isOpen && subject) {
      setName(subject.name);
      // Removed setEstablishmentId
    }
  }, [isOpen, subject]);

  const handleSave = async () => {
    if (!currentUserProfile || (currentRole !== 'administrator' && currentRole !== 'director' && currentRole !== 'deputy_director')) {
      showError("Vous n'êtes pas autorisé à modifier une matière.");
      return;
    }
    // Removed role-based establishment_id check
    if (!name.trim()) {
      showError("Le nom de la matière est requis.");
      return;
    }
    // Removed establishmentId check

    setIsLoading(true);
    try {
      const updatedSubjectData: Subject = {
        ...subject,
        name: name.trim(),
      }; // Removed establishment_id
      const savedSubject = await updateSubjectInStorage(updatedSubjectData);

      if (savedSubject) {
        onSave(savedSubject);
        showSuccess("Matière mise à jour avec succès !");
        onClose();
      } else {
        showError("Échec de la mise à jour de la matière.");
      }
    } catch (error: any) {
      console.error("Error saving subject:", error);
      showError(`Erreur lors de la sauvegarde de la matière: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Removed establishmentsToDisplay

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] backdrop-blur-lg bg-background/80 rounded-android-tile"> {/* Apply rounded-android-tile */}
        <DialogHeader>
          <DialogTitle>Modifier la matière</DialogTitle>
          <DialogDescription>
            Mettez à jour les informations de la matière.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nom
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          {/* Removed Establishment Select */}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSubjectDialog;