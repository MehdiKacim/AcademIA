import React, { useState, useEffect, useMemo } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import MessageList from "@/components/MessageList";
import ChatInterface from "@/components/ChatInterface";
import { Profile } from '@/lib/dataModels';
import { useRole } from '@/contexts/RoleContext';
import { getAllProfiles } from '@/lib/studentData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from '@/utils/toast';
import { useLocation, useNavigate } from 'react-router-dom';

const Messages = () => {
  const { currentUserProfile, isLoadingUser } = useRole();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedContact, setSelectedContact] = useState<Profile | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [initialCourseContext, setInitialCourseContext] = useState<{ id?: string; title?: string }>({});

  useEffect(() => {
    const fetchProfiles = async () => {
      const profiles = await getAllProfiles();
      setAllProfiles(profiles.filter(p => p.id !== currentUserProfile?.id)); // Exclude current user
    };
    fetchProfiles();
  }, [currentUserProfile]);

  useEffect(() => {
    // Check for query parameters to pre-select a contact
    const params = new URLSearchParams(location.search);
    const contactId = params.get('contactId');
    const courseId = params.get('courseId');
    const courseTitle = params.get('courseTitle');

    if (contactId && allProfiles.length > 0) {
      const contact = allProfiles.find(p => p.id === contactId);
      if (contact) {
        setSelectedContact(contact);
        if (courseId) setInitialCourseContext({ id: courseId, title: courseTitle || `Cours ID: ${courseId}` });
      }
    }
  }, [location.search, allProfiles]);

  const handleSelectContact = (contact: Profile, courseId?: string, courseTitle?: string) => {
    setSelectedContact(contact);
    setInitialCourseContext({ id: courseId, title: courseTitle });
    // Update URL to reflect selected contact (optional, but good for deep linking)
    navigate(`/messages?contactId=${contact.id}${courseId ? `&courseId=${courseId}` : ''}${courseTitle ? `&courseTitle=${courseTitle}` : ''}`, { replace: true });
  };

  const handleUnreadCountChange = (count: number) => {
    setUnreadMessageCount(count);
  };

  const handleNewConversation = (profileId: string) => {
    const contact = allProfiles.find(p => p.id === profileId);
    if (contact) {
      handleSelectContact(contact);
    } else {
      showError("Profil introuvable pour démarrer une nouvelle conversation.");
    }
  };

  if (isLoadingUser) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Chargement des messages...
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
          Veuillez vous connecter pour accéder à la messagerie.
        </p>
      </div>
    );
  }

  const availableContactsForNewChat = useMemo(() => {
    // Filter out current user and contacts already in recent conversations
    const recentContactIds = new Set(
      allProfiles.filter(p => p.id !== currentUserProfile.id).map(p => p.id)
    );
    return allProfiles.filter(p => p.id !== currentUserProfile.id && recentContactIds.has(p.id));
  }, [allProfiles, currentUserProfile]);

  return (
    <div className="space-y-8 h-[calc(100vh-120px)] flex flex-col">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Messagerie
      </h1>
      <p className="text-lg text-muted-foreground">
        Communiquez avec les autres utilisateurs de la plateforme.
      </p>

      {isMobile ? (
        <div className="flex flex-col flex-grow">
          {!selectedContact ? (
            <>
              <div className="mb-4">
                <Label htmlFor="new-chat-select">Démarrer une nouvelle conversation</Label>
                <Select onValueChange={handleNewConversation}>
                  <SelectTrigger id="new-chat-select">
                    <SelectValue placeholder="Sélectionner un contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableContactsForNewChat.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.first_name} {profile.last_name} (@{profile.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <MessageList onSelectContact={handleSelectContact} selectedContactId={selectedContact?.id || null} onUnreadCountChange={handleUnreadCountChange} />
            </>
          ) : (
            <div className="flex flex-col flex-grow">
              <Button variant="outline" onClick={() => setSelectedContact(null)} className="mb-4 w-fit">
                <ArrowLeft className="h-4 w-4 mr-2" /> Retour aux conversations
              </Button>
              <ChatInterface
                contact={selectedContact}
                onMessageSent={() => {
                  // Re-fetch recent messages to update list and unread counts
                  // This will be handled by the MessageList's internal useEffect
                }}
                initialCourseId={initialCourseContext.id}
                initialCourseTitle={initialCourseContext.title}
              />
            </div>
          )}
        </div>
      ) : (
        <ResizablePanelGroup direction="horizontal" className="flex-grow rounded-lg border">
          <ResizablePanel defaultSize={30} minSize={25}>
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border">
                <Label htmlFor="new-chat-select-desktop">Démarrer une nouvelle conversation</Label>
                <Select onValueChange={handleNewConversation}>
                  <SelectTrigger id="new-chat-select-desktop">
                    <SelectValue placeholder="Sélectionner un contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableContactsForNewChat.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.first_name} {profile.last_name} (@{profile.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <MessageList onSelectContact={handleSelectContact} selectedContactId={selectedContact?.id || null} onUnreadCountChange={handleUnreadCountChange} />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={70} minSize={35}>
            {selectedContact ? (
              <ChatInterface
                contact={selectedContact}
                onMessageSent={() => {
                  // Re-fetch recent messages to update list and unread counts
                  // This will be handled by the MessageList's internal useEffect
                }}
                initialCourseId={initialCourseContext.id}
                initialCourseTitle={initialCourseContext.title}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <MessageSquare className="h-12 w-12 mr-4 text-primary" />
                Sélectionnez une conversation ou démarrez-en une nouvelle.
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
};

export default Messages;