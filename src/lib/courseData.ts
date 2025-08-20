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
  level: number; // Correction: 'level' est maintenant requis pour correspondre au schéma Zod
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

export interface Curriculum {
  id: string;
  name: string;
  description?: string;
  establishmentId: string; // Lien vers l'établissement parent
  courseIds: string[]; // Liste des IDs des cours inclus dans ce cursus
}

export type EntityType = 'course' | 'module' | 'section';

// Removed initialDummyCourses and initialDummyCurricula

const LOCAL_STORAGE_COURSES_KEY = 'academia_courses';
const LOCAL_STORAGE_CURRICULA_KEY = 'academia_curricula';

// Fonction pour charger les cours depuis le localStorage ou retourner un tableau vide
export const loadCourses = (): Course[] => {
  try {
    const storedCourses: Course[] = localStorage.getItem(LOCAL_STORAGE_COURSES_KEY)
      ? JSON.parse(localStorage.getItem(LOCAL_STORAGE_COURSES_KEY)!)
      : [];
    return storedCourses;
  } catch (error) {
    console.error("Erreur lors du chargement des cours depuis le localStorage:", error);
    return []; // Retourner un tableau vide en cas d'erreur
  }
};

// Fonction pour sauvegarder les cours dans le localStorage
export const saveCourses = (courses: Course[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_COURSES_KEY, JSON.stringify(courses));
    dummyCourses = courses; // Mettre à jour la variable exportée en mémoire
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des cours dans le localStorage:", error);
  }
};

// Fonction pour charger les cursus depuis le localStorage ou retourner un tableau vide
export const loadCurricula = (): Curriculum[] => {
  try {
    const storedCurricula: Curriculum[] = localStorage.getItem(LOCAL_STORAGE_CURRICULA_KEY)
      ? JSON.parse(localStorage.getItem(LOCAL_STORAGE_CURRICULA_KEY)!)
      : [];
    return storedCurricula;
  } catch (error) {
    console.error("Erreur lors du chargement des cursus depuis le localStorage:", error);
    return []; // Retourner un tableau vide en cas d'erreur
  }
};

// Fonction pour sauvegarder les cursus dans le localStorage
export const saveCurricula = (curricula: Curriculum[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_CURRICULA_KEY, JSON.stringify(curricula));
    dummyCurricula = curricula; // Mettre à jour la variable exportée en mémoire
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des cursus dans le localStorage:", error);
  }
};

// Variables exportées qui seront utilisées dans l'application
export let dummyCourses: Course[] = loadCourses();
export let dummyCurricula: Curriculum[] = loadCurricula();

// Fonction pour mettre à jour un cours spécifique et le sauvegarder
export const updateCourseInStorage = (updatedCourse: Course) => {
  dummyCourses = dummyCourses.map(c => c.id === updatedCourse.id ? updatedCourse : c);
  saveCourses(dummyCourses);
};

// Fonction pour ajouter un nouveau cours
export const addCourseToStorage = (newCourse: Course) => {
  dummyCourses = [...dummyCourses, newCourse];
  saveCourses(dummyCourses);
};

// Fonctions pour les cursus
export const addCurriculumToStorage = (newCurriculum: Curriculum) => {
  dummyCurricula = [...dummyCurricula, newCurriculum];
  saveCurricula(dummyCurricula);
};

export const updateCurriculumInStorage = (updatedCurriculum: Curriculum) => {
  dummyCurricula = dummyCurricula.map(c => c.id === updatedCurriculum.id ? updatedCurriculum : c);
  saveCurricula(dummyCurricula);
};

export const deleteCurriculumFromStorage = (curriculumId: string) => {
  dummyCurricula = dummyCurricula.filter(c => c.id !== curriculumId);
  saveCurricula(dummyCurricula);
};

// Nouvelles fonctions de réinitialisation pour les données de cours et de cursus
export const resetCourses = () => {
  localStorage.removeItem(LOCAL_STORAGE_COURSES_KEY);
  dummyCourses = []; // Réinitialiser avec un tableau vide
  saveCourses(dummyCourses); // Sauvegarder l'état réinitialisé
};

export const resetCurricula = () => {
  localStorage.removeItem(LOCAL_STORAGE_CURRICULA_KEY);
  dummyCurricula = []; // Réinitialiser avec un tableau vide
  saveCurricula(dummyCurricula); // Sauvegarder l'état réinitialisé
};