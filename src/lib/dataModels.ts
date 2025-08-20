export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string; // In a real app, this would be a hashed password
  role: 'student' | 'creator' | 'tutor';
}

export interface Establishment {
  id: string;
  name: string;
  address?: string;
  contactEmail?: string;
}

export interface Curriculum {
  id: string;
  name: string;
  description?: string;
  establishmentId: string; // Lien vers l'établissement parent
  courseIds: string[]; // Liste des IDs des cours inclus dans ce cursus
}

export interface Class {
  id: string;
  name: string;
  curriculumId: string; // Lien vers le cursus parent
  studentIds: string[]; // Liste des IDs des élèves dans cette classe
}

export interface Student {
  id: string; // This will be the student's profile ID, distinct from userId
  userId: string; // Link to the User account
  firstName: string;
  lastName: string;
  classId?: string; // Link to the class of the student
  enrolledCoursesProgress: {
    courseId: string;
    isCompleted: boolean;
    modulesProgress: {
      moduleIndex: number;
      isCompleted: boolean;
      sectionsProgress: {
        sectionIndex: number;
        isCompleted: boolean;
        quizResult?: { score: number; total: number; passed: boolean };
      }[];
    }[];
  }[];
}

export interface CreatorProfile {
  id: string; // Creator profile ID
  userId: string; // Link to the User account
  // Add any specific creator fields here, e.g., bio, expertise
}

export interface TutorProfile {
  id: string; // Tutor profile ID
  userId: string; // Link to the User account
  // Add any specific tutor fields here, e.g., subjects, availability
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
  questions?: QuizQuestion[]; // Pour les sections de type 'quiz'
  isCompleted: boolean; // Nouvelle propriété pour la complétion de la section
  passingScore?: number; // Nouvelle propriété pour le score de réussite du quiz
  quizResult?: { score: number; total: number; passed: boolean }; // Pour stocker le dernier résultat du quiz
}

export interface Module {
  title: string;
  sections: ModuleSection[];
  isCompleted: boolean;
  level: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  skillsToAcquire: string[];
  imageUrl?: string;
  category?: string;
  difficulty?: 'Débutant' | 'Intermédiaire' | 'Avancé';
}