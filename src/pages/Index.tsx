import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
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
  LogIn, // Import de l'icône LogIn
  UserPlus, // Import de l'icône UserPlus
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import LoginModal from "@/components/LoginModal";
import RegisterModal from "@/components/RegisterModal";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const [isLoginModalOpen, setIsLoginModal] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModal] = useState(false);

  const [activeSection, setActiveSection] = useState('accueil');
  const sectionRefs = {
    accueil: useRef<HTMLDivElement>(null),
    aiaBot: useRef<HTMLDivElement>(null),
    methodologie: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    const observerOptions = {
      root: null, // viewport
      rootMargin: '-50% 0px -50% 0px', // Trigger when 50% of the section is in view
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

  const handleNavLinkClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(id);
  };

  const openLoginModal = () => {
    setIsRegisterModal(false);
    setIsLoginModal(true);
  };

  const closeLoginModal = () => setIsLoginModal(false);

  const openRegisterModal = () => {
    setIsLoginModal(false);
    setIsRegisterModal(true);
  };

  const closeRegisterModal = () => setIsRegisterModal(false);

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

  const isMobile = useIsMobile();

  const indexNavItems = [
    { label: "Accueil", icon: Home, onClick: () => handleNavLinkClick('accueil'), isActive: activeSection === 'accueil' },
    { label: "AiA Bot", icon: MessageCircleMore, onClick: () => handleNavLinkClick('aiaBot'), isActive: activeSection === 'aiaBot' },
    { label: "Méthodologie", icon: SlidersHorizontal, onClick: () => handleNavLinkClick('methodologie'), isActive: activeSection === 'methodologie' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <header className="fixed top-0 left-0 right-0 z-50 px-2 py-4 flex items-center justify-between border-b backdrop-blur-lg bg-background/80">
        <Logo />
        {/* Navigation pour les écrans non mobiles */}
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
          <Button variant="outline" size="icon" onClick={openLoginModal}>
            <LogIn className="h-5 w-5" />
            <span className="sr-only">Se connecter</span>
          </Button>
          <Button size="icon" onClick={openRegisterModal}>
            <UserPlus className="h-5 w-5" />
            <span className="sr-only">Créer un compte</span>
          </Button>
        </div>
      </header>

      <main className={cn("flex-grow flex flex-col items-center justify-center text-center pt-16 sm:pt-20", isMobile && "pb-20")}>
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
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={openLoginModal}
              >
                Commencer l'aventure
              </Button>
              <Button size="lg" variant="secondary" onClick={openRegisterModal}>
                Créer un compte
              </Button>
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
              <Button size="lg" onClick={openRegisterModal}>
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

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
        onRegisterClick={openRegisterModal}
      />
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={closeRegisterModal}
        onLoginClick={openLoginModal}
      />
      <BottomNavigationBar navItems={indexNavItems} />
    </div>
  );
};

export default Index;