import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info, Code, Heart, Linkedin, Github } from "lucide-react"; // Import Linkedin and Github icons
import packageJson from '../../package.json'; // Import package.json to get version

const About = () => {
  const appVersion = packageJson.version; // Get version from package.json

  return (
    <div className="space-y-6 p-4"> {/* Added padding and adjusted spacing */}
      <div className="text-center mb-8"> {/* Centered title and description */}
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Informations sur l'Application
        </h2>
        <p className="text-muted-foreground mt-2">
          Détails techniques et version d'AcademIA.
        </p>
      </div>

      <Card className="shadow-md"> {/* Added shadow for better visual separation */}
        <CardHeader className="flex flex-row items-center gap-3 pb-3"> {/* Adjusted padding */}
          <Info className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Détails Généraux</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm"> {/* Adjusted spacing and font size */}
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

      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <Code className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Développeur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Nom du développeur :</span> Mehdi Kacim
          </p>
          <p className="text-base font-semibold text-primary mt-2"> {/* Adjusted font size */}
            Developed with love for you, for all ❤️
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <Heart className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Connectez-vous avec le développeur</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 pt-2"> {/* Adjusted padding */}
          <a 
            href="https://www.linkedin.com/in/mehdi-kacim-333304142?originalSubdomain=fr" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors text-sm"
          >
            <Linkedin className="h-5 w-5" /> {/* Adjusted icon size */}
            LinkedIn
          </a>
          <a 
            href="https://github.com/MehdiKacim" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors text-sm"
          >
            <Github className="h-5 w-5" /> {/* Adjusted icon size */}
            GitHub
          </a>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;