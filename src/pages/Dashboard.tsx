import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext"; // Importation du hook useRole
import { loadCourses } from "@/lib/courseData"; // Import loadCourses

const Dashboard = () => {
  const { currentRole } = useRole(); // Utilisation du hook useRole
  const dummyCourses = loadCourses(); // Charger les cours depuis le localStorage

  const renderDashboardContent = () => {
    if (currentRole === 'student') {
      const enrolledCourses = dummyCourses.filter(c => c.modules.some(m => m.isCompleted)); // Simple filter for "enrolled"
      const completedCoursesCount = enrolledCourses.filter(c => c.modules.every(m => m.isCompleted)).length;
      const totalModulesCompleted = dummyCourses.reduce((acc, course) => acc + course.modules.filter(m => m.isCompleted).length, 0);
      const totalModules = dummyCourses.reduce((acc, course) => acc + course.modules.length, 0);
      const overallProgress = totalModules > 0 ? Math.round((totalModulesCompleted / totalModules) * 100) : 0;

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
              <p className="text-sm text-muted-foreground">Modules terminés : {totalModulesCompleted} / {totalModules}</p>
            </CardContent>
          </Card>
        </div>
      );
    } else if (currentRole === 'creator') {
      const createdCourses = dummyCourses; // Assuming all dummyCourses are created by this creator for demo
      const publishedCoursesCount = createdCourses.filter(c => c.modules.some(m => m.isCompleted)).length; // Simple heuristic for 'published'
      const totalStudents = createdCourses.reduce((acc, course) => acc + Math.floor(Math.random() * 200), 0); // Dummy student count

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
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Mes Élèves</CardTitle>
              <CardDescription>Suivez la progression de vos enfants/protégés.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Vous suivez 2 élèves. John et Jane.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Alertes de Progression</CardTitle>
              <CardDescription>Points nécessitant votre attention.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>John a des difficultés en algèbre. Jane excelle en géométrie.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Communication</CardTitle>
              <CardDescription>Messages récents.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Nouveau message de l'enseignant de John.</p>
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