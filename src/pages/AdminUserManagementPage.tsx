import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, UserPlus, UserCheck, Loader2, Check, XCircle, Mail, Search, Edit, Trash2, UserRoundCog, ChevronDown, ChevronUp, Building2, UserX } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useRole } from '@/contexts/RoleContext';
import { getAllProfiles, checkUsernameExists, checkEmailExists, deleteProfile, updateProfile, getProfileById } from '@/lib/studentData';
import { Profile, Establishment } from '@/lib/dataModels';
import { supabase } from '@/integrations/supabase/client';
import InputWithStatus from '@/components/InputWithStatus';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { loadEstablishments } from '@/lib/courseData';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"; // Import Dialog components

const AdminUserManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser, fetchUserProfile } = useRole();
  const navigate = useNavigate(); // Initialize useNavigate

  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);

  // States for new user creation form
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<Profile['role']>(
    (currentRole === 'director' || currentRole === 'deputy_director') ? 'professeur' : 'student'
  );
  const [newUserEstablishmentId, setNewUserEstablishmentId] = useState<string>(
    (currentRole === 'director' || currentRole === 'deputy_director') && currentUserProfile?.establishment_id
      ? currentUserProfile.establishment_id
      : ''
  );
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isNewUserFormOpen, setIsNewUserFormOpen] = useState(false);

  const [usernameAvailabilityStatus, setUsernameAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailAvailabilityStatus, setEmailAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const debounceTimeoutRefUsername = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimeoutRefEmail = useRef<ReturnType<typeof setTimeout> | null>(null);

  // States for user list filtering
  const [userListSearchQuery, setUserListSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<Profile['role'] | 'all'>(
    (currentRole === 'director' || currentRole === 'deputy_director') ? 'professeur' : 'all'
  );
  const [selectedEstablishmentFilter, setSelectedEstablishmentFilter] = useState<string | 'all'>(
    (currentRole === 'director' || currentRole === 'deputy_director') && currentUserProfile?.establishment_id
      ? currentUserProfile.establishment_id
      : 'all'
  );

  // States for editing user
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Profile | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<Profile['role']>('student');
  const [editEstablishmentId, setEditEstablishmentId] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [editUsernameAvailabilityStatus, setEditUsernameAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [editEmailAvailabilityStatus, setEditEmailAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const debounceTimeoutRefEditUsername = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimeoutRefEditEmail = useRef<ReturnType<typeof setTimeout> | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      setAllUsers(await getAllProfiles());
      setEstablishments(await loadEstablishments());
    };
    fetchData();
  }, [currentUserProfile]);

  // Set default filters based on role
  useEffect(() => {
    if ((currentRole === 'director' || currentRole === 'deputy_director')) {
      setSelectedRoleFilter('professeur');
      setSelectedEstablishmentFilter(currentUserProfile?.establishment_id || 'all');
      setNewUserRole('professeur'); // Default new user role for directors
      setNewUserEstablishmentId(currentUserProfile?.establishment_id || ''); // Default new user establishment for directors
    } else if (currentRole === 'administrator') { // Admin specific defaults
      setSelectedRoleFilter('all'); // Admin can see all roles by default
      setSelectedEstablishmentFilter('all'); // Admin can see all establishments by default
      setNewUserRole('director'); // Admin defaults to creating directors
      setNewUserEstablishmentId(''); // Admin can choose establishment for new director
    } else { // Professeur/Tutor defaults
      setSelectedRoleFilter('student');
      setSelectedEstablishmentFilter(currentUserProfile?.establishment_id || 'all');
      setNewUserRole('student');
      setNewUserEstablishmentId(currentUserProfile?.establishment_id || '');
    }
  }, [currentRole, currentUserProfile?.establishment_id]);

  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';

  // --- New User Creation Logic ---
  const validateUsername = useCallback(async (username: string, currentUserId?: string) => {
    if (username.length < 3) {
      setUsernameAvailabilityStatus('idle');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameAvailabilityStatus('idle');
      return false;
    }
    setUsernameAvailabilityStatus('checking');
    const isTaken = await checkUsernameExists(username);
    if (isTaken && (!currentUserId || allUsers.find(u => u.username === username)?.id !== currentUserId)) {
      setUsernameAvailabilityStatus('taken');
      return false;
    }
    setUsernameAvailabilityStatus('available');
    return true;
  }, [allUsers]);

  const validateEmail = useCallback(async (email: string, currentUserId?: string) => {
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailAvailabilityStatus('idle');
      return false;
    }
    setEmailAvailabilityStatus('checking');
    const isTaken = await checkEmailExists(email);
    if (isTaken && (!currentUserId || allUsers.find(u => u.email === email)?.id !== currentUserId)) {
      setEmailAvailabilityStatus('taken');
      return false;
    }
    setEmailAvailabilityStatus('available');
    return true;
  }, [allUsers]);

  const handleNewUserUsernameChange = (value: string) => {
    setNewUserUsername(value);
    if (debounceTimeoutRefUsername.current) clearTimeout(debounceTimeoutRefUsername.current);
    if (value.trim() === '') {
      setUsernameAvailabilityStatus('idle');
      return;
    }
    debounceTimeoutRefUsername.current = setTimeout(() => {
      validateUsername(value);
    }, 500);
  };

  const handleNewUserEmailChange = (value: string) => {
    setNewUserEmail(value);
    if (debounceTimeoutRefEmail.current) clearTimeout(debounceTimeoutRefEmail.current);
    if (value.trim() === '') {
      setEmailAvailabilityStatus('idle');
      return;
    }
    debounceTimeoutRefEmail.current = setTimeout(() => {
      validateEmail(value);
    }, 500);
  };

  const handleCreateUser = async () => {
    if (!currentUserProfile || !['administrator', 'director', 'deputy_director', 'professeur', 'tutor'].includes(currentRole || '')) { // Added professeur and tutor
      showError("Vous n'êtes pas autorisé à créer des utilisateurs.");
      return;
    }
    if (!newUserFirstName.trim() || !newUserLastName.trim() || !newUserUsername.trim() || !newUserEmail.trim() || !newUserPassword.trim() || !newUserRole) {
      showError("Tous les champs requis doivent être remplis.");
      return;
    }
    if (newUserPassword.trim().length < 6) {
      showError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (usernameAvailabilityStatus === 'taken' || emailAvailabilityStatus === 'taken') {
      showError("Le nom d'utilisateur ou l'email est déjà pris.");
      return;
    }
    if (usernameAvailabilityStatus === 'checking' || emailAvailabilityStatus === 'checking') {
      showError("Veuillez attendre la vérification de la disponibilité du nom d'utilisateur et de l'email.");
      return;
    }

    let finalNewUserRole = newUserRole;
    let finalNewUserEstablishmentId = newUserEstablishmentId;

    // Role-based creation restrictions and defaults
    if (currentRole === 'director' || currentRole === 'deputy_director') {
      // For directors, the default role on this page is 'professeur', but they can also create 'tutor' or 'student'
      if (!['professeur', 'tutor', 'student'].includes(newUserRole)) {
        showError("Les directeurs ne peuvent créer que des professeurs, tuteurs ou des élèves.");
        return;
      }
      // Establishment is fixed to their own
      finalNewUserEstablishmentId = currentUserProfile.establishment_id || '';
      if (newUserEstablishmentId && newUserEstablishmentId !== currentUserProfile.establishment_id) {
        showError("Vous ne pouvez créer des utilisateurs que pour votre établissement.");
        return;
      }
    } else if (currentRole === 'professeur' || currentRole === 'tutor') { // Professors and Tutors can only create students
      if (newUserRole !== 'student') {
        showError("Les professeurs et tuteurs ne peuvent créer que des élèves.");
        return;
      }
      finalNewUserEstablishmentId = currentUserProfile.establishment_id || '';
      if (newUserEstablishmentId && newUserEstablishmentId !== currentUserProfile.establishment_id) {
        showError("Vous ne pouvez créer des élèves que pour votre établissement.");
        return;
      }
    } else if (currentRole === 'administrator') {
      // Admin can only create director, deputy_director, or other administrators
      if (!['director', 'deputy_director', 'administrator'].includes(newUserRole)) {
        showError("Les administrateurs ne peuvent créer que des directeurs, directeurs adjoints ou d'autres administrateurs.");
        return;
      }
      // For admin, if a role that requires establishment is selected, ensure establishment is provided
      if ((newUserRole === 'director' || newUserRole === 'deputy_director') && !newUserEstablishmentId) {
        showError("L'établissement est requis pour ce rôle.");
        return;
      }
    }

    setIsCreatingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user-with-role', {
        body: {
          email: newUserEmail.trim(),
          password: newUserPassword.trim(),
          first_name: newUserFirstName.trim(),
          last_name: newUserLastName.trim(),
          username: newUserUsername.trim(),
          role: finalNewUserRole,
          establishment_id: finalNewUserEstablishmentId || undefined, // Pass undefined if empty
        },
      });

      if (error) {
        console.error("Error creating user via Edge Function:", error);
        showError(`Erreur lors de la création de l'utilisateur: ${error.message}`);
        return;
      }
      
      showSuccess(`Utilisateur ${newUserFirstName} ${newUserLastName} (${finalNewUserRole}) créé avec succès !`);
      setNewUserFirstName('');
      setNewUserLastName('');
      setNewUserUsername('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole(
        (currentRole === 'director' || currentRole === 'deputy_director') ? 'professeur' : 
        (currentRole === 'professeur' || currentRole === 'tutor') ? 'student' : 'director' // Admin defaults to director
      ); // Reset to default based on role
      setNewUserEstablishmentId(
        (currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'professeur' || currentRole === 'tutor') && currentUserProfile?.establishment_id
          ? currentUserProfile.establishment_id
          : ''
      ); // Reset to default
      setUsernameAvailabilityStatus('idle');
      setEmailAvailabilityStatus('idle');
      setAllUsers(await getAllProfiles());
      setIsNewUserFormOpen(false);
    } catch (error: any) {
      console.error("Unexpected error creating user:", error);
      showError(`Une erreur inattendue est survenue: ${error.message}`);
    } finally {
      setIsCreatingUser(false);
    }
  };

  // --- User List & Filtering Logic ---
  const filteredUsers = React.useMemo(() => {
    let users = allUsers;

    // Filter by current user's establishment if director/deputy director/professeur/tutor
    if (currentUserProfile && (currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'professeur' || currentRole === 'tutor')) {
      users = users.filter(u => u.establishment_id === currentUserProfile.establishment_id);
    } else if (currentRole === 'administrator') {
      // Admin sees all users by default, then filters by selectedEstablishmentFilter
    }

    // Apply role filter
    if (selectedRoleFilter !== 'all') {
      users = users.filter(u => u.role === selectedRoleFilter);
    }
    
    // Apply establishment filter (only for admin, as others are already filtered by their own establishment)
    if (currentRole === 'administrator' && selectedEstablishmentFilter !== 'all') {
      users = users.filter(u => u.establishment_id === selectedEstablishmentFilter);
    }

    if (userListSearchQuery.trim()) {
      const lowerCaseQuery = userListSearchQuery.toLowerCase();
      users = users.filter(u =>
        u.first_name?.toLowerCase().includes(lowerCaseQuery) ||
        u.last_name?.toLowerCase().includes(lowerCaseQuery) ||
        u.username?.toLowerCase().includes(lowerCaseQuery.replace('@', '')) ||
        u.email?.toLowerCase().includes(lowerCaseQuery)
      );
    }
    return users;
  }, [allUsers, selectedRoleFilter, selectedEstablishmentFilter, userListSearchQuery, currentUserProfile, currentRole]);

  // --- Edit User Logic ---
  const handleEditUser = (user: Profile) => {
    if (!currentUserProfile || !['administrator', 'director', 'deputy_director'].includes(currentRole || '')) {
      showError("Vous n'êtes pas autorisé à modifier cet utilisateur.");
      return;
    }
    // Restrict directors/deputy directors from editing certain roles or users outside their establishment
    if ((currentRole === 'director' || currentRole === 'deputy_director')) {
      if (user.establishment_id !== currentUserProfile.establishment_id) {
        showError("Vous ne pouvez modifier que les utilisateurs de votre établissement.");
        return;
      }
      if (['administrator', 'director', 'deputy_director'].includes(user.role)) {
        showError("Vous ne pouvez pas modifier un administrateur, un directeur ou un directeur adjoint.");
        return;
      }
    } else if (currentRole === 'administrator') {
      // Admin cannot edit student, professeur, tutor roles
      if (['student', 'professeur', 'tutor'].includes(user.role)) {
        showError("Les administrateurs ne peuvent pas modifier les élèves, professeurs ou tuteurs.");
        return;
      }
    }

    setUserToEdit(user);
    setEditFirstName(user.first_name || '');
    setEditLastName(user.last_name || '');
    setEditUsername(user.username || '');
    setEditEmail(user.email || '');
    setEditRole(user.role);
    setEditEstablishmentId(user.establishment_id || '');
    setEditUsernameAvailabilityStatus('available'); // Assume available initially for existing user
    setEditEmailAvailabilityStatus('available'); // Assume available initially for existing user
    setIsEditDialogOpen(true);
  };

  const handleEditUsernameChange = (value: string) => {
    setEditUsername(value);
    if (debounceTimeoutRefEditUsername.current) clearTimeout(debounceTimeoutRefEditUsername.current);
    if (value.trim() === '') {
      setEditUsernameAvailabilityStatus('idle');
      return;
    }
    debounceTimeoutRefEditUsername.current = setTimeout(async () => {
      const isTaken = await checkUsernameExists(value);
      if (isTaken && userToEdit?.username !== value) { // Only mark as taken if it's different from current user's username
        setEditUsernameAvailabilityStatus('taken');
      } else {
        setEditUsernameAvailabilityStatus('available');
      }
    }, 500);
  };

  const handleEditEmailChange = (value: string) => {
    setEditEmail(value);
    if (debounceTimeoutRefEditEmail.current) clearTimeout(debounceTimeoutRefEditEmail.current);
    if (value.trim() === '') {
      setEditEmailAvailabilityStatus('idle');
      return;
    }
    debounceTimeoutRefEditEmail.current = setTimeout(async () => {
      const isTaken = await checkEmailExists(value);
      if (isTaken && userToEdit?.email !== value) { // Only mark as taken if it's different from current user's email
        setEditEmailAvailabilityStatus('taken');
      } else {
        setEditEmailAvailabilityStatus('available');
      }
    }, 500);
  };

  const handleSaveEditedUser = async () => {
    if (!userToEdit || !currentUserProfile || !['administrator', 'director', 'deputy_director'].includes(currentRole || '')) {
      showError("Vous n'êtes pas autorisé à modifier cet utilisateur.");
      return;
    }
    if (!editFirstName.trim() || !editLastName.trim() || !editUsername.trim() || !editEmail.trim() || !editRole) {
      showError("Tous les champs requis doivent être remplis.");
      return;
    }
    if (editUsernameAvailabilityStatus === 'taken' || editEmailAvailabilityStatus === 'taken') {
      showError("Le nom d'utilisateur ou l'email est déjà pris.");
      return;
    }
    if (editUsernameAvailabilityStatus === 'checking' || editEmailAvailabilityStatus === 'checking') {
      showError("Veuillez attendre la vérification de la disponibilité du nom d'utilisateur et de l'email.");
      return;
    }

    // Role-based editing restrictions
    if ((currentRole === 'director' || currentRole === 'deputy_director')) {
      if (userToEdit.establishment_id !== currentUserProfile.establishment_id) {
        showError("Vous ne pouvez modifier que les utilisateurs de votre établissement.");
        return;
      }
      if (['administrator', 'director', 'deputy_director'].includes(userToEdit.role)) {
        showError("Vous ne pouvez pas modifier un administrateur, un directeur ou un directeur adjoint.");
        return;
      }
      if (editEstablishmentId && editEstablishmentId !== currentUserProfile.establishment_id) { // If an establishment is selected, it must be their own
        showError("Vous ne pouvez pas changer l'établissement d'un utilisateur en dehors du vôtre.");
        return;
      }
      if (!['professeur', 'student', 'tutor'].includes(editRole)) { // Directors can edit students, professeurs, tutors
        showError("Vous ne pouvez attribuer que les rôles de professeur, tuteur ou d'élève.");
        return;
      }
    } else if (currentRole === 'administrator') {
      // Admin cannot edit student, professeur, tutor roles
      if (['student', 'professeur', 'tutor'].includes(userToEdit.role)) {
        showError("Les administrateurs ne peuvent pas modifier les élèves, professeurs ou tuteurs.");
        return;
      }
      // Admin can only assign director/deputy director to an establishment
      if ((editRole === 'director' || editRole === 'deputy_director') && !editEstablishmentId) {
        showError("L'établissement est requis pour les rôles de directeur et directeur adjoint.");
        return;
      }
      // Admin cannot change role to student, professeur, tutor
      if (['student', 'professeur', 'tutor'].includes(editRole)) {
        showError("Les administrateurs ne peuvent pas attribuer les rôles d'élève, professeur ou tuteur.");
        return;
      }
    }

    // For 'professeur' and 'tutor' roles, establishment_id is still required
    if ((editRole === 'professeur' || editRole === 'tutor') && !editEstablishmentId) {
      showError("L'établissement est requis pour les rôles de professeur et tuteur.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const updatedProfileData: Partial<Profile> = {
        id: userToEdit.id,
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        username: editUsername.trim(),
        email: editEmail.trim(),
        role: editRole,
        establishment_id: editEstablishmentId || undefined, // Pass undefined if empty
      };

      const savedProfile = await updateProfile(updatedProfileData);

      // If email changed, update in auth.users as well
      if (editEmail.trim() !== userToEdit.email) {
        const { error: emailUpdateError } = await supabase.auth.admin.updateUserById(userToEdit.id, { email: editEmail.trim() });
        if (emailUpdateError) {
          console.error("Error updating user email in auth.users:", emailUpdateError);
          showError(`Erreur lors de la mise à jour de l'email: ${emailUpdateError.message}`);
          setIsSavingEdit(false);
          return;
        }
      }

      // If role changed, update in auth.users metadata
      if (editRole !== userToEdit.role) {
        const { error: roleUpdateError } = await supabase.auth.admin.updateUserById(userToEdit.id, {
          user_metadata: { ...userToEdit.user_metadata, role: editRole } as { [key: string]: any } // Cast to allow dynamic properties
        });
        if (roleUpdateError) {
          console.error("Error updating user role in auth.users metadata:", roleUpdateError);
          showError(`Erreur lors de la mise à jour du rôle de l'utilisateur: ${roleUpdateError.message}`);
          setIsSavingEdit(false);
          return;
        }
      }

      if (savedProfile) {
        setAllUsers(await getAllProfiles());
        if (currentUserProfile?.id === userToEdit.id) {
          await fetchUserProfile(userToEdit.id);
        }
        showSuccess("Profil utilisateur mis à jour avec succès !");
        setIsEditDialogOpen(false);
        setUserToEdit(null);
      } else {
        showError("Échec de la mise à jour du profil utilisateur.");
      }
    } catch (error: any) {
      console.error("Error saving user profile:", error);
      showError(`Erreur lors de la sauvegarde du profil: ${error.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteUser = async (userId: string, userRole: Profile['role']) => {
    if (!currentUserProfile || !['administrator', 'director', 'deputy_director'].includes(currentRole || '')) {
      showError("Vous n'êtes pas autorisé à supprimer des utilisateurs.");
      return;
    }
    if (userId === currentUserProfile.id) {
      showError("Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }

    // Role-based deletion restrictions
    if ((currentRole === 'director' || currentRole === 'deputy_director')) {
      const userToDelete = allUsers.find(u => u.id === userId);
      if (!userToDelete || userToDelete.establishment_id !== currentUserProfile.establishment_id) {
        showError("Vous ne pouvez supprimer que les utilisateurs de votre établissement.");
        return;
      }
      if (['administrator', 'director', 'deputy_director'].includes(userRole)) {
        showError("Vous ne pouvez pas supprimer un administrateur, un directeur ou un directeur adjoint.");
        return;
      }
    } else if (currentRole === 'administrator') {
      // Admin cannot delete student, professeur, tutor roles
      if (['student', 'professeur', 'tutor'].includes(userRole)) {
        showError("Les administrateurs ne peuvent pas supprimer les élèves, professeurs ou tuteurs.");
        return;
      }
    }

    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible et supprimera également son compte utilisateur et toutes les données associées.")) {
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) {
          console.error("Error deleting user from auth.users:", authError);
          showError(`Erreur lors de la suppression du compte utilisateur: ${authError.message}`);
          return;
        }
        
        setAllUsers(await getAllProfiles());
        showSuccess("Utilisateur et compte supprimés !");
      } catch (error: any) {
        console.error("Error deleting user:", error);
        showError(`Erreur lors de la suppression de l'utilisateur: ${error.message}`);
      }
    }
  };

  const handleUnassignFromEstablishment = async (userId: string, userName: string) => {
    if (!currentUserProfile || (currentRole !== 'administrator' && currentRole !== 'director' && currentRole !== 'deputy_director')) {
      showError("Vous n'êtes pas autorisé à désaffecter des utilisateurs d'un établissement.");
      return;
    }
    const userToUnassign = allUsers.find(u => u.id === userId);
    if (!userToUnassign) {
      showError("Utilisateur introuvable.");
      return;
    }
    if (!userToUnassign.establishment_id) {
      showError("Cet utilisateur n'est pas affecté à un établissement.");
      return;
    }
    // Directors/Deputy Directors can only unassign users from their own establishment
    if ((currentRole === 'director' || currentRole === 'deputy_director') && userToUnassign.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez désaffecter que les utilisateurs de votre établissement.");
      return;
    }
    // Admin cannot unassign student, professeur, tutor roles
    if (currentRole === 'administrator' && ['student', 'professeur', 'tutor'].includes(userToUnassign.role)) {
      showError("Les administrateurs ne peuvent pas désaffecter les élèves, professeurs ou tuteurs.");
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir désaffecter ${userName} de son établissement ?`)) {
      try {
        const updatedProfile: Partial<Profile> = {
          id: userId,
          establishment_id: undefined, // Set to undefined to clear the foreign key
          enrollment_start_date: undefined,
          enrollment_end_date: undefined,
        };
        await updateProfile(updatedProfile);
        setAllUsers(await getAllProfiles());
        showSuccess(`${userName} a été désaffecté de son établissement.`);
      } catch (error: any) {
        console.error("Error unassigning user from establishment:", error);
        showError(`Erreur lors de la désaffectation: ${error.message}`);
      }
    }
  };

  const handleSendMessageToUser = (userId: string) => {
    navigate(`/messages?contactId=${userId}`);
  };

  const rolesForCreation: Profile['role'][] = 
    currentRole === 'administrator'
      ? ['director', 'deputy_director', 'administrator'] // Admin can only create these roles
      : (currentRole === 'professeur' || currentRole === 'tutor')
        ? ['student']
        : ['professeur', 'tutor', 'student']; // Directors/Deputy Directors can create students, professeurs, tutors

  const rolesForEdit: Profile['role'][] = 
    currentRole === 'administrator'
      ? ['director', 'deputy_director', 'administrator'] // Admin can only edit these roles
      : (currentRole === 'professeur' || currentRole === 'tutor')
        ? ['student']
        : ['professeur', 'tutor', 'student']; // Directors/Deputy Directors can edit students, professeurs, tutors

  if (isLoadingUser) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Chargement...
        </h1>
        <p className="text-lg text-muted-foreground">
          Veuillez patienter.
        </p>
      </div>
    );
  }

  if (!currentUserProfile || !['administrator', 'director', 'deputy_director', 'professeur', 'tutor'].includes(currentRole || '')) { // Added professeur and tutor
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès Restreint
        </h1>
        <p className="text-lg text-muted-foreground">
          Seuls les administrateurs, directeurs, directeurs adjoints, professeurs et tuteurs peuvent accéder à cette page.
        </p>
      </div>
    );
  }

  const establishmentsToDisplayForNewUser = currentRole === 'administrator'
    ? establishments
    : establishments.filter(est => est.id === currentUserProfile.establishment_id);

  const establishmentsToDisplayForFilter = currentRole === 'administrator'
    ? establishments
    : establishments.filter(est => est.id === currentUserProfile.establishment_id);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        {currentRole === 'director' || currentRole === 'deputy_director' ? "Gestion des Professeurs" : "Gestion des Utilisateurs"}
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Créez, modifiez et supprimez des utilisateurs sur la plateforme.
      </p>

      {/* Section: Créer un nouvel utilisateur (Collapsible) */}
      <Collapsible open={isNewUserFormOpen} onOpenChange={setIsNewUserFormOpen}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-6 w-6 text-primary" /> Créer un nouvel utilisateur
                </CardTitle>
                {isNewUserFormOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </CollapsibleTrigger>
            <CardDescription>Créez un nouveau compte pour n'importe quel rôle.</CardDescription>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Prénom"
                  value={newUserFirstName}
                  onChange={(e) => setNewUserFirstName(e.target.value)}
                />
                <Input
                  placeholder="Nom"
                  value={newUserLastName}
                  onChange={(e) => setNewUserLastName(e.target.value)}
                />
                <InputWithStatus
                  placeholder="Nom d'utilisateur"
                  value={newUserUsername}
                  onChange={(e) => handleNewUserUsernameChange(e.target.value)}
                  status={usernameAvailabilityStatus}
                  errorMessage={usernameAvailabilityStatus === 'taken' ? "Nom d'utilisateur déjà pris" : undefined}
                />
                <InputWithStatus
                  type="email"
                  placeholder="Email"
                  value={newUserEmail}
                  onChange={(e) => handleNewUserEmailChange(e.target.value)}
                  status={emailAvailabilityStatus}
                  errorMessage={emailAvailabilityStatus === 'taken' ? "Email déjà enregistré" : undefined}
                />
                <Input
                  type="password"
                  placeholder="Mot de passe"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
                <Select 
                  value={newUserRole} 
                  onValueChange={(value: Profile['role']) => {
                    setNewUserRole(value);
                    // Reset establishment_id if role doesn't require it or if it's a director/deputy director/professeur/tutor
                    if (value === 'student' || value === 'administrator') { // Admin can create other admins without establishment
                      setNewUserEstablishmentId('');
                    } else if (['director', 'deputy_director', 'professeur', 'tutor'].includes(currentRole || '')) {
                      setNewUserEstablishmentId(currentUserProfile.establishment_id || '');
                    }
                  }}
                  disabled={['director', 'deputy_director', 'professeur', 'tutor'].includes(currentRole || '')} // Disable if director/professeur/tutor
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-lg bg-background/80">
                    {rolesForCreation.map(role => (
                      <SelectItem key={role} value={role}>
                        {role === 'student' ? 'Élève' :
                         role === 'professeur' ? 'Professeur' :
                         role === 'tutor' ? 'Tuteur' :
                         role === 'director' ? 'Directeur' :
                         role === 'deputy_director' ? 'Directeur Adjoint' :
                         'Administrateur (Super Admin)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Establishment selection is now conditional based on role and current user's role */}
                {((newUserRole === 'professeur' || newUserRole === 'tutor') || (currentRole === 'administrator' && (newUserRole === 'director' || newUserRole === 'deputy_director'))) && (
                  <Select 
                    value={newUserEstablishmentId || "none"} 
                    onValueChange={(value) => setNewUserEstablishmentId(value === "none" ? '' : value)}
                    disabled={['director', 'deputy_director', 'professeur', 'tutor'].includes(currentRole || '')}
                  >
                    <SelectTrigger id="new-user-establishment">
                      <SelectValue placeholder="Sélectionner un établissement" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-lg bg-background/80">
                      <SelectItem value="none">Aucun</SelectItem>
                      {establishmentsToDisplayForNewUser.map(est => (
                          <SelectItem key={est.id} value={est.id}>
                            {est.name} {est.address && <span className="italic text-muted-foreground">({est.address})</span>}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Button onClick={handleCreateUser} disabled={isCreatingUser || usernameAvailabilityStatus === 'checking' || emailAvailabilityStatus === 'checking' || ((newUserRole === 'professeur' || newUserRole === 'tutor' || newUserRole === 'director' || newUserRole === 'deputy_director') && !newUserEstablishmentId && currentRole === 'administrator') || ((newUserRole === 'student') && !newUserEstablishmentId && (currentRole === 'administrator' || currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'professeur' || currentRole === 'tutor'))}>
                {isCreatingUser ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />} Créer l'utilisateur
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section: Liste de tous les utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRoundCog className="h-6 w-6 text-primary" /> Liste de tous les utilisateurs
          </CardTitle>
          <CardDescription>Visualisez et gérez tous les comptes utilisateurs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou @username..."
                className="pl-10"
                value={userListSearchQuery}
                onChange={(e) => setUserListSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex-shrink-0 sm:w-1/3">
              <Label htmlFor="role-filter">Filtrer par Rôle</Label>
              <Select 
                value={selectedRoleFilter} 
                onValueChange={(value: Profile['role'] | 'all') => setSelectedRoleFilter(value)}
                disabled={['director', 'deputy_director', 'professeur', 'tutor'].includes(currentRole || '')} // Disable if director/professeur/tutor
              >
                <SelectTrigger id="role-filter">
                  <SelectValue placeholder="Tous les rôles" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-lg bg-background/80">
                  {(currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'professeur' || currentRole === 'tutor') ? (
                    <>
                      <SelectItem value="professeur">Professeur</SelectItem>
                      <SelectItem value="tutor">Tuteur</SelectItem>
                      <SelectItem value="student">Élève</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="all">Tous les rôles</SelectItem>
                      <SelectItem value="student">Élève</SelectItem>
                      <SelectItem value="professeur">Professeur</SelectItem>
                      <SelectItem value="tutor">Tuteur</SelectItem>
                      {currentRole === 'administrator' && (
                        <>
                          <SelectItem value="director">Directeur</SelectItem>
                          <SelectItem value="deputy_director">Directeur Adjoint</SelectItem>
                          <SelectItem value="administrator">Administrateur (Super Admin)</SelectItem>
                        </>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-shrink-0 sm:w-1/3">
              <Label htmlFor="establishment-filter">Filtrer par Établissement</Label>
              <Select 
                value={selectedEstablishmentFilter} 
                onValueChange={(value: string | 'all') => setSelectedEstablishmentFilter(value)}
                disabled={['director', 'deputy_director', 'professeur', 'tutor'].includes(currentRole || '')}
              >
                <SelectTrigger id="establishment-filter">
                  <SelectValue placeholder="Tous les établissements" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-lg bg-background/80">
                  <SelectItem value="all">Tous les établissements</SelectItem>
                  {establishmentsToDisplayForFilter.map(est => (
                          <SelectItem key={est.id} value={est.id}>
                            {est.name} {est.address && <span className="italic text-muted-foreground">({est.address})</span>}
                          </SelectItem>
                        ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            {filteredUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucun utilisateur trouvé pour votre recherche ou vos filtres.
              </p>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex-grow">
                    <p className="font-medium">{user.first_name} {user.last_name} <span className="text-sm text-muted-foreground">(@{user.username})</span></p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Rôle: <span className="font-semibold">{user.role === 'professeur' ? 'Professeur' : user.role === 'student' ? 'Élève' : user.role === 'tutor' ? 'Tuteur' : user.role === 'director' ? 'Directeur' : user.role === 'deputy_director' ? 'Directeur Adjoint' : 'Administrateur (Super Admin)'}</span></p>
                    {user.establishment_id && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> Établissement: {getEstablishmentName(user.establishment_id)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                    <Button variant="outline" size="sm" onClick={() => handleSendMessageToUser(user.id)}>
                      <Mail className="h-4 w-4 mr-1" /> Message
                    </Button>
                    {/* Unassign from Establishment button */}
                    {user.establishment_id && (currentRole === 'administrator' || ((currentRole === 'director' || currentRole === 'deputy_director') && user.establishment_id === currentUserProfile.establishment_id)) && !['student', 'professeur', 'tutor'].includes(user.role) && ( // Admin cannot unassign student/prof/tutor
                      <Button variant="outline" size="sm" onClick={() => handleUnassignFromEstablishment(user.id, `${user.first_name} ${user.last_name}`)}>
                        <UserX className="h-4 w-4 mr-1" /> Désaffecter
                      </Button>
                    )}
                    {/* Edit button visibility and permissions */}
                    {((currentRole === 'administrator' && !['student', 'professeur', 'tutor'].includes(user.role)) || // Admin can edit non-student/prof/tutor
                      ((currentRole === 'director' || currentRole === 'deputy_director') && 
                       user.establishment_id === currentUserProfile.establishment_id && 
                       !['administrator', 'director', 'deputy_director'].includes(user.role))) && (
                      <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {/* Delete button visibility and permissions */}
                    {((currentRole === 'administrator' && !['student', 'professeur', 'tutor'].includes(user.role)) || // Admin can delete non-student/prof/tutor
                      ((currentRole === 'director' || currentRole === 'deputy_director') && 
                       user.establishment_id === currentUserProfile.establishment_id && 
                       !['administrator', 'director', 'deputy_director'].includes(user.role))) && (
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id, user.role)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      {userToEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] backdrop-blur-lg bg-background/80">
            <DialogHeader>
              <DialogTitle>Modifier l'utilisateur</DialogTitle>
              <DialogDescription>
                Mettez à jour les informations de l'utilisateur.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editFirstName" className="text-right">Prénom</Label>
                <Input id="editFirstName" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editLastName" className="text-right">Nom</Label>
                <Input id="editLastName" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editUsername" className="text-right">Nom d'utilisateur</Label>
                <InputWithStatus
                  id="editUsername"
                  value={editUsername}
                  onChange={(e) => handleEditUsernameChange(e.target.value)}
                  className="col-span-3"
                  status={editUsernameAvailabilityStatus}
                  errorMessage={editUsernameAvailabilityStatus === 'taken' ? "Nom d'utilisateur déjà pris" : undefined}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editEmail" className="text-right">Email</Label>
                <InputWithStatus
                  id="editEmail"
                  type="email"
                  value={editEmail}
                  onChange={(e) => handleEditEmailChange(e.target.value)}
                  className="col-span-3"
                  status={editEmailAvailabilityStatus}
                  errorMessage={editEmailAvailabilityStatus === 'taken' ? "Email déjà enregistré" : undefined}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editRole" className="text-right">Rôle</Label>
                <Select 
                  value={editRole} 
                  onValueChange={(value: Profile['role']) => {
                    setEditRole(value);
                    // Reset establishment_id if role doesn't require it or if it's a director/deputy director
                    if (value === 'student' || value === 'administrator') {
                      setEditEstablishmentId('');
                    } else if (currentRole === 'director' || currentRole === 'deputy_director') {
                      setEditEstablishmentId(currentUserProfile.establishment_id || '');
                    }
                  }}
                  disabled={
                    (currentRole === 'director' || currentRole === 'deputy_director') || // Disable for directors
                    ['administrator', 'director', 'deputy_director'].includes(userToEdit?.role || '') || // Also disable if editing admin/director
                    (currentRole === 'administrator' && ['student', 'professeur', 'tutor'].includes(userToEdit?.role || '')) // Admin cannot change student/prof/tutor roles
                  }
                >
                  <SelectTrigger id="editRole" className="col-span-3">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-lg bg-background/80">
                    {(currentRole === 'director' || currentRole === 'deputy_director') ? (
                      <>
                        <SelectItem value="professeur">Professeur</SelectItem>
                        <SelectItem value="tutor">Tuteur</SelectItem>
                        <SelectItem value="student">Élève</SelectItem>
                      </>
                    ) : (
                      rolesForEdit.map(role => (
                        <SelectItem key={role} value={role}>
                          {role === 'student' ? 'Élève' :
                           role === 'professeur' ? 'Professeur' :
                           role === 'tutor' ? 'Tuteur' :
                           role === 'director' ? 'Directeur' :
                           role === 'deputy_director' ? 'Directeur Adjoint' :
                           'Administrateur (Super Admin)'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              {((editRole === 'professeur' || editRole === 'tutor') || (currentRole === 'administrator' && (editRole === 'director' || editRole === 'deputy_director'))) && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editEstablishment" className="text-right">Établissement</Label>
                  <Select 
                    value={editEstablishmentId || "none"} 
                    onValueChange={(value) => setEditEstablishmentId(value === "none" ? '' : value)} 
                    disabled={currentRole === 'director' || currentRole === 'deputy_director'}
                  >
                    <SelectTrigger id="editEstablishment" className="col-span-3">
                      <SelectValue placeholder="Sélectionner un établissement" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-lg bg-background/80">
                      <SelectItem value="none">Aucun</SelectItem>
                      {establishmentsToDisplayForNewUser.map(est => (
                          <SelectItem key={est.id} value={est.id}>
                            {est.name} {est.address && <span className="italic text-muted-foreground">({est.address})</span>}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <Button onClick={handleSaveEditedUser} disabled={isSavingEdit || editUsernameAvailabilityStatus === 'checking' || editEmailAvailabilityStatus === 'checking' || ((editRole === 'professeur' || editRole === 'tutor' || editRole === 'director' || editRole === 'deputy_director') && !editEstablishmentId && currentRole === 'administrator')}>
              {isSavingEdit ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Enregistrer les modifications"}
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminUserManagementPage;