import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  Download,
  Info,
  BotMessageSquare, // Added BotMessageSquare for AiA Bot
  UserCog, // Added UserCog for Admin access button
  Menu, // Added Menu icon for mobile navigation
  SunMoon, // Added SunMoon for theme toggle
} from "lucide-react"; // Import all necessary icons
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
// Removed BottomNavigationBar import
import { useIsMobile } from "@/hooks/use-mobile";
import { useRole } from "@/contexts/RoleContext";
import { showSuccess, showError } from "@/utils/toast";
// Removed AuthModal import
// Removed AboutModal import
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NavItem } from "@/lib/dataModels";
import { useCourseChat } from '@/contexts/CourseChatContext'; // Import useCourseChat
import MobileBottomNavContent from "@/components/MobileBottomNavContent"; // Import the new component
import NavSheet from "@/components/NavSheet"; // Import NavSheet for unauthenticated users
import { motion } from 'framer-motion'; // Import motion for animations

interface IndexProps {
  setIsAdminModalOpen: (isOpen: boolean) => void;
  onInitiateThemeChange: (newTheme: string) => void; // New prop
}

// Map icon_name strings to Lucide React components
const iconMap: { [key: string]: React.ElementType } = {
  Home, MessageSquareQuote, SlidersHorizontal, Info, LogIn, Download, MessageCircleMore, BotMessageSquare, SunMoon,
};

