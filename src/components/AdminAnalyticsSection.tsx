import React from 'react';
import AdminStatCard from './analytics/AdminStatCard';
import UserDistributionChart from './analytics/UserDistributionChart';
import PedagogicalStructureChart from './analytics/PedagogicalStructureChart';
import EstablishmentDetailList from './analytics/EstablishmentDetailList';
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
      <p className="text-lg text-muted-foreground mb-8">Vue d'overview des statistiques par établissement.</p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard
          title="Total Établissements"
          description="Nombre d'établissements gérés."
          value={establishments.length}
        />
        <AdminStatCard
          title="Total Directeurs"
          description="Nombre total de directeurs sur la plateforme."
          value={allProfiles.filter(p => p.role === 'director').length}
        />
        <AdminStatCard
          title="Total Directeurs Adjoints"
          description="Nombre total de directeurs adjoints sur la plateforme."
          value={allProfiles.filter(p => p.role === 'deputy_director').length}
        />

        <UserDistributionChart data={establishmentData} />
        <PedagogicalStructureChart data={establishmentData} />
        <EstablishmentDetailList data={establishmentData} />
      </div>
    </>
  );
};

export default AdminAnalyticsSection;