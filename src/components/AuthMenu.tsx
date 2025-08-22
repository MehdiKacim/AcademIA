import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/LoginForm";
import { SignUpForm } from "@/components/SignUpForm";
import { showSuccess, showError } from '@/utils/toast';
import { ArrowLeft } from 'lucide-react';

interface AuthMenuProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

const AuthMenu = ({ onClose, onLoginSuccess }: AuthMenuProps) => {
  const [currentView, setCurrentView] = useState<'login' | 'signup'>('login'); // Start directly on login view

  const handleLoginSuccess = () => {
    showSuccess("Connexion réussie !");
    onLoginSuccess(); // Notify parent (BottomNavigationBar)
  };

  const handleSignUpSuccess = (email: string) => {
    showSuccess(`Inscription réussie ! Veuillez vérifier votre email (${email}) pour confirmer votre compte.`);
    setCurrentView('login'); // After signup, go to login view
  };

  const handleSignUpError = (message: string) => {
    showError(message);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center relative">
        <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-4 top-4">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Fermer</span>
        </Button>
        <CardTitle className="text-2xl">
          {currentView === 'login' ? 'Connexion' : "S'inscrire"}
        </CardTitle>
        <CardDescription>
          {currentView === 'login' ?
            "Entrez vos identifiants pour accéder à votre espace." :
            "Créez un nouveau compte."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentView === 'login' ? (
          <LoginForm
            onSuccess={handleLoginSuccess}
            onSwitchToSignup={() => setCurrentView('signup')}
          />
        ) : (
          <SignUpForm
            onSuccess={handleSignUpSuccess}
            onError={handleSignUpError}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default AuthMenu;