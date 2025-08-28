import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Button, MotionButton } from "@/components/ui/button";
import { showSuccess, showError } from "@/utils/toast";
import { Profile, ALL_ROLES, Establishment } from "@/lib/dataModels";
import { updateProfile } from '@/lib/studentData';
import { supabase } from '@/integrations/supabase/client';
import InputWithStatus from '@/components/InputWithStatus';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';
import { CalendarDays, User, GraduationCap, PenTool, BriefcaseBusiness, UserRoundCog, Info, Building2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import LoadingSpinner from "@/components/LoadingSpinner";
import SimpleItemSelector from '@/components/ui/SimpleItemSelector';

// Map icon_name strings to Lucide React components (copied from AdminUserManagementPage)
const iconMap: { [key: string]: React.ElementType } = {
  User: User, GraduationCap: GraduationCap, PenTool: PenTool, BriefcaseBusiness: BriefcaseBusiness, UserRoundCog: UserRoundCog, Info: Info, Building2: Building2,
  student: GraduationCap,
  professeur: PenTool,
  tutor: User, // Using generic User for tutor for now, can be changed
  director: BriefcaseBusiness,
  deputy_director: BriefcaseBusiness,
  administrator: UserRoundCog,
};

// Helper function to get display name for roles (copied from AdminUserManagementPage)
const getRoleDisplayName = (role: Profile['role'] | 'all') => {
  switch (role) {
    case 'student': return 'Élève';
    case 'professeur': return 'Professeur';
    case 'tutor': return 'Tuteur';
    case 'director': return 'Directeur';
    case 'deputy_director': return 'Directeur Adjoint';
    case 'administrator': return 'Administrateur';
    case 'all': return 'Tous les rôles';
    default: return 'Rôle inconnu';
  }
};

interface EditUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: Profile;
  onSave: (updatedProfile: Profile) => Promise<void>; // Callback to refresh parent data
  allProfiles: Profile[]; // For username/email availability checks
  establishments: Establishment[]; // For establishment selection
  currentUserRole: Profile['role']; // Role of the user performing the edit
  currentUserEstablishmentId?: string; // Establishment of the user performing the edit
  fetchUserProfile: (userId: string) => Promise<void>; // To refresh current user's profile if their own data changes
  checkUsernameExists: (username: string, currentUserId?: string) => Promise<boolean>;
  checkEmailExists: (email: string, currentUserId?: string) => Promise<boolean>;
}

