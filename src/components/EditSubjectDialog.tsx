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
import { Subject, Establishment } from "@/lib/dataModels";
import { updateSubjectInStorage, getEstablishmentName } from "@/lib/courseData";
import { useRole } from '@/contexts/RoleContext';
import SimpleItemSelector from '@/components/ui/SimpleItemSelector';
import { Building2, Info } from 'lucide-react';

interface EditSubjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
  onSave: (updatedSubject: Subject) => void;
  establishments: Establishment[];
}

const iconMap: { [key: string]: React.ElementType } = {
  Building2, Info
};

const EditSubjectDialog = ({ isOpen, onClose, subject, onSave, establishments }: EditSubjectDialogProps) => {
  const { currentUserProfile, currentRole } = useRole();
  const [name, setName] = useState(subject.name);
  const [establishmentId, setEstablishmentId] = useState<string | null>(subject.establishment_id || null);
  const [isLoading, setIsLoading] = useState(false);

  const [establishmentSearchQuery, setEstablishmentSearchQuery] = useState('');

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
        establishment_id: establishmentId || '',
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
            <DialogTitle>Modifier la matière</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de la matière.
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
            {(currentRole === 'administrator' || (currentUserProfile?.establishment_id && ['director', 'deputy_director'].includes(currentRole || ''))) && (
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