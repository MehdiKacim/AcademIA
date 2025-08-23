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
import { Users, LayoutList, Building2, BarChart2, User, GraduationCap, PenTool, BriefcaseBusiness, School, UsersRound } from "lucide-react"; // Added UsersRound icon

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

  // States for list modals
  const [isDirectorListModalOpen, setIsDirectorListModalOpen] = useState(false);
  const [isDeputyDirectorListModalOpen, setIsDeputyDirectorListModalOpen] = useState(false);
  const [isStudentListModalOpen, setIsStudentListModalOpen] = useState(false);
  const [isProfesseurListModalOpen, setIsProfesseurListModalOpen] = useState(false);
  const [isTutorListModalOpen, setIsTutorListModalOpen] = useState(false);
  const [isCurriculumListModalOpen, setIsCurriculumListModalOpen] = useState(false);
  const [isClassListModalOpen, setIsClassListModalOpen] = useState(false);


  const getRoleCount = (role: Profile['role']) => {
    return allProfiles.filter(p => p.role === role).length;
  };

  const getRoleProfiles = (role: Profile['role']) => {
    return allProfiles.filter(p => p.role === role);
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
    
    return {
      name: est.name,
      students: students,
      professeurs: professeurs,
      tutors: tutors,
      directors: directors,
      deputyDirectors: deputyDirectors,
      curricula: getCurriculumCountForEstablishment(est.id),
      classes: getClassCountForEstablishment(est.id),
    };
  });

  return (
    <>
      <p className="text-lg text-muted-foreground mb-8">Vue d'ensemble des statistiques par établissement.</p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard
          title="Total Établissements"
          description="Nombre d'établissements gérés."
          value={establishments.length}
          icon={Building2}
          onClick={() => setIsEstablishmentDetailModalOpen(true)}
        />
        <AdminStatCard
          title="Personnel de Direction"
          description="Directeurs et Directeurs Adjoints."
          value={getRoleCount('director') + getRoleCount('deputy_director')}
          icon={BriefcaseBusiness}
          onClick={() => {
            setIsDirectorListModalOpen(true); // Open modal for directors
            setIsDeputyDirectorListModalOpen(true); // Open modal for deputy directors (or combine into one list modal)
          }}
        />
        <AdminStatCard
          title="Personnel Pédagogique"
          description="Professeurs et Tuteurs."
          value={getRoleCount('professeur') + getRoleCount('tutor')}
          icon={UsersRound}
          onClick={() => {
            setIsProfesseurListModalOpen(true); // Open modal for professeurs
            setIsTutorListModalOpen(true); // Open modal for tutors (or combine into one list modal)
          }}
        />
        <AdminStatCard
          title="Total Élèves"
          description="Nombre total d'élèves inscrits."
          value={getRoleCount('student')}
          icon={GraduationCap}
          onClick={() => setIsStudentListModalOpen(true)}
        />
        <AdminStatCard
          title="Total Cursus"
          description="Nombre total de cursus créés."
          value={curricula.length}
          icon={LayoutList}
          onClick={() => setIsCurriculumListModalOpen(true)}
        />
        <AdminStatCard
          title="Total Classes"
          description="Nombre total de classes créées."
          value={classes.length}
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

      {/* New list modals */}
      <UserListModal
        isOpen={isDirectorListModalOpen}
        onClose={() => setIsDirectorListModalOpen(false)}
        title="Liste des Directeurs"
        description="Tous les directeurs enregistrés sur la plateforme."
        users={getRoleProfiles('director')}
        establishments={establishments}
      />
      <UserListModal
        isOpen={isDeputyDirectorListModalOpen}
        onClose={() => setIsDeputyDirectorListModalOpen(false)}
        title="Liste des Directeurs Adjoints"
        description="Tous les directeurs adjoints enregistrés sur la plateforme."
        users={getRoleProfiles('deputy_director')}
        establishments={establishments}
      />
      <UserListModal
        isOpen={isStudentListModalOpen}
        onClose={() => setIsStudentListModalOpen(false)}
        title="Liste des Élèves"
        description="Tous les élèves enregistrés sur la plateforme."
        users={getRoleProfiles('student')}
        establishments={establishments}
      />
      <UserListModal
        isOpen={isProfesseurListModalOpen}
        onClose={() => setIsProfesseurListModalOpen(false)}
        title="Liste des Professeurs"
        description="Tous les professeurs enregistrés sur la plateforme."
        users={getRoleProfiles('professeur')}
        establishments={establishments}
      />
      <UserListModal
        isOpen={isTutorListModalOpen}
        onClose={() => setIsTutorListModalOpen(false)}
        title="Liste des Tuteurs"
        description="Tous les tuteurs enregistrés sur la plateforme."
        users={getRoleProfiles('tutor')}
        establishments={establishments}
      />
      <CurriculumListModal
        isOpen={isCurriculumListModalOpen}
        onClose={() => setIsCurriculumListModalOpen(false)}
        title="Liste des Cursus"
        description="Tous les cursus disponibles sur la plateforme."
        curricula={curricula}
        establishments={establishments}
      />
      <ClassListModal
        isOpen={isClassListModalOpen}
        onClose={() => setIsClassListModalOpen(false)}
        title="Liste des Classes"
        description="Toutes les classes créées sur la plateforme."
        classes={classes}
        curricula={curricula}
        establishments={establishments}
      />
    </>
  );
};

export default AdminAnalyticsSection;