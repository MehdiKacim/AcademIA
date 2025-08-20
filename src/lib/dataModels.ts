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
  role: 'student' | 'creator' | 'tutor';
  class_id?: string; // Only for students, nullable
  theme?: 'light' | 'dark' | 'system'; // New: User's theme preference
  created_at?: string;
  updated_at?: string;
}

export interface Establishment {
  id: string;
  name: string;
  address?: string;
  contact_email?: string;
  created_at?: string;
}

export interface Curriculum {
  id: string;
  name: string;
  description?: string;
  establishment_id: string; // Link to parent establishment
  course_ids: string[]; // List of IDs of courses included in this curriculum
  created_at?: string;
}

export interface Class {
  id: string;
  name: string;
  curriculum_id: string; // Link to parent curriculum
  creator_ids: string[]; // List of User IDs (creators/teachers) associated with this class
  created_at?: string;
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
  }[];
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
  isCompleted: boolean; // New property for section completion
  passingScore?: number; // New property for quiz passing score
  quizResult?: { score: number; total: number; passed: boolean }; // To store the last quiz result
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
  skills_to_acquire: string[];
  image_url?: string;
  category?: string;
  difficulty?: 'Débutant' | 'Intermédiaire' | 'Avancé';
  created_at?: string;
}

export interface Note {
  id: string;
  user_id: string;
  note_key: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}