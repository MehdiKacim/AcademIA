import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info, Code, Heart, Linkedin, Github } from "lucide-react";
import packageJson from '../../package.json';
import Logo from "@/components/Logo";
import { motion, Variants } from 'framer-motion'; // Import Variants

const About = () => {
  const appVersion = packageJson.version;

  const cardVariants: Variants = { // Explicitly type as Variants
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="space-y-6 p-4">
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
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
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.2,
            },
          },
        }}
        className="space-y-6"
      >
        <motion.div variants={cardVariants}>
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <Info className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Détails Généraux</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-center"> {/* Added text-center here */}
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
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <Code className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Développeur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-center"> {/* Added text-center here */}
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Nom du développeur :</span> Mehdi Kacim
              </p>
              <p className="text-base font-semibold text-primary mt-2">
                Developed with love for you, for all ❤️
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <Heart className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Connectez-vous avec le développeur</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 pt-2 justify-center"> {/* Added justify-center here */}
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
    </div>
  );
};

export default About;