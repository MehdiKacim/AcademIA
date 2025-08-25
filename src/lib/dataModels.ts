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
      theme?: 'dark' | 'light' | 'dark-purple'; // Updated: Removed 'modern-blue'
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
      school_year_id: string;
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

    // Updated NavItem interface for dynamic menu management
    export interface NavItem {
      id: string; // Unique ID from DB
      label: string;
      route?: string; // Optional route for navigation
      icon_name?: string; // Lucide icon name as string
      description?: string; // Added description for drawer items
      is_external: boolean; // Is it an external link?
      children?: NavItem[]; // Recursive children (built in frontend)
      onClick?: () => void; // For trigger items (e.g., opening modals)
      badge?: number; // For unread message count
      // Properties from role_nav_configs, added for convenience in frontend tree building
      parent_nav_item_id?: string;
      order_index: number; // Made mandatory for sorting
      configId?: string; // The ID of the role_nav_configs entry
      establishment_id?: string; // New: Optional establishment_id for role_nav_configs
      is_global?: boolean; // New: Indicates if this is a global configuration (establishment_id is null)
    }

    // New interface for role-specific navigation configuration
    export interface RoleNavItemConfig {
      id: string; // Unique ID for this config entry
      nav_item_id: string; // FK to NavItem
      role: Profile['role'];
      parent_nav_item_id?: string; // FK to NavItem (parent in the role's menu tree)
      order_index: number;
      establishment_id?: string; // New: Optional establishment_id
      created_at?: string;
      updated_at?: string;
    }