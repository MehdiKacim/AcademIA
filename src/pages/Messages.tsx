import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import MessageList from "@/components/MessageList";
import ChatInterface from "@/components/ChatInterface";
import { Profile, Message } from '@/lib/dataModels'; // Import Message type
import { useRole } from '@/contexts/RoleContext';
import { getAllProfiles } from '@/lib/studentData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from '@/utils/toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRecentConversations, getUnreadMessageCount } from "@/lib/messageData"; // Import messageData functions
import { supabase } from "@/integrations/supabase/client"; // Import supabase for realtime
import { cn } from '@/lib/utils'; // Import cn for conditional styling
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile

const Messages = () => {
  const { currentUserProfile, isLoadingUser } = useRole();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedContact, setSelectedContact] = useState<Profile | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]); // State for recent messages
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [initialCourseContext, setInitialCourseContext] = useState<{ id?: string; title?: string }>({});

  const currentUserId = currentUserProfile?.id;

  const fetchAllData = async () => {
    if (!currentUserId) return;

    const profiles = await getAllProfiles();
    setAllProfiles(profiles.filter(p => p.id !== currentUserId)); // Exclude current user

    const messages = await getRecentConversations(currentUserId);
    setRecentMessages(messages);

    const totalUnread = await getUnreadMessageCount(currentUserId);
    setUnreadMessageCount(totalUnread);
  };

  useEffect(() => {
    fetchAllData();

    // Set up real-time listener for new messages to update the list and unread counts
    let channel: any;
    if (currentUserId) {
      channel = supabase
        .channel(`messages_page_${currentUserId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${currentUserId}`
          },
          (payload) => {
            // Re-fetch all data to ensure consistency and correct unread counts
            fetchAllData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${currentUserId}`
          },
          (payload) => {
            // Re-fetch all data to ensure consistency and correct unread counts
            fetchAllData();
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [currentUserId]); // Depend on currentUserId

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

  const handleNewConversation = (profileId: string) => {
    const contact = allProfiles.find(p => p.id === profileId);
    if (contact) {
      handleSelectContact(contact);
    } else {
      showError("Profil introuvable pour démarrer une nouvelle conversation.");
    }
  };

  // Filter contacts for new chat: all profiles except current user and those already in recent conversations
  const availableContactsForNewChat = useMemo(() => {
    if (!currentUserProfile) return [];

    const contactsInRecentConversations = new Set(
      recentMessages.map(msg =>
        msg.sender_id === currentUserProfile.id ? msg.receiver_id : msg.sender_id
      )
    );

    return allProfiles.filter(profile =>
      profile.id !== currentUserProfile.id && // Exclude self
      !contactsInRecentConversations.has(profile.id) // Exclude contacts already in recent conversations
    );
  }, [allProfiles, currentUserProfile, recentMessages]);

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

  return (
    <div className="space-y-8 h-[calc(100vh-120px)] flex flex-col">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Messagerie
      </h1>
      <p className="text-lg text-muted-foreground">
        Communiquez avec les autres utilisateurs de la plateforme.
      </p>

      <div className="flex flex-col flex-grow md:flex-row md:gap-4">
        {/* Left Panel (Message List) */}
        <div className={cn(
          "flex flex-col",
          isMobile ? (selectedContact ? "hidden" : "flex-grow") : "w-full md:w-1/3 flex-shrink-0"
        )}>
          <div className="p-4 border-b border-border">
            <Label htmlFor="new-chat-select-desktop">Démarrer une nouvelle conversation</Label>
            <Select onValueChange={handleNewConversation}>
              <SelectTrigger id="new-chat-select-desktop">
                <SelectValue placeholder="Sélectionner un contact" />
              </SelectTrigger>
              <SelectContent>
                {availableContactsForNewChat.length === 0 ? (
                  <SelectItem value="no-contacts" disabled>Aucun nouveau contact disponible</SelectItem>
                ) : (
                  availableContactsForNewChat.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.first_name} {profile.last_name} (@{profile.username})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <MessageList
            recentMessages={recentMessages} // Pass recentMessages
            allProfiles={allProfiles} // Pass allProfiles
            onSelectContact={handleSelectContact}
            selectedContactId={selectedContact?.id || null}
            onUnreadCountChange={setUnreadMessageCount} // Update unread count in parent
          />
        </div>

        {/* Right Panel (Chat Interface) */}
        <div className={cn(
          "flex flex-col",
          isMobile ? (selectedContact ? "flex-grow" : "hidden") : "w-full md:w-2/3 flex-grow"
        )}>
          {isMobile && selectedContact && (
            <Button variant="outline" onClick={() => setSelectedContact(null)} className="mb-4 w-fit">
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour aux conversations
            </Button>
          )}
          {selectedContact ? (
            <ChatInterface
              contact={selectedContact}
              onMessageSent={fetchAllData} // Trigger re-fetch of all data
              initialCourseId={initialCourseContext.id}
              initialCourseTitle={initialCourseContext.title}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="h-12 w-12 mr-4 text-primary" />
              Sélectionnez une conversation {isMobile ? '' : 'à gauche'} ou démarrez-en une nouvelle.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;