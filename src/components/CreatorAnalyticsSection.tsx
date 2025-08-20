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
import { Course, Profile, Class, Curriculum, StudentCourseProgress } from '@/lib/dataModels';

interface CreatorAnalyticsSectionProps {
  view: string | null;
  selectedClassId?: string;
  selectedCurriculumId?: string;
  allCourses: Course[];
  allProfiles: Profile[];
  allStudentCourseProgresses: StudentCourseProgress[];
  allClasses: Class[];
  allCurricula: Curriculum[];
}

const CreatorAnalyticsSection = ({ view, selectedClassId, selectedCurriculumId, allCourses, allProfiles, allStudentCourseProgresses, allClasses, allCurricula }: CreatorAnalyticsSectionProps) => {

  // Filter courses based on selected curriculum
  const filteredCourses = React.useMemo(() => {
    if (selectedCurriculumId && selectedCurriculumId !== 'all') {
      const curriculum = allCurricula.find(c => c.id === selectedCurriculumId);
      if (curriculum) {
        return allCourses.filter(course => curriculum.course_ids.includes(course.id));
      }
    }
    return allCourses;
  }, [allCourses, allCurricula, selectedCurriculumId]);

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

  // Dummy data for creator analytics
  const creatorAnalytics = {
    totalCourses: filteredCourses.length,
    publishedCourses: filteredCourses.filter(c => c.modules.some(m => m.isCompleted)).length,
    totalStudents: filteredStudentProfiles.length,
    averageCourseRating: 4.5,
    newEnrollmentsLastMonth: Math.floor(Math.random() * 10) + 5, // Adjusted for filtered data
    averageSessionDuration: "45 min",
  };

  const creatorCoursePerformanceData = filteredCourses.map(course => {
    const totalModules = course.modules.length;
    const completedModules = course.modules.filter(m => m.isCompleted).length;
    const completionRate = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
    
    const courseStudentProgresses = allStudentCourseProgresses.filter(scp => 
      scp.course_id === course.id && filteredStudentProfiles.some(p => p.id === scp.user_id)
    );
    
    const courseStudentsCount = courseStudentProgresses.length;

    const avgQuizScore = courseStudentProgresses.length > 0 ? (courseStudentProgresses.reduce((sum, scp) => 
      sum + scp.modules_progress.reduce((modSum, mp) => 
        modSum + mp.sections_progress.reduce((secSum, sp) => 
          secSum + (sp.quiz_result?.score || 0), 0), 0), 0) / courseStudentProgresses.length).toFixed(1) : 'N/A';

    return {
      name: course.title.length > 15 ? course.title.substring(0, 12) + '...' : course.title,
      completion: completionRate,
      studentsEnrolled: courseStudentsCount,
      avgQuizScore: parseFloat(avgQuizScore.toString()),
    };
  });

  const studentEngagementData = [
    { month: 'Jan', activeStudents: Math.floor(filteredStudentProfiles.length * 0.6), newEnrollments: Math.floor(Math.random() * 5) + 1 },
    { month: 'Fév', activeStudents: Math.floor(filteredStudentProfiles.length * 0.7), newEnrollments: Math.floor(Math.random() * 5) + 1 },
    { month: 'Mar', activeStudents: Math.floor(filteredStudentProfiles.length * 0.65), newEnrollments: Math.floor(Math.random() * 5) + 1 },
    { month: 'Avr', activeStudents: Math.floor(filteredStudentProfiles.length * 0.75), newEnrollments: Math.floor(Math.random() * 5) + 1 },
    { month: 'Mai', activeStudents: Math.floor(filteredStudentProfiles.length * 0.7), newEnrollments: Math.floor(Math.random() * 5) + 1 },
  ];

  const topPerformingCourses = creatorCoursePerformanceData.sort((a, b) => b.completion - a.completion).slice(0, 3).map(c => c.name);
  const coursesWithHighestDropOff = creatorCoursePerformanceData.sort((a, b) => a.completion - b.completion).slice(0, 3).map(c => c.name);


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
          {filteredCourses.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Aucun cours trouvé pour les filtres sélectionnés.</p>
          ) : (
            filteredCourses.map(course => {
              const courseStats = creatorCoursePerformanceData.find(data => data.name.startsWith(course.title.substring(0, 12)));
              if (!courseStats) return null; // Should not happen if data is correctly generated

              return (
                <Card key={course.id}>
                  <CardHeader>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>Statistiques détaillées pour ce cours.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Taux de complétion du cours: <span className="font-semibold text-primary">{courseStats.completion}%</span></p>
                      <p className="text-sm text-muted-foreground">Élèves inscrits: <span className="font-semibold text-primary">{courseStats.studentsEnrolled}</span></p>
                      <p className="text-sm text-muted-foreground">Score moyen aux quiz: <span className="font-semibold text-primary">{courseStats.avgQuizScore}%</span></p>
                    </div>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{ name: 'Complétion', value: courseStats.completion }, { name: 'Score Quiz', value: courseStats.avgQuizScore }]}>
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
            })
          )}
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
              <p className="text-2xl font-bold text-primary">{Math.floor(filteredStudentProfiles.length * 0.7)}</p>
              <p className="text-sm text-muted-foreground">sur {filteredStudentProfiles.length} élèves inscrits.</p>
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
                  <li>Aucun cours performant à afficher pour les filtres sélectionnés.</li>
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
                  <li>Aucun cours avec un taux de décrochage élevé à afficher pour les filtres sélectionnés.</li>
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

  return null;
};

export default CreatorAnalyticsSection;