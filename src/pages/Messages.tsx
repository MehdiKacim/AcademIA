import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, Search, Archive, Building2, LayoutList, Users } from "lucide-react"; // Import Users
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
import { cn } => '@/lib/utils';
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
    }<ctrl63>