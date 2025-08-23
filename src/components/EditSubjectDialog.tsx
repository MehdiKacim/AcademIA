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
import { Subject, Establishment } from "@/lib/dataModels";
import { updateSubjectInStorage, loadEstablishments } from "@/lib/courseData";
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
  const [establishmentId, setEstablishmentId] = useState(subject.establishment_id);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchEstablishments = async () => {
      setEstablishments(await loadEstablishments());
    };
    fetchEstablishments();
  }, []);

  useEffect(() => {
    if (isOpen && subject) {
      setName(subject.name);
      setEstablishmentId(subject.establishment_id);
    }
  }, [isOpen, subject]);

  const handleSave = async () => {
    if (!currentUserProfile || (currentRole !== 'administrator' && currentRole !== 'director' && currentRole !== 'deputy_director')) {
      showError("Vous n'êtes pas autorisé à modifier une matière.");
      return;
    }
    // Directors/Deputy Directors can only edit subjects from their own establishment
    if ((currentRole === 'director' || currentRole === 'deputy_director') && establishmentId !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez modifier des matières que de votre établissement.");
      return;
    }
    if (!name.trim()) {
      showError("Le nom de la matière est requis.");
      return;
    }
    if (!establishmentId) {
      showError("L'établissement est requis.");
      return;
    }

    setIsLoading(true);
    try {
      const updatedSubjectData: Subject = {
        ...subject,
        name: name.trim(),
        establishment_id: establishmentId,
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
      console.error("Error saving subject:", error);
      showError(`Erreur lors de la sauvegarde de la matière: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const establishmentsToDisplay = currentRole === 'administrator'
    ? establishments
    : establishments.filter(est => est.id === currentUserProfile?.establishment_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="establishment" className="text-right">
              Établissement
            </Label>
            <Select 
              value={establishmentId} 
              onValueChange={setEstablishmentId}
              disabled={currentRole === 'director' || currentRole === 'deputy_director'}
            >
              <SelectTrigger id="establishment" className="col-span-3">
                <SelectValue placeholder="Sélectionner un établissement" />
              </SelectTrigger>
              <SelectContent>
                {establishmentsToDisplay.map(est => (
                  <SelectItem key={est.id} value={est.id}>
                    {est.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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