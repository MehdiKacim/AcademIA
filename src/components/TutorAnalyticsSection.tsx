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
import { Profile, Class, Curriculum, StudentCourseProgress } from "@/lib/dataModels";
import { getUserFullName } from "@/lib/studentData";
import { loadClasses, loadCurricula } from "@/lib/courseData"; // Import loadClasses, loadCurricula

interface TutorAnalyticsSectionProps {
  allProfiles: Profile[];
  allStudentCourseProgresses: StudentCourseProgress[];
  allClasses: Class[];
  allCurricula: Curriculum[];
  view: string | null;
  selectedClassId?: string;
  selectedCurriculumId?: string;
}

const TutorAnalyticsSection = ({ allProfiles, allStudentCourseProgresses, allClasses, allCurricula, view, selectedClassId, selectedCurriculumId }: TutorAnalyticsSectionProps) => {
  const getClassName = (id?: string) => allClasses.find(c => c.id === id)?.name || 'N/A';
  const getCurriculumName = (id?: string) => allCurricula.find(c => c.id === id)?.name || 'N/A';

  // Filter students based on selected class or curriculum
  const filteredStudentProfiles = React.useMemo(() => {
    let students = allProfiles.filter(p => p.role === 'student');
    if (selectedClassId && selectedClassId !== 'all') {
      const selectedClass = allClasses.find(cls => cls.id === selectedClassId);
      if (selectedClass) {
        return students.filter(student => student.class_id === selectedClass.id);
      }
    } else if (selectedCurriculumId && selectedCurriculumId !== 'all') {
      const classesInCurriculum = allClasses.filter(cls => cls.curriculum_id === selectedCurriculumId);
      const studentIdsInCurriculum = new Set(classesInCurriculum.flatMap(cls => allProfiles.filter(p => p.class_id === cls.id && p.role === 'student').map(p => p.id)));
      return students.filter(student => studentIdsInCurriculum.has(student.id));
    }
    return students;
  }, [allProfiles, allClasses, selectedClassId, selectedCurriculumId]);

  const supervisedStudents = filteredStudentProfiles.slice(0, 5); // Taking first 5 for demo from filtered set
  const studentsAtRisk = supervisedStudents.filter(s => allStudentCourseProgresses.some(scp => scp.user_id === s.id && scp.modules_progress.some(mp => mp.sections_progress.some(sp => sp.quiz_result && !sp.quiz_result.passed)))).length;
  const averageStudentProgress = supervisedStudents.length > 0 ? `${Math.floor(Math.random() * 20) + 70}%` : "N/A"; // Placeholder, adjusted for filtered count

  const recentAlerts = [
    { id: 1, studentId: supervisedStudents[0]?.id || '', description: `a échoué au quiz "Variables" du cours "Introduction à la Programmation".`, type: 'warning', recommendation: 'Recommander de revoir la section "Déclaration de Variables" et de poser des questions à AiA.' },
    { id: 2, studentId: supervisedStudents[1]?.id || '', description: `n'a pas accédé au cours "Algorithmes Avancés" depuis 5 jours.`, type: 'warning', recommendation: 'Envoyer un message de rappel personnalisé pour l\'encourager à reprendre.' },
    { id: 3, studentId: supervisedStudents[2]?.id || '', description: `a terminé le module "Physique Quantique" avec un score parfait.`, type: 'info', recommendation: 'Féliciter l\'élève et proposer des défis supplémentaires.' },
  ].filter(alert => alert.studentId && supervisedStudents.some(s => s.id === alert.studentId)); // Filter out alerts for non-existent users or students not in filtered list

  const tutorStudentPerformanceData = supervisedStudents.map(student => ({
    name: `${student.first_name} ${student.last_name}`,
    score: Math.floor(Math.random() * 40) + 60, // Random scores between 60 and 100
  }));

  // Filter classes based on selected curriculum
  const filteredClasses = React.useMemo(() => {
    if (selectedCurriculumId && selectedCurriculumId !== 'all') {
      return allClasses.filter(cls => cls.curriculum_id === selectedCurriculumId);
    }
    return allClasses;
  }, [allClasses, selectedCurriculumId]);

  const classPerformanceData = filteredClasses.map(cls => ({
    name: cls.name,
    avgProgress: Math.floor(Math.random() * 20) + 70, // Dummy average progress
    studentsCount: allProfiles.filter(p => p.class_id === cls.id && filteredStudentProfiles.some(fs => fs.id === p.id)).length, // Count students only from filtered set
  }));

  // Dummy data for individual student progress trends (adjusting names to match filtered students)
  const individualStudentProgressTrends = [
    { name: 'Jan', [supervisedStudents[0]?.first_name || 'Alice']: 65, [supervisedStudents[1]?.first_name || 'Bob']: 70 },
    { name: 'Fév', [supervisedStudents[0]?.first_name || 'Alice']: 70, [supervisedStudents[1]?.first_name || 'Bob']: 75 },
    { name: 'Mar', [supervisedStudents[0]?.first_name || 'Alice']: 75, [supervisedStudents[1]?.first_name || 'Bob']: 80 },
    { name: 'Avr', [supervisedStudents[0]?.first_name || 'Alice']: 80, [supervisedStudents[1]?.first_name || 'Bob']: 85 },
    { name: 'Mai', [supervisedStudents[0]?.first_name || 'Alice']: 85, [supervisedStudents[1]?.first_name || 'Bob']: 90 },
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
              <CardDescription>Vue d'overview de l'avancement de vos élèves.</CardDescription>
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
                  {supervisedStudents[0] && <Line type="monotone" dataKey={`${supervisedStudents[0].first_name}`} stroke="hsl(var(--primary))" name={`${supervisedStudents[0].first_name} ${supervisedStudents[0].last_name}`} />}
                  {supervisedStudents[1] && <Line type="monotone" dataKey={`${supervisedStudents[1].first_name}`} stroke="hsl(var(--secondary))" name={`${supervisedStudents[1].first_name} ${supervisedStudents[1].last_name}`} />}
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
                      **{alert.studentId ? `${allProfiles.find(p => p.id === alert.studentId)?.first_name} ${allProfiles.find(p => p.id === alert.studentId)?.last_name}` : 'N/A'}** {alert.description}
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