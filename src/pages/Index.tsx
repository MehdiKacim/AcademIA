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
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils"; // Import cn for conditional class names
import LoginModal from "@/components/LoginModal"; // Import LoginModal
import RegisterModal from "@/components/RegisterModal"; // Import RegisterModal
import MobileSheetNav from "@/components/MobileSheetNav"; // Import MobileSheetNav

// Variants pour les animations de conteneur (staggering children)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15, // Décalage légèrement augmenté pour plus d'impact
    },
  },
};

// Variants pour les éléments individuels (fade-in et slide-up)
const itemVariants = {
  hidden: { opacity: 0, y: 50 }, // 'y' augmenté pour une animation plus prononcée
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }, // Durée légèrement augmentée
};

const Index = () => {
  const [activeSection, setActiveSection] = useState('accueil');
  const [isLoginModalOpen, setIsLoginModal] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModal] = useState(false);

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
    setActiveSection(id); // Update active state immediately on click
  };

  const openLoginModal = () => {
    setIsRegisterModal(false); // Close register if open
    setIsLoginModal(true);
  };

  const closeLoginModal = () => setIsLoginModal(false);

  const openRegisterModal = () => {
    setIsLoginModal(false); // Close login if open
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

  const indexNavItems = [
    { to: "#accueil", label: "Accueil" },
    { to: "#aiaBot", label: "AiA Bot" },
    { to: "#methodologie", label: "Méthodologie" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <header className="fixed top-0 left-0 right-0 z-50 px-2 py-4 flex items-center border-b backdrop-blur-lg bg-background/80">
        {/* Mobile Navigation - Logo as trigger */}
        <div className="md:hidden flex items-center gap-2">
          <MobileSheetNav
            navItems={indexNavItems.map(item => ({...item, to: item.to.substring(1)}))}
            onLinkClick={() => {}}
            trigger={
              <Logo
                iconClassName="w-10 h-10 cursor-pointer" // Rendre le logo plus grand et cliquable
                textClassName="text-xl"
              />
            }
          >
            <ThemeToggle />
            <Button variant="outline" className="w-full" onClick={() => { closeLoginModal(); openLoginModal(); }}>
              Se connecter
            </Button>
            <Button className="w-full" onClick={() => { closeRegisterModal(); openRegisterModal(); }}>
              Créer un compte
            </Button>
          </MobileSheetNav>
        </div>

        {/* Desktop Navigation - Logo is just a logo */}
        <Logo className="hidden md:block" />
        <nav className="hidden md:flex flex-grow justify-center items-center gap-6">
          <Button variant="ghost" onClick={() => handleNavLinkClick('accueil')}
            className={cn(activeSection === 'accueil' ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground')}>
            Accueil
          </Button>
          <Button variant="ghost" onClick={() => handleNavLinkClick('aiaBot')}
            className={cn(activeSection === 'aiaBot' ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground')}>
            AiA Bot
          </Button>
          <Button variant="ghost" onClick={() => handleNavLinkClick('methodologie')}
            className={cn(activeSection === 'methodologie' ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground')}>
            Méthodologie
          </Button>
        </nav>
        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-4 ml-auto">
          <ThemeToggle />
          <Button variant="outline" onClick={openLoginModal}>
            Se connecter
          </Button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center pt-16 sm:pt-20">
        {/* Section Accueil - Rendre toujours visible */}
        <section
          id="accueil"
          ref={sectionRefs.accueil}
          className="py-20 px-4 w-full"
        >
          <div className="relative">
            {/* Blob animations pour une touche IA */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/20 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="flex justify-center mb-8">
              <Logo iconClassName="w-24 h-24 sm:w-40 sm:h-40" showText={false} />
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
              L'Avenir de l'Apprentissage est Ici
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="text-base md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              AcademIA transforme l'éducation avec des parcours personnalisés, un
              suivi intelligent et un tuteur IA pour libérer le potentiel de
              chaque apprenant.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="flex gap-4 justify-center">
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
            </motion.div>
          </div>
        </section>

        {/* Section AiA Bot */}
        <motion.section
          id="aiaBot"
          ref={sectionRefs.aiaBot}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
          className="py-20 w-full border-y border-border/50 px-4"
        >
          <div className="max-w-5xl mx-auto text-center">
            <motion.h3 variants={itemVariants} className="text-3xl md:text-4xl font-bold mb-4">
              Votre Tuteur IA Personnel : AiA
            </motion.h3>
            <motion.p variants={itemVariants} className="text-lg text-muted-foreground mb-12">
              AiA, l'intelligence artificielle d'AcademIA, est là pour vous guider. Elle identifie vos points faibles, adapte les leçons et vous offre un soutien personnalisé pour une progression optimale.
            </motion.p>
            <motion.div variants={itemVariants} className="flex justify-center mb-8">
              <MessageCircleMore className="w-24 h-24 text-primary" />
            </motion.div>
            <motion.div variants={itemVariants}>
              <Button size="lg" onClick={openRegisterModal}>
                Découvrir AiA
              </Button>
            </motion.div>
          </div>
        </motion.section>

        {/* Section Méthodologie */}
        <motion.section
          id="methodologie"
          ref={sectionRefs.methodologie}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
          className="py-20 w-full px-4"
        >
          <motion.h3 variants={itemVariants} className="text-3xl md:text-4xl font-bold mb-4">
            Notre Méthodologie Révolutionnaire
          </motion.h3>
          <motion.p variants={itemVariants} className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
            Un parcours d'apprentissage unique, guidé par l'intelligence
            artificielle, pour une maîtrise complète.
          </motion.p>
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto"
          >
            {methodology.map((item, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="text-center">
                  <CardHeader>
                    <div className="flex justify-center mb-4">{item.icon}</div>
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
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
    </div>
  );
};

export default Index;