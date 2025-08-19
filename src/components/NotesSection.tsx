import React, { useState, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Edit, Trash2, Save, XCircle } from "lucide-react";
import { getNotes, addNote, updateNote, deleteNote } from "@/lib/notes";
import { showSuccess, showError } from "@/utils/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface NotesSectionProps {
  noteKey: string; // Clé unique pour le localStorage (ex: 'notes_course_1', 'notes_module_1_0')
  title: string; // Titre de l'entité (cours ou module) pour l'affichage
  refreshKey?: number; // Nouvelle prop pour forcer le rafraîchissement
}

const NotesSection = ({ noteKey, title, refreshKey }: NotesSectionProps) => {
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');

  useEffect(() => {
    setNotes(getNotes(noteKey));
  }, [noteKey, refreshKey]);

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

  const handleEditClick = (index: number, content: string) => {
    setEditingIndex(index);
    setEditedContent(content);
  };

  const handleSaveEdit = (index: number) => {
    if (editedContent.trim()) {
      const updatedNotes = updateNote(noteKey, index, editedContent.trim());
      setNotes(updatedNotes);
      setEditingIndex(null);
      setEditedContent('');
      showSuccess("Note modifiée avec succès !");
    } else {
      showError("La note ne peut pas être vide.");
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedContent('');
  };

  const handleDeleteNote = (index: number) => {
    const updatedNotes = deleteNote(noteKey, index);
    setNotes(updatedNotes);
    showSuccess("Note supprimée avec succès !");
  };

  return (
    <div className="p-2 space-y-3">
      <h4 className="text-sm font-semibold text-foreground mb-2">Notes pour {title}</h4>
      <ScrollArea className="h-40 w-full rounded-md border p-3 bg-muted/20">
        {notes.length === 0 ? (
          <p className="text-muted-foreground text-xs">Aucune note pour le moment. Ajoutez-en une ci-dessous !</p>
        ) : (
          <div className="space-y-2">
            {notes.map((note, index) => (
              <div key={index} className="p-2 bg-background rounded-md shadow-sm text-xs text-foreground flex justify-between items-center">
                {editingIndex === index ? (
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="flex-grow mr-2 text-xs"
                    rows={2}
                  />
                ) : (
                  <span className="flex-grow">{note}</span>
                )}
                <div className="flex gap-1 ml-2">
                  {editingIndex === index ? (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(index)}>
                        <Save className="h-4 w-4 text-green-500" />
                        <span className="sr-only">Sauvegarder</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="sr-only">Annuler</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(index, note)}>
                        <Edit className="h-4 w-4 text-blue-500" />
                        <span className="sr-only">Éditer</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Supprimer</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action ne peut pas être annulée. Cela supprimera définitivement votre note.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteNote(index)}>Supprimer</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      <div className="flex flex-col gap-2">
        <Textarea
          placeholder="Écrivez votre nouvelle note ici..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={3}
          className="text-xs"
        />
        <Button onClick={handleAddNote} disabled={!newNote.trim()} size="sm">
          <PlusCircle className="h-4 w-4 mr-2" /> Ajouter une note
        </Button>
      </div>
    </div>
  );
};

export default NotesSection;