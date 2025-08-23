import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Profile, Class, Curriculum, Establishment } from "@/lib/dataModels";

interface AdminAnalyticsSectionProps {
  establishments: Establishment[];
  curricula: Curriculum[];
  classes: Class[];
  allProfiles: Profile[];
}

const AdminAnalyticsSection = ({ establishments, curricula, classes, allProfiles }: AdminAnalyticsSectionProps) => {

  const getRoleCountForEstablishment = (establishmentId: string, role: Profile['role']) => {
    return allProfiles.filter(p => p.establishment_id === establishmentId && p.role === role).length;
  };

  const getCurriculumCountForEstablishment = (establishmentId: string) => {
    return curricula.filter(c => c.establishment_id === establishmentId).length;
  };

  const getClassCountForEstablishment = (establishmentId: string) => {
    return classes.filter(c => c.establishment_id === establishmentId).length;
  };

  const establishmentData = establishments.map(est => {
    const students = getRoleCountForEstablishment(est.id, 'student');
    const professeurs = getRoleCountForEstablishment(est.id, 'professeur');
    const tutors = getRoleCountForEstablishment(est.id, 'tutor');
    const directors = getRoleCountForEstablishment(est.id, 'director');
    const deputyDirectors = getRoleCountForEstablishment(est.id, 'deputy_director');
    const totalStaff = professeurs + tutors + directors + deputyDirectors;
    const totalUsers = students + totalStaff;

    return {
      name: est.name,
      students: students,
      professeurs: professeurs,
      tutors: tutors,
      directors: directors,
      deputyDirectors: deputyDirectors,
      curricula: getCurriculumCountForEstablishment(est.id),
      classes: getClassCountForEstablishment(est.id),
      totalUsers: totalUsers,
    };
  });

  return (
    <>
      <p className="text-lg text-muted-foreground mb-8">Vue d'ensemble des statistiques par établissement.</p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Établissements</CardTitle>
            <CardDescription>Nombre d'établissements gérés.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{establishments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Directeurs</CardTitle>
            <CardDescription>Nombre total de directeurs sur la plateforme.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{allProfiles.filter(p => p.role === 'director').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Directeurs Adjoints</CardTitle>
            <CardDescription>Nombre total de directeurs adjoints sur la plateforme.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{allProfiles.filter(p => p.role === 'deputy_director').length}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Distribution des Utilisateurs par Établissement</CardTitle>
            <CardDescription>Nombre d'élèves et de personnel par établissement.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={establishmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Bar dataKey="students" fill="hsl(var(--primary))" name="Élèves" stackId="a" />
                <Bar dataKey="professeurs" fill="hsl(var(--secondary))" name="Professeurs" stackId="a" />
                <Bar dataKey="tutors" fill="hsl(var(--accent))" name="Tuteurs" stackId="a" />
                <Bar dataKey="directors" fill="hsl(var(--destructive))" name="Directeurs" stackId="a" />
                <Bar dataKey="deputyDirectors" fill="hsl(var(--muted-foreground))" name="Directeurs Adjoints" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Structure Pédagogique par Établissement</CardTitle>
            <CardDescription>Nombre de cursus et de classes par établissement.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={establishmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Bar dataKey="curricula" fill="hsl(var(--primary))" name="Cursus" />
                <Bar dataKey="classes" fill="hsl(var(--secondary))" name="Classes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Détail des Établissements</CardTitle>
            <CardDescription>Liste des établissements avec leurs statistiques clés.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
              {establishmentData.length === 0 ? (
                <li>Aucun établissement disponible.</li>
              ) : (
                establishmentData.map((est, index) => (
                  <li key={index}>
                    **{est.name}**: Élèves: {est.students}, Professeurs: {est.professeurs}, Tuteurs: {est.tutors}, Directeurs: {est.directors}, Directeurs Adjoints: {est.deputyDirectors}, Cursus: {est.curricula}, Classes: {est.classes}
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminAnalyticsSection;