import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, Search, Archive } from "lucide-react"; // Import Archive icon
import MessageList from "@/components/MessageList";
import ChatInterface from "@/components/ChatInterface";
import { Profile, Message, Establishment, Curriculum, Class } from '@/lib/dataModels'; // Import Message type
import { useRole } from '@/contexts/RoleContext';
import { getAllProfiles } from '@/lib/studentData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // Import Input component
import { showSuccess, showError } from '@/utils/toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRecentConversations, getUnreadMessageCount, getArchivedConversations, archiveConversation, unarchiveConversation } from "@/lib/messageData"; // Import messageData functions
import { supabase } from "@/integrations/supabase/client"; // Import supabase for realtime
import { cn } from '@/lib/utils'; // Import cn for conditional styling
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile
import { loadEstablishments, loadCurricula, loadClasses } from '@/lib/courseData'; // Import course data loaders

const Messages = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedContact, setSelectedContact] = useState<Profile | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [recentConversations, setRecentConversations] = useState<Message[]>([]); // Renamed from recentMessages
  const [archivedConversations, setArchivedConversations] = useState<Message[]>([]); // New state for archived messages
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [initialCourseContext, setInitialCourseContext] = useState<{ id?: string; title?: string }>({});
  const [showArchived, setShowArchived] = useState(false); // New state to toggle view

  // States for professional filters
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string>(""); // Initialisé à ""
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string>("");     // Initialisé à ""
  const [selectedClassId, setSelectedClassId] = useState<string>("");             // Initialisé à ""
  const [searchStudentQuery, setSearchStudentQuery] = useState(''); // For searching students in professional view

  const currentUserId = currentUserProfile?.id;

  const fetchAllData = async () => {
    console.log("[Messages] fetchAllData called.");
    if (!currentUserId) {
      console.log("[Messages] currentUserId is null, skipping fetchAllData.");
      return;
    }

    const profiles = await getAllProfiles();
    setAllProfiles(profiles.filter(p => p.id !== currentUserId)); // Exclude current user

    const recent = await getRecentConversations(currentUserId);
    setRecentConversations(recent);
    console.log("[Messages] Fetched recent conversations (after fetchAllData):", recent.map(m => ({ id: m.id, content: m.content, is_archived: m.is_archived })));

    const archived = await getArchivedConversations(currentUserId);
    setArchivedConversations(archived);
    console.log("[Messages] Fetched archived conversations (after fetchAllData):", archived.map(m => ({ id: m.id, content: m.content, is_archived: m.is_archived })));

    const totalUnread = await getUnreadMessageCount(currentUserId);
    setUnreadMessageCount(totalUnread);
    console.log("[Messages] Fetched unread message count (after fetchAllData):", totalUnread);

    if (currentRole === 'creator' || currentRole === 'tutor') {
      setEstablishments(await loadEstablishments());
      setCurricula(await loadCurricula());
      setClasses(await loadClasses());
    }
    console.log("[Messages] fetchAllData completed.");
  };

  useEffect(() => {
    fetchAllData();

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
            filter: `or(sender_id=eq.${currentUserId},receiver_id=eq.${currentUserId})`
          },
          (payload) => {
            console.log("[Messages] Realtime INSERT event received:", payload);
            fetchAllData(); // This should trigger re-render
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `or(sender_id=eq.${currentUserId},receiver_id=eq.${currentUserId})`
          },
          (payload) => {
            console.log("[Messages] Realtime UPDATE event received:", payload);
            // Check if the update is related to archiving/unarchiving
            const oldMessage = payload.old as Message;
            const newMessage = payload.new as Message;
            if (oldMessage && newMessage && oldMessage.is_archived !== newMessage.is_archived) {
              console.log(`[Messages] Archiving status changed for message ${newMessage.id}. Realtime listener triggered fetchAllData.`);
              fetchAllData(); // This should trigger re-render
            } else if (oldMessage && newMessage && oldMessage.is_read !== newMessage.is_read) {
              console.log(`[Messages] Read status changed for message ${newMessage.id}. Realtime listener triggered fetchAllData.`);
              fetchAllData(); // This should trigger re-render
            } else {
              console.log(`[Messages] Other update for message ${newMessage.id}. Realtime listener triggered fetchAllData.`);
              fetchAllData(); // This should trigger re-render for any relevant update
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        console.log("[Messages] Unsubscribing from realtime channel.");
        supabase.removeChannel(channel);
      }
    };
  }, [currentUserId, currentRole]); // Depend on currentUserId and currentRole

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
        // If a contact is selected from URL, ensure it's unarchived
        const isContactArchived = archivedConversations.some(msg => {
          const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
          return otherUserId === contactId;
        });
        if (isContactArchived && currentUserId) {
          console.log(`[Messages] Contact ${contact.first_name} selected via URL, was archived. Attempting to unarchive.`);
          unarchiveConversation(currentUserId, contactId).then(() => {
            fetchAllData(); // Re-fetch to update lists
          }).catch(err => showError(`Erreur lors du désarchivage: ${err.message}`));
        }
      }
    }
  }, [location.search, allProfiles, archivedConversations, currentUserId]); // Added archivedConversations to dependencies

  const handleSelectContact = (contact: Profile, courseId?: string, courseTitle?: string) => {
    console.log("[Messages] handleSelectContact called for:", contact.username);
    setSelectedContact(contact);
    setInitialCourseContext({ id: courseId, title: courseTitle });
    navigate(`/messages?contactId=${contact.id}${courseId ? `&courseId=${courseId}` : ''}${courseTitle ? `&courseTitle=${courseTitle}` : ''}`, { replace: true });

    // Implicitly unarchive if the conversation is currently archived
    if (currentUserId) {
      const isContactArchived = archivedConversations.some(msg => {
        const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        return otherUserId === contact.id;
      });
      if (isContactArchived) {
        console.log(`[Messages] Contact ${contact.first_name} selected, was archived. Attempting to unarchive.`);
        unarchiveConversation(currentUserId, contact.id).then(() => {
          fetchAllData(); // Re-fetch to update lists
          showSuccess(`Conversation avec ${contact.first_name} désarchivée.`);
        }).catch(err => showError(`Erreur lors du désarchivage: ${err.message}`));
      }
    }
  };

  const handleArchive = async (contactId: string) => {
    console.log("[Messages] handleArchive called for contactId:", contactId);
    if (!currentUserId) {
      console.error("[Messages] currentUserId is null, cannot archive.");
      return;
    }
    try {
      await archiveConversation(currentUserId, contactId);
      showSuccess("Conversation archivée !");
      setSelectedContact(null); // Deselect if current chat is archived
      await fetchAllData(); // Explicitly call fetchAllData to update the lists immediately
      console.log("[Messages] Archive successful. fetchAllData called directly.");
    } catch (error: any) {
      console.error("[Messages] Error during archiving:", error);
      showError(`Erreur lors de l'archivage: ${error.message}`);
    }
  };

  const handleUnarchive = async (contactId: string) => {
    console.log("[Messages] handleUnarchive called for contactId:", contactId);
    if (!currentUserId) {
      console.error("[Messages] currentUserId is null, cannot unarchive.");
      return;
    }
    try {
      await unarchiveConversation(currentUserId, contactId);
      showSuccess("Conversation désarchivée !");
      await fetchAllData(); // Explicitly call fetchAllData to update the lists immediately
      console.log("[Messages] Unarchive successful. fetchAllData called directly.");
    } catch (error: any) {
      console.error("[Messages] Error during unarchiving:", error);
      showError(`Erreur lors du désarchivage: ${error.message}`);
    }
  };

  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';
  const getCurriculumName = (id?: string) => curricula.find(c => c.id === id)?.name || 'N/A';
  const getClassName = (id?: string) => classes.find(c => c.id === id)?.name || 'N/A';

  // Filtered students for new chat (for professionals)
  const filteredStudentsForNewChat = useMemo(() => {
    if (!currentUserProfile || (currentRole !== 'creator' && currentRole !== 'tutor')) return [];

    let students = allProfiles.filter(p => p.role === 'student');

    if (selectedEstablishmentId && selectedEstablishmentId !== '') {
      const curriculaInEstablishment = curricula.filter(c => c.establishment_id === selectedEstablishmentId);
      const classIdsInEstablishment = new Set(classes.filter(cls => curriculaInEstablishment.some(cur => cur.id === cls.curriculum_id)).map(cls => cls.id));
      students = students.filter(s => s.class_id && classIdsInEstablishment.has(s.class_id));
    }

    if (selectedCurriculumId && selectedCurriculumId !== '') {
      const classesInCurriculum = classes.filter(cls => cls.curriculum_id === selectedCurriculumId);
      const classIdsInCurriculum = new Set(classesInCurriculum.map(cls => cls.id));
      students = students.filter(s => s.class_id && classIdsInCurriculum.has(s.class_id));
    }

    if (selectedClassId && selectedClassId !== '') {
      students = students.filter(s => s.class_id === selectedClassId);
    }

    if (searchStudentQuery.trim()) {
      const lowerCaseQuery = searchStudentQuery.toLowerCase();
      students = students.filter(s =>
        s.first_name?.toLowerCase().includes(lowerCaseQuery) ||
        s.last_name?.toLowerCase().includes(lowerCaseQuery) ||
        s.username?.toLowerCase().includes(lowerCaseQuery) ||
        s.email?.toLowerCase().includes(lowerCaseQuery)
      );
    }

    // Exclude students already in recent or archived conversations
    const contactsInAllConversations = new Set(
      [...recentConversations, ...archivedConversations].map(msg =>
        msg.sender_id === currentUserProfile.id ? msg.receiver_id : msg.sender_id
      )
    );
    students = students.filter(s => !contactsInAllConversations.has(s.id));

    return students;
  }, [allProfiles, currentUserProfile, currentRole, selectedEstablishmentId, selectedCurriculumId, selectedClassId, searchStudentQuery, establishments, curricula, classes, recentConversations, archivedConversations]);


  // Available contacts for new chat (for students)
  const availableContactsForStudentNewChat = useMemo(() => {
    if (!currentUserProfile || currentRole !== 'student') return [];

    const contactsInAllConversations = new Set(
      [...recentConversations, ...archivedConversations].map(msg =>
        msg.sender_id === currentUserProfile.id ? msg.receiver_id : msg.sender_id
      )
    );

    return allProfiles.filter(profile =>
      profile.id !== currentUserProfile.id && // Exclude self
      !contactsInAllConversations.has(profile.id) // Exclude contacts already in any conversation
    );
  }, [allProfiles, currentUserProfile, recentConversations, archivedConversations, currentRole]);


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
        {/* Left Panel (Message List & New Conversation) */}
        <div className={cn(
          "flex flex-col",
          isMobile ? (selectedContact ? "hidden" : "flex-grow") : "w-full md:w-1/3 flex-shrink-0"
        )}>
          {(currentRole === 'creator' || currentRole === 'tutor') && (
            <div className="p-4 border-b border-border space-y-4">
              <h3 className="text-lg font-semibold">Démarrer une nouvelle conversation avec un élève</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="select-establishment">Filtrer par Établissement</Label>
                  <Select value={selectedEstablishmentId} onValueChange={(value) => {
                    setSelectedEstablishmentId(value === "all" ? "" : value);
                    setSelectedCurriculumId("");
                    setSelectedClassId("");
                  }}>
                    <SelectTrigger id="select-establishment">
                      <SelectValue placeholder="Tous les établissements" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les établissements</SelectItem>
                      {establishments.map(est => (
                        <SelectItem key={est.id} value={est.id}>{est.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="select-curriculum">Filtrer par Cursus</Label>
                  <Select value={selectedCurriculumId} onValueChange={(value) => {
                    setSelectedCurriculumId(value === "all" ? "" : value);
                    setSelectedClassId("");
                  }}>
                    <SelectTrigger id="select-curriculum">
                      <SelectValue placeholder="Tous les cursus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les cursus</SelectItem>
                      {curricula
                        .filter(cur => !selectedEstablishmentId || selectedEstablishmentId === '' || cur.establishment_id === selectedEstablishmentId)
                        .map(cur => (
                          <SelectItem key={cur.id} value={cur.id}>
                            {cur.name} ({getEstablishmentName(cur.establishment_id)})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="select-class">Filtrer par Classe</Label>
                  <Select value={selectedClassId} onValueChange={(value) => setSelectedClassId(value === "all" ? "" : value)}>
                    <SelectTrigger id="select-class">
                      <SelectValue placeholder="Toutes les classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les classes</SelectItem>
                      {classes
                        .filter(cls => !selectedCurriculumId || selectedCurriculumId === '' || cls.curriculum_id === selectedCurriculumId)
                        .map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} ({getCurriculumName(cls.curriculum_id)})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un élève par nom ou pseudo..."
                    className="pl-10"
                    value={searchStudentQuery}
                    onChange={(e) => setSearchStudentQuery(e.target.value)}
                  />
                </div>
                {filteredStudentsForNewChat.length > 0 && (
                  <div>
                    <Label htmlFor="new-chat-select-professional">Sélectionner un élève</Label>
                    <Select onValueChange={(value) => {
                      const contact = allProfiles.find(p => p.id === value);
                      if (contact) handleSelectContact(contact);
                      else showError("Contact non trouvé.");
                    }}>
                      <SelectTrigger id="new-chat-select-professional">
                        <SelectValue placeholder="Sélectionner un élève" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredStudentsForNewChat.map(profile => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.first_name} {profile.last_name} (@{profile.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {searchStudentQuery.trim() !== '' && filteredStudentsForNewChat.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center">Aucun élève trouvé avec ces critères.</p>
                )}
              </div>
            </div>
          )}

          {currentRole === 'student' && (
            <div className="p-4 border-b border-border">
              <Label htmlFor="new-chat-select-student">Démarrer une nouvelle conversation</Label>
              <Select onValueChange={(value) => {
                const contact = allProfiles.find(p => p.id === value);
                if (contact) handleSelectContact(contact);
                else showError("Contact non trouvé.");
              }}>
                <SelectTrigger id="new-chat-select-student">
                  <SelectValue placeholder="Sélectionner un contact" />
                </SelectTrigger>
                <SelectContent>
                  {availableContactsForStudentNewChat.length === 0 ? (
                    <SelectItem value="no-contacts" disabled>Aucun nouveau contact disponible</SelectItem>
                  ) : (
                    availableContactsForStudentNewChat.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.first_name} {profile.last_name} (@{profile.username})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-center gap-2 p-4 border-b border-border">
            <Button
              variant={!showArchived ? "default" : "outline"}
              onClick={() => setShowArchived(false)}
              className="flex-1"
            >
              <MessageSquare className="h-4 w-4 mr-2" /> Récentes
            </Button>
            <Button
              variant={showArchived ? "default" : "outline"}
              onClick={() => setShowArchived(true)}
              className="flex-1"
            >
              <Archive className="h-4 w-4 mr-2" /> Archivées
            </Button>
          </div>

          <MessageList
            recentMessages={showArchived ? archivedConversations : recentConversations}
            allProfiles={allProfiles}
            onSelectContact={handleSelectContact}
            selectedContactId={selectedContact?.id || null}
            onUnreadCountChange={setUnreadMessageCount}
            onArchiveConversation={handleArchive}
            onUnarchiveConversation={handleUnarchive}
            isArchivedView={showArchived}
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
              onMessageSent={fetchAllData}
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