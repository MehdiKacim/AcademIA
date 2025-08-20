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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { loadCourses } from "@/lib/courseData";
import { loadStudents } from "@/lib/studentData"; // Import loadStudents

const CreatorAnalyticsSection = () => {
  const courses = loadCourses();
  const students = loadStudents(); // Load all student profiles

  const creatorAnalytics = {
    totalCourses: courses.length,
    publishedCourses: courses.filter(c => c.modules.some(m => m.isCompleted)).length, // Simple heuristic for 'published'
    totalStudents: students.length, // Total students in the system
    averageCompletionRate: "68%", // Placeholder
    mostPopularCourse: "Développement Web Fullstack", // Placeholder
  };

  const creatorCourseData = courses.map(course => ({
    name: course.title.length > 10 ? course.title.substring(0, 10) + '...' : course.title,
    students: Math.floor(Math.random() * 200), // Dummy data
    completion: Math.floor(Math.random() * 100), // Dummy data
  }));

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
};

export default CreatorAnalyticsSection;