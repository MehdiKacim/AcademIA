import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import PedagogicalStructureChart from './PedagogicalStructureChart';
import { Establishment, Curriculum, Class } from "@/lib/dataModels";

interface PedagogicalStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  establishments: Establishment[];
  curricula: Curriculum[];
  classes: Class[];
}

const PedagogicalStructureModal = ({ isOpen, onClose, establishments, curricula, classes }: PedagogicalStructureModalProps) => {
  const getCurriculumCountForEstablishment = (establishmentId: string) => {
    return curricula.filter(c => c.establishment_id === establishmentId).length;
  };

  const getClassCountForEstablishment = (establishmentId: string) => {
    return classes.filter(c => c.establishment_id === establishmentId).length;
  };

  const data = establishments.map(est => ({
    name: est.name,
    curricula: getCurriculumCountForEstablishment(est.id),
    classes: getClassCountForEstablishment(est.id),
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-6 backdrop-blur-lg bg-background/80">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
            Structure Pédagogique par Établissement
          </DialogTitle>
          <DialogDescription>
            Visualisez le nombre de cursus et de classes par établissement.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2">
          <PedagogicalStructureChart data={data} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PedagogicalStructureModal;