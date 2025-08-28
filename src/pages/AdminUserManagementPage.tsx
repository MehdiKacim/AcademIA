import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MotionCard, // Import MotionCard
} from "@/components/ui/card";
import { Button, MotionButton } from "@/components/ui/button"; // Import MotionButton
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PlusCircle, UserPlus, UserCheck, Check, XCircle, Mail, Search, Edit, Trash2, UserRoundCog, ChevronDown, ChevronUp, Building2, UserX, CalendarDays,
  Home, MessageSquare, User, LogOut, Settings, Info, BookOpen, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness,
  ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, BookText, UserCog, TrendingUp, BookMarked,
  Users // Ajout de l'icône Users
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useRole } from '@/contexts/RoleContext';
import { getAllProfiles, checkUsernameExists, checkEmailExists, deleteProfile, updateProfile, getProfileById } from '@/lib/studentData';
import { Profile, ALL_ROLES, Establishment } from '@/lib/dataModels';
import { loadEstablishments } from '@/lib/courseData';
import { supabase } from '@/integrations/supabase/client';
import InputWithStatus from '@/components/InputWithStatus';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import SimpleItemSelector from '@/components/ui/SimpleItemSelector';
import EditUserDialog from '@/components/EditUserDialog'; // Import the new dialog component

// Map icon_name strings to Lucide React components (already present in RoleNavConfigsPage, but needed here)
const iconMap: { [key: string]: React.ElementType } = {
  Home: Home, MessageSquare: MessageSquare, Search: Search, User: User, LogOut: LogOut, Settings: Settings, Info: Info, BookOpen: BookOpen, PlusCircle: PlusCircle, Users: Users, GraduationCap: GraduationCap, PenTool: PenTool, NotebookText: NotebookText, School: School, LayoutList: LayoutList, BriefcaseBusiness: BriefcaseBusiness, UserRoundCog: UserRoundCog, ClipboardCheck: ClipboardCheck, BotMessageSquare: BotMessageSquare, LayoutDashboard: LayoutDashboard, LineChart: LineChart, UsersRound: UsersRound, UserRoundSearch: UserRoundSearch, BellRing: BellRing, Building2: Building2, BookText: BookText, UserCog: UserCog, TrendingUp: TrendingUp, BookMarked: BookMarked, CalendarDays: CalendarDays, UserCheck: UserCheck,
  // Icons for roles (also defined in RoleNavConfigsPage, but needed here for consistency)
  student: GraduationCap,
  professeur: PenTool,
  tutor: Users,
  director: BriefcaseBusiness,
  deputy_director: BriefcaseBusiness, // Same as director for now
  administrator: UserRoundCog,
};

// Helper function to get display name for roles
const getRoleDisplayName = (role: Profile['role'] | 'all') => {
  switch (role) {
    case 'student': return 'Élève';
    case 'professeur': return 'Professeur';
    case 'tutor': return 'Tuteur';
    case 'director': return 'Directeur';
    case 'deputy_director': return 'Directeur Adjoint';
    case 'administrator': return 'Administrateur';
    case 'all': return 'Tous les rôles';
    default: return 'Rôle inconnu';
  }
};

const AdminUserManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser, fetchUserProfile } = useRole();
  const navigate = useNavigate();

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
  const [newUserEstablishmentId, setNewUserEstablishmentId] = useState<string | null>(null);
  const [newUserEnrollmentStartDate, setNewUserEnrollmentStartDate] = useState<Date | undefined>(undefined);
  const [newUserEnrollmentEndDate, setNewUserEnrollmentEndDate] = useState<Date | undefined>(undefined);
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
  const [selectedEstablishmentFilter, setSelectedEstablishmentFilter] = useState<string | 'all'>('all');

  // States for editing user
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false); // Changed name to avoid conflict
  const [userToEdit, setUserToEdit] = useState<Profile | null>(null);

  const [newUserRoleSearchQuery, setNewUserRoleSearchQuery] = useState('');
  const [newUserEstablishmentSearchQuery, setNewUserEstablishmentSearchQuery] = useState('');
  const [filterRoleSearchQuery, setFilterRoleSearchQuery] = useState('');
  const [filterEstablishmentSearchQuery, setFilterEstablishmentSearchQuery] = useState('');


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
      setNewUserRole('professeur');
      setNewUserEstablishmentId(currentUserProfile?.establishment_id || null);
      setSelectedEstablishmentFilter(currentUserProfile?.establishment_id || 'all');
    } else if (currentRole === 'administrator') {
      setSelectedRoleFilter('all');
      setNewUserRole('director');
      setNewUserEstablishmentId(null);
      setSelectedEstablishmentFilter('all');
    } else {
      setSelectedRoleFilter('student');
      setNewUserRole('student');
      setNewUserEstablishmentId(currentUserProfile?.establishment_id || null);
      setSelectedEstablishmentFilter(currentUserProfile?.establishment_id || 'all');
    }
  }, [currentRole, currentUserProfile?.id, currentUserProfile?.establishment_id]);

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
    if (!currentUserProfile || !['administrator', 'director', 'deputy_director', 'professeur', 'tutor'].includes(currentRole || '')) {
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
    let finalNewUserEnrollmentStartDate = newUserEnrollmentStartDate;
    let finalNewUserEnrollmentEndDate = newUserEnrollmentEndDate;

    if (currentRole === 'director' || currentRole === 'deputy_director') {
      if (!['professeur', 'tutor', 'student'].includes(newUserRole)) {
        showError("Les directeurs ne peuvent créer que des professeurs, tuteurs ou des élèves.");
        return;
      }
      finalNewUserEstablishmentId = currentUserProfile.establishment_id || null;
    } else if (currentRole === 'professeur' || currentRole === 'tutor') {
      if (newUserRole !== 'student') {
        showError("Les professeurs et tuteurs ne peuvent créer que des élèves.");
        return;
      }
      finalNewUserEstablishmentId = currentUserProfile.establishment_id || null;
    } else if (currentRole === 'administrator') {
      if (['director', 'deputy_director', 'professeur', 'tutor', 'student'].includes(newUserRole) && !finalNewUserEstablishmentId) {
        showError("Un établissement est requis pour les rôles de directeur, directeur adjoint, professeur, tuteur et élève.");
        return;
      }
      if (newUserRole === 'administrator') {
        finalNewUserEstablishmentId = null;
      }
    }

    if (newUserRole !== 'student') {
      finalNewUserEnrollmentStartDate = undefined;
      finalNewUserEnrollmentEndDate = undefined;
    } else {
      if (!finalNewUserEnrollmentStartDate || !finalNewUserEnrollmentEndDate) {
        showError("Les dates de début et de fin d'inscription sont requises pour les élèves.");
        return;
      }
      if (finalNewUserEnrollmentStartDate >= finalNewUserEnrollmentEndDate) {
        showError("La date de fin d'inscription doit être postérieure à la date de début.");
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
          establishment_id: finalNewUserEstablishmentId,
          enrollment_start_date: finalNewUserEnrollmentStartDate ? finalNewUserEnrollmentStartDate.toISOString().split('T')[0] : undefined,
          enrollment_end_date: finalNewUserEnrollmentEndDate ? finalNewUserEnrollmentEndDate.toISOString().split('T')[0] : undefined,
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
        (currentRole === 'professeur' || currentRole === 'tutor') ? 'student' : 'director'
      );
      setNewUserEstablishmentId(currentUserProfile?.establishment_id || null);
      setNewUserEnrollmentStartDate(undefined);
      setNewUserEnrollmentEndDate(undefined);
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

  const handleDeleteUser = async (userId: string) => {
    if (!currentUserProfile || currentRole !== 'administrator') {
      showError("Vous n'êtes pas autorisé à supprimer des utilisateurs.");
      return;
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

  const handleSendMessageToUser = (profile: Profile) => {
    navigate(`/messages?contactId=${profile.id}`);
  };

  const handleEditUser = (profile: Profile) => {
    setUserToEdit(profile);
    setIsEditUserDialogOpen(true);
  };

  const handleSaveEditedUser = async (updatedProfile: Profile) => {
    setAllUsers(await getAllProfiles()); // Refresh the list of all users
  };

  const filteredUsersToDisplay = React.useMemo(() => {
    let users = allUsers;

    if (selectedRoleFilter !== 'all') {
      users = users.filter(p => p.role === selectedRoleFilter);
    }

    if (selectedEstablishmentFilter !== 'all' && currentRole === 'administrator') {
      users = users.filter(p => p.establishment_id === selectedEstablishmentFilter || (p.role === 'administrator' && !p.establishment_id));
    } else if (currentRole !== 'administrator' && currentUserProfile?.establishment_id) {
      users = users.filter(p => p.establishment_id === currentUserProfile.establishment_id || (p.role === 'administrator' && !p.establishment_id));
    }

    if (userListSearchQuery.trim()) {
      const lowerCaseQuery = userListSearchQuery.toLowerCase();
      users = users.filter(s =>
        s.first_name?.toLowerCase().includes(lowerCaseQuery) ||
        s.last_name?.toLowerCase().includes(lowerCaseQuery) ||
        s.username?.toLowerCase().includes(lowerCaseQuery.replace('@', '')) ||
        s.email?.toLowerCase().includes(lowerCaseQuery)
      );
    }
    return users;
  }, [allUsers, currentUserProfile, currentRole, userListSearchQuery, selectedRoleFilter, selectedEstablishmentFilter]);

  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';

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

  if (!currentUserProfile || !['administrator', 'director', 'deputy_director', 'professeur', 'tutor'].includes(currentRole || '')) {
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

  const rolesForNewUserCreation = ALL_ROLES.filter(role => {
    if (currentRole === 'administrator') return true;
    if (currentRole === 'director' || currentRole === 'deputy_director') return ['professeur', 'tutor', 'student'].includes(role);
    if (currentRole === 'professeur' || currentRole === 'tutor') return role === 'student';
    return false;
  });

  const rolesForFilter = ALL_ROLES.filter(role => {
    if (currentRole === 'administrator') return true;
    if (currentRole === 'director' || currentRole === 'deputy_director') return ['professeur', 'tutor', 'student'].includes(role);
    if (currentRole === 'professeur' || currentRole === 'tutor') return role === 'student';
    return false;
  });

  const establishmentsToDisplayForNewUser = establishments.filter(est =>
    currentRole === 'administrator' || est.id === currentUserProfile?.establishment_id
  ).map(est => ({
    id: est.id,
    label: est.name,
    icon_name: 'Building2',
    description: est.address,
  }));

  const establishmentsToDisplayForFilter = establishments.filter(est =>
    currentRole === 'administrator' || est.id === currentUserProfile?.establishment_id
  ).map(est => ({
    id: est.id,
    label: est.name,
    icon_name: 'Building2',
    description: est.address,
  }));

  const rolesOptionsForNewUser = rolesForNewUserCreation.map(role => ({
    id: role,
    label: getRoleDisplayName(role),
    icon_name: iconMap[role] ? role : 'User',
  }));

  const rolesOptionsForFilter = rolesForFilter.map(role => ({
    id: role,
    label: getRoleDisplayName(role),
    icon_name: iconMap[role] ? role : 'User',
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion des Utilisateurs
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Gérez les profils des utilisateurs de la plateforme.
      </p>

      {/* Section: Créer un nouvel utilisateur */}
      <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
        <Collapsible open={isNewUserFormOpen} onOpenChange={setIsNewUserFormOpen}>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <MotionButton variant="ghost" className="w-full justify-between p-0" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-6 w-6 text-primary" /> Créer un nouvel utilisateur
                </CardTitle>
                {isNewUserFormOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </MotionButton>
            </CollapsibleTrigger>
            <CardDescription>Créez un nouveau compte utilisateur avec un rôle spécifique.</CardDescription>
          </CardHeader>
          <CollapsibleContent className="space-y-4 p-4">
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
                <div>
                  <Label htmlFor="new-user-role">Rôle</Label>
                  <SimpleItemSelector
                    id="new-user-role"
                    options={rolesOptionsForNewUser}
                    value={newUserRole}
                    onValueChange={(value) => setNewUserRole(value as Profile['role'])}
                    searchQuery={newUserRoleSearchQuery}
                    onSearchQueryChange={setNewUserRoleSearchQuery}
                    placeholder="Sélectionner un rôle"
                    emptyMessage="Aucun rôle trouvé."
                    iconMap={iconMap}
                  />
                </div>
                {newUserRole !== 'administrator' && (currentRole === 'administrator' || (currentUserProfile?.establishment_id && ['director', 'deputy_director', 'professeur', 'tutor'].includes(currentRole || ''))) && (
                  <div>
                    <Label htmlFor="new-user-establishment">Établissement</Label>
                    <SimpleItemSelector
                      id="new-user-establishment"
                      options={establishmentsToDisplayForNewUser}
                      value={newUserEstablishmentId}
                      onValueChange={(value) => setNewUserEstablishmentId(value)}
                      searchQuery={newUserEstablishmentSearchQuery}
                      onSearchQueryChange={setNewUserEstablishmentSearchQuery}
                      placeholder="Sélectionner un établissement"
                      emptyMessage="Aucun établissement trouvé."
                      iconMap={iconMap}
                      disabled={currentRole !== 'administrator' && !!currentUserProfile?.establishment_id}
                    />
                  </div>
                )}
                {newUserRole === 'student' && (
                  <>
                    <div>
                      <Label htmlFor="new-user-enrollment-start-date" className="text-sm font-medium mb-2 block">Date de début d'inscription</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <MotionButton
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal rounded-android-tile",
                              !newUserEnrollmentStartDate && "text-muted-foreground"
                            )}
                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {newUserEnrollmentStartDate ? format(newUserEnrollmentStartDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                          </MotionButton>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 rounded-android-tile z-[9999]">
                          <Calendar
                            mode="single"
                            selected={newUserEnrollmentStartDate}
                            onSelect={setNewUserEnrollmentStartDate}
                            initialFocus
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="new-user-enrollment-end-date" className="text-sm font-medium mb-2 block">Date de fin d'inscription</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <MotionButton
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal rounded-android-tile",
                              !newUserEnrollmentEndDate && "text-muted-foreground"
                            )}
                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {newUserEnrollmentEndDate ? format(newUserEnrollmentEndDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                          </MotionButton>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 rounded-android-tile z-[9999]">
                            <Calendar
                              mode="single"
                              selected={newUserEnrollmentEndDate}
                              onSelect={setNewUserEnrollmentEndDate}
                              initialFocus
                              locale={fr}
                            />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </>
                )}
              </div>
              <MotionButton onClick={handleCreateUser} disabled={isCreatingUser || usernameAvailabilityStatus === 'checking' || emailAvailabilityStatus === 'checking' || (newUserRole === 'student' && (!newUserEnrollmentStartDate || !newUserEnrollmentEndDate)) || (newUserRole !== 'administrator' && !newUserEstablishmentId)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                {isCreatingUser ? <LoadingSpinner iconClassName="h-4 w-4 mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />} Créer l'utilisateur
              </MotionButton>
          </CollapsibleContent>
        </Collapsible>
      </MotionCard>

      {/* Section: Liste de tous les utilisateurs */}
      <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Liste des Utilisateurs
          </CardTitle>
          <CardDescription>Visualisez et gérez les utilisateurs existants.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou @username..."
                className="pl-10 rounded-android-tile"
                value={userListSearchQuery}
                onChange={(e) => setUserListSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex-shrink-0 sm:w-1/3">
              <Label htmlFor="role-filter">Filtrer par Rôle</Label>
              <SimpleItemSelector
                id="role-filter"
                options={[{ id: 'all', label: 'Tous les rôles', icon_name: 'Users' }, ...rolesOptionsForFilter]}
                value={selectedRoleFilter}
                onValueChange={(value) => setSelectedRoleFilter(value as Profile['role'] | 'all')}
                searchQuery={filterRoleSearchQuery}
                onSearchQueryChange={setFilterRoleSearchQuery}
                placeholder="Tous les rôles"
                emptyMessage="Aucun rôle trouvé."
                iconMap={iconMap}
              />
            </div>
            {(currentRole === 'administrator' || (currentUserProfile?.establishment_id && ['director', 'deputy_director', 'professeur', 'tutor'].includes(currentRole || ''))) && (
              <div className="flex-shrink-0 sm:w-1/3">
                <Label htmlFor="establishment-filter">Filtrer par Établissement</Label>
                <SimpleItemSelector
                  id="establishment-filter"
                  options={[{ id: 'all', label: 'Tous les établissements', icon_name: 'Building2' }, ...establishmentsToDisplayForFilter]}
                  value={selectedEstablishmentFilter}
                  onValueChange={(value) => setSelectedEstablishmentFilter(value)}
                  searchQuery={filterEstablishmentSearchQuery}
                  onSearchQueryChange={setFilterEstablishmentSearchQuery}
                  placeholder="Tous les établissements"
                  emptyMessage="Aucun établissement trouvé."
                  iconMap={iconMap}
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            {filteredUsersToDisplay.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                {userListSearchQuery.trim() === '' && selectedRoleFilter === 'all'
                  ? <span>Aucun utilisateur à afficher. Utilisez la recherche ou les filtres.</span>
                  : <span>Aucun utilisateur trouvé pour votre recherche ou vos filtres.</span>}
              </p>
            ) : (
              filteredUsersToDisplay.map((profile) => {
                const RoleIcon = iconMap[profile.role] || User;
                return (
                  <MotionCard key={profile.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)" }} whileTap={{ scale: 0.99 }}>
                    <div className="flex-grow">
                      <p className="font-medium flex items-center gap-2">
                        <RoleIcon className="h-4 w-4 text-primary" /> {profile.first_name} {profile.last_name} <span className="text-sm text-muted-foreground">(@{profile.username})</span>
                      </p>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                      <p className="text-xs text-muted-foreground">Rôle: {getRoleDisplayName(profile.role)}</p>
                      {profile.establishment_id && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {getEstablishmentName(profile.establishment_id, establishments)}
                        </p>
                      )}
                      {profile.enrollment_start_date && profile.enrollment_end_date && (
                        <p className="text-xs text-muted-foreground">
                          <span>Du {format(parseISO(profile.enrollment_start_date), 'dd/MM/yyyy', { locale: fr })} au {format(parseISO(profile.enrollment_end_date), 'dd/MM/yyyy', { locale: fr })})</span>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                      <MotionButton variant="outline" size="sm" onClick={() => handleSendMessageToUser(profile)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Mail className="h-4 w-4 mr-1" /> Message
                      </MotionButton>
                      <MotionButton variant="outline" size="sm" onClick={() => handleEditUser(profile)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Edit className="h-4 w-4" />
                      </MotionButton>
                      {currentRole === 'administrator' && (
                        <MotionButton variant="destructive" size="sm" onClick={() => handleDeleteUser(profile.id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Trash2 className="h-4 w-4" />
                        </MotionButton>
                      )}
                    </div>
                  </MotionCard>
                );
              })
            )}
          </div>
        </CardContent>
      </MotionCard>

      {/* Edit User Dialog */}
      {userToEdit && (
        <EditUserDialog
          isOpen={isEditUserDialogOpen}
          onClose={() => {
            setIsEditUserDialogOpen(false);
            setUserToEdit(null);
          }}
          userToEdit={userToEdit}
          onSave={handleSaveEditedUser}
          allProfiles={allUsers}
          establishments={establishments}
          currentUserRole={currentRole!}
          currentUserEstablishmentId={currentUserProfile?.establishment_id}
          fetchUserProfile={fetchUserProfile}
          checkUsernameExists={checkUsernameExists}
          checkEmailExists={checkEmailExists}
        />
      )}
    </div>
  );
};

export default AdminUserManagementPage;