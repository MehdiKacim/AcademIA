import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, MotionCard } from "@/components/ui/card"; // Import MotionCard
import { ScrollArea } from "@/components/ui/scroll-area";
import { Class, Curriculum, Establishment } from "@/lib/dataModels";
import { Users, LayoutList, Building2 } from "lucide-react";
import { getCurriculumName, getEstablishmentName } from '@/lib/courseData'; // Import getCurriculumName, getEstablishmentName

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
  // Removed local getCurriculumName and getEstablishmentName declarations. Now imported.

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-6 backdrop-blur-lg bg-background/80 rounded-android-tile">
        <div className="flex flex-col h-full"> {/* Wrap children in a single div */}
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
                  <MotionCard key={cls.id} className="p-3 rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)" }} whileTap={{ scale: 0.99 }}> {/* Apply rounded-android-tile */}
                    <CardContent className="p-0 flex items-center gap-3">
                      <Users className="h-8 w-8 text-primary" />
                      <div className="flex-grow">
                        <p className="font-medium">{cls.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <LayoutList className="h-3 w-3" /> {getCurriculumName(cls.curriculum_id, curricula)}
                        </p>
                        {cls.establishment_id && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {getEstablishmentName(cls.establishment_id, establishments)}
                          </p>
                        )}
                        {cls.school_year_name && (
                          <p className="text-xs text-muted-foreground">Année scolaire: {cls.school_year_name}</p>
                        )}
                      </div>
                    </CardContent>
                  </MotionCard>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClassListModal;