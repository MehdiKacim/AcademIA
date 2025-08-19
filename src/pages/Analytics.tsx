import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { loadCourses } from "@/lib/courseData"; // Import loadCourses
import { dummyStudents } from "@/lib/studentData"; // Import dummyStudents

const Analytics = () => {
  const { currentRole } = useRole();
  const dummyCourses = loadCourses(); // Charger les cours depuis le localStorage

  // Données fictives pour les analytiques textuelles
  const studentAnalytics = {
    overallProgress: "75%", // Will be calculated
    strongestSubject: "Algorithmes",
    weakestSubject: "Bases de données",
    completedCourses: 0, // Will be calculated
    hoursSpent: 45,
  };

  const creatorAnalytics = {
    totalCourses: 0, // Will be calculated
    publishedCourses: 0, // Will be calculated
    totalStudents: 0, // Will be calculated
    averageCompletionRate: "68%",
    mostPopularCourse: "Développement Web Fullstack",
  };

  const tutorAnalytics = {
    supervisedStudents: dummyStudents.length, // Utiliser le nombre réel d'élèves fictifs
    studentsAtRisk: 1,
    averageStudentProgress: "72%",
    recentAlerts: [
      `${dummyStudents[0]?.firstName} ${dummyStudents[0]?.lastName} a des difficultés en algèbre.`, // Changement
      `${dummyStudents[1]?.firstName} ${dummyStudents[1]?.lastName} a terminé le module 3 de Physique.`, // Changement
    ],
  };

  // Calculate dynamic data for student role
  if (currentRole === 'student') {
    const completedCourses = dummyCourses.filter(c => c.modules.every(m => m.isCompleted));
    studentAnalytics.completedCourses = completedCourses.length;
    const totalModulesCompleted = dummyCourses.reduce((acc, course) => acc + course.modules.filter(m => m.isCompleted).length, 0);
    const totalModules = dummyCourses.reduce((acc, course) => acc + course.modules.length, 0);
    studentAnalytics.overallProgress = totalModules > 0 ? `${Math.round((totalModulesCompleted / totalModules) * 100)}%` : "0%";
  }

  // Calculate dynamic data for creator role
  if (currentRole === 'creator') {
    creatorAnalytics.totalCourses = dummyCourses.length;
    creatorAnalytics.publishedCourses = dummyCourses.filter(c => c.modules.some(m => m.isCompleted)).length; // Simple heuristic for 'published'
    creatorAnalytics.totalStudents = dummyCourses.reduce((acc, course) => acc + Math.floor(Math.random() * 200), 0); // Dummy student count
  }

  // Données fictives pour les graphiques
  const studentProgressData = [
    { name: 'Jan', progress: 30 },
    { name: 'Fév', progress: 45 },
    { name: 'Mar', progress: 60 },
    { name: 'Avr', progress: 75 },
    { name: 'Mai', progress: 80 },
  ];

  const creatorCourseData = dummyCourses.map(course => ({
    name: course.title.length > 10 ? course.title.substring(0, 10) + '...' : course.title,
    students: Math.floor(Math.random() * 200), // Dummy data
    completion: Math.floor(Math.random() * 100), // Dummy data
  }));

  const tutorStudentPerformanceData = dummyStudents.map(student => ({ // Utiliser les vrais élèves
    name: `${student.firstName} ${student.lastName}`,
    score: Math.floor(Math.random() * 40) + 60, // Scores aléatoires entre 60 et 100
  }));

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
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Historique de Progression</CardTitle>
                <CardDescription>Votre progression au fil du temps.</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={studentProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="progress" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} name="Progression (%)" />
                  </LineChart>
                </ResponsiveContainer>
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
                <CardTitle>Vue d'overview des Cours</CardTitle>
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
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Performance des Cours</CardTitle>
                <CardDescription>Nombre d'élèves et taux de complétion par cours.</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={creatorCourseData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend />
                    <Bar dataKey="students" fill="hsl(var(--primary))" name="Élèves Inscrits" />
                    <Bar dataKey="completion" fill="hsl(var(--secondary))" name="Taux de Complétion (%)" />
                  </BarChart>
                </ResponsiveContainer>
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
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Performance des Élèves</CardTitle>
                <CardDescription>Scores moyens de vos élèves.</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tutorStudentPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend />
                    <Bar dataKey="score" fill="hsl(var(--primary))" name="Score Moyen (%)" />
                  </BarChart>
                </ResponsiveContainer>
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