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
import { Subject, Establishment } from "@/lib/dataModels"; // Import Establishment
import { updateSubjectInStorage } from "@/lib/courseData"; // Removed loadEstablishments
import { useRole } from '@/contexts/RoleContext';

interface EditSubjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
  onSave: (updatedSubject: Subject) => void;
  establishments: Establishment[]; // New prop for establishments
}

const EditSubjectDialog = ({ isOpen, onClose, subject, onSave, establishments }: EditSubjectDialogProps) => {
  const { currentUserProfile, currentRole } = useRole();
  const [name, setName] = useState(subject.name);
  const [establishmentId, setEstablishmentId] = useState<string | null>(subject.establishment_id || null); // Re-added establishmentId state
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && subject) {
      setName(subject.name);
      setEstablishmentId(subject.establishment_id || null);
    }
  }, [isOpen, subject]);

  const handleSave = async () => {
    if (!currentUserProfile || (currentRole !== 'administrator' && currentRole !== 'director' && currentRole !== 'deputy_director')) {
      showError("Vous n'êtes pas autorisé à modifier une matière.");
      return;
    }
    // Role-based establishment_id check
    if (currentRole !== 'administrator' && subject.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez modifier que les matières de votre établissement.");
      return;
    }
    if (!name.trim()) {
      showError("Le nom de la matière est requis.");
      return;
    }
    if (!establishmentId && currentRole !== 'administrator') {
      showError("L'établissement est requis pour la matière.");
      return;
    }

    setIsLoading(true);
    try {
      const updatedSubjectData: Subject = {
        ...subject,
        name: name.trim(),
        establishment_id: establishmentId || '', // Use selected establishment_id
      };
      const savedSubject = await updateSubjectInStorage(updatedSubjectData);

      if (savedSubject) {
        onSave(savedSubject);
        showSuccess("Matière mise à jour avec succès !");
        onClose();
      } else {
        showError("Échec de la mise à jour de la matière.");
      }
    } catch (error: any) {
      // console.error("Error saving subject:", error);
      showError(`Erreur lors de la sauvegarde de la matière: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const establishmentsToDisplay = establishments.filter(est => 
    currentRole === 'administrator' || est.id === currentUserProfile?.establishment_id
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] backdrop-blur-lg bg-background/80 rounded-android-tile">
        <div className="flex flex-col"> {/* Wrap children in a single div */}
          <DialogHeader>
            <DialogTitle>Modifier la matière</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de la matière.
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
            {(currentRole === 'administrator' || (currentUserProfile?.establishment_id && ['director', 'deputy_director'].includes(currentRole || ''))) && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="establishment" className="text-right">
                  Établissement
                </Label>
                <Select value={establishmentId || ""} onValueChange={(value) => setEstablishmentId(value === "none" ? null : value)} disabled={currentRole !== 'administrator' && !!currentUserProfile?.establishment_id}>
                  <SelectTrigger id="establishment" className="col-span-3 rounded-android-tile">
                    <SelectValue placeholder="Sélectionner un établissement" />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-lg bg-background/80">
                    {currentRole === 'administrator' && <SelectItem value="none">Aucun</SelectItem>}
                    {establishmentsToDisplay.map(est => (
                      <SelectItem key={est.id} value={est.id}>
                        {est.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={isLoading || (!establishmentId && currentRole !== 'administrator')}>
              {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditSubjectDialog;