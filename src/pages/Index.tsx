import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SlidersHorizontal,
  MessageSquareQuote,
  ShieldCheck,
  Target,
  MessageCircleMore,
  Home,
  LogIn, // Keep LogIn for the main button
  UserPlus, // Keep UserPlus for the main button
  Download,
  Info, // Import Info icon for About section
  Loader2, // Import Loader2 for loading state
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRole } from "@/contexts/RoleContext";
import { showSuccess, showError } from "@/utils/toast";
import AuthModal from "@/components/AuthModal"; // Import AuthModal
import AboutModal from "@/components/AboutModal"; // Import AboutModal
import { useQuery } from "@tanstack/react-query"; // Import useQuery
import { supabase } from "@/integrations/supabase/client"; // Import supabase

interface IndexProps {
  setIsAdminModalOpen: (isOpen: boolean) => void; // New prop
}

const Index = ({ setIsAdminModalOpen }: IndexProps) => {
  const [activeSection, setActiveSection] = useState('accueil');
  const sectionRefs = {
    accueil: useRef<HTMLDivElement>(null),
    aiaBot: useRef<HTMLDivElement>(null),
    methodologie: useRef<HTMLDivElement>(null),
  };

  const { currentUserProfile } = useRole();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); // State for AuthModal
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false); // State for AboutModal
  const logoTapCountRef = useRef(0); // Ref pour le compteur de taps sur le logo

  // Fetch latest APK release data using TanStack Query
  // This query is no longer needed as the APK download button is removed.
  const { data: apkData, isLoading: isLoadingApk, isError: isApkError } = useQuery({
    queryKey: ['latestApkRelease'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-latest-apk-release');
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    enabled: false, // Disable fetching APK data as it's no longer used
  });

  // Removed the useEffect that was causing the redirection issue.
  // The redirection for logged-in users is now handled at the App.tsx level.

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe only the remaining sections
    if (sectionRefs.accueil.current) observer.observe(sectionRefs.accueil.current);
    if (sectionRefs.aiaBot.current) observer.observe(sectionRefs.aiaBot.current);
    if (sectionRefs.methodologie.current) observer.observe(sectionRefs.methodologie.current);

    return () => {
      // Disconnect observer from all refs
      if (sectionRefs.accueil.current) observer.unobserve(sectionRefs.accueil.current);
      if (sectionRefs.aiaBot.current) observer.unobserve(sectionRefs.aiaBot.current);
      if (sectionRefs.methodologie.current) observer.unobserve(sectionRefs.methodologie.current);
    };
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false); // Close auth modal on success
    // The RoleContext's onAuthStateChange listener will handle navigation to dashboard
  };

  const methodology = [
    {
      icon: <Target className="w-12 h-12 text-primary" />,
      title: "Évaluation Initiale",
      description:
        "L'IA analyse vos connaissances pour créer un parcours sur mesure.",
    },
    {
      icon: <SlidersHorizontal className="w-12 h-12 text-primary" />,
      title: "Apprentissage Adaptatif",
      description:
        "Des leçons qui s'ajustent en temps réel à votre rythme et à vos difficultés.",
    },
    {
      icon: <MessageSquareQuote className="w-12 h-12 text-primary" />,
      title: "Feedback Instantané",
      description:
        "Recevez des retours et des conseils de votre tuteur IA pour progresser plus vite.",
    },
    {
      icon: <ShieldCheck className="w-12 h-12 text-primary" />,
      title: "Consolidation des Acquis",
      description:
        "Des exercices ciblés pour renforcer vos points faibles et assurer une maîtrise durable.",
    },
  ];

  const indexNavItems: any[] = [
    { label: "Accueil", icon: Home, onClick: () => document.getElementById('accueil')?.scrollIntoView({ behavior: 'smooth' }), isActive: activeSection === 'accueil', type: 'trigger' },
    { label: "AiA Bot", icon: MessageCircleMore, onClick: () => document.getElementById('aiaBot')?.scrollIntoView({ behavior: 'smooth' }), isActive: activeSection === 'aiaBot', type: 'trigger' },
    { label: "Méthodologie", icon: SlidersHorizontal, onClick: () => document.getElementById('methodologie')?.scrollIntoView({ behavior: 'smooth' }), isActive: activeSection === 'methodologie', type: 'trigger' },
    // Removed "À propos" from main navigation
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isModifierPressed = event.ctrlKey || event.metaKey; // Ctrl for Windows/Linux, Cmd for Mac

    if (isModifierPressed && event.shiftKey && event.key === 'A') { // New shortcut: Ctrl + Shift + A
      event.preventDefault();
      setIsAdminModalOpen(true);
    }
  }, [setIsAdminModalOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Gérer les clics sur le logo pour le déclencheur mobile de l'AdminModal
  const handleLogoClick = useCallback(() => {
    logoTapCountRef.current += 1;
    if (logoTapCountRef.current >= 10) {
      setIsAdminModalOpen(true);
      logoTapCountRef.current = 0; // Reset count after opening
    }
    // Reset tap count after a short delay if not enough taps
    setTimeout(() => {
      logoTapCountRef.current = 0;
    }, 1000); // 1 second to reset tap count
  }, [setIsAdminModalOpen]);

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <header className="fixed top-0 left-0 right-0 z-50 px-2 py-4 flex items-center justify-between border-b backdrop-blur-lg bg-background/80">
        <Logo onLogoClick={handleLogoClick} />
        {!isMobile && (
          <nav className="flex flex-grow justify-center items-center gap-2 sm:gap-4 flex-wrap">
            {indexNavItems.map((item) => {
              if (item.type === 'link' && item.to) {
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center p-2 rounded-md text-sm font-medium whitespace-nowrap",
                      location.pathname === item.to ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <Button
                  key={item.label}
                  variant="ghost"
                  onClick={item.onClick}
                  className={cn(item.isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground', 'whitespace-nowrap')}
                >
                  {item.label}
                </Button>
              );
            })}
          </nav>
        )}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          <ThemeToggle />
          {/* Mobile-only About button (icon only) */}
          <Button variant="outline" size="icon" onClick={() => setIsAboutModalOpen(true)} className="md:hidden">
            <Info className="h-5 w-5" />
            <span className="sr-only">À propos</span>
          </Button>
          {/* Desktop-only About button (text + icon) */}
          <Button variant="outline" onClick={() => setIsAboutModalOpen(true)} className="hidden md:flex">
            <Info className="h-5 w-5 mr-2" /> À propos
          </Button>
          {!isMobile && (
            <Button variant="outline" onClick={() => setIsAuthModalOpen(true)}>
              <LogIn className="h-5 w-5 mr-2" /> Authentification
            </Button>
          )}
        </div>
      </header>

      <main className={cn("flex-grow flex flex-col items-center justify-center text-center pt-24 md:pt-32", isMobile && "pb-20")}>
        <section
          id="accueil"
          ref={sectionRefs.accueil}
          className="py-20 px-4 w-full"
        >
          <div className="relative">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/20 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

            <div className="flex justify-center mb-8">
              <Logo iconClassName="w-24 h-24 sm:w-40 sm:h-40" showText={false} />
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
              L'Avenir de l'Apprentissage est Ici
            </h2>
            <p className="text-base md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              AcademIA transforme l'éducation avec des parcours personnalisés, un
              suivi intelligent et un tuteur IA pour libérer le potentiel de
              chaque apprenant.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              {/* Le bouton de téléchargement de l'APK a été supprimé */}
            </div>
          </div>
        </section>

        <section
          id="aiaBot"
          ref={sectionRefs.aiaBot}
          className="py-20 w-full border-y border-border/50 px-4"
        >
          <div className="max-w-5xl mx-auto text-center">
            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
              Votre Tuteur IA Personnel : AiA
            </h3>
            <p className="text-lg text-muted-foreground mb-12">
              AiA, l'intelligence artificielle d'AcademIA, est là pour vous guider. Elle identifie vos points faibles, adapte les leçons et vous offre un soutien personnalisé pour une progression optimale.
            </p>
            <div className="flex justify-center mb-8">
              <MessageCircleMore className="w-24 h-24 text-primary" />
            </div>
            <div>
              <Button size="lg" onClick={() => setIsAuthModalOpen(true)}>
                Découvrir AiA
              </Button>
            </div>
          </div>
        </section>

        <section
          id="methodologie"
          ref={sectionRefs.methodologie}
          className="py-20 w-full px-4"
        >
          <h3 className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
            Notre Méthodologie Révolutionnaire
          </h3>
          <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
            Un parcours d'apprentissage unique, guidé par l'intelligence
            artificielle, pour une maîtrise complète.
          </p>
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto"
          >
            {methodology.map((item, index) => (
              <div key={index}>
                <Card className="text-center">
                  <CardHeader>
                    <div className="flex justify-center mb-4">{item.icon}</div>
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="p-4 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} AcademIA. Tous droits réservés.{" "}
        <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground" onClick={() => setIsAboutModalOpen(true)}>
          À propos
        </Button>
      </footer>

      <BottomNavigationBar navItems={indexNavItems} currentUser={currentUserProfile} onOpenAboutModal={() => setIsAboutModalOpen(true)} />
      {!currentUserProfile && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={handleAuthSuccess} />}
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
    </div>
  );
};

export default Index;