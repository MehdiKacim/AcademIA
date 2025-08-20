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
import { loadCourses, loadEstablishments, loadCurricula, loadClasses } from "@/lib/courseData";
import { loadUsers, loadStudents, loadCreatorProfiles, loadTutorProfiles, getStudentProfileByUserId } from "@/lib/studentData";
import CreatorAnalyticsSection from "@/components/CreatorAnalyticsSection";

const Analytics = () => {
  const { currentUser, currentRole } = useRole();
  const courses = loadCourses();
  const users = loadUsers();
  const studentProfiles = loadStudents();

  // Helper to get full name from userId
  const getUserFullName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'N/A';
  };

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

  // Données fictives pour les analytiques textuelles
  const studentAnalytics = {
    overallProgress: "0%",
    strongestSubject: "N/A",
    weakestSubject: "N/A",
    completedCourses: 0,
    hoursSpent: 0,
  };

  const tutorAnalytics = {
    supervisedStudents: studentProfiles.length,
    studentsAtRisk: 0,
    averageStudentProgress: "0%",
    recentAlerts: [],
  };

  // Calculate dynamic data for student role
  if (currentRole === 'student') {
    const studentProfile = getStudentProfileByUserId(currentUser.id);
    if (studentProfile) {
      const completedCourses = courses.filter(c => {
        const progress = studentProfile.enrolledCoursesProgress.find(ec => ec.courseId === c.id);
        return progress && progress.modulesProgress.every(m => m.isCompleted);
      });
      studentAnalytics.completedCourses = completedCourses.length;

      const totalModulesCompleted = studentProfile.enrolledCoursesProgress.reduce((acc, courseProgress) =>
        acc + courseProgress.modulesProgress.filter(m => m.isCompleted).length, 0
      );
      const totalModulesAvailable = courses.reduce((acc, course) => acc + course.modules.length, 0);
      studentAnalytics.overallProgress = totalModulesAvailable > 0 ? `${Math.round((totalModulesCompleted / totalModulesAvailable) * 100)}%` : "0%";

      // Dummy data for strongest/weakest subject and hours spent
      studentAnalytics.strongestSubject = "Algorithmes";
      studentAnalytics.weakestSubject = "Bases de données";
      studentAnalytics.hoursSpent = 45;
    }
  } else if (currentRole === 'tutor') {
    // Dummy data for tutor analytics
    tutorAnalytics.studentsAtRisk = studentProfiles.filter(s => s.enrolledCoursesProgress.some(ec => ec.modulesProgress.some(mp => mp.sectionsProgress.some(sp => sp.quizResult && !sp.quizResult.passed)))).length;
    tutorAnalytics.averageStudentProgress = "72%"; // Placeholder
    tutorAnalytics.recentAlerts = [
      `${getUserFullName(studentProfiles[0]?.userId)} a des difficultés en algèbre.`,
      `${getUserFullName(studentProfiles[1]?.userId)} a terminé le module 3 de Physique.`,
    ].filter(Boolean); // Filter out undefined if studentProfiles are empty
  }

  // Données fictives pour les graphiques
  const studentProgressData = [
    { name: 'Jan', progress: 30 },
    { name: 'Fév', progress: 45 },
    { name: 'Mar', progress: 60 },
    { name: 'Avr', progress: 75 },
    { name: 'Mai', progress: 80 },
  ];

  const tutorStudentPerformanceData = studentProfiles.map(student => ({
    name: getUserFullName(student.userId),
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
        <CreatorAnalyticsSection />
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