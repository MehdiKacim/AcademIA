import React, { useState, useEffect, useRef } from 'react';
import { useRole } from "@/contexts/RoleContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, Users, School, BookOpen, GraduationCap, Mail, ArrowLeft, Search, UserCheck, UserX, Loader2, LayoutList, BarChart2 } from "lucide-react";
import {
  Establishment,
  Class,
  Curriculum,
  Student,
  User,
  CreatorProfile,
} from "@/lib/dataModels";
import {
  loadData,
  saveData,
  addData,
  updateData,
  deleteData,
} from "@/lib/localStorageUtils";
import { showSuccess, showError } from "@/utils/toast";
import {
  loadUsers,
  loadStudents,
  saveStudents,
  updateStudentProfile,
  deleteStudentProfile,
  getUserByUsername,
  getUserById,
  loadCreatorProfiles,
  updateCreatorProfile,
} from '@/lib/studentData';
import { useCourseChat } from '@/contexts/CourseChatContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  loadCourses,
  loadEstablishments,
  saveEstablishments,
  addEstablishmentToStorage,
  deleteEstablishmentFromStorage,
  loadCurricula,
  saveCurricula,
  addCurriculumToStorage,
  deleteCurriculumFromStorage,
  loadClasses,
  saveClasses,
  addClassToStorage,
  deleteClassFromStorage,
} from '@/lib/courseData';
import { useSearchParams } from 'react-router-dom';

// Shadcn UI components for autocomplete
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import CreatorAnalyticsSection from "@/components/CreatorAnalyticsSection";

