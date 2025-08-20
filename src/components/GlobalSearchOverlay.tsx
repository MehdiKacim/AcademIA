import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, NotebookText, BookOpen, Layers, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllNotesData, AggregatedNote } from "@/lib/notes";
import { loadCourses, Course, Module, ModuleSection } from "@/lib/courseData";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
  type: 'note' | 'course' | 'module' | 'section';
  id: string; // Unique ID for the item
  title: string; // Display title
  description: string; // Snippet or relevant text
  link: string; // React Router link
  icon: React.ElementType;
}

interface GlobalSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalSearchOverlay = ({ isOpen, onClose }: GlobalSearchOverlayProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      // Clear search when closing
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen]);

  const handleSearch = () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchResults([]);
      return;
    }

    const results: SearchResult[] = [];

    // Search Notes
    const allNotes = getAllNotesData();
    allNotes.forEach(noteGroup => {
      if (noteGroup.context.toLowerCase().includes(query) ||
          noteGroup.notes.some(note => note.toLowerCase().includes(query))) {
        results.push({
          type: 'note',
          id: noteGroup.key,
          title: `Note: ${noteGroup.context}`,
          description: noteGroup.notes.join(' | ').substring(0, 150) + (noteGroup.notes.join(' | ').length > 150 ? '...' : ''),
          link: `/all-notes?select=${noteGroup.key}`,
          icon: NotebookText,
        });
      }
    });

    // Search Courses, Modules, and Sections
    const allCourses = loadCourses();
    allCourses.forEach(course => {
      // Search Courses
      if (course.title.toLowerCase().includes(query) ||
          course.description.toLowerCase().includes(query) ||
          course.skillsToAcquire.some(skill => skill.toLowerCase().includes(query))) {
        results.push({
          type: 'course',
          id: course.id,
          title: `Cours: ${course.title}`,
          description: course.description.substring(0, 150) + (course.description.length > 150 ? '...' : ''),
          link: `/courses/${course.id}`,
          icon: BookOpen,
        });
      }

      // Search Modules within courses
      course.modules.forEach((module, moduleIndex) => {
        if (module.title.toLowerCase().includes(query)) {
          results.push({
            type: 'module',
            id: `${course.id}-${moduleIndex}`,
            title: `Module: ${module.title} (Cours: ${course.title})`,
            description: module.sections[0]?.content.substring(0, 150) + (module.sections[0]?.content.length > 150 ? '...' : ''),
            link: `/courses/${course.id}/modules/${moduleIndex}`,
            icon: Layers,
          });
        }

        // Search Sections within modules
        module.sections.forEach((section, sectionIndex) => {
          if (section.title.toLowerCase().includes(query) ||
              section.content.toLowerCase().includes(query)) {
            results.push({
              type: 'section',
              id: `${course.id}-${moduleIndex}-${sectionIndex}`,
              title: `Section: ${section.title} (Module: ${module.title}, Cours: ${course.title})`,
              description: section.content.substring(0, 150) + (section.content.length > 150 ? '...' : ''),
              link: `/courses/${course.id}/modules/${moduleIndex}#section-${sectionIndex}`,
              icon: FileText,
            });
          }
        });
      });
    });

    setSearchResults(results);
  };

  const groupedResults = useMemo(() => {
    const groups: { [key: string]: SearchResult[] } = {
      note: [],
      course: [],
      module: [],
      section: [],
    };
    searchResults.forEach(result => {
      groups[result.type].push(result);
    });
    return groups;
  }, [searchResults]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '-100%' }}
          animate={{ y: '0%' }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-x-0 top-20 z-[999] bg-background/95 backdrop-blur-lg border-b border-border shadow-lg py-4 px-4 md:px-8"
        >
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  placeholder="Rechercher dans tout AcademIA..."
                  className="pl-12 h-14 text-lg rounded-lg shadow-none focus:ring-2 focus:ring-primary focus:ring-offset-2 border-none bg-muted/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <Button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4"
                  disabled={!searchQuery.trim()}
                >
                  Rechercher
                </Button>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
                <X className="h-6 w-6" />
                <span className="sr-only">Fermer la recherche</span>
              </Button>
            </div>

            <div className="max-h-[calc(100vh-10rem)] overflow-y-auto pr-2"> {/* Adjusted max-height */}
              {searchQuery.trim() && searchResults.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Aucun résultat trouvé pour "{searchQuery}".</p>
              ) : (
                Object.keys(groupedResults).map(type => {
                  const resultsOfType = groupedResults[type as keyof typeof groupedResults];
                  if (resultsOfType.length === 0) return null;

                  const typeTitle = {
                    note: "Notes",
                    course: "Cours",
                    module: "Modules",
                    section: "Sections",
                  }[type];

                  return (
                    <div key={type} className="space-y-3 mb-6">
                      <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
                        {typeTitle}
                      </h2>
                      <div className="grid gap-3 md:grid-cols-2">
                        {resultsOfType.map(result => (
                          <Link to={result.link} key={result.id} onClick={onClose}>
                            <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
                              <CardHeader className="flex-row items-center gap-3 pb-2">
                                <result.icon className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">{result.title}</CardTitle>
                              </CardHeader>
                              <CardContent className="flex-grow">
                                <CardDescription className="text-sm line-clamp-3">
                                  {result.description}
                                </CardDescription>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalSearchOverlay;