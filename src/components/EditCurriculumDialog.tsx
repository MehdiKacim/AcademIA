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
import { Button, MotionButton } from "@/components/ui/button"; // Import MotionButton
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { Curriculum, Establishment } from "@/lib/dataModels";
import { updateCurriculumInStorage, getEstablishmentName } from "@/lib/courseData";
import { useRole } from '@/contexts/RoleContext';
import SimpleItemSelector from '@/components/ui/SimpleItemSelector';
import { Building2, Info } from 'lucide-react';

interface EditCurriculumDialogProps {
  isOpen: boolean;
  onClose: () => void;
  curriculum: Curriculum;
  onSave: (updatedCurriculum: Curriculum) => void;
  establishments: Establishment[];
}

const iconMap: { [key: string]: React.ElementType } = {
  Building2, Info
};

const EditCurriculumDialog = ({ isOpen, onClose, curriculum, onSave, establishments }: EditCurriculumDialogProps) => {
  const { currentUserProfile, currentRole } = useRole();
  const [name, setName] = useState(curriculum.name);
  const [description, setDescription] = useState(curriculum.description || '');
  const [establishmentId, setEstablishmentId] = useState<string | null>(curriculum.establishment_id || null);
  const [isLoading, setIsLoading] = useState(false);

  const [establishmentSearchQuery, setEstablishmentSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && curriculum) {
      setName(curriculum.name);
      setDescription(curriculum.description || '');
      setEstablishmentId(curriculum.establishment_id || null);
    }
  }, [isOpen, curriculum]);

  const handleSave = async () => {
    if (!currentUserProfile || (currentRole !== 'professeur' && currentRole !== 'director' && currentRole !== 'deputy_director' && currentRole !== 'administrator')) {
      showError("Vous n'êtes pas autorisé à modifier un cursus.");
      return;
    }
    if (!name.trim()) {
      showError("Le nom du cursus est requis.");
      return;
    }
    if (!establishmentId && currentRole !== 'administrator') {
      showError("L'établissement est requis pour le cursus.");
      return;
    }
    if (currentRole !== 'administrator' && curriculum.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez modifier que les cursus de votre établissement.");
      return;
    }

    setIsLoading(true);
    try {
      const updatedCurriculumData: Curriculum = {
        ...curriculum,
        name: name.trim(),
        description: description.trim() || undefined,
        establishment_id: establishmentId || '',
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

  const establishmentsOptions = establishments.filter(est => 
    currentRole === 'administrator' || est.id === currentUserProfile?.establishment_id
  ).map(est => ({
    id: est.id,
    label: est.name,
    icon_name: 'Building2',
    description: est.address,
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] backdrop-blur-lg bg-background/80 rounded-android-tile z-[1000]">
        <div className="flex flex-col">
          <DialogHeader>
            <DialogTitle>Modifier le cursus</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations du cursus.
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
                  disabled={currentRole !== 'administrator' && !!currentUserProfile?.establishment_id}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <MotionButton onClick={handleSave} disabled={isLoading || (!establishmentId && currentRole !== 'administrator')} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
            </MotionButton>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCurriculumDialog;