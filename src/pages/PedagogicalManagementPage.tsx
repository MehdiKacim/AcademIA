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
import { PlusCircle, Trash2, Users, GraduationCap, Mail, Search, UserCheck, UserX, Loader2, XCircle, CalendarDays } from "lucide-react";
import { Class, Profile, Curriculum, Establishment, StudentClassEnrollment, SchoolYear } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import {
  getAllProfiles,
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
  loadSchoolYears,
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

// Helper to get the current school year
const getCurrentSchoolYear = () => {
  const currentMonth = new Date().getMonth(); // 0-indexed (0 = Jan, 8 = Sep, 11 = Dec)
  const currentYear = new Date().getFullYear();
  if (currentMonth >= 8) { // September to December
    return `${currentYear}-${currentYear + 1}`;
  } else { // January to August
    return `${currentYear - 1}-${currentYear}`;
  }
};

const PedagogicalManagementPage = () => {
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

  // States for assign student to class section
  const [studentSearchInputClass, setStudentSearchInputClass] = useState('');
  const [selectedStudentForClassAssignment, setSelectedStudentForClassAssignment] = useState<Profile | null>(null);
  const [classToAssign, setClassToAssign] = useState<string>("");
  const [enrollmentSchoolYearId, setEnrollmentSchoolYearId] = useState<string>(""); // Changed to schoolYearId
  const [openStudentSelectClass, setOpenStudentSelectClass] = useState(false);
  const [isSearchingUserClass, setIsSearchingUserClass] = useState(false);
  const debounceTimeoutRefClass = useRef<ReturnType<typeof setTimeout> | null>(null);

  // States for student list section (within classes)
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null);
  const [selectedEstablishmentFilter, setSelectedEstablishmentFilter] = useState<string | null>(null);
  const [selectedSchoolYearFilter, setSelectedSchoolYearFilter] = useState<string | null>(null); // Changed to schoolYearFilter

  // Get classId from URL for initial filtering
  const classIdFromUrl = searchParams.get('classId');

  useEffect(() => {
    const fetchData = async () => {
      setClasses(await loadClasses());
      setCurricula(await loadCurricula());
      setEstablishments(await loadEstablishments());
      setAllProfiles(await getAllProfiles());
      setAllStudentClassEnrollments(await getAllStudentClassEnrollments());
      setSchoolYears(await loadSchoolYears());
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

  // Set default school year for new enrollment and filter
  useEffect(() => {
    const activeYear = schoolYears.find(sy => sy.is_active);
    if (activeYear) {
      setEnrollmentSchoolYearId(activeYear.id);
      setSelectedSchoolYearFilter(activeYear.id);
    } else if (schoolYears.length > 0) {
      // Fallback to the most recent year if no active one
      setEnrollmentSchoolYearId(schoolYears[0].id);
      setSelectedSchoolYearFilter(schoolYears[0].id);
    }
  }, [schoolYears]);

  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';
  const getCurriculumName = (id?: string) => curricula.find(c => c.id === id)?.name || 'N/A';
  const getClassName = (id?: string) => classes.find(c => c.id === id)?.name || 'N/A';
  const getSchoolYearName = (id?: string) => schoolYears.find(sy => sy.id === id)?.name || 'N/A';
  
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

    // Permission check: Professeur can only remove from classes they manage.
    if (currentRole === 'professeur' && !classOfEnrollment.creator_ids.includes(currentUserProfile.id)) {
      showError("Vous ne pouvez retirer des élèves que des classes que vous gérez.");
      return;
    }
    // Permission check: Director/Deputy Director can only remove from classes in their establishment.
    if ((currentRole === 'director' || currentRole === 'deputy_director') && classOfEnrollment.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez retirer des élèves que des classes de votre établissement.");
      return;
    }
    // Permission check: Tutor can only remove from classes in their establishment.
    if (currentRole === 'tutor' && classOfEnrollment.establishment_id !== currentUserProfile.establishment_id) {
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
    navigate(`/messages?contactId=${studentProfile.id}`);
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
    if (!enrollmentSchoolYearId) { // Changed to schoolYearId
      showError("Veuillez spécifier l'année scolaire.");
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
    // Permission check: Tutor can only assign to classes in their establishment.
    if (currentRole === 'tutor' && selectedClass.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez affecter des élèves qu'aux classes de votre établissement.");
      return;
    }

    const existingEnrollment = allStudentClassEnrollments.find(
      e => e.student_id === selectedStudentForClassAssignment.id && e.class_id === classToAssign && e.school_year_id === enrollmentSchoolYearId // Changed to schoolYearId
    );

    if (existingEnrollment) {
      showError("Cet élève est déjà inscrit à cette classe pour cette année scolaire.");
      return;
    }

    try {
      const newEnrollment: Omit<StudentClassEnrollment, 'id' | 'created_at' | 'updated_at' | 'school_year_name'> = {
        student_id: selectedStudentForClassAssignment.id,
        class_id: classToAssign,
        school_year_id: enrollmentSchoolYearId, // Changed to schoolYearId
      };
      const savedEnrollment = await upsertStudentClassEnrollment(newEnrollment);

      if (savedEnrollment) {
        setAllStudentClassEnrollments(await getAllStudentClassEnrollments()); // Refresh enrollments
        showSuccess(`Élève ${selectedStudentForClassAssignment.first_name} ${selectedStudentForClassAssignment.last_name} inscrit à la classe ${getClassName(classToAssign)} pour ${getSchoolYearName(enrollmentSchoolYearId)} !`); // Changed to schoolYearId
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
    setEnrollmentSchoolYearId(activeYear ? activeYear.id : (schoolYears.length > 0 ? schoolYears[0].id : "")); // Reset to active or first year
    setOpenStudentSelectClass(false);
  };

  const filteredStudentsForClassDropdown = studentSearchInputClass.trim() === ''
    ? allProfiles.filter(p => p.role === 'student').slice(0, 10)
    : allProfiles.filter(p =>
        p.role === 'student' &&
        (p.username?.toLowerCase().includes(studentSearchInputClass.toLowerCase()) ||
        p.first_name?.toLowerCase().includes(studentSearchInputClass.toLowerCase()) ||
        p.last_name?.toLowerCase().includes(studentSearchInputClass.toLowerCase()))
      ).slice(0, 10);

  const studentsInSelectedClassAndYear = React.useMemo(() => {
    if (!selectedClassFilter || !selectedSchoolYearFilter) return [];

    const enrollmentsInClassAndYear = allStudentClassEnrollments.filter(
      e => e.class_id === selectedClassFilter && e.school_year_id === selectedSchoolYearFilter // Changed to schoolYearId
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
  }, [allProfiles, allStudentClassEnrollments, selectedClassFilter, selectedSchoolYearFilter, studentSearchQuery]);

  const schoolYearsOptions = schoolYears.map(sy => ({ value: sy.id, label: sy.name }));

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
    (currentRole === 'professeur' && cls.creator_ids.includes(currentUserProfile.id))
  );

  const classesToDisplayForFilter = classes.filter(cls => 
    (currentRole === 'administrator') ||
    ((currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'tutor') && cls.establishment_id === currentUserProfile.establishment_id) ||
    (currentRole === 'professeur' && cls.creator_ids.includes(currentUserProfile.id))
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion Pédagogique
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Gérez les affectations des élèves aux classes.
      </p>

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
                    {(() => {
                      if (isSearchingUserClass && studentSearchInputClass.trim() !== '') {
                        return (
                          <CommandEmpty className="py-2 text-center text-muted-foreground flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> <span>Recherche...</span>
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
                              <CommandItem
                                key={profile.id}
                                value={profile.username}
                                onSelect={() => {
                                  setSelectedStudentForClassAssignment(profile);
                                  setStudentSearchInputClass(profile.username || '');
                                  setOpenStudentSelectClass(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedStudentForClassAssignment?.id === profile.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span>{profile.first_name} {profile.last_name} (@{profile.username})</span>
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
                    {selectedStudentForClassAssignment.enrollment_start_date && selectedStudentForClassAssignment.enrollment_end_date && (
                      <span> (Du {format(parseISO(selectedStudentForClassAssignment.enrollment_start_date), 'dd/MM/yyyy', { locale: fr })} au {format(parseISO(selectedStudentForClassAssignment.enrollment_end_date), 'dd/MM/yyyy', { locale: fr })})</span>
                    )}
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
                      {classesToDisplayForAssignment
                        .filter(cls => 
                          (!selectedStudentForClassAssignment.establishment_id || cls.establishment_id === selectedStudentForClassAssignment.establishment_id)
                        )
                        .map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} ({getCurriculumName(cls.curriculum_id)}) - {getSchoolYearName(cls.school_year_id)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="enrollment-school-year" className="text-base font-semibold mb-2 block mt-4">Année scolaire</Label>
                    <Select value={enrollmentSchoolYearId} onValueChange={setEnrollmentSchoolYearId}>
                      <SelectTrigger id="enrollment-school-year" className="w-full">
                        <SelectValue placeholder="Sélectionner l'année scolaire" />
                      </SelectTrigger>
                      <SelectContent>
                        {schoolYearsOptions.map(year => (
                          <SelectItem key={year.value} value={year.value}>{year.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAssignStudentToClass} disabled={!classToAssign || !enrollmentSchoolYearId}>
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

      {/* Section: Liste des élèves par classe */}
      <Card>
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
              }}
              disabled={['director', 'deputy_director', 'professeur', 'tutor'].includes(currentRole || '')}
              >
                <SelectTrigger id="establishment-filter">
                  <SelectValue placeholder="Tous les établissements" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-lg bg-background/80">
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
                <SelectContent className="backdrop-blur-lg bg-background/80">
                  {classesToDisplayForFilter
                    .filter(cls => 
                      (!selectedEstablishmentFilter || cls.establishment_id === selectedEstablishmentFilter)
                    )
                    .map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} ({getCurriculumName(cls.curriculum_id)}) - {getSchoolYearName(cls.school_year_id)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-shrink-0 sm:w-1/3">
              <Label htmlFor="school-year-filter">Filtrer par Année Scolaire</Label>
              <Select value={selectedSchoolYearFilter || "all"} onValueChange={(value) => setSelectedSchoolYearFilter(value === "all" ? null : value)}>
                <SelectTrigger id="school-year-filter">
                  <SelectValue placeholder="Toutes les années" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-lg bg-background/80">
                  <SelectItem value="all">Toutes les années</SelectItem>
                  {schoolYearsOptions.map(year => (
                    <SelectItem key={year.value} value={year.value}>{year.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            {studentsInSelectedClassAndYear.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                {studentSearchQuery.trim() === '' && !selectedClassFilter && !selectedEstablishmentFilter && !selectedSchoolYearFilter
                  ? <span>Aucun élève à afficher. Utilisez la recherche ou les filtres.</span>
                  : <span>Aucun élève trouvé pour votre recherche ou vos filtres.</span>}
              </p>
            ) : (
              studentsInSelectedClassAndYear.map((profile) => {
                const currentEnrollment = allStudentClassEnrollments.find(e => e.student_id === profile.id && e.class_id === selectedClassFilter && e.school_year_id === selectedSchoolYearFilter);
                const currentClass = currentEnrollment ? classes.find(c => c.id === currentEnrollment.class_id) : undefined;

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
                          Classe: {currentClass.name} ({getCurriculumName(currentClass.curriculum_id)}) - {currentClass.school_year_name}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Non affecté à une classe pour l'année scolaire en cours</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                      {currentEnrollment && (currentRole === 'professeur' || currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'administrator' || currentRole === 'tutor') && (
                        <Button variant="outline" size="sm" onClick={() => handleRemoveStudentFromClass(currentEnrollment.id)}>
                          <UserX className="h-4 w-4 mr-1" /> Retirer de la classe
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

export default PedagogicalManagementPage;