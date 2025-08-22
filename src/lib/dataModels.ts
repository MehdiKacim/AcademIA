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
  course_ids: string[]; // JSONB, liste d'UUIDs de public.courses(id)
  created_at?: string;
}

export interface Class {
  id: string; // UUID
  name: string;
  curriculum_id: string; // Link to parent curriculum
  creator_ids: string[]; // JSONB, liste d'UUIDs de public.profiles(id) (rôle 'creator')
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
  category?: string;
  difficulty?: 'Débutant' | 'Intermédiaire' | 'Avancé';
  created_at?: string;
  creator_id?: string; // Added creator_id to link courses to creators
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
}