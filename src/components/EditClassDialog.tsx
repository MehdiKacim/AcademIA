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
import { Class, Curriculum, Establishment } from "@/lib/dataModels"; // Import Establishment
import { updateClassInStorage, loadCurricula, loadEstablishments } from "@/lib/courseData"; // Import loadEstablishments

interface EditClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classToEdit: Class;
  onSave: (updatedClass: Class) => void;
}

const EditClassDialog = ({ isOpen, onClose, classToEdit, onSave }: EditClassDialogProps) => {
  const [name, setName] = useState(classToEdit.name);
  const [curriculumId, setCurriculumId] = useState(classToEdit.curriculum_id);
  const [establishmentId, setEstablishmentId] = useState(classToEdit.establishment_id || ''); // New state
  const [schoolYear, setSchoolYear] = useState(classToEdit.school_year || ''); // New state
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]); // New state
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setCurricula(await loadCurricula());
      setEstablishments(await loadEstablishments());
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (isOpen && classToEdit) {
      setName(classToEdit.name);
      setCurriculumId(classToEdit.curriculum_id);
      setEstablishmentId(classToEdit.establishment_id || '');
      setSchoolYear(classToEdit.school_year || '');
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
    if (!establishmentId) {
      showError("L'établissement est requis.");
      return;
      }
    if (!schoolYear.trim()) {
      showError("L'année scolaire est requise.");
      return;
    }

    setIsLoading(true);
    try {
      const updatedClassData: Class = {
        ...classToEdit,
        name: name.trim(),
        curriculum_id: curriculumId,
        establishment_id: establishmentId, // Include new field
        school_year: schoolYear.trim(), // Include new field
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

  const currentYear = new Date().getFullYear();
  const schoolYears = Array.from({ length: 5 }, (_, i) => `${currentYear - 2 + i}-${currentYear - 1 + i}`);

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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="curriculum" className="text-right">
              Cursus
            </Label>
            <Select value={curriculumId} onValueChange={setCurriculumId}>
              <SelectTrigger id="curriculum" className="col-span-3">
                <SelectValue placeholder="Sélectionner un cursus" />
              </SelectTrigger>
              <SelectContent>
                {curricula.filter(cur => !establishmentId || cur.establishment_id === establishmentId).map(cur => (
                  <SelectItem key={cur.id} value={cur.id}>{cur.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="schoolYear" className="text-right">
              Année scolaire
            </Label>
            <Select value={schoolYear} onValueChange={setSchoolYear}>
              <SelectTrigger id="schoolYear" className="col-span-3">
                <SelectValue placeholder="Sélectionner l'année scolaire" />
              </SelectTrigger>
              <SelectContent>
                {schoolYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
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