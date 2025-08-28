import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, Search, Archive, Building2 } from "lucide-react"; // Import Building2
import MessageList from "@/components/MessageList";
import ChatInterface from "@/components/ChatInterface";
import { Profile, Message, Curriculum, Class, StudentClassEnrollment, Establishment } from '@/lib/dataModels'; // Import Establishment
import { useRole } from '@/contexts/RoleContext';
import { getAllProfiles, getAllStudentClassEnrollments } from '@/lib/studentData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from '@/utils/toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRecentConversations, getUnreadMessageCount, getArchivedConversations, archiveConversation, unarchiveConversation } from "@/lib/messageData";
import { supabase } from "@/integrations/supabase/client";
import { cn } from '@/lib/utils';
import { useIsMobile } from "@/hooks/use-mobile";
import { loadCurricula, loadClasses, loadEstablishments, getEstablishmentName, getCurriculumName, getClassName } from '@/lib/courseData'; // Import getEstablishmentName, getCurriculumName, getClassName
import SimpleItemSelector from '@/components/ui/SimpleItemSelector'; // Import SimpleItemSelector
import LoadingSpinner from '@/components/LoadingSpinner'; // Import LoadingSpinner

// Helper to get the current school year
const getCurrentSchoolYear = () => {
  const currentMonth = new Date().getMonth(); // 0-indexed (0 = Jan, 8 = Sep, 11 = Dec)
  const currentYear = new Date().getFullYear();
  if (currentMonth >= 8) { // September to December
    return `${currentYear}-${currentYear + 1}`;
  } else { // January to August
    return `${currentYear - 1}-${currentYear}`;
  }
};

const iconMap: { [key: string]: React.ElementType } = {
  Building2, LayoutList, Users, MessageSquare, Info, Search
};

const Messages = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedContact, setSelectedContact] = useState<Profile | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [recentConversations, setRecentConversations] = useState<Message[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<Message[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [initialCourseContext, setInitialCourseContext] = useState<{ id?: string; title?: string }>({});

  const [showArchived, setShowArchived] = useState(false);

  const [establishments, setEstablishments] = useState<Establishment[]>([]); // New state for establishments
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [allStudentClassEnrollments, setAllStudentClassEnrollments] = useState<StudentClassEnrollment[]>([]);

  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string | 'all'>('all'); // New state for establishment filter
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

  const [newChatEstablishmentSearchQuery, setNewChatEstablishmentSearchQuery] = useState('');
  const [newChatCurriculumSearchQuery, setNewChatCurriculumSearchQuery] = useState('');
  const [newChatClassSearchQuery, setNewChatClassSearchQuery] = useState('');
  const [newChatContactSearchQuery, setNewChatContactSearchQuery] = useState('');


  const currentUserId = currentUserProfile?.id;
  const currentSchoolYear = getCurrentSchoolYear();

  const fetchAllData = async () => {
    if (!currentUserId) {
      setIsLoadingProfiles(false);
      return;
    }

    setIsLoadingProfiles(true);
    try {
      const profiles = await getAllProfiles();
      setAllProfiles(profiles);
      
      const recent = await getRecentConversations(currentUserId);
      setRecentConversations(recent);

      const archived = await getArchivedConversations(currentUserId);
      setArchivedConversations(archived);

      const totalUnread = await getUnreadMessageCount(currentUserId);
      setUnreadMessageCount(totalUnread);

      setEstablishments(await loadEstablishments()); // Load establishments
      setCurricula(await loadCurricula());
      setClasses(await loadClasses());
      setAllStudentClassEnrollments(await getAllStudentClassEnrollments());
    } catch (error: any) {
      console.error("Error fetching all data for Messages:", error);
      showError(`Erreur lors du chargement des données de messagerie: ${error.message}`);
    } finally {
      setIsLoadingProfiles(false);
    }
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
            fetchAllData();
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
  }, [currentUserId, currentRole]);

  useEffect(() => {
    if (allProfiles.length > 0) {
      const params = new URLSearchParams(location.search);
      const contactId = params.get('contactId');
      const courseId = params.get('courseId');
      const courseTitle = params.get('courseTitle');

      if (contactId) {
        const contact = allProfiles.find(p => p.id === contactId);
        if (contact) {
          setSelectedContact(contact);
          if (courseId) setInitialCourseContext({ id: courseId, title: courseTitle || `Cours ID: ${courseId}` });
          const isContactArchived = archivedConversations.some(msg => {
            const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
            return otherUserId === contactId;
          });
          if (isContactArchived && currentUserId) {
            unarchiveConversation(currentUserId, contactId).then(() => {
              fetchAllData();
              showSuccess(`Conversation avec ${contact.first_name} désarchivée.`);
            }).catch(err => showError(`Erreur lors du désarchivage: ${err.message}`));
          }
        }
      }
    }
  }, [location.search, allProfiles, archivedConversations, currentUserId]);

  const handleSelectContact = (contact: Profile, courseId?: string, courseTitle?: string) => {
    setSelectedContact(contact);
    setInitialCourseContext({ id: courseId, title: courseTitle });
    navigate(`/messages?contactId=${contact.id}${courseId ? `&courseId=${courseId}` : ''}${courseTitle ? `&courseTitle=${courseTitle}` : ''}`, { replace: true });

    if (currentUserId) {
      const isContactArchived = archivedConversations.some(msg => {
        const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        return otherUserId === contact.id;
      });
      if (isContactArchived) {
        unarchiveConversation(currentUserId, contact.id).then(() => {
          fetchAllData();
          showSuccess(`Conversation avec ${contact.first_name} désarchivée.`);
        }).catch(err => showError(`Erreur lors du désarchivage: ${err.message}`));
      }
    }
  };

  const handleArchive = async (contactId: string) => {
    if (!currentUserId) {
      console.error("[Messages] currentUserId is null, cannot archive.");
      return;
    }
    try {
      await archiveConversation(currentUserId, contactId);
      showSuccess("Conversation archivée !");
      setSelectedContact(null);
      await fetchAllData();
    } catch (error: any) {
      console.error("[Messages] Error during archiving:", error);
      showError(`Erreur lors de l'archivage: ${error.message}`);
    }
  };

  const handleUnarchive = async (contactId: string) => {
    if (!currentUserId) {
      console.error("[Messages] currentUserId is null, cannot unarchive.");
      return;
    }
    try {
      await unarchiveConversation(currentUserId, contactId);
      showSuccess("Conversation désarchivée !");
      await fetchAllData();
    } catch (error: any) {
      console.error("[Messages] Error during unarchiving:", error);
      showError(`Erreur lors du désarchivage: ${err.message}`);
    }
  };

  const availableContactsForNewChat = useMemo(() => {
    if (!currentUserProfile) return [];

    let filteredContacts: Profile[] = [];
    let potentialContacts = allProfiles.filter(p => p.id !== currentUserProfile.id);

    // Apply establishment filter first
    if (selectedEstablishmentId !== 'all' && currentRole === 'administrator') {
      potentialContacts = potentialContacts.filter(p => p.establishment_id === selectedEstablishmentId || (p.role === 'administrator' && !p.establishment_id));
    } else if (currentRole !== 'administrator' && currentUserProfile?.establishment_id) {
      potentialContacts = potentialContacts.filter(p => p.establishment_id === currentUserProfile.establishment_id || (p.role === 'administrator' && !p.establishment_id));
    }

    if (currentRole === 'student') {
      const studentEnrollments = allStudentClassEnrollments.filter(e => e.student_id === currentUserProfile.id && e.school_year_name === currentSchoolYear);
      const studentClassIds = studentEnrollments.map(e => e.class_id);

      // Add professeurs from student's classes
      const professeursInClasses = new Set<string>();
      classes.filter(cls => studentClassIds.includes(cls.id) && cls.school_year_name === currentSchoolYear).forEach(cls => {
        cls.creator_ids.forEach(creatorId => professeursInClasses.add(creatorId));
      });
      filteredContacts.push(...potentialContacts.filter(p => p.role === 'professeur' && professeursInClasses.has(p.id)));

      // Removed directors/deputy directors from student's establishment
    } else if (currentRole === 'professeur') {
      let potentialContactsForProf = allProfiles.filter(p => p.id !== currentUserProfile.id);

      const managedClassIds = classes.filter(cls => cls.creator_ids.includes(currentUserProfile.id) && cls.school_year_name === currentSchoolYear).map(cls => cls.id);
      const studentIdsInManagedClasses = new Set(allStudentClassEnrollments.filter(e => managedClassIds.includes(e.class_id) && e.school_year_name === currentSchoolYear).map(e => e.student_id));
      
      // Add students from managed classes
      filteredContacts.push(...potentialContactsForProf.filter(p => p.role === 'student' && studentIdsInManagedClasses.has(p.id)));

      // Add other professors, tutors, directors, and deputy directors
      filteredContacts.push(...potentialContactsForProf.filter(p => 
        (p.role === 'director' || p.role === 'deputy_director' || p.role === 'professeur' || p.role === 'tutor')
      ));
    } else if (currentRole === 'tutor') {
      let potentialContactsForTutor = allProfiles.filter(p => p.id !== currentUserProfile.id);

      // Add students for the current school year
      const studentIdsInEstablishment = new Set(allStudentClassEnrollments.filter(e => 
        classes.some(cls => cls.id === e.class_id && cls.school_year_name === currentSchoolYear)
      ).map(e => e.student_id));
      filteredContacts.push(...potentialContactsForTutor.filter(p => p.role === 'student' && studentIdsInEstablishment.has(p.id)));

      // Add directors/deputy directors
      filteredContacts.push(...potentialContactsForTutor.filter(p => 
        (p.role === 'director' || p.role === 'deputy_director')
      ));
    } else if (currentRole === 'director' || currentRole === 'deputy_director') {
      // Add all users
      filteredContacts.push(...potentialContacts);
    } else if (currentRole === 'administrator') {
      // Add all users (except self)
      filteredContacts.push(...potentialContacts);
    }

    // Apply search query if any
    let finalFilteredContacts = filteredContacts;
    if (searchStudentQuery.trim()) {
      const lowerCaseQuery = searchStudentQuery.toLowerCase();
      finalFilteredContacts = finalFilteredContacts.filter(p =>
        p.first_name?.toLowerCase().includes(lowerCaseQuery) ||
        p.last_name?.toLowerCase().includes(lowerCaseQuery) ||
        p.username?.toLowerCase().includes(lowerCaseQuery.replace('@', '')) ||
        p.email?.toLowerCase().includes(lowerCaseQuery)
      );
    }

    // Remove duplicates and sort
    const uniqueContacts = Array.from(new Map(finalFilteredContacts.map(item => [item.id, item])).values());
    return uniqueContacts.sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));
  }, [allProfiles, currentUserProfile, currentRole, curricula, classes, allStudentClassEnrollments, searchStudentQuery, currentSchoolYear, selectedEstablishmentId]);

  const establishmentsOptions = establishments.filter(est => 
    currentRole === 'administrator' || est.id === currentUserProfile?.establishment_id
  ).map(est => ({
    id: est.id,
    label: est.name,
    icon_name: 'Building2',
    description: est.address,
  }));

  const curriculaOptions = curricula.filter(cur => 
    !selectedEstablishmentId || selectedEstablishmentId === 'all' || cur.establishment_id === selectedEstablishmentId
  ).map(cur => ({
    id: cur.id,
    label: cur.name,
    icon_name: 'LayoutList',
    description: cur.description,
  }));

  const classesOptions = classes.filter(cls => 
    (!selectedCurriculumId || selectedCurriculumId === '' || cls.curriculum_id === selectedCurriculumId) &&
    (!selectedEstablishmentId || selectedEstablishmentId === 'all' || cls.establishment_id === selectedEstablishmentId)
  ).map(cls => ({
    id: cls.id,
    label: cls.name,
    icon_name: 'Users',
    description: `${getCurriculumName(cls.curriculum_id, curricula)} - ${getClassName(cls.school_year_id)} (${getEstablishmentName(cls.establishment_id)})`,
  }));


  if (isLoadingUser || isLoadingProfiles) {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 h-[calc(100vh-120px)] flex flex-col"> {/* Added responsive padding and max-width */}
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
          {(currentRole === 'professeur' || currentRole === 'tutor' || currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'administrator') && (
            <div className="p-4 border-b border-border space-y-4 rounded-android-tile"> {/* Apply rounded-android-tile */}
              <h3 className="text-lg font-semibold">Démarrer une nouvelle conversation</h3>
              <div className="grid grid-cols-1 gap-4">
                {/* Filters for Professeur/Tutor/Director/Deputy Director/Admin */}
                {(currentRole === 'administrator' || currentUserProfile?.establishment_id) && (
                  <div>
                    <Label htmlFor="select-establishment">Filtrer par Établissement</Label>
                    <SimpleItemSelector
                      id="select-establishment"
                      options={[{ id: 'all', label: 'Tous les établissements', icon_name: 'Building2' }, ...establishmentsOptions]}
                      value={selectedEstablishmentId}
                      onValueChange={(value) => {
                        setSelectedEstablishmentId(value);
                        setSelectedCurriculumId("");
                        setSelectedClassId("");
                      }}
                      searchQuery={newChatEstablishmentSearchQuery}
                      onSearchQueryChange={setNewChatEstablishmentSearchQuery}
                      placeholder="Tous les établissements"
                      emptyMessage="Aucun établissement trouvé."
                      iconMap={iconMap}
                    />
                  </div>
                )}
                {(currentRole === 'professeur' || currentRole === 'tutor' || currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'administrator') && (
                  <>
                    <div>
                      <Label htmlFor="select-curriculum">Filtrer par Cursus</Label>
                      <SimpleItemSelector
                        id="select-curriculum"
                        options={[{ id: 'all', label: 'Tous les cursus', icon_name: 'LayoutList' }, ...curriculaOptions]}
                        value={selectedCurriculumId}
                        onValueChange={(value) => {
                          setSelectedCurriculumId(value === "all" ? "" : value);
                          setSelectedClassId("");
                        }}
                        searchQuery={newChatCurriculumSearchQuery}
                        onSearchQueryChange={setNewChatCurriculumSearchQuery}
                        placeholder="Tous les cursus"
                        emptyMessage="Aucun cursus trouvé."
                        iconMap={iconMap}
                      />
                    </div>
                    <div>
                      <Label htmlFor="select-class">Filtrer par Classe</Label>
                      <SimpleItemSelector
                        id="select-class"
                        options={[{ id: 'all', label: 'Toutes les classes', icon_name: 'Users' }, ...classesOptions]}
                        value={selectedClassId}
                        onValueChange={(value) => setSelectedClassId(value === "all" ? "" : value)}
                        searchQuery={newChatClassSearchQuery}
                        onSearchQueryChange={setNewChatClassSearchQuery}
                        placeholder="Toutes les classes"
                        emptyMessage="Aucune classe trouvée."
                        iconMap={iconMap}
                      />
                    </div>
                  </>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un contact par nom ou pseudo..."
                    className="pl-10"
                    value={searchStudentQuery}
                    onChange={(e) => setSearchStudentQuery(e.target.value)}
                  />
                </div>
                {availableContactsForNewChat.length > 0 && (
                  <div>
                    <Label htmlFor="new-chat-select-contact">Sélectionner un contact</Label>
                    <SimpleItemSelector
                      id="new-chat-select-contact"
                      options={availableContactsForNewChat.map(profile => ({
                        id: profile.id,
                        label: `${profile.first_name} ${profile.last_name} (@${profile.username})`,
                        icon_name: 'User',
                        description: `${profile.role === 'professeur' ? 'Professeur' : profile.role === 'student' ? 'Élève' : profile.role === 'tutor' ? 'Tuteur' : profile.role === 'director' ? 'Directeur' : profile.role === 'deputy_director' ? 'Directeur Adjoint' : 'Administrateur'} (${getEstablishmentName(profile.establishment_id, establishments)})`,
                      }))}
                      value={selectedContact?.id || null}
                      onValueChange={(value) => {
                        const contact = allProfiles.find(p => p.id === value);
                        if (contact) handleSelectContact(contact);
                        else showError("Contact non trouvé.");
                      }}
                      searchQuery={newChatContactSearchQuery}
                      onSearchQueryChange={setNewChatContactSearchQuery}
                      placeholder="Sélectionner un contact"
                      emptyMessage="Aucun contact trouvé."
                      iconMap={iconMap}
                    />
                  </div>
                )}
                {searchStudentQuery.trim() !== '' && availableContactsForNewChat.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center">Aucun contact trouvé avec ces critères.</p>
                )}
              </div>
            </div>
          )}

          {currentRole === 'student' && (
            <div className="p-4 border-b border-border space-y-4 rounded-android-tile"> {/* Apply rounded-android-tile */}
              <h3 className="text-lg font-semibold">Démarrer une nouvelle conversation</h3>
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un contact par nom ou pseudo..."
                    className="pl-10"
                    value={searchStudentQuery}
                    onChange={(e) => setSearchStudentQuery(e.target.value)}
                  />
                </div>
              <Label htmlFor="new-chat-select-student">Sélectionner un contact</Label>
              <SimpleItemSelector
                id="new-chat-select-student"
                options={availableContactsForNewChat.map(profile => ({
                  id: profile.id,
                  label: `${profile.first_name} ${profile.last_name} (@${profile.username})`,
                  icon_name: 'User',
                  description: `${profile.role === 'professeur' ? 'Professeur' : profile.role === 'student' ? 'Élève' : profile.role === 'tutor' ? 'Tuteur' : profile.role === 'director' ? 'Directeur' : profile.role === 'deputy_director' ? 'Directeur Adjoint' : 'Administrateur'} (${getEstablishmentName(profile.establishment_id, establishments)})`,
                }))}
                value={selectedContact?.id || null}
                onValueChange={(value) => {
                  const contact = allProfiles.find(p => p.id === value);
                  if (contact) handleSelectContact(contact);
                  else showError("Contact non trouvé.");
                }}
                searchQuery={newChatContactSearchQuery}
                onSearchQueryChange={setNewChatContactSearchQuery}
                placeholder="Sélectionner un contact"
                emptyMessage="Aucun contact trouvé."
                iconMap={iconMap}
              />
              {searchStudentQuery.trim() !== '' && availableContactsForNewChat.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center">Aucun contact trouvé avec ces critères.</p>
                )}
            </div>
          )}

          <div className="flex justify-center gap-2 p-4 border-b border-border">
            <Button
              variant={!showArchived ? "default" : "outline"}
              onClick={() => setShowArchived(false)}
              className="flex-1 rounded-android-tile" // Apply rounded-android-tile
            >
              <MessageSquare className="h-4 w-4 mr-2" /> Récentes
            </Button>
            <Button
              variant={showArchived ? "default" : "outline"}
              onClick={() => setShowArchived(true)}
              className="flex-1 rounded-android-tile" // Apply rounded-android-tile
            >
              <Archive className="h-4 w-4 mr-2" /> Archivées
            </Button>
          </div>

          {allProfiles.length > 0 && (
            <MessageList
              key={`${showArchived}-${recentConversations.length}-${archivedConversations.length}-${allProfiles.length}`}
              recentMessages={showArchived ? archivedConversations : recentConversations}
              allProfiles={allProfiles}
              onSelectContact={handleSelectContact}
              selectedContactId={selectedContact?.id || null}
              onUnreadCountChange={setUnreadMessageCount}
              onArchiveConversation={handleArchive}
              onUnarchiveConversation={handleUnarchive}
              isArchivedView={showArchived}
            />
          )}
        </div>

        {/* Right Panel (Chat Interface) */}
        <div className={cn(
          "flex flex-col",
          isMobile ? (selectedContact ? "flex-grow" : "hidden") : "w-full md:w-2/3 flex-grow"
        )}>
          {isMobile && selectedContact && (
            <Button variant="outline" onClick={() => setSelectedContact(null)} className="mb-4 w-fit rounded-android-tile"> {/* Apply rounded-android-tile */}
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