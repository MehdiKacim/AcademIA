import React from 'react';
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { ArrowLeft, UserPlus } from 'lucide-react';

interface SignUpInfoProps {
  onSwitchToLogin: () => void;
}

export const SignUpInfo: React.FC<SignUpInfoProps> = ({ onSwitchToLogin }) => {
  return (
    <div className="space-y-4 text-center">
      <UserPlus className="h-16 w-16 text-primary mx-auto mb-4" />
      <CardTitle className="text-2xl font-bold">Création de compte</CardTitle>
      <CardDescription className="text-lg font-semibold text-primary">
        La création de compte est actuellement gérée par les administrateurs.
      </CardDescription>
      <p className="text-muted-foreground">
        Veuillez contacter un administrateur pour obtenir un compte.
      </p>
      <Button type="button" className="w-full" onClick={onSwitchToLogin}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Retour à la connexion
      </Button>
    </div>
  );
};