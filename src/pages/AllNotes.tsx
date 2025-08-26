import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NotebookText, Search, ArrowLeft } from "lucide-react";
import { getAllNotesData, AggregatedNote } from "@/lib/notes"; // Import getAllNotesData
import NotesSection from "@/components/NotesSection";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { loadCourses } from '@/lib/courseData'; // Import loadCourses
import { useRole } from '@/contexts/RoleContext'; // Import useRole

const AllNotes = () => {
  const { currentUserProfile, isLoadingUser } = useRole();
  const [allNotes, setAllNotes] = useState<AggregatedNote[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteGroupKey, setSelectedNoteGroupKey] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const location = useLocation();

  const isBackToListActionRef = useRef(false);

  useEffect(() => {
    const fetchAllNotes = async () => {
      if (currentUserProfile) {
        const courses = await loadCourses(); // Load courses to resolve context
        const notes = await getAllNotesData(currentUserProfile.id, courses);
        setAllNotes(notes);

        const queryParams = new URLSearchParams(location.search);
        const selectKey = queryParams.get('select');

        if (selectKey && notes.some(n => n.key === selectKey)) {
          setSelectedNoteGroupKey(selectKey);
        } else if (notes.length > 0 && !selectedNoteGroupKey) { // Only set default if no key is already selected
          setSelectedNoteGroupKey(notes[0].key);
        } else if (notes.length === 0) {
          setSelectedNoteGroupKey(null);
        }
      }
    };
    fetchAllNotes();
  }, [refreshKey, location.search, currentUserProfile]); // Depend on currentUserProfile

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

  useEffect(() => {
    if (isBackToListActionRef.current) {
      isBackToListActionRef.current = false;
      return;
    }

    if (selectedNoteGroupKey !== null && !filteredNotes.some(n => n.key === selectedNoteGroupKey)) {
      setSelectedNoteGroupKey(filteredNotes.length > 0 ? filteredNotes[0].key : null);
    }
    else if (selectedNoteGroupKey === null && filteredNotes.length > 0 && searchQuery === '') {
        setSelectedNoteGroupKey(filteredNotes[0].key);
    }
  }, [filteredNotes, selectedNoteGroupKey, searchQuery]);

  const handleNoteChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSelectNoteGroup = (key: string) => {
    setSelectedNoteGroupKey(key);
  };

  const handleBackToList = () => {
    setSelectedNoteGroupKey(null);
    isBackToListActionRef.current = true;
  };

  const selectedNoteGroup = useMemo(() => {
    return allNotes.find(group => group.key === selectedNoteGroupKey);
  }, [allNotes, selectedNoteGroupKey]);

  if (isLoadingUser) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Chargement des notes...
        </h1>
        <p className="text-lg text-muted-foreground">
          Veuillez patienter.
        </p>
      </div>
    );
  }

  if (!currentUserProfile) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès Restreint
        </h1>
        <p className="text-lg text-muted-foreground">
          Veuillez vous connecter pour voir vos notes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 h-[calc(100vh-120px)] flex flex-col">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Toutes mes notes
      </h1>
      <p className="text-lg text-muted-foreground">
        Retrouvez ici toutes les notes que vous avez prises pour vos cours et modules.
      </p>

      {allNotes.length === 0 ? (
        <Card className="flex-grow flex items-center justify-center rounded-android-tile"> {/* Apply rounded-android-tile */}
          <CardContent className="p-6 text-center text-muted-foreground">
            <NotebookText className="h-12 w-12 mx-auto mb-4 text-primary" />
            <p>Vous n'avez pas encore pris de notes. Commencez un cours pour en ajouter !</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col flex-grow md:flex-row md:gap-4">
          {/* Left Panel (Notes List) */}
          <div className={cn(
            "flex flex-col",
            isMobile ? (selectedNoteGroupKey ? "hidden" : "flex-grow") : "w-full md:w-1/3 flex-shrink-0"
          )}>
            <div className="flex-grow overflow-y-auto pb-4 md:pr-2">
              {filteredNotes.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Aucune note trouvée pour votre recherche.</p>
              ) : (
                <div className="grid gap-4">
                  {filteredNotes.map((noteGroup) => (
                    <Card
                      key={noteGroup.key}
                      className={cn(
                        "cursor-pointer hover:shadow-md transition-shadow rounded-android-tile", // Apply rounded-android-tile
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

          {/* Right Panel (Notes Section) */}
          <div className={cn(
            "flex flex-col",
            isMobile ? (selectedNoteGroupKey ? "flex-grow" : "hidden") : "w-full md:w-2/3 flex-grow"
          )}>
            {isMobile && selectedNoteGroupKey && (
              <Button variant="outline" onClick={handleBackToList} className="mb-4 w-fit">
                <ArrowLeft className="h-4 w-4 mr-2" /> Retour à la liste
              </Button>
            )}
            {selectedNoteGroup && currentUserProfile ? (
              <NotesSection
                noteKey={selectedNoteGroup.key}
                title={selectedNoteGroup.context}
                userId={currentUserProfile.id}
                refreshKey={refreshKey}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Sélectionnez une note {isMobile ? '' : 'à gauche'} pour la visualiser.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllNotes;