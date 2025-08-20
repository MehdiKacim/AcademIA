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
import { Curriculum, Establishment, Course, Class } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import {
  loadCurricula,
  saveCurricula,
  addCurriculumToStorage,
  deleteCurriculumFromStorage,
  loadEstablishments,
  loadCourses,
  updateCurriculumInStorage,
  loadClasses,
} from '@/lib/courseData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRole } from '@/contexts/RoleContext';

const CurriculumManagementPage = () => {
  const { currentRole } = useRole();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);

  const [newCurriculumName, setNewCurriculumName] = useState('');
  const [newCurriculumEstablishmentId, setNewCurriculumEstablishmentId] = useState<string | undefined>(undefined);

  const [isManageCoursesModalOpen, setIsManageCoursesModalOpen] = useState(false);
  const [selectedCurriculumForCourses, setSelectedCurriculumForCourses] = useState<Curriculum | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  useEffect(() => {
    setEstablishments(loadEstablishments());
    setCurricula(loadCurricula());
    setClasses(loadClasses());
    setAllCourses(loadCourses());
  }, []);

  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';

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

  const handleDeleteCurriculum = (id: string) => {
    // Delete associated classes (simplified for this component)
    const classesToDelete = classes.filter(cls => cls.curriculumId === id);
    classesToDelete.forEach(cls => {
      // In a real app, you'd have a dedicated function for cascade deletion
      // For now, just remove them from state and storage
    });

    setCurricula(deleteCurriculumFromStorage(id));
    showSuccess("Cursus supprimé !");
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
        Gestion des Cursus Scolaires
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Créez et gérez des ensembles de cours pour vos classes, liés à un établissement.
      </p>

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
    </div>
  );
};

export default CurriculumManagementPage;