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
  findProfileByUsername,
  updateProfile,
  deleteProfile,
  getAllStudentClassEnrollments, // Import getAllStudentClassEnrollments
  checkUsernameExists, // Import checkUsernameExists
  checkEmailExists, // Import checkEmailExists
} from '@/lib/studentData';
import { useCourseChat } from '@/contexts/CourseChatContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  loadClasses,
  loadCurricula,
  loadEstablishments, // Re-added loadEstablishments
  loadSchoolYears,
  getEstablishmentName, // Import getEstablishmentName
  getCurriculumName, // Import getCurriculumName
  getClassName, // Import getClassName
  getSchoolYearName, // Import getSchoolYearName
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
  const [allStudentClassEnrollments, setAllStudentClassEnrollments] = useState<StudentClassEnrollment[]>([]); // New state
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);

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
        setSchoolYears(await loadSchoolYears());
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

  // Removed local getEstablishmentName, getCurriculumName, getClassName declarations. Now imported.

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
      students = students.filter(p => p.establishment_id === selectedEstablishmentFilter || (p.role === 'administrator' && !p.establishment_id));
    } else if (currentRole !== 'administrator' && currentUserProfile?.establishment_id) {
      students = students.filter(p => p.establishment_id === currentUserProfile.establishment_id || (p.role === 'administrator' && !p.establishment_id));
    }

    if (studentSearchQuery.trim()) {
      const lowerCaseQuery = studentSearchQuery.toLowerCase();
      students = students.filter(s =>
        s.first_name?.toLowerCase().includes(lowerCaseQuery) ||
        s.last_name?.toLowerCase().includes(lowerCaseQuery) ||
        s.username?.toLowerCase().includes(lowerCaseQuery.replace('@', '')) ||
        s.email?.toLowerCase().includes(lowerCaseQuery)
      );
    }
    return students;
  }, [allProfiles, currentUserProfile, currentRole, studentSearchQuery, selectedEstablishmentFilter]);

  // Removed local getEstablishmentName, getCurriculumName, getClassName declarations. Now imported.

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
        <Collapsible open={isNewStudentFormOpen} onOpenChange={setIsNewStudentFormOpen}>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-6 w-6 text-primary" /> Créer un nouvel utilisateur
                </CardTitle>
                {isNewStudentFormOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </CollapsibleTrigger>
            <CardDescription>Créez un nouveau compte utilisateur avec un rôle spécifique.</CardDescription>
          </CardHeader>
          <CollapsibleContent className="space-y-4 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Prénom"
                  value={newStudentFirstName}
                  onChange={(e) => setNewStudentFirstName(e.target.value)}
                />
                <Input
                  placeholder="Nom"
                  value={newStudentLastName}
                  onChange={(e) => setNewStudentLastName(e.target.value)}
                />
                <InputWithStatus
                  placeholder="Nom d'utilisateur"
                  value={newStudentUsername}
                  onChange={(e) => handleNewStudentUsernameChange(e.target.value)}
                  status={usernameAvailabilityStatus}
                  errorMessage={usernameAvailabilityStatus === 'taken' ? "Nom d'utilisateur déjà pris" : undefined}
                />
                <InputWithStatus
                  type="email"
                  placeholder="Email"
                  value={newStudentEmail}
                  onChange={(e) => handleNewStudentEmailChange(e.target.value)}
                  status={emailAvailabilityStatus}
                  errorMessage={emailAvailabilityStatus === 'taken' ? "Email déjà enregistré" : undefined}
                />
                <Input
                  type="password"
                  placeholder="Mot de passe"
                  value={newStudentPassword}
                  onChange={(e) => setNewStudentPassword(e.target.value)}
                />
                <div>
                  <Label htmlFor="new-user-role">Rôle</Label>
                  <Select value={'student'} onValueChange={() => {}}> {/* Fixed to 'student' for this page */}
                    <SelectTrigger id="new-user-role" className="rounded-android-tile">
                      <SelectValue placeholder="Élève" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-lg bg-background/80 z-[9999] rounded-android-tile">
                      <SelectItem value="student">Élève</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(currentRole === 'administrator' || (currentUserProfile?.establishment_id && ['director', 'deputy_director', 'professeur', 'tutor'].includes(currentRole || ''))) && (
                  <div>
                    <Label htmlFor="new-user-establishment">Établissement</Label>
                    <Select value={newStudentEstablishmentId || ""} onValueChange={(value) => setNewStudentEstablishmentId(value === "none" ? null : value)} disabled={currentRole !== 'administrator' && !!currentUserProfile?.establishment_id}>
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
                {/* Enrollment dates are always for students */}
                <>
                  <div>
                    <Label htmlFor="new-user-enrollment-start-date" className="text-sm font-medium mb-2 block">Date de début d'inscription</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal rounded-android-tile",
                            !newStudentEnrollmentStartDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {newStudentEnrollmentStartDate ? format(newStudentEnrollmentStartDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 rounded-android-tile z-[9999]">
                        <Calendar
                          mode="single"
                          selected={newStudentEnrollmentStartDate}
                          onSelect={setNewStudentEnrollmentStartDate}
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
                            !newStudentEnrollmentEndDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {newStudentEnrollmentEndDate ? format(newStudentEnrollmentEndDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 rounded-android-tile z-[9999]">
                          <Calendar
                            mode="single"
                            selected={newStudentEnrollmentEndDate}
                            onSelect={setNewStudentEnrollmentEndDate}
                            initialFocus
                            locale={fr}
                          />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              </div>
              <Button onClick={handleCreateStudent} disabled={isCreatingStudent || usernameAvailabilityStatus === 'checking' || emailAvailabilityStatus === 'checking' || (!newStudentEnrollmentStartDate || !newStudentEnrollmentEndDate) || !newStudentEstablishmentId}>
                {isCreatingStudent ? <LoadingSpinner iconClassName="h-4 w-4 mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />} Créer l'utilisateur
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
              <Select value={'student'} onValueChange={() => {}} disabled> {/* Fixed to 'student' for this page */}
                <SelectTrigger id="role-filter" className="rounded-android-tile">
                  <SelectValue placeholder="Élève" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-lg bg-background/80 z-[9999] rounded-android-tile">
                  <SelectItem value="student">Élève</SelectItem>
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
            {studentsToDisplay.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                {studentSearchQuery.trim() === '' && selectedEstablishmentFilter === 'all'
                  ? <span>Aucun élève à afficher. Utilisez la recherche ou les filtres.</span>
                  : <span>Aucun élève trouvé pour votre recherche ou vos filtres.</span>}
              </p>
            ) : (
              studentsToDisplay.map((profile) => {
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
                      <Button variant="outline" size="sm" onClick={() => handleSendMessageToStudent(profile)}>
                        <Mail className="h-4 w-4 mr-1" /> Message
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        // This page is for student management, so the edit dialog should be for students
                        // The AdminUserManagementPage handles editing all roles.
                        // For now, we'll just log a message or redirect if needed.
                        showError("L'édition des profils d'élèves se fait via la page de gestion des utilisateurs.");
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {currentRole === 'administrator' && (
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteStudent(profile.id)}>
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
    </div>
  );
};

export default StudentManagementPage;