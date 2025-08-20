import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Student, User, Class, Curriculum } from "@/lib/dataModels";
import { getUserFullName } from "@/lib/studentData"; // Assuming this utility is available

interface TutorAnalyticsSectionProps {
  studentProfiles: Student[];
  users: User[];
  classes: Class[];
  curricula: Curriculum[];
  view: string | null; // Added view prop
}

const TutorAnalyticsSection = ({ studentProfiles, users, classes, curricula, view }: TutorAnalyticsSectionProps) => {
  const getClassName = (id?: string) => classes.find(c => c.id === id)?.name || 'N/A';
  const getCurriculumName = (id?: string) => curricula.find(c => c.id === id)?.name || 'N/A';

  const supervisedStudents = studentProfiles.slice(0, 5); // Taking first 5 for demo
  const studentsAtRisk = supervisedStudents.filter(s => s.enrolledCoursesProgress.some(ec => ec.modulesProgress.some(mp => mp.sectionsProgress.some(sp => sp.quizResult && !sp.quizResult.passed)))).length;
  const averageStudentProgress = "72%"; // Placeholder

  const recentAlerts = [
    { id: 1, studentName: getUserFullName(supervisedStudents[0]?.userId || ''), description: `a des difficultés en algèbre.`, type: 'warning' },
    { id: 2, studentName: getUserFullName(supervisedStudents[1]?.userId || ''), description: `a terminé le module 3 de Physique.`, type: 'info' },
    { id: 3, studentName: getUserFullName(supervisedStudents[2]?.userId || ''), description: `n'a pas accédé au cours de Mathématiques depuis 3 jours.`, type: 'warning' },
  ].filter(alert => alert.studentName !== 'N/A'); // Filter out alerts for non-existent users

  const tutorStudentPerformanceData = supervisedStudents.map(student => ({
    name: getUserFullName(student.userId),
    score: Math.floor(Math.random() * 40) + 60, // Random scores between 60 and 100
  }));

  const classPerformanceData = classes.map(cls => ({
    name: cls.name,
    avgProgress: Math.floor(Math.random() * 20) + 70, // Dummy average progress
    studentsCount: cls.studentIds.length,
  }));

  // Dummy data for individual student progress trends
  const individualStudentProgressTrends = [
    { name: 'Jan', 'Alice': 65, 'Bob': 70 },
    { name: 'Fév', 'Alice': 70, 'Bob': 75 },
    { name: 'Mar', 'Alice': 75, 'Bob': 80 },
    { name: 'Avr', 'Alice': 80, 'Bob': 85 },
    { name: 'Mai', 'Alice': 85, 'Bob': 90 },
  ];


  if (view === 'student-monitoring') {
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
              <p className="text-2xl font-bold text-primary">{supervisedStudents.length}</p>
              <p className="text-sm text-muted-foreground">Élèves en difficulté : {studentsAtRisk}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Progression Moyenne</CardTitle>
              <CardDescription>Vue d'ensemble de l'avancement de vos élèves.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{averageStudentProgress}</p>
              <p className="text-sm text-muted-foreground">Contactez les enseignants si nécessaire.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Performance des Élèves</CardTitle>
              <CardDescription>Scores moyens de vos élèves.</CardDescription>
            </CardHeader>
            <CardContent className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tutorStudentPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" domain={[0, 100]} />
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
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Tendances de Progression Individuelle</CardTitle>
              <CardDescription>Suivi de la progression de certains élèves au fil du temps.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={individualStudentProgressTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Alice" stroke="hsl(var(--primary))" name="Alice" />
                  <Line type="monotone" dataKey="Bob" stroke="hsl(var(--secondary))" name="Bob" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </>
    );
  } else if (view === 'alerts') {
    return (
      <>
        <p className="text-lg text-muted-foreground mb-8">Notifications pour les élèves en difficulté et suggestions d'interventions.</p>
        <div className="grid gap-6">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Alertes Récentes</CardTitle>
              <CardDescription>Informations importantes sur vos élèves.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                {recentAlerts.length === 0 ? (
                  <li>Aucune alerte récente.</li>
                ) : (
                  recentAlerts.map((alert) => (
                    <li key={alert.id} className={alert.type === 'warning' ? 'text-red-500' : 'text-blue-500'}>
                      **{alert.studentName}** {alert.description}
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Recommandations d'Intervention</CardTitle>
              <CardDescription>Actions suggérées pour aider vos élèves.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                <li>Pour les élèves ayant échoué à un quiz : Recommander de revoir les sections pertinentes ou de poser des questions à AiA.</li>
                <li>Pour les élèves inactifs : Envoyer un message de rappel personnalisé.</li>
                <li>Pour les élèves en avance : Proposer des défis supplémentaires ou des ressources avancées.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </>
    );
  } else if (view === 'class-performance') {
    return (
      <>
        <p className="text-lg text-muted-foreground mb-8">Statistiques agrégées par classe.</p>
        <div className="grid gap-6">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Performance Moyenne par Classe</CardTitle>
              <CardDescription>Progression moyenne et nombre d'élèves par classe.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Bar dataKey="avgProgress" fill="hsl(var(--primary))" name="Progression Moyenne (%)" />
                  <Bar dataKey="studentsCount" fill="hsl(var(--secondary))" name="Nombre d'élèves" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Détail des Classes</CardTitle>
              <CardDescription>Liste des classes avec leurs statistiques clés.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                {classPerformanceData.length === 0 ? (
                  <li>Aucune classe disponible.</li>
                ) : (
                  classPerformanceData.map((cls, index) => (
                    <li key={index}>
                      **{cls.name}**: Progression Moyenne: {cls.avgProgress}%, Élèves: {cls.studentsCount}
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return null; // Should not happen if view is always one of the cases
};

export default TutorAnalyticsSection;