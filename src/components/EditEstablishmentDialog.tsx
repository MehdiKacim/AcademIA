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
import { showSuccess, showError } from "@/utils/toast";
import { Establishment } from "@/lib/dataModels";
import { updateEstablishmentInStorage } from "@/lib/courseData";

interface EditEstablishmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  establishment: Establishment;
  onSave: (updatedEstablishment: Establishment) => void;
}

const EditEstablishmentDialog = ({ isOpen, onClose, establishment, onSave }: EditEstablishmentDialogProps) => {
  const [name, setName] = useState(establishment.name);
  const [address, setAddress] = useState(establishment.address || '');
  const [contactEmail, setContactEmail] = useState(establishment.contact_email || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && establishment) {
      setName(establishment.name);
      setAddress(establishment.address || '');
      setContactEmail(establishment.contact_email || '');
    }
  }, [isOpen, establishment]);

  const handleSave = async () => {
    if (!name.trim()) {
      showError("Le nom de l'établissement est requis.");
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
        address: address.trim() || undefined,
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
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Adresse
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contactEmail" className="text-right">
              Email de contact
            </Label>
            <Input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditEstablishmentDialog;