import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { loadCourses } from "@/lib/courseData";
import { loadStudents, loadCreatorProfiles, loadTutorProfiles, getStudentProfileByUserId } from "@/lib/studentData"; // Import new data loaders

const Dashboard = () => {
  const { currentUser, currentRole } = useRole();
  const courses = loadCourses();
  const students = loadStudents(); // Load all student profiles
  const creatorProfiles = loadCreatorProfiles();
  const tutorProfiles = loadTutorProfiles();

  const renderDashboardContent = () => {
    if (!currentUser) {
      return (
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
            Accès Restreint
          </h1>
          <p className="text-lg text-muted-foreground">
            Veuillez vous connecter pour accéder au tableau de bord.
          </p>
        </div>
      );
    }

    if (currentRole === 'student') {
      const studentProfile = getStudentProfileByUserId(currentUser.id);
      if (!studentProfile) {
        return (
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
              Profil Étudiant Introuvable
            </h1>
            <p className="text-lg text-muted-foreground">
              Votre profil étudiant n'a pas pu être chargé.
            </p>
          </div>
        );
      }

      const enrolledCourses = courses.filter(c => studentProfile.enrolledCoursesProgress.some(ec => ec.courseId === c.id));
      const completedCoursesCount = enrolledCourses.filter(c => {
        const progress = studentProfile.enrolledCoursesProgress.find(ec => ec.courseId === c.id);
        return progress && progress.modulesProgress.every(m => m.isCompleted);
      }).length;

      const totalModulesCompleted = studentProfile.enrolledCoursesProgress.reduce((acc, courseProgress) =>
        acc + courseProgress.modulesProgress.filter(m => m.isCompleted).length, 0
      );
      const totalModulesAvailable = courses.reduce((acc, course) => acc + course.modules.length, 0);
      const overallProgress = totalModulesAvailable > 0 ? Math.round((totalModulesCompleted / totalModulesAvailable) * 100) : 0;

      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Mes Cours Actuels</CardTitle>
              <CardDescription>Continuez votre apprentissage.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Vous avez {enrolledCourses.length} cours en cours ou terminés.</p>
              <p className="text-sm text-muted-foreground">Reprenez là où vous en étiez !</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cours Terminés</CardTitle>
              <CardDescription>Votre succès jusqu'à présent.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Vous avez terminé {completedCoursesCount} cours.</p>
              <p className="text-sm text-muted-foreground">Continuez sur cette lancée !</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Progression Globale</CardTitle>
              <CardDescription>Votre avancement général.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{overallProgress}%</p>
              <p className="text-sm text-muted-foreground">Modules terminés : {totalModulesCompleted} / {totalModulesAvailable}</p>
            </CardContent>
          </Card>
        </div>
      );
    } else if (currentRole === 'creator') {
      const createdCourses = courses; // Assuming all courses are created by this creator for demo
      const publishedCoursesCount = createdCourses.filter(c => c.modules.some(m => m.isCompleted)).length; // Simple heuristic for 'published'
      const totalStudents = students.length; // Total students in the system

      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Mes Cours Créés</CardTitle>
              <CardDescription>Gérez vos contenus d'apprentissage.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Vous avez créé {createdCourses.length} cours.</p>
              <p className="text-sm text-muted-foreground">{publishedCoursesCount} sont publiés.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Statistiques des Élèves</CardTitle>
              <CardDescription>Vue d'overview de la progression.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{totalStudents} élèves inscrits au total.</p>
              <p className="text-sm text-muted-foreground">Taux de complétion moyen : ~70% (estimation)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Nouveaux Inscrits</CardTitle>
              <CardDescription>Les derniers arrivants.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>5 nouveaux élèves cette semaine.</p>
            </CardContent>
          </Card>
        </div>
      );
    } else if (currentRole === 'tutor') {
      const supervisedStudents = students.slice(0, 2); // Just taking first two for demo
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Mes Élèves</CardTitle>
              <CardDescription>Suivez la progression de vos enfants/protégés.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Vous suivez {supervisedStudents.length} élèves : {supervisedStudents.map(s => `${s.firstName} ${s.lastName}`).join(', ')}.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Alertes de Progression</CardTitle>
              <CardDescription>Points nécessitant votre attention.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{supervisedStudents[0]?.firstName} a des difficultés en algèbre. {supervisedStudents[1]?.firstName} excelle en géométrie.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Communication</CardTitle>
              <CardDescription>Messages récents.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Nouveau message de l'enseignant de {supervisedStudents[0]?.firstName}.</p>
            </CardContent>
          </Card>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Tableau de bord {currentRole === 'student' ? 'Élève' : currentRole === 'creator' ? 'Créateur' : 'Tuteur'}
      </h1>
      {renderDashboardContent()}
    </div>
  );
};

export default Dashboard;