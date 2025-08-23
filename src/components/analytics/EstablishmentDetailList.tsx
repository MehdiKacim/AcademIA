import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EstablishmentDetailListProps {
  data: Array<{
    name: string;
    students: number;
    professeurs: number;
    tutors: number;
    directors: number;
    deputyDirectors: number;
    curricula: number;
    classes: number;
  }>;
}

const EstablishmentDetailList = ({ data }: EstablishmentDetailListProps) => {
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Détail des Établissements</CardTitle>
        <CardDescription>Liste des établissements avec leurs statistiques clés.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
          {data.length === 0 ? (
            <li>Aucun établissement disponible.</li>
          ) : (
            data.map((est, index) => (
              <li key={index}>
                **{est.name}**: Élèves: {est.students}, Professeurs: {est.professeurs}, Tuteurs: {est.tutors}, Directeurs: {est.directors}, Directeurs Adjoints: {est.deputyDirectors}, Cursus: {est.curricula}, Classes: {est.classes}
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
};

export default EstablishmentDetailList;