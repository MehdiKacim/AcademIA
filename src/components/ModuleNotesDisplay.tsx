import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, Trash2, Save, XCircle, NotebookText, PlusCircle } from "lucide-react";
import { getNotes, updateNote, deleteNote, getAllNotesData, AggregatedNote, parseNoteKey } from "@/lib/notes";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { dummyCourses } from "@/lib/courseData";

interface ModuleNotesDisplayProps {
  courseId: string;
  moduleIndex: number;
  refreshKey: number;
  onNoteChange: () => void;
  onAddNoteClick: (sectionTitle: string, sectionIndex: number) => void;
  onScrollToSection: (sectionIndex: number) => void;
}

const ModuleNotesDisplay = ({ courseId, moduleIndex, refreshKey, onNoteChange, onAddNoteClick, onScrollToSection }: ModuleNotesDisplayProps) => {
  const [notesData, setNotesData] = useState<AggregatedNote[]>([]);
  const [editingNote, setEditingNote] = useState<{ key: string; index: number; content: string } | null>(null);

  const fetchNotes = useCallback(() => {
    const allNotes = getAllNotesData();
    const filteredNotes = allNotes.filter(noteGroup => {
      const parsedKey = parseNoteKey(noteGroup.key);
      if (!parsedKey) return false;

      const { entityType, entityId, moduleIndex: noteModuleIndex } = parsedKey;

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

  const moduleTitle = dummyCourses.find(c => c.id === courseId)?.modules[moduleIndex]?.title || "Module Inconnu";

  return (
    <Card className="border-primary/20 shadow-lg shadow-primary/10">
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="module-notes-overview">
          <AccordionTrigger className="p-6 text-lg font-semibold flex items-center gap-2">
            <NotebookText className="h-6 w-6 text-primary" /> Mes notes pour "{moduleTitle}"
          </AccordionTrigger>
          <AccordionContent className="p-6 pt-0 space-y-4">
            <ScrollArea className="h-full w-full"> {/* ScrollArea should wrap the content inside AccordionContent */}
              {notesData.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucune note pour ce module ou ses sections.
                </p>
              ) : (
                <div className="space-y-4">
                  {notesData.map((noteGroup) => {
                    const parsedKey = parseNoteKey(noteGroup.key);
                    const isSectionNote = parsedKey?.entityType === 'section';
                    const sectionIndex = isSectionNote ? parsedKey?.sectionIndex : -1;

                    return (
                      <Card key={noteGroup.key} className="bg-muted/10 border-primary/5 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <NotebookText className="h-4 w-4 text-primary" />
                            {noteGroup.context}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {noteGroup.notes.map((note, noteIdx) => (
                            <div
                              key={noteIdx}
                              className="p-2 bg-background rounded-md text-sm text-foreground flex justify-between items-start cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => isSectionNote && sectionIndex !== undefined && onScrollToSection(sectionIndex)}
                            >
                              <span className="flex-grow">{note}</span>
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
                          <div className="flex justify-end gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onAddNoteClick(noteGroup.context.split(': ')[1].split(' (')[0], sectionIndex)}
                            >
                              <PlusCircle className="h-4 w-4 mr-1" /> Ajouter une note
                            </Button>
                            <Link to="/all-notes">
                              <Button variant="link" size="sm" className="p-0 h-auto text-xs text-muted-foreground hover:underline">
                                Gérer toutes les notes
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default ModuleNotesDisplay;