import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, NotebookPen } from "lucide-react";
import { getNotes, addNote } from "@/lib/notes";
import { showSuccess, showError } from "@/utils/toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Importation des composants Accordion

interface NotesSectionProps {
  noteKey: string; // Clé unique pour le localStorage (ex: 'notes_course_1', 'notes_module_1_0')
  title: string; // Titre de l'entité (cours ou module) pour l'affichage
}

const NotesSection = ({ noteKey, title }: NotesSectionProps) => {
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState<string>('');

  useEffect(() => {
    setNotes(getNotes(noteKey));
  }, [noteKey]);

  const handleAddNote = () => {
    if (newNote.trim()) {
      const updatedNotes = addNote(noteKey, newNote.trim());
      setNotes(updatedNotes);
      setNewNote('');
      showSuccess("Note ajoutée avec succès !");
    } else {
      showError("Veuillez écrire quelque chose pour ajouter une note.");
    }
  };

  return (
    <Card>
      <Accordion type="single" collapsible defaultValue="notes-section" className="w-full"> {/* Ajout de defaultValue */}
        <AccordionItem value="notes-section">
          <AccordionTrigger className="p-6 text-lg font-semibold flex items-center gap-2">
            <NotebookPen className="h-6 w-6 text-primary" /> Mes notes pour "{title}"
          </AccordionTrigger>
          <AccordionContent className="p-6 pt-0 space-y-4">
            <ScrollArea className="h-40 w-full rounded-md border p-4 bg-muted/20">
              {notes.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucune note pour le moment. Ajoutez-en une ci-dessous !</p>
              ) : (
                <div className="space-y-2">
                  {notes.map((note, index) => (
                    <div key={index} className="p-2 bg-background rounded-md shadow-sm text-sm text-foreground">
                      {note}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="flex flex-col gap-2">
              <Textarea
                placeholder="Écrivez votre note ici..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                <PlusCircle className="h-4 w-4 mr-2" /> Ajouter une note
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default NotesSection;