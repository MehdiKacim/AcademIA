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
import { showSuccess, showError } from "@/utils/toast";
import { Class, Curriculum, SchoolYear, Establishment } from "@/lib/dataModels";
import { updateClassInStorage, loadCurricula, loadSchoolYears, getEstablishmentName, getCurriculumName, getSchoolYearName } from "@/lib/courseData";
import { useRole } from '@/contexts/RoleContext';
import SimpleItemSelector from '@/components/ui/SimpleItemSelector';
import { Building2, LayoutList, CalendarDays, Info } from 'lucide-react';

interface EditClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classToEdit: Class;
  onSave: (updatedClass: Class) => void;
  establishments: Establishment[];
  curricula: Curriculum[];
  schoolYears: SchoolYear[];
}

const iconMap: { [key: string]: React.ElementType } = {
  Building2, LayoutList, CalendarDays, Info
};

const EditClassDialog = ({ isOpen, onClose, classToEdit, onSave, establishments, curricula, schoolYears }: EditClassDialogProps) => {
  const { currentUserProfile, currentRole } = useRole();
  const [name, setName] = useState(classToEdit.name);
  const [curriculumId, setCurriculumId] = useState(classToEdit.curriculum_id);
  const [establishmentId, setEstablishmentId] = useState<string | null>(classToEdit.establishment_id || null);
  const [schoolYearId, setSchoolYearId] = useState(classToEdit.school_year_id);
  const [isLoading, setIsLoading] = useState(false);

  const [establishmentSearchQuery, setEstablishmentSearchQuery] = useState('');
  const [curriculumSearchQuery, setCurriculumSearchQuery] = useState('');
  const [schoolYearSearchQuery, setSchoolYearSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && classToEdit) {
      setName(classToEdit.name);
      setCurriculumId(classToEdit.curriculum_id);
      setEstablishmentId(classToEdit.establishment_id || null);
      setSchoolYearId(classToEdit.school_year_id);
    }
  }, [isOpen, classToEdit]);

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
    if (!schoolYearId) {
      showError("L'année scolaire est requise.");
      return;
    }

    if (currentRole === 'professeur' && !classToEdit.creator_ids.includes(currentUserProfile.id)) {
      showError("Vous ne pouvez modifier que les classes que vous gérez.");
      return;
    }
    if ((currentRole === 'director' || currentRole === 'deputy_director') && classToEdit.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez modifier que les classes de votre établissement.");
      return;
    }
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
        establishment_id: establishmentId || '',
        school_year_id: schoolYearId,
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

  const establishmentsOptions = establishments.filter(est => 
    currentRole === 'administrator' || est.id === currentUserProfile?.establishment_id
  ).map(est => ({
    id: est.id,
    label: est.name,
    icon_name: 'Building2',
    description: est.address,
  }));

  const curriculaOptions = curricula.filter(cur => 
    !establishmentId || cur.establishment_id === establishmentId
  ).map(cur => ({
    id: cur.id,
    label: cur.name,
    icon_name: 'LayoutList',
    description: cur.description,
  }));

  const schoolYearsOptions = schoolYears.map(year => ({
    id: year.id,
    label: year.name,
    icon_name: 'CalendarDays',
    description: `${format(parseISO(year.start_date), 'dd/MM/yyyy', { locale: fr })} - ${format(parseISO(year.end_date), 'dd/MM/yyyy', { locale: fr })}`,
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] backdrop-blur-lg bg-background/80 rounded-android-tile z-[1000]">
        <div className="flex flex-col">
          <DialogHeader>
            <DialogTitle>Modifier la classe</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de la classe.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 flex-grow">
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
                <SimpleItemSelector
                  id="establishment"
                  options={establishmentsOptions}
                  value={establishmentId}
                  onValueChange={(value) => setEstablishmentId(value)}
                  searchQuery={establishmentSearchQuery}
                  onSearchQueryChange={setEstablishmentSearchQuery}
                  placeholder="Sélectionner un établissement"
                  emptyMessage="Aucun établissement trouvé."
                  iconMap={iconMap}
                  popoverContentClassName="z-[9999]"
                  disabled={currentRole !== 'administrator' && !!currentUserProfile?.establishment_id}
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="curriculum" className="text-right">
                Cursus
              </Label>
              <SimpleItemSelector
                id="curriculum"
                options={curriculaOptions}
                value={curriculumId}
                onValueChange={(value) => setCurriculumId(value)}
                searchQuery={curriculumSearchQuery}
                onSearchQueryChange={setCurriculumSearchQuery}
                placeholder="Sélectionner un cursus"
                emptyMessage="Aucun cursus trouvé."
                iconMap={iconMap}
                popoverContentClassName="z-[9999]"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="schoolYear" className="text-right">
                Année scolaire
              </Label>
              <SimpleItemSelector
                id="schoolYear"
                options={schoolYearsOptions}
                value={schoolYearId}
                onValueChange={(value) => setSchoolYearId(value)}
                searchQuery={schoolYearSearchQuery}
                onSearchQueryChange={setSchoolYearSearchQuery}
                placeholder="Sélectionner l'année scolaire"
                emptyMessage="Aucune année scolaire trouvée."
                iconMap={iconMap}
                popoverContentClassName="z-[9999]"
              />
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