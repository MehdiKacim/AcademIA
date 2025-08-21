import React, { useState, useEffect, useRef } from 'react';
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
  LogIn,
  UserPlus,
  Download,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRole } from "@/contexts/RoleContext";
import { showSuccess, showError } from "@/utils/toast";

const Index = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showApkDownloadButton, setShowApkDownloadButton] = useState(false);

  const [activeSection, setActiveSection] = useState('accueil');
  const sectionRefs = {
    accueil: useRef<HTMLDivElement>(null),
    aiaBot: useRef<HTMLDivElement>(null),
    methodologie: useRef<HTMLDivElement>(null),
  };

  const { currentUserProfile } = useRole();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (currentUserProfile) {
      navigate("/dashboard");
    }
  }, [currentUserProfile, navigate]);

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

    Object.values(sectionRefs).forEach(ref => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      Object.values(sectionRefs).forEach(ref => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallButton(false);
      } else {
        setShowInstallButton(true);
      }
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallButton(false);
      showSuccess("AcademIA a été installée sur votre appareil !");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    setShowApkDownloadButton(isMobile);
  }, [isMobile]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt.');
      } else {
        console.log('User dismissed the install prompt.');
        showError("Installation annulée.");
        setDeferredPrompt(null);
        setShowInstallButton(false);
      }
    }
  };

  const handleNavLinkClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(id);
  };

  const handleAuthRedirect = () => {
    navigate("/auth"); // Redirect to the AuthPage
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
    { label: "Accueil", icon: Home, onClick: () => handleNavLinkClick('accueil'), isActive: activeSection === 'accueil', type: 'trigger' },
    { label: "AiA Bot", icon: MessageCircleMore, onClick: () => handleNavLinkClick('aiaBot'), isActive: activeSection === 'aiaBot', type: 'trigger' },
    { label: "Méthodologie", icon: SlidersHorizontal, onClick: () => handleNavLinkClick('methodologie'), isActive: activeSection === 'methodologie', type: 'trigger' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <header className="fixed top-0 left-0 right-0 z-50 px-2 py-4 flex items-center justify-between border-b backdrop-blur-lg bg-background/80">
        <Logo />
        {!isMobile && (
          <nav className="flex flex-grow justify-center items-center gap-2 sm:gap-4 flex-wrap">
            {indexNavItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                onClick={item.onClick}
                className={cn(item.isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground', 'whitespace-nowrap')}
              >
                {item.label}
              </Button>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          <ThemeToggle />
          <Button variant="outline" size="icon" onClick={handleAuthRedirect}>
            <LogIn className="h-5 w-5" />
            <span className="sr-only">Se connecter</span>
          </Button>
          <Button size="icon" onClick={handleAuthRedirect}>
            <UserPlus className="h-5 w-5" />
            <span className="sr-only">Créer un compte</span>
          </Button>
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
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleAuthRedirect}
              >
                Commencer l'aventure
              </Button>
              <Button size="lg" variant="secondary" onClick={handleAuthRedirect}>
                Créer un compte
              </Button>
              {showInstallButton && (
                <Button size="lg" variant="outline" onClick={handleInstallClick}>
                  <Download className="h-5 w-5 mr-2" /> Installer l'application
                </Button>
              )}
              {showApkDownloadButton && (
                <a href="/downloads/AcademIA.apk" download="AcademIA.apk">
                  <Button size="lg" variant="outline">
                    <Download className="h-5 w-5 mr-2" /> Télécharger l'APK (Android)
                  </Button>
                </a>
              )}
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
              <Button size="lg" onClick={handleAuthRedirect}>
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
        © {new Date().getFullYear()} AcademIA. Tous droits réservés.
      </footer>

      {/* Modals removed, authentication handled by AuthPage */}
      <BottomNavigationBar navItems={indexNavItems} currentUser={currentUserProfile} />
    </div>
  );
};

export default Index;