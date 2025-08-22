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
import { PlusCircle, Edit, Trash2, Users, GraduationCap, Mail, Search, UserCheck, UserX, Loader2 } from "lucide-react";
import { Class, Profile, Curriculum, Establishment, StudentClassEnrollment } from "@/lib/dataModels"; // Import Profile and Curriculum, Establishment
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
  loadEstablishments,
} from '@/lib/courseData';

// Shadcn UI components for autocomplete
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from '@/contexts/RoleContext';
import { useNavigate } from 'react-router-dom';
import EditClassDialog from '@/components/EditClassDialog'; // Import the new dialog

const ClassManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const { openChat } = useCourseChat();
  const navigate = useNavigate();
  
  // Main states for data
  const [classes, setClasses] = useState<Class[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [allStudentClassEnrollments, setAllStudentClassEnrollments] = useState<StudentClassEnrollment[]>([]); // New state

  // States for add/edit forms
  const [newClassName, setNewClassName] = useState('');
  const [newClassCurriculumId, setNewClassCurriculumId] = useState<string>("");
  const [newClassEstablishmentId, setNewClassEstablishmentId] = useState<string>(""); // New state
  const [newClassSchoolYear, setNewClassSchoolYear] = useState<string>(""); // New state

  // State for edit class dialog
  const [isEditClassDialogOpen, setIsEditClassDialogOpen] = useState(false);
  const [currentClassToEdit, setCurrentClassToEdit] = useState<Class | null>(null);

  const [classSearchQuery, setClassSearchQuery] = useState('');

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      setClasses(await loadClasses());
      setCurricula(await loadCurricula());
      setEstablishments(await loadEstablishments());
      setAllProfiles(await getAllProfiles());
      setAllStudentClassEnrollments(await getAllStudentClassEnrollments()); // Initialize here
    };
    fetchData();
  }, [currentUserProfile]);

  // Helper functions to get names from IDs
  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';
  const getCurriculumName = (id?: string) => curricula.find(c => c.id === id)?.name || 'N/A';
  
  // --- Class Management ---
  const handleAddClass = async () => {
    if (!currentUserProfile) {
      showError("Vous devez être connecté pour ajouter une classe.");
      return;
    }
    if (currentRole !== 'administrator' && currentRole !== 'creator') {
      showError("Vous n'êtes pas autorisé à ajouter une classe.");
      return;
    }
    if (!newClassName.trim() || !newClassCurriculumId || !newClassEstablishmentId || !newClassSchoolYear.trim()) {
      showError("Le nom de la classe, le cursus, l'établissement et l'année scolaire sont requis.");
      return;
    }
    const selectedCurriculum = curricula.find(c => c.id === newClassCurriculumId);
    if (!selectedCurriculum) {
      showError("Cursus sélectionné introuvable.");
      return;
    }
    if (selectedCurriculum.establishment_id !== newClassEstablishmentId) {
      showError("Le cursus sélectionné n'appartient pas à l'établissement choisi.");
      return;
    }

    const newCls: Class = {
      id: '', // Supabase will generate
      name: newClassName.trim(),
      curriculum_id: newClassCurriculumId,
      creator_ids: [currentUserProfile.id], // Assign current creator
      establishment_id: newClassEstablishmentId, // Include new field
      school_year: newClassSchoolYear.trim(), // Include new field
    };
    try {
      const addedClass = await addClassToStorage(newCls);
      if (addedClass) {
        setClasses(await loadClasses()); // Re-fetch to get the new list
        setNewClassName('');
        setNewClassCurriculumId("");
        setNewClassEstablishmentId("");
        setNewClassSchoolYear("");
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
    if (!currentUserProfile) {
      showError("Vous devez être connecté pour supprimer une classe.");
      return;
    }
    if (currentRole !== 'administrator' && currentRole !== 'creator') {
      showError("Vous n'êtes pas autorisé à supprimer une classe.");
      return;
    }
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
    if (!currentUserProfile) {
      showError("Vous devez être connecté pour modifier une classe.");
      return;
    }
    if (currentRole !== 'administrator' && currentRole !== 'creator') {
      showError("Vous n'êtes pas autorisé à modifier une classe.");
      return;
    }
    setCurrentClassToEdit(cls);
    setIsEditClassDialogOpen(true);
  };

  const handleSaveEditedClass = async (updatedClass: Class) => {
    setClasses(await loadClasses()); // Re-fetch to get the updated list
  };

  const handleViewStudentsInClass = (classId: string) => {
    navigate(`/students?classId=${classId}`);
  };

  const filteredClasses = classSearchQuery.trim() === ''
    ? classes.filter(cls => currentRole === 'administrator' || (currentUserProfile && cls.creator_ids.includes(currentUserProfile.id)))
    : classes.filter(cls => (currentRole === 'administrator' || (currentUserProfile && cls.creator_ids.includes(currentUserProfile.id))) && cls.name.toLowerCase().includes(classSearchQuery.toLowerCase()));

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

  if (currentRole !== 'creator' && currentRole !== 'tutor' && currentRole !== 'administrator') { // Only creators, tutors and administrators can access
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès Restreint
        </h1>
        <p className="text-lg text-muted-foreground">
          Seuls les créateurs (professeurs), les tuteurs et les administrateurs peuvent accéder à cette page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion des Classes
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Créez et gérez des classes, et visualisez les élèves qui y sont affectés.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Classes
          </CardTitle>
          <CardDescription>Créez de nouvelles classes et gérez les existantes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(currentRole === 'administrator' || currentRole === 'creator') && (
            <>
              <h3 className="text-lg font-semibold">Ajouter une nouvelle classe</h3>
              <div className="grid gap-2">
                <Label htmlFor="new-class-name">Nom de la classe</Label>
                <Input
                  id="new-class-name"
                  placeholder="Ex: Terminale S1"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                />
                <Label htmlFor="new-class-establishment">Établissement</Label>
                <Select value={newClassEstablishmentId} onValueChange={setNewClassEstablishmentId}>
                  <SelectTrigger id="new-class-establishment">
                    <SelectValue placeholder="Sélectionner un établissement" />
                  </SelectTrigger>
                  <SelectContent>
                    {establishments.map(est => (
                      <SelectItem key={est.id} value={est.id}>{est.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label htmlFor="new-class-curriculum">Cursus</Label>
                <Select value={newClassCurriculumId} onValueChange={setNewClassCurriculumId}>
                  <SelectTrigger id="new-class-curriculum">
                    <SelectValue placeholder="Sélectionner un cursus" />
                  </SelectTrigger>
                  <SelectContent>
                    {curricula.filter(cur => !newClassEstablishmentId || cur.establishment_id === newClassEstablishmentId).map(cur => (
                      <SelectItem key={cur.id} value={cur.id}>
                        {cur.name} ({getEstablishmentName(cur.establishment_id)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label htmlFor="new-class-school-year">Année scolaire</Label>
                <Select value={newClassSchoolYear} onValueChange={setNewClassSchoolYear}>
                  <SelectTrigger id="new-class-school-year">
                    <SelectValue placeholder="Sélectionner l'année scolaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolYears.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddClass} disabled={!newClassName.trim() || !newClassCurriculumId || !newClassEstablishmentId || !newClassSchoolYear.trim()}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Ajouter la classe
                </Button>
              </div>
              <h3 className="text-lg font-semibold mt-6">Liste de toutes les classes</h3>
            </>
          )}
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom de classe..."
              className="pl-10"
              value={classSearchQuery}
              onChange={(e) => setClassSearchQuery(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            {filteredClasses.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucune classe trouvée pour votre recherche.</p>
            ) : (
              filteredClasses.map((cls) => (
                <Card key={cls.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex-grow">
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Établissement: {getEstablishmentName(cls.establishment_id)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Cursus: {getCurriculumName(cls.curriculum_id)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Année scolaire: {cls.school_year}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Élèves: {allProfiles.filter(p => p.role === 'student' && allStudentClassEnrollments.some(e => e.student_id === p.id && e.class_id === cls.id)).length}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                    <Button variant="outline" size="sm" onClick={() => handleViewStudentsInClass(cls.id)}>
                      <Users className="h-4 w-4 mr-1" /> Voir les élèves
                    </Button>
                    {(currentRole === 'administrator' || (currentUserProfile && cls.creator_ids.includes(currentUserProfile.id))) && (
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