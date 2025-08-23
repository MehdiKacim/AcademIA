import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import UserDistributionChart from './UserDistributionChart';
import { Profile, Establishment } from "@/lib/dataModels";

interface UserDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  establishments: Establishment[];
  allProfiles: Profile[];
}

const UserDistributionModal = ({ isOpen, onClose, establishments, allProfiles }: UserDistributionModalProps) => {
  const getRoleCountForEstablishment = (establishmentId: string, role: Profile['role']) => {
    return allProfiles.filter(p => p.establishment_id === establishmentId && p.role === role).length;
  };

  const data = establishments.map(est => ({
    name: est.name,
    students: getRoleCountForEstablishment(est.id, 'student'),
    professeurs: getRoleCountForEstablishment(est.id, 'professeur'),
    tutors: getRoleCountForEstablishment(est.id, 'tutor'),
    directors: getRoleCountForEstablishment(est.id, 'director'),
    deputyDirectors: getRoleCountForEstablishment(est.id, 'deputy_director'),
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
            Distribution des Utilisateurs par Établissement
          </DialogTitle>
          <DialogDescription>
            Visualisez le nombre d'élèves et de personnel par établissement.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2">
          <UserDistributionChart data={data} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDistributionModal;