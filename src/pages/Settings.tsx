import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings as SettingsIcon, Globe, Bell, KeyRound, SunMoon, Eraser } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle"; // Import ThemeToggle
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { showSuccess } from "@/utils/toast";
import { clearAllAppData } from "@/lib/dataReset"; // Import the new utility

const Settings = () => {
  const [language, setLanguage] = useState('fr');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appNotifications, setAppNotifications] = useState(true);

  const handleSavePreferences = () => {
    // In a real app, you would save these preferences to a backend or localStorage
    console.log("Saving preferences:", { language, emailNotifications, appNotifications });
    showSuccess("Préférences enregistrées !");
  };

  const handleClearAllData = () => {
    if (window.confirm("Êtes-vous sûr de vouloir effacer TOUTES les données de l'application ? Cette action est irréversible.")) {
      clearAllAppData();
      showSuccess("Toutes les données ont été effacées ! Veuillez rafraîchir la page.");
      window.location.reload(); // Force a full page reload to re-initialize all data
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Paramètres
      </h1>
      <p className="text-lg text-muted-foreground">
        Gérez les préférences de votre compte et de l'application.
      </p>

      <Card>
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
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
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
                <SelectTrigger id="language" className="w-[180px]">
                  <SelectValue placeholder="Sélectionner une langue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  {/* Add more languages as needed */}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
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
      </Card>

      <Card>
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
          <Button variant="outline" onClick={() => showSuccess("Fonctionnalité de changement de mot de passe à implémenter.")}>
            Changer le mot de passe
          </Button>
          <Button variant="destructive" onClick={handleClearAllData} className="flex items-center gap-2">
            <Eraser className="h-4 w-4" /> Réinitialiser toutes les données
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSavePreferences}>
          Enregistrer toutes les préférences
        </Button>
      </div>
    </div>
  );
};

export default Settings;