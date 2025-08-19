import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { addNote } from "@/lib/notes";
import { showSuccess, showError } from "@/utils/toast";

interface QuickNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  noteKey: string;
  contextTitle: string;
  onNoteAdded: () => void; // Callback pour rafraîchir la liste des notes
}

const QuickNoteDialog = ({ isOpen, onClose, noteKey, contextTitle, onNoteAdded }: QuickNoteDialogProps) => {
  const [noteContent, setNoteContent] = useState('');

  const handleAddNote = () => {
    if (noteContent.trim()) {
      addNote(noteKey, noteContent.trim());
      setNoteContent('');
      showSuccess("Note rapide ajoutée !");
      onNoteAdded(); // Déclenche le rafraîchissement
      onClose();
    } else {
      showError("Veuillez écrire quelque chose pour ajouter une note.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter une note rapide</DialogTitle>
          <DialogDescription>
            Saisissez une note pour "{contextTitle}".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Votre note ici..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={5}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleAddNote} disabled={!noteContent.trim()}>
            <PlusCircle className="h-4 w-4 mr-2" /> Ajouter la note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickNoteDialog;