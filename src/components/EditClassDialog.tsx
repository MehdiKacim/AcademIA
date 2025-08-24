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
import { Class, Curriculum, Establishment, SchoolYear } from "@/lib/dataModels"; // Import SchoolYear
import { updateClassInStorage, loadCurricula, loadEstablishments, getEstablishmentAddress, loadSchoolYears } from "@/lib/courseData"; // Import loadSchoolYears
import { useRole } from '@/contexts/RoleContext'; // Import useRole

interface EditClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classToEdit: Class;
  onSave: (updatedClass: Class) => void;
}

const EditClassDialog = ({ isOpen, onClose, classToEdit, onSave }: EditClassDialogProps) => {
  const { currentUserProfile, currentRole } = useRole();
  const [name, setName] = useState(classToEdit.name);
  const [curriculumId, setCurriculumId] = useState(classToEdit.curriculum_id);
  const [establishmentId, setEstablishmentId] = useState(classToEdit.establishment_id || '');
  const [schoolYearId, setSchoolYearId] = useState(classToEdit.school_year_id); // Changed to schoolYearId
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]); // New state for school years
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setCurricula(await loadCurricula());
      setEstablishments(await loadEstablishments());
      setSchoolYears(await loadSchoolYears()); // Load school years
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (isOpen && classToEdit) {
      setName(classToEdit.name);
      setCurriculumId(classToEdit.curriculum_id);
      setEstablishmentId(classToEdit.establishment_id || '');
      setSchoolYearId(classToEdit.school_year_id); // Set schoolYearId
    }
  }, [isOpen, classToEdit]);

  const handleSave = async () => {
    if (!currentUserProfile || (currentRole !== 'professeur' && currentRole !== 'director' && currentRole !== 'deputy_director' && currentRole !== 'administrator')) {
      showError("Vous n'êtes pas autorisé à modifier une classe.");
      return;
    }
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
    if (!schoolYearId) { // Check for schoolYearId
      showError("L'année scolaire est requise.");
      return;
    }

    // Permission check: Professeur can only edit classes they manage.
    if (currentRole === 'professeur' && !classToEdit.creator_ids.includes(currentUserProfile.id)) {
      showError("Vous ne pouvez modifier que les classes que vous gérez.");
      return;
    }
    // Permission check: Director/Deputy Director can only edit classes from their own establishment.
    if ((currentRole === 'director' || currentRole === 'deputy_director') && establishmentId !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez modifier des classes que de votre établissement.");
      return;
    }

    setIsLoading(true);
    try {
      const updatedClassData: Class = {
        ...classToEdit,
        name: name.trim(),
        curriculum_id: curriculumId,
        establishment_id: establishmentId,
        school_year_id: schoolYearId, // Include new field
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

  const establishmentsToDisplay = currentRole === 'administrator'
    ? establishments
    : establishments.filter(est => est.id === currentUserProfile?.establishment_id);

  const curriculaToDisplay = currentRole === 'administrator'
    ? curricula
    : curricula.filter(cur => cur.establishment_id === currentUserProfile?.establishment_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] backdrop-blur-lg bg-background/80">
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
            <Select 
              value={establishmentId} 
              onValueChange={setEstablishmentId}
              disabled={currentRole === 'director' || currentRole === 'deputy_director'} // Disable for directors/deputy directors
            >
              <SelectTrigger id="establishment" className="col-span-3">
                <SelectValue placeholder="Sélectionner un établissement" />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-lg bg-background/80">
                {establishmentsToDisplay.map(est => (
                  <SelectItem key={est.id} value={est.id}>
                    {est.name} {est.address && <span className="italic text-muted-foreground">({est.address})</span>}
                  </SelectItem>
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
              <SelectContent className="backdrop-blur-lg bg-background/80">
                {curriculaToDisplay.filter(cur => !establishmentId || cur.establishment_id === establishmentId).map(cur => (
                  <SelectItem key={cur.id} value={cur.id}>{cur.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="schoolYear" className="text-right">
              Année scolaire
            </Label>
            <Select value={schoolYearId} onValueChange={setSchoolYearId}>
              <SelectTrigger id="schoolYear" className="col-span-3">
                <SelectValue placeholder="Sélectionner l'année scolaire" />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-lg bg-background/80">
                {schoolYears.map(year => (
                  <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
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