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
import { Curriculum, Establishment } from "@/lib/dataModels";
import { LayoutList, BookOpen, Building2 } from "lucide-react";

interface CurriculumListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  curricula: Curriculum[];
  establishments: { id: string; name: string }[];
}

const CurriculumListModal = ({ isOpen, onClose, title, description, curricula, establishments }: CurriculumListModalProps) => {
  const getEstablishmentName = (id: string) => establishments.find(e => e.id === id)?.name || 'N/A';

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
            {curricula.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucun cursus trouvé.</p>
            ) : (
              curricula.map(curriculum => (
                <Card key={curriculum.id} className="p-3 rounded-android-tile"> {/* Apply rounded-android-tile */}
                  <CardContent className="p-0 flex items-center gap-3">
                    <LayoutList className="h-8 w-8 text-primary" />
                    <div className="flex-grow">
                      <p className="font-medium">{curriculum.name}</p>
                      {curriculum.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{curriculum.description}</p>
                      )}
                      {/* Removed establishment_id display */}
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <BookOpen className="h-3 w-3" /> {curriculum.course_ids.length} cours
                      </p>
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

export default CurriculumListModal;