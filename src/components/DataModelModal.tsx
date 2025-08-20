import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import DataModelContent from './DataModelContent';

interface DataModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DataModelModal = ({ isOpen, onClose }: DataModelModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
            Modèle de Données de l'Application
          </DialogTitle>
          <DialogDescription>
            Voici la structure des données utilisées dans l'application, telles que définies dans les interfaces TypeScript.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2">
          <DataModelContent />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataModelModal;