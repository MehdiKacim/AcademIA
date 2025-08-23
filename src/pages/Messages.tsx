import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, Search, Archive } from "lucide-react";
import MessageList from "@/components/MessageList";
import ChatInterface from "@/components/ChatInterface";
import { Profile, Message, Establishment, Curriculum, Class, StudentClassEnrollment } from '@/lib/dataModels';
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
import { loadEstablishments, loadCurricula, loadClasses } from '@/lib/courseData';

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

  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [allStudentClassEnrollments, setAllStudentClassEnrollments] = useState<StudentClassEnrollment[]>([]);

  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string>("");
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

  const currentUserId = currentUserProfile?.id;
  const currentSchoolYear = getCurrentSchoolYear();

  const fetchAllData = async () => {
    if (!currentUserId) {
      setIsLoadingProfiles(false);
      return;
    }

    setIsLoadingProfiles(true);
    const profiles = await getAllProfiles();
    setAllProfiles(profiles);
    
    const recent = await getRecentConversations(currentUserId);
    setRecentConversations(recent);

    const archived = await getArchivedConversations(currentUserId);
    setArchivedConversations(archived);

    const totalUnread = await getUnreadMessageCount(currentUserId);
    setUnreadMessageCount(totalUnread);

    setEstablishments(await loadEstablishments());
    setCurricula(await loadCurricula());
    setClasses(await loadClasses());
    setAllStudentClassEnrollments(await getAllStudentClassEnrollments());
    setIsLoadingProfiles(false);
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

  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';
  const getCurriculumName = (id?: string) => curricula.find(c => c.id === id)?.name || 'N/A';
  const getClassName = (id?: string) => classes.find(c => c.id === id)?.name || 'N/A';

  const availableContactsForNewChat = useMemo(() => {
    if (!currentUserProfile) return [];

    const contactsInAllConversations = new Set(
      [...recentConversations, ...archivedConversations].map(msg =>
        msg.sender_id === currentUserProfile.id ? msg.receiver_id : msg.sender_id
      )
    );

    let filteredContacts: Profile[] = [];
    let potentialContacts = allProfiles.filter(p => p.id !== currentUserProfile.id);

    if (currentRole === 'student') {
      console.log("DEBUG (Student): currentUserProfile.id:", currentUserProfile.id);
      console.log("DEBUG (Student): currentSchoolYear:", currentSchoolYear);
      console.log("DEBUG (Student): currentUserProfile.establishment_id:", currentUserProfile.establishment_id);

      const studentEnrollments = allStudentClassEnrollments.filter(e => e.student_id === currentUserProfile.id && e.enrollment_year === currentSchoolYear);
      const studentClassIds = studentEnrollments.map(e => e.class_id);
      console.log("DEBUG (Student): Student's Class IDs for current school year:", studentClassIds);

      // Add professeurs from student's classes
      const professeursInClasses = new Set<string>();
      classes.filter(cls => studentClassIds.includes(cls.id)).forEach(cls => {
        cls.creator_ids.forEach(creatorId => professeursInClasses.add(creatorId));
      });
      filteredContacts.push(...potentialContacts.filter(p => p.role === 'professeur' && professeursInClasses.has(p.id)));
      console.log("DEBUG (Student): Professeurs from student's classes added:", filteredContacts.filter(p => p.role === 'professeur').map(p => p.username));

      // Add directors/deputy directors from student's establishment
      if (currentUserProfile.establishment_id) {
        filteredContacts.push(...potentialContacts.filter(p => 
          (p.role === 'director' || p.role === 'deputy_director') && p.establishment_id === currentUserProfile.establishment_id
        ));
        console.log("DEBUG (Student): Directors/Deputy Directors from student's establishment added:", filteredContacts.filter(p => p.role === 'director' || p.role === 'deputy_director').map(p => p.username));
      }
    } else if (currentRole === 'professeur') {
        console.log("DEBUG (Professeur): currentUserProfile.id:", currentUserProfile.id);
        console.log("DEBUG (Professeur): currentSchoolYear:", currentSchoolYear);
        console.log("DEBUG (Professeur): currentUserProfile.establishment_id:", currentUserProfile.establishment_id);

        const managedClassIds = classes.filter(cls => {
            const isCreator = cls.creator_ids.includes(currentUserProfile.id);
            const isCurrentYear = cls.school_year === currentSchoolYear;
            console.log(`DEBUG (Professeur): Class ${cls.name} (ID: ${cls.id}) - Creator: ${isCreator}, Year: ${isCurrentYear}`);
            return isCreator && isCurrentYear;
        }).map(cls => cls.id);
        console.log("DEBUG (Professeur): Managed Class IDs for current school year:", managedClassIds);

        const studentIdsInManagedClasses = new Set(allStudentClassEnrollments.filter(e => {
            const isInManagedClass = managedClassIds.includes(e.class_id);
            const isCurrentYearEnrollment = e.enrollment_year === currentSchoolYear;
            console.log(`DEBUG (Professeur): Enrollment (Student: ${e.student_id}, Class: ${e.class_id}, Year: ${e.enrollment_year}) - In Managed Class: ${isInManagedClass}, Current Year Enrollment: ${isCurrentYearEnrollment}`);
            return isInManagedClass && isCurrentYearEnrollment;
        }).map(e => e.student_id));
        console.log("DEBUG (Professeur): Student IDs in Managed Classes for current school year:", Array.from(studentIdsInManagedClasses));
        
        // Add students from managed classes
        filteredContacts.push(...potentialContacts.filter(p => p.role === 'student' && studentIdsInManagedClasses.has(p.id)));
        console.log("DEBUG (Professeur): Students from managed classes added:", filteredContacts.filter(p => p.role === 'student').map(p => p.username));

        // Add directors/deputy directors from professor's establishment
        if (currentUserProfile.establishment_id) {
          filteredContacts.push(...potentialContacts.filter(p => 
            (p.role === 'director' || p.role === 'deputy_director') && p.establishment_id === currentUserProfile.establishment_id
          ));
          console.log("DEBUG (Professeur): Directors/Deputy Directors from establishment added:", filteredContacts.filter(p => p.role === 'director' || p.role === 'deputy_director').map(p => p.username));
        }
    } else if (currentRole === 'tutor') {
        console.log("DEBUG (Tutor): currentUserProfile.id:", currentUserProfile.id);
        console.log("DEBUG (Tutor): currentSchoolYear:", currentSchoolYear);
        console.log("DEBUG (Tutor): currentUserProfile.establishment_id:", currentUserProfile.establishment_id);

        // Add students from tutor's establishment
        if (currentUserProfile.establishment_id) {
          const studentIdsInEstablishment = new Set(allStudentClassEnrollments.filter(e => 
            classes.some(cls => cls.id === e.class_id && cls.establishment_id === currentUserProfile.establishment_id && cls.school_year === currentSchoolYear)
          ).map(e => e.student_id));
          filteredContacts.push(...potentialContacts.filter(p => p.role === 'student' && studentIdsInEstablishment.has(p.id)));
          console.log("DEBUG (Tutor): Students from establishment added:", filteredContacts.filter(p => p.role === 'student').map(p => p.username));

          // Add directors/deputy directors from tutor's establishment
          filteredContacts.push(...potentialContacts.filter(p => 
            (p.role === 'director' || p.role === 'deputy_director') && p.establishment_id === currentUserProfile.establishment_id
          ));
          console.log("DEBUG (Tutor): Directors/Deputy Directors from establishment added:", filteredContacts.filter(p => p.role === 'director' || p.role === 'deputy_director').map(p => p.username));
        }
    } else if (currentRole === 'director' || currentRole === 'deputy_director') {
        console.log("DEBUG (Director/Deputy Director): currentUserProfile.id:", currentUserProfile.id);
        console.log("DEBUG (Director/Deputy Director): currentUserProfile.establishment_id:", currentUserProfile.establishment_id);

        // Add all users from director's establishment
        if (currentUserProfile.establishment_id) {
          filteredContacts.push(...potentialContacts.filter(p => p.establishment_id === currentUserProfile.establishment_id));
          console.log("DEBUG (Director/Deputy Director): All users from establishment added:", filteredContacts.map(p => p.username));
        }
    } else if (currentRole === 'administrator') {
        console.log("DEBUG (Administrator): currentUserProfile.id:", currentUserProfile.id);
        // Add all users (except self)
        filteredContacts.push(...potentialContacts);
        console.log("DEBUG (Administrator): All potential contacts added:", filteredContacts.map(p => p.username));
    }

    // Apply search query if any
    let finalFilteredContacts = filteredContacts;
    if (searchStudentQuery.trim()) {
      const lowerCaseQuery = searchStudentQuery.toLowerCase();
      finalFilteredContacts = finalFilteredContacts.filter(p =>
        p.first_name?.toLowerCase().includes(lowerCaseQuery) ||
        p.last_name?.toLowerCase().includes(lowerCaseQuery) ||
        p.username?.toLowerCase().includes(lowerCaseQuery) ||
        p.email?.toLowerCase().includes(lowerCaseQuery)
      );
    }
    console.log("DEBUG: Contacts after search query filter:", finalFilteredContacts.map(p => p.username));

    // Filter out contacts already in existing conversations
    finalFilteredContacts = finalFilteredContacts.filter(p => !contactsInAllConversations.has(p.id));
    console.log("DEBUG: Contacts after filtering out existing conversations:", finalFilteredContacts.map(p => p.username));

    // Remove duplicates and sort
    const uniqueContacts = Array.from(new Map(finalFilteredContacts.map(item => [item.id, item])).values());
    console.log("DEBUG: Unique contacts before sorting:", uniqueContacts.map(p => p.username));
    return uniqueContacts.sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));
  }, [allProfiles, currentUserProfile, currentRole, recentConversations, archivedConversations, establishments, curricula, classes, allStudentClassEnrollments, searchStudentQuery, currentSchoolYear]);


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
          {(currentRole === 'professeur' || currentRole === 'tutor' || currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'administrator') && (
            <div className="p-4 border-b border-border space-y-4">
              <h3 className="text-lg font-semibold">Démarrer une nouvelle conversation</h3>
              <div className="grid grid-cols-1 gap-4">
                {/* Filters for Professeur/Tutor/Director/Deputy Director/Admin */}
                {(currentRole === 'professeur' || currentRole === 'tutor') && (
                  <>
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
                    <Select onValueChange={(value) => {
                      const contact = allProfiles.find(p => p.id === value);
                      if (contact) handleSelectContact(contact);
                      else showError("Contact non trouvé.");
                    }}>
                      <SelectTrigger id="new-chat-select-contact">
                        <SelectValue placeholder="Sélectionner un contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableContactsForNewChat.map(profile => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.first_name} {profile.last_name} (@{profile.username}) - {profile.role === 'professeur' ? 'Professeur' : profile.role === 'student' ? 'Élève' : profile.role === 'tutor' ? 'Tuteur' : profile.role === 'director' ? 'Directeur' : profile.role === 'deputy_director' ? 'Directeur Adjoint' : 'Administrateur'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {searchStudentQuery.trim() !== '' && availableContactsForNewChat.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center">Aucun contact trouvé avec ces critères.</p>
                )}
              </div>
            </div>
          )}

          {currentRole === 'student' && (
            <div className="p-4 border-b border-border space-y-4">
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
              <Select onValueChange={(value) => {
                const contact = allProfiles.find(p => p.id === value);
                if (contact) handleSelectContact(contact);
                else showError("Contact non trouvé.");
              }}>
                <SelectTrigger id="new-chat-select-student">
                  <SelectValue placeholder="Sélectionner un contact" />
                </SelectTrigger>
                <SelectContent>
                  {availableContactsForNewChat.length === 0 ? (
                    <SelectItem value="no-contacts" disabled>Aucun nouveau contact disponible</SelectItem>
                  ) : (
                    availableContactsForNewChat.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.first_name} {profile.last_name} (@{profile.username}) - {profile.role === 'professeur' ? 'Professeur' : profile.role === 'student' ? 'Élève' : profile.role === 'tutor' ? 'Tuteur' : profile.role === 'director' ? 'Directeur' : profile.role === 'deputy_director' ? 'Directeur Adjoint' : 'Administrateur'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {searchStudentQuery.trim() !== '' && availableContactsForNewChat.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center">Aucun contact trouvé avec ces critères.</p>
                )}
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