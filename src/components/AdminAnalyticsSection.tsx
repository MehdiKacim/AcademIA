import React, { useState } from 'react';
import AdminStatCard from './analytics/AdminStatCard';
import UserDistributionModal from './analytics/UserDistributionModal';
import PedagogicalStructureModal from './analytics/PedagogicalStructureModal';
import EstablishmentDetailModal from './analytics/EstablishmentDetailModal';
import { Profile, Class, Curriculum, Establishment } from "@/lib/dataModels";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, LayoutList, Building2, BarChart2 } from "lucide-react";

interface AdminAnalyticsSectionProps {
  establishments: Establishment[];
  curricula: Curriculum[];
  classes: Class[];
  allProfiles: Profile[];
}

const AdminAnalyticsSection = ({ establishments, curricula, classes, allProfiles }: AdminAnalyticsSectionProps) => {
  const [isUserDistributionModalOpen, setIsUserDistributionModalOpen] = useState(false);
  const [isPedagogicalStructureModalOpen, setIsPedagogicalStructureModalOpen] = useState(false);
  const [isEstablishmentDetailModalOpen, setIsEstablishmentDetailModalOpen] = useState(false);

  const getRoleCount = (role: Profile['role']) => {
    return allProfiles.filter(p => p.role === role).length;
  };

  const totalStudents = getRoleCount('student');
  const totalProfesseurs = getRoleCount('professeur');
  const totalTutors = getRoleCount('tutor');
  const totalCurricula = curricula.length;
  const totalClasses = classes.length;

  return (
    <>
      <p className="text-lg text-muted-foreground mb-8">Vue d'ensemble des statistiques par établissement.</p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard
          title="Total Établissements"
          description="Nombre d'établissements gérés."
          value={establishments.length}
        />
        <AdminStatCard
          title="Total Directeurs"
          description="Nombre total de directeurs sur la plateforme."
          value={getRoleCount('director')}
        />
        <AdminStatCard
          title="Total Directeurs Adjoints"
          description="Nombre total de directeurs adjoints sur la plateforme."
          value={getRoleCount('deputy_director')}
        />
        <AdminStatCard
          title="Total Élèves"
          description="Nombre total d'élèves inscrits."
          value={totalStudents}
        />
        <AdminStatCard
          title="Total Professeurs"
          description="Nombre total de professeurs."
          value={totalProfesseurs}
        />
        <AdminStatCard
          title="Total Tuteurs"
          description="Nombre total de tuteurs."
          value={totalTutors}
        />
        <AdminStatCard
          title="Total Cursus"
          description="Nombre total de cursus créés."
          value={totalCurricula}
        />
        <AdminStatCard
          title="Total Classes"
          description="Nombre total de classes créées."
          value={totalClasses}
        />

        {/* Widgets to open modals for detailed views */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setIsUserDistributionModalOpen(true)}>
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Distribution des Utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Voir la répartition des rôles par établissement.</CardDescription>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setIsPedagogicalStructureModalOpen(true)}>
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <LayoutList className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Structure Pédagogique</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Voir le nombre de cursus et classes par établissement.</CardDescription>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setIsEstablishmentDetailModalOpen(true)}>
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Détail des Établissements</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Voir toutes les statistiques détaillées par établissement.</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Modals for detailed views */}
      <UserDistributionModal
        isOpen={isUserDistributionModalOpen}
        onClose={() => setIsUserDistributionModalOpen(false)}
        establishments={establishments}
        allProfiles={allProfiles}
      />
      <PedagogicalStructureModal
        isOpen={isPedagogicalStructureModalOpen}
        onClose={() => setIsPedagogicalStructureModalOpen(false)}
        establishments={establishments}
        curricula={curricula}
        classes={classes}
      />
      <EstablishmentDetailModal
        isOpen={isEstablishmentDetailModalOpen}
        onClose={() => setIsEstablishmentDetailModalOpen(false)}
        establishments={establishments}
        curricula={curricula}
        classes={classes}
        allProfiles={allProfiles}
      />
    </>
  );
};

export default AdminAnalyticsSection;