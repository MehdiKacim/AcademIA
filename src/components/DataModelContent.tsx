import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code, Database, Users, BookOpen, LayoutList, School, User, GraduationCap, PenTool, Lock, NotebookText, BookText, ClipboardList, UserCheck, CalendarDays } from "lucide-react"; // Import new icons

const DataModelContent = () => {
  const dataModels = {
    "Auth.users (Supabase)": `
// Table gérée par Supabase pour l'authentification
// Non directement accessible via l'API client pour des raisons de sécurité.
// Les données pertinentes sont liées à la table 'profiles'.
interface AuthUser {
  id: string; // UUID unique de l'utilisateur
  email: string;
  created_at: string;
  last_sign_in_at: string;
  // ... autres champs d'authentification
}
    `,
    "public.roles": `
// Table d'énumération des rôles utilisateurs
interface Role {
  id: string; // UUID, clé primaire
  name: 'student' | 'creator' | 'tutor' | 'administrator'; // Nom du rôle
}
    `,
    "public.profiles": `
// Table des profils utilisateurs (étudiants, créateurs, tuteurs)
// Liée à auth.users par l'ID.
interface Profile {
  id: string; // UUID, clé primaire, référence auth.users(id)
  first_name: string;
  last_name: string;
  username: string;
  email: string; // Email added to profile
  role: 'student' | 'creator' | 'tutor' | 'administrator'; // Le rôle est maintenant résolu via la jointure avec 'roles'
  establishment_id?: string; // UUID, pour les étudiants, référence public.establishments(id)
  theme?: 'light' | 'dark' | 'system'; // Préférence de thème de l'utilisateur
  created_at: string;
  updated_at: string;
}
    `,
    "public.establishments": `
interface Establishment {
  id: string; // UUID
  name: string;
  address?: string;
  contact_email?: string;
  created_at: string;
}
    `,
    "public.subjects": `
// Nouvelle table pour les matières scolaires
interface Subject {
  id: string; // UUID
  name: string; // Nom de la matière (ex: 'Mathématiques', 'Informatique')
  establishment_id: string; // UUID, référence public.establishments(id)
  created_at?: string;
  updated_at?: string;
}
    `,
    "public.curricula": `
interface Curriculum {
  id: string; // UUID
  name: string;
  description?: string;
  establishment_id: string; // UUID, référence public.establishments(id)
  course_ids: string[]; // JSONB, liste d'UUIDs de public.courses(id)
  created_at: string;
}
    `,
    "public.school_years": `
// Nouvelle table pour les années scolaires
interface SchoolYear {
  id: string; // UUID
  name: string; // e.g., "2023-2024"
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
    `,
    "public.classes": `
interface Class {
  id: string; // UUID
  name: string;
  curriculum_id: string; // UUID, référence public.curricula(id)
  creator_ids: string[]; // JSONB, liste d'UUIDs de public.profiles(id) (rôle 'professeur')
  establishment_id?: string; // New: Link to parent establishment
  school_year_id: string; // Changed: Link to SchoolYear
  created_at: string;
}
    `,
    "public.class_subjects": `
// Nouvelle table de liaison pour les matières affectées à une classe
interface ClassSubject {
  id: string; // UUID
  class_id: string; // UUID, référence public.classes(id)
  subject_id: string; // UUID, référence public.subjects(id)
  subject_name?: string; // For convenience when fetching
  created_at?: string;
}
    `,
    "public.professor_subject_assignments": `
// Nouvelle table de liaison pour les affectations de professeurs aux matières par classe et année scolaire
interface ProfessorSubjectAssignment {
  id: string; // UUID
  professor_id: string; // UUID, référence public.profiles(id)
  subject_id: string; // UUID, référence public.subjects(id)
  subject_name?: string; // For convenience when fetching
  class_id: string; // UUID, référence public.classes(id)
  school_year_id: string; // Changed: Link to SchoolYear
  created_at?: string;
}
    `,
    "public.notes": `
interface Note {
  id: string; // UUID
  user_id: string; // UUID, référence public.profiles(id)
  note_key: string; // Clé unique pour le contexte de la note (ex: 'notes_course_1')
  content: string; // Contenu de la note (peut être HTML/Rich Text)
  created_at: string;
  updated_at: string;
}
    `,
    "public.student_class_enrollments": `
interface StudentClassEnrollment { // New interface for student-class liaison
  id: string; // Unique ID for this enrollment entry
  student_id: string; // Link to the student's Profile
  class_id: string; // Link to the Class
  school_year_id: string; // Changed: Link to SchoolYear
  created_at?: string;
  updated_at?: string;
}
    `,
    "public.student_course_progress": `
interface StudentCourseProgress {
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
  created_at: string;
  updated_at: string;
}
    `,
    "Module (Nested in Course)": `
interface Module {
  title: string;
  sections: ModuleSection[];
  isCompleted: boolean;
  level: number;
}
    `,
    "ModuleSection (Nested in Module)": `
interface ModuleSection {
  title: string;
  content: string;
  type?: 'text' | 'quiz' | 'video' | 'image';
  url?: string; // Pour les types 'video' ou 'image'
  questions?: QuizQuestion[]; // Pour le type 'quiz'
  isCompleted: boolean;
  passingScore?: number; // Pour le type 'quiz'
  quizResult?: { score: number; total: number; passed: boolean }; // Résultat du dernier quiz
}
    `,
    "QuizQuestion (Nested in ModuleSection)": `
interface QuizQuestion {
  question: string;
  options: QuizOption[];
}
    `,
    "QuizOption (Nested in QuizQuestion)": `
interface QuizOption {
  text: string;
  isCorrect: boolean;
}
    `,
    "Event (Global Search)": `
interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location?: string;
}
    `,
    "Document (Global Search)": `
interface Document {
  id: string;
  title: string;
  file_url: string;
  description?: string;
  uploaded_at: string;
}
    `,
  };

  const getIcon = (modelName: string) => {
    switch (modelName) {
      case 'Auth.users (Supabase)': return <Lock className="h-5 w-5 text-primary" />;
      case 'public.roles': return <Users className="h-5 w-5 text-primary" />;
      case 'public.profiles': return <User className="h-5 w-5 text-primary" />;
      case 'public.establishments': return <School className="h-5 w-5 text-primary" />;
      case 'public.subjects': return <BookText className="h-5 w-5 text-primary" />; // New icon for subjects
      case 'public.curricula': return <LayoutList className="h-5 w-5 text-primary" />;
      case 'public.school_years': return <CalendarDays className="h-5 w-5 text-primary" />; // Icon for school years
      case 'public.classes': return <Users className="h-5 w-5 text-primary" />;
      case 'public.class_subjects': return <ClipboardList className="h-5 w-5 text-primary" />; // New icon for class subjects
      case 'public.professor_subject_assignments': return <UserCheck className="h-5 w-5 text-primary" />; // New icon for professor assignments
      case 'public.student_class_enrollments': return <GraduationCap className="h-5 w-5 text-primary" />; // Icon for student class enrollments
      case 'public.courses': return <BookOpen className="h-5 w-5 text-primary" />;
      case 'public.notes': return <NotebookText className="h-5 w-5 text-primary" />;
      case 'public.student_course_progress': return <GraduationCap className="h-5 w-5 text-primary" />;
      default: return <Code className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(dataModels).map(([name, schema]) => (
        <Card key={name}>
          <CardHeader className="flex flex-row items-center gap-3">
            {getIcon(name)}
            <CardTitle>{name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48 w-full rounded-md border p-4 font-mono text-sm bg-muted/20">
              <pre className="whitespace-pre-wrap">{schema.trim()}</pre>
            </ScrollArea>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DataModelContent;