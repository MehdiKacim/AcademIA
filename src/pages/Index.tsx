import React from 'react';
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

// Variants pour les animations de conteneur (staggering children)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Décalage de 0.1s entre chaque enfant
    },
  },
};

// Variants pour les éléments individuels (fade-in et slide-up)
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const Index = () => {
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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <header className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center border-b backdrop-blur-lg bg-background/80">
        <Logo />
        <nav className="flex items-center gap-4">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="outline">Se connecter</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center p-4 pt-20">
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
          className="py-20"
        >
          <div className="relative">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/20 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

            <motion.div variants={itemVariants} className="flex justify-center mb-8">
              <Logo iconClassName="w-32 h-32" showText={false} />
            </motion.div>
            <motion.h2 variants={itemVariants} className="text-5xl md:text-6xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
              L'Avenir de l'Apprentissage est Ici
            </motion.h2>
            <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              AcademIA transforme l'éducation avec des parcours personnalisés, un
              suivi intelligent et un tuteur IA pour libérer le potentiel de
              chaque apprenant.
            </motion.p>
            <motion.div variants={itemVariants} className="flex gap-4 justify-center">
              <Link to="/login">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Commencer l'aventure
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="secondary">
                  Créer un compte
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {/* AiA Bot Section - Background changed and animations applied */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
          className="py-20 w-full border-y border-border/50"
        >
          <div className="max-w-5xl mx-auto px-4 text-center">
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
              <Link to="/register">
                <Button size="lg">
                  Découvrir AiA
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
          className="py-20 w-full"
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto px-4"
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
    </div>
  );
};

export default Index;