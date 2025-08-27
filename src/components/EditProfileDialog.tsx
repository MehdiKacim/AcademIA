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
import { Profile } from "@/lib/dataModels"; // Removed Establishment import
import { updateProfile } from "@/lib/studentData"; // Import updateProfile
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import { loadEstablishments, getEstablishmentName } from '@/lib/courseData'; // Import loadEstablishments and getEstablishmentName
import { useRole } from '@/contexts/RoleContext'; // Import useRole
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';
import { CalendarDays } from 'lucide-react';
import { Establishment } from '@/lib/dataModels'; // Import Establishment type

interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: Profile; // Now expects a Profile object
  onSave: (updatedProfile: Profile) => void;
}

const EditProfileDialog = ({ isOpen, onClose, currentUserProfile, onSave }: EditProfileDialogProps) => {
  const { currentRole } = useRole(); // Get currentRole
  const [firstName, setFirstName] = useState(currentUserProfile.first_name || '');
  const [lastName, setLastName] = useState(currentUserProfile.last_name || '');
  const [username, setUsername] = useState(currentUserProfile.username);
  const [email, setEmail] = useState(''); // Email is from auth.users, not directly in profile
  // Removed establishmentId state
  const [enrollmentStartDate, setEnrollmentStartDate] = useState<Date | undefined>(currentUserProfile.enrollment_start_date ? parseISO(currentUserProfile.enrollment_start_date) : undefined);
  const [enrollmentEndDate, setEnrollmentEndDate] = useState<Date | undefined>(currentUserProfile.enrollment_end_date ? parseISO(currentUserProfile.enrollment_end_date) : undefined);
  const [establishments, setEstablishments] = useState<Establishment[]>([]); // Re-added establishments state

  useEffect(() => {
    const fetchEstablishments = async () => {
      setEstablishments(await loadEstablishments()); // Re-added loadEstablishments
    };
    fetchEstablishments();
  }, []);

  useEffect(() => {
    if (isOpen && currentUserProfile) {
      setFirstName(currentUserProfile.first_name || '');
      setLastName(currentUserProfile.last_name || '');
      setUsername(currentUserProfile.username);
      // Removed setEstablishmentId
      setEnrollmentStartDate(currentUserProfile.enrollment_start_date ? parseISO(currentUserProfile.enrollment_start_date) : undefined);
      setEnrollmentEndDate(currentUserProfile.enrollment_end_date ? parseISO(currentUserProfile.enrollment_end_date) : undefined);
      // Fetch email from auth.users
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setEmail(user.email || '');
        }
      });
    }
  }, [isOpen, currentUserProfile]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !username.trim() || !email.trim()) {
      showError("Tous les champs sont requis.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      showError("Veuillez entrer une adresse email valide.");
      return;
    }
    if (currentRole === 'student' && (!enrollmentStartDate || !enrollmentEndDate)) { // Removed establishmentId check
      showError("Les dates d'inscription sont requises pour les élèves.");
      return;
    }
    if (enrollmentStartDate && enrollmentEndDate && enrollmentStartDate >= enrollmentEndDate) {
      showError("La date de fin d'inscription doit être postérieure à la date de début.");
      return;
    }

    try {
      // Update profile table
      const updatedProfileData: Partial<Profile> = {
        id: currentUserProfile.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim(),
        email: email.trim(), // Update email in profile table as well
        // Removed establishment_id
        enrollment_start_date: enrollmentStartDate ? enrollmentStartDate.toISOString().split('T')[0] : undefined,
        enrollment_end_date: enrollmentEndDate ? enrollmentEndDate.toISOString().split('T')[0] : undefined,
      };
      const savedProfile = await updateProfile(updatedProfileData);

      // Update auth.users email if changed
      if (email.trim() !== (await supabase.auth.getUser()).data.user?.email) {
        const { error: emailUpdateError } = await supabase.auth.updateUser({ email: email.trim() });
        if (emailUpdateError) {
          // console.error("Error updating user email:", emailUpdateError);
          showError(`Erreur lors de la mise à jour de l'email: ${emailUpdateError.message}`);
          return;
        }
      }

      if (savedProfile) {
        onSave(savedProfile); // Pass the updated profile back to the parent
        showSuccess("Profil mis à jour avec succès !");
        onClose();
      } else {
        showError("Échec de la mise à jour du profil.");
      }
    } catch (error: any) {
      // console.error("Error saving profile:", error);
      showError(`Erreur lors de la sauvegarde du profil: ${error.message}`);
    }
  };

  // Removed establishmentsToDisplay

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] backdrop-blur-lg bg-background/80 rounded-android-tile">
        <div className="flex flex-col"> {/* Wrap children in a single div */}
          <DialogHeader>
            <DialogTitle>Modifier le profil</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de votre profil. Cliquez sur enregistrer lorsque vous avez terminé.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 flex-grow"> {/* Added flex-grow */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                Prénom
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Nom
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Nom d'utilisateur
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            {currentRole === 'student' && (
              <>
                {/* Removed Establishment Select */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="enrollmentStartDate" className="text-right">
                    Début inscription
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "col-span-3 justify-start text-left font-normal rounded-android-tile", // Apply rounded-android-tile
                          !enrollmentStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {enrollmentStartDate ? format(enrollmentStartDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 rounded-android-tile z-[9999]"> {/* Apply rounded-android-tile */}
                      <Calendar
                        mode="single"
                        selected={enrollmentStartDate}
                        onSelect={setEnrollmentStartDate}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="enrollmentEndDate" className="text-right">
                    Fin inscription
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "col-span-3 justify-start text-left font-normal rounded-android-tile", // Apply rounded-android-tile
                          !enrollmentEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {enrollmentEndDate ? format(enrollmentEndDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 rounded-android-tile z-[9999]"> {/* Apply rounded-android-tile */}
                      <Calendar
                        mode="single"
                        selected={enrollmentEndDate}
                        onSelect={setEnrollmentEndDate}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>Enregistrer les modifications</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;