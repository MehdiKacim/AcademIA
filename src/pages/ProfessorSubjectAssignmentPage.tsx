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
import { PlusCircle, Edit, Trash2, Users, BookText, School, CalendarDays, UserRoundCog, Check, Search, XCircle, Building2, Info, PenTool } from "lucide-react";
import { Profile, Class, Subject, SchoolYear, ProfessorSubjectAssignment, Curriculum, Establishment } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import {
  getAllProfiles,
  getProfilesByRole,
} from '@/lib/studentData';
import {
  loadClasses,
  loadSubjects,
  loadSchoolYears,
  loadProfessorSubjectAssignments,
  addProfessorSubjectAssignmentToStorage,
  updateProfessorSubjectAssignmentInStorage,
  deleteProfessorSubjectAssignmentFromStorage,
  loadEstablishments,
  loadCurricula,
  getEstablishmentName,
  getCurriculumName,
  getClassName,
  getSchoolYearName,
  getSubjectName,
} from '@/lib/courseData';

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import SimpleItemSelector from '@/components/ui/SimpleItemSelector';

const iconMap: { [key: string]: React.ElementType } = {
  Building2, BookText, CalendarDays, Users, Info, PenTool
};

const ProfessorSubjectAssignmentPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();

  const [professors, setProfessors] = useState<Profile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [assignments, setAssignments] = useState<ProfessorSubjectAssignment[]>([]);

  const [newAssignmentProfessorId, setNewAssignmentProfessorId] = useState<string>("");
  const [newAssignmentSubjectId, setNewAssignmentSubjectId] = useState<string>("");
  const [newAssignmentClassId, setNewAssignmentClassId] = useState<string>("");
  const [newAssignmentSchoolYearId, setNewAssignmentSchoolYearId] = useState<string>("");
  const [newAssignmentEstablishmentId, setNewAssignmentEstablishmentId] = useState<string | null>(null);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentAssignmentToEdit, setCurrentAssignmentToEdit] = useState<ProfessorSubjectAssignment | null>(null);
  const [editProfessorId, setEditProfessorId] = useState<string>("");
  const [editSubjectId, setEditSubjectId] = useState<string>("");
  const [editClassId, setEditClassId] = useState<string>("");
  const [editSchoolYearId, setEditSchoolYearId] = useState<string>("");
  const [editEstablishmentId, setEditEstablishmentId] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState('');
  const [selectedProfessorFilter, setSelectedProfessorFilter] = useState<string | null>(null);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string | null>(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null);
  const [selectedSchoolYearFilter, setSelectedSchoolYearFilter] = useState<string | null>(null);
  const [selectedEstablishmentFilter, setSelectedEstablishmentFilter] = useState<string | 'all'>('all');

  const [newAssignmentProfessorSearchQuery, setNewAssignmentProfessorSearchQuery] = useState('');
  const [newAssignmentSubjectSearchQuery, setNewAssignmentSubjectSearchQuery] = useState('');
  const [newAssignmentClassSearchQuery, setNewAssignmentClassSearchQuery] = useState('');
  const [newAssignmentSchoolYearSearchQuery, setNewAssignmentSchoolYearSearchQuery] = useState('');
  const [newAssignmentEstablishmentSearchQuery, setNewAssignmentEstablishmentSearchQuery] = useState('');

  const [editProfessorSearchQuery, setEditProfessorSearchQuery] = useState('');
  const [editSubjectSearchQuery, setEditSubjectSearchQuery] = useState('');
  const [editClassSearchQuery, setEditClassSearchQuery] = useState('');
  const [editSchoolYearSearchQuery, setEditSchoolYearSearchQuery] = useState('');
  const [editEstablishmentSearchQuery, setEditEstablishmentSearchQuery] = useState('');

  const [filterProfessorSearchQuery, setFilterProfessorSearchQuery] = useState('');
  const [filterSubjectSearchQuery, setFilterSubjectSearchQuery] = useState('');
  const [filterClassSearchQuery, setFilterClassSearchQuery] = useState('');
  const [filterSchoolYearSearchQuery, setFilterSchoolYearSearchQuery] = useState('');
  const [filterEstablishmentSearchQuery, setFilterEstablishmentSearchQuery] = useState('');


  useEffect(() => {
    const fetchData = async () => {
      try {
        setProfessors(await getProfilesByRole('professeur'));
        setSubjects(await loadSubjects());
        setClasses(await loadClasses());
        setSchoolYears(await loadSchoolYears());
        setEstablishments(await loadEstablishments());
        setCurricula(await loadCurricula());
        setAssignments(await loadProfessorSubjectAssignments());
      } catch (error: any) {
        console.error("Error fetching data for ProfessorSubjectAssignmentPage:", error);
        showError(`Erreur lors du chargement des données d'affectation des professeurs: ${error.message}`);
      }
    };
    fetchData();
  }, [currentUserProfile]);

  useEffect(() => {
    const activeYear = schoolYears.find(sy => sy.is_active);
    if (activeYear) {
      setNewAssignmentSchoolYearId(activeYear.id);
      setSelectedSchoolYearFilter(activeYear.id);
    } else if (schoolYears.length > 0) {
      setNewAssignmentSchoolYearId(schoolYears[0].id);
      setSelectedSchoolYearFilter(schoolYears[0].id);
    }

    if (currentRole === 'administrator') {
      setNewAssignmentEstablishmentId(null);
      setSelectedEstablishmentFilter('all');
    } else if (currentUserProfile?.establishment_id) {
      setNewAssignmentEstablishmentId(currentUserProfile.establishment_id);
      setSelectedEstablishmentFilter(currentUserProfile.establishment_id);
    } else {
      setNewAssignmentEstablishmentId(null);
      setSelectedEstablishmentFilter('all');
    }
  }, [currentRole, currentUserProfile?.id, currentUserProfile?.establishment_id, schoolYears]);

  const getProfessorName = (id?: string) => professors.find(p => p.id === id)?.first_name + ' ' + professors.find(p => p.id === id)?.last_name || 'N/A';

  const handleAddAssignment = async () => {
    if (!currentUserProfile || !['administrator', 'director', 'deputy_director'].includes(currentRole || '')) {
      showError("Vous n'êtes pas autorisé à ajouter des affectations.");
      return;
    }
    if (!newAssignmentProfessorId || !newAssignmentSubjectId || !newAssignmentClassId || !newAssignmentSchoolYearId || !newAssignmentEstablishmentId) {
      showError("Tous les champs sont requis.");
      return;
    }

    const selectedClass = classes.find(cls => cls.id === newAssignmentClassId);
    const selectedSubject = subjects.find(sub => sub.id === newAssignmentSubjectId);
    const selectedProfessor = professors.find(prof => prof.id === newAssignmentProfessorId);

    if (!selectedClass || !selectedSubject || !selectedProfessor) {
      showError("Sélection invalide pour le professeur, la matière ou la classe.");
      return;
    }

    if ((currentRole === 'director' || currentRole === 'deputy_director') && newAssignmentEstablishmentId !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez créer des affectations que dans votre établissement.");
      return;
    }
    if (selectedClass.establishment_id !== newAssignmentEstablishmentId || selectedSubject.establishment_id !== newAssignmentEstablishmentId) {
      showError("La classe ou la matière sélectionnée n'appartient pas à l'établissement choisi.");
      return;
    }
    if (selectedProfessor.establishment_id !== newAssignmentEstablishmentId) {
      showError("Le professeur sélectionné n'appartient pas à l'établissement choisi.");
      return;
    }

    const existingAssignment = assignments.find(
      a => a.professor_id === newAssignmentProfessorId &&
           a.subject_id === newAssignmentSubjectId &&
           a.class_id === newAssignmentClassId &&
           a.school_year_id === newAssignmentSchoolYearId &&
           a.establishment_id === newAssignmentEstablishmentId
    );
    if (existingAssignment) {
      showError("Cette affectation existe déjà pour cette année scolaire et cet établissement.");
      return;
    }

    setIsAddingAssignment(true);
    try {
      const newAssignment: Omit<ProfessorSubjectAssignment, 'id' | 'created_at' | 'subject_name' | 'class_name' | 'school_year_name'> = {
        professor_id: newAssignmentProfessorId,
        subject_id: newAssignmentSubjectId,
        class_id: newAssignmentClassId,
        school_year_id: newAssignmentSchoolYearId,
        establishment_id: newAssignmentEstablishmentId,
      };
      const addedAssignment = await addProfessorSubjectAssignmentToStorage(newAssignment);
      if (addedAssignment) {
        setAssignments(await loadProfessorSubjectAssignments());
        setNewAssignmentProfessorId("");
        setNewAssignmentSubjectId("");
        setNewAssignmentClassId("");
        const activeYear = schoolYears.find(sy => sy.is_active);
        setNewAssignmentSchoolYearId(activeYear ? activeYear.id : (schoolYears.length > 0 ? schoolYears[0].id : ""));
        setNewAssignmentEstablishmentId(currentUserProfile?.establishment_id || null);
        showSuccess("Affectation ajoutée !");
      } else {
        showError("Échec de l'ajout de l'affectation.");
      }
    } catch (error: any) {
      console.error("Error adding assignment:", error);
      showError(`Erreur lors de l'ajout de l'affectation: ${error.message}`);
    } finally {
      setIsAddingAssignment(false);
    }
  };

  const handleEditAssignment = (assignment: ProfessorSubjectAssignment) => {
    if (!currentUserProfile || !['administrator', 'director', 'deputy_director'].includes(currentRole || '')) {
      showError("Vous n'êtes pas autorisé à modifier cette affectation.");
      return;
    }
    const classOfAssignment = classes.find(cls => cls.id === assignment.class_id);
    if ((currentRole === 'director' || currentRole === 'deputy_director') && assignment.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez modifier que les affectations de votre établissement.");
      return;
    }

    setCurrentAssignmentToEdit(assignment);
    setEditProfessorId(assignment.professor_id);
    setEditSubjectId(assignment.subject_id);
    setEditClassId(assignment.class_id);
    setEditSchoolYearId(assignment.school_year_id);
    setEditEstablishmentId(assignment.establishment_id || null);
    setIsEditDialogOpen(true);
  };

  const handleSaveEditedAssignment = async () => {
    if (!currentUserProfile || !['administrator', 'director', 'deputy_director'].includes(currentRole || '')) {
      showError("Vous n'êtes pas autorisé à modifier cette affectation.");
      return;
    }
    if (!currentAssignmentToEdit) return;
    if (!editProfessorId || !editSubjectId || !editClassId || !editSchoolYearId || !editEstablishmentId) {
      showError("Tous les champs sont requis.");
      return;
    }

    const selectedClass = classes.find(cls => cls.id === editClassId);
    const selectedSubject = subjects.find(sub => sub.id === editSubjectId);
    const selectedProfessor = professors.find(prof => prof.id === editProfessorId);

    if (!selectedClass || !selectedSubject || !selectedProfessor) {
      showError("Sélection invalide pour le professeur, la matière ou la classe.");
      return;
    }

    if ((currentRole === 'director' || currentRole === 'deputy_director') && editEstablishmentId !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez sauvegarder les affectations que dans votre établissement.");
      return;
    }
    if (selectedClass.establishment_id !== editEstablishmentId || selectedSubject.establishment_id !== editEstablishmentId) {
      showError("La classe ou la matière sélectionnée n'appartient pas à l'établissement choisi.");
      return;
    }
    if (selectedProfessor.establishment_id !== editEstablishmentId) {
      showError("Le professeur sélectionné n'appartient pas à l'établissement choisi.");
      return;
    }

    const existingAssignment = assignments.find(
      a => a.id !== currentAssignmentToEdit.id &&
           a.professor_id === editProfessorId &&
           a.subject_id === editSubjectId &&
           a.class_id === editClassId &&
           a.school_year_id === editSchoolYearId &&
           a.establishment_id === editEstablishmentId
    );
    if (existingAssignment) {
      showError("Cette affectation existe déjà pour cette année scolaire et cet établissement.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const updatedAssignment: ProfessorSubjectAssignment = {
        ...currentAssignmentToEdit,
        professor_id: editProfessorId,
        subject_id: editSubjectId,
        class_id: editClassId,
        school_year_id: editSchoolYearId,
        establishment_id: editEstablishmentId,
      };
      const savedAssignment = await updateProfessorSubjectAssignmentInStorage(updatedAssignment);
      if (savedAssignment) {
        setAssignments(await loadProfessorSubjectAssignments());
        showSuccess("Affectation mise à jour !");
        setIsEditDialogOpen(false);
        setCurrentAssignmentToEdit(null);
      } else {
        showError("Échec de la mise à jour de l'affectation.");
      }
    } catch (error: any) {
      console.error("Error saving edited assignment:", error);
      showError(`Erreur lors de la sauvegarde de l'affectation: ${error.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!currentUserProfile || !['administrator', 'director', 'deputy_director'].includes(currentRole || '')) {
      showError("Vous n'êtes pas autorisé à supprimer cette affectation.");
      return;
    }
    const assignmentToDelete = assignments.find(a => a.id === id);
    if (!assignmentToDelete) {
      showError("Affectation introuvable.");
      return;
    }
    const classOfAssignment = classes.find(cls => cls.id === assignmentToDelete.class_id);
    if ((currentRole === 'director' || currentRole === 'deputy_director') && assignmentToDelete.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez supprimer que les affectations de votre établissement.");
      return;
    }

    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette affectation ? Cette action est irréversible.")) {
      try {
        await deleteProfessorSubjectAssignmentFromStorage(id);
        setAssignments(await loadProfessorSubjectAssignments());
        showSuccess("Affectation supprimée !");
      } catch (error: any) {
        console.error("Error deleting assignment:", error);
        showError(`Erreur lors de la suppression de l'affectation: ${error.message}`);
      }
    }
  };

  const filteredProfessors = professors.filter(p => 
    currentRole === 'administrator' || p.establishment_id === currentUserProfile?.establishment_id
  );
  const filteredSubjects = subjects.filter(s => 
    currentRole === 'administrator' || s.establishment_id === currentUserProfile?.establishment_id
  );
  const filteredClasses = classes.filter(cls => 
    currentRole === 'administrator' || cls.establishment_id === currentUserProfile?.establishment_id
  );
  const filteredEstablishments = establishments.filter(est => 
    currentRole === 'administrator' || est.id === currentUserProfile?.establishment_id
  );

  const filteredAssignments = React.useMemo(() => {
    let filtered = assignments;

    if (selectedEstablishmentFilter !== 'all' && currentRole === 'administrator') {
      filtered = filtered.filter(assignment => assignment.establishment_id === selectedEstablishmentFilter);
    } else if (currentRole !== 'administrator' && currentUserProfile?.establishment_id) {
      filtered = filtered.filter(assignment => assignment.establishment_id === currentUserProfile.establishment_id);
    }

    if (selectedProfessorFilter) {
      filtered = filtered.filter(a => a.professor_id === selectedProfessorFilter);
    }
    if (selectedSubjectFilter) {
      filtered = filtered.filter(a => a.subject_id === selectedSubjectFilter);
    }
    if (selectedClassFilter) {
      filtered = filtered.filter(a => a.class_id === selectedClassFilter);
    }
    if (selectedSchoolYearFilter) {
      filtered = filtered.filter(a => a.school_year_id === selectedSchoolYearFilter);
    }

    if (assignmentSearchQuery.trim()) {
      const lowerCaseQuery = assignmentSearchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        getProfessorName(a.professor_id).toLowerCase().includes(lowerCaseQuery) ||
        getSubjectName(a.subject_id, subjects).toLowerCase().includes(lowerCaseQuery) ||
        getClassName(a.class_id, classes).toLowerCase().includes(lowerCaseQuery) ||
        getSchoolYearName(a.school_year_id, schoolYears).toLowerCase().includes(lowerCaseQuery) ||
        getEstablishmentName(a.establishment_id, establishments).toLowerCase().includes(lowerCaseQuery)
      );
    }
    return filtered;
  }, [assignments, assignmentSearchQuery, selectedProfessorFilter, selectedSubjectFilter, selectedClassFilter, selectedSchoolYearFilter, selectedEstablishmentFilter, professors, subjects, classes, schoolYears, establishments, currentUserProfile, currentRole]);

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

  if (!currentUserProfile || !['administrator', 'director', 'deputy_director'].includes(currentRole || '')) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès Restreint
        </h1>
        <p className="text-lg text-muted-foreground">
          Seuls les administrateurs, directeurs et directeurs adjoints peuvent accéder à cette page.
        </p>
      </div>
    );
  }

  const professorOptions = filteredProfessors.map(prof => ({
    id: prof.id,
    label: `${prof.first_name} ${prof.last_name} (@${prof.username})`,
    icon_name: 'PenTool',
    description: getEstablishmentName(prof.establishment_id, establishments),
  }));

  const subjectOptions = filteredSubjects.map(sub => ({
    id: sub.id,
    label: sub.name,
    icon_name: 'BookText',
    description: getEstablishmentName(sub.establishment_id, establishments),
  }));

  const classOptions = filteredClasses.map(cls => ({
    id: cls.id,
    label: cls.name,
    icon_name: 'Users',
    description: `${getCurriculumName(cls.curriculum_id, curricula)} - ${getSchoolYearName(cls.school_year_id, schoolYears)} (${getEstablishmentName(cls.establishment_id, establishments)})`,
  }));

  const schoolYearOptions = schoolYears.map(year => ({
    id: year.id,
    label: year.name,
    icon_name: 'CalendarDays',
    description: `${year.start_date} - ${year.end_date}`,
  }));

  const establishmentOptions = filteredEstablishments.map(est => ({
    id: est.id,
    label: est.name,
    icon_name: 'Building2',
    description: est.address,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion des Affectations Professeurs-Matières
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Affectez des professeurs à des matières pour des classes et années scolaires spécifiques.
      </p>

      {/* Section: Ajouter une nouvelle affectation */}
      <Card className="rounded-android-tile">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-6 w-6 text-primary" /> Ajouter une nouvelle affectation
          </CardTitle>
          <CardDescription>Créez une nouvelle affectation professeur-matière-classe-année scolaire.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new-professor">Professeur</Label>
              <SimpleItemSelector
                id="new-professor"
                options={professorOptions}
                value={newAssignmentProfessorId}
                onValueChange={setNewAssignmentProfessorId}
                searchQuery={newAssignmentProfessorSearchQuery}
                onSearchQueryChange={setNewAssignmentProfessorSearchQuery}
                placeholder="Sélectionner un professeur"
                emptyMessage="Aucun professeur trouvé."
                iconMap={iconMap}
              />
            </div>
            <div>
              <Label htmlFor="new-subject">Matière</Label>
              <SimpleItemSelector
                id="new-subject"
                options={subjectOptions}
                value={newAssignmentSubjectId}
                onValueChange={setNewAssignmentSubjectId}
                searchQuery={newAssignmentSubjectSearchQuery}
                onSearchQueryChange={setNewAssignmentSubjectSearchQuery}
                placeholder="Sélectionner une matière"
                emptyMessage="Aucune matière trouvée."
                iconMap={iconMap}
              />
            </div>
            <div>
              <Label htmlFor="new-class">Classe</Label>
              <SimpleItemSelector
                id="new-class"
                options={classOptions}
                value={newAssignmentClassId}
                onValueChange={setNewAssignmentClassId}
                searchQuery={newAssignmentClassSearchQuery}
                onSearchQueryChange={setNewAssignmentClassSearchQuery}
                placeholder="Sélectionner une classe"
                emptyMessage="Aucune classe trouvée."
                iconMap={iconMap}
              />
            </div>
            <div>
              <Label htmlFor="new-school-year">Année scolaire</Label>
              <SimpleItemSelector
                id="new-school-year"
                options={schoolYearOptions}
                value={newAssignmentSchoolYearId}
                onValueChange={setNewAssignmentSchoolYearId}
                searchQuery={newAssignmentSchoolYearSearchQuery}
                onSearchQueryChange={setNewAssignmentSchoolYearSearchQuery}
                placeholder="Sélectionner l'année scolaire"
                emptyMessage="Aucune année scolaire trouvée."
                iconMap={iconMap}
              />
            </div>
            {(currentRole === 'administrator' || currentUserProfile?.establishment_id) && (
              <div>
                <Label htmlFor="new-assignment-establishment">Établissement</Label>
                <SimpleItemSelector
                  id="new-assignment-establishment"
                  options={establishmentOptions}
                  value={newAssignmentEstablishmentId}
                  onValueChange={(value) => setNewAssignmentEstablishmentId(value)}
                  searchQuery={newAssignmentEstablishmentSearchQuery}
                  onSearchQueryChange={setNewAssignmentEstablishmentSearchQuery}
                  placeholder="Sélectionner un établissement"
                  emptyMessage="Aucun établissement trouvé."
                  iconMap={iconMap}
                  disabled={currentRole !== 'administrator' && !!currentUserProfile?.establishment_id}
                />
              </div>
            )}
          </div>
          <Button onClick={handleAddAssignment} disabled={isAddingAssignment || !newAssignmentProfessorId || !newAssignmentSubjectId || !newAssignmentClassId || !newAssignmentSchoolYearId || !newAssignmentEstablishmentId}>
            {isAddingAssignment ? <LoadingSpinner iconClassName="h-4 w-4 mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />} Ajouter l'affectation
          </Button>
        </CardContent>
      </Card>

      {/* Section: Liste des affectations */}
      <Card className="rounded-android-tile">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRoundCog className="h-6 w-6 text-primary" /> Liste des Affectations
          </CardTitle>
          <CardDescription>Visualisez et gérez les affectations existantes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par professeur, matière, classe ou année..."
                className="pl-10 rounded-android-tile"
                value={assignmentSearchQuery}
                onChange={(e) => setAssignmentSearchQuery(e.target.value)}
              />
            </div>
            {(currentRole === 'administrator' || currentUserProfile?.establishment_id) && (
              <div className="flex-shrink-0 sm:w-1/3">
                <Label htmlFor="establishment-filter">Filtrer par Établissement</Label>
                <SimpleItemSelector
                  id="establishment-filter"
                  options={[{ id: 'all', label: 'Tous les établissements', icon_name: 'Building2' }, ...establishmentOptions]}
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
              <Label htmlFor="professor-filter">Filtrer par Professeur</Label>
              <SimpleItemSelector
                id="professor-filter"
                options={[{ id: 'all', label: 'Tous les professeurs', icon_name: 'PenTool' }, ...professorOptions]}
                value={selectedProfessorFilter}
                onValueChange={(value) => setSelectedProfessorFilter(value)}
                searchQuery={filterProfessorSearchQuery}
                onSearchQueryChange={setFilterProfessorSearchQuery}
                placeholder="Tous les professeurs"
                emptyMessage="Aucun professeur trouvé."
                iconMap={iconMap}
              />
            </div>
            <div className="flex-shrink-0 sm:w-1/3">
              <Label htmlFor="subject-filter">Filtrer par Matière</Label>
              <SimpleItemSelector
                id="subject-filter"
                options={[{ id: 'all', label: 'Toutes les matières', icon_name: 'BookText' }, ...subjectOptions]}
                value={selectedSubjectFilter}
                onValueChange={(value) => setSelectedSubjectFilter(value)}
                searchQuery={filterSubjectSearchQuery}
                onSearchQueryChange={setFilterSubjectSearchQuery}
                placeholder="Toutes les matières"
                emptyMessage="Aucune matière trouvée."
                iconMap={iconMap}
              />
            </div>
            <div className="flex-shrink-0 sm:w-1/3">
              <Label htmlFor="class-filter">Filtrer par Classe</Label>
              <SimpleItemSelector
                id="class-filter"
                options={[{ id: 'all', label: 'Toutes les classes', icon_name: 'Users' }, ...classOptions]}
                value={selectedClassFilter}
                onValueChange={(value) => setSelectedClassFilter(value)}
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
                options={[{ id: 'all', label: 'Toutes les années', icon_name: 'CalendarDays' }, ...schoolYearOptions]}
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
            {filteredAssignments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucune affectation trouvée pour votre recherche ou vos filtres.</p>
            ) : (
              filteredAssignments.map((assignment) => (
                <Card key={assignment.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-android-tile">
                  <div className="flex-grow">
                    <p className="font-medium">
                      <span className="text-primary">{getProfessorName(assignment.professor_id)}</span> enseigne <span className="text-primary">{getSubjectName(assignment.subject_id, subjects)}</span> à la classe <span className="text-primary">{getClassName(assignment.class_id, classes)}</span> pour l'année <span className="text-primary">{getSchoolYearName(assignment.school_year_id, schoolYears)}</span>.
                    </p>
                    {assignment.establishment_id && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {getEstablishmentName(assignment.establishment_id, establishments)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                    <Button variant="outline" size="sm" onClick={() => handleEditAssignment(assignment)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteAssignment(assignment.id)}>
                      <Trash2 className="h-4 w-4" /> Supprimer
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Assignment Dialog */}
      {currentAssignmentToEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] backdrop-blur-lg bg-background/80 rounded-android-tile z-[1000]">
            <div className="flex flex-col">
              <DialogHeader>
                <DialogTitle>Modifier l'affectation</DialogTitle>
                <DialogDescription>
                  Mettez à jour les détails de l'affectation.
                </DialogDescription>
              </DialogHeader>
            <div className="grid gap-4 py-4 flex-grow">
              <div>
                <Label htmlFor="edit-professor">Professeur</Label>
                <SimpleItemSelector
                  id="edit-professor"
                  options={professorOptions}
                  value={editProfessorId}
                  onValueChange={setEditProfessorId}
                  searchQuery={editProfessorSearchQuery}
                  onSearchQueryChange={setEditProfessorSearchQuery}
                  placeholder="Sélectionner un professeur"
                  emptyMessage="Aucun professeur trouvé."
                  iconMap={iconMap}
                />
              </div>
              <div>
                <Label htmlFor="edit-subject">Matière</Label>
                <SimpleItemSelector
                  id="edit-subject"
                  options={subjectOptions}
                  value={editSubjectId}
                  onValueChange={setEditSubjectId}
                  searchQuery={editSubjectSearchQuery}
                  onSearchQueryChange={setEditSubjectSearchQuery}
                  placeholder="Sélectionner une matière"
                  emptyMessage="Aucune matière trouvée."
                  iconMap={iconMap}
                />
              </div>
              <div>
                <Label htmlFor="edit-class">Classe</Label>
                <SimpleItemSelector
                  id="edit-class"
                  options={classOptions}
                  value={editClassId}
                  onValueChange={setEditClassId}
                  searchQuery={editClassSearchQuery}
                  onSearchQueryChange={setEditClassSearchQuery}
                  placeholder="Sélectionner une classe"
                  emptyMessage="Aucune classe trouvée."
                  iconMap={iconMap}
                />
              </div>
              <div>
                <Label htmlFor="edit-school-year">Année scolaire</Label>
                <SimpleItemSelector
                  id="edit-school-year"
                  options={schoolYearOptions}
                  value={editSchoolYearId}
                  onValueChange={setEditSchoolYearId}
                  searchQuery={editSchoolYearSearchQuery}
                  onSearchQueryChange={setEditSchoolYearSearchQuery}
                  placeholder="Sélectionner l'année scolaire"
                  emptyMessage="Aucune année scolaire trouvée."
                  iconMap={iconMap}
                />
              </div>
              {(currentRole === 'administrator' || currentUserProfile?.establishment_id) && (
                <div>
                  <Label htmlFor="edit-assignment-establishment">Établissement</Label>
                  <SimpleItemSelector
                    id="edit-assignment-establishment"
                    options={establishmentOptions}
                    value={editEstablishmentId}
                    onValueChange={(value) => setEditEstablishmentId(value)}
                    searchQuery={editEstablishmentSearchQuery}
                    onSearchQueryChange={setEditEstablishmentSearchQuery}
                    placeholder="Sélectionner un établissement"
                    emptyMessage="Aucun établissement trouvé."
                    iconMap={iconMap}
                    disabled={currentRole !== 'administrator' && !!currentUserProfile?.establishment_id}
                  />
                </div>
              )}
            </div>
            <Button onClick={handleSaveEditedAssignment} disabled={isSavingEdit || !editProfessorId || !editSubjectId || !editClassId || !editSchoolYearId || !editEstablishmentId}>
              {isSavingEdit ? <LoadingSpinner iconClassName="h-4 w-4 mr-2" /> : "Enregistrer les modifications"}
            </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ProfessorSubjectAssignmentPage;