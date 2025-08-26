import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { loadCourses, loadCurricula, loadClasses } from "@/lib/courseData"; // Removed loadEstablishments
import { getAllProfiles, getAllStudentCourseProgress } from "@/lib/studentData";
import CreatorAnalyticsSection from "@/components/CreatorAnalyticsSection";
import StudentAnalyticsSection from "@/components/StudentAnalyticsSection";
import TutorAnalyticsSection from "@/components/TutorAnalyticsSection";
// Removed EstablishmentAdminAnalyticsSection
import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Course, Curriculum, Class, Profile, StudentCourseProgress } from "@/lib/dataModels"; // Removed Establishment

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
  // Removed establishments state

  const [selectedClassFilter, setSelectedClassFilter] = useState<string | undefined>(undefined);
  const [selectedCurriculumFilter, setSelectedCurriculumFilter] = useState<string | undefined>(undefined);
  // Removed selectedEstablishmentFilter

  useEffect(() => {
    const fetchData = async () => {
      setCourses(await loadCourses());
      setAllProfiles(await getAllProfiles());
      setStudentCourseProgresses(await getAllStudentCourseProgress());
      setClasses(await loadClasses());
      setCurricula(await loadCurricula());
      // Removed setEstablishments
    };
    fetchData();
  }, [currentUserProfile]);

  // Reset filters when role changes or on initial load
  useEffect(() => {
    setSelectedClassFilter(undefined);
    setSelectedCurriculumFilter(undefined);
    // Removed setSelectedEstablishmentFilter

    // For directors/deputy directors, default to their establishment and disable selection (now removed)
  }, [currentRole, currentUserProfile?.id]); // Changed dependency from establishment_id to id

  // Removed getEstablishmentName
  const getCurriculumName = (id?: string) => curricula.find(c => c.id === id)?.name || 'N/A';

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
          onSendMessageToUser={handleSendMessageToUser}
        />
      );
    } else if (currentRole === 'administrator' || currentRole === 'director' || currentRole === 'deputy_director') {
      // Removed establishment filter requirement for admin/director roles
      return (
        <CreatorAnalyticsSection // Re-using CreatorAnalyticsSection for admin/director overview
          view={view}
          selectedClassId={selectedClassFilter}
          selectedCurriculumId={selectedCurriculumFilter}
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

  // Removed currentEstablishmentName

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Analytiques
      </h1>

      {(currentRole === 'administrator' || currentRole === 'professeur' || currentRole === 'tutor' || currentRole === 'director' || currentRole === 'deputy_director') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Removed Establishment Filter */}
          {/* Always show curriculum and class filters for relevant roles */}
          <div>
            <Label htmlFor="select-curriculum">Filtrer par Cursus</Label>
            <Select value={selectedCurriculumFilter || "all"} onValueChange={(value) => {
              setSelectedCurriculumFilter(value === "all" ? undefined : value);
              setSelectedClassFilter(undefined);
            }}>
              <SelectTrigger id="select-curriculum">
                <SelectValue placeholder="Tous les cursus" />
              </SelectTrigger>
              <SelectContent className="rounded-android-tile"> {/* Apply rounded-android-tile */}
                <SelectItem value="all">Tous les cursus</SelectItem>
                {curricula
                  .map(cur => (
                    <SelectItem key={cur.id} value={cur.id}>
                      {cur.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="select-class">Filtrer par Classe</Label>
            <Select value={selectedClassFilter || "all"} onValueChange={setSelectedClassFilter}>
              <SelectTrigger id="select-class">
                <SelectValue placeholder="Toutes les classes" />
              </SelectTrigger>
              <SelectContent className="rounded-android-tile"> {/* Apply rounded-android-tile */}
                <SelectItem value="all">Toutes les classes</SelectItem>
                {classes
                  .filter(cls => !selectedCurriculumFilter || selectedCurriculumFilter === 'all' || cls.curriculum_id === selectedCurriculumFilter)
                  .map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({getCurriculumName(cls.curriculum_id)})
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