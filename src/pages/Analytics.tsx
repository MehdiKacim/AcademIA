import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { useSearchParams } from "react-router-dom"; // Import useSearchParams
import { loadCourses, loadEstablishments, loadCurricula, loadClasses } from "@/lib/courseData";
import { loadUsers, loadStudents, loadCreatorProfiles, loadTutorProfiles, getStudentProfileByUserId } from "@/lib/studentData";
import CreatorAnalyticsSection from "@/components/CreatorAnalyticsSection";
import StudentAnalyticsSection from "@/components/StudentAnalyticsSection"; // New import
import TutorAnalyticsSection from "@/components/TutorAnalyticsSection";     // New import

const Analytics = () => {
  const { currentUser, currentRole } = useRole();
  const [searchParams] = useSearchParams(); // Get search parameters
  const view = searchParams.get('view'); // Get the 'view' parameter

  const courses = loadCourses();
  const users = loadUsers();
  const studentProfiles = loadStudents();
  const classes = loadClasses();
  const curricula = loadCurricula();

  if (!currentUser) {
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

  const renderAnalyticsContent = () => {
    if (currentRole === 'student') {
      const studentProfile = getStudentProfileByUserId(currentUser.id);
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
      return <StudentAnalyticsSection studentProfile={studentProfile} courses={courses} view={view} />;
    } else if (currentRole === 'creator') {
      return <CreatorAnalyticsSection view={view} />;
    } else if (currentRole === 'tutor') {
      return <TutorAnalyticsSection studentProfiles={studentProfiles} users={users} classes={classes} curricula={curricula} view={view} />;
    }
    return null;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        {currentRole === 'student' ? 'Mes Analytiques' : currentRole === 'creator' ? 'Analytiques des Cours' : 'Suivi des Élèves'}
      </h1>
      {renderAnalyticsContent()}
    </div>
  );
};

export default Analytics;