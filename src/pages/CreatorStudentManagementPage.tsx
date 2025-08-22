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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, UserPlus, UserCheck, Loader2, Check, XCircle, Mail, Search, GraduationCap, Users as UsersIcon, CalendarDays } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useRole } from '@/contexts/RoleContext';
import { getAllProfiles, checkUsernameExists, checkEmailExists, deleteProfile, updateProfile, getAllStudentClassEnrollments, upsertStudentClassEnrollment, deleteStudentClassEnrollment } from '@/lib/studentData';
import { Profile, Class, StudentClassEnrollment, Curriculum, Establishment } from '@/lib/dataModels';
import { supabase } from '@/integrations/supabase/client';
import InputWithStatus from '@/components/InputWithStatus';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { loadClasses, loadCurricula, loadEstablishments } from '@/lib/courseData';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";

const CreatorStudentManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const navigate = useNavigate();

  const [allStudents, setAllStudents] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [allStudentClassEnrollments, setAllStudentClassEnrollments] = useState<StudentClassEnrollment[]>([]);

  // States for new student creation form
  const [newStudentFirstName, setNewStudentFirstName] = useState('');
  const [newStudentLastName, setNewStudentLastName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);

  const [usernameAvailabilityStatus, setUsernameAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailAvailabilityStatus, setEmailAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const debounceTimeoutRefUsername = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimeoutRefEmail = useRef<ReturnType<typeof setTimeout> | null>(null);

  // States for assigning student to class
  const [studentSearchInputClass, setStudentSearchInputClass] = useState('');
  const [selectedStudentForClassAssignment, setSelectedStudentForClassAssignment] = useState<Profile | null>(null);
  const [classToAssign, setClassToAssign] = useState<string>("");
  const [enrollmentYear, setEnrollmentYear] = useState<string>('');
  const [classEnrollmentStartDate, setClassEnrollmentStartDate] = useState<Date | undefined>(undefined);
  const [classEnrollmentEndDate, setClassEnrollmentEndDate] = useState<Date | undefined>(undefined);
  const [openStudentSelectClass, setOpenStudentSelectClass] = useState(false);
  const [isSearchingUserClass, setIsSearchingUserClass] = useState(false);
  const debounceTimeoutRefClass = useRef<ReturnType<typeof setTimeout> | null>(null);

  // States for student list filtering
  const [studentListSearchQuery, setStudentListSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null);
  const [selectedCurriculumFilter, setSelectedCurriculumFilter] = useState<string | null>(null);
  const [selectedEstablishmentFilter, setSelectedEstablishmentFilter] = useState<string | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      const profiles = await getAllProfiles();
      setAllStudents(profiles.filter(p => p.role === 'student'));
      setClasses(await loadClasses());
      setCurricula(await loadCurricula());
      setEstablishments(await loadEstablishments());
      setAllStudentClassEnrollments(await getAllStudentClassEnrollments());
    };
    fetchData();
  }, [currentUserProfile]);

  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';
  const getCurriculumName = (id?: string) => curricula.find(c => c.id === id)?.name || 'N/A';
  const getClassName = (id?: string) => classes.find(c => c.id === id)?.name || 'N/A';

  const validateUsername = useCallback(async (username: string, currentProfileId?: string) => {
    if (username.length < 3) return false;
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return false;
    setUsernameAvailabilityStatus('checking');
    const isTaken = await checkUsernameExists(username);
    if (isTaken && (!currentProfileId || allStudents.find(u => u.username === username)?.id !== currentProfileId)) {
      setUsernameAvailabilityStatus('taken');
      return false;
    }
    setUsernameAvailabilityStatus('available');
    return true;
  }, [allStudents]);

  const validateEmail = useCallback(async (email: string, currentProfileId?: string) => {
    if (!/\S+@\S+\.\S+/.test(email)) return false;
    setEmailAvailabilityStatus('checking');
    const isTaken = await checkEmailExists(email);
    if (isTaken && (!currentProfileId || allStudents.find(u => u.email === email)?.id !== currentProfileId)) {
      setEmailAvailabilityStatus('taken');
      return false;
    }
    setEmailAvailabilityStatus('available');
    return true;
  }, [allStudents]);

  const handleUsernameChange = (value: string) => {
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

  const handleEmailChange = (value: string) => {
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
    if (!newStudentFirstName.trim() || !newStudentLastName.trim() || !newStudentUsername.trim() || !newStudentEmail.trim() || !newStudentPassword.trim()) {
      showError("Tous les champs sont requis.");
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

    setIsCreatingStudent(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user-with-role', {
        body: {
          email: newStudentEmail.trim(),
          password: newStudentPassword.trim(),
          first_name: newStudentFirstName.trim(),
          last_name: newStudentLastName.trim(),
          username: newStudentUsername.trim(),
          role: 'student', // Creators can only create students
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
      setUsernameAvailabilityStatus('idle');
      setEmailAvailabilityStatus('idle');
      const profiles = await getAllProfiles();
      setAllStudents(profiles.filter(p => p.role === 'student')); // Refresh student list
    } catch (error: any) {
      console.error("Unexpected error creating student:", error);
      showError(`Une erreur inattendue est survenue: ${error.message}`);
    } finally {
      setIsCreatingStudent(false);
    }
  };

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

  const handleAssignStudentToClass = async () => {
    if (!currentUserProfile || currentRole !== 'creator') {
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
    
    const selectedClass = classes.find(cls => cls.id === classToAssign);
    if (!selectedClass) {
      showError("Classe sélectionnée introuvable.");
      return;
    }
    // Ensure the creator is associated with the class they are assigning to
    if (!selectedClass.creator_ids.includes(currentUserProfile.id)) {
      showError("Vous ne pouvez affecter des élèves qu'aux classes que vous gérez.");
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

  const handleRemoveStudentFromClass = async (enrollmentId: string) => {
    if (!currentUserProfile || currentRole !== 'creator') {
      showError("Vous n'êtes pas autorisé à retirer des élèves des classes.");
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
    navigate(`/messages?contactId=${studentProfile.id}`);
  };

  const filteredStudentsForClassDropdown = studentSearchInputClass.trim() === ''
    ? allStudents.slice(0, 10)
    : allStudents.filter(p =>
        (p.username.toLowerCase().includes(studentSearchInputClass.toLowerCase()) ||
        p.first_name.toLowerCase().includes(studentSearchInputClass.toLowerCase()) ||
        p.last_name.toLowerCase().includes(studentSearchInputClass.toLowerCase()))
      ).slice(0, 10);

  const studentsToDisplay = React.useMemo(() => {
    let students = allStudents;

    // Filter by classes managed by the current creator
    const creatorManagedClassIds = classes.filter(cls => currentUserProfile && cls.creator_ids.includes(currentUserProfile.id)).map(cls => cls.id);
    const studentIdsInCreatorClasses = new Set(allStudentClassEnrollments.filter(e => creatorManagedClassIds.includes(e.class_id)).map(e => e.student_id));
    students = students.filter(s => studentIdsInCreatorClasses.has(s.id));

    if (selectedEstablishmentFilter && selectedEstablishmentFilter !== 'all') {
      students = students.filter(s => s.establishment_id === selectedEstablishmentFilter);
    }

    if (selectedCurriculumFilter && selectedCurriculumFilter !== 'all') {
      const classesInCurriculum = classes.filter(cls => cls.curriculum_id === selectedCurriculumFilter);
      const studentIdsInCurriculum = new Set(allStudentClassEnrollments.filter(e => classesInCurriculum.some(c => c.id === e.class_id)).map(e => e.student_id));
      students = students.filter(s => studentIdsInCurriculum.has(s.id));
    }

    if (selectedClassFilter && selectedClassFilter !== 'all') {
      const studentIdsInClass = new Set(allStudentClassEnrollments.filter(e => e.class_id === selectedClassFilter).map(e => e.student_id));
      students = students.filter(s => studentIdsInClass.has(s.id));
    }

    if (studentListSearchQuery.trim()) {
      const lowerCaseQuery = studentListSearchQuery.toLowerCase();
      students = students.filter(s =>
        s.first_name?.toLowerCase().includes(lowerCaseQuery) ||
        s.last_name?.toLowerCase().includes(lowerCaseQuery) ||
        s.username?.toLowerCase().includes(lowerCaseQuery.replace('@', '')) ||
        s.email?.toLowerCase().includes(lowerCaseQuery)
      );
    }
    return students;
  }, [allStudents, currentUserProfile, classes, allStudentClassEnrollments, selectedEstablishmentFilter, selectedCurriculumFilter, selectedClassFilter, studentListSearchQuery]);

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

  if (currentRole !== 'creator') {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès Restreint
        </h1>
        <p className="text-lg text-muted-foreground">
          Seuls les créateurs (professeurs) peuvent accéder à cette page.
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
        Créez de nouveaux comptes élèves et gérez leurs affectations aux classes que vous supervisez.
      </p>

      {/* Section: Créer un nouvel élève */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" /> Créer un nouvel élève
          </CardTitle>
          <CardDescription>Créez un nouveau compte élève.</CardDescription>
        </CardHeader>
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
              onChange={(e) => handleUsernameChange(e.target.value)}
              status={usernameAvailabilityStatus}
              errorMessage={usernameAvailabilityStatus === 'taken' ? "Nom d'utilisateur déjà pris" : undefined}
            />
            <InputWithStatus
              type="email"
              placeholder="Email"
              value={newStudentEmail}
              onChange={(e) => handleEmailChange(e.target.value)}
              status={emailAvailabilityStatus}
              errorMessage={emailAvailabilityStatus === 'taken' ? "Email déjà enregistré" : undefined}
            />
            <Input
              type="password"
              placeholder="Mot de passe"
              value={newStudentPassword}
              onChange={(e) => setNewStudentPassword(e.target.value)}
            />
          </div>
          <Button onClick={handleCreateStudent} disabled={isCreatingStudent || usernameAvailabilityStatus === 'checking' || emailAvailabilityStatus === 'checking'}>
            {isCreatingStudent ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />} Créer l'élève
          </Button>
        </CardContent>
      </Card>

      {/* Section: Affecter un élève à une classe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-primary" /> Affecter un élève à une classe
          </CardTitle>
          <CardDescription>Inscrivez un élève à une classe que vous gérez pour une année scolaire spécifique.</CardDescription>
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
                    {classes.filter(cls => currentUserProfile && cls.creator_ids.includes(currentUserProfile.id)).map(cls => (
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
                value={studentListSearchQuery}
                onChange={(e) => setStudentListSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex-shrink-0 sm:w-1/3">
              <Label htmlFor="establishment-filter">Filtrer par Établissement</Label>
              <Select value={selectedEstablishmentFilter || "all"} onValueChange={(value) => {
                setSelectedEstablishmentFilter(value === "all" ? null : value);
                setSelectedCurriculumFilter(null);
                setSelectedClassFilter(null);
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
              <Label htmlFor="curriculum-filter">Filtrer par Cursus</Label>
              <Select value={selectedCurriculumFilter || "all"} onValueChange={(value) => {
                setSelectedCurriculumFilter(value === "all" ? null : value);
                setSelectedClassFilter(null);
              }}>
                <SelectTrigger id="curriculum-filter">
                  <SelectValue placeholder="Tous les cursus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les cursus</SelectItem>
                  {curricula.filter(cur => !selectedEstablishmentFilter || cur.establishment_id === selectedEstablishmentFilter).map(cur => (
                    <SelectItem key={cur.id} value={cur.id}>
                      {cur.name} ({getEstablishmentName(cur.establishment_id)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-shrink-0 sm:w-1/3">
              <Label htmlFor="class-filter">Filtrer par Classe</Label>
              <Select value={selectedClassFilter || "all"} onValueChange={(value) => {
                setSelectedClassFilter(value === "all" ? null : value);
              }}>
                <SelectTrigger id="class-filter">
                  <SelectValue placeholder="Toutes les classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  {classes.filter(cls => currentUserProfile && cls.creator_ids.includes(currentUserProfile.id) && (!selectedCurriculumFilter || cls.curriculum_id === selectedCurriculumFilter)).map(cls => (
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
                {studentListSearchQuery.trim() === '' && !selectedClassFilter && !selectedEstablishmentFilter && !selectedCurriculumFilter
                  ? "Aucun élève à afficher. Utilisez la recherche ou les filtres."
                  : "Aucun élève trouvé pour votre recherche ou vos filtres."}
              </p>
            ) : (
              studentsToDisplay.map((profile) => {
                const currentEnrollments = allStudentClassEnrollments.filter(e => e.student_id === profile.id);
                const currentClassEnrollment = currentEnrollments.find(e => {
                  const cls = classes.find(c => c.id === e.class_id);
                  const currentSchoolYear = `${currentYear}-${currentYear + 1}`;
                  return cls?.school_year === currentSchoolYear;
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
                      {currentClassEnrollment && (
                        <Button variant="outline" size="sm" onClick={() => handleRemoveStudentFromClass(currentClassEnrollment.id)}>
                          <XCircle className="h-4 w-4 mr-1" /> Retirer de la classe
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleSendMessageToStudent(profile)}>
                        <Mail className="h-4 w-4 mr-1" /> Message
                      </Button>
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

export default CreatorStudentManagementPage;