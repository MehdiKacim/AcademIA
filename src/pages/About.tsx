import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, MotionCard } from "@/components/ui/card"; // Import MotionCard
import { Info, Code, Heart, Linkedin, Github, ArrowLeft } from "lucide-react";
import packageJson from '../../package.json';
import Logo from "@/components/Logo";
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button, MotionButton } from "@/components/ui/button"; // Import MotionButton

const About = () => {
  const appVersion = packageJson.version;
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delayChildren: 0.2, // Légèrement plus long
        staggerChildren: 0.1, // Légèrement plus long
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.4, // Plus long
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <motion.div
      className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative" // max-w-md pour réduire la largeur
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Back button */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-4 z-10">
        <MotionButton variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-muted/20 hover:bg-muted/40" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Retour</span>
        </MotionButton>
      </div>

      <motion.div variants={itemVariants} className="text-center mb-8 pt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
          animate={{ opacity: 1, scale: 1, rotate: 360 }} // Rotation complète
          transition={{ delay: 0.1, duration: 2.0, ease: "easeInOut" }} // Durée de l'animation du logo
          className="mb-4 mx-auto w-fit"
        >
          <Logo iconClassName="w-24 h-24" showText={false} />
        </motion.div>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan text-center">
          Informations sur l'Application
        </h2>
        <p className="text-muted-foreground mt-2 text-center">
          Découvrez les détails techniques et la version d'AcademIA.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 w-full">
        {/* Section "Détails d'AcademIA" supprimée */}

        <MotionCard className="shadow-md rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <Code className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Développeur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-center">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Nom du développeur :</span> Mehdi Kacim
            </p>
            <p className="text-base font-semibold text-primary mt-2">
              Developed with love for you, for all ❤️
            </p>
          </CardContent>
        </MotionCard>

        <MotionCard className="shadow-md rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <Heart className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Connectez-vous avec le développeur</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 pt-2 justify-center">
            <MotionButton
              asChild
              variant="link"
              className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors text-sm"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              <a
                href="https://www.linkedin.com/in/mehdi-kacim-333304142?originalSubdomain=fr"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="h-5 w-5" />
                LinkedIn
              </a>
            </MotionButton>
            <MotionButton
              asChild
              variant="link"
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors text-sm"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              <a
                href="https://github.com/MehdiKacim"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-5 w-5" />
                GitHub
              </a>
            </MotionButton>
          </CardContent>
        </MotionCard>
      </motion.div>
    </motion.div>
  );
};

export default About;