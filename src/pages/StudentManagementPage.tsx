import React, { useState, useEffect, useRef } from 'react';
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
import { PlusCircle, Trash2, Users, GraduationCap, Mail, Search, UserCheck, UserX, Loader2, XCircle, CalendarDays, School } from "lucide-react";
import { Class, Profile, Curriculum, Establishment, StudentClassEnrollment } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import {
  getAllProfiles,
  updateProfile,
  deleteProfile,
  getAllStudentClassEnrollments,
  upsertStudentClassEnrollment,
  deleteStudentClassEnrollment,
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

  // States for assign student to establishment section (Admin only)
  const [studentSearchInputEst, setStudentSearchInputEst] = useState('');
  const [selectedStudentForEstAssignment, setSelectedStudentForEstAssignment] = useState<Profile | null>(null);
  const [establishmentToAssign, setEstablishmentToAssign] = useState<string>("");
  const [enrollmentStartDate, setEnrollmentStartDate] = useState<Date | undefined>(undefined);
  const [enrollmentEndDate, setEnrollmentEndDate] = useState<Date | undefined>(undefined);
  const [openStudentSelectEst, setOpenStudentSelectEst] = useState(false);
  const [isSearchingUserEst, setIsSearchingUserEst] = useState(false);
  const debounceTimeoutRefEst = useRef<ReturnType<typeof setTimeout> | null>(null);

  // States for assign student to class section
  const [studentSearchInputClass, setStudentSearchInputClass] = useState('');
  const [selectedStudentForClassAssignment, setSelectedStudentForClassAssignment] = useState<Profile | null>(null);
  const [classToAssign, setClassToAssign] = useState<string>("");
  const [enrollmentYear, setEnrollmentYear] = useState<string>('');
  const [classEnrollmentStartDate, setClassEnrollmentStartDate] = useState<Date | undefined>(undefined);
  const [classEnrollmentEndDate, setClassEnrollmentEndDate] = useState<Date | undefined>(undefined);
  const [openStudentSelectClass, setOpenStudentSelectClass] = useState(false);
  const [isSearchingUserClass, setIsSearchingUserClass] = useState(false);
  const debounceTimeoutRefClass = useRef<ReturnType<typeof setTimeout> | null>(null);

  // States for student list section
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null);
  const [selectedEstablishmentFilter, setSelectedEstablishmentFilter] = useState<string | null>(null);

  // Get classId from URL for initial filtering
  const classIdFromUrl = searchParams.get('classId');

  useEffect(() => {
    const fetchData = async () => {
      setClasses(await loadClasses());
      setCurricula(await loadCurricula());
      setEstablishments(await loadEstablishments());
      setAllProfiles(await getAllProfiles());
      setAllStudentClassEnrollments(await getAllStudentClassEnrollments()); // Fetch ALL enrollments for display
    };
    fetchData();
  }, [currentUserProfile]);

  // Set initial class filter from URL
  useEffect(() => {
    if (classIdFromUrl) {
      setSelectedClassFilter(classIdFromUrl);
    } else {
      setSelectedClassFilter(null);
    }
  }, [classIdFromUrl]);

  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';
  const getCurriculumName = (id?: string) => curricula.find(c => c.id === id)?.name || 'N/A';
  const getClassName = (id?: string) => classes.find(c => c.id === id)?.name || 'N/A';

  const handleRemoveStudentFromClass = async (enrollmentId: string) => {
    if (!currentUserProfile || (currentRole !== 'professeur' && currentRole !== 'tutor' && currentRole !== 'director' && currentRole !== 'deputy_director' && currentRole !== 'administrator')) { // Only professeur/tutor/director/deputy_director/administrator can remove
      showError("Vous n'êtes pas autorisé à retirer des élèves des classes.");
      return;
    }

    const enrollmentToDelete = allStudentClassEnrollments.find(e => e.id === enrollmentId);
    if (!enrollmentToDelete) {
      showError("Inscription introuvable.");
      return;
    }
    const classOfEnrollment = classes.find(cls => cls.id === enrollmentToDelete.class_id);
    if (!classOfEnrollment) {
      showError("Classe associée introuvable.");
      return;
    }

    // Permission check: Professeur/Tutor can only remove from classes they manage.
    if (currentRole === 'professeur' && !classOfEnrollment.creator_ids.includes(currentUserProfile.id)) {
      showError("Vous ne pouvez retirer des élèves que des classes que vous gérez.");
      return;
    }
    // Permission check: Director/Deputy Director can only remove from classes in their establishment.
    if ((currentRole === 'director' || currentRole === 'deputy_director') && classOfEnrollment.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez retirer des élèves que des classes de votre établissement.");
      return;
    }


    try {
      await deleteStudentClassEnrollment(enrollmentId);
      setAllStudentClassEnrollments(await getAllStudentClassEnrollments()); // Refresh enrollments
      showSuccess(`Élève retiré de la classe !`);
    } catch (error: any) {
      console.error("Error removing student from class:", error);
      showError(`Erreur lors du retrait de l'élève: ${error.message}`);
    }
  };

  const handleSendMessageToStudent = (studentProfile: Profile) => {
    openChat(`J'ai une question concernant l'élève ${studentProfile.first_name} ${studentProfile.last_name}.`);
    navigate(`/messages?contactId=${studentProfile.id}`);
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

  // Debounced search for student to assign to class
  useEffect(() => {
    if (debounceTimeoutRefClass.current) {
      clearTimeout(debounceTimeoutRefClass.current);
    }
    if (studentSearchInputClass.trim() === '') {
      setIsSearchingUserClass(false);
      return;
    }
    setIsSearchingUserClass(true);
    debounceTimeoutRefClass.current = setTimeout(async () => {
      setIsSearchingUserClass(false);
    }, 500);
    return () => {
      if (debounceTimeoutRefClass.current) {
        clearTimeout(debounceTimeoutRefClass.current);
      }
    };
  }, [studentSearchInputClass]);

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

  const handleAssignStudentToClass = async () => {
    if (!currentUserProfile || (currentRole !== 'professeur' && currentRole !== 'tutor' && currentRole !== 'director' && currentRole !== 'deputy_director' && currentRole !== 'administrator')) { // Only professeur/tutor/director/deputy_director/administrator can assign
      showError("Vous n'êtes pas autorisé à affecter des élèves à des classes.");
      return;
    }
    if (!selectedStudentForClassAssignment) {
      showError("Veuillez d'abord sélectionner un élève.");
      return;
    }
    if (!classToAssign) {
      showError("Veuillez sélectionner une classe.");
      return;
    }
    if (!enrollmentYear || !classEnrollmentStartDate || !classEnrollmentEndDate) {
      showError("Veuillez spécifier l'année scolaire et les dates de début/fin d'inscription à la classe.");
      return;
    }
    if (selectedStudentForClassAssignment.role !== 'student') {
      showError("Seuls les profils d'élèves peuvent être affectés à une classe.");
      return;
    }
    if (!selectedStudentForClassAssignment.establishment_id) {
      showError("L'élève doit d'abord être affecté à un établissement.");
      return;
    }
    const selectedClass = classes.find(cls => cls.id === classToAssign);
    if (!selectedClass) {
      showError("Classe sélectionnée introuvable.");
      return;
    }
    if (selectedClass?.establishment_id !== selectedStudentForClassAssignment.establishment_id) {
      showError("La classe sélectionnée n'appartient pas à l'établissement de l'élève.");
      return;
    }

    // Permission check: Professeur can only assign to classes they manage.
    if (currentRole === 'professeur' && !selectedClass.creator_ids.includes(currentUserProfile.id)) {
      showError("Vous ne pouvez affecter des élèves qu'aux classes que vous gérez.");
      return;
    }
    // Permission check: Director/Deputy Director can only assign to classes in their establishment.
    if ((currentRole === 'director' || currentRole === 'deputy_director') && selectedClass.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez affecter des élèves qu'aux classes de votre établissement.");
      return;
    }

    const existingEnrollment = allStudentClassEnrollments.find(
      e => e.student_id === selectedStudentForClassAssignment.id && e.class_id === classToAssign && e.enrollment_year === enrollmentYear
    );

    if (existingEnrollment) {
      showError("Cet élève est déjà inscrit à cette classe pour cette année scolaire.");
      return;
    }

    try {
      const newEnrollment: StudentClassEnrollment = {
        id: `enrollment-${Date.now()}`, // Supabase will generate
        student_id: selectedStudentForClassAssignment.id,
        class_id: classToAssign,
        enrollment_year: enrollmentYear,
        start_date: classEnrollmentStartDate.toISOString().split('T')[0],
        end_date: classEnrollmentEndDate.toISOString().split('T')[0],
      };
      const savedEnrollment = await upsertStudentClassEnrollment(newEnrollment);

      if (savedEnrollment) {
        setAllStudentClassEnrollments(await getAllStudentClassEnrollments()); // Refresh enrollments
        showSuccess(`Élève ${selectedStudentForClassAssignment.first_name} ${selectedStudentForClassAssignment.last_name} inscrit à la classe ${getClassName(classToAssign)} pour ${enrollmentYear} !`);
        handleClearClassAssignmentForm();
      } else {
        showError("Échec de l'inscription de l'élève à la classe.");
      }
    } catch (error: any) {
      console.error("Error assigning student to class:", error);
      showError(`Erreur lors de l'inscription de l'élève à la classe: ${error.message}`);
    }
  };

  const handleClearClassAssignmentForm = () => {
    setStudentSearchInputClass('');
    setSelectedStudentForClassAssignment(null);
    setClassToAssign("");
    setEnrollmentYear('');
    setClassEnrollmentStartDate(undefined);
    setClassEnrollmentEndDate(undefined);
    setOpenStudentSelectClass(false);
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

  const filteredStudentsForEstDropdown = studentSearchInputEst.trim() === ''
    ? allProfiles.filter(p => p.role === 'student').slice(0, 10)
    : allProfiles.filter(p =>
        p.role === 'student' &&
        (p.username.toLowerCase().includes(studentSearchInputEst.toLowerCase()) ||
        p.first_name.toLowerCase().includes(studentSearchInputEst.toLowerCase()) ||
        p.last_name.toLowerCase().includes(studentSearchInputEst.toLowerCase()))
      ).slice(0, 10);

  const filteredStudentsForClassDropdown = studentSearchInputClass.trim() === ''
    ? allProfiles.filter(p => p.role === 'student').slice(0, 10)
    : allProfiles.filter(p =>
        p.role === 'student' &&
        (p.username.toLowerCase().includes(studentSearchInputClass.toLowerCase()) ||
        p.first_name.toLowerCase().includes(studentSearchInputClass.toLowerCase()) ||
        p.last_name.toLowerCase().includes(studentSearchInputClass.toLowerCase()))
      ).slice(0, 10);

  const studentsToDisplay = React.useMemo(() => {
    let students = allProfiles.filter(p => p.role === 'student');

    // Filter by classes/establishments managed by the current user (if not admin)
    if (currentUserProfile && currentRole !== 'administrator') {
      const managedClassIds = classes.filter(cls => cls.creator_ids.includes(currentUserProfile.id)).map(cls => cls.id);
      const studentIdsInManagedClasses = new Set(allStudentClassEnrollments.filter(e => managedClassIds.includes(e.class_id)).map(e => e.student_id));
      students = students.filter(s => studentIdsInManagedClasses.has(s.id));
    }
    // For Director/Deputy Director, filter by establishment
    if (currentUserProfile && (currentRole === 'director' || currentRole === 'deputy_director')) {
      students = students.filter(s => s.establishment_id === currentUserProfile.establishment_id);
    }


    if (selectedEstablishmentFilter !== 'all' && selectedEstablishmentFilter !== null) {
      students = students.filter(s => s.establishment_id === selectedEstablishmentFilter);
    }

    if (selectedClassFilter !== 'all' && selectedClassFilter !== null) {
      const studentIdsInClass = new Set(allStudentClassEnrollments.filter(e => e.class_id === selectedClassFilter).map(e => e.student_id));
      students = students.filter(s => studentIdsInClass.has(s.id));
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
  }, [allProfiles, currentUserProfile, currentRole, classes, allStudentClassEnrollments, selectedEstablishmentFilter, selectedClassFilter, studentSearchQuery]);

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

  if (currentRole !== 'professeur' && currentRole !== 'tutor' && currentRole !== 'director' && currentRole !== 'deputy_director' && currentRole !== 'administrator') { // Only professeur, tutor, director, deputy_director, administrator can access
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès Restreint
        </h1>
        <p className="text-lg text-muted-foreground">
          Seuls les professeurs, tuteurs, directeurs et administrateurs peuvent accéder à cette page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion des Élèves
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Gérez les affectations des élèves aux classes que vous supervisez.
      </p>

      {/* Section: Affecter un élève à un établissement (Admin only) */}
      {currentRole === 'administrator' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-6 w-6 text-primary" /> Affecter un élève à un établissement
            </CardTitle>
            <CardDescription>Affectez un élève à un établissement pour une période donnée.</CardDescription>
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
                      {isSearchingUserEst && studentSearchInputEst.trim() !== '' ? (
                        <CommandEmpty className="py-2 text-center text-muted-foreground flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Recherche...
                        </CommandEmpty>
                      ) : filteredStudentsForEstDropdown.length === 0 && studentSearchInputEst.trim() !== '' ? (
                        <CommandEmpty className="py-2 text-center text-muted-foreground">
                          Aucun élève trouvé pour "{studentSearchInputEst}".
                        </CommandEmpty>
                      ) : (
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
                      )}
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
                          {est.name}
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

      {/* Section: Affecter un élève à une classe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Affecter un élève à une classe
          </CardTitle>
          <CardDescription>Inscrivez un élève à une classe pour une année scolaire spécifique.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="select-student-for-class-assignment" className="text-base font-semibold mb-2 block">1. Sélectionner l'élève</Label>
            <Popover open={openStudentSelectClass} onOpenChange={setOpenStudentSelectClass}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openStudentSelectClass}
                  className="w-full justify-between"
                  id="select-student-for-class-assignment"
                >
                  {selectedStudentForClassAssignment ? `${selectedStudentForClassAssignment.first_name} ${selectedStudentForClassAssignment.last_name} (@${selectedStudentForClassAssignment.username})` : "Rechercher un élève..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                  <CommandInput
                    placeholder="Rechercher par nom d'utilisateur..."
                    value={studentSearchInputClass}
                    onValueChange={(value) => {
                      setStudentSearchInputClass(value);
                      setIsSearchingUserClass(true);
                    }}
                  />
                  <CommandList>
                    {isSearchingUserClass && studentSearchInputClass.trim() !== '' ? (
                      <CommandEmpty className="py-2 text-center text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Recherche...
                      </CommandEmpty>
                    ) : filteredStudentsForClassDropdown.length === 0 && studentSearchInputClass.trim() !== '' ? (
                        <CommandEmpty className="py-2 text-center text-muted-foreground">
                          Aucun élève trouvé pour "{studentSearchInputClass}".
                        </CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {filteredStudentsForClassDropdown.map((profile) => (
                            <CommandItem
                              key={profile.id}
                              value={profile.username}
                              onSelect={() => {
                                setSelectedStudentForClassAssignment(profile);
                                setStudentSearchInputClass(profile.username);
                                setOpenStudentSelectClass(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedStudentForClassAssignment?.id === profile.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {profile.first_name} {profile.last_name} (@{profile.username})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {selectedStudentForClassAssignment && (
            <div className="p-4 border rounded-md bg-muted/20 space-y-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-500" />
                <p className="font-medium text-lg">{selectedStudentForClassAssignment.first_name} {selectedStudentForClassAssignment.last_name}</p>
              </div>
              <p className="text-sm text-muted-foreground">Email : {selectedStudentForClassAssignment.email}</p>
              <p className="text-sm text-muted-foreground">Nom d'utilisateur : @{selectedStudentForClassAssignment.username}</p>
              {selectedStudentForClassAssignment.establishment_id ? (
                <p className="text-sm text-muted-foreground">
                  Établissement actuel : <span className="font-semibold">{getEstablishmentName(selectedStudentForClassAssignment.establishment_id)}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Non affecté à un établissement.</p>
              )}

              <div>
                <Label htmlFor="class-to-assign" className="text-base font-semibold mb-2 block mt-4">2. Choisir la classe d'affectation</Label>
                <Select value={classToAssign} onValueChange={setClassToAssign}>
                  <SelectTrigger id="class-to-assign" className="w-full">
                    <SelectValue placeholder="Sélectionner une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes
                      .filter(cls => 
                        (currentUserProfile && (cls.creator_ids.includes(currentUserProfile.id) || currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'administrator')) && // Only classes managed by current professeur/director/deputy_director/administrator
                        (!selectedStudentForClassAssignment.establishment_id || cls.establishment_id === selectedStudentForClassAssignment.establishment_id)
                      )
                      .map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} ({getCurriculumName(cls.curriculum_id)}) - {cls.school_year}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="enrollment-year" className="text-base font-semibold mb-2 block mt-4">Année scolaire</Label>
                  <Select value={enrollmentYear} onValueChange={setEnrollmentYear}>
                    <SelectTrigger id="enrollment-year" className="w-full">
                      <SelectValue placeholder="Sélectionner l'année scolaire" />
                    </SelectTrigger>
                    <SelectContent>
                      {schoolYears.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="class-enrollment-start-date" className="text-base font-semibold mb-2 block mt-4">Date de début d'inscription à la classe</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !classEnrollmentStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {classEnrollmentStartDate ? format(classEnrollmentStartDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={classEnrollmentStartDate}
                        onSelect={setClassEnrollmentStartDate}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="class-enrollment-end-date" className="text-base font-semibold mb-2 block mt-4">Date de fin d'inscription à la classe</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !classEnrollmentEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {classEnrollmentEndDate ? format(classEnrollmentEndDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={classEnrollmentEndDate}
                        onSelect={setClassEnrollmentEndDate}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={handleAssignStudentToClass} disabled={!classToAssign || !enrollmentYear || !classEnrollmentStartDate || !classEnrollmentEndDate}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Inscrire à cette classe
                </Button>
                <Button variant="outline" onClick={handleClearClassAssignmentForm}>
                  <XCircle className="h-4 w-4 mr-2" /> Effacer le formulaire
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section: Liste de tous les élèves */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" /> Mes Élèves
          </CardTitle>
          <CardDescription>Visualisez et gérez les élèves de vos classes.</CardDescription>
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
                setSelectedClassFilter(null); // Reset class filter when establishment changes
              }}>
                <SelectTrigger id="establishment-filter">
                  <SelectValue placeholder="Tous les établissements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les établissements</SelectItem>
                  {establishments.map(est => (
                    <SelectItem key={est.id} value={est.id}>
                      {est.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-shrink-0 sm:w-1/3">
              <Label htmlFor="class-filter">Filtrer par Classe</Label>
              <Select value={selectedClassFilter || "all"} onValueChange={(value) => {
                setSelectedClassFilter(value === "all" ? null : value);
                setSearchParams(params => {
                  if (value === "all") {
                    params.delete('classId');
                  } else {
                    params.set('classId', value);
                  }
                  return params;
                }, { replace: true });
              }}>
                <SelectTrigger id="class-filter">
                  <SelectValue placeholder="Toutes les classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  {classes
                    .filter(cls => 
                      (currentUserProfile && (cls.creator_ids.includes(currentUserProfile.id) || currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'administrator')) && // Only classes managed by current professeur/director/deputy_director/administrator
                      (!selectedEstablishmentFilter || cls.establishment_id === selectedEstablishmentFilter)
                    )
                    .map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} ({getCurriculumName(cls.curriculum_id)}) - {cls.school_year}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            {studentsToDisplay.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                {studentSearchQuery.trim() === '' && !selectedClassFilter && !selectedEstablishmentFilter
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
                  return cls?.school_year === currentSchoolYear; // Check for current school year
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
                          Classe actuelle: {currentClass.name} ({getCurriculumName(currentClass.curriculum_id)}) - {currentClass.school_year}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Non affecté à une classe pour l'année scolaire en cours</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                      {currentClassEnrollment && (currentRole === 'professeur' || currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'administrator') && ( // Only professeur, director, deputy_director, administrator can remove
                        <Button variant="outline" size="sm" onClick={() => handleRemoveStudentFromClass(currentClassEnrollment.id)}>
                          <UserX className="h-4 w-4 mr-1" /> Retirer de la classe
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