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
import { Class, Curriculum } from "@/lib/dataModels";
import { updateClassInStorage, loadCurricula } from "@/lib/courseData";

interface EditClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classToEdit: Class;
  onSave: (updatedClass: Class) => void;
}

const EditClassDialog = ({ isOpen, onClose, classToEdit, onSave }: EditClassDialogProps) => {
  const [name, setName] = useState(classToEdit.name);
  const [curriculumId, setCurriculumId] = useState(classToEdit.curriculum_id);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCurricula = async () => {
      setCurricula(await loadCurricula());
    };
    fetchCurricula();
  }, []);

  useEffect(() => {
    if (isOpen && classToEdit) {
      setName(classToEdit.name);
      setCurriculumId(classToEdit.curriculum_id);
    }
  }, [isOpen, classToEdit]);

  const handleSave = async () => {
    if (!name.trim()) {
      showError("Le nom de la classe est requis.");
      return;
    }
    if (!curriculumId) {
      showError("Le cursus est requis.");
      return;
    }

    setIsLoading(true);
    try {
      const updatedClassData: Class = {
        ...classToEdit,
        name: name.trim(),
        curriculum_id: curriculumId,
      };
      const savedClass = await updateClassInStorage(updatedClassData);

      if (savedClass) {
        onSave(savedClass);
        showSuccess("Classe mise à jour avec succès !");
        onClose();
      } else {
        showError("Échec de la mise à jour de la classe.");
      }
    } catch (error: any) {
      console.error("Error saving class:", error);
      showError(`Erreur lors de la sauvegarde de la classe: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier la classe</DialogTitle>
          <DialogDescription>
            Mettez à jour les informations de la classe.
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
            <Label htmlFor="curriculum" className="text-right">
              Cursus
            </Label>
            <Select value={curriculumId} onValueChange={setCurriculumId}>
              <SelectTrigger id="curriculum" className="col-span-3">
                <SelectValue placeholder="Sélectionner un cursus" />
              </SelectTrigger>
              <SelectContent>
                {curricula.map(cur => (
                  <SelectItem key={cur.id} value={cur.id}>{cur.name}</SelectItem>
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

export default EditClassDialog;