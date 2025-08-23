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
import { PlusCircle, Edit, Trash2, Building2, UserRound, ChevronDown, ChevronUp, BookText } from "lucide-react"; // Import BookText for subjects
import { Establishment, Curriculum, EstablishmentType, Profile, Subject } from "@/lib/dataModels"; // Import Subject
import { showSuccess, showError } from "@/utils/toast";
import {
  loadEstablishments,
  addEstablishmentToStorage,
  deleteEstablishmentFromStorage,
  loadCurricula,
  getEstablishmentAddress,
  loadSubjects, // Import loadSubjects
  addSubjectToStorage, // Import addSubjectToStorage
  updateSubjectInStorage, // Import updateSubjectInStorage
  deleteSubjectFromStorage, // Import deleteSubjectFromStorage
} from '@/lib/courseData';
import { useRole } from '@/contexts/RoleContext';
import EditEstablishmentDialog from '@/components/EditEstablishmentDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProfilesByRole } from '@/lib/studentData';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const EstablishmentManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [directors, setDirectors] = useState<Profile[]>([]);
  const [deputyDirectors, setDeputyDirectors] = useState<Profile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]); // New state for subjects

  // States for new establishment form
  const [newEstablishmentName, setNewEstablishmentName] = useState('');
  const [newEstablishmentType, setNewEstablishmentType] = useState<EstablishmentType>('Lycée Général');
  const [newEstablishmentAddress, setNewEstablishmentAddress] = useState('');
  const [newEstablishmentPhoneNumber, setNewEstablishmentPhoneNumber] = useState('');
  const [newEstablishmentDirectorId, setNewEstablishmentDirectorId] = useState<string | undefined>(undefined);
  const [newEstablishmentDeputyDirectorId, setNewEstablishmentDeputyDirectorId] = useState<string | undefined>(undefined);
  const [isNewEstablishmentFormOpen, setIsNewEstablishmentFormOpen] = useState(false);

  // States for new subject form
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectEstablishmentId, setNewSubjectEstablishmentId] = useState<string | undefined>(undefined);
  const [isNewSubjectFormOpen, setIsNewSubjectFormOpen] = useState(false);

  // States for edit dialogs
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentEstablishmentToEdit, setCurrentEstablishmentToEdit] = useState<Establishment | null>(null);
  const [isEditSubjectDialogOpen, setIsEditSubjectDialogOpen] = useState(false);
  const [currentSubjectToEdit, setCurrentSubjectToEdit] = useState<Subject | null>(null);

  const establishmentTypes: EstablishmentType[] = [
    'Maternelle',
    'Élémentaire',
    'Collège',
    'Lycée Général',
    'Lycée Technologique',
    'Lycée Professionnel',
    'Privé Sous Contrat',
    'Privé Hors Contrat',
    'Spécialisé',
    'CFA',
  ];

  useEffect(() => {
    const fetchData = async () => {
      setEstablishments(await loadEstablishments());
      setCurricula(await loadCurricula());
      setDirectors(await getProfilesByRole('director'));
      setDeputyDirectors(await getProfilesByRole('deputy_director'));
      setSubjects(await loadSubjects()); // Load all subjects
    };
    fetchData();
  }, []);

  const getDirectorName = (id?: string) => directors.find(d => d.id === id)?.first_name + ' ' + directors.find(d => d.id === id)?.last_name || 'N/A';
  const getDeputyDirectorName = (id?: string) => deputyDirectors.find(dd => dd.id === id)?.first_name + ' ' + deputyDirectors.find(dd => dd.id === id)?.last_name || 'N/A';
  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';

  // --- Establishment Management Handlers ---
  const handleAddEstablishment = async () => {
    if (!currentUserProfile || currentRole !== 'administrator') {
      showError("Vous n'êtes pas autorisé à ajouter un établissement.");
      return;
    }
    if (!newEstablishmentName.trim() || !newEstablishmentType) {
      showError("Le nom et le type de l'établissement sont requis.");
      return;
    }
    try {
      const newEst = await addEstablishmentToStorage({ 
        id: '', 
        name: newEstablishmentName.trim(),
        type: newEstablishmentType,
        address: newEstablishmentAddress.trim() || undefined,
        phone_number: newEstablishmentPhoneNumber.trim() || undefined,
        director_id: newEstablishmentDirectorId,
        deputy_director_id: newEstablishmentDeputyDirectorId || undefined,
      });
      if (newEst) {
        setEstablishments(await loadEstablishments());
        setNewEstablishmentName('');
        setNewEstablishmentType('Lycée Général');
        setNewEstablishmentAddress('');
        setNewEstablishmentPhoneNumber('');
        setNewEstablishmentDirectorId(undefined);
        setNewEstablishmentDeputyDirectorId(undefined);
        showSuccess("Établissement ajouté !");
        setIsNewEstablishmentFormOpen(false);
      } else {
        showError("Échec de l'ajout de l'établissement.");
      }
    } catch (error: any) {
      console.error("Error adding establishment:", error);
      showError(`Erreur lors de l'ajout de l'établissement: ${error.message}`);
    }
  };

  const handleDeleteEstablishment = async (id: string) => {
    if (!currentUserProfile || currentRole !== 'administrator') {
      showError("Vous n'êtes pas autorisé à supprimer un établissement.");
      return;
    }
    try {
      await deleteEstablishmentFromStorage(id);
      setEstablishments(await loadEstablishments());
      setSubjects(await loadSubjects()); // Refresh subjects as well
      showSuccess("Établissement supprimé !");
    } catch (error: any) {
      console.error("Error deleting establishment:", error);
      showError(`Erreur lors de la suppression de l'établissement: ${error.message}`);
    }
  };

  const handleEditEstablishment = (establishment: Establishment) => {
    if (!currentUserProfile || (currentRole !== 'administrator' && !(currentRole === 'director' || currentRole === 'deputy_director'))) {
      showError("Vous n'êtes pas autorisé à modifier un établissement.");
      return;
    }
    if ((currentRole === 'director' || currentRole === 'deputy_director') && establishment.id !== currentUserProfile.establishment_id) {
      showError("Vous ne pouvez modifier que votre propre établissement.");
      return;
    }
    setCurrentEstablishmentToEdit(establishment);
    setIsEditDialogOpen(true);
  };

  const handleSaveEditedEstablishment = async (updatedEstablishment: Establishment) => {
    setEstablishments(await loadEstablishments());
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
        Gestion des Établissements et Matières
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Ajoutez, modifiez ou supprimez des établissements scolaires et leurs matières associées.
      </p>

      {currentRole === 'administrator' && (
        <Collapsible open={isNewEstablishmentFormOpen} onOpenChange={setIsNewEstablishmentFormOpen}>
          <Card>
            <CardHeader>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-primary" /> Ajouter un établissement
                  </CardTitle>
                  {isNewEstablishmentFormOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </Button>
              </CollapsibleTrigger>
              <CardDescription>Créez un nouvel établissement.</CardDescription>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-establishment-name">Nom du nouvel établissement</Label>
                  <Input
                    id="new-establishment-name"
                    placeholder="Nom du nouvel établissement"
                    value={newEstablishmentName}
                    onChange={(e) => setNewEstablishmentName(e.target.value)}
                    required
                  />
                  <Label htmlFor="new-establishment-type">Type d'établissement</Label>
                  <Select value={newEstablishmentType} onValueChange={(value: EstablishmentType) => setNewEstablishmentType(value)}>
                    <SelectTrigger id="new-establishment-type">
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {establishmentTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label htmlFor="new-establishment-address">Adresse (facultatif)</Label>
                  <Input
                    id="new-establishment-address"
                    placeholder="Adresse de l'établissement"
                    value={newEstablishmentAddress}
                    onChange={(e) => setNewEstablishmentAddress(e.target.value)}
                  />
                  <Label htmlFor="new-establishment-phone">Numéro de téléphone (facultatif)</Label>
                  <Input
                    id="new-establishment-phone"
                    placeholder="Ex: 0123456789"
                    value={newEstablishmentPhoneNumber}
                    onChange={(e) => setNewEstablishmentPhoneNumber(e.target.value)}
                  />
                  <Label htmlFor="new-establishment-director">Directeur (facultatif)</Label>
                  <Select value={newEstablishmentDirectorId || "none"} onValueChange={(value) => setNewEstablishmentDirectorId(value === "none" ? undefined : value)}>
                    <SelectTrigger id="new-establishment-director">
                      <SelectValue placeholder="Sélectionner un directeur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {directors.map(director => (
                        <SelectItem key={director.id} value={director.id}>
                          {director.first_name} {director.last_name} (@{director.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label htmlFor="new-establishment-deputy-director">Directeur Adjoint (facultatif)</Label>
                  <Select value={newEstablishmentDeputyDirectorId || "none"} onValueChange={(value) => setNewEstablishmentDeputyDirectorId(value === "none" ? undefined : value)}>
                    <SelectTrigger id="new-establishment-deputy-director">
                      <SelectValue placeholder="Sélectionner un directeur adjoint" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {deputyDirectors.map(deputy => (
                        <SelectItem key={deputy.id} value={deputy.id}>
                          {deputy.first_name} {deputy.last_name} (@{deputy.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddEstablishment} disabled={!newEstablishmentName.trim() || !newEstablishmentType}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Ajouter
                  </Button>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Liste des Établissements
          </CardTitle>
          <CardDescription>Visualisez et gérez les établissements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 mt-4">
            {establishmentsToDisplay.length === 0 ? (
              <p className="text-muted-foreground">Aucun établissement à afficher.</p>
            ) : (
              establishmentsToDisplay.map((est) => (
                <Card key={est.id} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{est.name}</span>
                    <div className="flex gap-2">
                      {((currentRole === 'administrator') || 
                        ((currentRole === 'director' || currentRole === 'deputy_director') && est.id === currentUserProfile?.establishment_id)) && (
                        <Button variant="outline" size="sm" onClick={() => handleEditEstablishment(est)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {currentRole === 'administrator' && (
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteEstablishment(est.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Type: {est.type}
                  </div>
                  {est.address && (
                    <div className="text-sm text-muted-foreground">
                      Adresse: {est.address}
                    </div>
                  )}
                  {est.phone_number && (
                    <div className="text-sm text-muted-foreground">
                      Téléphone: {est.phone_number}
                    </div>
                  )}
                  {est.director_id && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <UserRound className="h-4 w-4" /> Directeur: {getDirectorName(est.director_id)}
                    </div>
                  )}
                  {est.deputy_director_id && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <UserRound className="h-4 w-4" /> Directeur Adjoint: {getDeputyDirectorName(est.deputy_director_id)}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    {curricula.filter(c => c.establishment_id === est.id).length} cursus
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {subjects.filter(s => s.establishment_id === est.id).length} matières
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section: Gestion des Matières */}
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
                    <Building2 className="h-5 w-5 text-primary" /> Matières de {est.name}
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

      {currentEstablishmentToEdit && (
        <EditEstablishmentDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          establishment={currentEstablishmentToEdit}
          onSave={handleSaveEditedEstablishment}
        />
      )}

      {currentSubjectToEdit && (
        <EditCurriculumDialog // Reusing EditCurriculumDialog for now, will create EditSubjectDialog if needed
          isOpen={isEditSubjectDialogOpen}
          onClose={() => setIsEditSubjectDialogOpen(false)}
          curriculum={{ ...currentSubjectToEdit, name: currentSubjectToEdit.name, establishment_id: currentSubjectToEdit.establishment_id, course_ids: [] }} // Adapt to Curriculum type
          onSave={async (updatedCurriculum) => {
            const updatedSubject: Subject = {
              id: updatedCurriculum.id,
              name: updatedCurriculum.name,
              establishment_id: updatedCurriculum.establishment_id,
            };
            await updateSubjectInStorage(updatedSubject);
            handleSaveEditedSubject(updatedSubject);
          }}
        />
      )}
    </div>
  );
};

export default EstablishmentManagementPage;