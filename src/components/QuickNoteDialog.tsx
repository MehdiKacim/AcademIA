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
import { addNote } from "@/lib/notes"; // Import addNote from Supabase-based notes.ts
import { showSuccess, showError } from "@/utils/toast";
import { useRole } from '@/contexts/RoleContext'; // Import useRole
import ReactQuill from 'react-quill'; // Import ReactQuill
import 'react-quill/dist/quill.snow.css'; // Import Quill CSS

interface QuickNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  noteKey: string;
  contextTitle: string;
  onNoteAdded: () => void; // Callback pour rafraîchir la liste des notes
}

const QuickNoteDialog = ({ isOpen, onClose, noteKey, contextTitle, onNoteAdded }: QuickNoteDialogProps) => {
  const [noteContent, setNoteContent] = useState('');
  const { currentUserProfile } = useRole();

  const handleAddNote = async () => {
    if (!currentUserProfile) {
      showError("Vous devez être connecté pour ajouter une note.");
      return;
    }
    const strippedNoteContent = noteContent.replace(/<[^>]*>/g, '').trim();
    if (strippedNoteContent) {
      try {
        await addNote(currentUserProfile.id, noteKey, noteContent.trim());
        setNoteContent('');
        showSuccess("Note rapide ajoutée !");
        onNoteAdded(); // Déclenche le rafraîchissement
        onClose();
      } catch (error: any) {
        console.error("Error adding quick note:", error);
        showError(`Erreur lors de l'ajout de la note: ${error.message}`);
      }
    } else {
      showError("Veuillez écrire quelque chose pour ajouter une note.");
    }
  };

  // Quill modules and formats for rich text editing
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      ['link', 'image', 'code-block'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'code-block'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] backdrop-blur-lg bg-background/80 rounded-android-tile"> {/* Apply rounded-android-tile */}
        <DialogHeader>
          <DialogTitle>Ajouter une note rapide</DialogTitle>
          <DialogDescription>
            Saisissez une note pour "{contextTitle}".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <ReactQuill
            theme="snow"
            value={noteContent}
            onChange={setNoteContent}
            modules={quillModules}
            formats={quillFormats}
            className="h-auto min-h-[100px] max-h-[200px] overflow-y-auto mb-10" // Adjusted height
            placeholder="Votre note ici..."
          />
        </div>
        <DialogFooter>
          <Button onClick={handleAddNote} disabled={!noteContent.replace(/<[^>]*>/g, '').trim()}>
            <PlusCircle className="h-4 w-4 mr-2" /> Ajouter la note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickNoteDialog;