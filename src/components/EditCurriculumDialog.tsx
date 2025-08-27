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
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { Curriculum } from "@/lib/dataModels"; // Removed Establishment import
import { updateCurriculumInStorage } from "@/lib/courseData"; // Removed loadEstablishments, getEstablishmentAddress
import { useRole } from '@/contexts/RoleContext'; // Import useRole

interface EditCurriculumDialogProps {
  isOpen: boolean;
  onClose: () => void;
  curriculum: Curriculum;
  onSave: (updatedCurriculum: Curriculum) => void;
}

const EditCurriculumDialog = ({ isOpen, onClose, curriculum, onSave }: EditCurriculumDialogProps) => {
  const { currentUserProfile, currentRole } = useRole(); // Get currentUserProfile and currentRole
  const [name, setName] = useState(curriculum.name);
  const [description, setDescription] = useState(curriculum.description || '');
  // Removed establishmentId state
  // Removed establishments state
  const [isLoading, setIsLoading] = useState(false);

  // Removed useEffect for fetching establishments

  useEffect(() => {
    if (isOpen && curriculum) {
      setName(curriculum.name);
      setDescription(curriculum.description || '');
    }
  }, [isOpen, curriculum]);

  const handleSave = async () => {
    if (!currentUserProfile || (currentRole !== 'professeur' && currentRole !== 'director' && currentRole !== 'deputy_director' && currentRole !== 'administrator')) { // Only professeur, director, deputy_director, administrator can save
      showError("Vous n'êtes pas autorisé à modifier un cursus.");
      return;
    }
    if (!name.trim()) {
      showError("Le nom du cursus est requis.");
      return;
    }
    // Removed establishmentId check
    // Removed role-based establishment_id check

    setIsLoading(true);
    try {
      const updatedCurriculumData: Curriculum = {
        ...curriculum,
        name: name.trim(),
        description: description.trim() || undefined,
      }; // Removed establishment_id
      const savedCurriculum = await updateCurriculumInStorage(updatedCurriculumData);

      if (savedCurriculum) {
        onSave(savedCurriculum);
        showSuccess("Cursus mis à jour avec succès !");
        onClose();
      } else {
        showError("Échec de la mise à jour du cursus.");
      }
    } catch (error: any) {
      console.error("Error saving curriculum:", error);
      showError(`Erreur lors de la sauvegarde du cursus: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Removed establishmentsToDisplay

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] backdrop-blur-lg bg-background/80 rounded-android-tile">
        <div className="flex flex-col"> {/* Wrap children in a single div */}
          <DialogHeader>
            <DialogTitle>Modifier le cursus</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations du cursus.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 flex-grow"> {/* Added flex-grow */}
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            {/* Removed Establishment Select */}
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCurriculumDialog;