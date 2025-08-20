import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Edit, Trash2, Save, XCircle } from "lucide-react";
import { getNotes, addNote, updateNote, deleteNote } from "@/lib/notes"; // Import Supabase-based notes functions
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
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import the Quill CSS

interface NotesSectionProps {
  noteKey: string; // Clé unique pour le localStorage (ex: 'notes_course_1', 'notes_module_1_0')
  title: string; // Titre de l'entité (cours ou module) pour l'affichage
  userId: string; // New: Pass the current user's ID
  refreshKey?: number; // Nouvelle prop pour forcer le rafraîchissement
}

const NotesSection = ({ noteKey, title, userId, refreshKey }: NotesSectionProps) => {
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const fetchedNotes = await getNotes(userId, noteKey);
        setNotes(fetchedNotes);
      } catch (error: any) {
        console.error("Error fetching notes in NotesSection:", error);
        showError(`Erreur lors du chargement des notes: ${error.message}`);
      }
    };
    fetchNotes();
  }, [noteKey, userId, refreshKey]); // Depend on userId and refreshKey

  const handleAddNote = async () => {
    const strippedNewNote = newNote.replace(/<[^>]*>/g, '').trim();
    if (strippedNewNote) {
      try {
        const updatedNotes = await addNote(userId, noteKey, newNote); // Pass userId
        setNotes(updatedNotes);
        setNewNote('');
        showSuccess("Note ajoutée avec succès !");
      } catch (error: any) {
        console.error("Error adding note:", error);
        showError(`Erreur lors de l'ajout de la note: ${error.message}`);
      }
    } else {
      showError("Veuillez écrire quelque chose pour ajouter une note.");
    }
  };

  const handleEditClick = (index: number, content: string) => {
    setEditingIndex(index);
    setEditedContent(content);
  };

  const handleSaveEdit = async (index: number) => {
    const strippedEditedContent = editedContent.replace(/<[^>]*>/g, '').trim();
    if (strippedEditedContent) {
      try {
        const updatedNotes = await updateNote(userId, noteKey, index, editedContent); // Pass userId
        setNotes(updatedNotes);
        setEditingIndex(null);
        setEditedContent('');
        showSuccess("Note modifiée avec succès !");
      } catch (error: any) {
        console.error("Error saving edited note:", error);
        showError(`Erreur lors de la modification de la note: ${error.message}`);
      }
    } else {
      showError("La note ne peut pas être vide.");
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedContent('');
  };

  const handleDeleteNote = async (index: number) => {
    try {
      const updatedNotes = await deleteNote(userId, noteKey, index); // Pass userId
      setNotes(updatedNotes);
      showSuccess("Note supprimée avec succès !");
    } catch (error: any) {
      console.error("Error deleting note:", error);
      showError(`Erreur lors de la suppression de la note: ${error.message}`);
    }
  };

  // Quill modules and formats for rich text editing
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      ['link', 'image', 'code-block'], // Added 'code-block'
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'code-block' // Added 'code-block'
  ];

  return (
    <div className="p-2 space-y-3">
      <h4 className="text-sm font-semibold text-foreground mb-2">Notes pour {title}</h4>
      <ScrollArea className="h-40 w-full rounded-md border p-3 bg-muted/20">
        {notes.length === 0 ? (
          <p className="text-muted-foreground text-xs">Aucune note pour le moment. Ajoutez-en une ci-dessous !</p>
        ) : (
          <div className="space-y-2">
            {notes.map((note, index) => (
              <div key={index} className="p-2 bg-background rounded-md shadow-sm text-xs text-foreground flex justify-between items-start">
                {editingIndex === index ? (
                  <div className="flex-grow mr-2 w-full">
                    <ReactQuill
                      theme="snow"
                      value={editedContent}
                      onChange={setEditedContent}
                      modules={quillModules}
                      formats={quillFormats}
                      className="h-32 mb-10" // Adjust height for editor
                    />
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert flex-grow mr-2 max-w-none">
                    {/* WARNING: dangerouslySetInnerHTML can expose to XSS attacks if content is not sanitized.
                        For a production app, ensure server-side sanitization or use a library like DOMPurify. */}
                    <div dangerouslySetInnerHTML={{ __html: note }} />
                  </div>
                )}
                <div className="flex gap-1 ml-2 flex-shrink-0">
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
        <ReactQuill
          theme="snow"
          value={newNote}
          onChange={setNewNote}
          modules={quillModules}
          formats={quillFormats}
          className="h-32 mb-10" // Adjust height for editor
          placeholder="Écrivez votre nouvelle note ici..."
        />
        <Button onClick={handleAddNote} disabled={!newNote.replace(/<[^>]*>/g, '').trim()} size="sm">
          <PlusCircle className="h-4 w-4 mr-2" /> Ajouter une note
        </Button>
      </div>
    </div>
  );
};

export default NotesSection;