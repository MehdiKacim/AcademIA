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
import { PlusCircle, Edit, Trash2, Building2, UserRound, ChevronDown, ChevronUp } from "lucide-react";
import { Establishment, Curriculum, EstablishmentType, Profile } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import {
  loadEstablishments,
  addEstablishmentToStorage,
  deleteEstablishmentFromStorage,
  loadCurricula,
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

  // States for new establishment form
  const [newEstablishmentName, setNewEstablishmentName] = useState('');
  const [newEstablishmentType, setNewEstablishmentType] = useState<EstablishmentType>('Lycée Général');
  const [newEstablishmentAddress, setNewEstablishmentAddress] = useState('');
  const [newEstablishmentPhoneNumber, setNewEstablishmentPhoneNumber] = useState('');
  const [newEstablishmentDirectorId, setNewEstablishmentDirectorId] = useState<string | undefined>(undefined);
  const [newEstablishmentDeputyDirectorId, setNewEstablishmentDeputyDirectorId] = useState<string | undefined>(undefined);
  const [isNewEstablishmentFormOpen, setIsNewEstablishmentFormOpen] = useState(false);

  // States for edit dialogs
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentEstablishmentToEdit, setCurrentEstablishmentToEdit] = useState<Establishment | null>(null);

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
    };
    fetchData();
  }, []);

  const getDirectorName = (id?: string) => directors.find(d => d.id === id)?.first_name + ' ' + directors.find(d => d.id === id)?.last_name || 'N/A';
  const getDeputyDirectorName = (id?: string) => deputyDirectors.find(dd => dd.id === id)?.first_name + ' ' + deputyDirectors.find(dd => dd.id === id)?.last_name || 'N/A';

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
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet établissement ? Cette action est irréversible.")) {
      try {
        await deleteEstablishmentFromStorage(id);
        setEstablishments(await loadEstablishments());
        showSuccess("Établissement supprimé !");
      } catch (error: any) {
        console.error("Error deleting establishment:", error);
        showError(`Erreur lors de la suppression de l'établissement: ${error.message}`);
      }
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

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion des Établissements
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Ajoutez, modifiez ou supprimez des établissements scolaires.
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
                    <SelectContent className="backdrop-blur-lg bg-background/80">
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
                    <SelectContent className="backdrop-blur-lg bg-background/80">
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
                    <SelectContent className="backdrop-blur-lg bg-background/80">
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
                  {/* Removed subjects count from here */}
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
    </div>
  );
};

export default EstablishmentManagementPage;