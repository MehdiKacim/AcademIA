import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MotionCard, // Import MotionCard
} from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { loadCourses, loadCurricula, loadClasses, loadEstablishments, getCurriculumName, getEstablishmentName } from "@/lib/courseData"; // Import getCurriculumName, getEstablishmentName
import { getAllProfiles, getAllStudentCourseProgress } from "@/lib/studentData";
import CreatorAnalyticsSection from "@/components/CreatorAnalyticsSection";
import StudentAnalyticsSection from "@/components/StudentAnalyticsSection";
import TutorAnalyticsSection from "@/components/TutorAnalyticsSection";
import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Course, Curriculum, Class, Profile, StudentCourseProgress, Establishment } from "@/lib/dataModels"; // Import Establishment
import { showError } from "@/utils/toast";
import SimpleItemSelector from '@/components/ui/SimpleItemSelector'; // Import SimpleItemSelector
import { Building2, LayoutList, Users, CalendarDays, Info } from 'lucide-react'; // Import icons

const iconMap: { [key: string]: React.ElementType } = {
  Building2, LayoutList, Users, CalendarDays, Info
};

const Analytics = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');
  const courseIdFromUrl = searchParams.get('courseId');
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [studentCourseProgresses, setStudentCourseProgresses] = useState<StudentCourseProgress[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]); // New state for establishments

  const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null);
  const [selectedCurriculumFilter, setSelectedCurriculumFilter] = useState<string | null>(null);
  const [selectedEstablishmentFilter, setSelectedEstablishmentFilter] = useState<string | 'all'>('all'); // New state for establishment filter

  const [filterEstablishmentSearchQuery, setFilterEstablishmentSearchQuery] = useState('');
  const [filterCurriculumSearchQuery, setFilterCurriculumSearchQuery] = useState('');
  const [filterClassSearchQuery, setFilterClassSearchQuery] = useState('');


  useEffect(() => {
    const fetchData = async () => {
      try {
        setCourses(await loadCourses());
        setAllProfiles(await getAllProfiles());
        setStudentCourseProgresses(await getAllStudentCourseProgress());
        setClasses(await loadClasses());
        setCurricula(await loadCurricula());
        setEstablishments(await loadEstablishments()); // Load establishments
      } catch (error: any) {
        console.error("Error fetching data for Analytics:", error);
        showError(`Erreur lors du chargement des données analytiques: ${error.message}`);
      }
    };
    fetchData();
  }, [currentUserProfile]);

  useEffect(() => {
    setSelectedClassFilter(null);
    setSelectedCurriculumFilter(null);
    // Set default establishment filter based on user role
    if (currentRole === 'administrator') {
      setSelectedEstablishmentFilter('all');
    } else if (currentUserProfile?.establishment_id) {
      setSelectedEstablishmentFilter(currentUserProfile.establishment_id);
    } else {
      setSelectedEstablishmentFilter('all');
    }
  }, [currentRole, currentUserProfile?.id, currentUserProfile?.establishment_id]);

  const handleSendMessageToUser = (userId: string) => {
    navigate(`/messages?contactId=${userId}`);
  };

  const renderAnalyticsContent = () => {
    if (currentRole === 'student') {
      const studentProfile = allProfiles.find(p => p.id === currentUserProfile.id && p.role === 'student');
      if (!studentProfile) {
        return (
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
              Profil Étudiant Introuvable
            </h1>
            <p className="text-lg text-muted-foreground">
              Votre profil étudiant n'a pas pu être chargé pour les analytiques.
            </p>
          </div>
        );
      }
      return <StudentAnalyticsSection studentProfile={studentProfile} courses={courses} studentCourseProgresses={studentCourseProgresses} view={view} />;
    } else if (currentRole === 'professeur') {
      return (
        <CreatorAnalyticsSection
          view={view}
          selectedClassId={selectedClassFilter || undefined}
          selectedCurriculumId={selectedCurriculumFilter || undefined}
          selectedEstablishmentId={selectedEstablishmentFilter === 'all' ? undefined : selectedEstablishmentFilter} // Pass establishment filter
          selectedCourseId={courseIdFromUrl || undefined}
          allCourses={courses}
          allProfiles={allProfiles}
          allStudentCourseProgresses={studentCourseProgresses}
          allClasses={classes}
          allCurricula={curricula}
        />
      );
    } else if (currentRole === 'tutor') {
      return (
        <TutorAnalyticsSection
          allProfiles={allProfiles}
          allStudentCourseProgresses={studentCourseProgresses}
          allClasses={classes}
          allCurricula={curricula}
          view={view}
          selectedClassId={selectedClassFilter || undefined}
          selectedCurriculumId={selectedCurriculumFilter || undefined}
          selectedEstablishmentId={selectedEstablishmentFilter === 'all' ? undefined : selectedEstablishmentFilter} // Pass establishment filter
          onSendMessageToUser={handleSendMessageToUser}
        />
      );
    } else if (currentRole === 'administrator' || currentRole === 'director' || currentRole === 'deputy_director') {
      return (
        <CreatorAnalyticsSection
          view={view}
          selectedClassId={selectedClassFilter || undefined}
          selectedCurriculumId={selectedCurriculumFilter || undefined}
          selectedEstablishmentId={selectedEstablishmentFilter === 'all' ? undefined : selectedEstablishmentFilter} // Pass establishment filter
          selectedCourseId={courseIdFromUrl || undefined}
          allCourses={courses}
          allProfiles={allProfiles}
          allStudentCourseProgresses={studentCourseProgresses}
          allClasses={classes}
          allCurricula={curricula}
        />
      );
    }
    return null;
  };

  const establishmentsOptions = establishments.filter(est => 
    currentRole === 'administrator' || est.id === currentUserProfile?.establishment_id
  ).map(est => ({
    id: est.id,
    label: est.name,
    icon_name: 'Building2',
    description: est.address,
  }));

  const curriculaOptions = curricula.filter(cur => 
    !selectedEstablishmentFilter || selectedEstablishmentFilter === 'all' || cur.establishment_id === selectedEstablishmentFilter
  ).map(cur => ({
    id: cur.id,
    label: cur.name,
    icon_name: 'LayoutList',
    description: cur.description,
  }));

  const classesOptions = classes.filter(cls => 
    (!selectedCurriculumFilter || selectedCurriculumFilter === 'all' || cls.curriculum_id === selectedCurriculumFilter) &&
    (!selectedEstablishmentFilter || selectedEstablishmentFilter === 'all' || cls.establishment_id === selectedEstablishmentFilter)
  ).map(cls => ({
    id: cls.id,
    label: cls.name,
    icon_name: 'Users',
    description: `${getCurriculumName(cls.curriculum_id, curricula)} (${getEstablishmentName(cls.establishment_id, establishments)})`,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Analytiques
      </h1>

      {(currentRole === 'administrator' || currentRole === 'professeur' || currentRole === 'tutor' || currentRole === 'director' || currentRole === 'deputy_director') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {(currentRole === 'administrator' || currentUserProfile?.establishment_id) && (
            <div>
              <Label htmlFor="establishment-filter">Filtrer par Établissement</Label>
              <SimpleItemSelector
                id="establishment-filter"
                options={[{ id: 'all', label: 'Tous les établissements', icon_name: 'Building2' }, ...establishmentsOptions]}
                value={selectedEstablishmentFilter}
                onValueChange={(value) => setSelectedEstablishmentFilter(value)}
                searchQuery={filterEstablishmentSearchQuery}
                onSearchQueryChange={setFilterEstablishmentSearchQuery}
                placeholder="Tous les établissements"
                emptyMessage="Aucun établissement trouvé."
                iconMap={iconMap}
              />
            </div>
          )}
          <div>
            <Label htmlFor="select-curriculum">Filtrer par Cursus</Label>
            <SimpleItemSelector
              id="select-curriculum"
              options={[{ id: 'all', label: 'Tous les cursus', icon_name: 'LayoutList' }, ...curriculaOptions]}
              value={selectedCurriculumFilter}
              onValueChange={(value) => {
                setSelectedCurriculumFilter(value === "all" ? null : value);
                setSelectedClassFilter(null);
              }}
              searchQuery={filterCurriculumSearchQuery}
              onSearchQueryChange={setFilterCurriculumSearchQuery}
              placeholder="Tous les cursus"
              emptyMessage="Aucun cursus trouvé."
              iconMap={iconMap}
            />
          </div>
          <div>
            <Label htmlFor="select-class">Filtrer par Classe</Label>
            <SimpleItemSelector
              id="select-class"
              options={[{ id: 'all', label: 'Toutes les classes', icon_name: 'Users' }, ...classesOptions]}
              value={selectedClassFilter}
              onValueChange={(value) => setSelectedClassFilter(value === "all" ? null : value)}
              searchQuery={filterClassSearchQuery}
              onSearchQueryChange={setFilterClassSearchQuery}
              placeholder="Toutes les classes"
              emptyMessage="Aucune classe trouvée."
              iconMap={iconMap}
            />
          </div>
        </div>
      )}

      {renderAnalyticsContent()}
    </div>
  );
};

export default Analytics;