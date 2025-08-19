import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";

const Analytics = () => {
  const { currentRole } = useRole();

  const studentAnalytics = {
    overallProgress: "75%",
    strongestSubject: "Algorithmes",
    weakestSubject: "Bases de données",
    completedCourses: 2,
    hoursSpent: 45,
  };

  const creatorAnalytics = {
    totalCourses: 5,
    publishedCourses: 3,
    totalStudents: 250,
    averageCompletionRate: "68%",
    mostPopularCourse: "Développement Web Fullstack",
  };

  const tutorAnalytics = {
    supervisedStudents: 3,
    studentsAtRisk: 1,
    averageStudentProgress: "72%",
    recentAlerts: [
      "John Doe a des difficultés en algèbre.",
      "Jane Smith a terminé le module 3 de Physique.",
    ],
  };

  const renderAnalyticsContent = () => {
    if (currentRole === 'student') {
      return (
        <>
          <p className="text-lg text-muted-foreground mb-8">Suivez votre progression et identifiez vos points forts et faibles.</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Progression Globale</CardTitle>
                <CardDescription>Votre avancement général dans les cours.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{studentAnalytics.overallProgress}</p>
                <p className="text-sm text-muted-foreground">Cours terminés : {studentAnalytics.completedCourses}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Points Forts</CardTitle>
                <CardDescription>Vos domaines d'excellence.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{studentAnalytics.strongestSubject}</p>
                <p className="text-sm text-muted-foreground">Heures passées : {studentAnalytics.hoursSpent}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Points à Améliorer</CardTitle>
                <CardDescription>Les sujets nécessitant plus d'attention.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{studentAnalytics.weakestSubject}</p>
                <p className="text-sm text-muted-foreground">N'hésitez pas à demander de l'aide à AiA !</p>
              </CardContent>
            </Card>
          </div>
        </>
      );
    } else if (currentRole === 'creator') {
      return (
        <>
          <p className="text-lg text-muted-foreground mb-8">Obtenez des informations détaillées sur la performance de vos cours et l'engagement des élèves.</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Vue d'ensemble des Cours</CardTitle>
                <CardDescription>Statistiques générales de vos contenus.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{creatorAnalytics.totalCourses}</p>
                <p className="text-sm text-muted-foreground">Cours publiés : {creatorAnalytics.publishedCourses}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Statistiques des Élèves</CardTitle>
                <CardDescription>Engagement et progression des apprenants.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{creatorAnalytics.totalStudents}</p>
                <p className="text-sm text-muted-foreground">Élèves inscrits</p>
                <p className="text-sm text-muted-foreground">Taux de complétion moyen : {creatorAnalytics.averageCompletionRate}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Cours Populaire</CardTitle>
                <CardDescription>Votre cours le plus performant.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{creatorAnalytics.mostPopularCourse}</p>
                <p className="text-sm text-muted-foreground">Continuez à créer du contenu de qualité !</p>
              </CardContent>
            </Card>
          </div>
        </>
      );
    } else if (currentRole === 'tutor') {
      return (
        <>
          <p className="text-lg text-muted-foreground mb-8">Surveillez la progression de vos élèves et recevez des alertes importantes.</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Élèves Supervisés</CardTitle>
                <CardDescription>Nombre d'élèves sous votre tutelle.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{tutorAnalytics.supervisedStudents}</p>
                <p className="text-sm text-muted-foreground">Élèves en difficulté : {tutorAnalytics.studentsAtRisk}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Progression Moyenne</CardTitle>
                <CardDescription>Vue d'ensemble de l'avancement de vos élèves.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{tutorAnalytics.averageStudentProgress}</p>
                <p className="text-sm text-muted-foreground">Contactez les enseignants si nécessaire.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Alertes Récentes</CardTitle>
                <CardDescription>Informations importantes sur vos élèves.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {tutorAnalytics.recentAlerts.map((alert, index) => (
                    <li key={index}>{alert}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      );
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