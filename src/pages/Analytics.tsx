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

      switch (view) {
        case 'personal':
          return <StudentAnalyticsSection studentProfile={studentProfile} courses={courses} />;
        case 'quiz-performance':
          return (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Performance aux Quiz</CardTitle>
                <CardDescription>Détails de vos résultats aux quiz.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Contenu pour la performance aux quiz (à implémenter).</p>
                {/* Example: Display a list of quiz results */}
                <ul className="list-disc pl-5 text-sm text-muted-foreground mt-4">
                  {studentProfile.enrolledCoursesProgress.map(cp => {
                    const course = courses.find(c => c.id === cp.courseId);
                    return cp.modulesProgress.map(mp => {
                      const module = course?.modules[mp.moduleIndex];
                      return mp.sectionsProgress.map(sp => {
                        const section = module?.sections[sp.sectionIndex];
                        if (section?.type === 'quiz' && sp.quizResult) {
                          return (
                            <li key={`${cp.courseId}-${mp.moduleIndex}-${sp.sectionIndex}`}>
                              {course?.title} - {module?.title} - {section.title}: {sp.quizResult.score}/{sp.quizResult.total} ({((sp.quizResult.score / sp.quizResult.total) * 100).toFixed(0)}%) - {sp.quizResult.passed ? 'Réussi' : 'Échoué'}
                            </li>
                          );
                        }
                        return null;
                      });
                    });
                  }).flat(3).filter(Boolean)}
                  {studentProfile.enrolledCoursesProgress.length === 0 && <p>Aucun quiz terminé pour le moment.</p>}
                </ul>
              </CardContent>
            </Card>
          );
        case 'aia-engagement':
          return (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Engagement AiA</CardTitle>
                <CardDescription>Statistiques sur votre interaction avec le tuteur IA.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Contenu pour l'engagement AiA (à implémenter).</p>
                <p className="text-sm text-muted-foreground mt-2">Nombre de questions posées : 15</p>
                <p className="text-sm text-muted-foreground">Sujets les plus abordés : Programmation, Algorithmes</p>
              </CardContent>
            </Card>
          );
        default:
          return <StudentAnalyticsSection studentProfile={studentProfile} courses={courses} />; // Default to personal stats
      }
    } else if (currentRole === 'creator') {
      switch (view) {
        case 'overview':
          return <CreatorAnalyticsSection />; // This component already exists and provides an overview
        case 'course-performance':
          return (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Performance des Cours</CardTitle>
                <CardDescription>Analyse détaillée de la complétion et des scores par cours.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Contenu pour la performance des cours (à implémenter).</p>
                {/* Example: List courses with their completion rates */}
                <ul className="list-disc pl-5 text-sm text-muted-foreground mt-4">
                  {courses.map(course => {
                    const totalModules = course.modules.length;
                    const completedModules = course.modules.filter(m => m.isCompleted).length; // Assuming isCompleted is set for creator's view
                    const completionRate = totalModules > 0 ? ((completedModules / totalModules) * 100).toFixed(0) : 0;
                    return (
                      <li key={course.id}>{course.title}: {completionRate}% complété</li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          );
        case 'student-engagement':
          return (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Engagement Élèves</CardTitle>
                <CardDescription>Suivi de l'activité et de l'engagement des apprenants.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Contenu pour l'engagement des élèves (à implémenter).</p>
                <p className="text-sm text-muted-foreground mt-2">Nombre total d'élèves : {studentProfiles.length}</p>
                <p className="text-sm text-muted-foreground">Élèves actifs cette semaine : {Math.floor(studentProfiles.length * 0.7)}</p>
              </CardContent>
            </Card>
          );
        default:
          return <CreatorAnalyticsSection />; // Default to overview
      }
    } else if (currentRole === 'tutor') {
      switch (view) {
        case 'student-monitoring':
          return <TutorAnalyticsSection studentProfiles={studentProfiles} users={users} classes={classes} curricula={curricula} />;
        case 'alerts':
          return (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Alertes & Recommandations</CardTitle>
                <CardDescription>Notifications pour les élèves en difficulté et suggestions d'interventions.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Contenu pour les alertes et recommandations (à implémenter).</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground mt-4">
                  <li>Élève John Doe a échoué au quiz "Variables" (Module 1, Cours Intro JS). Recommandation: Revoir la section.</li>
                  <li>Élève Jane Smith n'a pas accédé au cours "Algorithmes" depuis 5 jours. Recommandation: Envoyer un message de rappel.</li>
                </ul>
              </CardContent>
            </Card>
          );
        case 'class-performance':
          return (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Performance par Classe</CardTitle>
                <CardDescription>Statistiques agrégées par classe.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Contenu pour la performance par classe (à implémenter).</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground mt-4">
                  {classes.map(cls => (
                    <li key={cls.id}>{cls.name} (Moyenne de progression: {Math.floor(Math.random() * 20) + 70}%)</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        default:
          return <TutorAnalyticsSection studentProfiles={studentProfiles} users={users} classes={classes} curricula={curricula} />; // Default to student monitoring
      }
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