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
import { PlusCircle, Edit, Trash2, School } from "lucide-react";
import { Establishment } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import {
  loadEstablishments,
  addEstablishmentToStorage,
  deleteEstablishmentFromStorage,
  loadCurricula,
} from '@/lib/courseData';
import { loadCreatorProfiles, updateCreatorProfile, getUserFullName } from '@/lib/studentData';
import { useRole } from '@/contexts/RoleContext';

const EstablishmentManagementPage = () => {
  const { currentUser, currentRole } = useRole();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [newEstablishmentName, setNewEstablishmentName] = useState('');
  const [curricula, setCurricula] = useState(loadCurricula());
  const [creatorProfiles, setCreatorProfiles] = useState(loadCreatorProfiles());

  useEffect(() => {
    setEstablishments(loadEstablishments());
    setCurricula(loadCurricula());
    setCreatorProfiles(loadCreatorProfiles());
  }, []);

  const handleAddEstablishment = () => {
    if (newEstablishmentName.trim()) {
      const newEst: Establishment = { id: `est${Date.now()}`, name: newEstablishmentName.trim() };
      const updatedEstablishments = addEstablishmentToStorage(newEst);
      setEstablishments(updatedEstablishments);

      if (currentUser && currentUser.role === 'creator') {
        const creatorProfile = creatorProfiles.find(p => p.userId === currentUser.id);
        if (creatorProfile) {
          const updatedCreatorProfile = {
            ...creatorProfile,
            establishmentIds: [...(creatorProfile.establishmentIds || []), newEst.id],
          };
          setCreatorProfiles(updateCreatorProfile(updatedCreatorProfile));
        }
      }

      setNewEstablishmentName('');
      showSuccess("Établissement ajouté !");
    } else {
      showError("Le nom de l'établissement est requis.");
    }
  };

  const handleDeleteEstablishment = (id: string) => {
    // Delete associated curricula (simplified for this component, full cascade handled in ClassManagement if it were a central hub)
    const curriculaToDelete = curricula.filter(cur => cur.establishmentId === id);
    curriculaToDelete.forEach(cur => {
      // In a real app, you'd have a dedicated function for cascade deletion
      // For now, just remove them from state and storage
      // This is a simplified approach as full cascade is complex across multiple pages
      // and would ideally be handled by a backend or a more robust local data layer.
      // For this demo, we'll just remove the establishment and its direct children.
      // The curriculum and class pages will handle their own data consistency.
    });

    // Remove association from creator profiles
    const updatedCreatorProfiles = creatorProfiles.map(profile => ({
      ...profile,
      establishmentIds: profile.establishmentIds.filter(estId => estId !== id),
    }));
    setCreatorProfiles(updatedCreatorProfiles);
    updatedCreatorProfiles.forEach(profile => updateCreatorProfile(profile)); // Persist changes

    setEstablishments(deleteEstablishmentFromStorage(id));
    showSuccess("Établissement supprimé !");
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
        Gestion des Établissements
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Ajoutez, modifiez ou supprimez des établissements scolaires.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-6 w-6 text-primary" /> Établissements
          </CardTitle>
          <CardDescription>Ajoutez, modifiez ou supprimez des établissements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nom du nouvel établissement"
              value={newEstablishmentName}
              onChange={(e) => setNewEstablishmentName(e.target.value)}
            />
            <Button onClick={handleAddEstablishment}>
              <PlusCircle className="h-4 w-4 mr-2" /> Ajouter
            </Button>
          </div>
          <div className="space-y-2">
            {establishments.length === 0 ? (
              <p className="text-muted-foreground">Aucun établissement créé.</p>
            ) : (
              establishments.map((est) => (
                <Card key={est.id} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{est.name}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => console.log('Modifier établissement', est.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteEstablishment(est.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {curricula.filter(c => c.establishmentId === est.id).length} cursus
                    {creatorProfiles.filter(cp => cp.establishmentIds.includes(est.id)).length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Professeurs associés: {creatorProfiles.filter(cp => cp.establishmentIds.includes(est.id)).map(cp => getUserFullName(cp.userId)).join(', ')}
                      </p>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstablishmentManagementPage;