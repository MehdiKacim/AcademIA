import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, UserPlus, User, Edit, Trash2, Loader2, Check, XCircle, Mail, Search } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useRole } from '@/contexts/RoleContext';
import { getAllProfiles, checkUsernameExists, checkEmailExists, deleteProfile, updateProfile } from '@/lib/studentData';
import { Profile } from '@/lib/dataModels';
import { supabase } from '@/integrations/supabase/client';
import InputWithStatus from '@/components/InputWithStatus';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const AdminUserManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const navigate = useNavigate();

  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'creator' | 'tutor' | 'student' | 'administrator'>('creator'); // Admin can now create administrators
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const [usernameAvailabilityStatus, setUsernameAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailAvailabilityStatus, setEmailAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const debounceTimeoutRefUsername = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimeoutRefEmail = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Profile | null>(null);
  const [editedFirstName, setEditedFirstName] = useState('');
  const [editedLastName, setEditedLastName] = useState('');
  const [editedUsername, setEditedUsername] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedRole, setEditedRole] = useState<'student' | 'creator' | 'tutor' | 'administrator'>('student');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setAllUsers(await getAllProfiles());
    };
    fetchUsers();
  }, [currentUserProfile]);

  const validateUsername = useCallback(async (username: string, currentUserId?: string) => {
    if (username.length < 3) return false;
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return false;
    setUsernameAvailabilityStatus('checking');
    const isTaken = await checkUsernameExists(username);
    if (isTaken && (!currentUserId || allUsers.find(u => u.username === username)?.id !== currentUserId)) {
      setUsernameAvailabilityStatus('taken');
      return false;
    }
    setUsernameAvailabilityStatus('available');
    return true;
  }, [allUsers]);

  const validateEmail = useCallback(async (email: string, currentUserId?: string) => {
    if (!/\S+@\S+\.\S+/.test(email)) return false;
    setEmailAvailabilityStatus('checking');
    const isTaken = await checkEmailExists(email);
    if (isTaken && (!currentUserId || allUsers.find(u => u.email === email)?.id !== currentUserId)) {
      setEmailAvailabilityStatus('taken');
      return false;
    }
    setEmailAvailabilityStatus('available');
    return true;
  }, [allUsers]);

  const handleUsernameChange = (value: string, currentUserId?: string) => {
    setNewUsername(value);
    if (debounceTimeoutRefUsername.current) clearTimeout(debounceTimeoutRefUsername.current);
    if (value.trim() === '') {
      setUsernameAvailabilityStatus('idle');
      return;
    }
    debounceTimeoutRefUsername.current = setTimeout(() => {
      validateUsername(value, currentUserId);
    }, 500);
  };

  const handleEmailChange = (value: string, currentUserId?: string) => {
    setNewEmail(value);
    if (debounceTimeoutRefEmail.current) clearTimeout(debounceTimeoutRefEmail.current);
    if (value.trim() === '') {
      setEmailAvailabilityStatus('idle');
      return;
    }
    debounceTimeoutRefEmail.current = setTimeout(() => {
      validateEmail(value, currentUserId);
    }, 500);
  };

  const handleCreateUser = async () => {
    if (!newUserFirstName.trim() || !newUserLastName.trim() || !newUsername.trim() || !newEmail.trim() || !newPassword.trim() || !newUserRole) {
      showError("Tous les champs sont requis.");
      return;
    }
    if (newPassword.trim().length < 6) {
      showError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (usernameAvailabilityStatus === 'taken' || emailAvailabilityStatus === 'taken') {
      showError("Le nom d'utilisateur ou l'email est déjà pris.");
      return;
    }
    if (usernameAvailabilityStatus === 'checking' || emailAvailabilityStatus === 'checking') {
      showError("Veuillez attendre la vérification de la disponibilité du nom d'utilisateur et de l'email.");
      return;
    }

    setIsCreatingUser(true);
    try {
      // Call Supabase Edge Function to create user with service role
      const { data, error } = await supabase.functions.invoke('create-user-with-role', {
        body: {
          email: newEmail.trim(),
          password: newPassword.trim(),
          first_name: newUserFirstName.trim(),
          last_name: newUserLastName.trim(),
          username: newUsername.trim(),
          role: newUserRole,
        },
      });

      if (error) {
        console.error("Error creating user via Edge Function:", error);
        showError(`Erreur lors de la création de l'utilisateur: ${error.message}`);
        return;
      }
      
      showSuccess(`Utilisateur ${newUserFirstName} ${newUserLastName} (${newUserRole}) créé avec succès !`);
      setNewUserFirstName('');
      setNewUserLastName('');
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewUserRole('creator'); // Reset to default
      setUsernameAvailabilityStatus('idle');
      setEmailAvailabilityStatus('idle');
      setAllUsers(await getAllProfiles()); // Refresh user list
    } catch (error: any) {
      console.error("Unexpected error creating user:", error);
      showError(`Une erreur inattendue est survenue: ${error.message}`);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleEditUser = (user: Profile) => {
    setUserToEdit(user);
    setEditedFirstName(user.first_name);
    setEditedLastName(user.last_name);
    setEditedUsername(user.username);
    setEditedEmail(user.email);
    setEditedRole(user.role);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!userToEdit) return;
    if (!editedFirstName.trim() || !editedLastName.trim() || !editedUsername.trim() || !editedEmail.trim() || !editedRole) {
      showError("Tous les champs sont requis.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const updatedProfileData: Partial<Profile> = {
        id: userToEdit.id,
        first_name: editedFirstName.trim(),
        last_name: editedLastName.trim(),
        username: editedUsername.trim(),
        email: editedEmail.trim(),
        role: editedRole,
      };
      const savedProfile = await updateProfile(updatedProfileData);

      if (savedProfile) {
        showSuccess("Profil utilisateur mis à jour avec succès !");
        setAllUsers(await getAllProfiles()); // Refresh user list
        setIsEditDialogOpen(false);
      } else {
        showError("Échec de la mise à jour du profil utilisateur.");
      }
    } catch (error: any) {
      console.error("Error saving user profile:", error);
      showError(`Erreur lors de la sauvegarde du profil: ${error.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) {
      try {
        // Delete user from auth.users (this will cascade delete from profiles)
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) {
          console.error("Error deleting user from auth.users:", authError);
          showError(`Erreur lors de la suppression du compte utilisateur: ${authError.message}`);
          return;
        }
        
        // The profile and enrollments should be cascade deleted by DB foreign keys
        // Re-fetch all data to update the UI
        setAllUsers(await getAllProfiles()); // Refresh user list
        showSuccess("Utilisateur supprimé avec succès !");
      } catch (error: any) {
        console.error("Error deleting user:", error);
        showError(`Erreur lors de la suppression de l'utilisateur: ${error.message}`);
      }
    }
  };

  const handleSendMessageToUser = (userId: string) => {
    navigate(`/messages?contactId=${userId}`);
  };

  const filteredUsers = userSearchQuery.trim() === ''
    ? allUsers
    : allUsers.filter(user =>
        user.first_name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.last_name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
      );

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
        Gestion des Utilisateurs (Admin)
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Créez et gérez les comptes des professeurs, des tuteurs et des élèves.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" /> Créer un nouvel utilisateur
          </CardTitle>
          <CardDescription>Créez des comptes pour les professeurs, les tuteurs ou les élèves.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Prénom"
              value={newUserFirstName}
              onChange={(e) => setNewUserFirstName(e.target.value)}
            />
            <Input
              placeholder="Nom"
              value={newUserLastName}
              onChange={(e) => setNewUserLastName(e.target.value)}
            />
            <InputWithStatus
              placeholder="Nom d'utilisateur"
              value={newUsername}
              onChange={(e) => handleUsernameChange(e.target.value)}
              status={usernameAvailabilityStatus}
              errorMessage={usernameAvailabilityStatus === 'taken' ? "Nom d'utilisateur déjà pris" : undefined}
            />
            <InputWithStatus
              type="email"
              placeholder="Email"
              value={newEmail}
              onChange={(e) => handleEmailChange(e.target.value)}
              status={emailAvailabilityStatus}
              errorMessage={emailAvailabilityStatus === 'taken' ? "Email déjà enregistré" : undefined}
            />
            <Input
              type="password"
              placeholder="Mot de passe"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Select value={newUserRole} onValueChange={(value: 'creator' | 'tutor' | 'student' | 'administrator') => setNewUserRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="administrator">Administrateur</SelectItem> {/* Added Administrator role */}
                <SelectItem value="creator">Créateur (Professeur)</SelectItem>
                <SelectItem value="tutor">Tuteur</SelectItem>
                <SelectItem value="student">Élève</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreateUser} disabled={isCreatingUser || usernameAvailabilityStatus === 'checking' || emailAvailabilityStatus === 'checking'}>
            {isCreatingUser ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />} Créer l'utilisateur
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6 text-primary" /> Liste de tous les utilisateurs
          </CardTitle>
          <CardDescription>Visualisez, modifiez ou supprimez les utilisateurs existants.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email ou @username..."
              className="pl-10"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            {filteredUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucun utilisateur trouvé.</p>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex-grow">
                    <p className="font-medium">{user.first_name} {user.last_name} <span className="text-sm text-muted-foreground">(@{user.username})</span></p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Rôle: <span className="font-semibold">{user.role}</span></p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                    <Button variant="outline" size="sm" onClick={() => handleSendMessageToUser(user.id)}>
                      <Mail className="h-4 w-4 mr-1" /> Message
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>
                      <Trash2 className="h-4 w-4" /> Supprimer
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {userToEdit && (
        <Popover open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <PopoverContent className="w-full max-w-md p-4">
            <CardHeader className="pb-2">
              <CardTitle>Modifier l'utilisateur</CardTitle>
              <CardDescription>Mettez à jour les informations de l'utilisateur.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Prénom"
                value={editedFirstName}
                onChange={(e) => setEditedFirstName(e.target.value)}
              />
              <Input
                placeholder="Nom"
                value={editedLastName}
                onChange={(e) => setEditedLastName(e.target.value)}
              />
              <Input
                placeholder="Nom d'utilisateur"
                value={editedUsername}
                onChange={(e) => setEditedUsername(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Email"
                value={editedEmail}
                onChange={(e) => setEditedEmail(e.target.value)}
              />
              <Select value={editedRole} onValueChange={(value: 'student' | 'creator' | 'tutor' | 'administrator') => setEditedRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Élève</SelectItem>
                  <SelectItem value="creator">Créateur (Professeur)</SelectItem>
                  <SelectItem value="tutor">Tuteur</SelectItem>
                  <SelectItem value="administrator">Administrateur</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
                  {isSavingEdit ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Enregistrer"}
                </Button>
              </div>
            </CardContent>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default AdminUserManagementPage;