import React, { useState, useEffect } from 'react';
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
import { PlusCircle, Edit, Trash2, BookOpen, LayoutList, School, BookText, ChevronDown, ChevronUp } from "lucide-react";
import { Curriculum, Establishment, Course, Class, Profile, Subject } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import {
  loadCurricula,
  addCurriculumToStorage,
  deleteCurriculumFromStorage,
  loadEstablishments,
  loadCourses,
  updateCurriculumInStorage,
  loadClasses,
  loadSubjects, // Import loadSubjects
  addSubjectToStorage, // Import addSubjectToStorage
  updateSubjectInStorage, // Import updateSubjectInStorage
  deleteSubjectFromStorage, // Import deleteSubjectFromStorage
} from '@/lib/courseData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRole } from '@/contexts/RoleContext';
import EditCurriculumDialog from '@/components/EditCurriculumDialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"; // Import Collapsible
import EditSubjectDialog from '@/components/EditSubjectDialog'; // Import EditSubjectDialog

const CurriculumManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]); // New state for subjects

  // States for new curriculum form
  const [newCurriculumName, setNewCurriculumName] = useState('');
  const [newCurriculumEstablishmentId, setNewCurriculumEstablishmentId] = useState<string | undefined>(
    (currentRole === 'director' || currentRole === 'deputy_director') && currentUserProfile?.establishment_id
      ? currentUserProfile.establishment_id
      : undefined
  ); // Pre-fill for directors/deputy directors

  // States for new subject form
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectEstablishmentId, setNewSubjectEstablishmentId] = useState<string | undefined>(
    (currentRole === 'director' || currentRole === 'deputy_director') && currentUserProfile?.establishment_id
      ? currentUserProfile.establishment_id
      : undefined
  ); // Pre-fill for directors/deputy directors
  const [isNewSubjectFormOpen, setIsNewSubjectFormOpen] = useState(false);

  // States for manage courses modal
  const [isManageCoursesModalOpen, setIsManageCoursesModalOpen] = useState(false);
  const [selectedCurriculumForCourses, setSelectedCurriculumForCourses] = useState<Curriculum | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  // States for edit dialogs
  const [isEditCurriculumDialogOpen, setIsEditCurriculumDialogOpen] = useState(false); // Renamed from isEditDialogOpen
  const [currentCurriculumToEdit, setCurrentCurriculumToEdit] = useState<Curriculum | null>(null);
  const [isEditSubjectDialogOpen, setIsEditSubjectDialogOpen] = useState(false);
  const [currentSubjectToEdit, setCurrentSubjectToEdit] = useState<Subject | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setEstablishments(await loadEstablishments());
      setCurricula(await loadCurricula());
      setClasses(await loadClasses());
      setAllCourses(await loadCourses());
      setSubjects(await loadSubjects()); // Load all subjects
    };
    fetchData();
  }, [currentUserProfile]); // Added currentUserProfile to dependencies

  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';

  // --- Curriculum Management Handlers ---
  const handleAddCurriculum = async () => {
    if (!currentUserProfile || (currentRole !== 'professeur' && currentRole !== 'director' && currentRole !== 'deputy_director' && currentRole !== 'administrator')) { // Only professeur, director, deputy_director, administrator can add
      showError("Vous n'êtes pas autorisé à ajouter un cursus.");
      return;
    }
    if (!newCurriculumName.trim() || !newCurriculumEstablishmentId) {
      showError("Le nom du cursus et l'établissement sont requis.");
      return;
    }
    // Director/Deputy Director can only add curricula to their own establishment
    if ((currentRole === 'director' || currentRole === 'deputy_director') && newCurriculumEstablishmentId !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez ajouter des cursus que pour votre établissement.");
      return;
    }

    try {
      const newCur = await addCurriculumToStorage({
        id: '', // ID will be generated by Supabase
        name: newCurriculumName.trim(),
        description: undefined, // Default empty
        establishment_id: newCurriculumEstablishmentId,
        course_ids: [], // Initialize with empty array
      });
      if (newCur) {
        setCurricula(await loadCurricula()); // Re-fetch to get the new list
        setNewCurriculumName('');
        setNewCurriculumEstablishmentId(
          (currentRole === 'director' || currentRole === 'deputy_director') && currentUserProfile?.establishment_id
            ? currentUserProfile.establishment_id
            : undefined
        ); // Reset to pre-filled value
        showSuccess("Cursus ajouté !");
      } else {
        showError("Échec de l'ajout du cursus.");
      }
    } catch (error: any) {
      console.error("Error adding curriculum:", error);
      showError(`Erreur lors de l'ajout du cursus: ${error.message}`);
    }
  };

  const handleDeleteCurriculum = async (id: string) => {
    if (!currentUserProfile || (currentRole !== 'professeur' && currentRole !== 'director' && currentRole !== 'deputy_director' && currentRole !== 'administrator')) { // Only professeur, director, deputy_director, administrator can delete
      showError("Vous n'êtes pas autorisé à supprimer un cursus.");
      return;
    }
    const curriculumToDelete = curricula.find(cur => cur.id === id);
    if (!curriculumToDelete) {
      showError("Cursus introuvable.");
      return;
    }
    // Director/Deputy Director can only delete curricula from their own establishment
    if ((currentRole === 'director' || currentRole === 'deputy_director') && curriculumToDelete.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez supprimer des cursus que de votre établissement.");
      return;
    }

    try {
      await deleteCurriculumFromStorage(id);
      setCurricula(await loadCurricula()); // Re-fetch to get the updated list
      showSuccess("Cursus supprimé !");
    } catch (error: any) {
      console.error("Error deleting curriculum:", error);
      showError(`Erreur lors de la suppression du cursus: ${error.message}`);
    }
  };

  const handleOpenManageCoursesModal = (curriculum: Curriculum) => {
    if (!currentUserProfile || (currentRole !== 'professeur' && currentRole !== 'director' && currentRole !== 'deputy_director' && currentRole !== 'administrator')) { // Only professeur, director, deputy_director, administrator can manage courses
      showError("Vous n'êtes pas autorisé à gérer les cours d'un cursus.");
      return;
    }
    // Director/Deputy Director can only manage courses for curricula in their own establishment
    if ((currentRole === 'director' || currentRole === 'deputy_director') && curriculum.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez gérer les cours que pour les cursus de votre établissement.");
      return;
    }

    setSelectedCurriculumForCourses(curriculum);
    setSelectedCourseIds(curriculum.course_ids); // Use course_ids
    setIsManageCoursesModalOpen(true);
  };

  const handleSaveCurriculumCourses = async () => {
    if (!currentUserProfile || (currentRole !== 'professeur' && currentRole !== 'director' && currentRole !== 'deputy_director' && currentRole !== 'administrator')) { // Only professeur, director, deputy_director, administrator can save courses
      showError("Vous n'êtes pas autorisé à sauvegarder les cours d'un cursus.");
      return;
    }
    if (selectedCurriculumForCourses) {
      // Director/Deputy Director can only save courses for curricula in their own establishment
      if ((currentRole === 'director' || currentRole === 'deputy_director') && selectedCurriculumForCourses.establishment_id !== currentUserProfile.establishment_id) {
        showError("Vous ne pouvez sauvegarder les cours que pour les cursus de votre établissement.");
        return;
      }

      try {
        const updatedCurriculum: Curriculum = {
          ...selectedCurriculumForCourses,
          course_ids: selectedCourseIds, // Use course_ids
        };
        await updateCurriculumInStorage(updatedCurriculum);
        setCurricula(await loadCurricula()); // Re-fetch to get the updated list
        showSuccess("Cours du cursus mis à jour !");
        setIsManageCoursesModalOpen(false);
        setSelectedCurriculumForCourses(null);
        setSelectedCourseIds([]);
      } catch (error: any) {
        console.error("Error saving curriculum courses:", error);
        showError(`Erreur lors de la sauvegarde des cours du cursus: ${error.message}`);
      }
    }
  };

  const handleEditCurriculum = (curriculum: Curriculum) => {
    if (!currentUserProfile || (currentRole !== 'professeur' && currentRole !== 'director' && currentRole !== 'deputy_director' && currentRole !== 'administrator')) { // Only professeur, director, deputy_director, administrator can edit
      showError("Vous n'êtes pas autorisé à modifier un cursus.");
      return;
    }
    // Director/Deputy Director can only edit curricula from their own establishment
    if ((currentRole === 'director' || currentRole === 'deputy_director') && curriculum.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez modifier des cursus que de votre établissement.");
      return;
    }
    setCurrentCurriculumToEdit(curriculum);
    setIsEditCurriculumDialogOpen(true);
  };

  const handleSaveEditedCurriculum = async (updatedCurriculum: Curriculum) => {
    setCurricula(await loadCurricula()); // Re-fetch to get the updated list
  };

  // --- Subject Management Handlers ---
  const handleAddSubject = async () => {
    if (!currentUserProfile || (currentRole !== 'administrator' && currentRole !== 'director' && currentRole !== 'deputy_director')) {
      showError("Vous n'êtes pas autorisé à ajouter une matière.");
      return;
    }
    if (!newSubjectName.trim() || !newSubjectEstablishmentId) {
      showError("Le nom de la matière et l'établissement sont requis.");
      return;
    }
    // Directors/Deputy Directors can only add subjects to their own establishment
    if ((currentRole === 'director' || currentRole === 'deputy_director') && newSubjectEstablishmentId !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez ajouter des matières que pour votre établissement.");
      return;
    }

    try {
      const newSub = await addSubjectToStorage({
        name: newSubjectName.trim(),
        establishment_id: newSubjectEstablishmentId,
      });
      if (newSub) {
        setSubjects(await loadSubjects());
        setNewSubjectName('');
        setNewSubjectEstablishmentId(
          (currentRole === 'director' || currentRole === 'deputy_director') && currentUserProfile?.establishment_id
            ? currentUserProfile.establishment_id
            : undefined
        ); // Reset to pre-filled value
        showSuccess("Matière ajoutée !");
        setIsNewSubjectFormOpen(false);
      } else {
        showError("Échec de l'ajout de la matière.");
      }
    } catch (error: any) {
      console.error("Error adding subject:", error);
      showError(`Erreur lors de l'ajout de la matière: ${error.message}`);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!currentUserProfile || (currentRole !== 'administrator' && currentRole !== 'director' && currentRole !== 'deputy_director')) {
      showError("Vous n'êtes pas autorisé à supprimer une matière.");
      return;
    }
    const subjectToDelete = subjects.find(sub => sub.id === id);
    if (!subjectToDelete) {
      showError("Matière introuvable.");
      return;
    }
    // Directors/Deputy Directors can only delete subjects from their own establishment
    if ((currentRole === 'director' || currentRole === 'deputy_director') && subjectToDelete.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez supprimer des matières que de votre établissement.");
      return;
    }

    try {
      await deleteSubjectFromStorage(id);
      setSubjects(await loadSubjects());
      showSuccess("Matière supprimée !");
    } catch (error: any) {
      console.error("Error deleting subject:", error);
      showError(`Erreur lors de la suppression de la matière: ${error.message}`);
    }
  };

  const handleEditSubject = (subject: Subject) => {
    if (!currentUserProfile || (currentRole !== 'administrator' && currentRole !== 'director' && currentRole !== 'deputy_director')) {
      showError("Vous n'êtes pas autorisé à modifier une matière.");
      return;
    }
    // Directors/Deputy Directors can only edit subjects from their own establishment
    if ((currentRole === 'director' || currentRole === 'deputy_director') && subject.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez modifier des matières que de votre établissement.");
      return;
    }
    setCurrentSubjectToEdit(subject);
    setIsEditSubjectDialogOpen(true);
  };

  const handleSaveEditedSubject = async (updatedSubject: Subject) => {
    setSubjects(await loadSubjects());
  };

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

  if (!currentUserProfile || (currentRole !== 'professeur' && currentRole !== 'director' && currentRole !== 'deputy_director' && currentRole !== 'administrator')) { // Only professeur, director, deputy_director, administrator can access
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès Restreint
        </h1>
        <p className="text-lg text-muted-foreground">
          Seuls les professeurs, directeurs et administrateurs peuvent accéder à cette page.
        </p>
      </div>
    );
  }

  const establishmentsToDisplay = currentRole === 'administrator'
    ? establishments
    : establishments.filter(est => est.id === currentUserProfile.establishment_id);

  const curriculaToDisplay = currentRole === 'administrator'
    ? curricula
    : curricula.filter(cur => cur.establishment_id === currentUserProfile.establishment_id);

  const subjectsToDisplay = currentRole === 'administrator'
    ? subjects
    : subjects.filter(sub => sub.establishment_id === currentUserProfile.establishment_id);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion Pédagogique
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Créez et gérez des cursus scolaires et les matières associées pour vos établissements.
      </p>

      {/* Section: Cursus Scolaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutList className="h-6 w-6 text-primary" /> Cursus Scolaires
          </CardTitle>
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
            <Select 
              value={newCurriculumEstablishmentId} 
              onValueChange={setNewCurriculumEstablishmentId}
              disabled={currentRole === 'director' || currentRole === 'deputy_director'} // Disable for directors/deputy directors
            >
              <SelectTrigger id="curriculum-establishment">
                <SelectValue placeholder="Sélectionner un établissement" />
              </SelectTrigger>
              <SelectContent>
                {establishmentsToDisplay.map(est => (
                  <SelectItem key={est.id} value={est.id}>
                    {est.name} {est.address && <span className="italic text-muted-foreground">({est.address})</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddCurriculum} disabled={!newCurriculumName.trim() || !newCurriculumEstablishmentId}>
              <PlusCircle className="h-4 w-4 mr-2" /> Ajouter Cursus
            </Button>
          </div>
          <div className="space-y-2 mt-4">
            {establishmentsToDisplay.length === 0 ? (
              <p className="text-muted-foreground">Veuillez d'abord créer un établissement pour ajouter des cursus.</p>
            ) : (
              establishmentsToDisplay.map(est => (
                <Card key={est.id} className="p-4 space-y-3 bg-muted/20">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <School className="h-5 w-5 text-primary" /> Cursus de {est.name}
                  </h3>
                  <div className="space-y-2 pl-4 border-l">
                    {curriculaToDisplay.filter(cur => cur.establishment_id === est.id).length === 0 ? (
                      <p className="text-muted-foreground text-sm">Aucun cursus pour cet établissement.</p>
                    ) : (
                      curriculaToDisplay.filter(cur => cur.establishment_id === est.id).map(cur => (
                        <div key={cur.id} className="flex items-center justify-between p-3 border rounded-md bg-background">
                          <span>{cur.name} ({cur.course_ids.length} cours, {classes.filter(cls => cls.curriculum_id === cur.id).length} classes)</span>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleOpenManageCoursesModal(cur)}>
                              <BookOpen className="h-4 w-4 mr-1" /> Gérer Cours
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditCurriculum(cur)}>
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

      {/* Section: Gestion des Matières (Moved here) */}
      <Collapsible open={isNewSubjectFormOpen} onOpenChange={setIsNewSubjectFormOpen}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0">
                <CardTitle className="flex items-center gap-2">
                  <BookText className="h-6 w-6 text-primary" /> Ajouter une matière
                </CardTitle>
                {isNewSubjectFormOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </CollapsibleTrigger>
            <CardDescription>Créez une nouvelle matière pour un établissement.</CardDescription>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="new-subject-name">Nom de la matière</Label>
                <Input
                  id="new-subject-name"
                  placeholder="Ex: Mathématiques"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  required
                />
                <Label htmlFor="new-subject-establishment">Établissement</Label>
                <Select 
                  value={newSubjectEstablishmentId || "none"} 
                  onValueChange={(value) => setNewSubjectEstablishmentId(value === "none" ? undefined : value)}
                  disabled={currentRole === 'director' || currentRole === 'deputy_director'} // Disable for directors/deputy directors
                >
                  <SelectTrigger id="new-subject-establishment">
                    <SelectValue placeholder="Sélectionner un établissement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {establishmentsToDisplay.map(est => (
                      <SelectItem key={est.id} value={est.id}>
                        {est.name} {est.address && <span className="italic text-muted-foreground">({est.address})</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddSubject} disabled={!newSubjectName.trim() || !newSubjectEstablishmentId}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Ajouter la matière
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookText className="h-6 w-6 text-primary" /> Liste des Matières
          </CardTitle>
          <CardDescription>Visualisez et gérez les matières par établissement.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 mt-4">
            {establishmentsToDisplay.length === 0 ? (
              <p className="text-muted-foreground">Veuillez d'abord créer un établissement pour ajouter des matières.</p>
            ) : (
              establishmentsToDisplay.map(est => (
                <Card key={est.id} className="p-4 space-y-3 bg-muted/20">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <School className="h-5 w-5 text-primary" /> Matières de {est.name}
                  </h3>
                  <div className="space-y-2 pl-4 border-l">
                    {subjectsToDisplay.filter(sub => sub.establishment_id === est.id).length === 0 ? (
                      <p className="text-muted-foreground text-sm">Aucune matière pour cet établissement.</p>
                    ) : (
                      subjectsToDisplay.filter(sub => sub.establishment_id === est.id).map(sub => (
                        <div key={sub.id} className="flex items-center justify-between p-3 border rounded-md bg-background">
                          <span>{sub.name}</span>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditSubject(sub)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteSubject(sub.id)}>
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
                  allCourses
                    .filter(course => currentRole === 'administrator' || course.creator_id === currentUserProfile?.id) // Filter courses by creator for professeurs
                    .map(course => (
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

      {currentCurriculumToEdit && (
        <EditCurriculumDialog
          isOpen={isEditCurriculumDialogOpen}
          onClose={() => setIsEditCurriculumDialogOpen(false)}
          curriculum={currentCurriculumToEdit}
          onSave={handleSaveEditedCurriculum}
        />
      )}

      {currentSubjectToEdit && (
        <EditSubjectDialog
          isOpen={isEditSubjectDialogOpen}
          onClose={() => setIsEditSubjectDialogOpen(false)}
          subject={currentSubjectToEdit}
          onSave={handleSaveEditedSubject}
        />
      )}
    </div>
  );
};

export default CurriculumManagementPage;