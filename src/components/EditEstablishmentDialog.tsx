import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { Establishment, EstablishmentType, Profile } from "@/lib/dataModels";
import { updateEstablishmentInStorage } from "@/lib/courseData";
import { getProfilesByRole, getProfileById } from '@/lib/studentData'; // Import getProfileById
import { useRole } from '@/contexts/RoleContext';

interface EditEstablishmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  establishment: Establishment;
  onSave: (updatedEstablishment: Establishment) => void;
}

const EditEstablishmentDialog = ({ isOpen, onClose, establishment, onSave }: EditEstablishmentDialogProps) => {
  const { currentRole } = useRole();
  const [name, setName] = useState(establishment.name);
  const [type, setType] = useState<EstablishmentType>(establishment.type);
  const [address, setAddress] = useState(establishment.address || '');
  const [phoneNumber, setPhoneNumber] = useState(establishment.phone_number || '');
  const [directorId, setDirectorId] = useState<string | undefined>(establishment.director_id);
  const [deputyDirectorId, setDeputyDirectorId] = useState<string | undefined>(establishment.deputy_director_id);
  const [contactEmail, setContactEmail] = useState(establishment.contact_email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [directors, setDirectors] = useState<Profile[]>([]);
  const [deputyDirectors, setDeputyDirectors] = useState<Profile[]>([]);
  // Removed currentDirectorName and currentDeputyDirectorName states as SelectValue will handle display

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
    const fetchRoles = async () => {
      setDirectors(await getProfilesByRole('director'));
      setDeputyDirectors(await getProfilesByRole('deputy_director'));
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    if (isOpen && establishment) {
      setName(establishment.name);
      setType(establishment.type);
      setAddress(establishment.address || '');
      setPhoneNumber(establishment.phone_number || '');
      setDirectorId(establishment.director_id);
      setDeputyDirectorId(establishment.deputy_director_id);
      setContactEmail(establishment.contact_email || '');
      // No need to resolve names here, SelectValue will do it
    }
  }, [isOpen, establishment]);

  const handleSave = async () => {
    if (currentRole !== 'administrator') {
      showError("Vous n'êtes pas autorisé à modifier un établissement.");
      return;
    }
    if (!name.trim()) {
      showError("Le nom de l'établissement est requis.");
      return;
    }
    if (!type) {
      showError("Le type de l'établissement est requis.");
      return;
    }
    if (contactEmail.trim() && !/\S+@\S+\.\S+/.test(contactEmail)) {
      showError("Veuillez entrer une adresse email de contact valide.");
      return;
    }

    setIsLoading(true);
    try {
      const updatedEstablishmentData: Establishment = {
        ...establishment,
        name: name.trim(),
        type: type,
        address: address.trim() || undefined,
        phone_number: phoneNumber.trim() || undefined,
        director_id: directorId,
        deputy_director_id: deputyDirectorId || undefined,
        contact_email: contactEmail.trim() || undefined,
      };
      const savedEstablishment = await updateEstablishmentInStorage(updatedEstablishmentData);

      if (savedEstablishment) {
        onSave(savedEstablishment);
        showSuccess("Établissement mis à jour avec succès !");
        onClose();
      } else {
        showError("Échec de la mise à jour de l'établissement.");
      }
    } catch (error: any) {
      console.error("Error saving establishment:", error);
      showError(`Erreur lors de la sauvegarde de l'établissement: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier l'établissement</DialogTitle>
          <DialogDescription>
            Mettez à jour les informations de l'établissement.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nom
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              required
              disabled={currentRole !== 'administrator'}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select value={type} onValueChange={(value: EstablishmentType) => setType(value)} disabled={currentRole !== 'administrator'}>
              <SelectTrigger id="type" className="col-span-3">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {establishmentTypes.map(estType => (
                  <SelectItem key={estType} value={estType}>{estType}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Adresse (facultatif)
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="col-span-3"
              disabled={currentRole !== 'administrator'}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phoneNumber" className="text-right">
              Téléphone (facultatif)
            </Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="col-span-3"
              disabled={currentRole !== 'administrator'}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="director" className="text-right">
              Directeur (facultatif)
            </Label>
            <Select value={directorId || "none"} onValueChange={(value) => setDirectorId(value === "none" ? undefined : value)} disabled={currentRole !== 'administrator'}>
              <SelectTrigger id="director" className="col-span-3">
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
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="deputyDirector" className="text-right">
              Directeur Adjoint (facultatif)
            </Label>
            <Select value={deputyDirectorId || "none"} onValueChange={(value) => setDeputyDirectorId(value === "none" ? undefined : value)} disabled={currentRole !== 'administrator'}>
              <SelectTrigger id="deputyDirector" className="col-span-3">
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
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contactEmail" className="text-right">
              Email de contact (facultatif)
            </Label>
            <Input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="col-span-3"
              disabled={currentRole !== 'administrator'}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isLoading || currentRole !== 'administrator'}>
            {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditEstablishmentDialog;