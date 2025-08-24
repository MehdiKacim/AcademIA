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
import { PlusCircle, Edit, Trash2, BookText, School, ChevronDown, ChevronUp } from "lucide-react";
import { Subject, Establishment, Profile } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import {
  loadSubjects,
  addSubjectToStorage,
  updateSubjectInStorage,
  deleteSubjectFromStorage,
  loadEstablishments,
} from '@/lib/courseData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRole } from '@/contexts/RoleContext';
import EditSubjectDialog from '@/components/EditSubjectDialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const SubjectManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // States for new subject form
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectEstablishmentId, setNewSubjectEstablishmentId] = useState<string | undefined>(
    (currentRole === 'director' || currentRole === 'deputy_director') && currentUserProfile?.establishment_id
      ? currentUserProfile.establishment_id
      : undefined
  );
  const [isNewSubjectFormOpen, setIsNewSubjectFormOpen] = useState(false);

  // States for edit dialog
  const [isEditSubjectDialogOpen, setIsEditSubjectDialogOpen] = useState(false);
  const [currentSubjectToEdit, setCurrentSubjectToEdit] = useState<Subject | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setEstablishments(await loadEstablishments());
      setSubjects(await loadSubjects());
    };
    fetchData();
  }, [currentUserProfile]);

  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';

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
        );
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

  if (!currentUserProfile || (currentRole !== 'administrator' && currentRole !== 'director' && currentRole !== 'deputy_director')) {
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

  const establishmentsToDisplay = currentRole === 'administrator'
    ? establishments
    : establishments.filter(est => est.id === currentUserProfile.establishment_id);

  const subjectsToDisplay = currentRole === 'administrator'
    ? subjects
    : subjects.filter(sub => sub.establishment_id === currentUserProfile.establishment_id);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion des Matières
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Créez et gérez les matières scolaires pour vos établissements.
      </p>

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
                  disabled={currentRole === 'director' || currentRole === 'deputy_director'}
                >
                  <SelectTrigger id="new-subject-establishment">
                    <SelectValue placeholder="Sélectionner un établissement" />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-lg bg-background/80">
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

export default SubjectManagementPage;