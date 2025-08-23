import React, { useState } from 'react';
import AdminStatCard from './analytics/AdminStatCard';
import UserDistributionModal from './analytics/UserDistributionModal';
import PedagogicalStructureModal from './analytics/PedagogicalStructureModal';
import EstablishmentDetailModal from './analytics/EstablishmentDetailModal';
import UserListModal from './analytics/UserListModal';
import CurriculumListModal from './analytics/CurriculumListModal';
import ClassListModal from './analytics/ClassListModal';
import { Profile, Class, Curriculum, Establishment } from "@/lib/dataModels";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, LayoutList, Building2, BarChart2, User, GraduationCap, PenTool, BriefcaseBusiness, School } from "lucide-react";

interface AdminAnalyticsSectionProps {
  establishments: Establishment[];
  curricula: Curriculum[];
  classes: Class[];
  allProfiles: Profile[];
  selectedEstablishmentFilter?: string; // New prop for filtering
}

const AdminAnalyticsSection = ({ establishments, curricula, classes, allProfiles, selectedEstablishmentFilter }: AdminAnalyticsSectionProps) => {
  const [isUserDistributionModalOpen, setIsUserDistributionModalOpen] = useState(false);
  const [isPedagogicalStructureModalOpen, setIsPedagogicalStructureModalOpen] = useState(false);
  const [isEstablishmentDetailModalOpen, setIsEstablishmentDetailModalOpen] = useState(false);

  // States for list modals
  const [isDirectorListModalOpen, setIsDirectorListModalOpen] = useState(false);
  const [isDeputyDirectorListModalOpen, setIsDeputyDirectorListModalOpen] = useState(false);
  const [isStudentListModalOpen, setIsStudentListModalOpen] = useState(false);
  const [isProfesseurListModalOpen, setIsProfesseurListModalOpen] = useState(false);
  const [isTutorListModalOpen, setIsTutorListModalOpen] = useState(false);
  const [isCurriculumListModalOpen, setIsCurriculumListModalOpen] = useState(false);
  const [isClassListModalOpen, setIsClassListModalOpen] = useState(false);

  // Filter data based on selectedEstablishmentFilter
  const filteredEstablishments = selectedEstablishmentFilter
    ? establishments.filter(est => est.id === selectedEstablishmentFilter)
    : establishments;

  const filteredCurricula = selectedEstablishmentFilter
    ? curricula.filter(cur => cur.establishment_id === selectedEstablishmentFilter)
    : curricula;

  const filteredClasses = selectedEstablishmentFilter
    ? classes.filter(cls => cls.establishment_id === selectedEstablishmentFilter)
    : classes;

  const filteredProfiles = selectedEstablishmentFilter
    ? allProfiles.filter(p => p.establishment_id === selectedEstablishmentFilter)
    : allProfiles;

  const getRoleCount = (role: Profile['role']) => {
    return filteredProfiles.filter(p => p.role === role).length;
  };

  const getRoleProfiles = (role: Profile['role']) => {
    return filteredProfiles.filter(p => p.role === role);
  };

  const totalStudents = getRoleCount('student');
  const totalProfesseurs = getRoleCount('professeur');
  const totalTutors = getRoleCount('tutor');
  const totalDirectors = getRoleCount('director');
  const totalDeputyDirectors = getRoleCount('deputy_director');
  const totalCurricula = filteredCurricula.length;
  const totalClasses = filteredClasses.length;

  const currentEstablishmentName = selectedEstablishmentFilter
    ? establishments.find(est => est.id === selectedEstablishmentFilter)?.name || 'Établissement Inconnu'
    : 'Tous les Établissements';

  return (
    <>
      <p className="text-lg text-muted-foreground mb-8">Vue d'ensemble des statistiques pour {currentEstablishmentName}.</p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard
          title={selectedEstablishmentFilter ? "Établissement Actuel" : "Total Établissements"}
          description={selectedEstablishmentFilter ? "Établissement sélectionné." : "Nombre d'établissements gérés."}
          value={selectedEstablishmentFilter ? currentEstablishmentName : filteredEstablishments.length}
          icon={Building2}
          onClick={() => setIsEstablishmentDetailModalOpen(true)}
        />
        <AdminStatCard
          title="Personnel de Direction"
          description="Directeurs et Directeurs Adjoints."
          value={totalDirectors + totalDeputyDirectors}
          icon={BriefcaseBusiness}
          onClick={() => {
            setIsDirectorListModalOpen(true);
          }}
        />
        <AdminStatCard
          title="Personnel Pédagogique"
          description="Professeurs et Tuteurs."
          value={totalProfesseurs + totalTutors}
          icon={Users}
          onClick={() => {
            setIsProfesseurListModalOpen(true);
          }}
        />
        <AdminStatCard
          title="Total Élèves"
          description="Nombre total d'élèves inscrits."
          value={totalStudents}
          icon={GraduationCap}
          onClick={() => setIsStudentListModalOpen(true)}
        />
        <AdminStatCard
          title="Total Cursus"
          description="Nombre total de cursus créés."
          value={totalCurricula}
          icon={LayoutList}
          onClick={() => setIsCurriculumListModalOpen(true)}
        />
        <AdminStatCard
          title="Total Classes"
          description="Nombre total de classes créées."
          value={totalClasses}
          icon={Users}
          onClick={() => setIsClassListModalOpen(true)}
        />

        {/* Widgets to open modals for detailed charts/lists */}
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
        establishments={filteredEstablishments}
        allProfiles={filteredProfiles}
      />
      <PedagogicalStructureModal
        isOpen={isPedagogicalStructureModalOpen}
        onClose={() => setIsPedagogicalStructureModalOpen(false)}
        establishments={filteredEstablishments}
        curricula={filteredCurricula}
        classes={filteredClasses}
      />
      <EstablishmentDetailModal
        isOpen={isEstablishmentDetailModalOpen}
        onClose={() => setIsEstablishmentDetailModalOpen(false)}
        establishments={filteredEstablishments}
        curricula={filteredCurricula}
        classes={filteredClasses}
        allProfiles={filteredProfiles}
      />

      {/* New list modals */}
      <UserListModal
        isOpen={isDirectorListModalOpen}
        onClose={() => setIsDirectorListModalOpen(false)}
        title="Liste des Directeurs"
        description="Tous les directeurs enregistrés sur la plateforme."
        users={getRoleProfiles('director')}
        establishments={establishments} // Use all establishments for name resolution
      />
      <UserListModal
        isOpen={isDeputyDirectorListModalOpen}
        onClose={() => setIsDeputyDirectorListModalOpen(false)}
        title="Liste des Directeurs Adjoints"
        description="Tous les directeurs adjoints enregistrés sur la plateforme."
        users={getRoleProfiles('deputy_director')}
        establishments={establishments} // Use all establishments for name resolution
      />
      <UserListModal
        isOpen={isStudentListModalOpen}
        onClose={() => setIsStudentListModalOpen(false)}
        title="Liste des Élèves"
        description="Tous les élèves enregistrés sur la plateforme."
        users={getRoleProfiles('student')}
        establishments={establishments} // Use all establishments for name resolution
      />
      <UserListModal
        isOpen={isProfesseurListModalOpen}
        onClose={() => setIsProfesseurListModalOpen(false)}
        title="Liste des Professeurs"
        description="Tous les professeurs enregistrés sur la plateforme."
        users={getRoleProfiles('professeur')}
        establishments={establishments} // Use all establishments for name resolution
      />
      <UserListModal
        isOpen={isTutorListModalOpen}
        onClose={() => setIsTutorListModalOpen(false)}
        title="Liste des Tuteurs"
        description="Tous les tuteurs enregistrés sur la plateforme."
        users={getRoleProfiles('tutor')}
        establishments={establishments} // Use all establishments for name resolution
      />
      <CurriculumListModal
        isOpen={isCurriculumListModalOpen}
        onClose={() => setIsCurriculumListModalOpen(false)}
        title="Liste des Cursus"
        description="Tous les cursus disponibles sur la plateforme."
        curricula={filteredCurricula}
        establishments={establishments} // Use all establishments for name resolution
      />
      <ClassListModal
        isOpen={isClassListModalOpen}
        onClose={() => setIsClassListModalOpen(false)}
        title="Liste des Classes"
        description="Toutes les classes créées sur la plateforme."
        classes={filteredClasses}
        curricula={curricula} // Use all curricula for name resolution
        establishments={establishments} // Use all establishments for name resolution
      />
    </>
  );
};

export default AdminAnalyticsSection;