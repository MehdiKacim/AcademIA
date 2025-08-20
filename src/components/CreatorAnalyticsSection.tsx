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
import { Course } from '@/lib/dataModels';

interface CreatorAnalyticsSectionProps {
  view: string | null; // Added view prop
}

const CreatorAnalyticsSection = ({ view }: CreatorAnalyticsSectionProps) => {
  const courses = loadCourses();
  const students = loadStudents(); // Load all student profiles

  // Dummy data for creator analytics
  const creatorAnalytics = {
    totalCourses: courses.length,
    publishedCourses: courses.filter(c => c.modules.some(m => m.isCompleted)).length, // Simple heuristic for 'published'
    totalStudents: students.length, // Total students in the system
    averageCourseRating: 4.5, // Dummy rating
    newEnrollmentsLastMonth: 25, // Dummy
    averageSessionDuration: "45 min", // Dummy
  };

  const creatorCoursePerformanceData = courses.map(course => {
    const totalModules = course.modules.length;
    const completedModules = course.modules.filter(m => m.isCompleted).length; // Assuming isCompleted is set for creator's view
    const completionRate = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
    return {
      name: course.title.length > 15 ? course.title.substring(0, 12) + '...' : course.title,
      completion: completionRate,
      studentsEnrolled: Math.floor(Math.random() * 200) + 50, // Dummy data
    };
  });

  const studentEngagementData = [
    { month: 'Jan', activeStudents: 120, newEnrollments: 15 },
    { month: 'Fév', activeStudents: 150, newEnrollments: 20 },
    { month: 'Mar', activeStudents: 130, newEnrollments: 10 },
    { month: 'Avr', activeStudents: 180, newEnrollments: 25 },
    { month: 'Mai', activeStudents: 160, newEnrollments: 18 },
  ];

  const topPerformingCourses = courses.slice(0, 3).map(c => c.title); // Dummy
  const coursesWithHighestDropOff = courses.slice(3, 5).map(c => c.title); // Dummy


  if (view === 'overview') {
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
              <p className="text-sm text-muted-foreground">Note moyenne des cours : {creatorAnalytics.averageCourseRating}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Nouvelles Inscriptions</CardTitle>
              <CardDescription>Les derniers élèves à rejoindre vos cours.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{creatorAnalytics.newEnrollmentsLastMonth}</p>
              <p className="text-sm text-muted-foreground">Le mois dernier</p>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Performance des Cours (Vue d'ensemble)</CardTitle>
              <CardDescription>Taux de complétion et nombre d'élèves par cours.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={creatorCoursePerformanceData}>
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
                  <Bar dataKey="studentsEnrolled" fill="hsl(var(--primary))" name="Élèves Inscrits" />
                  <Bar dataKey="completion" fill="hsl(var(--secondary))" name="Taux de Complétion (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </>
    );
  } else if (view === 'course-performance') {
    return (
      <>
        <p className="text-lg text-muted-foreground mb-8">Analyse détaillée de la complétion et des scores par cours.</p>
        <div className="grid gap-6">
          {courses.map(course => {
            const totalModules = course.modules.length;
            const completedModules = course.modules.filter(m => m.isCompleted).length;
            const completionRate = totalModules > 0 ? ((completedModules / totalModules) * 100).toFixed(0) : 0;
            const courseStudents = students.filter(s => s.enrolledCoursesProgress.some(ec => ec.courseId === course.id));
            const avgQuizScore = courseStudents.length > 0 ? (courseStudents.reduce((sum, s) => sum + s.enrolledCoursesProgress.find(ec => ec.courseId === course.id)?.modulesProgress.reduce((modSum, mp) => modSum + mp.sectionsProgress.reduce((secSum, sp) => secSum + (sp.quizResult?.score || 0), 0), 0) || 0, 0) / courseStudents.length).toFixed(1) : 'N/A';

            return (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>Statistiques détaillées pour ce cours.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Taux de complétion du cours: <span className="font-semibold text-primary">{completionRate}%</span></p>
                    <p className="text-sm text-muted-foreground">Élèves inscrits: <span className="font-semibold text-primary">{courseStudents.length}</span></p>
                    <p className="text-sm text-muted-foreground">Score moyen aux quiz: <span className="font-semibold text-primary">{avgQuizScore}%</span></p>
                  </div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[{ name: 'Complétion', value: parseFloat(completionRate.toString()) }, { name: 'Score Quiz', value: parseFloat(avgQuizScore.toString()) }]}>
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
                        <Bar dataKey="value" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {courses.length === 0 && <p className="text-muted-foreground text-center py-4">Aucun cours créé pour afficher les performances.</p>}
        </div>
      </>
    );
  } else if (view === 'student-engagement') {
    return (
      <>
        <p className="text-lg text-muted-foreground mb-8">Suivi de l'activité et de l'engagement des apprenants.</p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Élèves Actifs</CardTitle>
              <CardDescription>Nombre d'élèves actifs cette semaine.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{Math.floor(students.length * 0.7)}</p>
              <p className="text-sm text-muted-foreground">sur {students.length} élèves inscrits.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Nouvelles Inscriptions</CardTitle>
              <CardDescription>Élèves inscrits au cours du dernier mois.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{creatorAnalytics.newEnrollmentsLastMonth}</p>
              <p className="text-sm text-muted-foreground">Nouveaux élèves.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Durée Moyenne des Sessions</CardTitle>
              <CardDescription>Temps moyen passé par les élèves sur la plateforme.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{creatorAnalytics.averageSessionDuration}</p>
              <p className="text-sm text-muted-foreground">Par session.</p>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Évolution de l'Engagement</CardTitle>
              <CardDescription>Nombre d'élèves actifs et nouvelles inscriptions par mois.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={studentEngagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
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
                  <Line type="monotone" dataKey="activeStudents" stroke="hsl(var(--primary))" name="Élèves Actifs" />
                  <Line type="monotone" dataKey="newEnrollments" stroke="hsl(var(--secondary))" name="Nouvelles Inscriptions" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Cours les Plus Performants</CardTitle>
              <CardDescription>Les cours avec les meilleurs taux de complétion.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {topPerformingCourses.length === 0 ? (
                  <li>Aucun cours performant à afficher.</li>
                ) : (
                  topPerformingCourses.map((courseTitle, index) => (
                    <li key={index}>{courseTitle}</li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Cours avec le Plus de Décrochage</CardTitle>
              <CardDescription>Identifiez les cours où les élèves ont tendance à abandonner.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {coursesWithHighestDropOff.length === 0 ? (
                  <li>Aucun cours avec un taux de décrochage élevé à afficher.</li>
                ) : (
                  coursesWithHighestDropOff.map((courseTitle, index) => (
                    <li key={index}>{courseTitle}</li>
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

export default CreatorAnalyticsSection;