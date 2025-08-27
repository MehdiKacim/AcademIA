import React, { useEffect } from 'react';
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
  // Effect for Escape key to close the modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    } else {
      document.removeEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-6 backdrop-blur-lg bg-background/80 rounded-android-tile z-[1000]"> {/* Added z-[1000] */}
        <div className="flex flex-col h-full"> {/* Wrap children in a single div */}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataModelModal;