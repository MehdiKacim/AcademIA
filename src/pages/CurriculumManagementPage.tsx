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
import { PlusCircle, Edit, Trash2, BookOpen, LayoutList, School } from "lucide-react";
import { Curriculum, Course, Class, Profile, Establishment } from "@/lib/dataModels"; // Removed Establishment import
import { showSuccess, showError } from "@/utils/toast";
import {
  loadCurricula,
  addCurriculumToStorage,
  deleteCurriculumFromStorage,
  loadEstablishments, // Re-added loadEstablishments
  loadCourses,
  updateCurriculumInStorage,
  loadClasses,
} from '@/lib/courseData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRole } from '@/contexts/RoleContext';
import EditCurriculumDialog from '@/components/EditCurriculumDialog'; // Re-added EditCurriculumDialog import

const CurriculumManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const [establishments, setEstablishments] = useState<Establishment[]>([]); // Re-added establishments state
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);

  // States for new curriculum form
  const [newCurriculumName, setNewCurriculumName] = useState('');
  const [newCurriculumEstablishmentId, setNewCurriculumEstablishmentId] = useState<string | null>(null); // Re-added newCurriculumEstablishmentId

  // States for manage courses modal
  const [isManageCoursesModalOpen, setIsManageCoursesModalOpen] = useState(false);
  const [selectedCurriculumForCourses, setSelectedCurriculumForCourses] = useState<Curriculum | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  // States for edit dialog
  const [isEditCurriculumDialogOpen, setIsEditCurriculumDialogOpen] = useState(false);
  const [currentCurriculumToEdit, setCurrentCurriculumToEdit] = useState<Curriculum | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setEstablishments(await loadEstablishments()); // Re-added loadEstablishments
      setCurricula(await loadCurricula(currentUserProfile?.establishment_id)); // Filter by user's establishment
      setClasses(await loadClasses(currentUserProfile?.establishment_id)); // Filter by user's establishment
      setAllCourses(await loadCourses());
    };
    fetchData();
  }, [currentUserProfile]);

  // Set default establishment for new curriculum
  useEffect(() => {
    if (currentUserProfile?.establishment_id) {
      setNewCurriculumEstablishmentId(currentUserProfile.establishment_id);
    } else if (currentRole === 'administrator' && establishments.length > 0) {
      setNewCurriculumEstablishmentId(establishments[0].id);
    } else {
      setNewCurriculumEstablishmentId(null);
    }
  }, [currentUserProfile, currentRole, establishments]);

  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';

  // --- Curriculum Management Handlers ---
  const handleAddCurriculum = async () => {
    if (!currentUserProfile || (currentRole !== 'professeur' && currentRole !== 'director' && currentRole !== 'deputy_director' && currentRole !== 'administrator')) {
      showError("Vous n'êtes pas autorisé à ajouter un cursus.");
      return;
    }
    if (!newCurriculumName.trim()) {
      showError("Le nom du cursus est requis.");
      return;
    }
    if (!newCurriculumEstablishmentId && currentRole !== 'administrator') {
      showError("L'établissement est requis pour créer un cursus.");
      return;
    }

    try {
      const newCur = await addCurriculumToStorage({
        id: '',
        name: newCurriculumName.trim(),
        description: undefined,
        establishment_id: newCurriculumEstablishmentId || '', // Use selected establishment_id
        course_ids: [],
      });
      if (newCur) {
        setCurricula(await loadCurricula(currentUserProfile?.establishment_id)); // Refresh with filter
        setNewCurriculumName('');
        setNewCurriculumEstablishmentId(currentUserProfile?.establishment_id || null); // Reset to default
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
    if (!currentUserProfile || (currentRole !== 'professeur' && currentRole !== 'director' && currentRole !== 'deputy_director' && currentRole !== 'administrator')) {
      showError("Vous n'êtes pas autorisé à supprimer un cursus.");
      return;
    }
    const curriculumToDelete = curricula.find(cur => cur.id === id);
    if (!curriculumToDelete) {
      showError("Cursus introuvable.");
      return;
    }
    // Role-based establishment_id check
    if (currentRole !== 'administrator' && curriculumToDelete.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez supprimer que les cursus de votre établissement.");
      return;
    }

    try {
      await deleteCurriculumFromStorage(id);
      setCurricula(await loadCurricula(currentUserProfile?.establishment_id)); // Refresh with filter
      showSuccess("Cursus supprimé !");
    } catch (error: any) {
      console.error("Error deleting curriculum:", error);
      showError(`Erreur lors de la suppression du cursus: ${error.message}`);
    }
  };

  const handleOpenManageCoursesModal = (curriculum: Curriculum) => {
    if (!currentUserProfile || (currentRole !== 'professeur' && currentRole !== 'director' && currentRole !== 'deputy_director' && currentRole !== 'administrator')) {
      showError("Vous n'êtes pas autorisé à gérer les cours d'un cursus.");
      return;
    }
    // Role-based establishment_id check
    if (currentRole !== 'administrator' && curriculum.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez gérer les cours que des cursus de votre établissement.");
      return;
    }

    setSelectedCurriculumForCourses(curriculum);
    setSelectedCourseIds(curriculum.course_ids);
    setIsManageCoursesModalOpen(true);
  };

  const handleSaveCurriculumCourses = async () => {
    if (!currentUserProfile || (currentRole !== 'professeur' && currentRole !== 'director' && currentRole !== 'deputy_director' && currentRole !== 'administrator')) {
      showError("Vous n'êtes pas autorisé à sauvegarder les cours d'un cursus.");
      return;
    }
    if (selectedCurriculumForCourses) {
      // Role-based establishment_id check
      if (currentRole !== 'administrator' && selectedCurriculumForCourses.establishment_id !== currentUserProfile.establishment_id) {
        showError("Vous ne pouvez sauvegarder les cours que des cursus de votre établissement.");
        return;
      }

      try {
        const updatedCurriculum: Curriculum = {
          ...selectedCurriculumForCourses,
          course_ids: selectedCourseIds,
        };
        await updateCurriculumInStorage(updatedCurriculum);
        setCurricula(await loadCurricula(currentUserProfile?.establishment_id)); // Refresh with filter
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
    if (!currentUserProfile || (currentRole !== 'professeur' && currentRole !== 'director' && currentRole !== 'deputy_director' && currentRole !== 'administrator')) {
      showError("Vous n'êtes pas autorisé à modifier un cursus.");
      return;
    }
    // Role-based establishment_id check
    if (currentRole !== 'administrator' && curriculum.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez modifier que les cursus de votre établissement.");
      return;
    }
    setCurrentCurriculumToEdit(curriculum);
    setIsEditCurriculumDialogOpen(true);
  };

  const handleSaveEditedCurriculum = async (updatedCurriculum: Curriculum) => {
    setCurricula(await loadCurricula(currentUserProfile?.establishment_id)); // Refresh with filter
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

  if (!currentUserProfile || (currentRole !== 'professeur' && currentRole !== 'director' && currentRole !== 'deputy_director' && currentRole !== 'administrator')) {
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

  const establishmentsToDisplay = establishments.filter(est => 
    currentRole === 'administrator' || est.id === currentUserProfile?.establishment_id
  );
  const curriculaToDisplay = curricula; // Already filtered by useEffect

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"> {/* Added responsive padding and max-width */}
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion des Cursus
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Créez et gérez des cursus scolaires.
      </p>

      <Card className="rounded-android-tile">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutList className="h-6 w-6 text-primary" /> Cursus Scolaires
          </CardTitle>
          <CardDescription>Créez et gérez des ensembles de cours.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="new-curriculum-name">Nom du nouveau cursus</Label>
            <Input
              id="new-curriculum-name"
              placeholder="Ex: Cursus Scientifique"
              value={newCurriculumName}
              onChange={(e) => setNewCurriculumName(e.target.value)}
              required
            />
            {(currentRole === 'administrator' || (currentUserProfile?.establishment_id && ['director', 'deputy_director', 'professeur'].includes(currentRole || ''))) && (
              <>
                <Label htmlFor="new-curriculum-establishment">Établissement</Label>
                <Select value={newCurriculumEstablishmentId || ""} onValueChange={(value) => setNewCurriculumEstablishmentId(value === "none" ? null : value)} disabled={currentRole !== 'administrator' && !!currentUserProfile?.establishment_id}>
                  <SelectTrigger id="new-curriculum-establishment" className="rounded-android-tile">
                    <SelectValue placeholder="Sélectionner un établissement" />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-lg bg-background/80 z-[9999] rounded-android-tile">
                    {currentRole === 'administrator' && <SelectItem value="none">Aucun</SelectItem>}
                    {establishmentsToDisplay.map(est => (
                      <SelectItem key={est.id} value={est.id}>
                        {est.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            <Button onClick={handleAddCurriculum} disabled={!newCurriculumName.trim() || (!newCurriculumEstablishmentId && currentRole !== 'administrator')}>
              <PlusCircle className="h-4 w-4 mr-2" /> Ajouter Cursus
            </Button>
          </div>
          <div className="space-y-2 mt-4">
            {curriculaToDisplay.length === 0 ? (
              <p className="text-muted-foreground">Aucun cursus à afficher.</p>
            ) : (
              curriculaToDisplay.map(cur => (
                <div key={cur.id} className="flex items-center justify-between p-3 border rounded-android-tile bg-background">
                  <span>{cur.name} ({cur.course_ids.length} cours, {classes.filter(cls => cls.curriculum_id === cur.id).length} classes) {cur.establishment_id && `(${getEstablishmentName(cur.establishment_id, establishments)})`}</span>
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
        </CardContent>
      </Card>

      {/* Manage Curriculum Courses Modal */}
      {isManageCoursesModalOpen && selectedCurriculumForCourses && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl backdrop-blur-lg bg-background/80 rounded-android-tile">
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
                    .filter(course => currentRole === 'administrator' || course.creator_id === currentUserProfile?.id)
                    .map(course => (
                      <div key={course.id} className="flex items-center justify-between p-2 border rounded-android-tile">
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
          establishments={establishmentsToDisplay} // Pass establishments
        />
      )}
    </div>
  );
};

export default CurriculumManagementPage;