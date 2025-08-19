import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotebookText } from "lucide-react";
import { getAllNotesData, AggregatedNote } from "@/lib/notes";
import NotesSection from "@/components/NotesSection"; // Importation de NotesSection

const AllNotes = () => {
  const [allNotes, setAllNotes] = useState<AggregatedNote[]>([]);
  const [refreshKey, setRefreshKey] = useState(0); // État pour forcer le rafraîchissement

  useEffect(() => {
    setAllNotes(getAllNotesData());
  }, [refreshKey]); // Dépendance à refreshKey

  const handleNoteChange = () => {
    // Cette fonction est appelée lorsque NotesSection ajoute, édite ou supprime une note.
    // Elle force le rafraîchissement de la liste complète des notes.
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Toutes mes notes
      </h1>
      <p className="text-lg text-muted-foreground">
        Retrouvez ici toutes les notes que vous avez prises pour vos cours et modules.
      </p>

      {allNotes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <NotebookText className="h-12 w-12 mx-auto mb-4 text-primary" />
            <p>Vous n'avez pas encore pris de notes. Commencez un cours pour en ajouter !</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1"> {/* Changé en 1 colonne pour mieux gérer les NotesSection */}
          {allNotes.map((noteGroup) => (
            <NotesSection
              key={noteGroup.key}
              noteKey={noteGroup.key}
              title={noteGroup.context}
              refreshKey={refreshKey} // Passe le refreshKey pour que NotesSection se rafraîchisse
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllNotes;