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
import { Curriculum, Establishment } from "@/lib/dataModels";
import { updateCurriculumInStorage, loadEstablishments } from "@/lib/courseData";

interface EditCurriculumDialogProps {
  isOpen: boolean;
  onClose: () => void;
  curriculum: Curriculum;
  onSave: (updatedCurriculum: Curriculum) => void;
}

const EditCurriculumDialog = ({ isOpen, onClose, curriculum, onSave }: EditCurriculumDialogProps) => {
  const [name, setName] = useState(curriculum.name);
  const [description, setDescription] = useState(curriculum.description || '');
  const [establishmentId, setEstablishmentId] = useState(curriculum.establishment_id);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchEstablishments = async () => {
      setEstablishments(await loadEstablishments());
    };
    fetchEstablishments();
  }, []);

  useEffect(() => {
    if (isOpen && curriculum) {
      setName(curriculum.name);
      setDescription(curriculum.description || '');
      setEstablishmentId(curriculum.establishment_id);
    }
  }, [isOpen, curriculum]);

  const handleSave = async () => {
    if (!name.trim()) {
      showError("Le nom du cursus est requis.");
      return;
    }
    if (!establishmentId) {
      showError("L'établissement est requis.");
      return;
    }

    setIsLoading(true);
    try {
      const updatedCurriculumData: Curriculum = {
        ...curriculum,
        name: name.trim(),
        description: description.trim() || undefined,
        establishment_id: establishmentId,
      };
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier le cursus</DialogTitle>
          <DialogDescription>
            Mettez à jour les informations du cursus.
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="establishment" className="text-right">
              Établissement
            </Label>
            <Select value={establishmentId} onValueChange={setEstablishmentId}>
              <SelectTrigger id="establishment" className="col-span-3">
                <SelectValue placeholder="Sélectionner un établissement" />
              </SelectTrigger>
              <SelectContent>
                {establishments.map(est => (
                  <SelectItem key={est.id} value={est.id}>{est.name}</SelectItem>
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

export default EditCurriculumDialog;