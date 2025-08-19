import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NotebookText } from "lucide-react";
import { getAllNotesData, AggregatedNote } from "@/lib/notes";
import NotesSection from "@/components/NotesSection";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Import cn for conditional classnames

const AllNotes = () => {
  const [allNotes, setAllNotes] = useState<AggregatedNote[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [highlightedNoteKey, setHighlightedNoteKey] = useState<string | null>(null); // Nouvel état pour la surbrillance

  useEffect(() => {
    setAllNotes(getAllNotesData());
  }, [refreshKey]);

  const handleNoteChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Toutes mes notes
      </h1>
      <p className="text-lg text-muted-foreground">
        Retrouvez ici toutes les notes que vous avez prises pour vos cours et modules. Clic droit sur une carte pour gérer les notes.
      </p>

      {allNotes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <NotebookText className="h-12 w-12 mx-auto mb-4 text-primary" />
            <p>Vous n'avez pas encore pris de notes. Commencez un cours pour en ajouter !</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allNotes.map((noteGroup) => (
            <ContextMenu key={noteGroup.key} onOpenChange={(open) => setHighlightedNoteKey(open ? noteGroup.key : null)}>
              <ContextMenuTrigger asChild>
                <Card className={cn(
                  "cursor-context-menu hover:shadow-md transition-shadow",
                  highlightedNoteKey === noteGroup.key ? "bg-primary/10" : ""
                )}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <NotebookText className="h-5 w-5 text-primary" /> {noteGroup.context}
                    </CardTitle>
                    <CardDescription>
                      {noteGroup.notes.length} note(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground italic">
                      {noteGroup.notes.length > 0 ? `Dernière note: "${noteGroup.notes[noteGroup.notes.length - 1].substring(0, 50)}..."` : "Aucune note."}
                    </p>
                    <Button variant="outline" className="mt-4 w-full">
                      Voir les notes (Clic droit)
                    </Button>
                  </CardContent>
                </Card>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-80 p-0">
                <NotesSection
                  noteKey={noteGroup.key}
                  title={noteGroup.context}
                  refreshKey={refreshKey}
                />
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllNotes;