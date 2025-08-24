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
import { PlusCircle, Trash2, Users, GraduationCap, Mail, Search, UserCheck, UserX, Loader2, XCircle, CalendarDays, School, ChevronDown, ChevronUp, UserPlus } from "lucide-react"; // Import UserPlus
import { Class, Profile, Curriculum, Establishment, StudentClassEnrollment, SchoolYear } from "@/lib/dataModels";
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
  loadEstablishments,
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
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [allStudentClassEnrollments, setAllStudentClassEnrollments] = useState<StudentClassEnrollment[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);

  // States for new student creation form
  const [newStudentFirstName, setNewStudentFirstName] = useState('');
  const [newStudentLastName, setNewStudentLastName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newStudentEstablishmentId, setNewStudentEstablishmentId] = useState<string>(
    (currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'professeur' || currentRole === 'tutor') && currentUserProfile?.establishment_id
      ? currentUserProfile.establishment_id
      : ''
  );
  const [newStudentEnrollmentStartDate, setNewStudentEnrollmentStartDate] = useState<Date | undefined>(undefined);
  const [newStudentEnrollmentEndDate, setNewStudentEnrollmentEndDate] = useState<Date | undefined>(undefined);
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);
  const [isNewStudentFormOpen, setIsNewStudentFormOpen] = useState(false);

  const [usernameAvailabilityStatus, setUsernameAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailAvailabilityStatus, setEmailAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const debounceTimeoutRefUsername = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimeoutRefEmail = useRef<ReturnType<typeof setTimeout> | null>(null);

  // States for assign student to establishment section (Admin only)
  const [studentSearchInputEst, setStudentSearchInputEst] = useState('');
  const [selectedStudentForEstAssignment, setSelectedStudentForEstAssignment] = useState<Profile | null>(null);
  const [establishmentToAssign, setEstablishmentToAssign] = useState<string>("");
  const [enrollmentStartDate, setEnrollmentStartDate] = useState<Date | undefined>(undefined);
  const [enrollmentEndDate, setEnrollmentEndDate] = useState<Date | undefined>(undefined);
  const [openStudentSelectEst, setOpenStudentSelectEst] = useState(false);
  const [isSearchingUserEst, setIsSearchingUserEst] = useState(false);
  const debounceTimeoutRefEst = useRef<ReturnType<typeof setTimeout> | null>(null);

  // States for student list section
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedEstablishmentFilter, setSelectedEstablishmentFilter] = useState<string | null>(null);

  // Get classId from URL for initial filtering (now removed from student list)
  const classIdFromUrl = searchParams.get('classId');

  useEffect(() => {
    const fetchData = async () => {
      setClasses(await loadClasses());
      setCurricula(await loadCurricula());
      setEstablishments(await loadEstablishments());
      setAllProfiles(await getAllProfiles());
      setAllStudentClassEnrollments(await getAllStudentClassEnrollments());
    };
    fetchData();
  }, [currentUserProfile]);

  // Set initial establishment filter based on user role
  useEffect(() => {
    if (currentUserProfile && (currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'professeur' || currentRole === 'tutor')) {
      setSelectedEstablishmentFilter(currentUserProfile.establishment_id || null);
    } else {
      setSelectedEstablishmentFilter(null); // Admin can see all
    }
  }, [currentRole, currentUserProfile?.establishment_id]);

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
    if (!newStudentFirstName.trim() || !newStudentLastName.trim() || !newStudentUsername.trim() || !newStudentEmail.trim() || !newStudentPassword.trim() || !newStudentEstablishmentId || !newStudentEnrollmentStartDate || !newStudentEnrollmentEndDate) {
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

    // Role-based creation restrictions and defaults
    if ((currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'professeur' || currentRole === 'tutor') && newStudentEstablishmentId !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez créer des élèves que pour votre établissement.");
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
      setNewStudentEstablishmentId(
        (currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'professeur' || currentRole === 'tutor') && currentUserProfile?.establishment_id
          ? currentUserProfile.establishment_id
          : ''
      );
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

  // Debounced search for student to assign to establishment (Admin only)
  useEffect(() => {
    if (debounceTimeoutRefEst.current) {
      clearTimeout(debounceTimeoutRefEst.current);
    }
    if (studentSearchInputEst.trim() === '') {
      setIsSearchingUserEst(false);
      return;
    }
    setIsSearchingUserEst(true);
    debounceTimeoutRefEst.current = setTimeout(async () => {
      setIsSearchingUserEst(false);
    }, 500);
    return () => {
      if (debounceTimeoutRefEst.current) {
        clearTimeout(debounceTimeoutRefEst.current);
      }
    };
  }, [studentSearchInputEst]);

  const handleAssignStudentToEstablishment = async () => {
    if (!currentUserProfile || currentRole !== 'administrator') { // Only administrator can assign to establishment
      showError("Vous n'êtes pas autorisé à affecter des élèves à des établissements.");
      return;
    }
    if (!selectedStudentForEstAssignment) {
      showError("Veuillez d'abord sélectionner un élève.");
      return;
    }
    if (!establishmentToAssign) {
      showError("Veuillez sélectionner un établissement.");
      return;
    }
    if (!enrollmentStartDate || !enrollmentEndDate) {
      showError("Veuillez spécifier les dates de début et de fin d'inscription.");
      return;
    }
    if (selectedStudentForEstAssignment.role !== 'student') {
      showError("Seuls les profils d'élèves peuvent être affectés à un établissement.");
      return;
    }

    try {
      const updatedProfile: Partial<Profile> = {
        id: selectedStudentForEstAssignment.id,
        establishment_id: establishmentToAssign,
        enrollment_start_date: enrollmentStartDate.toISOString().split('T')[0],
        enrollment_end_date: enrollmentEndDate.toISOString().split('T')[0],
      };
      const savedProfile = await updateProfile(updatedProfile);

      if (savedProfile) {
        setAllProfiles(await getAllProfiles()); // Refresh profiles
        showSuccess(`Élève ${selectedStudentForEstAssignment.first_name} ${selectedStudentForEstAssignment.last_name} affecté à l'établissement ${getEstablishmentName(establishmentToAssign)} !`);
        handleClearEstAssignmentForm();
      } else {
        showError("Échec de l'affectation de l'élève à l'établissement.");
      }
    } catch (error: any) {
      console.error("Error assigning student to establishment:", error);
      showError(`Erreur lors de l'affectation de l'élève: ${error.message}`);
    }
  };

  const handleClearEstAssignmentForm = () => {
    setStudentSearchInputEst('');
    setSelectedStudentForEstAssignment(null);
    setEstablishmentToAssign("");
    setEnrollmentStartDate(undefined);
    setEnrollmentEndDate(undefined);
    setOpenStudentSelectEst(false);
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

  const handleUnassignStudentFromEstablishment = async (studentId: string, studentName: string) => {
    if (!currentUserProfile || (currentRole !== 'administrator' && currentRole !== 'director' && currentRole !== 'deputy_director')) {
      showError("Vous n'êtes pas autorisé à désaffecter des élèves d'un établissement.");
      return;
    }
    const studentToUnassign = allProfiles.find(p => p.id === studentId);
    if (!studentToUnassign) {
      showError("Élève introuvable.");
      return;
    }
    if (!studentToUnassign.establishment_id) {
      showError("Cet élève n'est pas affecté à un établissement.");
      return;
    }
    // Directors/Deputy Directors can only unassign students from their own establishment
    if ((currentRole === 'director' || currentRole === 'deputy_director') && studentToUnassign.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez désaffecter que les élèves de votre établissement.");
      return;
    }
    if (window.confirm(`Êtes-vous sûr de vouloir désaffecter ${studentName} de son établissement ?`)) {
      try {
        const updatedProfile: Partial<Profile> = {
          id: studentId,
          establishment_id: undefined, // Set to undefined to clear the foreign key
          enrollment_start_date: undefined,
          enrollment_end_date: undefined,
        };
        await updateProfile(updatedProfile);
        setAllProfiles(await getAllProfiles());
        showSuccess(`${studentName} a été désaffecté de son établissement.`);
      } catch (error: any) {
        console.error("Error unassigning student from establishment:", error);
        showError(`Erreur lors de la désaffectation: ${error.message}`);
      }
    }
  };

  const handleSendMessageToStudent = (studentProfile: Profile) => {
    navigate(`/messages?contactId=${studentProfile.id}`);
  };

  const filteredStudentsForEstDropdown = studentSearchInputEst.trim() === ''
    ? allProfiles.filter(p => p.role === 'student').slice(0, 10)
    : allProfiles.filter(p =>
        p.role === 'student' &&
        (p.username.toLowerCase().includes(studentSearchInputEst.toLowerCase()) ||
        p.first_name.toLowerCase().includes(studentSearchInputEst.toLowerCase()) ||
        p.last_name.toLowerCase().includes(studentSearchInputEst.toLowerCase()))
      ).slice(0, 10);

  const studentsToDisplay = React.useMemo(() => {
    let students = allProfiles.filter(p => p.role === 'student');

    // Filter by current user's establishment if director/deputy director/professeur/tutor
    if (currentUserProfile && (currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'professeur' || currentRole === 'tutor')) {
      students = students.filter(s => s.establishment_id === currentUserProfile.establishment_id);
    }
    
    if (selectedEstablishmentFilter !== 'all' && selectedEstablishmentFilter !== null) {
      students = students.filter(s => s.establishment_id === selectedEstablishmentFilter);
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
  }, [allProfiles, currentUserProfile, currentRole, selectedEstablishmentFilter, studentSearchQuery]);

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

  const establishmentsToDisplayForNewStudent = currentRole === 'administrator'
    ? establishments
    : establishments.filter(est => est.id === currentUserProfile.establishment_id);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion des Élèves
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Gérez les profils des élèves et leurs affectations aux établissements.
      </p>

      {/* Section: Créer un nouvel élève */}
      <Collapsible open={isNewStudentFormOpen} onOpenChange={setIsNewStudentFormOpen}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-6 w-6 text-primary" /> Créer un nouvel élève
                </CardTitle>
                {isNewStudentFormOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </CollapsibleTrigger>
            <CardDescription>Créez un nouveau compte élève et affectez-le à un établissement.</CardDescription>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
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
                <Select 
                  value={newStudentEstablishmentId || "none"} 
                  onValueChange={(value) => setNewStudentEstablishmentId(value === "none" ? '' : value)}
                  disabled={['director', 'deputy_director', 'professeur', 'tutor'].includes(currentRole || '')}
                >
                  <SelectTrigger id="new-student-establishment">
                    <SelectValue placeholder="Sélectionner un établissement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {establishmentsToDisplayForNewStudent.map(est => (
                      <SelectItem key={est.id} value={est.id}>
                        {est.name} {est.address && <span className="italic text-muted-foreground">({est.address})</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div>
                  <Label htmlFor="new-student-enrollment-start-date" className="text-sm font-medium mb-2 block">Date de début d'inscription</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newStudentEnrollmentStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {newStudentEnrollmentStartDate ? format(newStudentEnrollmentStartDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
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
                          "w-full justify-start text-left font-normal",
                          !newStudentEnrollmentEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {newStudentEnrollmentEndDate ? format(newStudentEnrollmentEndDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
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
              <Button onClick={handleCreateStudent} disabled={isCreatingStudent || usernameAvailabilityStatus === 'checking' || emailAvailabilityStatus === 'checking' || !newStudentEstablishmentId || !newStudentEnrollmentStartDate || !newStudentEnrollmentEndDate}>
                {isCreatingStudent ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />} Créer l'élève
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section: Affecter un élève à un établissement (Admin only) */}
      {currentRole === 'administrator' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-6 w-6 text-primary" /> Affecter un élève à un établissement
            </CardTitle>
            <CardDescription>Affectez un élève existant à un établissement pour une période donnée.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="select-student-for-est-assignment" className="text-base font-semibold mb-2 block">1. Sélectionner l'élève</Label>
              <Popover open={openStudentSelectEst} onOpenChange={setOpenStudentSelectEst}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openStudentSelectEst}
                    className="w-full justify-between"
                    id="select-student-for-est-assignment"
                  >
                    {selectedStudentForEstAssignment ? `${selectedStudentForEstAssignment.first_name} ${selectedStudentForEstAssignment.last_name} (@${selectedStudentForEstAssignment.username})` : "Rechercher un élève..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Rechercher par nom d'utilisateur..."
                      value={studentSearchInputEst}
                      onValueChange={(value) => {
                        setStudentSearchInputEst(value);
                        setIsSearchingUserEst(true);
                      }}
                    />
                    <CommandList>
                      {(() => {
                        if (isSearchingUserEst && studentSearchInputEst.trim() !== '') {
                          return (
                            <CommandEmpty className="py-2 text-center text-muted-foreground flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" /> Recherche...
                            </CommandEmpty>
                          );
                        } else if (filteredStudentsForEstDropdown.length === 0 && studentSearchInputEst.trim() !== '') {
                          return (
                            <CommandEmpty className="py-2 text-center text-muted-foreground">
                              Aucun élève trouvé pour "{studentSearchInputEst}".
                            </CommandEmpty>
                          );
                        } else {
                          return (
                            <CommandGroup>
                              {filteredStudentsForEstDropdown.map((profile) => (
                                <CommandItem
                                  key={profile.id}
                                  value={profile.username}
                                  onSelect={() => {
                                    setSelectedStudentForEstAssignment(profile);
                                    setStudentSearchInputEst(profile.username);
                                    setEstablishmentToAssign(profile.establishment_id || "");
                                    setEnrollmentStartDate(profile.enrollment_start_date ? parseISO(profile.enrollment_start_date) : undefined);
                                    setEnrollmentEndDate(profile.enrollment_end_date ? parseISO(profile.enrollment_end_date) : undefined);
                                    setOpenStudentSelectEst(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedStudentForEstAssignment?.id === profile.id ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                  {profile.first_name} {profile.last_name} (@{profile.username})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          );
                        }
                      })()}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedStudentForEstAssignment && (
              <div className="p-4 border rounded-md bg-muted/20 space-y-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-500" />
                  <p className="font-medium text-lg">{selectedStudentForEstAssignment.first_name} {selectedStudentForEstAssignment.last_name}</p>
                </div>
                <p className="text-sm text-muted-foreground">Email : {selectedStudentForEstAssignment.email}</p>
                <p className="text-sm text-muted-foreground">Nom d'utilisateur : @{selectedStudentForEstAssignment.username}</p>
                {selectedStudentForEstAssignment.establishment_id ? (
                  <p className="text-sm text-muted-foreground">
                    Établissement actuel : <span className="font-semibold">{getEstablishmentName(selectedStudentForEstAssignment.establishment_id)}</span>
                    {selectedStudentForEstAssignment.enrollment_start_date && selectedStudentForEstAssignment.enrollment_end_date && (
                      <span> (Du {format(parseISO(selectedStudentForEstAssignment.enrollment_start_date), 'dd/MM/yyyy', { locale: fr })} au {format(parseISO(selectedStudentForEstAssignment.enrollment_end_date), 'dd/MM/yyyy', { locale: fr })})</span>
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Non affecté à un établissement.</p>
                )}

                <div>
                  <Label htmlFor="establishment-to-assign" className="text-base font-semibold mb-2 block mt-4">2. Choisir l'établissement d'affectation</Label>
                  <Select value={establishmentToAssign} onValueChange={setEstablishmentToAssign}>
                    <SelectTrigger id="establishment-to-assign" className="w-full">
                      <SelectValue placeholder="Sélectionner un établissement" />
                    </SelectTrigger>
                    <SelectContent>
                      {establishments.map(est => (
                        <SelectItem key={est.id} value={est.id}>
                          {est.name} {est.address && <span className="italic text-muted-foreground">({est.address})</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="enrollment-start-date" className="text-base font-semibold mb-2 block mt-4">Date de début d'inscription</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !enrollmentStartDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {enrollmentStartDate ? format(enrollmentStartDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={enrollmentStartDate}
                          onSelect={setEnrollmentStartDate}
                          initialFocus
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="enrollment-end-date" className="text-base font-semibold mb-2 block mt-4">Date de fin d'inscription</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !enrollmentEndDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {enrollmentEndDate ? format(enrollmentEndDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={enrollmentEndDate}
                          onSelect={setEnrollmentEndDate}
                          initialFocus
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAssignStudentToEstablishment} disabled={!establishmentToAssign || !enrollmentStartDate || !enrollmentEndDate}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Affecter à cet établissement
                  </Button>
                  <Button variant="outline" onClick={handleClearEstAssignmentForm}>
                    <XCircle className="h-4 w-4 mr-2" /> Effacer le formulaire
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section: Liste de tous les élèves */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" /> Mes Élèves
          </CardTitle>
          <CardDescription>Visualisez et gérez les élèves de votre établissement.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou @username..."
                className="pl-10"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex-shrink-0 sm:w-1/3">
              <Label htmlFor="establishment-filter">Filtrer par Établissement</Label>
              <Select value={selectedEstablishmentFilter || "all"} onValueChange={(value) => {
                setSelectedEstablishmentFilter(value === "all" ? null : value);
              }}
              disabled={['director', 'deputy_director', 'professeur', 'tutor'].includes(currentRole || '')}
              >
                <SelectTrigger id="establishment-filter">
                  <SelectValue placeholder="Tous les établissements" />
                </SelectTrigger>
                <SelectContent>
                  {currentRole === 'administrator' && <SelectItem value="all">Tous les établissements</SelectItem>}
                  {establishments
                    .filter(est => currentRole === 'administrator' || est.id === currentUserProfile?.establishment_id)
                    .map(est => (
                      <SelectItem key={est.id} value={est.id}>
                        {est.name} {est.address && <span className="italic text-muted-foreground">({est.address})</span>}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            {studentsToDisplay.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                {studentSearchQuery.trim() === '' && !selectedEstablishmentFilter
                  ? "Aucun élève à afficher. Utilisez la recherche ou les filtres."
                  : "Aucun élève trouvé pour votre recherche ou vos filtres."}
              </p>
            ) : (
              studentsToDisplay.map((profile) => {
                const currentEnrollments = allStudentClassEnrollments.filter(e => e.student_id === profile.id);
                const currentClassEnrollment = currentEnrollments.find(e => {
                  const cls = classes.find(c => c.id === e.class_id);
                  const currentYear = new Date().getFullYear();
                  const nextYear = currentYear + 1;
                  const currentSchoolYear = `${currentYear}-${nextYear}`;
                  return cls?.school_year_name === currentSchoolYear; // Check for current school year
                });
                const currentClass = currentClassEnrollment ? classes.find(c => c.id === currentClassEnrollment.class_id) : undefined;

                return (
                  <Card key={profile.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex-grow">
                      <p className="font-medium">{profile.first_name} {profile.last_name} <span className="text-sm text-muted-foreground">(@{profile.username})</span></p>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                      {profile.establishment_id ? (
                        <p className="text-xs text-muted-foreground">
                          Établissement: {getEstablishmentName(profile.establishment_id)}
                          {profile.enrollment_start_date && profile.enrollment_end_date && (
                            <span> (Du {format(parseISO(profile.enrollment_start_date), 'dd/MM/yyyy', { locale: fr })} au {format(parseISO(profile.enrollment_end_date), 'dd/MM/yyyy', { locale: fr })})</span>
                          )}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Non affecté à un établissement</p>
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
                      {profile.establishment_id && (currentRole === 'administrator' || ((currentRole === 'director' || currentRole === 'deputy_director') && profile.establishment_id === currentUserProfile?.establishment_id)) && (
                        <Button variant="outline" size="sm" onClick={() => handleUnassignStudentFromEstablishment(profile.id, `${profile.first_name} ${profile.last_name}`)}>
                          <School className="h-4 w-4 mr-1" /> Désaffecter de l'établissement
                        </Button>
                      )}
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