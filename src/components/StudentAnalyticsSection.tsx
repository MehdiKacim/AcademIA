import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Student, Course } from "@/lib/dataModels";

interface StudentAnalyticsSectionProps {
  studentProfile: Student;
  courses: Course[];
}

const StudentAnalyticsSection = ({ studentProfile, courses }: StudentAnalyticsSectionProps) => {
  const enrolledCourses = courses.filter(c => studentProfile.enrolledCoursesProgress.some(ec => ec.courseId === c.id));
  const completedCoursesCount = enrolledCourses.filter(c => {
    const progress = studentProfile.enrolledCoursesProgress.find(ec => ec.courseId === c.id);
    return progress && progress.modulesProgress.every(m => m.isCompleted);
  }).length;

  const totalModulesCompleted = studentProfile.enrolledCoursesProgress.reduce((acc, courseProgress) =>
    acc + courseProgress.modulesProgress.filter(m => m.isCompleted).length, 0
  );
  const totalModulesAvailable = courses.reduce((acc, course) => acc + course.modules.length, 0);
  const overallProgress = totalModulesAvailable > 0 ? `${Math.round((totalModulesCompleted / totalModulesAvailable) * 100)}%` : "0%";

  // Dummy data for strongest/weakest subject and hours spent
  const strongestSubject = "Algorithmes";
  const weakestSubject = "Bases de données";
  const hoursSpent = 45;

  const studentProgressData = [
    { name: 'Jan', progress: 30 },
    { name: 'Fév', progress: 45 },
    { name: 'Mar', progress: 60 },
    { name: 'Avr', progress: 75 },
    { name: 'Mai', progress: 80 },
  ];

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
            <p className="text-2xl font-bold text-primary">{overallProgress}</p>
            <p className="text-sm text-muted-foreground">Cours terminés : {completedCoursesCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Points Forts</CardTitle>
            <CardDescription>Vos domaines d'excellence.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{strongestSubject}</p>
            <p className="text-sm text-muted-foreground">Heures passées : {hoursSpent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Points à Améliorer</CardTitle>
            <CardDescription>Les sujets nécessitant plus d'attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{weakestSubject}</p>
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
};

export default StudentAnalyticsSection;