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
import { PlusCircle, Trash2, Users, GraduationCap, Mail, Search, UserCheck, UserX, Loader2, XCircle, CalendarDays, School, ChevronDown, ChevronUp, UserPlus, Building2 } from "lucide-react"; // Import UserPlus, Building2
import { Class, Profile, Curriculum, StudentClassEnrollment, SchoolYear, Establishment } from "@/lib/dataModels"; // Import Establishment
import { showSuccess, showError } from "@/utils/toast";
import {
  getAllProfiles,
  updateProfile,
  deleteProfile,
  getAllStudentClassEnrollments,
  checkUsernameExists, // Import checkUsernameExists
  checkEmailExists, // Import checkEmailExists
} from '@/lib/studentData';
import { useCourseChat } from '@/contexts/CourseChatContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  loadClasses,
  loadCurricula,
  loadEstablishments, // Re-added loadEstablishments
} from '@/lib/courseData';

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";
import InputWithStatus from '@/components/InputWithStatus'; // Import InputWithStatus
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"; // Import Collapsible
import { supabase } from '@/integrations/supabase/client'; // Import supabase

const StudentManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const { openChat } = useCourseChat();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]); // Re-added establishments state
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [allStudentClassEnrollments, setAllStudentClassEnrollments] = useState<StudentClassEnrollment[]>([]);

  // States for new student creation form
  const [newStudentFirstName, setNewStudentFirstName] = useState('');
  const [newStudentLastName, setNewStudentLastName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newStudentEstablishmentId, setNewStudentEstablishmentId] = useState<string | null>(null); // Re-added newStudentEstablishmentId
  const [newStudentEnrollmentStartDate, setNewStudentEnrollmentStartDate] = useState<Date | undefined>(undefined);
  const [newStudentEnrollmentEndDate, setNewStudentEnrollmentEndDate] = useState<Date | undefined>(undefined);
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);
  const [isNewStudentFormOpen, setIsNewStudentFormOpen] = useState(false);

  const [usernameAvailabilityStatus, setUsernameAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailAvailabilityStatus, setEmailAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const debounceTimeoutRefUsername = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimeoutRefEmail = useRef<ReturnType<typeof setTimeout> | null>(null);

  // States for student list section
  const [studentSearchQuery, setSearchStudentQuery] = useState('');
  const [selectedEstablishmentFilter, setSelectedEstablishmentFilter] = useState<string | 'all'>('all'); // Re-added selectedEstablishmentFilter

  // Get classId from URL for initial filtering (now removed from student list)
  const classIdFromUrl = searchParams.get('classId');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setClasses(await loadClasses());
        setCurricula(await loadCurricula());
        setEstablishments(await loadEstablishments()); // Re-added loadEstablishments
        setAllProfiles(await getAllProfiles());
        setAllStudentClassEnrollments(await getAllStudentClassEnrollments());
      } catch (error: any) {
        console.error("Error fetching data for StudentManagementPage:", error);
        showError(`Erreur lors du chargement des données de gestion des élèves: ${error.message}`);
      }
    };
    fetchData();
  }, [currentUserProfile]);

  // Set initial establishment filter based on user role
  useEffect(() => {
    if (currentRole === 'administrator') {
      setSelectedEstablishmentFilter('all');
      setNewStudentEstablishmentId(null);
    } else if (currentUserProfile?.establishment_id) {
      setSelectedEstablishmentFilter(currentUserProfile.establishment_id);
      setNewStudentEstablishmentId(currentUserProfile.establishment_id);
    } else {
      setSelectedEstablishmentFilter('all');
      setNewStudentEstablishmentId(null);
    }
  }, [currentRole, currentUserProfile?.id, currentUserProfile?.establishment_id]);

  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';
  const getCurriculumName = (id?: string) => curricula.find(c => c.id === id)?.name || 'N/A';
  const getClassName = (id?: string) => classes.find(c => c.id === id)?.name || 'N/A';

  // --- New Student Creation Logic ---
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
    if (isTaken && (!currentUserId || allProfiles.find(u => u.username === username)?.id !== currentUserId)) {
      setUsernameAvailabilityStatus('taken');
      return false;
    }
    setUsernameAvailabilityStatus('available');
    return true;
  }, [allProfiles]);

  const validateEmail = useCallback(async (email: string, currentUserId?: string) => {
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailAvailabilityStatus('idle');
      return false;
    }
    setEmailAvailabilityStatus('checking');
    const isTaken = await checkEmailExists(email);
    if (isTaken && (!currentUserId || allProfiles.find(u => u.email === email)?.id !== currentUserId)) {
      setEmailAvailabilityStatus('taken');
      return false;
    }
    setEmailAvailabilityStatus('available');
    return true;
  }, [allProfiles]);

  const handleNewStudentUsernameChange = (value: string) => {
    setNewStudentUsername(value);
    if (debounceTimeoutRefUsername.current) clearTimeout(debounceTimeoutRefUsername.current);
    if (value.trim() === '') {
      setUsernameAvailabilityStatus('idle');
      return;
    }
    debounceTimeoutRefUsername.current = setTimeout(() => {
      validateUsername(value);
    }, 500);
  };

  const handleNewStudentEmailChange = (value: string) => {
    setNewStudentEmail(value);
    if (debounceTimeoutRefEmail.current) clearTimeout(debounceTimeoutRefEmail.current);
    if (value.trim() === '') {
      setEmailAvailabilityStatus('idle');
      return;
    }
    debounceTimeoutRefEmail.current = setTimeout(() => {
      validateEmail(value);
    }, 500);
  };

  const handleCreateStudent = async () => {
    if (!currentUserProfile || !['administrator', 'director', 'deputy_director', 'professeur', 'tutor'].includes(currentRole || '')) {
      showError("Vous n'êtes pas autorisé à créer des élèves.");
      return;
    }
    if (!newStudentFirstName.trim() || !newStudentLastName.trim() || !newStudentUsername.trim() || !newStudentEmail.trim() || !newStudentPassword.trim() || !newStudentEnrollmentStartDate || !newStudentEnrollmentEndDate) {
      showError("Tous les champs requis doivent être remplis.");
      return;
    }
    if (newStudentPassword.trim().length < 6) {
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
    if (!newStudentEstablishmentId) {
      showError("L'établissement est requis pour créer un élève.");
      return;
    }

    // Role-based creation restrictions and defaults
    if ((currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'professeur' || currentRole === 'tutor') && newStudentEstablishmentId !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez créer des élèves que dans votre établissement.");
      return;
    }

    setIsCreatingStudent(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user-with-role', {
        body: {
          email: newStudentEmail.trim(),
          password: newStudentPassword.trim(),
          first_name: newStudentFirstName.trim(),
          last_name: newStudentLastName.trim(),
          username: newStudentUsername.trim(),
          role: 'student', // Fixed role for this page
          establishment_id: newStudentEstablishmentId,
          enrollment_start_date: newStudentEnrollmentStartDate.toISOString().split('T')[0],
          enrollment_end_date: newStudentEnrollmentEndDate.toISOString().split('T')[0],
        },
      });

      if (error) {
        console.error("Error creating student via Edge Function:", error);
        showError(`Erreur lors de la création de l'élève: ${error.message}`);
        return;
      }
      
      showSuccess(`Élève ${newStudentFirstName} ${newStudentLastName} créé avec succès !`);
      setNewStudentFirstName('');
      setNewStudentLastName('');
      setNewStudentUsername('');
      setNewStudentEmail('');
      setNewStudentPassword('');
      setNewStudentEstablishmentId(currentUserProfile?.establishment_id || null);
      setNewStudentEnrollmentStartDate(undefined);
      setNewStudentEnrollmentEndDate(undefined);
      setUsernameAvailabilityStatus('idle');
      setEmailAvailabilityStatus('idle');
      setAllProfiles(await getAllProfiles()); // Refresh profiles
      setIsNewStudentFormOpen(false);
    } catch (error: any) {
      console.error("Unexpected error creating student:", error);
      showError(`Une erreur inattendue est survenue: ${error.message}`);
    } finally {
      setIsCreatingStudent(false);
    }
  };

  const handleDeleteStudent = async (studentProfileId: string) => {
    if (!currentUserProfile || currentRole !== 'administrator') { // Only administrator can delete
      showError("Vous n'êtes pas autorisé à supprimer des élèves.");
      return;
    }
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet élève ? Cette action est irréversible et supprimera également son compte utilisateur et toutes les données associées.")) {
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(studentProfileId);
        if (authError) {
          console.error("Error deleting user from auth.users:", authError);
          showError(`Erreur lors de la suppression du compte utilisateur: ${authError.message}`);
          return;
        }
        
        // The profile and enrollments should be cascade deleted by DB foreign keys
        // Re-fetch all data to update the UI
        setAllProfiles(await getAllProfiles());
        setAllStudentClassEnrollments(await getAllStudentClassEnrollments());
        showSuccess("Élève et compte supprimés !");
      } catch (error: any) {
        console.error("Error deleting student:", error);
        showError(`Erreur lors de la suppression de l'élève: ${error.message}`);
      }
    }
  };

  const handleSendMessageToStudent = (studentProfile: Profile) => {
    navigate(`/messages?contactId=${studentProfile.id}`);
  };

  const studentsToDisplay = React.useMemo(() => {
    let students = allProfiles.filter(p => p.role === 'student');

    // Filter by current user's establishment if not admin
    if (currentRole !== 'administrator' && currentUserProfile?.establishment_id) {
      students = students.filter(s => s.establishment_id === currentUserProfile.establishment_id);
    }
    
    // Apply establishment filter
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
                    <SelectContent className="backdrop-blur-lg bg-background/80 z-[9999] rounded-android-tile">
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
                    <SelectContent className="backdrop-blur-lg bg-background/80 z-[9999] rounded-android-tile">
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
                        <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 z-[9999] rounded-android-tile">
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
                        <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 z-[9999] rounded-android-tile">
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
                <SelectContent className="backdrop-blur-lg bg-background/80 z-[9999] rounded-android-tile">
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
                  <SelectContent className="backdrop-blur-lg bg-background/80 z-[9999] rounded-android-tile">
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
                    <SelectContent className="backdrop-blur-lg bg-background/80 z-[9999] rounded-android-tile">
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
                      <SelectContent className="backdrop-blur-lg bg-background/80 z-[9999] rounded-android-tile">
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
                        <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 z-[9999] rounded-android-tile">
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
                        <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 z-[9999] rounded-android-tile">
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