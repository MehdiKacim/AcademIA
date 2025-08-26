import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/LoginForm";
import { showSuccess, showError } from '@/utils/toast';
import { ArrowLeft } from 'lucide-react'; // Import ArrowLeft
// Removed: import useEmblaCarousel from 'embla-carousel-react'; // Keep Embla for now, will remove if only one slide is truly needed

interface AuthMenuProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

const AuthMenu = ({ onClose, onLoginSuccess }: AuthMenuProps) => {
  // Embla carousel is no longer needed as there's only one view (Login)
  // Removing emblaRef and related logic
  
  const handleLoginSuccess = () => {
    showSuccess("Connexion réussie !");
    onLoginSuccess();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center relative pb-2">
        <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-4 top-4">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Fermer</span>
        </Button>
        <CardTitle className="text-2xl">
          Connexion
        </CardTitle>
        <CardDescription>
          Entrez vos identifiants pour accéder à votre espace.
        </CardDescription>
        {/* Removed swipe indicator as there's only one view */}
      </CardHeader>
      <CardContent>
        {/* Directly render LoginForm */}
        <LoginForm
          onSuccess={handleLoginSuccess}
        />
      </CardContent>
    </Card>
  );
};

export default AuthMenu;