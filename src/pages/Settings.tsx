import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, MotionCard } from "@/components/ui/card"; // Import MotionCard
import { Settings as SettingsIcon, Globe, Bell, KeyRound, SunMoon, Eraser, Code, Info, LayoutList, Building2 } from "lucide-react"; // Import LayoutList icon
import { ThemeToggle } from "@/components/theme-toggle";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button, MotionButton } from "@/components/ui/button"; // Import MotionButton
import { showSuccess } from "@/utils/toast";
import { clearAllAppData } from "@/lib/dataReset";
import { Link, useOutletContext, useNavigate } from 'react-router-dom'; // Import useNavigate
// Removed AboutModal import
import ChangePasswordDialog from "@/components/ChangePasswordDialog";
import { useRole } from '@/contexts/RoleContext'; // Import useRole
import { Profile } from '@/lib/dataModels'; // Import Profile type

interface SettingsPageOutletContext {
  onInitiateThemeChange: (newTheme: Profile['theme']) => void;
}

const Settings = () => {
  const { currentRole } = useRole(); // Get currentRole
  const { onInitiateThemeChange } = useOutletContext<SettingsPageOutletContext>(); // Get onInitiateThemeChange from context
  const navigate = useNavigate(); // Initialize useNavigate
  const [language, setLanguage] = useState('fr');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appNotifications, setAppNotifications] = useState(true);
  // Removed isAboutModalOpen state
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);

  const handleSavePreferences = () => {
    // console.log("Saving preferences:", { language, emailNotifications, appNotifications }); // Removed log
    showSuccess("Préférences enregistrées !");
  };

  const handleClearAllData = () => {
    if (window.confirm("Êtes-vous sûr de vouloir effacer TOUTES les données de l'application ? Cette action est irréversible.")) {
      clearAllAppData();
      showSuccess("Toutes les données ont été effacées ! Veuillez rafraîchir la page.");
      window.location.reload();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"> {/* Added responsive padding and max-width */}
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Paramètres
      </h1>
      <p className="text-lg text-muted-foreground">
        Gérez les préférences de votre compte et de l'application.
      </p>

      <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}> {/* Apply rounded-android-tile */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SunMoon className="h-6 w-6 text-primary" />
            Apparence
          </CardTitle>
          <CardDescription>
            Personnalisez l'apparence de l'application.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Label htmlFor="theme-toggle">Mode clair/sombre</Label>
          <ThemeToggle onInitiateThemeChange={onInitiateThemeChange} />
        </CardContent>
      </MotionCard>

      <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}> {/* Apply rounded-android-tile */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Préférences Générales
          </CardTitle>
          <CardDescription>
            Définissez votre langue préférée.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="language">Langue</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language" className="w-[180px] rounded-android-tile">
                  <SelectValue placeholder="Sélectionner une langue" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-lg bg-background/80 rounded-android-tile">
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </MotionCard>

      <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}> {/* Apply rounded-android-tile */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>
            Gérez comment et quand vous recevez des notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications">Notifications par email</Label>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="app-notifications">Notifications in-app</Label>
            <Switch
              id="app-notifications"
              checked={appNotifications}
              onCheckedChange={setAppNotifications}
            />
          </div>
        </CardContent>
      </MotionCard>

      <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}> {/* Apply rounded-android-tile */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-primary" />
            Paramètres du Compte
          </CardTitle>
          <CardDescription>
            Gérez les informations de sécurité de votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MotionButton variant="outline" onClick={() => setIsChangePasswordDialogOpen(true)} className="rounded-android-tile" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            Changer le mot de passe
          </MotionButton>
          <Link to="/data-model">
            <MotionButton variant="outline" className="flex items-center gap-2 rounded-android-tile" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Code className="h-4 w-4" /> Voir le modèle de données
            </MotionButton>
          </Link>
          {currentRole === 'administrator' && ( // Only show for administrators
            <>
              <Link to="/establishments">
                <MotionButton variant="outline" className="flex items-center gap-2 rounded-android-tile" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Building2 className="h-4 w-4" /> Gérer les établissements
                </MotionButton>
              </Link>
              <Link to="/admin-menu-management">
                <MotionButton variant="outline" className="flex items-center gap-2 rounded-android-tile" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <LayoutList className="h-4 w-4" /> Gérer les menus
                </MotionButton>
              </Link>
            </>
          )}
          <MotionButton variant="outline" onClick={() => navigate('/about')} className="flex items-center gap-2 rounded-android-tile" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}> {/* Navigate to /about */}
            <Info className="h-4 w-4" /> À propos
          </MotionButton>
          <MotionButton variant="destructive" onClick={handleClearAllData} className="flex items-center gap-2 rounded-android-tile" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Eraser className="h-4 w-4" /> Réinitialiser toutes les données
          </MotionButton>
        </CardContent>
      </MotionCard>

      <div className="flex justify-end">
        <MotionButton onClick={handleSavePreferences} className="rounded-android-tile" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          Enregistrer toutes les préférences
        </MotionButton>
      </div>

      {/* Removed AboutModal */}
      <ChangePasswordDialog isOpen={isChangePasswordDialogOpen} onClose={() => setIsChangePasswordDialogOpen(false)} />
    </div>
  );
};

export default Settings;