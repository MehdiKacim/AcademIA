import React, { useState } from 'react';
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
import { Lock, Database, UserPlus, Eraser, Code, Users } from "lucide-react"; // Import Users icon
import { supabase } from "@/integrations/supabase/client";
import DataModelModal from './DataModelModal'; // Import DataModelModal
import { clearAllAppData } from '@/lib/dataReset'; // Import clearAllAppData

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAdminUserManagement: () => void; // New prop for navigation
}

const ADMIN_PASSWORD = "Mehkac95!"; // Password for admin access

const AdminModal = ({ isOpen, onClose, onNavigateToAdminUserManagement }: AdminModalProps) => {
  const isMobile = useIsMobile();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDataModelModalOpen, setIsDataModelModalOpen] = useState(false); // State for DataModelModal

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
        window.location.reload(); // Force a full page reload to re-initialize all data
      } catch (error: any) {
        console.error("Error clearing all app data:", error);
        showError(`Erreur lors de l'effacement des données: ${error.message}`);
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
            <Button onClick={() => { onNavigateToAdminUserManagement(); onClose(); }} className="w-full" variant="outline">
              <Users className="h-4 w-4 mr-2" /> Gérer les utilisateurs
            </Button>
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