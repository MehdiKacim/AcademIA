import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/LoginForm";
import { SignUpForm } from "@/components/SignUpForm";
import { showSuccess, showError } from '@/utils/toast';
import { ArrowLeft } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react'; // Import Embla

interface AuthMenuProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

const AuthMenu = ({ onClose, onLoginSuccess }: AuthMenuProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0); // 0 for login, 1 for signup

  // Sync Embla's selected index with internal state
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const handleLoginSuccess = () => {
    showSuccess("Connexion réussie !");
    onLoginSuccess();
  };

  const handleSignUpSuccess = (email: string) => {
    showSuccess(`Inscription réussie ! Veuillez vérifier votre email (${email}) pour confirmer votre compte.`);
    emblaApi?.scrollTo(0); // After signup, go to login view
  };

  const handleSignUpError = (message: string) => {
    showError(message);
  };

  const onSwitchToSignup = () => emblaApi?.scrollTo(1);
  const onSwitchToLogin = () => emblaApi?.scrollTo(0);

  const currentTitle = selectedIndex === 0 ? 'Connexion' : "S'inscrire";
  const currentDescription = selectedIndex === 0 ?
    "Entrez vos identifiants pour accéder à votre espace." :
    "Créez un nouveau compte.";

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center relative">
        <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-4 top-4">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Fermer</span>
        </Button>
        <CardTitle className="text-2xl">
          {currentTitle}
        </CardTitle>
        <CardDescription>
          {currentDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-4"> {/* Embla's inner container for slides, adjust margin for spacing */}
            <div className="embla__slide pl-4 min-w-0 flex-[0_0_100%]"> {/* Login Form */}
              <LoginForm
                onSuccess={handleLoginSuccess}
                onSwitchToSignup={onSwitchToSignup}
              />
            </div>
            <div className="embla__slide pl-4 min-w-0 flex-[0_0_100%]"> {/* Signup Form */}
              <SignUpForm
                onSuccess={handleSignUpSuccess}
                onError={handleSignUpError}
                onSwitchToLogin={onSwitchToLogin}
              />
            </div>
          </div>
        </div>

        {/* Navigation dots/tabs */}
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant={selectedIndex === 0 ? "default" : "outline"}
            size="sm"
            onClick={() => emblaApi?.scrollTo(0)}
          >
            Connexion
          </Button>
          <Button
            variant={selectedIndex === 1 ? "default" : "outline"}
            size="sm"
            onClick={() => emblaApi?.scrollTo(1)}
          >
            Inscription
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Glissez pour changer
        </p>
      </CardContent>
    </Card>
  );
};

export default AuthMenu;