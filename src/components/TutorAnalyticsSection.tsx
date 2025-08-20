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
} from 'recharts';
import { Student, User, Class, Curriculum } from "@/lib/dataModels";
import { getUserFullName } from "@/lib/studentData"; // Assuming this utility is available

interface TutorAnalyticsSectionProps {
  studentProfiles: Student[];
  users: User[];
  classes: Class[];
  curricula: Curriculum[];
}

const TutorAnalyticsSection = ({ studentProfiles, users, classes, curricula }: TutorAnalyticsSectionProps) => {
  const getClassName = (id?: string) => classes.find(c => c.id === id)?.name || 'N/A';
  const getCurriculumName = (id?: string) => curricula.find(c => c.id === id)?.name || 'N/A';

  const supervisedStudents = studentProfiles.slice(0, 5); // Taking first 5 for demo
  const studentsAtRisk = supervisedStudents.filter(s => s.enrolledCoursesProgress.some(ec => ec.modulesProgress.some(mp => mp.sectionsProgress.some(sp => sp.quizResult && !sp.quizResult.passed)))).length;
  const averageStudentProgress = "72%"; // Placeholder

  const recentAlerts = [
    `${getUserFullName(supervisedStudents[0]?.userId || '')} a des difficultés en algèbre.`,
    `${getUserFullName(supervisedStudents[1]?.userId || '')} a terminé le module 3 de Physique.`,
  ].filter(alert => !alert.includes('N/A')); // Filter out alerts for non-existent users

  const tutorStudentPerformanceData = supervisedStudents.map(student => ({
    name: getUserFullName(student.userId),
    score: Math.floor(Math.random() * 40) + 60, // Random scores between 60 and 100
  }));

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
            <CardTitle>Alertes Récentes</CardTitle>
            <CardDescription>Informations importantes sur vos élèves.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {recentAlerts.length === 0 ? (
                <li>Aucune alerte récente.</li>
              ) : (
                recentAlerts.map((alert, index) => (
                  <li key={index}>{alert}</li>
                ))
              )}
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
};

export default TutorAnalyticsSection;