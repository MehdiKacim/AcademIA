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
  const [currentView, setCurrentView] = useState<'main' | 'login' | 'signup'>('main');

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

  const renderContent = () => {
    switch (currentView) {
      case 'main':
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
                Authentification
              </CardTitle>
              <CardDescription>
                Choisissez une option pour continuer.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button onClick={() => setCurrentView('login')}>Se connecter</Button>
              <Button variant="outline" onClick={() => setCurrentView('signup')}>S'inscrire</Button>
            </CardContent>
          </>
        );
      case 'login':
        return (
          <>
            <CardHeader className="text-center">
              <Button variant="ghost" size="icon" onClick={() => setCurrentView('main')} className="absolute left-4 top-4">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Retour</span>
              </Button>
              <CardTitle className="text-2xl">Connexion</CardTitle>
              <CardDescription>
                Entrez vos identifiants pour accéder à votre espace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm onSuccess={handleLoginSuccess} />
            </CardContent>
          </>
        );
      case 'signup':
        return (
          <>
            <CardHeader className="text-center">
              <Button variant="ghost" size="icon" onClick={() => setCurrentView('main')} className="absolute left-4 top-4">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Retour</span>
              </Button>
              <CardTitle className="text-2xl">S'inscrire</CardTitle>
              <CardDescription>
                Créez un nouveau compte.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignUpForm onSuccess={handleSignUpSuccess} onError={handleSignUpError} />
            </CardContent>
          </>
        );
    }
  };

  return (
    <Card className="w-full max-w-md">
      {renderContent()}
    </Card>
  );
};

export default AuthMenu;