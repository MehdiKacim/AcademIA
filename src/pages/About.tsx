import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info, Code, Heart, Linkedin, Github } from "lucide-react";
import packageJson from '../../package.json';
import Logo from "@/components/Logo";
import { cn } from '@/lib/utils';

const About = () => {
  const appVersion = packageJson.version;

  return (
    <> {/* Remplacé le div racine par un fragment */}
      <div className="text-center mb-8"> {/* Ajout de mb-8 pour l'espacement */}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        <Card className="shadow-md"> {/* Supprimé h-full flex-shrink-0 */}
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

        <Card className="shadow-md"> {/* Supprimé h-full flex-shrink-0 */}
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

        <Card className="shadow-md"> {/* Supprimé h-full flex-shrink-0 */}
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
      </div>
    </>
  );
};

export default About;