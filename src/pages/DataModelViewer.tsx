import React from 'react';
import { CardDescription } from "@/components/ui/card"; // Keep CardDescription if needed for the page title
import DataModelContent from '@/components/DataModelContent'; // Import the new content component

const DataModelViewer = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"> {/* Added responsive padding and max-width */}
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Modèle de Données de l'Application
      </h1>
      <p className="text-lg text-muted-foreground">
        Voici la structure des données utilisées dans l'application, telles que définies dans les interfaces TypeScript.
      </p>

      <DataModelContent />
    </div>
  );
};

export default DataModelViewer;