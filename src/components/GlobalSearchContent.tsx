import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, NotebookText, BookOpen, Layers, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllNotesData, AggregatedNote } from "@/lib/notes";
import { loadCourses, Course, Module, ModuleSection } from "@/lib/courseData";
import { Link } from "react-router-dom";

interface SearchResult {
  type: 'note' | 'course' | 'module' | 'section';
  id: string; // Unique ID for the item
  title: string; // Display title
  description: string; // Snippet or relevant text
  link: string; // React Router link
  icon: React.ElementType;
}

interface GlobalSearchContentProps {
  onResultClick?: () => void; // Callback to close the popover when a result is clicked
}

const GlobalSearchContent = ({ onResultClick }: GlobalSearchContentProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

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
    <div className="p-4 space-y-4 w-[400px]"> {/* Fixed width for the popover content */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Rechercher dans tout AcademIA..."
          className="pl-10 h-10"
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
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3"
          disabled={!searchQuery.trim()}
        >
          Go
        </Button>
      </div>

      <div className="max-h-[300px] overflow-y-auto pr-2"> {/* Max height for scrollable results */}
        {searchQuery.trim() && searchResults.length === 0 ? (
          <p className="text-muted-foreground text-center text-sm py-4">Aucun résultat trouvé pour "{searchQuery}".</p>
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
              <div key={type} className="space-y-2 mb-4">
                <h3 className="text-md font-semibold text-primary">
                  {typeTitle}
                </h3>
                <div className="grid gap-2">
                  {resultsOfType.map(result => (
                    <Link to={result.link} key={result.id} onClick={onResultClick}>
                      <Card className="flex items-center p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                        <result.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div className="flex-grow">
                          <p className="font-medium text-sm line-clamp-1">{result.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{result.description}</p>
                        </div>
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
  );
};

export default GlobalSearchContent;