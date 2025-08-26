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
import { Class, Profile, Curriculum, StudentClassEnrollment, SchoolYear } from "@/lib/dataModels"; // Removed Establishment import
import { showSuccess, showError } from "@/utils/toast";
import {
  getAllProfiles,
  findProfileByUsername,
  updateProfile,
  deleteProfile,
  getAllStudentClassEnrollments, // Import getAllStudentClassEnrollments
} from '@/lib/studentData';
import { useCourseChat } from '@/contexts/CourseChatContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  loadClasses,
  loadCurricula,
  updateClassInStorage,
  addClassToStorage,
  deleteClassFromStorage,
  // Removed loadEstablishments,
  loadSchoolYears, // Import loadSchoolYears
} from '@/lib/courseData';

// Shadcn UI components for autocomplete
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { useNavigate } from 'react-router-dom';
// Removed EditClassDialog import

const ClassManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const { openChat } = useCourseChat();
  const navigate = useNavigate();
  
  // Main states for data
  const [classes, setClasses] = useState<Class[]>([]);
  // Removed establishments state
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [allStudentClassEnrollments, setAllStudentClassEnrollments] = useState<StudentClassEnrollment[]>([]); // New state
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]); // New state for school years

  // States for add/edit forms
  const [newClassName, setNewClassName] = useState('');
  const [newClassCurriculumId, setNewClassCurriculumId] = useState<string>("");
  // Removed newClassEstablishmentId
  const [newClassSchoolYearId, setNewClassSchoolYearId] = useState<string>(""); // Changed to schoolYearId

  // State for edit class dialog
  const [isEditClassDialogOpen, setIsEditClassDialogOpen] = useState(false);
  const [currentClassToEdit, setCurrentClassToEdit] = useState<Class | null>(null);

  const [classSearchQuery, setClassSearchQuery] = useState('');

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      setClasses(await loadClasses());
      setCurricula(await loadCurricula());
      // Removed loadEstablishments
      setAllProfiles(await getAllProfiles());
      setAllStudentClassEnrollments(await getAllStudentClassEnrollments()); // Initialize here
      setSchoolYears(await loadSchoolYears()); // Load school years
    };
    fetchData();
  }, [currentUserProfile]);

  // Helper functions to get names from IDs
  // Removed getEstablishmentName
  const getCurriculumName = (id?: string) => curricula.find(c => c.id === id)?.name || 'N/A';
  const getSchoolYearName = (id?: string) => schoolYears.find(sy => sy.id === id)?.name || 'N/A';
  
  // --- Class Management ---
  const handleAddClass = async () => {
    if (!currentUserProfile || !['professeur', 'director', 'deputy_director', 'administrator'].includes(currentRole || '')) { // Only professeur, director, deputy_director, administrator can add
      showError("Vous n'êtes pas autorisé à ajouter une classe.");
      return;
    }
    if (!newClassName.trim() || !newClassCurriculumId || !newClassSchoolYearId) { // Changed to newClassSchoolYearId, removed newClassEstablishmentId
      showError("Le nom de la classe, le cursus et l'année scolaire sont requis.");
      return;
    }
    const selectedCurriculum = curricula.find(c => c.id === newClassCurriculumId);
    if (!selectedCurriculum) {
      showError("Cursus sélectionné introuvable.");
      return;
    }
    // Removed curriculum establishment_id check
    // Removed role-based establishment_id check

    const newCls: Omit<Class, 'id' | 'created_at' | 'school_year_name'> = { // Omit generated fields, removed establishment_id
      name: newClassName.trim(),
      curriculum_id: newClassCurriculumId,
      creator_ids: [currentUserProfile.id], // Assign current creator
      school_year_id: newClassSchoolYearId, // Changed to school_year_id
    };
    try {
      const addedClass = await addClassToStorage(newCls);
      if (addedClass) {
        setClasses(await loadClasses()); // Re-fetch to get the new list
        setNewClassName('');
        setNewClassCurriculumId("");
        // Removed setNewClassEstablishmentId
        setNewClassSchoolYearId(""); // Reset school year
        showSuccess("Classe ajoutée !");
      } else {
        showError("Échec de l'ajout de la classe.");
      }
    } catch (error: any) {
      console.error("Error adding class:", error);
      showError(`Erreur lors de l'ajout de la classe: ${error.message}`);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!currentUserProfile || !['professeur', 'director', 'deputy_director', 'administrator'].includes(currentRole || '')) { // Only professeur, director, deputy_director, administrator can delete
      showError("Vous n'êtes pas autorisé à supprimer une classe.");
      return;
    }
    const classToDelete = classes.find(cls => cls.id === id);
    if (!classToDelete) {
      showError("Classe introuvable.");
      return;
    }
    // Professeur can only delete classes they manage
    if (currentRole === 'professeur' && !classToDelete.creator_ids.includes(currentUserProfile.id)) {
      showError("Vous ne pouvez supprimer que les classes que vous gérez.");
      return;
    }
    // Removed director/deputy director establishment_id check

    try {
      await deleteClassFromStorage(id);
      setClasses(await loadClasses()); // Re-fetch to get the updated list
      // Remove class_id from associated student profiles
      // This logic is now handled by student_class_enrollments, not directly on profile
      // We need to delete enrollments for this class
      // For now, we'll rely on CASCADE DELETE in DB for student_class_enrollments
      // and update profiles if they had a direct class_id (which is now removed)
      setAllProfiles(await getAllProfiles()); // Re-fetch all profiles to ensure consistency
      setAllStudentClassEnrollments(await getAllStudentClassEnrollments()); // Refresh enrollments
      showSuccess("Classe supprimée !");
    } catch (error: any) {
      console.error("Error deleting class:", error);
      showError(`Erreur lors de la suppression de la classe: ${error.message}`);
    }
  };

  const handleEditClass = (cls: Class) => {
    if (!currentUserProfile || !['professeur', 'director', 'deputy_director', 'administrator'].includes(currentRole || '')) { // Only professeur, director, deputy_director, administrator can edit/delete
      showError("Vous n'êtes pas autorisé à modifier une classe.");
      return;
    }
    // Professeur can only edit classes they manage
    if (currentRole === 'professeur' && !cls.creator_ids.includes(currentUserProfile.id)) {
      showError("Vous ne pouvez modifier que les classes que vous gérez.");
      return;
    }
    // Removed director/deputy director establishment_id check
    setCurrentClassToEdit(cls);
    setIsEditClassDialogOpen(true);
  };

  const handleSaveEditedClass = async (updatedClass: Class) => {
    setClasses(await loadClasses()); // Re-fetch to get the updated list
  };

  const handleViewStudentsInClass = (classId: string) => {
    navigate(`/pedagogical-management?classId=${classId}`); // Changed to pedagogical-management
  };

  const filteredClasses = classSearchQuery.trim() === ''
    ? classes.filter(cls => (currentUserProfile && (
        (currentRole === 'professeur' && cls.creator_ids.includes(currentUserProfile.id)) ||
        (currentRole === 'tutor') || // Tutors see all classes
        ((currentRole === 'director' || currentRole === 'deputy_director')) ||
        (currentRole === 'administrator')
      )))
    : classes.filter(cls => (currentUserProfile && (
        (currentRole === 'professeur' && cls.creator_ids.includes(currentUserProfile.id)) ||
        (currentRole === 'tutor') ||
        ((currentRole === 'director' || currentRole === 'deputy_director')) ||
        (currentRole === 'administrator')
      )) && cls.name.toLowerCase().includes(classSearchQuery.toLowerCase()));

  // Removed the problematic line: const schoolYears = Array.from({ length: 5 }, (_, i) => `${currentYear - 2 + i}-${currentYear - 1 + i}`);

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

  // Removed establishmentsToDisplay
  const curriculaToDisplay = curricula; // All curricula are now global

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion des Classes
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Créez et gérez des classes, et visualisez les élèves qui y sont affectés.
      </p>

      {(currentRole === 'professeur' || currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'administrator') && ( // Only professeur, director, deputy_director, administrator can add
        <Card className="rounded-android-tile">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" /> Ajouter une nouvelle classe
            </CardTitle>
            <CardDescription>Créez de nouvelles classes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="new-class-name">Nom de la classe</Label>
              <Input
                id="new-class-name"
                placeholder="Ex: Terminale S1"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
              />
              {/* Removed Establishment Select */}
              <Label htmlFor="new-class-curriculum">Cursus</Label>
              <Select value={newClassCurriculumId} onValueChange={setNewClassCurriculumId}>
                <SelectTrigger id="new-class-curriculum" className="rounded-android-tile">
                  <SelectValue placeholder="Sélectionner un cursus" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-lg bg-background/80 rounded-android-tile">
                  {curriculaToDisplay.map(cur => (
                    <SelectItem key={cur.id} value={cur.id}>
                      {cur.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label htmlFor="new-class-school-year">Année scolaire</Label>
              <Select value={newClassSchoolYearId} onValueChange={setNewClassSchoolYearId}>
                <SelectTrigger id="new-class-school-year" className="rounded-android-tile">
                  <SelectValue placeholder="Sélectionner l'année scolaire" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-lg bg-background/80 rounded-android-tile">
                  {schoolYears.map(year => (
                    <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddClass} disabled={!newClassName.trim() || !newClassCurriculumId || !newClassSchoolYearId}>
                <PlusCircle className="h-4 w-4 mr-2" /> Ajouter la classe
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
          
      <Card className="rounded-android-tile">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Liste de toutes les classes
          </CardTitle>
          <CardDescription>Visualisez et gérez les classes existantes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom de classe..."
              className="pl-10 rounded-android-tile"
              value={classSearchQuery}
              onChange={(e) => setClassSearchQuery(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            {filteredClasses.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucune classe trouvée pour votre recherche.</p>
            ) : (
              filteredClasses.map((cls) => (
                <Card key={cls.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-android-tile"> {/* Apply rounded-android-tile */}
                  <div className="flex-grow">
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Cursus: {getCurriculumName(cls.curriculum_id)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Année scolaire: {getSchoolYearName(cls.school_year_id)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Élèves: {allProfiles.filter(p => p.role === 'student' && allStudentClassEnrollments.some(e => e.student_id === p.id && e.class_id === cls.id)).length}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                    <Button variant="outline" size="sm" onClick={() => handleViewStudentsInClass(cls.id)}>
                      <Users className="h-4 w-4 mr-1" /> Voir les élèves
                    </Button>
                    {((currentUserProfile && cls.creator_ids.includes(currentUserProfile.id)) || currentRole === 'director' || currentRole === 'deputy_director' || currentRole === 'administrator') && ( // Only professeur, director, deputy_director, administrator can edit/delete
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleEditClass(cls)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteClass(cls.id)}>
                          <Trash2 className="h-4 w-4" /> Supprimer
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {currentClassToEdit && (
        <EditClassDialog
          isOpen={isEditClassDialogOpen}
          onClose={() => setIsEditClassDialogOpen(false)}
          classToEdit={currentClassToEdit}
          onSave={handleSaveEditedClass}
        />
      )}
    </div>
  );
};

export default ClassManagementPage;