const EditUserDialog = ({
  isOpen,
  onClose,
  userToEdit,
  onSave,
  allProfiles,
  establishments,
  currentUserRole,
  currentUserEstablishmentId,
  fetchUserProfile,
  checkUsernameExists: checkUsernameExistsProp, // Renamed to avoid conflict
  checkEmailExists: checkEmailExistsProp, // Renamed to avoid conflict
}: EditUserDialogProps) => {
  const [editFirstName, setEditFirstName] = useState(userToEdit.first_name || '');
  const [editLastName, setEditLastName] = useState(userToEdit.last_name || '');
  const [editUsername, setEditUsername] = useState(userToEdit.username);
  const [editEmail, setEditEmail] = useState(userToEdit.email || '');
  const [editRole, setEditRole] = useState<Profile['role']>(userToEdit.role);
  const [editEstablishmentId, setEditEstablishmentId] = useState<string | null>(userToEdit.establishment_id || null);
  const [editEnrollmentStartDate, setEditEnrollmentStartDate] = useState<Date | undefined>(userToEdit.enrollment_start_date ? parseISO(userToEdit.enrollment_start_date) : undefined);
  const [editEnrollmentEndDate, setEditEnrollmentEndDate] = useState<Date | undefined>(userToEdit.enrollment_end_date ? parseISO(userToEdit.enrollment_end_date) : undefined);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [editUsernameAvailabilityStatus, setEditUsernameAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [editEmailAvailabilityStatus, setEditEmailAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const debounceTimeoutRefEditUsername = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimeoutRefEditEmail = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [editRoleSearchQuery, setEditRoleSearchQuery] = useState('');
  const [editEstablishmentSearchQuery, setEditEstablishmentSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && userToEdit) {
      setEditFirstName(userToEdit.first_name || '');
      setEditLastName(userToEdit.last_name || '');
      setEditUsername(userToEdit.username);
      setEditEmail(userToEdit.email || '');
      setEditRole(userToToEdit.role);
      setEditEstablishmentId(userToEdit.establishment_id || null);
      setEditEnrollmentStartDate(userToEdit.enrollment_start_date ? parseISO(userToEdit.enrollment_start_date) : undefined);
      setEditEnrollmentEndDate(userToEdit.enrollment_end_date ? parseISO(userToEdit.enrollment_end_date) : undefined);
      setIsSavingEdit(false);
      setEditUsernameAvailabilityStatus('idle');
      setEditEmailAvailabilityStatus('idle');
      setEditRoleSearchQuery('');
      setEditEstablishmentSearchQuery('');
    }
  }, [isOpen, userToEdit]);

  const validateUsername = useCallback(async (username: string, currentUserId?: string) => {
    if (username.length < 3) {
      setEditUsernameAvailabilityStatus('idle');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setEditUsernameAvailabilityStatus('idle');
      return false;
    }
    setEditUsernameAvailabilityStatus('checking');
    const isTaken = await checkUsernameExistsProp(username, currentUserId);
    if (isTaken && (!currentUserId || allProfiles.find(u => u.username === username)?.id !== currentUserId)) {
      setEditUsernameAvailabilityStatus('taken');
      return false;
    }
    setEditUsernameAvailabilityStatus('available');
    return true;
  }, [allProfiles, checkUsernameExistsProp]);

  const validateEmail = useCallback(async (email: string, currentUserId?: string) => {
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEditEmailAvailabilityStatus('idle');
      return false;
    }
    setEditEmailAvailabilityStatus('checking');
    const isTaken = await checkEmailExistsProp(email, currentUserId);
    if (isTaken && (!currentUserId || allProfiles.find(u => u.email === email)?.id !== currentUserId)) {
      setEditEmailAvailabilityStatus('taken');
      return false;
    }
    setEditEmailAvailabilityStatus('available');
    return true;
  }, [allProfiles, checkEmailExistsProp]);

  const handleEditUsernameChange = (value: string) => {
    setEditUsername(value);
    if (debounceTimeoutRefEditUsername.current) clearTimeout(debounceTimeoutRefEditUsername.current);
    if (value.trim() === '') {
      setEditUsernameAvailabilityStatus('idle');
      return;
    }
    debounceTimeoutRefEditUsername.current = setTimeout(() => {
      validateUsername(value, userToEdit.id);
    }, 500);
  };

  const handleEditEmailChange = (value: string) => {
    setEditEmail(value);
    if (debounceTimeoutRefEditEmail.current) clearTimeout(debounceTimeoutRefEditEmail.current);
    if (value.trim() === '') {
      setEditEmailAvailabilityStatus('idle');
      return;
    }
    debounceTimeoutRefEditEmail.current = setTimeout(() => {
      validateEmail(value, userToEdit.id);
    }, 500);
  };

  const handleSave = async () => {
    if (!userToEdit) return;
    if (!editFirstName.trim() || !editLastName.trim() || !editUsername.trim() || !editEmail.trim()) {
      showError("Tous les champs sont requis.");
      return;
    }
    if (editUsernameAvailabilityStatus === 'taken' || editEmailAvailabilityStatus === 'taken') {
      showError("Le nom d'utilisateur ou l'email est déjà pris.");
      return;
    }
    if (editUsernameAvailabilityStatus === 'checking' || editEmailAvailabilityStatus === 'checking') {
      showError("Veuillez attendre la vérification de la disponibilité du nom d'utilisateur et de l'email.");
      return;
    }
    if (editRole === 'student' && (!editEnrollmentStartDate || !editEnrollmentEndDate)) {
      showError("Les dates d'inscription sont requises pour les élèves.");
      return;
    }
    if (editEnrollmentStartDate && editEnrollmentEndDate && editEnrollmentStartDate >= editEnrollmentEndDate) {
      showError("La date de fin d'inscription doit être postérieure à la date de début.");
      return;
    }
    if (editRole !== 'administrator' && !editEstablishmentId) {
      showError("Un établissement est requis pour ce rôle.");
      return;
    }

    // Role-based validation for editing
    if (currentUserRole !== 'administrator') {
      if (userToEdit.id === currentUserProfile?.id) { // User editing their own profile
        // Allow editing first_name, last_name, username, email, enrollment dates
        // Do not allow changing role or establishment_id
        if (editRole !== userToEdit.role) {
          showError("Vous ne pouvez pas changer votre propre rôle.");
          return;
        }
        if (editEstablishmentId !== userToEdit.establishment_id) {
          showError("Vous ne pouvez pas changer votre propre établissement.");
          return;
        }
      } else { // User editing another user's profile (e.g., director editing a professor)
        // Directors/Deputy Directors can edit professors, tutors, students in their establishment
        // Professors/Tutors can edit students in their establishment
        const isAllowedRoleChange = (currentUserRole === 'director' || currentUserRole === 'deputy_director') && ['professeur', 'tutor', 'student'].includes(editRole);
        const isAllowedRoleChangeProfTutor = (currentUserRole === 'professeur' || currentUserRole === 'tutor') && editRole === 'student';

        if (!isAllowedRoleChange && !isAllowedRoleChangeProfTutor) {
          showError(`Votre rôle (${getRoleDisplayName(currentUserRole)}) ne vous permet pas de modifier le rôle de cet utilisateur en '${getRoleDisplayName(editRole)}'.`);
          return;
        }
        if (editEstablishmentId !== userToEdit.establishment_id && currentUserRole !== 'administrator') {
          showError("Vous ne pouvez modifier l'établissement que des utilisateurs de votre établissement.");
          return;
        }
        if (userToEdit.establishment_id !== currentUserEstablishmentId && currentUserRole !== 'administrator') {
          showError("Vous ne pouvez modifier que les utilisateurs de votre établissement.");
          return;
        }
      }
    }

    setIsSavingEdit(true);
    try {
      const updatedProfileData: Partial<Profile> = {
        id: userToEdit.id,
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        username: editUsername.trim(),
        email: editEmail.trim(),
        role: editRole,
        establishment_id: editEstablishmentId,
        enrollment_start_date: editEnrollmentStartDate ? editEnrollmentStartDate.toISOString().split('T')[0] : undefined,
        enrollment_end_date: editEnrollmentEndDate ? editEnrollmentEndDate.toISOString().split('T')[0] : undefined,
      };
      const savedProfile = await updateProfile(updatedProfileData);

      // Update auth.users email/role/establishment if changed
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser && (editEmail.trim() !== userToEdit.email || editEstablishmentId !== userToEdit.establishment_id || editRole !== userToEdit.role)) {
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(userToEdit.id, {
          email: editEmail.trim(),
          user_metadata: {
            ...userToEdit.user_metadata, // Keep existing metadata
            email: editEmail.trim(),
            establishment_id: editEstablishmentId,
            role: editRole,
          }
        });
        if (authUpdateError) {
          showError(`Erreur lors de la mise à jour de l'email/rôle/établissement d'authentification: ${authUpdateError.message}`);
          return;
        }
      }

      showSuccess("Utilisateur mis à jour avec succès !");
      await onSave(savedProfile!); // Pass the updated profile back to the parent
      if (userToEdit.id === authUser?.id) { // If current user's own profile was edited
        await fetchUserProfile(userToEdit.id); // Re-fetch current user's profile to update context
      }
      onClose();
    } catch (error: any) {
      console.error("Error saving user edit:", error);
      showError(`Erreur lors de la sauvegarde des modifications: ${error.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const rolesOptions = ALL_ROLES.filter(role => {
    if (currentUserRole === 'administrator') return true;
    if ((currentUserRole === 'director' || currentUserRole === 'deputy_director') && ['professeur', 'tutor', 'student'].includes(role)) return true;
    if ((currentUserRole === 'professeur' || currentUserRole === 'tutor') && role === 'student') return true;
    return false;
  }).map(role => ({
    id: role,
    label: getRoleDisplayName(role),
    icon_name: iconMap[role] ? role : 'User',
  }));

  const establishmentsOptions = establishments.filter(est =>
    currentUserRole === 'administrator' || est.id === currentUserEstablishmentId
  ).map(est => ({
    id: est.id,
    label: est.name,
    icon_name: 'Building2',
    description: est.address,
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] backdrop-blur-lg bg-background/80 rounded-android-tile z-[1000]">
        <div className="flex flex-col">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de l'utilisateur.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 flex-grow">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-first-name" className="text-right">
                Prénom
              </Label>
              <Input
                id="edit-first-name"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-last-name" className="text-right">
                Nom
              </Label>
              <Input
                id="edit-last-name"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-username" className="text-right">
                Nom d'utilisateur
              </Label>
              <InputWithStatus
                id="edit-username"
                value={editUsername}
                onChange={(e) => handleEditUsernameChange(e.target.value)}
                status={editUsernameAvailabilityStatus}
                errorMessage={editUsernameAvailabilityStatus === 'taken' ? "Nom d'utilisateur déjà pris" : undefined}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <InputWithStatus
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => handleEditEmailChange(e.target.value)}
                status={editEmailAvailabilityStatus}
                errorMessage={editEmailAvailabilityStatus === 'taken' ? "Email déjà enregistré" : undefined}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">
                Rôle
              </Label>
              <SimpleItemSelector
                id="edit-role"
                options={rolesOptions}
                value={editRole}
                onValueChange={(value) => setEditRole(value as Profile['role'])}
                searchQuery={editRoleSearchQuery}
                onSearchQueryChange={setEditRoleSearchQuery}
                placeholder="Sélectionner un rôle"
                emptyMessage="Aucun rôle trouvé."
                iconMap={iconMap}
                disabled={currentUserRole !== 'administrator' && userToEdit.id === currentUserProfile?.id} // Disable if not admin and editing self
              />
            </div>
            {editRole !== 'administrator' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-establishment" className="text-right">
                  Établissement
                </Label>
                <SimpleItemSelector
                  id="edit-establishment"
                  options={establishmentsOptions}
                  value={editEstablishmentId}
                  onValueChange={(value) => setEditEstablishmentId(value)}
                  searchQuery={editEstablishmentSearchQuery}
                  onSearchQueryChange={setEditEstablishmentSearchQuery}
                  placeholder="Sélectionner un établissement"
                  emptyMessage="Aucun établissement trouvé."
                  iconMap={iconMap}
                  disabled={currentUserRole !== 'administrator' && userToEdit.id === currentUserProfile?.id} // Disable if not admin and editing self
                />
              </div>
            )}
            {editRole === 'student' && (
              <>
                <div>
                  <Label htmlFor="edit-enrollment-start-date" className="text-sm font-medium mb-2 block">Date de début d'inscription</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <MotionButton
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal rounded-android-tile",
                          !editEnrollmentStartDate && "text-muted-foreground"
                        )}
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {editEnrollmentStartDate ? format(editEnrollmentStartDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                      </MotionButton>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 rounded-android-tile z-[9999]">
                      <Calendar
                        mode="single"
                        selected={editEnrollmentStartDate}
                        onSelect={setEditEnrollmentStartDate}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="edit-enrollment-end-date" className="text-sm font-medium mb-2 block">Date de fin d'inscription</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <MotionButton
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal rounded-android-tile",
                          !editEnrollmentEndDate && "text-muted-foreground"
                        )}
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {editEnrollmentEndDate ? format(editEnrollmentEndDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                      </MotionButton>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 rounded-android-tile z-[9999]">
                      <Calendar
                        mode="single"
                        selected={editEnrollmentEndDate}
                        onSelect={setEditEnrollmentEndDate}
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
            <MotionButton onClick={handleSave} disabled={isSavingEdit || editUsernameAvailabilityStatus === 'checking' || editEmailAvailabilityStatus === 'checking' || (editRole === 'student' && (!editEnrollmentStartDate || !editEnrollmentEndDate)) || (editRole !== 'administrator' && !editEstablishmentId)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              {isSavingEdit ? <LoadingSpinner iconClassName="h-4 w-4 mr-2" /> : "Enregistrer les modifications"}
            </MotionButton>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;