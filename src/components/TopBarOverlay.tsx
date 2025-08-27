import React, { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, User, BookOpen, MessageSquare, GraduationCap, Calendar, FileText, Bot, User as UserIcon, Send } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";
import { Profile, Course, Message, Event, Document } from "@/lib/dataModels";
import { Link, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCourseChat } from "@/contexts/CourseChatContext";

interface TopBarOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'search' | 'aia';
}

interface AiAMessage {
  id: number;
  sender: 'user' | 'aia';
  text: string;
}

const TopBarOverlay: React.FC<TopBarOverlayProps> = ({ isOpen, onClose, initialTab = 'search' }) => {
  const { currentUserProfile } = useRole();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Search states
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
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // AiA Chat states
  const { currentCourseTitle, currentModuleTitle, initialChatMessage, setInitialChatMessage } = useCourseChat();
  const [aiaMessages, setAiaMessages] = useState<AiAMessage[]>([]);
  const [aiaInput, setAiaInput] = useState('');
  const aiaMessagesEndRef = useRef<HTMLDivElement>(null);
  const aiaMessageIdCounter = useRef(0);
  const aiaInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'search' | 'aia'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Effect for focusing input when overlay opens or tab changes
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (activeTab === 'search') {
          searchInputRef.current?.focus();
        } else {
          aiaInputRef.current?.focus();
        }
      }, 100);
    } else {
      // Clear states when the sheet closes
      setSearchTerm("");
      setSearchResults({ profiles: [], courses: [], messages: [], events: [], documents: [] });
      setAiaInput('');
      setAiaMessages([]);
      aiaMessageIdCounter.current = 0;
      setInitialChatMessage(null); // Clear initial chat message
    }
  }, [isOpen, activeTab, setInitialChatMessage]);

  // AiA Chat initial message and scroll
  useEffect(() => {
    if (isOpen && activeTab === 'aia' && aiaMessages.length === 0) {
      aiaMessageIdCounter.current += 1;
      setAiaMessages([
        { id: aiaMessageIdCounter.current, sender: 'aia', text: "Bonjour ! Je suis AiA, votre tuteur personnel. Comment puis-je vous aider aujourd'hui ?" },
      ]);
    }
  }, [isOpen, activeTab, aiaMessages.length]);

  useEffect(() => {
    if (isOpen && activeTab === 'aia' && initialChatMessage) {
      setAiaInput(initialChatMessage);
      setInitialChatMessage(null);
    }
  }, [isOpen, activeTab, initialChatMessage, setInitialChatMessage]);

  useEffect(() => {
    if (isOpen && activeTab === 'aia') {
      const timer = setTimeout(() => {
        aiaMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [aiaMessages, isOpen, activeTab]);

  // Search debounce effect
  useEffect(() => {
    const performSearch = async () => {
      if (searchTerm.length < 2) {
        setSearchResults({ profiles: [], courses: [], messages: [], events: [], documents: [] });
        return;
      }

      setIsLoadingSearch(true);
      try {
        const { data, error } = await supabase.rpc('global_search', { search_term: searchTerm });

        if (error) {
          setSearchResults({ profiles: [], courses: [], messages: [], events: [], documents: [] });
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
        setIsLoadingSearch(false);
      }
    };

    const handler = setTimeout(() => {
      performSearch();
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Handle navigation from search results
  const handleResultClick = (path: string) => {
    onClose();
    navigate(path);
  };

  const renderSearchSection = (title: string, items: any[], Icon: React.ElementType, getPath: (item: any) => string, getLabel: (item: any) => string) => {
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
              className="w-full justify-start h-auto py-2 px-3 text-left rounded-android-tile"
              onClick={() => handleResultClick(getPath(item))}
            >
              {getLabel(item)}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  // AiA Chat handlers
  const handleSendAiaMessage = () => {
    if (aiaInput.trim()) {
      const contextParts = [];
      if (currentCourseTitle) {
        contextParts.push(`Cours "${currentCourseTitle}"`);
      }
      if (currentModuleTitle) {
        contextParts.push(`Module "${currentModuleTitle}"`);
      }
      const contextPrefix = contextParts.length > 0 ? `(Contexte: ${contextParts.join(', ')}) ` : '';

      aiaMessageIdCounter.current += 1;
      const userMessageId = aiaMessageIdCounter.current;
      const newMessage: AiAMessage = { id: userMessageId, sender: 'user', text: contextPrefix + aiaInput.trim() };
      setAiaMessages((prevMessages) => [...prevMessages, newMessage]);
      setAiaInput('');

      setTimeout(() => {
        aiaMessageIdCounter.current += 1;
        const aiaResponse: AiAMessage = {
          id: aiaMessageIdCounter.current,
          sender: 'aia',
          text: `Je comprends que vous avez dit : "${newMessage.text}". Je suis en train de traiter votre demande.`,
        };
        setAiaMessages((prevMessages) => [...prevMessages, aiaResponse]);
      }, 1000);
    }
  };

  const handleAiaKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendAiaMessage();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="top" className="h-full flex flex-col p-0 backdrop-blur-lg bg-background/80 rounded-b-lg">
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'search' | 'aia')} className="flex-grow">
            <TabsList className="grid w-full grid-cols-2 rounded-android-tile">
              <TabsTrigger value="search" className="rounded-android-tile">
                <Search className="h-4 w-4 mr-2" /> Recherche
              </TabsTrigger>
              <TabsTrigger value="aia" className="rounded-android-tile">
                <Bot className="h-4 w-4 mr-2" /> AiA Chat
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="ghost" size="icon" onClick={onClose} className="ml-4 rounded-full h-10 w-10 bg-muted/20 hover:bg-muted/40">
            <X className="h-5 w-5" aria-label="Fermer" />
            <span className="sr-only">Fermer</span>
          </Button>
        </div>

        <TabsContent value="search" className="flex-grow flex flex-col p-4 pt-0">
          <div className="relative flex-shrink-0 mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Rechercher dans tout AcademIA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 text-lg rounded-lg shadow-none focus:ring-2 focus:ring-primary focus:ring-offset-2 border-none bg-muted/50 rounded-android-tile"
            />
          </div>
          <ScrollArea className="flex-grow pr-2">
            {isLoadingSearch && searchTerm.length >= 2 ? (
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
                    {renderSearchSection(
                      "Profils",
                      searchResults.profiles,
                      User,
                      (p) => `/profile/${p.id}`,
                      (p) => `${p.first_name} ${p.last_name} (@${p.username})`
                    )}
                    {renderSearchSection(
                      "Cours",
                      searchResults.courses,
                      BookOpen,
                      (c) => `/courses/${c.id}`,
                      (c) => c.title
                    )}
                    {renderSearchSection(
                      "Messages",
                      searchResults.messages,
                      MessageSquare,
                      (m) => `/messages?contactId=${m.sender_id === currentUserProfile?.id ? m.receiver_id : m.sender_id}`,
                      (m) => `Conversation avec ${m.sender_id === currentUserProfile?.id ? m.receiver_name : m.sender_name}: ${m.content.substring(0, 50)}...`
                    )}
                    {renderSearchSection(
                      "Événements",
                      searchResults.events,
                      Calendar,
                      (e) => `/calendar?eventId=${e.id}`,
                      (e) => `${e.title} (${new Date(e.start_time).toLocaleDateString()})`
                    )}
                    {renderSearchSection(
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
          </ScrollArea>
        </TabsContent>

        <TabsContent value="aia" className="flex-grow flex flex-col p-4 pt-0">
          <div className="flex-grow flex flex-col overflow-hidden">
            {(currentCourseTitle || currentModuleTitle) && (
              <div className="flex gap-2 flex-wrap pb-4 shrink-0">
                {currentCourseTitle && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAiaInput(prev => prev + ` @${currentCourseTitle}`)}
                    className="whitespace-nowrap text-xs rounded-android-tile"
                  >
                    @{currentCourseTitle.length > 10 ? currentCourseTitle.substring(0, 10) + '...' : currentCourseTitle}
                  </Button>
                )}
                {currentModuleTitle && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAiaInput(prev => prev + ` @${currentModuleTitle}`)}
                    className="whitespace-nowrap text-xs rounded-android-tile"
                  >
                    @{currentModuleTitle.length > 10 ? currentModuleTitle.substring(0, 10) + '...' : currentModuleTitle}
                  </Button>
                )}
              </div>
            )}
            <ScrollArea className="flex-grow border rounded-md p-4 bg-muted/20 rounded-android-tile">
              <div className="flex flex-col gap-4">
                {aiaMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-start gap-3",
                      msg.sender === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.sender === 'aia' && (
                      <div className="flex-shrink-0 p-2 rounded-full bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[70%] p-3 rounded-lg",
                        msg.sender === 'user'
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted text-muted-foreground rounded-bl-none"
                      )}
                    >
                      {msg.text}
                    </div>
                    {msg.sender === 'user' && (
                      <div className="flex-shrink-0 p-2 rounded-full bg-secondary text-secondary-foreground">
                        <UserIcon className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={aiaMessagesEndRef} />
              </div>
            </ScrollArea>
            <div className="flex flex-col gap-2 pt-4 shrink-0">
              <div className="flex gap-2">
                <Input
                  ref={aiaInputRef}
                  placeholder="Écrivez votre message à AiA..."
                  value={aiaInput}
                  onChange={(e) => setAiaInput(e.target.value)}
                  onKeyPress={handleAiaKeyPress}
                  className="flex-grow rounded-android-tile"
                />
                <Button onClick={handleSendAiaMessage} disabled={!aiaInput.trim()} className="rounded-android-tile">
                  <Send className="h-5 w-5" />
                  <span className="sr-only">Envoyer</span>
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </SheetContent>
    </Sheet>
  );
};

export default TopBarOverlay;