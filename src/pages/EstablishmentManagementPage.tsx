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
import { PlusCircle, Edit, Trash2, Building2, UserRound } from "lucide-react"; // Import UserRound
import { Establishment, Curriculum, EstablishmentType, Profile } from "@/lib/dataModels"; // Import Profile
import { showSuccess, showError } from "@/utils/toast";
import {
  loadEstablishments,
  addEstablishmentToStorage,
  deleteEstablishmentFromStorage,
  loadCurricula,
} from '@/lib/courseData';
import { useRole } from '@/contexts/RoleContext';
import EditEstablishmentDialog from '@/components/EditEstablishmentDialog'; // Import the new dialog
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import { getProfilesByRole } from '@/lib/studentData'; // Import getProfilesByRole

const EstablishmentManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [newEstablishmentName, setNewEstablishmentName] = useState('');
  const [newEstablishmentType, setNewEstablishmentType] = useState<EstablishmentType>('Lycée Général');
  const [newEstablishmentAddress, setNewEstablishmentAddress] = useState(''); // New state
  const [newEstablishmentPhoneNumber, setNewEstablishmentPhoneNumber] = useState(''); // New state
  const [newEstablishmentDirectorId, setNewEstablishmentDirectorId] = useState<string | undefined>(undefined); // New state
  const [newEstablishmentDeputyDirectorId, setNewEstablishmentDeputyDirectorId] = useState<string | undefined>(undefined); // New state
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [directors, setDirectors] = useState<Profile[]>([]); // State for directors
  const [deputyDirectors, setDeputyDirectors] = useState<Profile[]>([]); // State for deputy directors

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
      setDirectors(await getProfilesByRole('director')); // Fetch directors
      setDeputyDirectors(await getProfilesByRole('deputy_director')); // Fetch deputy directors
    };
    fetchData();
  }, []);

  const getDirectorName = (id?: string) => directors.find(d => d.id === id)?.first_name + ' ' + directors.find(d => d.id === id)?.last_name || 'N/A';
  const getDeputyDirectorName = (id?: string) => deputyDirectors.find(dd => dd.id === id)?.first_name + ' ' + deputyDirectors.find(dd => dd.id === id)?.last_name || 'N/A';

  const handleAddEstablishment = async () => {
    if (!currentUserProfile || currentRole !== 'administrator') {
      showError("Vous n'êtes pas autorisé à ajouter un établissement.");
      return;
    }
    if (!newEstablishmentName.trim() || !newEstablishmentType || !newEstablishmentAddress.trim() || !newEstablishmentDirectorId) {
      showError("Le nom, le type, l'adresse et le directeur de l'établissement sont requis.");
      return;
    }
    try {
      const newEst = await addEstablishmentToStorage({ 
        id: '', 
        name: newEstablishmentName.trim(),
        type: newEstablishmentType,
        address: newEstablishmentAddress.trim(),
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
      showSuccess("Établissement supprimé !");
    } catch (error: any) {
      console.error("Error deleting establishment:", error);
      showError(`Erreur lors de la suppression de l'établissement: ${error.message}`);
    }
  };

  const handleEditEstablishment = (establishment: Establishment) => {
    if (!currentUserProfile || currentRole !== 'administrator') {
      showError("Vous n'êtes pas autorisé à modifier un établissement.");
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

  if (currentRole !== 'administrator') {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès Restreint
        </h1>
        <p className="text-lg text-muted-foreground">
          Seuls les administrateurs peuvent accéder à cette page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion des Établissements
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Ajoutez, modifiez ou supprimez des établissements scolaires.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Établissements
          </CardTitle>
          <CardDescription>Ajoutez, modifiez ou supprimez des établissements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="new-establishment-name">Nom du nouvel établissement</Label>
            <Input
              id="new-establishment-name"
              placeholder="Nom du nouvel établissement"
              value={newEstablishmentName}
              onChange={(e) => setNewEstablishmentName(e.target.value)}
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
            <Label htmlFor="new-establishment-address">Adresse</Label>
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
            <Label htmlFor="new-establishment-director">Directeur (obligatoire)</Label>
            <Select value={newEstablishmentDirectorId} onValueChange={setNewEstablishmentDirectorId}>
              <SelectTrigger id="new-establishment-director">
                <SelectValue placeholder="Sélectionner un directeur" />
              </SelectTrigger>
              <SelectContent>
                {directors.map(director => (
                  <SelectItem key={director.id} value={director.id}>
                    {director.first_name} {director.last_name} (@{director.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label htmlFor="new-establishment-deputy-director">Directeur Adjoint (facultatif)</Label>
            <Select value={newEstablishmentDeputyDirectorId} onValueChange={setNewEstablishmentDeputyDirectorId}>
              <SelectTrigger id="new-establishment-deputy-director">
                <SelectValue placeholder="Sélectionner un directeur adjoint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun</SelectItem>
                {deputyDirectors.map(deputy => (
                  <SelectItem key={deputy.id} value={deputy.id}>
                    {deputy.first_name} {deputy.last_name} (@{deputy.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddEstablishment} disabled={!newEstablishmentName.trim() || !newEstablishmentType || !newEstablishmentAddress.trim() || !newEstablishmentDirectorId}>
              <PlusCircle className="h-4 w-4 mr-2" /> Ajouter
            </Button>
          </div>
          <div className="space-y-2 mt-4">
            {establishments.length === 0 ? (
              <p className="text-muted-foreground">Aucun établissement créé.</p>
            ) : (
              establishments.map((est) => (
                <Card key={est.id} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{est.name}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditEstablishment(est)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteEstablishment(est.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Type: {est.type}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Adresse: {est.address}
                  </div>
                  {est.phone_number && (
                    <div className="text-sm text-muted-foreground">
                      Téléphone: {est.phone_number}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <UserRound className="h-4 w-4" /> Directeur: {getDirectorName(est.director_id)}
                  </div>
                  {est.deputy_director_id && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <UserRound className="h-4 w-4" /> Directeur Adjoint: {getDeputyDirectorName(est.deputy_director_id)}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    {curricula.filter(c => c.establishment_id === est.id).length} cursus
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
    </div>
  );
};

export default EstablishmentManagementPage;