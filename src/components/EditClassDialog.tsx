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
import { Class, Curriculum, SchoolYear, Establishment } from "@/lib/dataModels"; // Import Establishment
import { updateClassInStorage, loadCurricula, loadSchoolYears } from "@/lib/courseData"; // Removed loadEstablishments, getEstablishmentAddress, import loadSchoolYears
import { useRole } from '@/contexts/RoleContext'; // Import useRole

interface EditClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classToEdit: Class;
  onSave: (updatedClass: Class) => void;
  establishments: Establishment[]; // New prop for establishments
  curricula: Curriculum[]; // New prop for curricula
  schoolYears: SchoolYear[]; // New prop for schoolYears
}

const EditClassDialog = ({ isOpen, onClose, classToEdit, onSave, establishments, curricula, schoolYears }: EditClassDialogProps) => {
  const { currentUserProfile, currentRole } = useRole();
  const [name, setName] = useState(classToEdit.name);
  const [curriculumId, setCurriculumId] = useState(classToEdit.curriculum_id);
  const [establishmentId, setEstablishmentId] = useState<string | null>(classToEdit.establishment_id || null); // Re-added establishmentId state
  const [schoolYearId, setSchoolYearId] = useState(classToEdit.school_year_id); // Changed to schoolYearId
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && classToEdit) {
      setName(classToEdit.name);
      setCurriculumId(classToEdit.curriculum_id);
      setEstablishmentId(classToEdit.establishment_id || null);
      setSchoolYearId(classToEdit.school_year_id); // Set schoolYearId
    }
  }, [isOpen, classToEdit]);

  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';
  const getCurriculumName = (id?: string) => curricula.find(c => c.id === id)?.name || 'N/A';
  const getSchoolYearName = (id?: string) => schoolYears.find(sy => sy.id === id)?.name || 'N/A';

  const handleSave = async () => {
    if (!currentUserProfile || !['professeur', 'director', 'deputy_director', 'administrator'].includes(currentRole || '')) {
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
    if (!establishmentId && currentRole !== 'administrator') {
      showError("L'établissement est requis pour la classe.");
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
    // Director/Deputy Director establishment_id check
    if ((currentRole === 'director' || currentRole === 'deputy_director') && classToEdit.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez modifier que les classes de votre établissement.");
      return;
    }
    // Check if the selected curriculum belongs to the selected establishment
    const selectedCurriculum = curricula.find(c => c.id === curriculumId);
    if (establishmentId && selectedCurriculum && selectedCurriculum.establishment_id !== establishmentId) {
      showError("Le cursus sélectionné n'appartient pas à l'établissement choisi.");
      return;
    }

    setIsLoading(true);
    try {
      const updatedClassData: Class = {
        ...classToEdit,
        name: name.trim(),
        curriculum_id: curriculumId,
        establishment_id: establishmentId || '', // Use selected establishment_id
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
      // console.error("Error saving class:", error);
      showError(`Erreur lors de la sauvegarde de la classe: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const establishmentsToDisplay = establishments.filter(est => 
    currentRole === 'administrator' || est.id === currentUserProfile?.establishment_id
  );
  const curriculaToDisplay = curricula.filter(cur => 
    currentRole === 'administrator' || cur.establishment_id === currentUserProfile?.establishment_id
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] backdrop-blur-lg bg-background/80 rounded-android-tile">
        <div className="flex flex-col"> {/* Wrap children in a single div */}
          <DialogHeader>
            <DialogTitle>Modifier la classe</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de la classe.
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
            {(currentRole === 'administrator' || (currentUserProfile?.establishment_id && ['director', 'deputy_director', 'professeur'].includes(currentRole || ''))) && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="establishment" className="text-right">
                  Établissement
                </Label>
                <Select value={establishmentId || ""} onValueChange={(value) => setEstablishmentId(value === "none" ? null : value)} disabled={currentRole !== 'administrator' && !!currentUserProfile?.establishment_id}>
                  <SelectTrigger id="establishment" className="col-span-3 rounded-android-tile">
                    <SelectValue placeholder="Sélectionner un établissement" />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-lg bg-background/80 z-[9999] rounded-android-tile">
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="curriculum" className="text-right">
                Cursus
              </Label>
              <Select value={curriculumId} onValueChange={setCurriculumId}>
                <SelectTrigger id="curriculum" className="col-span-3 rounded-android-tile"> {/* Apply rounded-android-tile */}
                  <SelectValue placeholder="Sélectionner un cursus" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-lg bg-background/80 z-[9999] rounded-android-tile"> {/* Apply rounded-android-tile */}
                  {curriculaToDisplay
                    .filter(cur => !establishmentId || cur.establishment_id === establishmentId)
                    .map(cur => (
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
                <SelectTrigger id="schoolYear" className="col-span-3 rounded-android-tile"> {/* Apply rounded-android-tile */}
                  <SelectValue placeholder="Sélectionner l'année scolaire" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-lg bg-background/80 z-[9999] rounded-android-tile"> {/* Apply rounded-android-tile */}
                  {schoolYears.map(year => (
                    <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

export default EditClassDialog;