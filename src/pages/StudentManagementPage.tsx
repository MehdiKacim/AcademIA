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
  PlusCircle, Trash2, Users, GraduationCap, Mail, Search, UserCheck, UserX, Loader2, XCircle, CalendarDays, School, ChevronDown, ChevronUp, UserPlus, Building2, LayoutList, Info, User, // Existing imports
  PenTool, BriefcaseBusiness, UserRoundCog // Added missing icons for role mapping
} from "lucide-react";
import { Class, Profile, Curriculum, StudentClassEnrollment, SchoolYear, Establishment } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import {
  getAllProfiles,
  findProfileByUsername,
  updateProfile,
  deleteProfile,
  getAllStudentClassEnrollments,
  checkUsernameExists,
  checkEmailExists,
  upsertStudentClassEnrollment, // Import upsertStudentClassEnrollment
} from '@/lib/studentData';
import { useCourseChat } from '@/contexts/CourseChatContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  loadClasses,
  loadCurricula,
  loadEstablishments,
  loadSchoolYears,
  getEstablishmentName,
  getCurriculumName,
  getClassName,
  getSchoolYearName,
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
import InputWithStatus from '@/components/InputWithStatus';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from '@/integrations/supabase/client';
import EditUserDialog from '@/components/EditUserDialog'; // Import the new dialog component

const iconMap: { [key: string]: React.ElementType } = {
  Building2, LayoutList, CalendarDays, Users, Info, User,
  PlusCircle, Trash2, GraduationCap, Mail, Search, UserCheck, UserX, Loader2, XCircle, School, ChevronDown, ChevronUp, UserPlus,
  PenTool, BriefcaseBusiness, UserRoundCog, // Added to iconMap

  // Role-specific icons
  student: GraduationCap,
  professeur: PenTool,
  tutor: Users,
  director: BriefcaseBusiness,
  deputy_director: BriefcaseBusiness,
  administrator: UserRoundCog,
};

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

const StudentManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser, fetchUserProfile } = useRole(); // Added fetchUserProfile
  const { openChat } = useCourseChat();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [classes, setClasses] = useState<Class[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [allStudentClassEnrollments, setAllStudentClassEnrollments] = useState<StudentClassEnrollment[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);

  const [newStudentFirstName, setNewStudentFirstName] = useState('');
  const [newStudentLastName, setNewStudentLastName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newStudentEstablishmentId, setNewStudentEstablishmentId] = useState<string | null>(null);
  const [newStudentEnrollmentStartDate, setNewStudentEnrollmentStartDate] = useState<Date | undefined>(undefined);
  const [newStudentEnrollmentEndDate, setNewStudentEnrollmentEndDate] = useState<Date | undefined>(undefined);
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);
  const [isNewStudentFormOpen, setIsNewStudentFormOpen] = useState(false);

  const [usernameAvailabilityStatus, setUsernameAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailAvailabilityStatus, setEmailAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const debounceTimeoutRefUsername = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimeoutRefEmail = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [studentSearchQuery, setSearchStudentQuery] = useState('');
  const [selectedEstablishmentFilter, setSelectedEstablishmentFilter] = useState<string | 'all'>('all');

  const classIdFromUrl = searchParams.get('classId');

  const [studentSearchInputClass, setStudentSearchInputClass] = useState('');
  const [selectedStudentForClassAssignment, setSelectedStudentForClassAssignment] = useState<Profile | null>(null);
  const [classToAssign, setClassToAssign] = useState<string>("");
  const [enrollmentSchoolYearId, setEnrollmentSchoolYearId] = useState<string>("");
  const [enrollmentEstablishmentId, setEnrollmentEstablishmentId] = useState<string | null>(null);
  const [openStudentSelectClass, setOpenStudentSelectClass] = useState(false);
  const [isSearchingUserClass, setIsSearchingUserClass] = useState(false);
  const debounceTimeoutRefClass = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [classToAssignSearchQuery, setClassToAssignSearchQuery] = useState('');
  const [enrollmentSchoolYearSearchQuery, setEnrollmentSchoolYearSearchQuery] = useState('');
  const [enrollmentEstablishmentSearchQuery, setEnrollmentEstablishmentSearchQuery] = useState('');
  const [filterClassSearchQuery, setFilterClassSearchQuery] = useState('');
  const [filterEstablishmentSearchQuery, setFilterEstablishmentSearchQuery] = useState('');
  const [filterSchoolYearSearchQuery, setFilterSchoolYearSearchQuery] = useState('');

  // States for editing user
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false); // Changed name to avoid conflict
  const [userToEdit, setUserToEdit] = useState<Profile | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setClasses(await loadClasses());
        setCurricula(await loadCurricula());
        setEstablishments(await loadEstablishments());
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

  useEffect(() => {
    if (classIdFromUrl) {
      setSelectedClassFilter(classIdFromUrl);
    } else {
      setSelectedClassFilter(null);
    }
  }, [classIdFromUrl]);

  useEffect(() => {
    const activeYear = schoolYears.find(sy => sy.is_active);
    if (activeYear) {
      setEnrollmentSchoolYearId(activeYear.id);
      setSelectedSchoolYearFilter(activeYear.id);
    } else if (schoolYears.length > 0) {
      setEnrollmentSchoolYearId(schoolYears[0].id);
      setSelectedSchoolYearFilter(schoolYears[0].id);
    }

    if (currentRole === 'administrator') {
      setEnrollmentEstablishmentId(null);
      setSelectedEstablishmentFilter('all');
    } else if (currentUserProfile?.establishment_id) {
      setEnrollmentEstablishmentId(currentUserProfile.establishment_id);
      setSelectedEstablishmentFilter(currentUserProfile.establishment_id);
    } else {
      setEnrollmentEstablishmentId(null);
      setSelectedEstablishmentFilter('all');
    }
  }, [schoolYears, currentRole, currentUserProfile?.establishment_id]);

  const handleRemoveStudentFromClass = async (enrollmentId: string) => {
    if (!currentUserProfile || !['professeur', 'tutor', 'director', 'deputy_director', 'administrator'].includes(currentRole || '')) {
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

    if (currentRole === 'professeur' && !classOfEnrollment.creator_ids.includes(currentUserProfile.id)) {
      showError("Vous ne pouvez retirer des élèves que des classes que vous gérez.");
      return;
    }
    if ((currentRole === 'director' || currentRole === 'deputy_director') && enrollmentToDelete.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez retirer des élèves que des classes de votre établissement.");
      return;
    }
    if (currentRole === 'tutor' && enrollmentToDelete.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez retirer des élèves que des classes de votre établissement.");
      return;
    }

    try {
      await deleteStudentClassEnrollment(enrollmentId);
      setAllStudentClassEnrollments(await getAllStudentClassEnrollments());
      showSuccess(`Élève retiré de la classe !`);
    } catch (error: any) {
      console.error("Error removing student from class:", error);
      showError(`Erreur lors du retrait de l'élève: ${error.message}`);
    }
  };

  const handleSendMessageToStudent = (studentProfile: Profile) => {
    navigate(`/messages?contactId=${studentProfile.id}`);
  };

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
    if (!currentUserProfile || !['professeur', 'tutor', 'director', 'deputy_director', 'administrator'].includes(currentRole || '')) {
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
    if (!enrollmentSchoolYearId) {
      showError("Veuillez spécifier l'année scolaire.");
      return;
    }
    if (!enrollmentEstablishmentId) {
      showError("Veuillez spécifier l'établissement.");
      return;
    }
    if (selectedStudentForClassAssignment.role !== 'student') {
      showError("Seuls les profils d'élèves peuvent être affectés à une classe.");
      return;
    }
    if (selectedStudentForClassAssignment.establishment_id !== enrollmentEstablishmentId) {
      showError("L'élève sélectionné n'appartient pas à l'établissement choisi.");
      return;
    }
    const selectedClass = classes.find(cls => cls.id === classToAssign);
    if (!selectedClass) {
      showError("Classe sélectionnée introuvable.");
      return;
    }
    if (selectedClass.establishment_id !== enrollmentEstablishmentId) {
      showError("La classe sélectionnée n'appartient pas à l'établissement choisi.");
      return;
    }

    if (currentRole === 'professeur' && !selectedClass.creator_ids.includes(currentUserProfile.id)) {
      showError("Vous ne pouvez affecter des élèves qu'aux classes que vous gérez.");
      return;
    }
    if ((currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'tutor') && enrollmentEstablishmentId !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez affecter des élèves qu'aux classes de votre établissement.");
      return;
    }

    const existingEnrollment = allStudentClassEnrollments.find(
      e => e.student_id === selectedStudentForClassAssignment.id && e.class_id === classToAssign && e.school_year_id === enrollmentSchoolYearId && e.establishment_id === enrollmentEstablishmentId
    );

    if (existingEnrollment) {
      showError("Cet élève est déjà inscrit à cette classe pour cette année scolaire et cet établissement.");
      return;
    }

    try {
      const newEnrollment: Omit<StudentClassEnrollment, 'id' | 'created_at' | 'updated_at' | 'school_year_name'> = {
        student_id: selectedStudentForClassAssignment.id,
        class_id: classToAssign,
        school_year_id: enrollmentSchoolYearId,
        establishment_id: enrollmentEstablishmentId,
      };
      const savedEnrollment = await upsertStudentClassEnrollment(newEnrollment);

      if (savedEnrollment) {
        setAllStudentClassEnrollments(await getAllStudentClassEnrollments());
        showSuccess(`Élève ${selectedStudentForClassAssignment.first_name} ${selectedStudentForClassAssignment.last_name} inscrit à la classe ${getClassName(classToAssign, classes)} pour ${getSchoolYearName(enrollmentSchoolYearId, schoolYears)} (${getEstablishmentName(enrollmentEstablishmentId, establishments)}) !`);
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
    const activeYear = schoolYears.find(sy => sy.is_active);
    setEnrollmentSchoolYearId(activeYear ? activeYear.id : (schoolYears.length > 0 ? schoolYears[0].id : ""));
    setEnrollmentEstablishmentId(currentUserProfile?.establishment_id || null);
    setOpenStudentSelectClass(false);
  };

  const handleEditUser = (profile: Profile) => {
    setUserToEdit(profile);
    setIsEditUserDialogOpen(true);
  };

  const handleSaveEditedUser = async (updatedProfile: Profile) => {
    setAllProfiles(await getAllProfiles()); // Refresh the list of all users
  };

  const filteredStudentsForClassDropdown = studentSearchInputClass.trim() === ''
    ? allProfiles.filter(p => p.role === 'student' && (currentRole === 'administrator' || p.establishment_id === currentUserProfile?.establishment_id)).slice(0, 10)
    : allProfiles.filter(p =>
        p.role === 'student' &&
        (p.username?.toLowerCase().includes(studentSearchInputClass.toLowerCase()) ||
        p.first_name?.toLowerCase().includes(studentSearchInputClass.toLowerCase()) ||
        p.last_name?.toLowerCase().includes(studentSearchInputClass.toLowerCase())) &&
        (currentRole === 'administrator' || p.establishment_id === currentUserProfile?.establishment_id)
      ).slice(0, 10);

  const studentsInSelectedClassAndYear = React.useMemo(() => {
    if (!selectedClassFilter || !selectedSchoolYearFilter) return [];

    const enrollmentsInClassAndYear = allStudentClassEnrollments.filter(
      e => e.class_id === selectedClassFilter && e.school_year_id === selectedSchoolYearFilter && (currentRole === 'administrator' || e.establishment_id === currentUserProfile?.establishment_id)
    );
    const studentIdsInClassAndYear = new Set(enrollmentsInClassAndYear.map(e => e.student_id));

    let students = allProfiles.filter(p => p.role === 'student' && studentIdsInClassAndYear.has(p.id));

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
  }, [allProfiles, allStudentClassEnrollments, selectedClassFilter, selectedSchoolYearFilter, studentSearchQuery, currentRole, currentUserProfile?.establishment_id]);

  const schoolYearsOptions = schoolYears.map(sy => ({
    id: sy.id,
    label: sy.name,
    icon_name: 'CalendarDays',
    description: `${format(parseISO(sy.start_date), 'dd/MM/yyyy', { locale: fr })} - ${format(parseISO(sy.end_date), 'dd/MM/yyyy', { locale: fr })}`,
  }));

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

  const classesToDisplayForAssignment = classes.filter(cls =>
    (currentRole === 'administrator') ||
    ((currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'tutor') && cls.establishment_id === currentUserProfile.establishment_id) ||
    (currentRole === 'professeur' && cls.creator_ids.includes(currentUserProfile.id) && cls.establishment_id === currentUserProfile.establishment_id)
  ).map(cls => ({
    id: cls.id,
    label: cls.name,
    icon_name: 'Users',
    description: `${getCurriculumName(cls.curriculum_id, curricula)} - ${getSchoolYearName(cls.school_year_id, schoolYears)} (${getEstablishmentName(cls.establishment_id, establishments)})`,
  }));

  const classesToDisplayForFilter = classes.filter(cls =>
    (currentRole === 'administrator') ||
    ((currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'tutor') && cls.establishment_id === currentUserProfile.establishment_id) ||
    (currentRole === 'professeur' && cls.creator_ids.includes(currentUserProfile.id) && cls.establishment_id === currentUserProfile.establishment_id)
  ).map(cls => ({
    id: cls.id,
    label: cls.name,
    icon_name: 'Users',
    description: `${getCurriculumName(cls.curriculum_id, curricula)} - ${getSchoolYearName(cls.school_year_id, schoolYears)} (${getEstablishmentName(cls.establishment_id, establishments)})`,
  }));

  const establishmentsToDisplayForAssignment = establishments.filter(est =>
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion Pédagogique
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Gérez les affectations des élèves aux classes.
      </p>

      {/* Section: Affecter un élève à une classe */}
      <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
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
                <MotionButton
                  variant="outline"
                  role="combobox"
                  aria-expanded={openStudentSelectClass}
                  className="w-full justify-between rounded-android-tile"
                  id="select-student-for-class-assignment"
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                >
                  {selectedStudentForClassAssignment ? `${selectedStudentForClassAssignment.first_name} ${selectedStudentForClassAssignment.last_name} (@${selectedStudentForClassAssignment.username})` : "Rechercher un élève..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </MotionButton>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-android-tile z-[9999]">
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
                    {(() => {
                      if (isSearchingUserClass && studentSearchInputClass.trim() !== '') {
                        return (
                          <CommandEmpty className="py-2 text-center text-muted-foreground flex items-center justify-center gap-2">
                            <LoadingSpinner iconClassName="h-4 w-4" /> <span>Recherche...</span>
                          </CommandEmpty>
                        );
                      } else if (filteredStudentsForClassDropdown.length === 0 && studentSearchInputClass.trim() !== '') {
                        return (
                          <CommandEmpty className="py-2 text-center text-muted-foreground">
                            <span>Aucun élève trouvé pour "{studentSearchInputClass}".</span>
                          </CommandEmpty>
                        );
                      } else {
                        return (
                          <CommandGroup>
                            {filteredStudentsForClassDropdown.map((profile) => (
                              <MotionCommandItem
                                key={profile.id}
                                value={profile.username}
                                onSelect={() => {
                                  setSelectedStudentForClassAssignment(profile);
                                  setStudentSearchInputClass(profile.username || '');
                                  setOpenStudentSelectClass(false);
                                }}
                                whileHover={{ scale: 1.02, backgroundColor: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                                whileTap={{ scale: 0.98, backgroundColor: "hsl(var(--accent-foreground))", color: "hsl(var(--background))" }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedStudentForClassAssignment?.id === profile.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span>{profile.first_name} {profile.last_name} (@{profile.username})</span>
                              </MotionCommandItem>
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

            {selectedStudentForClassAssignment && (
              <div className="p-4 border rounded-android-tile bg-muted/20 space-y-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-500" />
                  <p className="font-medium text-lg">{selectedStudentForClassAssignment.first_name} {selectedStudentForClassAssignment.last_name}</p>
                </div>
                <p className="text-sm text-muted-foreground">Email : {selectedStudentForClassAssignment.email}</p>
                <p className="text-sm text-muted-foreground">Nom d'utilisateur : @{selectedStudentForClassAssignment.username}</p>
                {selectedStudentForClassAssignment.establishment_id && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> {getEstablishmentName(selectedStudentForClassAssignment.establishment_id, establishments)}
                  </p>
                )}
                {selectedStudentForClassAssignment.enrollment_start_date && selectedStudentForClassAssignment.enrollment_end_date && (
                  <p className="text-sm text-muted-foreground">
                    <span>Du {format(parseISO(selectedStudentForClassAssignment.enrollment_start_date), 'dd/MM/yyyy', { locale: fr })} au {format(parseISO(selectedStudentForClassAssignment.enrollment_end_date), 'dd/MM/yyyy', { locale: fr })})</span>
                  </p>
                )}

                <div>
                  <Label htmlFor="class-to-assign" className="text-base font-semibold mb-2 block mt-4">2. Choisir la classe d'affectation</Label>
                  <SimpleItemSelector
                    id="class-to-assign"
                    options={classesToDisplayForAssignment}
                    value={classToAssign}
                    onValueChange={(value) => setClassToAssign(value)}
                    searchQuery={classToAssignSearchQuery}
                    onSearchQueryChange={setClassToAssignSearchQuery}
                    placeholder="Sélectionner une classe"
                    emptyMessage="Aucune classe trouvée."
                    iconMap={iconMap}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="enrollment-school-year" className="text-base font-semibold mb-2 block mt-4">Année scolaire</Label>
                    <SimpleItemSelector
                      id="enrollment-school-year"
                      options={schoolYearsOptions}
                      value={enrollmentSchoolYearId}
                      onValueChange={(value) => setEnrollmentSchoolYearId(value)}
                      searchQuery={enrollmentSchoolYearSearchQuery}
                      onSearchQueryChange={setEnrollmentSchoolYearSearchQuery}
                      placeholder="Sélectionner l'année scolaire"
                      emptyMessage="Aucune année scolaire trouvée."
                      iconMap={iconMap}
                    />
                  </div>
                  {(currentRole === 'administrator' || currentUserProfile?.establishment_id) && (
                    <div>
                      <Label htmlFor="enrollment-establishment" className="text-base font-semibold mb-2 block mt-4">Établissement</Label>
                      <SimpleItemSelector
                        id="enrollment-establishment"
                        options={establishmentsToDisplayForAssignment}
                        value={enrollmentEstablishmentId}
                        onValueChange={(value) => setEnrollmentEstablishmentId(value)}
                        searchQuery={enrollmentEstablishmentSearchQuery}
                        onSearchQueryChange={setEnrollmentEstablishmentSearchQuery}
                        placeholder="Sélectionner un établissement"
                        emptyMessage="Aucun établissement trouvé."
                        iconMap={iconMap}
                        disabled={currentRole !== 'administrator' && !!currentUserProfile?.establishment_id}
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <MotionButton onClick={handleAssignStudentToClass} disabled={!classToAssign || !enrollmentSchoolYearId || !enrollmentEstablishmentId} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Inscrire à cette classe
                  </MotionButton>
                  <MotionButton variant="outline" onClick={handleClearClassAssignmentForm} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <XCircle className="h-4 w-4 mr-2" /> Effacer le formulaire
                  </MotionButton>
                </div>
              </div>
            )}
          </CardContent>
        </MotionCard>

      {/* Section: Liste des élèves par classe */}
      <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" /> Élèves par Classe
          </CardTitle>
          <CardDescription>Visualisez et gérez les élèves inscrits dans les classes.</CardDescription>
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
            {(currentRole === 'administrator' || currentUserProfile?.establishment_id) && (
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
            <div className="flex-shrink-0 sm:w-1/3">
              <Label htmlFor="class-filter">Filtrer par Classe</Label>
              <SimpleItemSelector
                id="class-filter"
                options={[{ id: 'all', label: 'Toutes les classes', icon_name: 'Users' }, ...classesToDisplayForFilter]}
                value={selectedClassFilter}
                onValueChange={(value) => {
                  setSelectedClassFilter(value);
                  setSearchParams(params => {
                    if (value === "all") {
                      params.delete('classId');
                    } else {
                      params.set('classId', value);
                    }
                    return params;
                  }, { replace: true });
                }}
                searchQuery={filterClassSearchQuery}
                onSearchQueryChange={setFilterClassSearchQuery}
                placeholder="Toutes les classes"
                emptyMessage="Aucune classe trouvée."
                iconMap={iconMap}
              />
            </div>
            <div className="flex-shrink-0 sm:w-1/3">
              <Label htmlFor="school-year-filter">Filtrer par Année Scolaire</Label>
              <SimpleItemSelector
                id="school-year-filter"
                options={[{ id: 'all', label: 'Toutes les années', icon_name: 'CalendarDays' }, ...schoolYearsOptions]}
                value={selectedSchoolYearFilter}
                onValueChange={(value) => setSelectedSchoolYearFilter(value)}
                searchQuery={filterSchoolYearSearchQuery}
                onSearchQueryChange={setFilterSchoolYearSearchQuery}
                placeholder="Toutes les années"
                emptyMessage="Aucune année scolaire trouvée."
                iconMap={iconMap}
              />
            </div>
          </div>
          <div className="space-y-2">
            {studentsInSelectedClassAndYear.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                {studentSearchQuery.trim() === '' && !selectedClassFilter && !selectedSchoolYearFilter && selectedEstablishmentFilter === 'all'
                  ? <span>Aucun élève à afficher. Utilisez la recherche ou les filtres.</span>
                  : <span>Aucun élève trouvé pour votre recherche ou vos filtres.</span>}
              </p>
            ) : (
              studentsInSelectedClassAndYear.map((profile) => {
                const currentEnrollment = allStudentClassEnrollments.find(e => e.student_id === profile.id && e.class_id === selectedClassFilter && e.school_year_id === selectedSchoolYearFilter);
                const currentClass = currentEnrollment ? classes.find(c => c.id === currentEnrollment.class_id) : undefined;

                return (
                  <MotionCard key={profile.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)" }} whileTap={{ scale: 0.99 }}>
                    <div className="flex-grow">
                      <p className="font-medium">{profile.first_name} {profile.last_name} <span className="text-sm text-muted-foreground">(@{profile.username})</span></p>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
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
                      {currentClass ? (
                        <p className="text-xs text-muted-foreground">
                          Classe: {currentClass.name} ({getCurriculumName(currentClass.curriculum_id, curricula)}) - {getSchoolYearName(currentClass.school_year_id, schoolYears)}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Non affecté à une classe pour l'année scolaire en cours</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                      {currentEnrollment && (currentRole === 'professeur' || currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'administrator' || currentRole === 'tutor') && (
                        <MotionButton variant="outline" size="sm" onClick={() => handleRemoveStudentFromClass(currentEnrollment.id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <UserX className="h-4 w-4 mr-1" /> Retirer de la classe
                        </MotionButton>
                      )}
                      <MotionButton variant="outline" size="sm" onClick={() => handleSendMessageToStudent(profile)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Mail className="h-4 w-4 mr-1" /> Message
                      </MotionButton>
                      <MotionButton variant="outline" size="sm" onClick={() => handleEditUser(profile)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Edit className="h-4 w-4" />
                      </MotionButton>
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
          allProfiles={allProfiles}
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

export default StudentManagementPage;