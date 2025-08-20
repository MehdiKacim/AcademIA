import { Student } from "./dataModels";
import { loadData, saveData, addData, updateData, deleteData } from "./localStorageUtils";

const LOCAL_STORAGE_STUDENTS_KEY = 'academia_students';

// Removed initialDummyStudents

// Fonction pour charger les élèves depuis le localStorage ou retourner un tableau vide
export const loadStudents = (): Student[] => {
  const storedStudents = localStorage.getItem(LOCAL_STORAGE_STUDENTS_KEY);
  if (storedStudents) {
    try {
      return JSON.parse(storedStudents) as Student[];
    } catch (error) {
      console.error("Erreur lors du parsing des élèves depuis le localStorage:", error);
      return []; // Fallback to empty array on parse error
    }
  }
  return []; // Return empty array if nothing in localStorage
};

// Charger les élèves existants ou utiliser les élèves par défaut
export let dummyStudents: Student[] = loadStudents();

// Sauvegarder les élèves dans le localStorage
export const saveStudents = (students: Student[]) => {
  saveData(LOCAL_STORAGE_STUDENTS_KEY, students);
  dummyStudents = students; // Mettre à jour la variable exportée en mémoire
};

// Fonctions CRUD pour les élèves
export const addStudent = (newStudent: Student) => {
  const updatedStudents = addData<Student>(LOCAL_STORAGE_STUDENTS_KEY, newStudent);
  dummyStudents = updatedStudents;
  return updatedStudents;
};

export const updateStudent = (updatedStudent: Student) => {
  const updatedStudents = updateData<Student>(LOCAL_STORAGE_STUDENTS_KEY, updatedStudent);
  dummyStudents = updatedStudents;
  return updatedStudents;
};

export const deleteStudent = (studentId: string) => {
  const updatedStudents = deleteData<Student>(LOCAL_STORAGE_STUDENTS_KEY, studentId);
  dummyStudents = updatedStudents;
  return updatedStudents;
};

export const getStudentById = (id: string): Student | undefined => {
  return dummyStudents.find(student => student.id === id);
};

// Nouvelle fonction de réinitialisation pour les données d'élèves
export const resetStudents = () => {
  localStorage.removeItem(LOCAL_STORAGE_STUDENTS_KEY);
  dummyStudents = []; // Réinitialiser avec un tableau vide
  saveStudents(dummyStudents); // Sauvegarder l'état réinitialisé
};