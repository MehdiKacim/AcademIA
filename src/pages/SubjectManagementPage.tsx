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
import { PlusCircle, Edit, Trash2, BookText, School, ChevronDown, ChevronUp, Building2 } from "lucide-react";
import { Subject, Profile, Establishment } from "@/lib/dataModels"; // Import Establishment
import { showSuccess, showError } from "@/utils/toast";
import {
  loadSubjects,
  addSubjectToStorage,
  updateSubjectInStorage,
  deleteSubjectFromStorage,
  loadEstablishments, // Re-added loadEstablishments
} from '@/lib/courseData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRole } from '@/contexts/RoleContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import EditSubjectDialog from '@/components/EditSubjectDialog'; // Re-added EditSubjectDialog import

const SubjectManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]); // Re-added establishments state

  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectEstablishmentId, setNewSubjectEstablishmentId] = useState<string | null>(null); // New: for establishment_id
  const [isNewSubjectFormOpen, setIsNewSubjectFormOpen] = useState(false);

  const [isEditSubjectDialogOpen, setIsEditSubjectDialogOpen] = useState(false);
  const [currentSubjectToEdit, setCurrentSubjectToEdit] = useState<Subject | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setEstablishments(await loadEstablishments()); // Re-added loadEstablishments
      setSubjects(await loadSubjects(currentUserProfile?.establishment_id)); // Filter by user's establishment
    };
    fetchData();
  }, [currentUserProfile]);

  // Set default establishment for new subject
  useEffect(() => {
    if (currentUserProfile?.establishment_id) {
      setNewSubjectEstablishmentId(currentUserProfile.establishment_id);
    } else if (currentRole === 'administrator' && establishments.length > 0) {
      setNewSubjectEstablishmentId(establishments[0].id);
    } else {
      setNewSubjectEstablishmentId(null);
    }
  }, [currentUserProfile, currentRole, establishments]);

  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';

  const handleAddSubject = async () => {
    if (!currentUserProfile || (currentRole !== 'administrator' && currentRole !== 'director' && currentRole !== 'deputy_director')) {
      showError("Vous n'êtes pas autorisé à ajouter une matière.");
      return;
    }
    if (!newSubjectName.trim()) {
      showError("Le nom de la matière est requis.");
      return;
    }
    if (!newSubjectEstablishmentId && currentRole !== 'administrator') {
      showError("L'établissement est requis pour ajouter une matière.");
      return;
    }

    try {
      const newSub = await addSubjectToStorage({
        name: newSubjectName.trim(),
        establishment_id: newSubjectEstablishmentId || '', // Use selected establishment_id
      });
      if (newSub) {
        setSubjects(await loadSubjects(currentUserProfile?.establishment_id)); // Refresh with filter
        setNewSubjectName('');
        setNewSubjectEstablishmentId(currentUserProfile?.establishment_id || null); // Reset to default
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
    // Role-based establishment_id check
    if (currentRole !== 'administrator' && subjectToDelete.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez supprimer que les matières de votre établissement.");
      return;
    }

    try {
      await deleteSubjectFromStorage(id);
      setSubjects(await loadSubjects(currentUserProfile?.establishment_id)); // Refresh with filter
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
    // Role-based establishment_id check
    if (currentRole !== 'administrator' && subject.establishment_id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez modifier que les matières de votre établissement.");
      return;
    }
    setCurrentSubjectToEdit(subject);
    setIsEditSubjectDialogOpen(true);
  };

  const handleSaveEditedSubject = async (updatedSubject: Subject) => {
    setSubjects(await loadSubjects(currentUserProfile?.establishment_id)); // Refresh with filter
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

  const establishmentsToDisplay = establishments.filter(est => 
    currentRole === 'administrator' || est.id === currentUserProfile?.establishment_id
  );
  const subjectsToDisplay = subjects; // Already filtered by useEffect

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"> {/* Added responsive padding and max-width */}
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion des Matières
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Créez et gérez les matières scolaires.
      </p>

      <Collapsible open={isNewSubjectFormOpen} onOpenChange={setIsNewSubjectFormOpen}>
        <Card className="rounded-android-tile">
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0">
                <CardTitle className="flex items-center gap-2">
                  <BookText className="h-6 w-6 text-primary" /> Ajouter une matière
                </CardTitle>
                {isNewSubjectFormOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </CollapsibleTrigger>
            <CardDescription>Créez une nouvelle matière.</CardDescription>
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
                {(currentRole === 'administrator' || (currentUserProfile?.establishment_id && ['director', 'deputy_director'].includes(currentRole || ''))) && (
                  <>
                    <Label htmlFor="new-subject-establishment">Établissement</Label>
                    <Select value={newSubjectEstablishmentId || ""} onValueChange={(value) => setNewSubjectEstablishmentId(value === "none" ? null : value)} disabled={currentRole !== 'administrator' && !!currentUserProfile?.establishment_id}>
                      <SelectTrigger id="new-subject-establishment" className="rounded-android-tile">
                        <SelectValue placeholder="Sélectionner un établissement" />
                      </SelectTrigger>
                      <SelectContent className="backdrop-blur-lg bg-background/80">
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
                <Button onClick={handleAddSubject} disabled={!newSubjectName.trim() || (!newSubjectEstablishmentId && currentRole !== 'administrator')}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Ajouter la matière
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Card className="rounded-android-tile">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookText className="h-6 w-6 text-primary" /> Liste des Matières
          </CardTitle>
          <CardDescription>Visualisez et gérez les matières.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 mt-4">
            {subjectsToDisplay.length === 0 ? (
              <p className="text-muted-foreground">Aucune matière à afficher.</p>
            ) : (
              subjectsToDisplay.map(sub => (
                <Card key={sub.id} className="p-3 flex items-center justify-between border rounded-android-tile bg-background">
                  <span>{sub.name} {sub.establishment_id && `(${getEstablishmentName(sub.establishment_id)})`}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditSubject(sub)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteSubject(sub.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
          establishments={establishmentsToDisplay} // Pass establishments
        />
      )}
    </div>
  );
};

export default SubjectManagementPage;