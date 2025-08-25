import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { showSuccess, showError } from "@/utils/toast";
import { Lock, Database, UserPlus, Eraser, Code, Loader2, ChevronDown, ChevronUp, UserRoundPlus, LayoutList, RefreshCw } from "lucide-react"; // Added RefreshCw icon
import { supabase } from "@/integrations/supabase/client";
import DataModelModal from './DataModelModal';
import { clearAllAppData } from '@/lib/dataReset';
import InputWithStatus from './InputWithStatus';
import { checkUsernameExists, checkEmailExists } from '@/lib/studentData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Removed loadEstablishments import
import { Establishment, Profile } from '@/lib/dataModels'; // Import Establishment type, Profile
import { bootstrapDefaultNavItemsForRole } from '@/lib/navItems'; // Import bootstrapDefaultNavItemsForRole
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"; // Import Collapsible components
import { useRole } from '@/contexts/RoleContext'; // Import useRole to get fetchUserProfile

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ADMIN_PASSWORD = "Mehkac95!"; // Password for admin access

// All possible roles for selection (re-defined here for AdminModal scope)
const allRoles: Profile['role'][] = ['student', 'professeur', 'tutor', 'administrator', 'director', 'deputy_director'];

const AdminModal = ({ isOpen, onClose }: AdminModalProps) => {
  const isMobile = useIsMobile();
  const { currentUserProfile, fetchUserProfile } = useRole(); // Get fetchUserProfile from useRole
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDataModelModalOpen, setIsDataModelModalOpen] = useState(false);
  const [showCreateAdminForm, setShowCreateAdminForm] = useState(false);

  // State for initial admin creation form
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const [usernameAvailabilityStatus, setUsernameAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailAvailabilityStatus, setEmailAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const debounceTimeoutRefUsername = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimeoutRefEmail = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New states for bootstrapping role navigation
  const [roleToBootstrap, setRoleToBootstrap] = useState<Profile['role'] | 'none'>('none');
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isBootstrapSectionOpen, setIsBootstrapSectionOpen] = useState(false);


  useEffect(() => {
    // Clear authentication state when modal closes
    if (!isOpen) {
      setIsAuthenticated(false);
      setPassword('');
      setShowCreateAdminForm(false);
      // Reset new admin form fields
      setAdminFirstName('');
      setAdminLastName('');
      setAdminUsername('');
      setAdminEmail('');
      setAdminPassword('');
      setUsernameAvailabilityStatus('idle');
      setEmailAvailabilityStatus('idle');
      // Reset bootstrap states
      setRoleToBootstrap('none');
      setIsBootstrapping(false);
      setIsBootstrapSectionOpen(false);
    }
  }, [isOpen]);


  const handleAuthenticate = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      showSuccess("Accès administrateur accordé !");
    } else {
      showError("Mot de passe incorrect.");
      setPassword('');
    }
  };

  const handleClearAllData = async () => {
    if (window.confirm("Êtes-vous ABSOLUMENT SÛR de vouloir effacer TOUTES les données de l'application ? Cette action est irréversible et supprimera tous les utilisateurs, cours, notes, etc.")) {
      try {
        await clearAllAppData();
        showSuccess("Toutes les données ont été effacées ! L'application va se recharger.");
        window.location.reload();
      } catch (error: any) {
        console.error("Error clearing all app data:", error);
        showError(`Erreur lors de l'effacement des données: ${error.message}`);
      }
    }
  };

  // Admin creation form validation and submission
  const validateUsername = useCallback(async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailabilityStatus('idle');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameAvailabilityStatus('idle');
      return false;
    }
    setUsernameAvailabilityStatus('checking');
    const isTaken = await checkUsernameExists(username);
    setUsernameAvailabilityStatus(isTaken ? 'taken' : 'available');
    return !isTaken;
  }, []);

  const validateEmail = useCallback(async (email: string) => {
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailAvailabilityStatus('idle');
      return false;
    }
    setEmailAvailabilityStatus('checking');
    const isTaken = await checkEmailExists(email);
    setEmailAvailabilityStatus(isTaken ? 'taken' : 'available');
    return !isTaken;
  }, []);

  const handleAdminUsernameChange = (value: string) => {
    setAdminUsername(value);
    if (debounceTimeoutRefUsername.current) clearTimeout(debounceTimeoutRefUsername.current);
    if (value.trim() === '') {
      setUsernameAvailabilityStatus('idle');
      return;
    }
    debounceTimeoutRefUsername.current = setTimeout(() => {
      validateUsername(value);
    }, 500);
  };

  const handleAdminEmailChange = (value: string) => {
    setAdminEmail(value);
    if (debounceTimeoutRefEmail.current) clearTimeout(debounceTimeoutRefEmail.current);
    if (value.trim() === '') {
      setEmailAvailabilityStatus('idle');
      return;
    }
    debounceTimeoutRefEmail.current = setTimeout(() => {
      validateEmail(value);
    }, 500);
  };

  const handleCreateInitialAdmin = async () => {
    if (!adminFirstName.trim() || !adminLastName.trim() || !adminUsername.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      showError("Tous les champs sont requis pour créer l'administrateur.");
      return;
    }
    if (adminPassword.trim().length < 6) {
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

    setIsCreatingAdmin(true);
    try {
      const { data, error } = await supabase.functions.invoke('bootstrap-admin', {
        body: {
          email: adminEmail.trim(),
          password: adminPassword.trim(),
          first_name: adminFirstName.trim(),
          last_name: adminLastName.trim(),
          username: adminUsername.trim(),
        },
      });

      if (error) {
        console.error("Error creating initial admin via Edge Function:", error);
        showError(`Erreur lors de la création de l'administrateur: ${error.message}`);
        return;
      }
      
      showSuccess(`Administrateur ${adminFirstName} ${adminLastName} créé avec succès !`);
      // After creating the admin, ensure their default navigation items are set up
      console.log("[AdminModal] Calling bootstrapDefaultNavItemsForRole for administrator."); // Add this log
      await bootstrapDefaultNavItemsForRole('administrator'); // Call the new client-side function
      showSuccess("Navigation administrateur par défaut configurée !");

      setAdminFirstName('');
      setAdminLastName('');
      setAdminUsername('');
      setAdminEmail('');
      setAdminPassword('');
      setUsernameAvailabilityStatus('idle');
      setEmailAvailabilityStatus('idle');
      setShowCreateAdminForm(false);
      onClose();
    } catch (error: any) {
      console.error("Unexpected error creating initial admin:", error);
      showError(`Une erreur inattendue est survenue: ${error.message}`);
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleBootstrapRoleNav = async () => {
    if (roleToBootstrap === 'none') {
      showError("Veuillez sélectionner un rôle à initialiser.");
      return;
    }
    if (window.confirm(`Êtes-vous sûr de vouloir initialiser la navigation par défaut pour le rôle '${roleToBootstrap}' ? Cela écrasera toutes les configurations existantes pour ce rôle.`)) {
      setIsBootstrapping(true);
      try {
        await bootstrapDefaultNavItemsForRole(roleToBootstrap as Profile['role']);
        showSuccess(`Navigation par défaut initialisée pour le rôle '${roleToBootstrap}' !`);
        
        // Force re-fetch of user profile and nav items if the current user's role was bootstrapped
        if (currentUserProfile && currentUserProfile.role === roleToBootstrap) {
          await fetchUserProfile(currentUserProfile.id);
        }
        
        setRoleToBootstrap('none');
        setIsBootstrapSectionOpen(false);
        onClose(); // Close modal after action
        // No need for window.location.reload() if fetchUserProfile handles it
      } catch (error: any) {
        console.error("Error bootstrapping role navigation defaults:", error);
        showError(`Erreur lors de l'initialisation de la navigation: ${error.message}`);
      } finally {
        setIsBootstrapping(false);
      }
    }
  };

  const renderContent = (Wrapper: typeof DialogContent | typeof DrawerContent, Header: typeof DialogHeader | typeof DrawerHeader, Title: typeof DialogTitle | typeof DrawerTitle, Description: typeof DialogDescription | typeof DrawerDescription) => (
    <Wrapper className="w-full max-w-md p-6 backdrop-blur-lg bg-background/80">
      <Header className="mb-4 text-center">
        <Title className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès Administrateur
        </Title>
        <Description className="text-center">
          {isAuthenticated ? "Actions d'administration disponibles." : "Entrez le mot de passe administrateur pour accéder."}
        </Description>
      </Header>
      <div className="space-y-4">
        {!isAuthenticated ? (
          <>
            <Label htmlFor="admin-password">Mot de passe administrateur</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAuthenticate()}
              placeholder="Mot de passe"
            />
            <Button onClick={handleAuthenticate} className="w-full">
              <Lock className="h-4 w-4 mr-2" /> Accéder
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setIsDataModelModalOpen(true)} className="w-full" variant="outline">
              <Code className="h-4 w-4 mr-2" /> Voir le modèle de données
            </Button>
            
            <Button 
              onClick={() => setShowCreateAdminForm(prev => !prev)} 
              className="w-full justify-between" 
              variant="outline"
            >
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> Créer un administrateur initial
              </div>
              {showCreateAdminForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showCreateAdminForm && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/20">
                <p className="text-sm text-muted-foreground">
                  Utilisez ceci si la base de données est vide ou si vous avez perdu l'accès administrateur.
                </p>
                <Input
                  placeholder="Prénom"
                  value={adminFirstName}
                  onChange={(e) => setAdminFirstName(e.target.value)}
                />
                <Input
                  placeholder="Nom"
                  value={adminLastName}
                  onChange={(e) => setAdminLastName(e.target.value)}
                />
                <InputWithStatus
                  placeholder="Nom d'utilisateur"
                  value={adminUsername}
                  onChange={(e) => handleAdminUsernameChange(e.target.value)}
                  status={usernameAvailabilityStatus}
                  errorMessage={usernameAvailabilityStatus === 'taken' ? "Nom d'utilisateur déjà pris" : undefined}
                />
                <InputWithStatus
                  type="email"
                  placeholder="Email"
                  value={adminEmail}
                  onChange={(e) => handleAdminEmailChange(e.target.value)}
                  status={emailAvailabilityStatus}
                  errorMessage={emailAvailabilityStatus === 'taken' ? "Email déjà enregistré" : undefined}
                />
                <Input
                  type="password"
                  placeholder="Mot de passe"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
                <Button onClick={handleCreateInitialAdmin} className="w-full" disabled={isCreatingAdmin || usernameAvailabilityStatus === 'checking' || emailAvailabilityStatus === 'checking'}>
                  {isCreatingAdmin ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />} Créer l'administrateur
                </Button>
              </div>
            )}

            <Collapsible open={isBootstrapSectionOpen} onOpenChange={setIsBootstrapSectionOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" /> Initialiser Navigation par Rôle
                  </div>
                  {isBootstrapSectionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 p-4 border rounded-md bg-muted/20">
                <p className="text-sm text-muted-foreground">
                  Sélectionnez un rôle pour initialiser ses éléments de navigation par défaut. Cela écrasera les configurations existantes pour ce rôle.
                </p>
                <div>
                  <Label htmlFor="role-to-bootstrap">Rôle</Label>
                  <Select value={roleToBootstrap} onValueChange={(value: Profile['role'] | 'none') => setRoleToBootstrap(value)}>
                    <SelectTrigger id="role-to-bootstrap">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-lg bg-background/80">
                      <SelectItem value="none" disabled>Sélectionner un rôle...</SelectItem>
                      {allRoles.map(role => (
                        <SelectItem key={role} value={role}>
                          {role === 'student' ? 'Élève' :
                           role === 'professeur' ? 'Professeur' :
                           role === 'tutor' ? 'Tuteur' :
                           role === 'director' ? 'Directeur' :
                           role === 'deputy_director' ? 'Directeur Adjoint' :
                           'Administrateur'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleBootstrapRoleNav} className="w-full" disabled={isBootstrapping || roleToBootstrap === 'none'}>
                  {isBootstrapping ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />} Initialiser la navigation
                </Button>
              </CollapsibleContent>
            </Collapsible>

            <Button onClick={handleClearAllData} className="w-full" variant="destructive">
              <Eraser className="h-4 w-4 mr-2" /> Réinitialiser toutes les données
            </Button>

            <Button onClick={onClose} className="w-full" variant="secondary">
              Fermer
            </Button>
          </>
        )}
      </div>
      <DataModelModal isOpen={isDataModelModalOpen} onClose={() => setIsDataModelModalOpen(false)} />
    </Wrapper>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        {renderContent(DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription)}
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {renderContent(DialogContent, DialogHeader, DialogTitle, DialogDescription)}
    </Dialog>
  );
};

export default AdminModal;