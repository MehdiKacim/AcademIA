import React from 'react';
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { ArrowLeft } from 'lucide-react';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToLogin }) => {
  return (
    <div className="space-y-4 text-center">
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