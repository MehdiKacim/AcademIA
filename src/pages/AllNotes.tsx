import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotebookText } from "lucide-react";
import { getAllNotesData, AggregatedNote } from "@/lib/notes";

const AllNotes = () => {
  const [allNotes, setAllNotes] = useState<AggregatedNote[]>([]);

  useEffect(() => {
    setAllNotes(getAllNotesData());
  }, []);

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allNotes.map((noteGroup) => (
            <Card key={noteGroup.key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <NotebookText className="h-5 w-5 text-primary" /> {noteGroup.context}
                </CardTitle>
                <CardDescription>
                  {noteGroup.notes.length} note(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40 w-full rounded-md border p-4 bg-muted/20">
                  <div className="space-y-2">
                    {noteGroup.notes.map((note, index) => (
                      <div key={index} className="p-2 bg-background rounded-md shadow-sm text-sm text-foreground">
                        {note}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllNotes;