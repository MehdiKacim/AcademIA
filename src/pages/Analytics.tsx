import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { loadCourses, loadCurricula, loadClasses, loadEstablishments } from "@/lib/courseData"; // Import loadEstablishments
import { getAllProfiles, getAllStudentCourseProgress } from "@/lib/studentData";
import CreatorAnalyticsSection from "@/components/CreatorAnalyticsSection";
import StudentAnalyticsSection from "@/components/StudentAnalyticsSection";
import TutorAnalyticsSection from "@/components/TutorAnalyticsSection";
import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Course, Curriculum, Class, Profile, StudentCourseProgress, Establishment } from "@/lib/dataModels"; // Import Establishment
import { showError } from "@/utils/toast";

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

  const [selectedClassFilter, setSelectedClassFilter] = useState<string | undefined>(undefined);
  const [selectedCurriculumFilter, setSelectedCurriculumFilter] = useState<string | undefined>(undefined);
  const [selectedEstablishmentFilter, setSelectedEstablishmentFilter] = useState<string | 'all'>('all'); // New state for establishment filter

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
    setSelectedClassFilter(undefined);
    setSelectedCurriculumFilter(undefined);
    // Set default establishment filter based on user role
    if (currentRole === 'administrator') {
      setSelectedEstablishmentFilter('all');
    } else if (currentUserProfile?.establishment_id) {
      setSelectedEstablishmentFilter(currentUserProfile.establishment_id);
    } else {
      setSelectedEstablishmentFilter('all');
    }
  }, [currentRole, currentUserProfile?.id, currentUserProfile?.establishment_id]);

  const getCurriculumName = (id?: string) => curricula.find(c => c.id === id)?.name || 'N/A';
  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';

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
          selectedClassId={selectedClassFilter}
          selectedCurriculumId={selectedCurriculumFilter}
          selectedEstablishmentId={selectedEstablishmentFilter === 'all' ? undefined : selectedEstablishmentFilter} // Pass establishment filter
          selectedCourseId={courseIdFromUrl}
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
          selectedClassId={selectedClassFilter}
          selectedCurriculumId={selectedCurriculumFilter}
          selectedEstablishmentId={selectedEstablishmentFilter === 'all' ? undefined : selectedEstablishmentFilter} // Pass establishment filter
          onSendMessageToUser={handleSendMessageToUser}
        />
      );
    } else if (currentRole === 'administrator' || currentRole === 'director' || currentRole === 'deputy_director') {
      return (
        <CreatorAnalyticsSection
          view={view}
          selectedClassId={selectedClassFilter}
          selectedCurriculumId={selectedCurriculumFilter}
          selectedEstablishmentId={selectedEstablishmentFilter === 'all' ? undefined : selectedEstablishmentFilter} // Pass establishment filter
          selectedCourseId={courseIdFromUrl}
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
              <Select value={selectedEstablishmentFilter} onValueChange={(value: string | 'all') => setSelectedEstablishmentFilter(value)}>
                <SelectTrigger id="establishment-filter" className="rounded-android-tile">
                  <SelectValue placeholder="Tous les établissements" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-lg bg-background/80 rounded-android-tile">
                  <SelectItem value="all">Tous les établissements</SelectItem>
                  {establishments.filter(est => 
                    currentRole === 'administrator' || est.id === currentUserProfile?.establishment_id
                  ).map(est => (
                    <SelectItem key={est.id} value={est.id}>
                      {est.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="select-curriculum">Filtrer par Cursus</Label>
            <Select value={selectedCurriculumFilter || "all"} onValueChange={(value) => {
              setSelectedCurriculumFilter(value === "all" ? undefined : value);
              setSelectedClassFilter(undefined);
            }}>
              <SelectTrigger id="select-curriculum" className="rounded-android-tile">
                <SelectValue placeholder="Tous les cursus" />
              </SelectTrigger>
              <SelectContent className="rounded-android-tile">
                <SelectItem value="all">Tous les cursus</SelectItem>
                {curricula
                  .filter(cur => !selectedEstablishmentFilter || selectedEstablishmentFilter === 'all' || cur.establishment_id === selectedEstablishmentFilter)
                  .map(cur => (
                    <SelectItem key={cur.id} value={cur.id}>
                      {cur.name} ({getEstablishmentName(cur.establishment_id)})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="select-class">Filtrer par Classe</Label>
            <Select value={selectedClassFilter || "all"} onValueChange={setSelectedClassFilter}>
              <SelectTrigger id="select-class" className="rounded-android-tile">
                <SelectValue placeholder="Toutes les classes" />
              </SelectTrigger>
              <SelectContent className="rounded-android-tile">
                <SelectItem value="all">Toutes les classes</SelectItem>
                {classes
                  .filter(cls => !selectedCurriculumFilter || selectedCurriculumFilter === 'all' || cls.curriculum_id === selectedCurriculumFilter)
                  .filter(cls => !selectedEstablishmentFilter || selectedEstablishmentFilter === 'all' || cls.establishment_id === selectedEstablishmentFilter)
                  .map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({getCurriculumName(cls.curriculum_id)}) ({getEstablishmentName(cls.establishment_id)})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {renderAnalyticsContent()}
    </div>
  );
};

export default Analytics;