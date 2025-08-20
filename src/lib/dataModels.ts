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
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  classId?: string; // Lien vers la classe de l'élève
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