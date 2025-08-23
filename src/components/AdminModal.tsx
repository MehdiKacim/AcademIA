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
import { Lock, Database, UserPlus, Eraser, Code, Loader2, ChevronDown, ChevronUp, UserRoundPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DataModelModal from './DataModelModal';
import { clearAllAppData } from '@/lib/dataReset';
import InputWithStatus from './InputWithStatus';
import { checkUsernameExists, checkEmailExists } from '@/lib/studentData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { loadEstablishments } from '@/lib/courseData'; // Import loadEstablishments
import { Establishment } from '@/lib/dataModels'; // Import Establishment type

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ADMIN_PASSWORD = "Mehkac95!"; // Password for admin access

const AdminModal = ({ isOpen, onClose }: AdminModalProps) => {
  const isMobile = useIsMobile();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDataModelModalOpen, setIsDataModelModalOpen] = useState(false);
  const [showCreateAdminForm, setShowCreateAdminForm] = useState(false);
  const [showCreateProfessorForm, setShowCreateProfessorForm] = useState(false);

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

  // State for professor creation form
  const [profFirstName, setProfFirstName] = useState('');
  const [profLastName, setProfLastName] = useState('');
  const [profUsername, setProfUsername] = useState('');
  const [profEmail, setProfEmail] = useState('');
  const [profPassword, setProfPassword] = useState('');
  const [profRole, setProfRole] = useState<'creator' | 'tutor'>('creator');
  const [profEstablishmentId, setProfEstablishmentId] = useState<string>(''); // New state for establishment
  const [isCreatingProfessor, setIsCreatingProfessor] = useState(false);

  const [profUsernameAvailabilityStatus, setProfUsernameAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [profEmailAvailabilityStatus, setProfEmailAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const debounceTimeoutRefProfUsername = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimeoutRefProfEmail = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [establishments, setEstablishments] = useState<Establishment[]>([]); // State to store establishments

  useEffect(() => {
    const fetchEstablishments = async () => {
      setEstablishments(await loadEstablishments());
    };
    if (isAuthenticated) {
      fetchEstablishments();
    }
  }, [isAuthenticated]);


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
  const validateUsername = useCallback(async (username: string, isProfForm: boolean = false) => {
    const setStatus = isProfForm ? setProfUsernameAvailabilityStatus : setUsernameAvailabilityStatus;
    if (username.length < 3) {
      setStatus('idle');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setStatus('idle');
      return false;
    }
    setStatus('checking');
    const isTaken = await checkUsernameExists(username);
    setStatus(isTaken ? 'taken' : 'available');
    return !isTaken;
  }, []);

  const validateEmail = useCallback(async (email: string, isProfForm: boolean = false) => {
    const setStatus = isProfForm ? setProfEmailAvailabilityStatus : setEmailAvailabilityStatus;
    if (!/\S+@\S+\.\S+/.test(email)) {
      setStatus('idle');
      return false;
    }
    setStatus('checking');
    const isTaken = await checkEmailExists(email);
    setStatus(isTaken ? 'taken' : 'available');
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

  // Professor creation form validation and submission
  const handleProfUsernameChange = (value: string) => {
    setProfUsername(value);
    if (debounceTimeoutRefProfUsername.current) clearTimeout(debounceTimeoutRefProfUsername.current);
    if (value.trim() === '') {
      setProfUsernameAvailabilityStatus('idle');
      return;
    }
    debounceTimeoutRefProfUsername.current = setTimeout(() => {
      validateUsername(value, true);
    }, 500);
  };

  const handleProfEmailChange = (value: string) => {
    setProfEmail(value);
    if (debounceTimeoutRefProfEmail.current) clearTimeout(debounceTimeoutRefProfEmail.current);
    if (value.trim() === '') {
      setProfEmailAvailabilityStatus('idle');
      return;
    }
    debounceTimeoutRefProfEmail.current = setTimeout(() => {
      validateEmail(value, true);
    }, 500);
  };

  const handleCreateProfessor = async () => {
    if (!profFirstName.trim() || !profLastName.trim() || !profUsername.trim() || !profEmail.trim() || !profPassword.trim() || !profRole || !profEstablishmentId) {
      showError("Tous les champs sont requis pour créer le professeur.");
      return;
    }
    if (profPassword.trim().length < 6) {
      showError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (profUsernameAvailabilityStatus === 'taken' || profEmailAvailabilityStatus === 'taken') {
      showError("Le nom d'utilisateur ou l'email est déjà pris.");
      return;
    }
    if (profUsernameAvailabilityStatus === 'checking' || profEmailAvailabilityStatus === 'checking') {
      showError("Veuillez attendre la vérification de la disponibilité du nom d'utilisateur et de l'email.");
      return;
    }

    setIsCreatingProfessor(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user-with-role', {
        body: {
          email: profEmail.trim(),
          password: profPassword.trim(),
          first_name: profFirstName.trim(),
          last_name: profLastName.trim(),
          username: profUsername.trim(),
          role: profRole, // Use the selected role
          establishment_id: profEstablishmentId, // Pass the selected establishment ID
        },
      });

      if (error) {
        console.error("Error creating professor via Edge Function:", error);
        showError(`Erreur lors de la création du professeur: ${error.message}`);
        return;
      }
      
      showSuccess(`${profRole === 'creator' ? 'Créateur' : 'Tuteur'} ${profFirstName} ${profLastName} créé avec succès !`);
      setProfFirstName('');
      setProfLastName('');
      setProfUsername('');
      setProfEmail('');
      setProfPassword('');
      setProfRole('creator');
      setProfEstablishmentId(''); // Clear establishment selection
      setProfUsernameAvailabilityStatus('idle');
      setProfEmailAvailabilityStatus('idle');
      setShowCreateProfessorForm(false);
    } catch (error: any) {
      console.error("Unexpected error creating professor:", error);
      showError(`Une erreur inattendue est survenue: ${error.message}`);
    } finally {
      setIsCreatingProfessor(false);
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

            <Button 
              onClick={() => setShowCreateProfessorForm(prev => !prev)} 
              className="w-full justify-between" 
              variant="outline"
            >
              <div className="flex items-center gap-2">
                <UserRoundPlus className="h-4 w-4" /> Créer un professeur (Créateur/Tuteur)
              </div>
              {showCreateProfessorForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showCreateProfessorForm && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/20">
                <p className="text-sm text-muted-foreground">
                  Créez un nouveau compte pour un créateur de contenu ou un tuteur.
                </p>
                <Input
                  placeholder="Prénom"
                  value={profFirstName}
                  onChange={(e) => setProfFirstName(e.target.value)}
                />
                <Input
                  placeholder="Nom"
                  value={profLastName}
                  onChange={(e) => setProfLastName(e.target.value)}
                />
                <InputWithStatus
                  placeholder="Nom d'utilisateur"
                  value={profUsername}
                  onChange={(e) => handleProfUsernameChange(e.target.value)}
                  status={profUsernameAvailabilityStatus}
                  errorMessage={profUsernameAvailabilityStatus === 'taken' ? "Nom d'utilisateur déjà pris" : undefined}
                />
                <InputWithStatus
                  type="email"
                  placeholder="Email"
                  value={profEmail}
                  onChange={(e) => handleProfEmailChange(e.target.value)}
                  status={profEmailAvailabilityStatus}
                  errorMessage={profEmailAvailabilityStatus === 'taken' ? "Email déjà enregistré" : undefined}
                />
                <Input
                  type="password"
                  placeholder="Mot de passe"
                  value={profPassword}
                  onChange={(e) => setProfPassword(e.target.value)}
                />
                <Select value={profRole} onValueChange={(value: 'creator' | 'tutor') => setProfRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="creator">Créateur (Professeur)</SelectItem>
                    <SelectItem value="tutor">Tuteur</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={profEstablishmentId} onValueChange={setProfEstablishmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un établissement" />
                  </SelectTrigger>
                  <SelectContent>
                    {establishments.map(est => (
                      <SelectItem key={est.id} value={est.id}>{est.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleCreateProfessor} className="w-full" disabled={isCreatingProfessor || profUsernameAvailabilityStatus === 'checking' || profEmailAvailabilityStatus === 'checking' || !profEstablishmentId}>
                  {isCreatingProfessor ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserRoundPlus className="h-4 w-4 mr-2" />} Créer le professeur
                </Button>
              </div>
            )}

            <Button onClick={handleClearAllData} className="w-full" variant="destructive">
              <Eraser className="h-4 w-4 mr-2" /> Effacer toutes les données
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