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
import { Course, Profile, Class, Curriculum, StudentCourseProgress, StudentClassEnrollment } from '@/lib/dataModels'; // Import StudentClassEnrollment
import { getAllStudentClassEnrollments } from '@/lib/studentData'; // Import getAllStudentClassEnrollments

interface CreatorAnalyticsSectionProps {
  view: string | null;
  selectedClassId?: string;
  selectedCurriculumId?: string;
  selectedEstablishmentId?: string; // New prop for establishment filter
  selectedCourseId?: string; // New prop for filtering by specific course
  allCourses: Course[];
  allProfiles: Profile[];
  allStudentCourseProgresses: StudentCourseProgress[];
  allClasses: Class[];
  allCurricula: Curriculum[];
}

const CreatorAnalyticsSection = ({ view, selectedClassId, selectedCurriculumId, selectedEstablishmentId, selectedCourseId, allCourses, allProfiles, allStudentCourseProgresses, allClasses, allCurricula }: CreatorAnalyticsSectionProps) => {

  // Filter courses based on selected curriculum, establishment, AND specific course ID
  const filteredCourses = React.useMemo(() => {
    let coursesToFilter = allCourses;

    if (selectedEstablishmentId && selectedEstablishmentId !== 'all') {
      const curriculaInEstablishment = allCurricula.filter(c => c.establishment_id === selectedEstablishmentId);
      const courseIdsInEstablishment = new Set(curriculaInEstablishment.flatMap(c => c.course_ids));
      coursesToFilter = coursesToFilter.filter(course => courseIdsInEstablishment.has(course.id));
    }

    if (selectedCurriculumId && selectedCurriculumId !== 'all') {
      const curriculum = allCurricula.find(c => c.id === selectedCurriculumId);
      if (curriculum) {
        coursesToFilter = coursesToFilter.filter(course => curriculum.course_ids.includes(course.id));
      }
    }

    if (selectedCourseId) {
      coursesToFilter = coursesToFilter.filter(course => course.id === selectedCourseId);
    }
    
    return coursesToFilter;
  }, [allCourses, allCurricula, selectedCurriculumId, selectedEstablishmentId, selectedCourseId]);

  // Filter students based on selected class, curriculum, or establishment
  const filteredStudentProfiles = React.useMemo(() => {
    let students = allProfiles.filter(p => p.role === 'student');

    if (selectedEstablishmentId && selectedEstablishmentId !== 'all') {
      students = students.filter(s => s.establishment_id === selectedEstablishmentId);
    }

    if (selectedClassId && selectedClassId !== 'all') {
      const selectedClass = allClasses.find(cls => cls.id === selectedClassId);
      if (selectedClass) {
        // Students are linked to classes via student_class_enrollments
        const studentIdsInClass = new Set(getAllStudentClassEnrollments().filter(e => e.class_id === selectedClass.id).map(e => e.student_id));
        return students.filter(student => studentIdsInClass.has(student.id));
      }
    } else if (selectedCurriculumId && selectedCurriculumId !== 'all') {
      const classesInCurriculum = allClasses.filter(cls => cls.curriculum_id === selectedCurriculumId);
      const classIdsInCurriculum = classesInCurriculum.map(cls => cls.id);
      const studentIdsInCurriculum = new Set(getAllStudentClassEnrollments().filter(e => classIdsInCurriculum.includes(e.class_id)).map(e => e.student_id));
      return students.filter(student => studentIdsInCurriculum.has(student.id));
    }
    return students;
  }, [allProfiles, allClasses, selectedClassId, selectedCurriculumId, selectedEstablishmentId]);

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
              <CardDescription>Les cours avec les meilleurs taux de complétion.</CardD<ctrl60><think>**Implementing the Initial Plan**

I'm currently focused on the initial issues in `src/lib/studentData.ts`, addressing the type mismatches in `data.roles` and correcting the `theme` comparison logic. I've also added the `description` property to the `NavItem` interface in `src/lib/dataModels.ts` to resolve the related errors in `BottomNavigationBar.tsx`. The upcoming step involves making sure the `await` calls are correctly implemented in the analytics components.


**Optimizing TypeScript Integration**

I'm now integrating the proposed solutions systematically. I've addressed initial issues with `src/lib/studentData.ts`, including the `data.roles` type and theme comparisons, and ensured the `description` property is added to `NavItem` in `src/lib/dataModels.ts`. Currently, I'm working on the `await` calls in the analytics components and addressing the numerous other type inconsistencies.


**Prioritizing Initial Fixes**

I'm making progress on the first batch of errors. I've successfully added the necessary `description` property to the `NavItem` interface in `src/lib/dataModels.ts`. I'm currently addressing type mismatches in `src/lib/studentData.ts`, particularly focusing on the `data.roles` and `theme` comparisons. After this, I'll integrate the solution for async functions to address the `await` calls in the analytics components.


**Prioritizing & Addressing Errors**

I'm now focusing on tackling the errors. I've begun with `src/lib/dataModels.ts`, adding the `description` property to the `NavItem` interface and including `enrollment_start_date` and `enrollment_end_date` properties to the `Profile` interface.  Then, I'm working to integrate the type-related fixes in `src/lib/studentData.ts`, especially for the theme logic and the array of objects, and will soon address the issues surrounding `await` calls.


**Prioritizing Initial Fixes**

I'm starting with `src/lib/dataModels.ts`, adding the `description` property to the `NavItem` interface and including `enrollment_start_date` and `enrollment_end_date` properties in the `Profile` interface.  Next, I'll focus on the type mismatches in `src/lib/studentData.ts`, particularly the `data.roles` and `theme` comparisons. After that, I'll address `BottomNavigationBar.tsx` to handle `to` and `badge`. Finally, I'll apply fixes for the missing `await` statements in the analytics components.


**Prioritizing & Fixing Errors**

I'm making progress on the first wave of issues. I've begun integrating type fixes, addressing the mismatches in `data.roles` and comparisons for the `theme` property within `src/lib/studentData.ts`.  Additionally, I've successfully added the necessary `description` field to the `NavItem` interface in `src/lib/dataModels.ts` to solve the compile-time errors in `BottomNavigationBar.tsx`. The next task is to implement the fixes for `await` calls in the analytics components.


**Implementing Planned Fixes**

I'm systematically addressing the errors, prioritizing the updates to `src/lib/dataModels.ts` to ensure data consistency and then focusing on fixing the issues in `src/lib/studentData.ts`. Following that, I'll tackle the `BottomNavigationBar.tsx` errors by integrating the necessary `description` property and type guards. I'll make sure to integrate the fixes, one piece at a time.


**Prioritizing and Implementing Fixes**

I'm now methodically addressing the compile-time errors. I've begun integrating the `description` property and the enrollment date properties into the interfaces. I'll focus on the `src/lib/studentData.ts` issues with `data.roles` and theme comparisons next, followed by ensuring correct handling of `await` calls and resolving further typing inconsistencies. The fixes are applied, one piece at a time.


</think>Je suis désolé pour ces erreurs de compilation. Il semble qu'il y ait eu plusieurs problèmes de typage et d'importation suite aux modifications précédentes, ainsi que des incohérences avec les nouvelles propriétés ajoutées aux interfaces. Je vais corriger ces 94 erreurs de compilation TypeScript de manière concise.

Voici les changements que je vais apporter :

1.  **Mise à jour de `src/lib/dataModels.ts`** :
    *   J'ajouterai la propriété `description?: string;` à l'interface `NavItem`.
    *   J'ajouterai `enrollment_start_date?: string;` et `enrollment_end_date?: string;` à l'interface `Profile`.
    *   Je mettrai à jour le type `role` dans l'interface `Profile` pour inclure tous les rôles possibles (`'student' | 'professeur' | 'tutor' | 'administrator' | 'director' | 'deputy_director'`).
    *   Je renommerai `school_year` en `school_year_name` dans l'interface `Class` pour correspondre à la jointure Supabase.

2.  **Correction des fichiers `.ts` et `.tsx`** :
    *   **`src/lib/studentData.ts`** : J'ajusterai le typage pour la propriété `role` lors de la récupération des profils et la logique de mise à jour du thème pour éviter les comparaisons de types non intentionnelles.
    *   **`src/components/BottomNavigationBar.tsx`** : Je m'assurerai que la propriété `description` est correctement utilisée et que les propriétés `to` et `badge` sont accédées de manière sécurisée en utilisant des gardes de type ou en s'assurant que tous les éléments respectent l'interface `NavItem`.
    *   **`src/components/CreatorAnalyticsSection.tsx` et `src/components/TutorAnalyticsSection.tsx`** : J'ajouterai `await` aux appels de `getAllStudentClassEnrollments()` car c'est une fonction asynchrone.
    *   **`src/components/analytics/ClassListModal.tsx`** : Je remplacerai `cls.school_year` par `cls.school_year_name`.
    *   **`src/pages/StudentManagementPage.tsx`** : J'importerai `supabase` et `UserPlus`, j'ajusterai la gestion des dates d'inscription (`enrollment_start_date`, `enrollment_end_date`) sur le profil, et je remplacerai `school_year` par `school_year_name`.
    *   **`src/pages/AdminUserManagementPage.tsx` et `src/pages/ProfessorSubjectAssignmentPage.tsx`** : J'importerai les composants `Dialog` manquants. J'ajusterai également la gestion de `user_metadata` pour les mises à jour de rôle.
    *   **`src/pages/Messages.tsx`** : Je remplacerai `enrollment_year` par `school_year_id` ou `school_year_name` et `cls.school_year` par `cls.school_year_name`.
    *   **`src/components/ProtectedRoute.tsx` et `src/App.tsx`** : J'élargirai les types `allowedRoles` pour inclure tous les rôles définis dans `Profile['role']`.
    *   **`src/components/GlobalSearch.tsx`** : J'ajouterai la dépendance `react-swipeable` au `package.json` et l'installerai.
    *   **`src/components/ui/chart.tsx`** : Je corrigerai les problèmes de typage liés aux composants `recharts` et `shadcn/ui`, notamment les `id` de `div`, les types d'enfants, les props de `TooltipContent` et les casts de `ref`. J'ajouterai également `export type` pour `ChartConfig`.

Ces corrections devraient résoudre tous les problèmes de compilation et restaurer le fonctionnement de votre application.

<dyad-write path="src/lib/dataModels.ts" description="Mise à jour de l'interface NavItem avec une description optionnelle, ajout des dates d'inscription au profil, et mise à jour des types de rôle et de l'année scolaire pour la cohérence.">
import { ElementType, JSX } from "react"; // Import ElementType and JSX for NavItem

export interface User {
  id: string; // This will be the Supabase auth.users ID
  email: string;
  // No username, firstName, lastName, role here as they are in Profile
}

export interface Profile {
  id: string; // Same as User.id from auth.users
  first_name: string;
  last_name: string;
  username: string;
  email: string; // Added email to Profile interface
  role: 'student' | 'professeur' | 'tutor' | 'administrator' | 'director' | 'deputy_director'; // Replaced 'creator' with 'professeur'
  establishment_id?: string; // New: Link to parent establishment for students, professeurs, tutors, directors, deputy_directors
  enrollment_start_date?: string; // New: Enrollment start date for students
  enrollment_end_date?: string; // New: Enrollment end date for students
  theme?: 'light' | 'dark' | 'system'; // New: User's theme preference
  created_at?: string;
  updated_at?: string;
}

export type EstablishmentType = 
  | 'Maternelle'
  | 'Élémentaire'
  | 'Collège'
  | 'Lycée Général'
  | 'Lycée Technologique'
  | 'Lycée Professionnel'
  | 'Privé Sous Contrat'
  | 'Privé Hors Contrat'
  | 'Spécialisé'
  | 'CFA';

export interface Establishment {
  id: string;
  name: string;
  type: EstablishmentType;
  address?: string; // Made optional
  phone_number?: string;
  director_id?: string; // Made optional
  deputy_director_id?: string; // Made optional
  contact_email?: string;
  created_at?: string;
}

export interface Subject { // New: Subject interface
  id: string;
  name: string;
  establishment_id: string; // Link to parent establishment
  created_at?: string;
  updated_at?: string;
}

export interface Curriculum {
  id: string;
  name: string;
  description?: string;
  establishment_id: string; // Link to parent establishment
  course_ids: string[]; // JSONB, liste d'UUIDs de public.courses(id)
  created_at?: string;
}

export interface SchoolYear { // New: SchoolYear interface
  id: string; // UUID
  name: string; // e.g., "2023-2024"
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Class {
  id: string; // UUID
  name: string;
  curriculum_id: string; // Link to parent curriculum
  creator_ids: string[]; // JSONB, liste d'UUIDs de public.profiles(id) (rôle 'professeur')
  establishment_id?: string; // New: Link to parent establishment
  school_year_id: string; // Changed: Link to SchoolYear
  school_year_name?: string; // For convenience when fetching
  created_at?: string;
}

export interface ClassSubject { // New: Class-Subject liaison
  id: string;
  class_id: string;
  subject_id: string;
  subject_name?: string; // For convenience when fetching
  created_at?: string;
}

export interface ProfessorSubjectAssignment { // New: Professor-Subject-Class-Year assignment
  id: string;
  professor_id: string;
  subject_id: string;
  subject_name?: string; // For convenience when fetching
  class_id: string;
  class_name?: string; // For convenience when fetching
  school_year_id: string; // Changed: Link to SchoolYear
  school_year_name?: string; // For convenience when fetching
  created_at?: string;
}

export interface StudentClassEnrollment { // New interface for student-class liaison
  id: string; // Unique ID for this enrollment entry
  student_id: string; // Link to the student's Profile
  class_id: string; // Link to the Class
  school_year_id: string; // Changed: Link to SchoolYear
  school_year_name?: string; // For convenience when fetching
  created_at?: string;
  updated_at?: string;
}

export interface StudentCourseProgress {
  id: string; // Unique ID for this progress entry
  user_id: string; // Link to the User account (and Profile)
  course_id: string;
  is_completed: boolean;
  modules_progress: {
    module_index: number;
    is_completed: boolean;
    sections_progress: {
      section_index: number;
      is_completed: boolean;
      quiz_result?: { score: number; total: number; passed: boolean };
    }[];
  }[]; // JSONB, progression détaillée par module et section
  created_at?: string;
  updated_at?: string;
}

export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  question: string;
  options: QuizOption[];
}

export interface ModuleSection {
  title: string;
  content: string;
  type?: 'text' | 'quiz' | 'video' | 'image';
  url?: string;
  questions?: QuizQuestion[]; // For 'quiz' sections
  passingScore?: number; // New property for quiz passing score
  quizResult?: { score: number; total: number; passed: boolean }; // To store the last quiz result
  isCompleted: boolean; // Added for tracking section completion
}

export interface Module {
  title: string;
  sections: ModuleSection[];
  isCompleted: boolean; // Added for tracking module completion
  level: number; // Added for module level
}

export interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  skills_to_acquire: string[];
  image_url?: string;
  subject_id?: string; // Changed from 'category' to 'subject_id'
  difficulty?: 'Débutant' | 'Intermédiaire' | 'Avancé';
  created_at?: string;
  creator_id?: string; // Added creator_id to link courses to professeurs
}

export interface Note {
  id: string;
  user_id: string;
  note_key: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  course_id?: string; // Optional: context of the message
  content: string;
  file_url?: string; // URL to the attachment in Supabase Storage
  is_read: boolean;
  is_archived: boolean; // New: for soft delete/archive feature
  created_at: string;
}

// New interfaces for global search (placeholders)
export interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location?: string;
}

export interface Document {
  id: string;
  title: string;
  file_url: string;
  description?: string;
  uploaded_at: string;
}

// Moved NavItem interface here to be a single source of truth
export interface NavItem {
  icon: ElementType;
  label: string;
  to?: string; // Optional for trigger items
  onClick?: () => void;
  type: 'link' | 'trigger';
  items?: { to: string; label: string; icon: ElementType; type: 'link' }[];
  badge?: number; // New: for unread message count
  description?: string; // New: Optional description for drawer items
}