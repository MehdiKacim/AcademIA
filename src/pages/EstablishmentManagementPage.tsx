import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MotionCard, // Import MotionCard
} from "@/components/ui/card";
import { Button, MotionButton } from "@/components/ui/button"; // Import MotionButton
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, Building2, Search, UserPlus, UserRoundCog, XCircle, Check, ChevronDown, ChevronUp, Info, BriefcaseBusiness, User } from "lucide-react";
import { Profile, Establishment, ALL_ROLES } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import {
  loadEstablishments,
  addEstablishmentToStorage,
  updateEstablishmentInStorage,
  deleteEstablishmentFromStorage,
  getEstablishmentName,
} from '@/lib/courseData';
import {
  getAllProfiles,
  getProfilesByRole,
  updateProfile,
} from '@/lib/studentData';
import { useRole } from '@/contexts/RoleContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from '@/lib/utils';
import LoadingSpinner from "@/components/LoadingSpinner";
import SimpleItemSelector from '@/components/ui/SimpleItemSelector';

const iconMap: { [key: string]: React.ElementType } = {
  Building2, Info, BriefcaseBusiness, User
};

const EstablishmentManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser, fetchUserProfile } = useRole();

  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [directors, setDirectors] = useState<Profile[]>([]);
  const [deputyDirectors, setDeputyDirectors] = useState<Profile[]>([]);

  const [newEstablishmentName, setNewEstablishmentName] = useState('');
  const [newEstablishmentAddress, setNewEstablishmentAddress] = useState('');
  const [newEstablishmentContactEmail, setNewEstablishmentContactEmail] = useState('');
  const [isCreatingEstablishment, setIsCreatingEstablishment] = useState(false);
  const [isNewEstablishmentFormOpen, setIsNewEstablishmentFormOpen] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentEstablishmentToEdit, setCurrentEstablishmentToEdit] = useState<Establishment | null>(null);
  const [editEstablishmentName, setEditEstablishmentName] = useState('');
  const [editEstablishmentAddress, setEditEstablishmentAddress] = useState('');
  const [editEstablishmentContactEmail, setEditEstablishmentContactEmail] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [isAssignDirectorDialogOpen, setIsAssignDirectorDialogOpen] = useState(false);
  const [establishmentForAssignment, setEstablishmentForAssignment] = useState<Establishment | null>(null);
  const [selectedDirectorId, setSelectedDirectorId] = useState<string | null>(null);
  const [selectedDeputyDirectorId, setSelectedDeputyDirectorId] = useState<string | null>(null);
  const [directorSearchQuery, setDirectorSearchQuery] = useState('');
  const [deputyDirectorSearchQuery, setDeputyDirectorSearchQuery] = useState('');
  const [isAssigningRole, setIsAssigningRole] = useState(false);

  const fetchAllData = useCallback(async () => {
    try {
      const loadedEstablishments = await loadEstablishments();
      setEstablishments(loadedEstablishments);
      const loadedProfiles = await getAllProfiles();
      setAllProfiles(loadedProfiles);
      setDirectors(loadedProfiles.filter(p => p.role === 'director'));
      setDeputyDirectors(loadedProfiles.filter(p => p.role === 'deputy_director'));
    } catch (error: any) {
      console.error("Error fetching data for EstablishmentManagementPage:", error);
      showError(`Erreur lors du chargement des données de gestion des établissements: ${error.message}`);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const getRoleDisplayName = (role: Profile['role']) => {
    switch (role) {
      case 'director': return 'Directeur';
      case 'deputy_director': return 'Directeur Adjoint';
      default: return 'Rôle inconnu';
    }
  };

  const handleAddEstablishment = async () => {
    if (!newEstablishmentName.trim()) {
      showError("Le nom de l'établissement est requis.");
      return;
    }

    setIsCreatingEstablishment(true);
    try {
      const newEst: Omit<Establishment, 'id' | 'created_at' | 'updated_at'> = {
        name: newEstablishmentName.trim(),
        address: newEstablishmentAddress.trim() || undefined,
        contact_email: newEstablishmentContactEmail.trim() || undefined,
      };
      const addedEst = await addEstablishmentToStorage(newEst);
      if (addedEst) {
        showSuccess("Établissement ajouté !");
        setNewEstablishmentName('');
        setNewEstablishmentAddress('');
        setNewEstablishmentContactEmail('');
        setIsNewEstablishmentFormOpen(false);
        fetchAllData();
      } else {
        showError("Échec de l'ajout de l'établissement.");
      }
    } catch (error: any) {
      console.error("Error adding establishment:", error);
      showError(`Erreur lors de l'ajout de l'établissement: ${error.message}`);
    } finally {
      setIsCreatingEstablishment(false);
    }
  };

  const handleEditEstablishment = (establishment: Establishment) => {
    setCurrentEstablishmentToEdit(establishment);
    setEditEstablishmentName(establishment.name);
    setEditEstablishmentAddress(establishment.address || '');
    setEditEstablishmentContactEmail(establishment.contact_email || '');
    setIsEditDialogOpen(true);
  };

  const handleSaveEditedEstablishment = async () => {
    if (!currentEstablishmentToEdit) return;
    if (!editEstablishmentName.trim()) {
      showError("Le nom de l'établissement est requis.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const updatedEst: Establishment = {
        ...currentEstablishmentToEdit,
        name: editEstablishmentName.trim(),
        address: editEstablishmentAddress.trim() || undefined,
        contact_email: editEstablishmentContactEmail.trim() || undefined,
      };
      const savedEst = await updateEstablishmentInStorage(updatedEst);
      if (savedEst) {
        showSuccess("Établissement mis à jour !");
        setIsEditDialogOpen(false);
        setCurrentEstablishmentToEdit(null);
        fetchAllData();
      } else {
        showError("Échec de la mise à jour de l'établissement.");
      }
    } catch (error: any) {
      console.error("Error saving edited establishment:", error);
      showError(`Erreur lors de la sauvegarde de l'établissement: ${error.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteEstablishment = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet établissement ? Tous les utilisateurs, cursus, classes, etc. liés à cet établissement seront également affectés (dé-liés ou supprimés). Cette action est irréversible.")) {
      try {
        await deleteEstablishmentFromStorage(id);
        showSuccess("Établissement supprimé !");
        fetchAllData();
      } catch (error: any) {
        console.error("Error deleting establishment:", error);
        showError(`Erreur lors de la suppression de l'établissement: ${error.message}`);
      }
    }
  };

  const handleOpenAssignDirectorDialog = (establishment: Establishment) => {
    setEstablishmentForAssignment(establishment);
    const currentDirector = directors.find(d => d.establishment_id === establishment.id);
    const currentDeputyDirector = deputyDirectors.find(dd => dd.establishment_id === establishment.id);
    setSelectedDirectorId(currentDirector?.id || null);
    setSelectedDeputyDirectorId(currentDeputyDirector?.id || null);
    setDirectorSearchQuery(currentDirector ? `${currentDirector.first_name} ${currentDirector.last_name}` : '');
    setDeputyDirectorSearchQuery(currentDeputyDirector ? `${currentDeputyDirector.first_name} ${currentDeputyDirector.last_name}` : '');
    setIsAssignDirectorDialogOpen(true);
  };

  const handleAssignRoleToEstablishment = async (profileId: string | null, role: 'director' | 'deputy_director', establishmentId: string) => {
    if (!establishmentForAssignment) return;

    setIsAssigningRole(true);
    try {
      const currentAssignedUser = allProfiles.find(p => p.role === role && p.establishment_id === establishmentId);
      if (currentAssignedUser && currentAssignedUser.id !== profileId) {
        await updateProfile({ id: currentAssignedUser.id, establishment_id: null });
        await supabase.auth.admin.updateUserById(currentAssignedUser.id, { user_metadata: { establishment_id: null } });
      }

      if (profileId) {
        const selectedProfile = allProfiles.find(p => p.id === profileId);
        if (selectedProfile && selectedProfile.role === role) {
          await updateProfile({ id: profileId, establishment_id: establishmentId });
          await supabase.auth.admin.updateUserById(profileId, { user_metadata: { establishment_id: establishmentId } });
          showSuccess(`${getRoleDisplayName(role)} affecté à l'établissement !`);
        } else {
          showError(`Le profil sélectionné n'est pas un ${getRoleDisplayName(role)} ou est introuvable.`);
        }
      } else {
        showSuccess(`${getRoleDisplayName(role)} désaffecté de l'établissement.`);
      }
      
      fetchAllData();
      if (currentUserProfile?.id === profileId || currentUserProfile?.id === currentAssignedUser?.id) {
        await fetchUserProfile(currentUserProfile.id);
      }
    } catch (error: any) {
      console.error(`Error assigning ${role} to establishment:`, error);
      showError(`Erreur lors de l'affectation du ${getRoleDisplayName(role)}: ${error.message}`);
    } finally {
      setIsAssigningRole(false);
    }
  };

  const filteredDirectors = allProfiles.filter(p => p.role === 'director' && (!p.establishment_id || p.establishment_id === establishmentForAssignment?.id))
    .filter(p => 
      p.first_name?.toLowerCase().includes(directorSearchQuery.toLowerCase()) ||
      p.last_name?.toLowerCase().includes(directorSearchQuery.toLowerCase()) ||
      p.username?.toLowerCase().includes(directorSearchQuery.toLowerCase())
    );

  const filteredDeputyDirectors = allProfiles.filter(p => p.role === 'deputy_director' && (!p.establishment_id || p.establishment_id === establishmentForAssignment?.id))
    .filter(p => 
      p.first_name?.toLowerCase().includes(deputyDirectorSearchQuery.toLowerCase()) ||
      p.last_name?.toLowerCase().includes(deputyDirectorSearchQuery.toLowerCase()) ||
      p.username?.toLowerCase().includes(deputyDirectorSearchQuery.toLowerCase())
    );

  const directorOptions = [{ id: 'none', label: 'Désaffecter', icon_name: 'UserX' }, ...filteredDirectors.map(p => ({
    id: p.id,
    label: `${p.first_name} ${p.last_name} (@${p.username})`,
    icon_name: 'User',
  }))];

  const deputyDirectorOptions = [{ id: 'none', label: 'Désaffecter', icon_name: 'UserX' }, ...filteredDeputyDirectors.map(p => ({
    id: p.id,
    label: `${p.first_name} ${p.last_name} (@${p.username})`,
    icon_name: 'User',
  }))];

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

  if (!currentUserProfile || currentRole !== 'administrator') {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion des Établissements
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Créez, modifiez et gérez les établissements, et affectez-leur des directeurs.
      </p>

      {/* Section: Créer un nouvel établissement */}
      <Collapsible open={isNewEstablishmentFormOpen} onOpenChange={setIsNewEstablishmentFormOpen}>
        <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <MotionButton variant="ghost" className="w-full justify-between p-0" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="h-6 w-6 text-primary" /> Créer un nouvel établissement
                </CardTitle>
                {isNewEstablishmentFormOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </MotionButton>
            </CollapsibleTrigger>
            <CardDescription>Ajoutez un nouvel établissement à la plateforme.</CardDescription>
          </CardHeader>
          <CollapsibleContent className="space-y-4 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Nom de l'établissement"
                value={newEstablishmentName}
                onChange={(e) => setNewEstablishmentName(e.target.value)}
                required
              />
              <Input
                placeholder="Adresse (optionnel)"
                value={newEstablishmentAddress}
                onChange={(e) => setNewEstablishmentAddress(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Email de contact (optionnel)"
                value={newEstablishmentContactEmail}
                onChange={(e) => setNewEstablishmentContactEmail(e.target.value)}
              />
            </div>
            <MotionButton onClick={handleAddEstablishment} disabled={isCreatingEstablishment || !newEstablishmentName.trim()} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              {isCreatingEstablishment ? <LoadingSpinner iconClassName="h-4 w-4 mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />} Ajouter l'établissement
            </MotionButton>
          </CollapsibleContent>
        </MotionCard>
      </Collapsible>

      {/* Section: Liste des établissements */}
      <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Liste des Établissements
          </CardTitle>
          <CardDescription>Visualisez et gérez les établissements existants.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {establishments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucun établissement à afficher.</p>
            ) : (
              establishments.map((est) => {
                const assignedDirector = directors.find(d => d.establishment_id === est.id);
                const assignedDeputyDirector = deputyDirectors.find(dd => dd.establishment_id === est.id);
                return (
                  <MotionCard key={est.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)" }} whileTap={{ scale: 0.99 }}>
                    <div className="flex-grow">
                      <p className="font-medium">{est.name}</p>
                      {est.address && <p className="text-sm text-muted-foreground">{est.address}</p>}
                      {est.contact_email && <p className="text-sm text-muted-foreground">{est.contact_email}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        Directeur: {assignedDirector ? `${assignedDirector.first_name} ${assignedDirector.last_name}` : 'Non affecté'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Directeur Adjoint: {assignedDeputyDirector ? `${assignedDeputyDirector.first_name} ${assignedDeputyDirector.last_name}` : 'Non affecté'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                      <MotionButton variant="outline" size="sm" onClick={() => handleOpenAssignDirectorDialog(est)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <UserPlus className="h-4 w-4 mr-1" /> Affecter Directeurs
                      </MotionButton>
                      <MotionButton variant="outline" size="sm" onClick={() => handleEditEstablishment(est)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Edit className="h-4 w-4" />
                      </MotionButton>
                      <MotionButton variant="destructive" size="sm" onClick={() => handleDeleteEstablishment(est.id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Trash2 className="h-4 w-4" />
                      </MotionButton>
                    </div>
                  </MotionCard>
                );
              })
            )}
          </div>
        </CardContent>
      </MotionCard>

      {/* Edit Establishment Dialog */}
      {currentEstablishmentToEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] backdrop-blur-lg bg-background/80 rounded-android-tile z-[1000]">
            <div className="flex flex-col">
              <DialogHeader>
                <DialogTitle>Modifier l'établissement</DialogTitle>
                <DialogDescription>
                  Mettez à jour les informations de l'établissement.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 flex-grow">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Nom
                  </Label>
                  <Input
                    id="edit-name"
                    value={editEstablishmentName}
                    onChange={(e) => setEditEstablishmentName(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-address" className="text-right">
                    Adresse
                  </Label>
                  <Input
                    id="edit-address"
                    value={editEstablishmentAddress}
                    onChange={(e) => setEditEstablishmentAddress(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-contact-email" className="text-right">
                    Email Contact
                  </Label>
                  <Input
                    id="edit-contact-email"
                    type="email"
                    value={editEstablishmentContactEmail}
                    onChange={(e) => setEditEstablishmentContactEmail(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <MotionButton onClick={handleSaveEditedEstablishment} disabled={isSavingEdit} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  {isSavingEdit ? <LoadingSpinner iconClassName="h-4 w-4 mr-2" /> : "Enregistrer les modifications"}
                </MotionButton>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Assign Director/Deputy Director Dialog */}
      {establishmentForAssignment && (
        <Dialog open={isAssignDirectorDialogOpen} onOpenChange={setIsAssignDirectorDialogOpen}>
          <DialogContent className="sm:max-w-[500px] backdrop-blur-lg bg-background/80 rounded-android-tile z-[1000]">
            <div className="flex flex-col">
              <DialogHeader>
                <DialogTitle>Affecter Directeurs à "{establishmentForAssignment.name}"</DialogTitle>
                <DialogDescription>
                  Sélectionnez un directeur et un directeur adjoint pour cet établissement.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 flex-grow">
                {/* Assign Director */}
                <div>
                  <Label htmlFor="assign-director">Directeur</Label>
                  <SimpleItemSelector
                    id="assign-director"
                    options={directorOptions}
                    value={selectedDirectorId}
                    onValueChange={(value) => setSelectedDirectorId(value)}
                    searchQuery={directorSearchQuery}
                    onSearchQueryChange={setDirectorSearchQuery}
                    placeholder="Sélectionner un directeur..."
                    emptyMessage="Aucun directeur trouvé."
                    iconMap={iconMap}
                  />
                </div>

                {/* Assign Deputy Director */}
                <div>
                  <Label htmlFor="assign-deputy-director">Directeur Adjoint</Label>
                  <SimpleItemSelector
                    id="assign-deputy-director"
                    options={deputyDirectorOptions}
                    value={selectedDeputyDirectorId}
                    onValueChange={(value) => setSelectedDeputyDirectorId(value)}
                    searchQuery={deputyDirectorSearchQuery}
                    onSearchQueryChange={setDeputyDirectorSearchQuery}
                    placeholder="Sélectionner un directeur adjoint..."
                    emptyMessage="Aucun directeur adjoint trouvé."
                    iconMap={iconMap}
                  />
                </div>
              </div>
              <DialogFooter>
                <MotionButton onClick={async () => {
                  if (establishmentForAssignment) {
                    await handleAssignRoleToEstablishment(selectedDirectorId, 'director', establishmentForAssignment.id);
                    await handleAssignRoleToEstablishment(selectedDeputyDirectorId, 'deputy_director', establishmentForAssignment.id);
                    setIsAssignDirectorDialogOpen(false);
                  }
                }} disabled={isAssigningRole} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  {isAssigningRole ? <LoadingSpinner iconClassName="h-4 w-4 mr-2" /> : "Enregistrer les affectations"}
                </MotionButton>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EstablishmentManagementPage;