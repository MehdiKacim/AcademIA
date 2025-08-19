import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, Trash2, Save, XCircle, NotebookText } from "lucide-react";
import { getNotes, updateNote, deleteNote, getAllNotesData, AggregatedNote } from "@/lib/notes";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { dummyCourses } from "@/lib/courseData"; // Pour obtenir les titres de module/section

interface ModuleNotesSidebarProps {
  courseId: string;
  moduleIndex: number;
  refreshKey: number; // Pour déclencher un nouveau fetch lorsque des notes sont ajoutées/modifiées ailleurs
  onNoteChange: () => void; // Callback pour notifier le parent des changements
}

const ModuleNotesSidebar = ({ courseId, moduleIndex, refreshKey, onNoteChange }: ModuleNotesSidebarProps) => {
  const [notesData, setNotesData] = useState<AggregatedNote[]>([]);
  const [editingNote, setEditingNote] = useState<{ key: string; index: number; content: string } | null>(null);
  const isMobile = useIsMobile();

  const fetchNotes = useCallback(() => {
    const allNotes = getAllNotesData();
    const filteredNotes = allNotes.filter(noteGroup => {
      const keyParts = noteGroup.key.split('_');
      const entityType = keyParts[1];
      const entityId = keyParts[2];
      const noteModuleIndex = parseInt(keyParts[3], 10);

      // Filtrer pour n'inclure que les notes du cours et du module actuels
      if (entityId === courseId) {
        if (entityType === 'module' && noteModuleIndex === moduleIndex) {
          return true;
        }
        if (entityType === 'section' && noteModuleIndex === moduleIndex) {
          return true;
        }
      }
      return false;
    });
    setNotesData(filteredNotes);
  }, [courseId, moduleIndex]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes, refreshKey]);

  const handleSaveEdit = (noteKey: string, index: number) => {
    if (editingNote && editingNote.content.trim()) {
      const updatedNotes = updateNote(noteKey, index, editingNote.content.trim());
      setNotesData(prev => prev.map(group => group.key === noteKey ? { ...group, notes: updatedNotes } : group));
      setEditingNote(null);
      showSuccess("Note modifiée avec succès !");
      onNoteChange();
    } else {
      showError("La note ne peut pas être vide.");
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
  };

  const handleDeleteNote = (noteKey: string, index: number) => {
    const updatedNotes = deleteNote(noteKey, index);
    setNotesData(prev => prev.map(group => group.key === noteKey ? { ...group, notes: updatedNotes } : group));
    showSuccess("Note supprimée avec succès !");
    onNoteChange();
  };

  const renderNotesContent = () => (
    <ScrollArea className="h-full w-full p-4">
      <div className="space-y-6">
        {notesData.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Aucune note pour ce module ou ses sections.
          </p>
        ) : (
          notesData.map((noteGroup) => (
            <Card key={noteGroup.key} className="bg-background/50 border-primary/10 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <NotebookText className="h-4 w-4 text-primary" />
                  {noteGroup.context}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {noteGroup.notes.map((note, noteIdx) => (
                  <div key={noteIdx} className="p-2 bg-muted/30 rounded-md text-sm text-foreground flex justify-between items-start">
                    {editingNote?.key === noteGroup.key && editingNote?.index === noteIdx ? (
                      <Textarea
                        value={editingNote.content}
                        onChange={(e) => setEditingNote(prev => prev ? { ...prev, content: e.target.value } : null)}
                        className="flex-grow mr-2"
                        rows={2}
                      />
                    ) : (
                      <span className="flex-grow">{note}</span>
                    )}
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      {editingNote?.key === noteGroup.key && editingNote?.index === noteIdx ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(noteGroup.key, noteIdx)}>
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
                          <Button variant="ghost" size="icon" onClick={() => setEditingNote({ key: noteGroup.key, index: noteIdx, content: note })}>
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
                                <AlertDialogAction onClick={() => handleDeleteNote(noteGroup.key, noteIdx)}>Supprimer</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </ScrollArea>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg animate-bounce-slow fixed bottom-20 right-20 z-40" // Position ajustée pour mobile
          >
            <NotebookText className="h-7 w-7" />
            <span className="sr-only">Voir mes notes</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <NotebookText className="h-6 w-6 text-primary" /> Mes Notes du Module
            </SheetTitle>
            <CardDescription>
              Notes pour le module "{dummyCourses.find(c => c.id === courseId)?.modules[moduleIndex]?.title}"
            </CardDescription>
          </SheetHeader>
          <div className="flex-grow overflow-hidden">
            {renderNotesContent()}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Card className="w-96 flex-shrink-0 h-[calc(100vh-8rem)] sticky top-24 overflow-hidden border-primary/20 shadow-lg shadow-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <NotebookText className="h-6 w-6 text-primary" /> Mes Notes du Module
        </CardTitle>
        <CardDescription>
          Notes pour le module "{dummyCourses.find(c => c.id === courseId)?.modules[moduleIndex]?.title}"
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[calc(100%-6rem)] p-0"> {/* Ajuster la hauteur pour remplir la carte */}
        {renderNotesContent()}
      </CardContent>
    </Card>
  );
};

export default ModuleNotesSidebar;