const Index = ({ setIsAdminModalOpen, onInitiateThemeChange }: IndexProps) => {
  const [activeSection, setActiveSection] = useState('accueil');
  const sectionRefs = {
    accueil: useRef<HTMLDivElement>(null),
    aiaBot: useRef<HTMLDivElement>(null),
    methodologie: useRef<HTMLDivElement>(null),
  };

  const { currentUserProfile, currentRole } = useRole();
  const { openChat } = useCourseChat(); // Get openChat from context
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isMobileNavSheetOpen, setIsMobileNavSheetOpen] = useState(false); // State for mobile nav sheet
  const logoTapCountRef = useRef(0);
  const location = useLocation();

  const { data: apkData, isLoading: isLoadingApk, isError: isApkError } = useQuery({
    queryKey: ['latestApkRelease'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-latest-apk-release');
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    staleTime: 1000 * 60 * 60,
    enabled: false,
  });

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

    if (sectionRefs.accueil.current) observer.observe(sectionRefs.accueil.current);
    if (sectionRefs.aiaBot.current) observer.observe(sectionRefs.aiaBot.current);
    if (sectionRefs.methodologie.current) observer.observe(sectionRefs.methodologie.current);

    return () => {
      if (sectionRefs.accueil.current) observer.unobserve(sectionRefs.accueil.current);
      if (sectionRefs.aiaBot.current) observer.unobserve(sectionRefs.aiaBot.current);
      if (sectionRefs.methodologie.current) observer.unobserve(sectionRefs.methodologie.current);
    };
  }, []);

  // New useEffect for scrolling to hash links
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1)); // Remove '#'
      if (element) {
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100); // Small delay to ensure element is rendered
        return () => clearTimeout(timer);
      }
    } else if (location.pathname === '/' && !location.hash) {
      // If on root path with no hash, scroll to top or 'accueil'
      const timer = setTimeout(() => {
        sectionRefs.accueil.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.hash, location.pathname]);

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

  // Static nav items for the header (desktop) and mobile NavSheet (unauthenticated)
  const staticNavItems: NavItem[] = [
    { id: 'home-anon', label: "Accueil", icon_name: 'Home', route: '/', is_external: false, order_index: 0, type: 'route' },
    { id: 'aia-bot-link', label: "AiA Bot", icon_name: 'BotMessageSquare', route: '#aiaBot', is_external: false, order_index: 1, type: 'route' },
    { id: 'methodology-link', label: "Méthodologie", icon_name: 'SlidersHorizontal', route: '#methodologie', is_external: false, order_index: 2, type: 'route' },
    { id: 'about-link', label: "À propos", icon_name: 'Info', route: '/about', is_external: false, order_index: 3, type: 'route' },
    { id: 'theme-toggle-anon', label: "Thème", icon_name: 'SunMoon', is_external: false, type: 'category_or_action', onClick: () => {}, order_index: 4 }, // Theme toggle item
    { id: 'login-link', label: "Connexion", icon_name: 'LogIn', route: '/auth', is_external: false, order_index: 5, type: 'route' },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isModifierPressed = event.ctrlKey || event.metaKey;

    if (isModifierPressed && event.shiftKey && event.key === 'S') {
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

  const handleLogoClick = useCallback(() => {
    logoTapCountRef.current += 1;
    if (logoTapCountRef.current >= 10) {
      setIsAdminModalOpen(true);
      logoTapCountRef.current = 0;
    }
    setTimeout(() => {
      logoTapCountRef.current = 0;
    }, 1000);
  }, [setIsAdminModalOpen]);

  // Variants for animated text
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
        staggerChildren: 0.05,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { y: 0, opacity: 1 },
  };

  const toggleMobileNavSheet = useCallback(() => {
    console.log("toggleMobileNavSheet called from Index!"); // Add this log
    setIsMobileNavSheetOpen(prev => !prev);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <header className={cn(
          "fixed left-0 right-0 z-50 px-4 py-3 flex items-center justify-between border-b backdrop-blur-lg bg-background/80 shadow-sm h-[68px]",
          isMobile ? "hidden" : "top-0" // Hide on mobile, show on desktop
        )}
        style={{ top: isMobile ? 'auto' : 'env(safe-area-inset-top)' }} // Adjust top/bottom based on mobile
      >
        <div className="flex items-center gap-4">
          <Logo onLogoClick={handleLogoClick} disableInternalAnimation={false} /> {/* Pass disableInternalAnimation={false} */}
        </div>
        <nav className="hidden md:flex items-center gap-4">
          {staticNavItems.filter(item => item.id !== 'login-link' && item.id !== 'theme-toggle-anon').map((item) => { // Filter out login link and theme toggle for desktop header
            const isActive = 
              (item.route === '/' && location.pathname === '/' && !location.hash) ||
              (item.route?.startsWith('#') && location.pathname === '/' && location.hash === item.route);
            
            const IconComponent = iconMap[item.icon_name || 'Info'] || Info;

            return (
              <Link
                key={item.id}
                to={item.route!}
                className={cn(
                  "flex items-center p-2 rounded-md text-sm font-medium whitespace-nowrap",
                  isActive ? "text-primary font-semibold bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                )}
              >
                <IconComponent className="h-5 w-5 mr-2" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {/* ThemeToggle removed from here */}
          <Button variant="ghost" size="icon" onClick={() => navigate('/about')} className="hidden sm:flex"> {/* Navigate to /about */}
            <Info className="h-5 w-5" />
            <span className="sr-only">À propos</span>
          </Button>
          <Button variant="outline" onClick={() => navigate('/auth')}> {/* Redirect to AuthPage */}
            <LogIn className="h-5 w-5 mr-2" /> Connexion
          </Button>
        </div>
      </header>

      <main className={cn(
          "flex-grow flex flex-col items-center justify-center text-center px-4 overflow-y-auto overflow-x-hidden", // Added overflow-x-hidden here
          "pt-[calc(68px+env(safe-area-inset-top))] pb-4" // Fixed 68px padding from top for both mobile and desktop
        )}>
        <section
          id="accueil"
          ref={sectionRefs.accueil}
          className="py-20 px-4 w-full"
        >
          <div className="relative">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/20 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

            <div className="flex justify-center mb-8">
              <Logo iconClassName="w-24 h-24 sm:w-40 sm:h-40" showText={false} disableInternalAnimation={false} /> {/* Pass disableInternalAnimation={false} */}
            </div>
            {/* NEW: Animated AcademIA text */}
            <motion.h1
              className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan mb-4"
              variants={textVariants}
              initial="hidden"
              animate="visible"
            >
              {"AcademIA".split("").map((char, index) => (
                <motion.span key={index} variants={letterVariants}>
                  {char}
                </motion.span>
              ))}
            </motion.h1>
            {/* Existing h2 */}
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
              L'Avenir de l'Apprentissage est Ici
            </h2>
            <p className="text-base md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              AcademIA transforme l'éducation avec des parcours personnalisés, un
              suivi intelligent et un tuteur IA pour libérer le potentiel de
              chaque apprenant.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" onClick={() => navigate('/auth')}> {/* Redirect to AuthPage */}
                Découvrir AiA
              </Button>
              {/* Removed Admin Access Button */}
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
              <BotMessageSquare className="w-24 h-24 text-primary" />
            </div>
            <div>
              <Button size="lg" onClick={() => openChat()}> {/* Updated call */}
                Parler à AiA
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
                <Card className="text-center hover:scale-[1.02] transition-transform"> {/* Added hover effect */}
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
        <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground" onClick={() => navigate('/about')}> {/* Navigate to /about */}
          À propos
        </Button>
      </footer>

      {isMobile && (
        <>
          <NavSheet
            isOpen={isMobileNavSheetOpen}
            onOpenChange={toggleMobileNavSheet} // Use the new prop here
            navItems={staticAnonNavItems} // Pass static nav items for unauthenticated users
            onOpenGlobalSearch={() => { /* No-op for unauthenticated */ }}
            onOpenAiAChat={() => openChat()}
            onOpenAuthModal={() => navigate('/auth')}
            unreadMessagesCount={0} // No unread messages for unauthenticated
            onInitiateThemeChange={onInitiateThemeChange}
            isMobile={isMobile}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[996] px-4 py-3 flex items-center justify-between shadow-sm backdrop-blur-lg bg-background/80 h-[68px] border-t-2 border-border">
            <MobileBottomNavContent
              onOpenGlobalSearch={() => { /* No-op for unauthenticated */ }}
              onOpenAiAChat={() => openChat()}
              onToggleMobileNavSheet={toggleMobileNavSheet} // Use the new prop here
              onInitiateThemeChange={onInitiateThemeChange}
              isAuthenticated={false}
              unreadMessagesCount={0} // Pass unread messages count
              isMobileNavSheetOpen={isMobileNavSheetOpen} // Pass the state here
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Index;