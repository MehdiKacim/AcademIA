import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info, Code, Heart, Linkedin, Github, ArrowLeft } from "lucide-react"; // Import ArrowLeft
import packageJson from '../../package.json';
import Logo from "@/components/Logo";
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion'; // Import motion
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { Button } from "@/components/ui/button"; // Import Button

const About = () => {
  const appVersion = packageJson.version;
  const navigate = useNavigate(); // Initialize useNavigate

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2,
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
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative" // Added relative for button positioning
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Back button */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-4 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-muted/20 hover:bg-muted/40">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Retour</span>
        </Button>
      </div>

      <motion.div variants={itemVariants} className="text-center mb-8 pt-12"> {/* Added pt-12 to make space for the back button */}
        <div className="mb-4 mx-auto w-fit">
          <Logo iconClassName="w-24 h-24" showText={false} />
        </div>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan text-center">
          Informations sur l'Application
        </h2>
        <p className="text-muted-foreground mt-2 text-center">
          Découvrez les détails techniques et la version d'AcademIA.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 w-full">
        <Card className="shadow-md rounded-android-tile">
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <Info className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Détails d'AcademIA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-center prose dark:prose-invert">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Nom de l'application :</span> AcademIA
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Version :</span> {appVersion}
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Mentions Légales :</span>
              <br />
              &copy; {new Date().getFullYear()} AcademIA. Tous droits réservés.
              <br />
              Les contenus et fonctionnalités de cette application sont la propriété exclusive d'AcademIA.
              Toute reproduction ou distribution non autorisée est strictement interdite.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-android-tile">
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
        </Card>

        <Card className="shadow-md rounded-android-tile">
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <Heart className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Connectez-vous avec le développeur</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 pt-2 justify-center">
            <a
              href="https://www.linkedin.com/in/mehdi-kacim-333304142?originalSubdomain=fr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors text-sm"
            >
              <Linkedin className="h-5 w-5" />
              LinkedIn
            </a>
            <a
              href="https://github.com/MehdiKacim"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors text-sm"
            >
              <Github className="h-5 w-5" />
              GitHub
            </a>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default About;