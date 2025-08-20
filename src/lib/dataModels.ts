export interface Establishment {
  id: string;
  name: string;
  address?: string;
  contactEmail?: string;
}

export interface Class {
  id: string;
  name: string;
  establishmentId: string; // Lien vers l'établissement
  teacherId?: string; // ID du professeur responsable (pourrait être l'ID de l'utilisateur 'creator')
  studentIds: string[]; // Liste des IDs des élèves dans cette classe
  curriculumId?: string; // Lien vers un cursus scolaire (optionnel)
}

export interface Curriculum {
  id: string;
  name: string;
  description?: string;
  courseIds: string[]; // Liste des IDs des cours inclus dans ce cursus
}

export interface Student {
  id: string;
  firstName: string; // Changement: prénom
  lastName: string;  // Changement: nom de famille
  username: string; // Nouveau: nom d'utilisateur unique
  email: string;
  classId?: string; // Lien vers la classe de l'élève
  establishmentId?: string; // Lien vers l'établissement de l'élève
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