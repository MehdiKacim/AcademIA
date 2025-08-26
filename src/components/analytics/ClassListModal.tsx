import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Class, Curriculum, Establishment } from "@/lib/dataModels";
import { Users, LayoutList, Building2 } from "lucide-react";

interface ClassListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  classes: Class[];
  curricula: { id: string; name: string }[];
  establishments: { id: string; name: string }[];
}

const ClassListModal = ({ isOpen, onClose, title, description, classes, curricula, establishments }: ClassListModalProps) => {
  const getCurriculumName = (id: string) => curricula.find(c => c.id === id)?.name || 'N/A';
  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-6 backdrop-blur-lg bg-background/80 rounded-android-tile"> {/* Apply rounded-android-tile */}
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-2">
          <div className="grid gap-4">
            {classes.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucune classe trouvée.</p>
            ) : (
              classes.map(cls => (
                <Card key={cls.id} className="p-3 rounded-android-tile"> {/* Apply rounded-android-tile */}
                  <CardContent className="p-0 flex items-center gap-3">
                    <Users className="h-8 w-8 text-primary" />
                    <div className="flex-grow">
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <LayoutList className="h-3 w-3" /> {getCurriculumName(cls.curriculum_id)}
                      </p>
                      {/* Removed establishment_id display */}
                      {cls.school_year_name && (
                        <p className="text-xs text-muted-foreground">Année scolaire: {cls.school_year_name}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ClassListModal;