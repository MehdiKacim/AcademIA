import React, { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, User, BookOpen, MessageSquare, GraduationCap, Calendar, FileText } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";
import { Profile, Course, Message, Event, Document } from "@/lib/dataModels";
import { Link, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
// import { useSwipeable } from 'react-swipeable'; // Removed import

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const { currentUserProfile } = useRole();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<{
    profiles: Profile[];
    courses: Course[];
    messages: Message[];
    events: Event[];
    documents: Document[];
  }>({
    profiles: [],
    courses: [],
    messages: [],
    events: [],
    documents: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Swipe handlers for closing the sheet on mobile
  // const handlers = useSwipeable({ // Removed useSwipeable hook
  //   onSwipedDown: () => {
  //     if (isMobile && isOpen) {
  //       onClose();
  //     }
  //   },
  //   preventScrollOnSwipe: true,
  //   trackMouse: true, // For testing on desktop
  // });

  useEffect(() => {
    if (isOpen) {
      // Focus the input when the sheet opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Clear search term and results when the sheet closes
      setSearchTerm("");
      setSearchResults({
        profiles: [],
        courses: [],
        messages: [],
        events: [],
        documents: [],
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const performSearch = async () => {
      if (searchTerm.length < 2) {
        setSearchResults({
          profiles: [],
          courses: [],
          messages: [],
          events: [],
          documents: [],
        });
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc('global_search', { search_term: searchTerm });

        if (error) {
          // console.error("Error during global search:", error);
          setSearchResults({
            profiles: [],
            courses: [],
            messages: [],
            events: [],
            documents: [],
          });
          return;
        }

        const profiles: Profile[] = [];
        const courses: Course[] = [];
        const messages: Message[] = [];
        const events: Event[] = [];
        const documents: Document[] = [];

        data.forEach((item: any) => {
          if (item.type === 'profile') profiles.push(item.data);
          else if (item.type === 'course') courses.push(item.data);
          else if (item.type === 'message') messages.push(item.data);
          else if (item.type === 'event') events.push(item.data);
          else if (item.type === 'document') documents.push(item.data);
        });

        setSearchResults({ profiles, courses, messages, events, documents });
      } catch (err) {
        // console.error("Unexpected error during global search:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const handler = setTimeout(() => {
      performSearch();
    }, 300); // Debounce search

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const handleResultClick = (path: string) => {
    onClose(); // Close the search sheet
    navigate(path); // Navigate to the selected item
  };

  const renderSection = (title: string, items: any[], Icon: React.ElementType, getPath: (item: any) => string, getLabel: (item: any) => string) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-primary">
          <Icon className="h-5 w-5" /> {title}
        </h3>
        <div className="space-y-2">
          {items.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className="w-full justify-start h-auto py-2 px-3 text-left"
              onClick={() => handleResultClick(getPath(item))}
            >
              {getLabel(item)}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="top" className="h-full flex flex-col"> {/* Removed swipe handlers here */}
        <div className="flex items-center space-x-2 py-4 border-b">
          <Input
            ref={inputRef}
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-grow overflow-y-auto py-4">
          {isLoading && searchTerm.length >= 2 ? (
            <p className="text-center text-muted-foreground">Recherche en cours...</p>
          ) : searchTerm.length < 2 && isOpen ? (
            <p className="text-center text-muted-foreground">Commencez à taper pour rechercher...</p>
          ) : (
            <>
              {searchResults.profiles.length === 0 &&
              searchResults.courses.length === 0 &&
              searchResults.messages.length === 0 &&
              searchResults.events.length === 0 &&
              searchResults.documents.length === 0 && searchTerm.length >= 2 ? (
                <p className="text-center text-muted-foreground">Aucun résultat trouvé pour "{searchTerm}".</p>
              ) : (
                <>
                  {renderSection(
                    "Profils",
                    searchResults.profiles,
                    User,
                    (p) => `/profile/${p.id}`,
                    (p) => `${p.first_name} ${p.last_name} (@${p.username})`
                  )}
                  {renderSection(
                    "Cours",
                    searchResults.courses,
                    BookOpen,
                    (c) => `/course/${c.id}`,
                    (c) => c.title
                  )}
                  {renderSection(
                    "Messages",
                    searchResults.messages,
                    MessageSquare,
                    (m) => `/messages?contactId=${m.sender_id === currentUserProfile?.id ? m.receiver_id : m.sender_id}`,
                    (m) => `Conversation avec ${m.sender_id === currentUserProfile?.id ? m.receiver_name : m.sender_name}: ${m.content.substring(0, 50)}...`
                  )}
                  {renderSection(
                    "Événements",
                    searchResults.events,
                    Calendar,
                    (e) => `/calendar?eventId=${e.id}`,
                    (e) => `${e.title} (${new Date(e.start_time).toLocaleDateString()})`
                  )}
                  {renderSection(
                    "Documents",
                    searchResults.documents,
                    FileText,
                    (d) => `/documents?documentId=${d.id}`,
                    (d) => d.title
                  )}
                </>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default GlobalSearch;