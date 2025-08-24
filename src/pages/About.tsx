import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info, Code, Heart, Linkedin, Github } from "lucide-react";
import packageJson from '../../package.json';
import Logo from "@/components/Logo";
import { cn } from '@/lib/utils';

const About = () => {
  const appVersion = packageJson.version;

  return (
    <>
      <div className="text-center mb-8">
        <div className="mb-4 mx-auto w-fit">
          <Logo iconClassName="w-24 h-24" showText={false} />
        </div>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan text-center">
          Informations sur l'Application
        </h2>
        <p className="text-muted-foreground mt-2 text-center">
          Découvrez les détails techniques et la version d'AcademIA.
        </p>
      </div>

      <div className="w-full"> {/* Ensure the container takes full width */}
        <Card className="shadow-md h-full flex-shrink-0">
          <CardHeader className="flex flex-col items-center gap-3 pb-3">
            <Info className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">Détails d'AcademIA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-center prose dark:prose-invert overflow-hidden">
            {/* Section: Détails Généraux */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Général</h3>
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
            </div>

            {/* Section: Développeur */}
            <div className="space-y-3 border-t pt-6 border-muted-foreground/30">
              <h3 className="text-lg font-semibold text-foreground">Développeur</h3>
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Nom du développeur :</span> Mehdi Kacim
              </p>
              <p className="text-base font-semibold text-primary mt-2">
                Developed with love for you, for all ❤️
              </p>
            </div>

            {/* Section: Connectez-vous avec le développeur */}
            <div className="space-y-3 border-t pt-6 border-muted-foreground/30">
              <h3 className="text-lg font-semibold text-foreground">Connectez-vous avec le développeur</h3>
              <div className="flex flex-wrap gap-4 pt-2 justify-center">
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
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default About;