const ClassManagement = () => {
  const { currentUser, currentRole } = useRole();
  const { openChat } = useCourseChat();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine the active tab from URL, default to 'establishments'
  const activeTab = searchParams.get('tab') || 'establishments';

  // Main states for data
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<Student[]>([]);
  const [creatorProfiles, setCreatorProfiles] = useState<CreatorProfile[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);

  // States for add/edit forms
  const [newEstablishmentName, setNewEstablishmentName] = useState('');
  const [newCurriculumName, setNewCurriculumName] = useState('');
  const [newCurriculumEstablishmentId, setNewCurriculumEstablishmentId] = useState<string | undefined>(undefined);
  const [newClassName, setNewClassName] = useState('');
  const [newClassCurriculumId, setNewClassCurriculumId] = useState<string | undefined>(undefined);

  // States for student assignment (autocomplete)
  const [usernameToAssign, setUsernameToAssign] = useState('');
  const [foundUserForAssignment, setFoundUserForAssignment] = useState<User | null>(null);
  const [classToAssign, setClassToAssign] = useState<string | undefined>(undefined);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openCommand, setOpenCommand] = useState(false);

  // State for managing curriculum courses
  const [isManageCoursesModalOpen, setIsManageCoursesModalOpen] = useState(false);
  const [selectedCurriculumForCourses, setSelectedCurriculumForCourses] = useState<Curriculum | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  // State for viewing students in a class
  const [selectedClassIdForStudents, setSelectedClassIdForStudents] = useState<string | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Load initial data
  useEffect(() => {
    setEstablishments(loadEstablishments());
    setCurricula(loadCurricula());
    setClasses(loadClasses());
    setUsers(loadUsers());
    setStudentProfiles(loadStudents());
    setCreatorProfiles(loadCreatorProfiles());
    setAllCourses(loadCourses());
  }, []);

  // Helper functions to get names from IDs
  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';
  const getCurriculumName = (id?: string) => curricula.find(c => c.id === id)?.name || 'N/A';
  const getClassName = (id?: string) => classes.find(c => c.id === id)?.name || 'N/A';
  const getUserFullName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'N/A';
  };
  const getUserUsername = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.username : 'N/A';
  };
  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.email : 'N/A';
  };

  // Debounced search for user username (autocomplete)
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (usernameToAssign.trim() === '') {
      setFoundUserForAssignment(null);
      setIsSearchingUser(false);
      return;
    }

    setIsSearchingUser(true);
    setFoundUserForAssignment(null);

    debounceTimeoutRef.current = setTimeout(() => {
      const user = getUserByUsername(usernameToAssign.trim());
      setFoundUserForAssignment(user || null);
      setIsSearchingUser(false);
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [usernameToAssign]);

  // --- Establishment Management ---
  const handleAddEstablishment = () => {
    if (newEstablishmentName.trim()) {
      const newEst: Establishment = { id: `est${Date.now()}`, name: newEstablishmentName.trim() };
      const updatedEstablishments = addEstablishmentToStorage(newEst);
      setEstablishments(updatedEstablishments);

      // If current user is a creator, associate them with this new establishment
      if (currentUser && currentUser.role === 'creator') {
        const creatorProfile = creatorProfiles.find(p => p.userId === currentUser.id);
        if (creatorProfile) {
          const updatedCreatorProfile = {
            ...creatorProfile,
            establishmentIds: [...(creatorProfile.establishmentIds || []), newEst.id],
          };
          setCreatorProfiles(updateCreatorProfile(updatedCreatorProfile));
        }
      }

      setNewEstablishmentName('');
      showSuccess("Établissement ajouté !");
    } else {
      showError("Le nom de l'établissement est requis.");
    }
  };

  const handleDeleteEstablishment = (id: string) => {
    // Delete associated curricula
    const curriculaToDelete = curricula.filter(cur => cur.establishmentId === id);
    curriculaToDelete.forEach(cur => handleDeleteCurriculum(cur.id, false));

    // Remove association from creator profiles
    const updatedCreatorProfiles = creatorProfiles.map(profile => ({
      ...profile,
      establishmentIds: profile.establishmentIds.filter(estId => estId !== id),
    }));
    setCreatorProfiles(updatedCreatorProfiles);
    // Save updated creator profiles (assuming updateCreatorProfile handles persistence)
    updatedCreatorProfiles.forEach(profile => updateCreatorProfile(profile));


    setEstablishments(deleteEstablishmentFromStorage(id));
    showSuccess("Établissement supprimé !");
  };

  // --- Curriculum Management ---
  const handleAddCurriculum = () => {
    if (newCurriculumName.trim() && newCurriculumEstablishmentId) {
      const newCur: Curriculum = { id: `cur${Date.now()}`, name: newCurriculumName.trim(), establishmentId: newCurriculumEstablishmentId, courseIds: [] };
      setCurricula(addCurriculumToStorage(newCur));
      setNewCurriculumName('');
      setNewCurriculumEstablishmentId(undefined);
      showSuccess("Cursus ajouté !");
    } else {
      showError("Le nom du cursus et l'établissement sont requis.");
    }
  };

  const handleDeleteCurriculum = (id: string, showToast: boolean = true) => {
    // Delete associated classes
    const classesToDelete = classes.filter(cls => cls.curriculumId === id);
    classesToDelete.forEach(cls => handleDeleteClass(cls.id, false));

    setCurricula(deleteCurriculumFromStorage(id));
    if (showToast) showSuccess("Cursus supprimé !");
  };

  const handleOpenManageCoursesModal = (curriculum: Curriculum) => {
    setSelectedCurriculumForCourses(curriculum);
    setSelectedCourseIds(curriculum.courseIds);
    setIsManageCoursesModalOpen(true);
  };

  const handleSaveCurriculumCourses = () => {
    if (selectedCurriculumForCourses) {
      const updatedCurriculum = { ...selectedCurriculumForCourses, courseIds: selectedCourseIds };
      setCurricula(updateCurriculumInStorage(updatedCurriculum));
      showSuccess("Cours du cursus mis à jour !");
      setIsManageCoursesModalOpen(false);
      setSelectedCurriculumForCourses(null);
      setSelectedCourseIds([]);
    }
  };

  // --- Class Management ---
  const handleAddClass = () => {
    if (newClassName.trim() && newClassCurriculumId) {
      const selectedCurriculum = curricula.find(c => c.id === newClassCurriculumId);
      if (!selectedCurriculum) {
        showError("Cursus sélectionné introuvable.");
        return;
      }
      const formattedClassName = `${selectedCurriculum.name}-${newClassName.trim()}`;
      const newCls: Class = {
        id: `class${Date.now()}`,
        name: formattedClassName,
        curriculumId: newClassCurriculumId,
        studentIds: [],
        creatorIds: currentUser ? [currentUser.id] : [],
      };
      setClasses(addClassToStorage(newCls));
      setNewClassName('');
      setNewClassCurriculumId(undefined);
      showSuccess("Classe ajoutée !");
    } else {
      showError("Le nom de la classe et le cursus sont requis.");
    }
  };

  const handleDeleteClass = (id: string, showToast: boolean = true) => {
    setClasses(deleteClassFromStorage(id));
    // Remove classId from associated student profiles
    const updatedStudentProfiles = studentProfiles.map(student =>
      student.classId === id ? { ...student, classId: undefined } : student
    );
    saveStudents(updatedStudentProfiles);
    setStudentProfiles(updatedStudentProfiles);
    if (showToast) showSuccess("Classe supprimée !");
  };

  // --- Student Management ---
  const handleAssignStudentToClass = () => {
    if (!foundUserForAssignment) {
      showError("Veuillez d'abord sélectionner un élève.");
      return;
    }
    if (!classToAssign) {
      showError("Veuillez sélectionner une classe.");
      return;
    }

    const studentProfile = studentProfiles.find(s => s.userId === foundUserForAssignment.id);
    if (!studentProfile) {
      showError("Le profil étudiant de cet utilisateur n'existe pas.");
      return;
    }

    if (studentProfile.classId === classToAssign) {
      showError("Cet élève est déjà dans cette classe.");
      return;
    }

    // Remove from old class if any
    if (studentProfile.classId) {
      const oldClass = classes.find(cls => cls.id === studentProfile.classId);
      if (oldClass) {
        const updatedOldClass = { ...oldClass, studentIds: oldClass.studentIds.filter(id => id !== studentProfile.id) };
        setClasses(prev => prev.map(cls => cls.id === oldClass.id ? updatedOldClass : cls));
        saveClasses(classes.map(cls => cls.id === oldClass.id ? updatedOldClass : cls));
      }
    }

    // Add to new class
    const newClass = classes.find(cls => cls.id === classToAssign);
    if (newClass) {
      const updatedNewClass = { ...newClass, studentIds: [...newClass.studentIds, studentProfile.id] };
      setClasses(prev => prev.map(cls => cls.id === newClass.id ? updatedNewClass : cls));
      saveClasses(classes.map(cls => cls.id === newClass.id ? updatedNewClass : cls));
    }

    const updatedStudentProfile = {
      ...studentProfile,
      classId: classToAssign,
    };
    setStudentProfiles(updateStudentProfile(updatedStudentProfile));

    showSuccess(`Élève ${foundUserForAssignment.firstName} ${foundUserForAssignment.lastName} affecté à la classe ${newClass?.name} !`);
    setUsernameToAssign('');
    setFoundUserForAssignment(null);
    setClassToAssign(undefined);
    setOpenCommand(false);
  };

  const handleRemoveStudentFromClass = (studentProfileId: string, classId: string) => {
    const studentToUpdate = studentProfiles.find(s => s.id === studentProfileId);
    if (studentToUpdate) {
      const updatedStudent = {
        ...studentToUpdate,
        classId: undefined,
      };
      setStudentProfiles(updateStudentProfile(updatedStudent));

      const updatedClasses = classes.map(cls => {
        if (cls.id === classId) {
          return { ...cls, studentIds: cls.studentIds.filter(id => id !== studentProfileId) };
        }
        return cls;
      });
      saveClasses(updatedClasses);
      setClasses(updatedClasses);
      showSuccess(`Élève retiré de la classe !`);
    }
  };

  const handleDeleteStudent = (studentProfileId: string) => {
    const studentProfileToDelete = studentProfiles.find(s => s.id === studentProfileId);
    if (!studentProfileToDelete) return;

    // Delete the student profile
    setStudentProfiles(deleteStudentProfile(studentProfileId));

    // Remove student profile from any classes they might be in
    const updatedClasses = classes.map(cls => ({
      ...cls,
      studentIds: cls.studentIds.filter(id => id !== studentProfileId)
    }));
    saveClasses(updatedClasses);
    setClasses(updatedClasses);

    showSuccess("Élève supprimé !");
  };

  const handleInviteStudentToCourse = (studentProfile: Student, courseTitle: string) => {
    const user = getUserById(studentProfile.userId);
    if (user) {
      openChat(`Bonjour ${user.firstName} ${user.lastName}, je vous invite à découvrir le cours "${courseTitle}" !`);
    }
  };

  const handleSendMessageToStudent = (studentProfile: Student) => {
    const user = getUserById(studentProfile.userId);
    if (user) {
      openChat(`Bonjour ${user.firstName} ${user.lastName}, j'ai une question ou un message pour vous.`);
    }
  };

  const handleViewStudentsInClass = (classId: string) => {
    setSelectedClassIdForStudents(classId);
  };

  const handleBackToClasses = () => {
    setSelectedClassIdForStudents(null);
  };

  const selectedClass = selectedClassIdForStudents ? classes.find(cls => cls.id === selectedClassIdForStudents) : null;
  const studentsInSelectedClass = selectedClass ? studentProfiles.filter(student => student.classId === selectedClass.id) : [];

  const filteredUsersForDropdown = usernameToAssign.trim() === ''
    ? []
    : users.filter(u =>
        u.role === 'student' &&
        (u.username.toLowerCase().includes(usernameToAssign.toLowerCase()) ||
        u.firstName.toLowerCase().includes(usernameToAssign.toLowerCase()) ||
        u.lastName.toLowerCase().includes(usernameToAssign.toLowerCase()))
      ).slice(0, 10);

  const filteredStudentProfiles = studentProfiles.filter(student => {
    const user = getUserById(student.userId);
    if (!user) return false;
    const lowerCaseQuery = studentSearchQuery.toLowerCase();
    return user.firstName.toLowerCase().includes(lowerCaseQuery) ||
           user.lastName.toLowerCase().includes(lowerCaseQuery) ||
           user.username.toLowerCase().includes(lowerCaseQuery.replace('@', '')) ||
           user.email.toLowerCase().includes(lowerCaseQuery);
  });

  if (currentRole !== 'creator' && currentRole !== 'tutor') {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès Restreint
        </h1>
        <p className="text-lg text-muted-foreground">
          Seuls les créateurs (professeurs) et les tuteurs peuvent accéder à cette page pour gérer les classes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        {currentRole === 'creator' ? 'Administration de l\'Application' : 'Gestion des Utilisateurs'}
      </h1>
      <p className="text-lg text-muted-foreground">
        {currentRole === 'creator' ? 'En tant qu\'administrateur, gérez les établissements, cursus, classes et élèves.' : 'En tant que tuteur, gérez vos élèves et leurs classes.'}
      </p>

      <Tabs defaultValue={activeTab} onValueChange={(value) => setSearchParams({ tab: value })} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {currentRole === 'creator' && (
            <>
              <TabsTrigger value="establishments">
                <School className="h-4 w-4 mr-2" /> Établissements
              </TabsTrigger>
              <TabsTrigger value="curricula">
                <LayoutList className="h-4 w-4 mr-2" /> Cursus
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="classes">
            <Users className="h-4 w-4 mr-2" /> Classes
          </TabsTrigger>
          <TabsTrigger value="students">
            <GraduationCap className="h-4 w-4 mr-2" /> Élèves
          </TabsTrigger>
        </TabsList>

        {/* --- Établissements Tab (Creator Only) --- */}
        {currentRole === 'creator' && (
          <TabsContent value="establishments" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Gérer les Établissements</CardTitle>
                <CardDescription>Ajoutez, modifiez ou supprimez des établissements.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nom du nouvel établissement"
                    value={newEstablishmentName}
                    onChange={(e) => setNewEstablishmentName(e.target.value)}
                  />
                  <Button onClick={handleAddEstablishment}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Ajouter
                  </Button>
                </div>
                <div className="space-y-2">
                  {establishments.length === 0 ? (
                    <p className="text-muted-foreground">Aucun établissement créé.</p>
                  ) : (
                    establishments.map((est) => (
                      <Card key={est.id} className="p-3 border rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{est.name}</span>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => console.log('Modifier établissement', est.id)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteEstablishment(est.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {curricula.filter(c => c.establishmentId === est.id).length} cursus
                          {creatorProfiles.filter(cp => cp.establishmentIds.includes(est.id)).length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Professeurs associés: {creatorProfiles.filter(cp => cp.establishmentIds.includes(est.id)).map(cp => getUserFullName(cp.userId)).join(', ')}
                            </p>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* --- Cursus Tab (Creator Only) --- */}
        {currentRole === 'creator' && (
          <TabsContent value="curricula" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Gérer les Cursus Scolaires</CardTitle>
                <CardDescription>Créez et gérez des ensembles de cours pour vos classes, liés à un établissement.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-curriculum-name">Nom du nouveau cursus</Label>
                  <Input
                    id="new-curriculum-name"
                    placeholder="Ex: Cursus Scientifique"
                    value={newCurriculumName}
                    onChange={(e) => setNewCurriculumName(e.target.value)}
                  />
                  <Label htmlFor="curriculum-establishment">Établissement</Label>
                  <Select value={newCurriculumEstablishmentId} onValueChange={setNewCurriculumEstablishmentId}>
                    <SelectTrigger id="curriculum-establishment">
                      <SelectValue placeholder="Sélectionner un établissement" />
                    </SelectTrigger>
                    <SelectContent>
                      {establishments.map(est => (
                        <SelectItem key={est.id} value={est.id}>{est.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddCurriculum} disabled={!newCurriculumName.trim() || !newCurriculumEstablishmentId}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Ajouter Cursus
                  </Button>
                </div>
                <div className="space-y-2">
                  {establishments.length === 0 ? (
                    <p className="text-muted-foreground">Veuillez d'abord créer un établissement pour ajouter des cursus.</p>
                  ) : (
                    establishments.map(est => (
                      <Card key={est.id} className="p-4 space-y-3 bg-muted/20">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <School className="h-5 w-5 text-primary" /> Cursus de {est.name}
                        </h3>
                        <div className="space-y-2 pl-4 border-l">
                          {curricula.filter(cur => cur.establishmentId === est.id).length === 0 ? (
                            <p className="text-muted-foreground text-sm">Aucun cursus pour cet établissement.</p>
                          ) : (
                            curricula.filter(cur => cur.establishmentId === est.id).map(cur => (
                              <div key={cur.id} className="flex items-center justify-between p-3 border rounded-md bg-background">
                                <span>{cur.name} ({cur.courseIds.length} cours, {classes.filter(cls => cls.curriculumId === cur.id).length} classes)</span>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleOpenManageCoursesModal(cur)}>
                                    <BookOpen className="h-4 w-4 mr-1" /> Gérer Cours
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => console.log('Modifier cursus', cur.id)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteCurriculum(cur.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* --- Classes Tab --- */}
        <TabsContent value="classes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Gérer les Classes</CardTitle>
              <CardDescription>Ajoutez, modifiez ou supprimez des classes, liées à un cursus.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentRole === 'creator' && (
                <div className="grid gap-2">
                  <Label htmlFor="new-class-name">Nom de la nouvelle classe</Label>
                  <Input
                    id="new-class-name"
                    placeholder="Ex: 1ère Scientifique A"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                  />
                  <Label htmlFor="class-curriculum">Cursus</Label>
                  <Select value={newClassCurriculumId} onValueChange={setNewClassCurriculumId}>
                    <SelectTrigger id="class-curriculum">
                      <SelectValue placeholder="Sélectionner un cursus" />
                    </SelectTrigger>
                    <SelectContent>
                      {curricula.map(cur => (
                        <SelectItem key={cur.id} value={cur.id}>
                          {cur.name} ({getEstablishmentName(cur.establishmentId)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddClass} disabled={!newClassName.trim() || !newClassCurriculumId}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Ajouter Classe
                  </Button>
                </div>
              )}
              <div className="space-y-2">
                {curricula.length === 0 && currentRole === 'creator' ? (
                  <p className="text-muted-foreground">Veuillez d'abord créer un cursus pour ajouter des classes.</p>
                ) : classes.length === 0 ? (
                  <p className="text-muted-foreground">Aucune classe créée.</p>
                ) : (
                  curricula.map(cur => (
                    <Card key={cur.id} className="p-4 space-y-3 bg-muted/20">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <LayoutList className="h-5 w-5 text-primary" /> Classes du cursus "{cur.name}" ({getEstablishmentName(cur.establishmentId)})
                      </h3>
                      <div className="space-y-2 pl-4 border-l">
                        {classes.filter(cls => cls.curriculumId === cur.id).length === 0 ? (
                          <p className="text-muted-foreground text-sm">Aucune classe pour ce cursus.</p>
                        ) : (
                          classes.filter(cls => cls.curriculumId === cur.id).map(cls => (
                            <div key={cls.id} className="flex items-center justify-between p-3 border rounded-md bg-background">
                              <span>{cls.name} ({cls.studentIds.length} élèves)</span>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleViewStudentsInClass(cls.id)}>
                                  <GraduationCap className="h-4 w-4 mr-1" /> Élèves
                                </Button>
                                {currentRole === 'creator' && (
                                  <>
                                    <Button variant="outline" size="sm" onClick={() => console.log('Modifier classe', cls.id)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteClass(cls.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                              {cls.creatorIds.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Professeurs: {cls.creatorIds.map(creatorId => getUserFullName(creatorId)).join(', ')}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {selectedClassIdForStudents && selectedClass && (
            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={handleBackToClasses} />
                  Élèves de la classe "{selectedClass.name}"
                </CardTitle>
                <CardDescription>{studentsInSelectedClass.length} élève(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {studentsInSelectedClass.length === 0 ? (
                  <p className="text-muted-foreground">Aucun élève dans cette classe.</p>
                ) : (
                  studentsInSelectedClass.map(student => (
                    <Card key={student.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex-grow">
                        <p className="font-medium">{getUserFullName(student.userId)} <span className="text-sm text-muted-foreground">(@{getUserUsername(student.userId)})</span></p>
                        <p className="text-sm text-muted-foreground">{getUserEmail(student.userId)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                        <Button variant="outline" size="sm" onClick={() => handleSendMessageToStudent(student)}>
                          <Mail className="h-4 w-4 mr-1" /> Message
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleRemoveStudentFromClass(student.id, selectedClass.id)}>
                          <Trash2 className="h-4 w-4" /> Retirer
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {currentRole === 'creator' && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
                Analytiques des Cours et Classes
              </h2>
              <CreatorAnalyticsSection />
            </div>
          )}
        </TabsContent>

        {/* --- Élèves Tab --- */}
        <TabsContent value="students" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Gérer les Élèves</CardTitle>
              <CardDescription>Recherchez des élèves par nom d'utilisateur et affectez-les à des classes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">Affecter un élève à une classe</h3>
              <div className="relative">
                <Popover open={openCommand} onOpenChange={setOpenCommand}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCommand}
                      className="w-full justify-between"
                    >
                      {foundUserForAssignment ? `${foundUserForAssignment.firstName} ${foundUserForAssignment.lastName} (@${foundUserForAssignment.username})` : "Rechercher un élève..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Rechercher par nom d'utilisateur..."
                        value={usernameToAssign}
                        onValueChange={(value) => {
                          setUsernameToAssign(value);
                          setFoundUserForAssignment(null);
                        }}
                      />
                      <CommandList>
                        {isSearchingUser && usernameToAssign.trim() !== '' && (
                          <CommandEmpty className="py-2 text-center text-muted-foreground flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Recherche...
                          </CommandEmpty>
                        )}
                        {!isSearchingUser && filteredUsersForDropdown.length === 0 && usernameToAssign.trim() !== '' && (
                          <CommandEmpty className="py-2 text-center text-muted-foreground">
                            Aucun élève trouvé pour "{usernameToAssign}".
                          </CommandEmpty>
                        )}
                        <CommandGroup>
                          {filteredUsersForDropdown.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={user.username}
                              onSelect={() => {
                                setFoundUserForAssignment(user);
                                setUsernameToAssign(user.username);
                                setOpenCommand(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  foundUserForAssignment?.id === user.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {user.firstName} {user.lastName} (@{user.username})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {foundUserForAssignment && (
                <div className="p-3 border rounded-md bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-green-500" />
                    <p className="font-medium">Élève sélectionné : {foundUserForAssignment.firstName} {foundUserForAssignment.lastName} (@{foundUserForAssignment.username})</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Email : {foundUserForAssignment.email}</p>
                  {studentProfiles.find(s => s.userId === foundUserForAssignment.id)?.classId && (
                    <p className="text-sm text-muted-foreground">Actuellement dans : {getClassName(studentProfiles.find(s => s.userId === foundUserForAssignment.id)?.classId)} (Cursus: {getCurriculumName(classes.find(c => c.id === studentProfiles.find(s => s.userId === foundUserForAssignment.id)?.classId)?.curriculumId)})</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Select value={classToAssign} onValueChange={setClassToAssign}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Sélectionner une classe" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} ({getCurriculumName(cls.curriculumId)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAssignStudentToClass} disabled={!classToAssign}>
                      <PlusCircle className="h-4 w-4 mr-2" /> Affecter
                    </Button>
                  </div>
                </div>
              )}

              <h3 className="text-lg font-semibold mt-6">Liste de tous les élèves</h3>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email ou @username..."
                  className="pl-10"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                {filteredStudentProfiles.length === 0 ? (
                  <p className="text-muted-foreground">Aucun élève trouvé pour votre recherche.</p>
                ) : (
                  filteredStudentProfiles.map((student) => (
                    <Card key={student.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex-grow">
                        <p className="font-medium">{getUserFullName(student.userId)} <span className="text-sm text-muted-foreground">(@{getUserUsername(student.userId)})</span></p>
                        <p className="text-sm text-muted-foreground">{getUserEmail(student.userId)}</p>
                        {student.classId && (
                          <p className="text-xs text-muted-foreground">
                            Classe: {getClassName(student.classId)} (Cursus: {getCurriculumName(classes.find(c => c.id === student.classId)?.curriculumId)})
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                        {student.classId ? (
                          <Button variant="outline" size="sm" onClick={() => handleRemoveStudentFromClass(student.id, student.classId!)}>
                            <Users className="h-4 w-4 mr-1" /> Retirer de la classe
                          </Button>
                        ) : (
                          <select
                            className="flex h-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value=""
                            onChange={(e) => {
                              const classId = e.target.value;
                              if (classId) {
                                const studentToAssign = studentProfiles.find(s => s.id === student.id);
                                if (studentToAssign) {
                                  const updatedStudent = { ...studentToAssign, classId: classId };
                                  setStudentProfiles(updateStudentProfile(updatedStudent));

                                  const targetClass = classes.find(cls => cls.id === classId);
                                  if (targetClass) {
                                    const updatedTargetClass = { ...targetClass, studentIds: [...targetClass.studentIds, student.id] };
                                    setClasses(prev => prev.map(cls => cls.id === targetClass.id ? updatedTargetClass : cls));
                                    saveClasses(classes.map(cls => cls.id === targetClass.id ? updatedTargetClass : cls));
                                  }
                                  showSuccess(`Élève ${getUserFullName(student.userId)} affecté à la classe ${getClassName(classId)} !`);
                                }
                              }
                            }}
                          >
                            <option value="">Affecter à une classe</option>
                            {classes.map(cls => (
                              <option key={cls.id} value={cls.id}>{cls.name} ({getCurriculumName(cls.curriculumId)})</option>
                            ))}
                          </select>
                        )}

                        <Button variant="outline" size="sm" onClick={() => handleSendMessageToStudent(student)}>
                          <Mail className="h-4 w-4 mr-1" /> Message
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteStudent(student.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Manage Curriculum Courses Modal */}
          {isManageCoursesModalOpen && selectedCurriculumForCourses && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-2xl">
                <CardHeader>
                  <CardTitle>Gérer les cours pour "{selectedCurriculumForCourses.name}"</CardTitle>
                  <CardDescription>Sélectionnez les cours qui feront partie de ce cursus.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 max-h-80 overflow-y-auto">
                    {allCourses.length === 0 ? (
                      <p className="text-muted-foreground">Aucun cours disponible. Créez-en un d'abord !</p>
                    ) : (
                      allCourses.map(course => (
                        <div key={course.id} className="flex items-center justify-between p-2 border rounded-md">
                          <span>{course.title}</span>
                          <input
                            type="checkbox"
                            checked={selectedCourseIds.includes(course.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCourseIds(prev => [...prev, course.id]);
                              } else {
                                setSelectedCourseIds(prev => prev.filter(id => id !== course.id));
                              }
                            }}
                            className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                          />
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsManageCoursesModalOpen(false)}>Annuler</Button>
                    <Button onClick={handleSaveCurriculumCourses}>Sauvegarder</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClassManagement;