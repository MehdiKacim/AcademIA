import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NotebookText, Search, ArrowLeft } from "lucide-react";
import { getAllNotesData, AggregatedNote } from "@/lib/notes";
import NotesSection from "@/components/NotesSection";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

const AllNotes = () => {
  const [allNotes, setAllNotes] = useState<AggregatedNote[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteGroupKey, setSelectedNoteGroupKey] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Memoize filtered notes to avoid re-calculation on every render
  // Moved this declaration before useEffects that depend on it
  const filteredNotes = useMemo(() => {
    if (!searchQuery) {
      return allNotes;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return allNotes.filter(noteGroup => {
      const contextMatch = noteGroup.context.toLowerCase().includes(lowerCaseQuery);
      const notesContentMatch = noteGroup.notes.some(note =>
        note.toLowerCase().includes(lowerCaseQuery)
      );
      return contextMatch || notesContentMatch;
    });
  }, [allNotes, searchQuery]);

  // Effect to load all notes and set initial selection on mount or full refresh
  useEffect(() => {
    const notes = getAllNotesData();
    setAllNotes(notes);
    // Only set initial selection if no selection has been made yet AND there are notes
    if (selectedNoteGroupKey === null && notes.length > 0) {
      setSelectedNoteGroupKey(notes[0].key);
    }
  }, [refreshKey]); // This effect handles initial load and full refresh

  // Effect to manage selectedNoteGroupKey based on filteredNotes
  // This ensures that if the currently selected note is filtered out, the selection is cleared.
  // It does NOT automatically re-select the first item if selectedNoteGroupKey is null,
  // allowing the 'Retour à la liste' action to work.
  useEffect(() => {
    if (selectedNoteGroupKey !== null && !filteredNotes.some(n => n.key === selectedNoteGroupKey)) {
      setSelectedNoteGroupKey(null); // Clear selection if current note is filtered out
    }
    // If no note is selected and there are filtered notes, select the first one.
    // This handles cases where search results appear after a cleared selection,
    // but only if the user hasn't explicitly cleared it via 'Retour à la liste'.
    // This condition is crucial: it only auto-selects if there's no selection AND there are filtered notes.
    // If selectedNoteGroupKey is null because of handleBackToList, this won't re-select immediately.
    else if (selectedNoteGroupKey === null && filteredNotes.length > 0 && searchQuery === '') {
        setSelectedNoteGroupKey(filteredNotes[0].key);
    }
  }, [filteredNotes, selectedNoteGroupKey, searchQuery]); // Dependencies: filteredNotes, selectedNoteGroupKey, searchQuery

  const handleNoteChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSelectNoteGroup = (key: string) => {
    setSelectedNoteGroupKey(key);
  };

  const handleBackToList = () => {
    setSelectedNoteGroupKey(null);
  };

  const selectedNoteGroup = useMemo(() => {
    return allNotes.find(group => group.key === selectedNoteGroupKey);
  }, [allNotes, selectedNoteGroupKey]);

  return (
    <div className="space-y-8 h-[calc(100vh-120px)] flex flex-col">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Toutes mes notes
      </h1>
      <p className="text-lg text-muted-foreground">
        Retrouvez ici toutes les notes que vous avez prises pour vos cours et modules.
      </p>

      {allNotes.length === 0 ? (
        <Card className="flex-grow flex items-center justify-center">
          <CardContent className="p-6 text-center text-muted-foreground">
            <NotebookText className="h-12 w-12 mx-auto mb-4 text-primary" />
            <p>Vous n'avez pas encore pris de notes. Commencez un cours pour en ajouter !</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {isMobile ? (
            <div className="flex flex-col flex-grow">
              {!selectedNoteGroupKey ? (
                <>
                  <div className="relative mb-4 w-full max-w-md mx-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher dans les notes..."
                      className="pl-9 text-center"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex-grow overflow-y-auto pb-4">
                    {filteredNotes.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">Aucune note trouvée pour votre recherche.</p>
                    ) : (
                      <div className="grid gap-4">
                        {filteredNotes.map((noteGroup) => (
                          <Card
                            key={noteGroup.key}
                            className={cn(
                              "cursor-pointer hover:shadow-md transition-shadow",
                              selectedNoteGroupKey === noteGroup.key ? "border-primary ring-2 ring-primary/50 bg-primary/5" : ""
                            )}
                            onClick={() => handleSelectNoteGroup(noteGroup.key)}
                          >
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-base">
                                <NotebookText className="h-4 w-4 text-primary" /> {noteGroup.context}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {noteGroup.notes.length} note(s)
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-xs text-muted-foreground italic">
                                {noteGroup.notes.length > 0 ? `Dernière note: "${noteGroup.notes[noteGroup.notes.length - 1].substring(0, 50)}..."` : "Aucune note."}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col flex-grow">
                  <Button variant="outline" onClick={handleBackToList} className="mb-4 w-fit">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Retour à la liste
                  </Button>
                  {selectedNoteGroup ? (
                    <NotesSection
                      noteKey={selectedNoteGroup.key}
                      title={selectedNoteGroup.context}
                      refreshKey={refreshKey}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Sélectionnez une note pour la visualiser.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <ResizablePanelGroup direction="horizontal" className="flex-grow rounded-lg border">
              <ResizablePanel defaultSize={35} minSize={25}>
                <div className="flex flex-col h-full p-4">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher dans les notes..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex-grow overflow-y-auto pr-2">
                    {filteredNotes.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">Aucune note trouvée pour votre recherche.</p>
                    ) : (
                      <div className="grid gap-4">
                        {filteredNotes.map((noteGroup) => (
                          <Card
                            key={noteGroup.key}
                            className={cn(
                              "cursor-pointer hover:shadow-md transition-shadow",
                              selectedNoteGroupKey === noteGroup.key ? "border-primary ring-2 ring-primary/50 bg-primary/5" : ""
                            )}
                            onClick={() => handleSelectNoteGroup(noteGroup.key)}
                          >
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-base">
                                <NotebookText className="h-4 w-4 text-primary" /> {noteGroup.context}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {noteGroup.notes.length} note(s)
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-xs text-muted-foreground italic">
                                {noteGroup.notes.length > 0 ? `Dernière note: "${noteGroup.notes[noteGroup.notes.length - 1].substring(0, 50)}..."` : "Aucune note."}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={65} minSize={35}>
                <div className="flex flex-col h-full p-4">
                  {selectedNoteGroup ? (
                    <NotesSection
                      noteKey={selectedNoteGroup.key}
                      title={selectedNoteGroup.context}
                      refreshKey={refreshKey}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Sélectionnez une note à gauche pour la visualiser.
                    </div>
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </>
      )}
    </div>
  );
};

export default AllNotes;