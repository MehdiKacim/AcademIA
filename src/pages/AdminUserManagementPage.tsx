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
import { 
  PlusCircle, UserPlus, UserCheck, Check, XCircle, Mail, Search, Edit, Trash2, UserRoundCog, ChevronDown, ChevronUp, Building2, UserX, CalendarDays,
  Home, MessageSquare, User, LogOut, Settings, Info, BookOpen, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, 
  ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, BookText, UserCog, TrendingUp, BookMarked,
  Users // Ajout de l'icône Users
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useRole } from '@/contexts/RoleContext';
import { getAllProfiles, checkUsernameExists, checkEmailExists, deleteProfile, updateProfile, getProfileById } from '@/lib/studentData';
import { Profile, ALL_ROLES, Establishment } from '@/lib/dataModels'; // Import Establishment
import { loadEstablishments } from '@/lib/courseData'; // Import loadEstablishments
import { supabase } from '@/integrations/supabase/client';
import InputWithStatus from '@/components/InputWithStatus';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

// Map icon_name strings to Lucide React components (already present in RoleNavConfigsPage, but needed here)
const iconMap: { [key: string]: React.ElementType } = {
  Home: Home, MessageSquare: MessageSquare, Search: Search, User: User, LogOut: LogOut, Settings: Settings, Info: Info, BookOpen: BookOpen, PlusSquare: PlusCircle, Users: Users, GraduationCap: GraduationCap, PenTool: PenTool, NotebookText: NotebookText, School: School, LayoutList: LayoutList, BriefcaseBusiness: BriefcaseBusiness, UserRoundCog: UserRoundCog, ClipboardCheck: ClipboardCheck, BotMessageSquare: BotMessageSquare, LayoutDashboard: LayoutDashboard, LineChart: LineChart, UsersRound: UsersRound, UserRoundSearch: UserRoundSearch, BellRing: BellRing, Building2: Building2, BookText: BookText, UserCog: UserCog, TrendingUp: TrendingUp, BookMarked: BookMarked, CalendarDays: CalendarDays, UserCheck: UserCheck,
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
  const [newUserEstablishmentId, setNewUserEstablishmentId] = useState<string | null>(null); // New: for establishment_id
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
  const [selectedEstablishmentFilter, setSelectedEstablishmentFilter] = useState<string | 'all'>('all'); // New: for establishment filter

  // States for editing user
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Profile | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<Profile['role']>('student');
  const [editEstablishmentId, setEditEstablishmentId] = useState<string | null>(null); // New: for establishment_id
  const [editEnrollmentStartDate, setEditEnrollmentStartDate] = useState<Date | undefined>(undefined);
  const [editEnrollmentEndDate, setEditEnrollmentEndDate] = useState<Date | undefined>(undefined);
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
      setNewUserRole('professeur');
      setNewUserEstablishmentId(currentUserProfile?.establishment_id || null); // Default to user's establishment
      setSelectedEstablishmentFilter(currentUserProfile?.establishment_id || 'all');
    } else if (currentRole === 'administrator') {
      setSelectedRoleFilter('all');
      setNewUserRole('director');
      setNewUserEstablishmentId(null); // Admin can create for any/no establishment
      setSelectedEstablishmentFilter('all');
    } else {
      setSelectedRoleFilter('student');
      setNewUserRole('student');
      setNewUserEstablishmentId(currentUserProfile?.establishment_id || null); // Default to user's establishment
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

    // Role-based creation restrictions and defaults
    if (currentRole === 'director' || currentRole === 'deputy_director') {
      if (!['professeur', 'tutor', 'student'].includes(newUserRole)) {
        showError("Les directeurs ne peuvent créer que des professeurs, tuteurs ou des élèves.");
        return;
      }
      // Force establishment_id to current user's establishment
      finalNewUserEstablishmentId = currentUserProfile.establishment_id || null;
    } else if (currentRole === 'professeur' || currentRole === 'tutor') {
      if (newUserRole !== 'student') {
        showError("Les professeurs et tuteurs ne peuvent créer que des élèves.");
        return;
      }
      // Force establishment_id to current user's establishment
      finalNewUserEstablishmentId = currentUserProfile.establishment_id || null;
    } else if (currentRole === 'administrator') {
      // Admin can create any role, and assign any establishment_id (or null)
      if (['director', 'deputy_director', 'professeur', 'tutor', 'student'].includes(newUserRole) && !finalNewUserEstablishmentId) {
        showError("Un établissement est requis pour les rôles de directeur, directeur adjoint, professeur, tuteur et élève.");
        return;
      }
      if (newUserRole === 'administrator') {
        finalNewUserEstablishmentId = null; // Admins are not linked to establishments
      }
    }

    // Enrollment dates are only for students
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
  );

  const establishmentsToDisplayForFilter = establishments.filter(est => 
    currentRole === 'administrator' || est.id === currentUserProfile?.establishment_id
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion des Utilisateurs
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Gérez les profils des utilisateurs de la plateforme.
      </p>

      {/* Section: Créer un nouvel utilisateur */}
      <Card className="rounded-android-tile">
        <Collapsible open={isNewUserFormOpen} onOpenChange={setIsNewUserFormOpen}>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-6 w-6 text-primary" /> Créer un nouvel utilisateur
                </CardTitle>
                {isNewUserFormOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
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
                  <Select value={newUserRole} onValueChange={(value: Profile['role']) => setNewUserRole(value)}>
                    <SelectTrigger id="new-user-role" className="rounded-android-tile">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-lg bg-background/80 rounded-android-tile">
                      {rolesForNewUserCreation
                        .map(role => (
                          <SelectItem key={role} value={role}>
                            {getRoleDisplayName(role)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                {newUserRole !== 'administrator' && (currentRole === 'administrator' || (currentUserProfile?.establishment_id && ['director', 'deputy_director', 'professeur', 'tutor'].includes(currentRole || ''))) && (
                  <div>
                    <Label htmlFor="new-user-establishment">Établissement</Label>
                    <Select value={newUserEstablishmentId || ""} onValueChange={(value) => setNewUserEstablishmentId(value === "none" ? null : value)} disabled={currentRole !== 'administrator' && !!currentUserProfile?.establishment_id}>
                      <SelectTrigger id="new-user-establishment" className="rounded-android-tile">
                        <SelectValue placeholder="Sélectionner un établissement" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-lg bg-background/80 rounded-android-tile">
                        {currentRole === 'administrator' && <SelectItem value="none">Aucun (pour administrateur)</SelectItem>}
                        {establishmentsToDisplayForNewUser.map(est => (
                          <SelectItem key={est.id} value={est.id}>
                            {est.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {newUserRole === 'student' && (
                  <>
                    <div>
                      <Label htmlFor="new-user-enrollment-start-date" className="text-sm font-medium mb-2 block">Date de début d'inscription</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal rounded-android-tile",
                              !newUserEnrollmentStartDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {newUserEnrollmentStartDate ? format(newUserEnrollmentStartDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 rounded-android-tile">
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
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal rounded-android-tile",
                              !newUserEnrollmentEndDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {newUserEnrollmentEndDate ? format(newUserEnrollmentEndDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 rounded-android-tile">
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
              <Button onClick={handleCreateUser} disabled={isCreatingUser || usernameAvailabilityStatus === 'checking' || emailAvailabilityStatus === 'checking' || (newUserRole === 'student' && (!newUserEnrollmentStartDate || !newUserEnrollmentEndDate)) || (newUserRole !== 'administrator' && !newUserEstablishmentId)}>
                {isCreatingUser ? <LoadingSpinner iconClassName="h-4 w-4 mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />} Créer l'utilisateur
              </Button>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Section: Liste de tous les utilisateurs */}
      <Card className="rounded-android-tile">
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
              <Select value={selectedRoleFilter} onValueChange={(value: Profile['role'] | 'all') => setSelectedRoleFilter(value)}>
                <SelectTrigger id="role-filter" className="rounded-android-tile">
                  <SelectValue placeholder="Tous les rôles" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-lg bg-background/80 rounded-android-tile">
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  {rolesForFilter
                    .map(role => (
                          <SelectItem key={role} value={role}>
                            {getRoleDisplayName(role)}
                          </SelectItem>
                        ))}
                </SelectContent>
              </Select>
            </div>
            {(currentRole === 'administrator' || (currentUserProfile?.establishment_id && ['director', 'deputy_director', 'professeur', 'tutor'].includes(currentRole || ''))) && (
              <div className="flex-shrink-0 sm:w-1/3">
                <Label htmlFor="establishment-filter">Filtrer par Établissement</Label>
                <Select value={selectedEstablishmentFilter} onValueChange={(value: string | 'all') => setSelectedEstablishmentFilter(value)}>
                  <SelectTrigger id="establishment-filter" className="rounded-android-tile">
                    <SelectValue placeholder="Tous les établissements" />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-lg bg-background/80 rounded-android-tile">
                    <SelectItem value="all">Tous les établissements</SelectItem>
                    {establishmentsToDisplayForFilter.map(est => (
                      <SelectItem key={est.id} value={est.id}>
                        {est.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Card key={profile.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-android-tile">
                    <div className="flex-grow">
                      <p className="font-medium flex items-center gap-2">
                        <RoleIcon className="h-4 w-4 text-primary" /> {profile.first_name} {profile.last_name} <span className="text-sm text-muted-foreground">(@{profile.username})</span>
                      </p>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                      <p className="text-xs text-muted-foreground">Rôle: {getRoleDisplayName(profile.role)}</p>
                      {profile.establishment_id && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {getEstablishmentName(profile.establishment_id)}
                        </p>
                      )}
                      {profile.enrollment_start_date && profile.enrollment_end_date && (
                        <p className="text-xs text-muted-foreground">
                          <span>Du {format(parseISO(profile.enrollment_start_date), 'dd/MM/yyyy', { locale: fr })} au {format(parseISO(profile.enrollment_end_date), 'dd/MM/yyyy', { locale: fr })})</span>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                      <Button variant="outline" size="sm" onClick={() => handleSendMessageToUser(profile)}>
                        <Mail className="h-4 w-4 mr-1" /> Message
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setUserToEdit(profile);
                        setEditFirstName(profile.first_name || '');
                        setEditLastName(profile.last_name || '');
                        setEditUsername(profile.username);
                        setEditEmail(profile.email || '');
                        setEditRole(profile.role);
                        setEditEstablishmentId(profile.establishment_id || null);
                        setEditEnrollmentStartDate(profile.enrollment_start_date ? parseISO(profile.enrollment_start_date) : undefined);
                        setEditEnrollmentEndDate(profile.enrollment_end_date ? parseISO(profile.enrollment_end_date) : undefined);
                        setIsEditDialogOpen(true);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {currentRole === 'administrator' && (
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(profile.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      {userToEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] backdrop-blur-lg bg-background/80 rounded-android-tile">
            <div className="flex flex-col">
              <DialogHeader>
                <DialogTitle>Modifier l'utilisateur</DialogTitle>
                <DialogDescription>
                  Mettez à jour les informations de l'utilisateur.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 flex-grow">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-first-name" className="text-right">
                    Prénom
                  </Label>
                  <Input
                    id="edit-first-name"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-last-name" className="text-right">
                    Nom
                  </Label>
                  <Input
                    id="edit-last-name"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-username" className="text-right">
                    Nom d'utilisateur
                  </Label>
                  <InputWithStatus
                    id="edit-username"
                    value={editUsername}
                    onChange={(e) => {
                      setEditUsername(e.target.value);
                      if (debounceTimeoutRefEditUsername.current) clearTimeout(debounceTimeoutRefEditUsername.current);
                      if (e.target.value.trim() === '') {
                        setEditUsernameAvailabilityStatus('idle');
                        return;
                      }
                      debounceTimeoutRefEditUsername.current = setTimeout(() => {
                        validateUsername(e.target.value, userToEdit.id).then(isValid => setEditUsernameAvailabilityStatus(isValid ? 'available' : 'taken'));
                      }, 500);
                    }}
                    status={editUsernameAvailabilityStatus}
                    errorMessage={editUsernameAvailabilityStatus === 'taken' ? "Nom d'utilisateur déjà pris" : undefined}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right">
                    Email
                  </Label>
                  <InputWithStatus
                    id="edit-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => {
                      setEditEmail(e.target.value);
                      if (debounceTimeoutRefEditEmail.current) clearTimeout(debounceTimeoutRefEditEmail.current);
                      if (e.target.value.trim() === '') {
                        setEditEmailAvailabilityStatus('idle');
                        return;
                      }
                      debounceTimeoutRefEditEmail.current = setTimeout(() => {
                        validateEmail(e.target.value, userToEdit.id).then(isValid => setEditEmailAvailabilityStatus(isValid ? 'available' : 'taken'));
                      }, 500);
                    }}
                    status={editEmailAvailabilityStatus}
                    errorMessage={editEmailAvailabilityStatus === 'taken' ? "Email déjà enregistré" : undefined}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-role" className="text-right">
                    Rôle
                  </Label>
                  <Select value={editRole} onValueChange={(value: Profile['role']) => setEditRole(value)} disabled={currentRole !== 'administrator'}>
                    <SelectTrigger id="edit-role" className="col-span-3 rounded-android-tile">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-lg bg-background/80 rounded-android-tile">
                      {ALL_ROLES
                        .filter(role => {
                          if (currentRole === 'administrator') return true;
                          if (currentRole === 'director' || currentRole === 'deputy_director') return ['professeur', 'tutor', 'student'].includes(role);
                          if (currentRole === 'professeur' || currentRole === 'tutor') return role === 'student';
                          return false;
                        })
                        .map(role => (
                          <SelectItem key={role} value={role}>
                            {getRoleDisplayName(role)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                {editRole !== 'administrator' && (currentRole === 'administrator' || (currentUserProfile?.establishment_id && ['director', 'deputy_director', 'professeur', 'tutor'].includes(currentRole || ''))) && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-establishment" className="text-right">
                      Établissement
                    </Label>
                    <Select value={editEstablishmentId || ""} onValueChange={(value) => setEditEstablishmentId(value === "none" ? null : value)} disabled={currentRole !== 'administrator' && !!currentUserProfile?.establishment_id}>
                      <SelectTrigger id="edit-establishment" className="col-span-3 rounded-android-tile">
                        <SelectValue placeholder="Sélectionner un établissement" />
                      </SelectTrigger>
                      <SelectContent className="backdrop-blur-lg bg-background/80 rounded-android-tile">
                        {currentRole === 'administrator' && <SelectItem value="none">Aucun (pour administrateur)</SelectItem>}
                        {establishmentsToDisplayForNewUser.map(est => (
                          <SelectItem key={est.id} value={est.id}>
                            {est.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {editRole === 'student' && (
                  <>
                    <div>
                      <Label htmlFor="edit-enrollment-start-date" className="text-sm font-medium mb-2 block">Date de début d'inscription</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal rounded-android-tile",
                              !editEnrollmentStartDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {editEnrollmentStartDate ? format(editEnrollmentStartDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 rounded-android-tile">
                          <Calendar
                            mode="single"
                            selected={editEnrollmentStartDate}
                            onSelect={setEditEnrollmentStartDate}
                            initialFocus
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="edit-enrollment-end-date" className="text-sm font-medium mb-2 block">Date de fin d'inscription</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal rounded-android-tile",
                              !editEnrollmentEndDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {editEnrollmentEndDate ? format(editEnrollmentEndDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 rounded-android-tile">
                          <Calendar
                            mode="single"
                            selected={editEnrollmentEndDate}
                            onSelect={setEditEnrollmentEndDate}
                            initialFocus
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button onClick={async () => {
                  if (!userToEdit) return;
                  if (!editFirstName.trim() || !editLastName.trim() || !editUsername.trim() || !editEmail.trim()) {
                    showError("Tous les champs sont requis.");
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
                  if (editRole === 'student' && (!editEnrollmentStartDate || !editEnrollmentEndDate)) {
                    showError("Les dates d'inscription sont requises pour les élèves.");
                    return;
                  }
                  if (editEnrollmentStartDate && editEnrollmentEndDate && editEnrollmentStartDate >= editEnrollmentEndDate) {
                    showError("La date de fin d'inscription doit être postérieure à la date de début.");
                    return;
                  }
                  if (editRole !== 'administrator' && !editEstablishmentId) {
                    showError("Un établissement est requis pour ce rôle.");
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
                      establishment_id: editEstablishmentId,
                      enrollment_start_date: editEnrollmentStartDate ? editEnrollmentStartDate.toISOString().split('T')[0] : undefined,
                      enrollment_end_date: editEnrollmentEndDate ? editEnrollmentEndDate.toISOString().split('T')[0] : undefined,
                    };
                    await updateProfile(updatedProfileData);

                    // Update auth.users email and user_metadata if changed
                    const { data: { user: authUser } } = await supabase.auth.getUser();
                    if (authUser && (editEmail.trim() !== authUser.email || editEstablishmentId !== userToEdit.establishment_id || editRole !== userToEdit.role)) {
                      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(userToEdit.id, { 
                        email: editEmail.trim(),
                        user_metadata: {
                          ...authUser.user_metadata, // Keep existing metadata
                          email: editEmail.trim(), // Ensure email is updated in metadata
                          establishment_id: editEstablishmentId,
                          role: editRole,
                        }
                      });
                      if (authUpdateError) {
                        showError(`Erreur lors de la mise à jour de l'email/rôle/établissement d'authentification: ${authUpdateError.message}`);
                        return;
                      }
                    }

                    showSuccess("Utilisateur mis à jour avec succès !");
                    await fetchUserProfile(userToEdit.id); // Re-fetch current user's profile to update context
                    setAllUsers(await getAllProfiles()); // Re-fetch all users for list
                    setIsEditDialogOpen(false);
                    setUserToEdit(null);
                  } catch (error: any) {
                    console.error("Error saving user edit:", error);
                    showError(`Erreur lors de la sauvegarde des modifications: ${error.message}`);
                  } finally {
                    setIsSavingEdit(false);
                  }
                }} disabled={isSavingEdit || editUsernameAvailabilityStatus === 'checking' || editEmailAvailabilityStatus === 'checking' || (editRole === 'student' && (!editEnrollmentStartDate || !editEnrollmentEndDate)) || (editRole !== 'administrator' && !editEstablishmentId)}>
                  {isSavingEdit ? <LoadingSpinner iconClassName="h-4 w-4 mr-2" /> : "Enregistrer les modifications"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminUserManagementPage;