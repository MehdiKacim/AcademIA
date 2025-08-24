import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import EstablishmentDetailList from './EstablishmentDetailList';
import { Profile, Class, Curriculum, Establishment } from "@/lib/dataModels";

interface EstablishmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  establishments: Establishment[];
  curricula: Curriculum[];
  classes: Class[];
  allProfiles: Profile[];
}

const EstablishmentDetailModal = ({ isOpen, onClose, establishments, curricula, classes, allProfiles }: EstablishmentDetailModalProps) => {
  const getRoleCountForEstablishment = (establishmentId: string, role: Profile['role']) => {
    return allProfiles.filter(p => p.establishment_id === establishmentId && p.role === role).length;
  };

  const getCurriculumCountForEstablishment = (establishmentId: string) => {
    return curricula.filter(c => c.establishment_id === establishmentId).length;
  };

  const getClassCountForEstablishment = (establishmentId: string) => {
    return classes.filter(c => c.establishment_id === establishmentId).length;
  };

  const data = establishments.map(est => ({
    name: est.name,
    students: getRoleCountForEstablishment(est.id, 'student'),
    professeurs: getRoleCountForEstablishment(est.id, 'professeur'),
    tutors: getRoleCountForEstablishment(est.id, 'tutor'),
    directors: getRoleCountForEstablishment(est.id, 'director'),
    deputyDirectors: getRoleCountForEstablishment(est.id, 'deputy_director'),
    curricula: getCurriculumCountForEstablishment(est.id),
    classes: getClassCountForEstablishment(est.id),
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-6 backdrop-blur-lg bg-background/80">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
            Détail des Établissements
          </DialogTitle>
          <DialogDescription>
            Liste complète des établissements avec leurs statistiques détaillées.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2">
          <EstablishmentDetailList data={data} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EstablishmentDetailModal;