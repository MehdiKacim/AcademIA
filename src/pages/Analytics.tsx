import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { loadCourses, loadEstablishments, loadCurricula, loadClasses } from "@/lib/courseData";
import { getAllProfiles, getAllStudentCourseProgress } from "@/lib/studentData";
import CreatorAnalyticsSection from "@/components/CreatorAnalyticsSection";
import StudentAnalyticsSection from "@/components/StudentAnalyticsSection";
import TutorAnalyticsSection from "@/components/TutorAnalyticsSection";
import AdminAnalyticsSection from "@/components/AdminAnalyticsSection";
import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Course, Establishment, Curriculum, Class, Profile, StudentCourseProgress } from "@/lib/dataModels";

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
  const [establishments, setEstablishments] = useState<Establishment[]>([]);

  const [selectedClassFilter, setSelectedClassFilter] = useState<string | undefined>(undefined);
  const [selectedCurriculumFilter, setSelectedCurriculumFilter] = useState<string | undefined>(undefined);
  const [selectedEstablishmentFilter, setSelectedEstablishmentFilter] = useState<string | undefined>(undefined);

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
  }, [currentUserProfile]);

  // Reset filters when role changes or on initial load
  useEffect(() => {
    setSelectedClassFilter(undefined);
    setSelectedCurriculumFilter(undefined);
    setSelectedEstablishmentFilter(undefined);
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
          selectedEstablishmentId={selectedEstablishmentFilter}
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
    } else if (currentRole === 'administrator') {
      return (
        <AdminAnalyticsSection
          establishments={establishments}
          curricula={curricula}
          classes={classes}
          allProfiles={allProfiles}
          selectedEstablishmentFilter={selectedEstablishmentFilter} // Pass the filter here
        />
      );
    } else if (currentRole === 'director' || currentRole === 'deputy_director') {
      return (
        <CreatorAnalyticsSection
          view={view}
          selectedClassId={selectedClassFilter}
          selectedCurriculumId={selectedCurriculumFilter}
          selectedEstablishmentId={currentUserProfile.establishment_id}
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
    <div>
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        {currentRole === 'student' ? 'Mes Analytiques' : currentRole === 'professeur' ? 'Analytiques des Cours' : currentRole === 'tutor' ? 'Suivi des Élèves' : currentRole === 'administrator' ? 'Analytiques Globales' : 'Analytiques de l\'Établissement'}
      </h1>

      {(currentRole === 'administrator' || currentRole === 'creator' || currentRole === 'tutor' || currentRole === 'director' || currentRole === 'deputy_director') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {(currentRole === 'administrator' || currentRole === 'creator' || currentRole === 'director' || currentRole === 'deputy_director') && (
            <div>
              <Label htmlFor="select-establishment">Filtrer par Établissement</Label>
              <Select value={selectedEstablishmentFilter || "all"} onValueChange={(value) => {
                setSelectedEstablishmentFilter(value === "all" ? undefined : value);
                setSelectedCurriculumFilter(undefined);
                setSelectedClassFilter(undefined);
              }}
              disabled={currentRole === 'director' || currentRole === 'deputy_director'}
              >
                <SelectTrigger id="select-establishment">
                  <SelectValue placeholder="Tous les établissements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les établissements</SelectItem>
                  {establishments
                    .filter(est => currentRole === 'administrator' || est.id === currentUserProfile.establishment_id)
                    .map(est => (
                      <SelectItem key={est.id} value={est.id}>
                        {est.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {(currentRole !== 'administrator') && (
            <>
              <div>
                <Label htmlFor="select-curriculum">Filtrer par Cursus</Label>
                <Select value={selectedCurriculumFilter || "all"} onValueChange={(value) => {
                  setSelectedCurriculumFilter(value === "all" ? undefined : value);
                  setSelectedClassFilter(undefined);
                }}>
                  <SelectTrigger id="select-curriculum">
                    <SelectValue placeholder="Tous les cursus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les cursus</SelectItem>
                    {curricula
                      .filter(cur => !selectedEstablishmentFilter || cur.establishment_id === selectedEstablishmentFilter)
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
                  <SelectTrigger id="select-class">
                    <SelectValue placeholder="Toutes les classes" />
                  </SelectTrigger>
                  <SelectContent>
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
            </>
          )}
        </div>
      )}

      {renderAnalyticsContent()}
    </div>
  );
};

export default Analytics;