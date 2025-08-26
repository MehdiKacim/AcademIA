import React from 'react';
import { BellRing } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const NotificationsPage = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Mes Notifications
      </h1>
      <p className="text-lg text-muted-foreground">
        Retrouvez ici toutes vos alertes et informations importantes.
      </p>

      <Card className="rounded-android-tile">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-6 w-6 text-primary" />
            Aucune notification pour le moment
          </CardTitle>
          <CardDescription>
            Revenez plus tard pour voir les nouvelles alertes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Nous vous informerons des mises à jour de cours, des messages et d'autres événements importants.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;