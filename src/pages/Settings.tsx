import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

const Settings = () => {
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
            <SettingsIcon className="h-6 w-6 text-primary" />
            Préférences Générales
          </CardTitle>
          <CardDescription>
            Personnalisez votre expérience utilisateur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Cette section est en cours de développement. Revenez bientôt pour plus d'options !
          </p>
          {/* Future settings options could go here, e.g., language, notifications, privacy */}
        </CardContent>
      </Card>

      {/* You can add more setting cards here, e.g., for notifications, security, etc. */}
    </div>
  );
};

export default Settings;