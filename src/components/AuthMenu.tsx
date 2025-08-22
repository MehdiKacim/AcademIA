import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/LoginForm";
import { SignUpForm } from "@/components/SignUpForm";
import { showSuccess, showError } from '@/utils/toast';
import { ArrowLeft, ArrowRightLeft } from 'lucide-react'; // Import ArrowRightLeft
import useEmblaCarousel from 'embla-carousel-react'; // Import Embla
import { cn } from "@/lib/utils"; // Import cn for conditional styling

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

  const currentTitle = selectedIndex === 0 ? 'Connexion' : "S'inscrire";
  const currentDescription = selectedIndex === 0 ?
    "Entrez vos identifiants pour accéder à votre espace." :
    "Créez un nouveau compte.";

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center relative pb-2"> {/* Adjusted padding-bottom */}
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
        {/* Visual indicator for swipe - Moved here */}
        <div className="flex flex-col items-center justify-center mt-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full transition-colors duration-200",
                selectedIndex === 0 ? "bg-primary" : "bg-muted-foreground"
              )}
            />
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground animate-wiggle-horizontal" />
            <span
              className={cn(
                "h-2 w-2 rounded-full transition-colors duration-200",
                selectedIndex === 1 ? "bg-primary" : "bg-muted-foreground"
              )}
            />
          </div>
          <p className="text-center text-xs text-muted-foreground mt-1">
            Glissez pour changer
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-4"> {/* Embla's inner container for slides, adjust margin for spacing */}
            <div className="embla__slide pl-4 min-w-0 flex-[0_0_100%]"> {/* Login Form */}
              <LoginForm
                onSuccess={handleLoginSuccess}
                onSwitchToSignup={() => emblaApi?.scrollTo(1)}
              />
            </div>
            <div className="embla__slide pl-4 min-w-0 flex-[0_0_100%]"> {/* Signup Form */}
              <SignUpForm
                onSuccess={handleSignUpSuccess}
                onError={handleSignUpError}
                onSwitchToLogin={() => emblaApi?.scrollTo(0)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthMenu;