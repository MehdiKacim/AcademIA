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
import { PlusCircle, UserPlus, UserCheck, Check, XCircle, Mail, Search, Edit, Trash2, UserRoundCog, ChevronDown, ChevronUp, Building2, UserX, CalendarDays } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useRole } from '@/contexts/RoleContext';
import { getAllProfiles, checkUsernameExists, checkEmailExists, deleteProfile, updateProfile, getProfileById } from '@/lib/studentData';
import { Profile } from '@/lib/dataModels'; // Removed Establishment import
import { supabase } from '@/integrations/supabase/client';
import InputWithStatus from '@/components/InputWithStatus';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Removed loadEstablishments import
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useNavigate } from 'react-router-dom'; // Import useNavigate
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
} from "@/components/ui/dialog"; // Import Dialog components
import LoadingSpinner from "@/components/LoadingSpinner"; // Import LoadingSpinner

const AdminUserManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser, fetchUserProfile } = useRole();
  const navigate = useNavigate(); // Initialize useNavigate

  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  // Removed establishments state

  // States for new user creation form
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<Profile['role']>(
    (currentRole === 'director' || currentRole === 'deputy_director') ? 'professeur' : 'student'
  );
  // Removed newUserEstablishmentId
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
  // Removed selectedEstablishmentFilter

  // States for editing user
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Profile | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<Profile['role']>('student');
  // Removed editEstablishmentId
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
      // Removed loadEstablishments
    };
    fetchData();
  }, [currentUserProfile]);

  // Set default filters based on role
  useEffect(() => {
    if ((currentRole === 'director' || currentRole === 'deputy_director')) {
      setSelectedRoleFilter('professeur');
      // Removed setSelectedEstablishmentFilter
      setNewUserRole('professeur'); // Default new user role for directors
      // Removed setNewUserEstablishmentId
    } else if (currentRole === 'administrator') { // Admin specific defaults
      setSelectedRoleFilter('all'); // Admin can see all roles by default
      // Removed setSelectedEstablishmentFilter
      setNewUserRole('director'); // Admin defaults to creating directors
      // Removed setNewUserEstablishmentId
    } else { // Professeur/Tutor defaults
      setSelectedRoleFilter('student');
      // Removed setSelectedEstablishmentId
      setNewUserRole('student');
      // Removed setNewUserEstablishmentId
    }
  }, [currentRole, currentUserProfile?.id]); // Changed dependency from establishment_id to id

  // Removed getEstablishmentName

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
    // Removed finalNewUserEstablishmentId
    let finalNewUserEnrollmentStartDate = newUserEnrollmentStartDate;
    let finalNewUserEnrollmentEndDate = newUserEnrollmentEndDate;

    // Role-based creation restrictions and defaults
    if (currentRole === 'director' || currentRole === 'deputy_director') {
      // For directors, the default role on this page is 'professeur', but they can also create 'tutor' or 'student'
      if (!['professeur', 'tutor', 'student'].includes(newUserRole)) {
        showError("Les directeurs ne peuvent créer que des professeurs, tuteurs ou des élèves.");
        return;
      }
      // Removed establishment_id logic for directors
    } else if (currentRole === 'professeur' || currentRole === 'tutor') { // Professors and Tutors can only create students
      if (newUserRole !== 'student') {
        showError("Les professeurs et tuteurs ne peuvent créer que des élèves.");
        return;
      }
      // Removed establishment_id logic for professors/tutors
    } else if (currentRole === 'administrator') {
      // Admin can only create director, deputy_director, or other administrators
      if (!['director', 'deputy_director', 'administrator'].includes(newUserRole)) {
        showError("Les administrateurs ne peuvent créer que des directeurs, directeurs adjoints ou d'autres administrateurs.");
        return;
      }
      // Removed establishment_id requirement for admin
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
          // Removed establishment_id
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
        (currentRole === 'professeur' || currentRole === 'tutor') ? 'student' : 'director' // Admin defaults to director
      ); // Reset to default based on role
      // Removed setNewUserEstablishmentId
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

  // Removed Debounced search for student to assign to establishment (Admin only)
  // Removed handleAssignStudentToEstablishment
  // Removed handleClearEstAssignmentForm
  // Removed filteredStudentsForEstDropdown

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

  const handleUnassignStudentFromEstablishment = async (studentId: string, studentName: string) => {
    showError("La gestion des établissements a été supprimée.");
    return;
  };

  const handleSendMessageToUser = (studentProfile: Profile) => {
    navigate(`/messages?contactId=${studentProfile.id}`);
  };

  const studentsToDisplay = React.useMemo(() => {
    let students = allProfiles.filter(p => p.role === 'student');

    // Removed filtering by current user's establishment
    
    // Removed establishment filter
    
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
  }, [allProfiles, currentUserProfile, currentRole, studentSearchQuery]); // Removed selectedEstablishmentFilter

  const currentYear = new Date().getFullYear();
  const schoolYears = Array.from({ length: 5 }, (_, i) => `${currentYear - 2 + i}-${currentYear - 1 + i}`);

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

  // Removed establishmentsToDisplayForNewUser

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"> {/* Added responsive padding and max-width */}
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion des Élèves
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Gérez les profils des élèves.
      </p>

      {/* Section: Créer un nouvel élève */}
      <Collapsible open={isNewStudentFormOpen} onOpenChange={setIsNewStudentFormOpen}>
        <Card className="rounded-android-tile"> {/* Apply rounded-android-tile */}
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-6 w-6 text-primary" /> Créer un nouvel élève
                </CardTitle>
                {isNewStudentFormOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent className="space-y-4 p-4"> {/* Apply padding directly to CollapsibleContent */}
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
                {/* Removed Establishment selection */}
                <div>
                  <Label htmlFor="new-student-enrollment-start-date" className="text-sm font-medium mb-2 block">Date de début d'inscription</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal rounded-android-tile", // Apply rounded-android-tile
                          !newStudentEnrollmentStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {newStudentEnrollmentStartDate ? format(newStudentEnrollmentStartDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 rounded-android-tile"> {/* Apply rounded-android-tile */}
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
                  <Label htmlFor="new-student-enrollment-end-date" className="text-sm font-medium mb-2 block">Date de fin d'inscription</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal rounded-android-tile", // Apply rounded-android-tile
                          !newStudentEnrollmentEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {newStudentEnrollmentEndDate ? format(newStudentEnrollmentEndDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 rounded-android-tile"> {/* Apply rounded-android-tile */}
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
              </div>
              <Button onClick={handleCreateStudent} disabled={isCreatingStudent || usernameAvailabilityStatus === 'checking' || emailAvailabilityStatus === 'checking' || !newStudentEnrollmentStartDate || !newStudentEnrollmentEndDate}>
                {isCreatingStudent ? <LoadingSpinner iconClassName="h-4 w-4 mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />} Créer l'élève
              </Button>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Removed Section: Affecter un élève à un établissement (Admin only) */}

      {/* Section: Liste de tous les élèves */}
      <Card className="rounded-android-tile"> {/* Apply rounded-android-tile */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" /> Mes Élèves
          </CardTitle>
          <CardDescription>Visualisez et gérez les élèves.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou @username..."
                className="pl-10 rounded-android-tile"
                value={studentSearchQuery}
                onChange={(e) => setSearchStudentQuery(e.target.value)}
              />
            </div>
            {/* Removed Establishment Filter */}
          </div>
          <div className="space-y-2">
            {studentsToDisplay.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                {studentSearchQuery.trim() === ''
                  ? <span>Aucun élève à afficher. Utilisez la recherche ou les filtres.</span>
                  : <span>Aucun élève trouvé pour votre recherche ou vos filtres.</span>}
              </p>
            ) : (
              studentsToDisplay.map((profile) => {
                const currentEnrollments = allStudentClassEnrollments.filter(e => e.student_id === profile.id);
                const currentClassEnrollment = currentEnrollments.find(e => {
                  const cls = classes.find(c => c.id === e.class_id);
                  const currentYear = new Date().getFullYear();
                  const nextYear = currentYear + 1;
                  const currentSchoolYearName = `${currentYear}-${nextYear}`;
                  return cls?.school_year_name === currentSchoolYearName; // Check for current school year
                });
                const currentClass = currentClassEnrollment ? classes.find(c => c.id === currentClassEnrollment.class_id) : undefined;

                return (
                  <Card key={profile.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-android-tile"> {/* Apply rounded-android-tile */}
                    <div className="flex-grow">
                      <p className="font-medium">{profile.first_name} {profile.last_name} <span className="text-sm text-muted-foreground">(@{profile.username})</span></p>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                      {/* Removed establishment_id display */}
                      {profile.enrollment_start_date && profile.enrollment_end_date && (
                        <p className="text-xs text-muted-foreground">
                          <span>Du {format(parseISO(profile.enrollment_start_date), 'dd/MM/yyyy', { locale: fr })} au {format(parseISO(profile.enrollment_end_date), 'dd/MM/yyyy', { locale: fr })})</span>
                        </p>
                      )}
                      {currentClass ? (
                        <p className="text-xs text-muted-foreground">
                          Classe actuelle: {currentClass.name} ({getCurriculumName(currentClass.curriculum_id)}) - {currentClass.school_year_name}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Non affecté à une classe pour l'année scolaire en cours</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                      {/* Removed Unassign from Establishment button */}
                      <Button variant="outline" size="sm" onClick={() => handleSendMessageToStudent(profile)}>
                        <Mail className="h-4 w-4 mr-1" /> Message
                      </Button>
                      {currentRole === 'administrator' && ( // Only administrator can delete
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