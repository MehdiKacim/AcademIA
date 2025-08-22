import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { useSearchParams, useNavigate } from "react-router-dom"; // Import useSearchParams and useNavigate
import { loadCourses, loadEstablishments, loadCurricula, loadClasses } from "@/lib/courseData";
import { getAllProfiles, getAllStudentCourseProgress } from "@/lib/studentData"; // Import Supabase functions
import CreatorAnalyticsSection from "@/components/CreatorAnalyticsSection";
import StudentAnalyticsSection from "@/components/StudentAnalyticsSection";
import TutorAnalyticsSection from "@/components/TutorAnalyticsSection";
import React, { useState, useEffect } from "react"; // Import useState and useEffect
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Course, Establishment, Curriculum, Class, Profile, StudentCourseProgress } from "@/lib/dataModels"; // Import types

const Analytics = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');
  const courseIdFromUrl = searchParams.get('courseId'); // New: Get courseId from URL
  const navigate = useNavigate(); // Initialize useNavigate

  const [courses, setCourses] = useState<Course[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [studentCourseProgresses, setStudentCourseProgresses] = useState<StudentCourseProgress[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchData = async () => {
      setCourses(await loadCourses());
      setAllProfiles(await getAllProfiles());
      setStudentCourseProgresses(await getAllStudentCourseProgress());
      setClasses(await loadClasses());
      setCurricula(await loadCurricula());
      setEstablishments(await loadEstablishments());
    };
    fetchData();
  }, [currentUserProfile]); // Re-fetch if user profile changes

  // Reset filters when role changes or on initial load
  useEffect(() => {
    setSelectedClassId(undefined);
    setSelectedCurriculumId(undefined);
  }, [currentRole]);

  if (isLoadingUser) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Chargement des analytiques...
        </h1>
        <p className="text-lg text-muted-foreground">
          Veuillez patienter.
        </p>
      </div>
    );
  }

  if (!currentUserProfile) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès Restreint
        </h1>
        <p className="text-lg text-muted-foreground">
          Veuillez vous connecter pour accéder aux analytiques.
        </p>
      </div>
    );
  }

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
    } else if (currentRole === 'creator') {
      return (
        <CreatorAnalyticsSection
          view={view}
          selectedClassId={selectedClassId}
          selectedCurriculumId={selectedCurriculumId}
          selectedCourseId={courseIdFromUrl} // Pass courseId from URL
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
          selectedClassId={selectedClassId}
          selectedCurriculumId={selectedCurriculumId}
          onSendMessageToUser={handleSendMessageToUser} // Pass the new prop
        />
      );
    }
    return null;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        {currentRole === 'student' ? 'Mes Analytiques' : currentRole === 'creator' ? 'Analytiques des Cours' : 'Suivi des Élèves'}
      </h1>

      {(currentRole === 'creator' || currentRole === 'tutor') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <Label htmlFor="select-curriculum">Filtrer par Cursus</Label>
            <Select value={selectedCurriculumId} onValueChange={(value) => {
              setSelectedCurriculumId(value);
              setSelectedClassId(undefined); // Reset class when curriculum changes
            }}>
              <SelectTrigger id="select-curriculum">
                <SelectValue placeholder="Tous les cursus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les cursus</SelectItem>
                {curricula.map(cur => (
                  <SelectItem key={cur.id} value={cur.id}>
                    {cur.name} ({getEstablishmentName(cur.establishment_id)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="select-class">Filtrer par Classe</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger id="select-class">
                <SelectValue placeholder="Toutes les classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les classes</SelectItem>
                {classes
                  .filter(cls => !selectedCurriculumId || selectedCurriculumId === 'all' || cls.curriculum_id === selectedCurriculumId)
                  .map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({curricula.find(c => c.id === cls.curriculum_id)?.name})
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