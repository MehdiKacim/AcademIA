import { Student } from "./dataModels";
import { loadData, saveData, addData, updateData, deleteData } from "./localStorageUtils";

const LOCAL_STORAGE_STUDENTS_KEY = 'academia_students';

const initialDummyStudents: Student[] = [
  {
    id: 'student1',
    name: 'Alice Dupont',
    email: 'alice.dupont@example.com',
    classId: 'class1', // Exemple de lien vers une classe
    establishmentId: 'est1', // Exemple de lien vers un établissement
    enrolledCoursesProgress: [
      {
        courseId: '1', // Introduction à l'IA
        isCompleted: false,
        modulesProgress: [
          {
            moduleIndex: 0, // Module 1: Qu'est-ce que l'IA ?
            isCompleted: true,
            sectionsProgress: [
              { sectionIndex: 0, isCompleted: true },
              { sectionIndex: 1, isCompleted: true },
              { sectionIndex: 2, isCompleted: true },
              { sectionIndex: 3, isCompleted: true, quizResult: { score: 2, total: 2, passed: true } },
            ],
          },
          {
            moduleIndex: 1, // Module 2: Apprentissage Automatique (Intro)
            isCompleted: false,
            sectionsProgress: [
              { sectionIndex: 0, isCompleted: false },
              { sectionIndex: 1, isCompleted: false },
              { sectionIndex: 2, isCompleted: false },
              { sectionIndex: 3, isCompleted: false },
              { sectionIndex: 4, isCompleted: false, quizResult: { score: 0, total: 2, passed: false } },
            ],
          },
        ],
      },
      {
        courseId: '2', // React pour débutants
        isCompleted: false,
        modulesProgress: [
          {
            moduleIndex: 0, // Module 1: Les bases de React
            isCompleted: true,
            sectionsProgress: [
              { sectionIndex: 0, isCompleted: true },
              { sectionIndex: 1, isCompleted: true },
              { sectionIndex: 2, isCompleted: true },
              { sectionIndex: 3, isCompleted: true, quizResult: { score: 2, total: 2, passed: true } },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'student2',
    name: 'Bob Martin',
    email: 'bob.martin@example.com',
    classId: 'class1',
    establishmentId: 'est1',
    enrolledCoursesProgress: [
      {
        courseId: '1', // Introduction à l'IA
        isCompleted: false,
        modulesProgress: [
          {
            moduleIndex: 0, // Module 1: Qu'est-ce que l'IA ?
            isCompleted: true,
            sectionsProgress: [
              { sectionIndex: 0, isCompleted: true },
              { sectionIndex: 1, isCompleted: true },
              { sectionIndex: 2, isCompleted: true },
              { sectionIndex: 3, isCompleted: true, quizResult: { score: 1, total: 2, passed: false } },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'student3',
    name: 'Charlie Brown',
    email: 'charlie.brown@example.com',
    classId: 'class2',
    establishmentId: 'est1',
    enrolledCoursesProgress: [],
  },
];

// Charger les élèves existants ou utiliser les élèves par défaut
export let dummyStudents: Student[] = loadData<Student>(LOCAL_STORAGE_STUDENTS_KEY, initialDummyStudents);

// Sauvegarder les élèves dans le localStorage
export const saveStudents = (students: Student[]) => {
  saveData(LOCAL_STORAGE_STUDENTS_KEY, students);
  dummyStudents = students; // Mettre à jour la variable exportée
};

// Fonctions CRUD pour les élèves
export const addStudent = (newStudent: Student) => {
  const updatedStudents = addData(LOCAL_STORAGE_STUDENTS_KEY, newStudent);
  dummyStudents = updatedStudents;
  return updatedStudents;
};

export const updateStudent = (updatedStudent: Student) => {
  const updatedStudents = updateData(LOCAL_STORAGE_STUDENTS_KEY, updatedStudent);
  dummyStudents = updatedStudents;
  return updatedStudents;
};

export const deleteStudent = (studentId: string) => {
  const updatedStudents = deleteData(LOCAL_STORAGE_STUDENTS_KEY, studentId);
  dummyStudents = updatedStudents;
  return updatedStudents;
};

export const getStudentById = (id: string): Student | undefined => {
  return dummyStudents.find(student => student.id === id);
};