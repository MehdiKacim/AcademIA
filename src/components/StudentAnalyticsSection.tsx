import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MotionCard, // Import MotionCard
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
import { Profile, Course, StudentCourseProgress } from "@/lib/dataModels"; // Import Profile, Course, StudentCourseProgress

interface StudentAnalyticsSectionProps {
  studentProfile: Profile; // Now expects a Profile object
  courses: Course[];
  studentCourseProgresses: StudentCourseProgress[]; // All student course progresses
  view: string | null; // Added view prop
}

const StudentAnalyticsSection = ({ studentProfile, courses, studentCourseProgresses, view }: StudentAnalyticsSectionProps) => {
  const studentProgress = studentCourseProgresses.filter(p => p.user_id === studentProfile.id);

  const enrolledCourses = courses.filter(c => studentProgress.some(ec => ec.course_id === c.id));
  const completedCoursesCount = enrolledCourses.filter(c => {
    const progress = studentProgress.find(ec => ec.course_id === c.id);
    return progress && progress.modules_progress.every(m => m.is_completed);
  }).length;

  const totalModulesCompleted = studentProgress.reduce((acc, courseProgress) =>
    acc + courseProgress.modules_progress.filter(m => m.is_completed).length, 0
  );
  const totalModulesAvailable = courses.reduce((acc, course) => acc + course.modules.length, 0);
  const overallProgress = totalModulesAvailable > 0 ? `${Math.round((totalModulesCompleted / totalModulesAvailable) * 100)}%` : "0%";

  // Dummy data for strongest/weakest subject and hours spent
  const strongestSubject = "Algorithmes";
  const weakestSubject = "Bases de données";
  const hoursSpent = 45; // Total simulated hours

  // Dummy data for quiz performance
  const quizPerformanceData = [
    { name: 'Quiz 1', score: 85 },
    { name: 'Quiz 2', score: 70 },
    { name: 'Quiz 3', score: 92 },
    { name: 'Quiz 4', score: 60 },
    { name: 'Quiz 5', score: 78 },
  ];

  // Dummy data for AiA engagement
  const aiaEngagementData = [
    { month: 'Jan', interactions: 10, avgLength: 2.5, satisfaction: 4.2 },
    { month: 'Fév', interactions: 15, avgLength: 3.1, satisfaction: 4.5 },
    { month: 'Mar', interactions: 22, avgLength: 2.8, satisfaction: 4.0 },
    { month: 'Avr', interactions: 18, avgLength: 3.5, satisfaction: 4.7 },
    { month: 'Mai', interactions: 25, avgLength: 3.0, satisfaction: 4.3 },
  ];
  const totalAiaInteractions = aiaEngagementData.reduce((sum, data) => sum + data.interactions, 0);
  const mostAskedTopics = ["Concepts de base", "Débogage", "Meilleures pratiques"];
  const avgInteractionLength = (aiaEngagementData.reduce((sum, data) => sum + data.avgLength, 0) / aiaEngagementData.length).toFixed(1);
  const avgSatisfaction = (aiaEngagementData.reduce((sum, data) => sum + data.satisfaction, 0) / aiaEngagementData.length).toFixed(1);


  const studentProgressData = [
    { name: 'Jan', progress: 30 },
    { name: 'Fév', progress: 45 },
    { name: 'Mar', progress: 60 },
    { name: 'Avr', progress: 75 },
    { name: 'Mai', progress: 80 },
  ];

  if (view === 'personal') {
    return (
      <>
        <p className="text-lg text-muted-foreground mb-8">Suivez votre progression et identifiez vos points forts et faibles.</p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <MotionCard whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
            <CardHeader>
              <CardTitle>Progression Globale</CardTitle>
              <CardDescription>Votre avancement général dans les cours.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{overallProgress}</p>
              <p className="text-sm text-muted-foreground">Cours terminés : {completedCoursesCount}</p>
            </CardContent>
          </MotionCard>
          <MotionCard whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
            <CardHeader>
              <CardTitle>Points Forts</CardTitle>
              <CardDescription>Vos domaines d'excellence.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{strongestSubject}</p>
              <p className="text-sm text-muted-foreground">Heures passées : {hoursSpent}</p>
            </CardContent>
          </MotionCard>
          <MotionCard whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
            <CardHeader>
              <CardTitle>Points à Améliorer</CardTitle>
              <CardDescription>Les sujets nécessitant plus d'attention.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{weakestSubject}</p>
              <p className="text-sm text-muted-foreground">N'hésitez pas à demander de l'aide à AiA !</p>
            </CardContent>
          </MotionCard>
          <MotionCard className="lg:col-span-3" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
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
          </MotionCard>
        </div>
      </>
    );
  } else if (view === 'quiz-performance') {
    return (
      <>
        <p className="text-lg text-muted-foreground mb-8">Détails de vos résultats aux quiz.</p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <MotionCard className="lg:col-span-3" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
            <CardHeader>
              <CardTitle>Scores des Derniers Quiz</CardTitle>
              <CardDescription>Vos performances récentes aux évaluations.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quizPerformanceData}>
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
                  <Bar dataKey="score" fill="hsl(var(--primary))" name="Score (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </MotionCard>
          <MotionCard className="lg:col-span-3" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
            <CardHeader>
              <CardTitle>Historique Détaillé des Quiz</CardTitle>
              <CardDescription>Liste de tous vos quiz terminés.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-muted-foreground mt-4">
                {studentProgress.map(cp => {
                  const course = courses.find(c => c.id === cp.course_id);
                  return cp.modules_progress.map(mp => {
                    const module = course?.modules[mp.module_index];
                    return mp.sections_progress.map(sp => {
                      const section = module?.sections[sp.section_index];
                      if (section?.type === 'quiz' && sp.quiz_result) {
                        return (
                          <li key={`${cp.course_id}-${mp.module_index}-${sp.section_index}`}>
                            **{course?.title}** - Module {mp.module_index + 1}: "{module?.title}" - Quiz: "{section.title}" - Score: {sp.quiz_result.score}/{sp.quiz_result.total} ({((sp.quiz_result.score / sp.quiz_result.total) * 100).toFixed(0)}%) - **{sp.quiz_result.passed ? 'Réussi' : 'Échoué'}**
                          </li>
                        );
                      }
                      return null;
                    });
                  });
                }).flat(3).filter(Boolean)}
                {studentProgress.length === 0 && <p>Aucun quiz terminé pour le moment.</p>}
              </ul>
            </CardContent>
          </MotionCard>
        </div>
      </>
    );
  } else if (view === 'aia-engagement') {
    return (
      <>
        <p className="text-lg text-muted-foreground mb-8">Statistiques sur votre interaction avec le tuteur IA.</p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <MotionCard whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
            <CardHeader>
              <CardTitle>Total Interactions AiA</CardTitle>
              <CardDescription>Nombre total de conversations avec AiA.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{totalAiaInteractions}</p>
              <p className="text-sm text-muted-foreground">Questions posées et réponses reçues.</p>
            </CardContent>
          </MotionCard>
          <MotionCard whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
            <CardHeader>
              <CardTitle>Sujets les Plus Abordés</CardTitle>
              <CardDescription>Les thèmes sur lesquels vous avez le plus sollicité AiA.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-lg font-semibold text-primary">
                {mostAskedTopics.map((topic, index) => (
                  <li key={index}>{topic}</li>
                ))}
              </ul>
            </CardContent>
          </MotionCard>
          <MotionCard whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
            <CardHeader>
              <CardTitle>Fréquence d'Utilisation</CardTitle>
              <CardDescription>Votre utilisation d'AiA au fil du temps.</CardDescription>
            </CardHeader>
            <CardContent className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aiaEngagementData}>
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
                  <Line type="monotone" dataKey="interactions" stroke="hsl(var(--primary))" name="Interactions" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </MotionCard>
          <MotionCard whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
            <CardHeader>
              <CardTitle>Durée Moyenne d'Interaction</CardTitle>
              <CardDescription>Temps moyen passé par interaction avec AiA.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{avgInteractionLength} min</p>
              <p className="text-sm text-muted-foreground">Par session de chat.</p>
            </CardContent>
          </MotionCard>
          <MotionCard whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
            <CardHeader>
              <CardTitle>Score de Satisfaction AiA</CardTitle>
              <CardDescription>Votre satisfaction globale avec l'aide d'AiA.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{avgSatisfaction} / 5</p>
              <p className="text-sm text-muted-foreground">Basé sur vos retours implicites.</p>
            </CardContent>
          </MotionCard>
        </div>
      </>
    );
  }

  return null; // Should not happen if view is always one of the cases
};

export default StudentAnalyticsSection;