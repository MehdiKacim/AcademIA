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
import { PlusCircle, Edit, Trash2, Users, BookText, School, CalendarDays, UserRoundCog, Loader2, Check, Search, XCircle } from "lucide-react";
import { Profile, Class, Subject, SchoolYear, ProfessorSubjectAssignment, Establishment, Curriculum } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import {
  getAllProfiles,
  getProfilesByRole,
} from '@/lib/studentData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
} from "@/components/ui/dialog"; // Import Dialog components

const ProfessorSubjectAssignmentPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();

  const [professors, setProfessors] = useState<Profile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [assignments, setAssignments] = useState<ProfessorSubjectAssignment[]>([]);

  // States for new assignment form
  const [newAssignmentProfessorId, setNewAssignmentProfessorId] = useState<string>("");
  const [newAssignmentSubjectId, setNewAssignmentSubjectId] = useState<string>("");
  const [newAssignmentClassId, setNewAssignmentClassId] = useState<string>("");
  const [newAssignmentSchoolYearId, setNewAssignmentSchoolYearId] = useState<string>("");
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);

  // States for editing assignment
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentAssignmentToEdit, setCurrentAssignmentToEdit] = useState<ProfessorSubjectAssignment | null>(null);
  const [editProfessorId, setEditProfessorId] = useState<string>("");
  const [editSubjectId, setEditSubjectId] = useState<string>("");
  const [editClassId, setEditClassId] = useState<string>("");
  const [editSchoolYearId, setEditSchoolYearId] = useState<string>("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // States for filtering assignments list
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState('');
  const [selectedProfessorFilter, setSelectedProfessorFilter] = useState<string | null>(null);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string | null>(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null);
  const [selectedSchoolYearFilter, setSelectedSchoolYearFilter] = useState<string | null>(null);
  const [selectedEstablishmentFilter, setSelectedEstablishmentFilter] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setProfessors(await getProfilesByRole('professeur'));
      setSubjects(await loadSubjects());
      setClasses(await loadClasses());
      setSchoolYears(await loadSchoolYears());
      setEstablishments(await loadEstablishments());
      setCurricula(await loadCurricula());
      setAssignments(await loadProfessorSubjectAssignments());
    };
    fetchData();
  }, [currentUserProfile]);

  // Set default filters based on user role
  useEffect(() => {
    if (currentUserProfile && (currentRole === 'director' || currentRole === 'deputy_director')) {
      setSelectedEstablishmentFilter(currentUserProfile.establishment_id || null);
    } else {
      setSelectedEstablishmentFilter(null); // Admin can see all
    }
    const activeYear = schoolYears.find(sy => sy.is_active);
    if (activeYear) {
      setNewAssignmentSchoolYearId(activeYear.id);
      setSelectedSchoolYearFilter(activeYear.id);
    } else if (schoolYears.length > 0) {
      setNewAssignmentSchoolYearId(schoolYears[0].id);
      setSelectedSchoolYearFilter(schoolYears[0].id);
    }
  }, [currentRole, currentUserProfile?.establishment_id, schoolYears]);

  const getProfessorName = (id?: string) => professors.find(p => p.id === id)?.first_name + ' ' + professors.find(p => p.id === id)?.last_name || 'N/A';
  const getSubjectName = (id?: string) => subjects.find(s => s.id === id)?.name || 'N/A';
  const getClassName = (id?: string) => classes.find(c => c.id === id)?.name || 'N/A';
  const getSchoolYearName = (id?: string) => schoolYears.find(sy => sy.id === id)?.name || 'N/A';
  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';
  const getCurriculumName = (id?: string) => curricula.find(c => c.id === id)?.name || 'N/A';

  // --- New Assignment Logic ---
  const handleAddAssignment = async () => {
    if (!currentUserProfile || !['administrator', 'director', 'deputy_director'].includes(currentRole || '')) {
      showError("Vous n'êtes pas autorisé à ajouter des affectations.");
      return;
    }
    if (!newAssignmentProfessorId || !newAssignmentSubjectId || !newAssignmentClassId || !newAssignmentSchoolYearId) {
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

    // Director/Deputy Director can only assign within their establishment
    if ((currentRole === 'director' || currentRole === 'deputy_director') && selectedClass.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez affecter des professeurs qu'aux classes de votre établissement.");
      return;
    }
    if ((currentRole === 'director' || currentRole === 'deputy_director') && selectedSubject.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez affecter que des matières de votre établissement.");
      return;
    }
    if ((currentRole === 'director' || currentRole === 'deputy_director') && selectedProfessor.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez affecter que des professeurs de votre établissement.");
      return;
    }

    // Check for existing assignment
    const existingAssignment = assignments.find(
      a => a.professor_id === newAssignmentProfessorId &&
           a.subject_id === newAssignmentSubjectId &&
           a.class_id === newAssignmentClassId &&
           a.school_year_id === newAssignmentSchoolYearId
    );
    if (existingAssignment) {
      showError("Cette affectation existe déjà pour cette année scolaire.");
      return;
    }

    setIsAddingAssignment(true);
    try {
      const newAssignment: Omit<ProfessorSubjectAssignment, 'id' | 'created_at' | 'subject_name' | 'class_name' | 'school_year_name'> = {
        professor_id: newAssignmentProfessorId,
        subject_id: newAssignmentSubjectId,
        class_id: newAssignmentClassId,
        school_year_id: newAssignmentSchoolYearId,
      };
      const addedAssignment = await addProfessorSubjectAssignmentToStorage(newAssignment);
      if (addedAssignment) {
        setAssignments(await loadProfessorSubjectAssignments());
        setNewAssignmentProfessorId("");
        setNewAssignmentSubjectId("");
        setNewAssignmentClassId("");
        const activeYear = schoolYears.find(sy => sy.is_active);
        setNewAssignmentSchoolYearId(activeYear ? activeYear.id : (schoolYears.length > 0 ? schoolYears[0].id : ""));
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

  // --- Edit Assignment Logic ---
  const handleEditAssignment = (assignment: ProfessorSubjectAssignment) => {
    if (!currentUserProfile || !['administrator', 'director', 'deputy_director'].includes(currentRole || '')) {
      showError("Vous n'êtes pas autorisé à modifier cette affectation.");
      return;
    }
    const classOfAssignment = classes.find(cls => cls.id === assignment.class_id);
    if ((currentRole === 'director' || currentRole === 'deputy_director') && classOfAssignment?.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez modifier que les affectations de votre établissement.");
      return;
    }

    setCurrentAssignmentToEdit(assignment);
    setEditProfessorId(assignment.professor_id);
    setEditSubjectId(assignment.subject_id);
    setEditClassId(assignment.class_id);
    setEditSchoolYearId(assignment.school_year_id);
    setIsEditDialogOpen(true);
  };

  const handleSaveEditedAssignment = async () => {
    if (!currentUserProfile || !['administrator', 'director', 'deputy_director'].includes(currentRole || '')) {
      showError("Vous n'êtes pas autorisé à modifier cette affectation.");
      return;
    }
    if (!currentAssignmentToEdit) return;
    if (!editProfessorId || !editSubjectId || !editClassId || !editSchoolYearId) {
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

    // Director/Deputy Director can only assign within their establishment
    if ((currentRole === 'director' || currentRole === 'deputy_director') && selectedClass.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez affecter des professeurs qu'aux classes de votre établissement.");
      return;
    }
    if ((currentRole === 'director' || currentRole === 'deputy_director') && selectedSubject.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez affecter que des matières de votre établissement.");
      return;
    }
    if ((currentRole === 'director' || currentRole === 'deputy_director') && selectedProfessor.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez affecter que des professeurs de votre établissement.");
      return;
    }

    // Check for duplicate assignment (excluding the current one being edited)
    const existingAssignment = assignments.find(
      a => a.id !== currentAssignmentToEdit.id &&
           a.professor_id === editProfessorId &&
           a.subject_id === editSubjectId &&
           a.class_id === editClassId &&
           a.school_year_id === editSchoolYearId
    );
    if (existingAssignment) {
      showError("Cette affectation existe déjà pour cette année scolaire.");
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

  // --- Delete Assignment Logic ---
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
    if ((currentRole === 'director' || currentRole === 'deputy_director') && classOfAssignment?.establishment_id !== currentUserProfile.establishment_id) {
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

  // --- Filtering Logic for Display ---
  const filteredProfessors = professors.filter(prof =>
    !selectedEstablishmentFilter || prof.establishment_id === selectedEstablishmentFilter
  );

  const filteredSubjects = subjects.filter(sub =>
    !selectedEstablishmentFilter || sub.establishment_id === selectedEstablishmentFilter
  );

  const filteredClasses = classes.filter(cls =>
    !selectedEstablishmentFilter || cls.establishment_id === selectedEstablishmentFilter
  );

  const filteredAssignments = React.useMemo(() => {
    let filtered = assignments;

    if (selectedEstablishmentFilter) {
      filtered = filtered.filter(assignment => {
        const cls = classes.find(c => c.id === assignment.class_id);
        return cls?.establishment_id === selectedEstablishmentFilter;
      });
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
        getSubjectName(a.subject_id).toLowerCase().includes(lowerCaseQuery) ||
        getClassName(a.class_id).toLowerCase().includes(lowerCaseQuery) ||
        getSchoolYearName(a.school_year_id).toLowerCase().includes(lowerCaseQuery)
      );
    }
    return filtered;
  }, [assignments, assignmentSearchQuery, selectedProfessorFilter, selectedSubjectFilter, selectedClassFilter, selectedSchoolYearFilter, selectedEstablishmentFilter, professors, subjects, classes, schoolYears]);

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

  const establishmentsToDisplayForFilter = currentRole === 'administrator'
    ? establishments
    : establishments.filter(est => est.id === currentUserProfile.establishment_id);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion des Affectations Professeurs-Matières
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Affectez des professeurs à des matières pour des classes et années scolaires spécifiques.
      </p>

      {/* Section: Ajouter une nouvelle affectation */}
      <Card>
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
              <Select value={newAssignmentProfessorId} onValueChange={setNewAssignmentProfessorId}>
                <SelectTrigger id="new-professor">
                  <SelectValue placeholder="Sélectionner un professeur" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProfessors.map(prof => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.first_name} {prof.last_name} (@{prof.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-subject">Matière</Label>
              <Select value={newAssignmentSubjectId} onValueChange={setNewAssignmentSubjectId}>
                <SelectTrigger id="new-subject">
                  <SelectValue placeholder="Sélectionner une matière" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubjects.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name} ({getEstablishmentName(sub.establishment_id)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-class">Classe</Label>
              <Select value={newAssignmentClassId} onValueChange={setNewAssignmentClassId}>
                <SelectTrigger id="new-class">
                  <SelectValue placeholder="Sélectionner une classe" />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({getCurriculumName(cls.curriculum_id)}) - {getSchoolYearName(cls.school_year_id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-school-year">Année scolaire</Label>
              <Select value={newAssignmentSchoolYearId} onValueChange={setNewAssignmentSchoolYearId}>
                <SelectTrigger id="new-school-year">
                  <SelectValue placeholder="Sélectionner l'année scolaire" />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.map(year => (
                    <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAddAssignment} disabled={isAddingAssignment || !newAssignmentProfessorId || !newAssignmentSubjectId || !newAssignmentClassId || !newAssignmentSchoolYearId}>
            {isAddingAssignment ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />} Ajouter l'affectation
          </Button>
        </CardContent>
      </Card>

      {/* Section: Liste des affectations */}
      <Card>
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
                className="pl-10"
                value={assignmentSearchQuery}
                onChange={(e) => setAssignmentSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex-shrink-0 sm:w-1/3">
              <Label htmlFor="establishment-filter">Filtrer par Établissement</Label>
              <Select value={selectedEstablishmentFilter || "all"} onValueChange={(value) => {
                setSelectedEstablishmentFilter(value === "all" ? null : value);
                setSelectedProfessorFilter(null);
                setSelectedSubjectFilter(null);
                setSelectedClassFilter(null);
              }}
              disabled={currentRole === 'director' || currentRole === 'deputy_director'}
              >
                <SelectTrigger id="establishment-filter">
                  <SelectValue placeholder="Tous les établissements" />
                </SelectTrigger>
                <SelectContent>
                  {establishmentsToDisplayForFilter.map(est => (
                    <SelectItem key={est.id} value={est.id}>
                      {est.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-shrink-0 sm:w-1/3">
              <Label htmlFor="professor-filter">Filtrer par Professeur</Label>
              <Select value={selectedProfessorFilter || "all"} onValueChange={(value) => setSelectedProfessorFilter(value === "all" ? null : value)}>
                <SelectTrigger id="professor-filter">
                  <SelectValue placeholder="Tous les professeurs" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProfessors.map(prof => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.first_name} {prof.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-shrink-0 sm:w-1/3">
              <Label htmlFor="subject-filter">Filtrer par Matière</Label>
              <Select value={selectedSubjectFilter || "all"} onValueChange={(value) => setSelectedSubjectFilter(value === "all" ? null : value)}>
                <SelectTrigger id="subject-filter">
                  <SelectValue placeholder="Toutes les matières" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les matières</SelectItem>
                  {filteredSubjects.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-shrink-0 sm:w-1/3">
              <Label htmlFor="class-filter">Filtrer par Classe</Label>
              <Select value={selectedClassFilter || "all"} onValueChange={(value) => setSelectedClassFilter(value === "all" ? null : value)}>
                <SelectTrigger id="class-filter">
                  <SelectValue placeholder="Toutes les classes" />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({getSchoolYearName(cls.school_year_id)})
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
                <SelectContent>
                  <SelectItem value="all">Toutes les années</SelectItem>
                  {schoolYears.map(year => (
                    <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            {filteredAssignments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucune affectation trouvée pour votre recherche ou vos filtres.</p>
            ) : (
              filteredAssignments.map((assignment) => (
                <Card key={assignment.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex-grow">
                    <p className="font-medium">
                      <span className="text-primary">{getProfessorName(assignment.professor_id)}</span> enseigne <span className="text-primary">{getSubjectName(assignment.subject_id)}</span> à la classe <span className="text-primary">{getClassName(assignment.class_id)}</span> pour l'année <span className="text-primary">{getSchoolYearName(assignment.school_year_id)}</span>.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Établissement: {getEstablishmentName(classes.find(c => c.id === assignment.class_id)?.establishment_id)}
                    </p>
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
          <DialogContent className="sm:max-w-[425px] backdrop-blur-lg bg-background/80">
            <DialogHeader>
              <DialogTitle>Modifier l'affectation</DialogTitle>
              <DialogDescription>
                Mettez à jour les détails de l'affectation.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="edit-professor">Professeur</Label>
                <Select value={editProfessorId} onValueChange={setEditProfessorId}>
                  <SelectTrigger id="edit-professor">
                    <SelectValue placeholder="Sélectionner un professeur" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProfessors.map(prof => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.first_name} {prof.last_name} (@{prof.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-subject">Matière</Label>
                <Select value={editSubjectId} onValueChange={setEditSubjectId}>
                  <SelectTrigger id="edit-subject">
                    <SelectValue placeholder="Sélectionner une matière" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSubjects.map(sub => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name} ({getEstablishmentName(sub.establishment_id)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-class">Classe</Label>
                <Select value={editClassId} onValueChange={setEditClassId}>
                  <SelectTrigger id="edit-class">
                    <SelectValue placeholder="Sélectionner une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClasses.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} ({getCurriculumName(cls.curriculum_id)}) - {getSchoolYearName(cls.school_year_id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-school-year">Année scolaire</Label>
                <Select value={editSchoolYearId} onValueChange={setEditSchoolYearId}>
                  <SelectTrigger id="edit-school-year">
                    <SelectValue placeholder="Sélectionner l'année scolaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolYears.map(year => (
                      <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSaveEditedAssignment} disabled={isSavingEdit || !editProfessorId || !editSubjectId || !editClassId || !editSchoolYearId}>
              {isSavingEdit ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Enregistrer les modifications"}
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ProfessorSubjectAssignmentPage;