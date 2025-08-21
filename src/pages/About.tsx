import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info, Code, Heart, Linkedin, Github } from "lucide-react"; // Import Linkedin and Github icons
import packageJson from '../../package.json'; // Import package.json to get version

const About = () => {
  const appVersion = packageJson.version; // Get version from package.json

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        À Propos d'AcademIA
      </h1>
      <p className="text-lg text-muted-foreground">
        Découvrez les informations sur l'application et son développement.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-6 w-6 text-primary" />
            Informations sur l'Application
          </CardTitle>
          <CardDescription>
            Détails techniques et version.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Nom de l'application :</span> AcademIA
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Version :</span> {appVersion}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Mentions Légales :</span>
            <br />
            &copy; {new Date().getFullYear()} AcademIA. Tous droits réservés.
            <br />
            Les contenus et fonctionnalités de cette application sont la propriété exclusive d'AcademIA.
            Toute reproduction ou distribution non autorisée est strictement interdite.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-6 w-6 text-primary" />
            Développeur
          </CardTitle>
          <CardDescription>
            L'équipe derrière AcademIA.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Nom du développeur :</span> Mehdi Kacim
          </p>
          <p className="text-lg font-semibold text-primary">
            Developed with love for you, for all ❤️
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            Connectez-vous avec le développeur
          </CardTitle>
          <CardDescription>
            Retrouvez Mehdi Kacim sur ses réseaux professionnels.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <a 
            href="https://www.linkedin.com/in/mehdi-kacim-333304142?originalSubdomain=fr" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors"
          >
            <Linkedin className="h-6 w-6" />
            LinkedIn
          </a>
          <a 
            href="https://github.com/MehdiKacim" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <Github className="h-6 w-6" />
            GitHub
          </a>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;