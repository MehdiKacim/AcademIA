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
import { getUserFullName } from "@/lib/studentData";
import { loadClasses, loadCurricula } from "@/lib/courseData"; // Import loadClasses, loadCurricula

interface TutorAnalyticsSectionProps {
  studentProfiles: Student[];
  users: User[];
  classes: Class[];
  curricula: Curriculum[];
  view: string | null;
  selectedClassId?: string;
  selectedCurriculumId?: string;
}

const TutorAnalyticsSection = ({ studentProfiles, users, classes, curricula, view, selectedClassId, selectedCurriculumId }: TutorAnalyticsSectionProps) => {
  const allClasses = loadClasses();
  const allCurricula = loadCurricula();

  const getClassName = (id?: string) => allClasses.find(c => c.id === id)?.name || 'N/A';
  const getCurriculumName = (id?: string) => allCurricula.find(c => c.id === id)?.name || 'N/A';

  // Filter students based on selected class or curriculum
  const filteredStudents = React.useMemo(() => {
    if (selectedClassId && selectedClassId !== 'all') {
      const selectedClass = allClasses.find(cls => cls.id === selectedClassId);
      if (selectedClass) {
        return studentProfiles.filter(student => student.classId === selectedClass.id);
      }
    } else if (selectedCurriculumId && selectedCurriculumId !== 'all') {
      const classesInCurriculum = allClasses.filter(cls => cls.curriculumId === selectedCurriculumId);
      const studentIdsInCurriculum = new Set(classesInCurriculum.flatMap(cls => cls.studentIds));
      return studentProfiles.filter(student => studentIdsInCurriculum.has(student.id));
    }
    return studentProfiles;
  }, [studentProfiles, allClasses, selectedClassId, selectedCurriculumId]);

  const supervisedStudents = filteredStudents.slice(0, 5); // Taking first 5 for demo from filtered set
  const studentsAtRisk = supervisedStudents.filter(s => s.enrolledCoursesProgress.some(ec => ec.modulesProgress.some(mp => mp.sectionsProgress.some(sp => sp.quizResult && !sp.quizResult.passed)))).length;
  const averageStudentProgress = supervisedStudents.length > 0 ? `${Math.floor(Math.random() * 20) + 70}%` : "N/A"; // Placeholder, adjusted for filtered count

  const recentAlerts = [
    { id: 1, studentName: getUserFullName(supervisedStudents[0]?.userId || ''), description: `a échoué au quiz "Variables" du cours "Introduction à la Programmation".`, type: 'warning', recommendation: 'Recommander de revoir la section "Déclaration de Variables" et de poser des questions à AiA.' },
    { id: 2, studentName: getUserFullName(supervisedStudents[1]?.userId || ''), description: `n'a pas accédé au cours "Algorithmes Avancés" depuis 5 jours.`, type: 'warning', recommendation: 'Envoyer un message de rappel personnalisé pour l\'encourager à reprendre.' },
    { id: 3, studentName: getUserFullName(supervisedStudents[2]?.userId || ''), description: `a terminé le module "Physique Quantique" avec un score parfait.`, type: 'info', recommendation: 'Féliciter l\'élève et proposer des défis supplémentaires.' },
  ].filter(alert => alert.studentName !== 'N/A' && supervisedStudents.some(s => getUserFullName(s.userId) === alert.studentName)); // Filter out alerts for non-existent users or students not in filtered list

  const tutorStudentPerformanceData = supervisedStudents.map(student => ({
    name: getUserFullName(student.userId),
    score: Math.floor(Math.random() * 40) + 60, // Random scores between 60 and 100
  }));

  // Filter classes based on selected curriculum
  const filteredClasses = React.useMemo(() => {
    if (selectedCurriculumId && selectedCurriculumId !== 'all') {
      return allClasses.filter(cls => cls.curriculumId === selectedCurriculumId);
    }
    return allClasses;
  }, [allClasses, selectedCurriculumId]);

  const classPerformanceData = filteredClasses.map(cls => ({
    name: cls.name,
    avgProgress: Math.floor(Math.random() * 20) + 70, // Dummy average progress
    studentsCount: cls.studentIds.filter(studentId => filteredStudents.some(s => s.id === studentId)).length, // Count students only from filtered set
  }));

  // Dummy data for individual student progress trends (adjusting names to match filtered students)
  const individualStudentProgressTrends = [
    { name: 'Jan', [getUserFullName(supervisedStudents[0]?.userId || 'Alice')]: 65, [getUserFullName(supervisedStudents[1]?.userId || 'Bob')]: 70 },
    { name: 'Fév', [getUserFullName(supervisedStudents[0]?.userId || 'Alice')]: 70, [getUserFullName(supervisedStudents[1]?.userId || 'Bob')]: 75 },
    { name: 'Mar', [getUserFullName(supervisedStudents[0]?.userId || 'Alice')]: 75, [getUserFullName(supervisedStudents[1]?.userId || 'Bob')]: 80 },
    { name: 'Avr', [getUserFullName(supervisedStudents[0]?.userId || 'Alice')]: 80, [getUserFullName(supervisedStudents[1]?.userId || 'Bob')]: 85 },
    { name: 'Mai', [getUserFullName(supervisedStudents[0]?.userId || 'Alice')]: 85, [getUserFullName(supervisedStudents[1]?.userId || 'Bob')]: 90 },
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
                  {supervisedStudents[0] && <Line type="monotone" dataKey={getUserFullName(supervisedStudents[0].userId)} stroke="hsl(var(--primary))" name={getUserFullName(supervisedStudents[0].userId)} />}
                  {supervisedStudents[1] && <Line type="monotone" dataKey={getUserFullName(supervisedStudents[1].userId)} stroke="hsl(var(--secondary))" name={getUserFullName(supervisedStudents[1].userId)} />}
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
                      {alert.recommendation && <span className="block text-xs italic mt-1">Recommandation: {alert.recommendation}</span>}
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
                  <li>Aucune classe disponible pour les filtres sélectionnés.</li>
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

  return null;
};

export default TutorAnalyticsSection;