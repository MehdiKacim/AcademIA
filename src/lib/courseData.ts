import { Course, Module, ModuleSection, QuizQuestion, QuizOption, Curriculum, Establishment, Class } from "./dataModels";
import { loadData, saveData, addData, updateData, deleteData } from "./localStorageUtils";

export type EntityType = 'course' | 'module' | 'section';

// Local Storage Keys
const LOCAL_STORAGE_COURSES_KEY = 'academia_courses';
const LOCAL_STORAGE_CURRICULA_KEY = 'academia_curricula';
const LOCAL_STORAGE_ESTABLISHMENTS_KEY = 'academia_establishments';
const LOCAL_STORAGE_CLASSES_KEY = 'academia_classes';

// --- Course Management ---
export const loadCourses = (): Course[] => {
  return loadData<Course>(LOCAL_STORAGE_COURSES_KEY);
};

export const saveCourses = (courses: Course[]) => {
  saveData(LOCAL_STORAGE_COURSES_KEY, courses);
  dummyCourses = courses;
};

export const addCourseToStorage = (newCourse: Course) => {
  const updatedCourses = addData<Course>(LOCAL_STORAGE_COURSES_KEY, newCourse);
  dummyCourses = updatedCourses;
  return updatedCourses;
};

export const updateCourseInStorage = (updatedCourse: Course) => {
  const updatedCourses = updateData<Course>(LOCAL_STORAGE_COURSES_KEY, updatedCourse);
  dummyCourses = updatedCourses;
  return updatedCourses;
};

export const deleteCourseFromStorage = (courseId: string) => {
  const updatedCourses = deleteData<Course>(LOCAL_STORAGE_COURSES_KEY, courseId);
  dummyCourses = updatedCourses;
  return updatedCourses;
};

// --- Curriculum Management ---
export const loadCurricula = (): Curriculum[] => {
  return loadData<Curriculum>(LOCAL_STORAGE_CURRICULA_KEY);
};

export const saveCurricula = (curricula: Curriculum[]) => {
  saveData(LOCAL_STORAGE_CURRICULA_KEY, curricula);
  dummyCurricula = curricula;
};

export const addCurriculumToStorage = (newCurriculum: Curriculum) => {
  const updatedCurricula = addData<Curriculum>(LOCAL_STORAGE_CURRICULA_KEY, newCurriculum);
  dummyCurricula = updatedCurricula;
  return updatedCurricula;
};

export const updateCurriculumInStorage = (updatedCurriculum: Curriculum) => {
  const updatedCurricula = updateData<Curriculum>(LOCAL_STORAGE_CURRICULA_KEY, updatedCurriculum);
  dummyCurricula = updatedCurricula;
  return updatedCurricula;
};

export const deleteCurriculumFromStorage = (curriculumId: string) => {
  const updatedCurricula = deleteData<Curriculum>(LOCAL_STORAGE_CURRICULA_KEY, curriculumId);
  dummyCurricula = updatedCurricula;
  return updatedCurricula;
};

// --- Establishment Management ---
export const loadEstablishments = (): Establishment[] => {
  return loadData<Establishment>(LOCAL_STORAGE_ESTABLISHMENTS_KEY);
};

export const saveEstablishments = (establishments: Establishment[]) => {
  saveData(LOCAL_STORAGE_ESTABLISHMENTS_KEY, establishments);
  dummyEstablishments = establishments;
};

export const addEstablishmentToStorage = (newEstablishment: Establishment) => {
  const updatedEstablishments = addData<Establishment>(LOCAL_STORAGE_ESTABLISHMENTS_KEY, newEstablishment);
  dummyEstablishments = updatedEstablishments;
  return updatedEstablishments;
};

export const updateEstablishmentInStorage = (updatedEstablishment: Establishment) => {
  const updatedEstablishments = updateData<Establishment>(LOCAL_STORAGE_ESTABLISHMENTS_KEY, updatedEstablishment);
  dummyEstablishments = updatedEstablishments;
  return updatedEstablishments;
};

export const deleteEstablishmentFromStorage = (establishmentId: string) => {
  const updatedEstablishments = deleteData<Establishment>(LOCAL_STORAGE_ESTABLISHMENTS_KEY, establishmentId);
  dummyEstablishments = updatedEstablishments;
  return updatedEstablishments;
};

// --- Class Management ---
export const loadClasses = (): Class[] => {
  return loadData<Class>(LOCAL_STORAGE_CLASSES_KEY);
};

export const saveClasses = (classes: Class[]) => {
  saveData(LOCAL_STORAGE_CLASSES_KEY, classes);
  dummyClasses = classes;
};

export const addClassToStorage = (newClass: Class) => {
  const updatedClasses = addData<Class>(LOCAL_STORAGE_CLASSES_KEY, newClass);
  dummyClasses = updatedClasses;
  return updatedClasses;
};

export const updateClassInStorage = (updatedClass: Class) => {
  const updatedClasses = updateData<Class>(LOCAL_STORAGE_CLASSES_KEY, updatedClass);
  dummyClasses = updatedClasses;
  return updatedClasses;
};

export const deleteClassFromStorage = (classId: string) => {
  const updatedClasses = deleteData<Class>(LOCAL_STORAGE_CLASSES_KEY, classId);
  dummyClasses = updatedClasses;
  return updatedClasses;
};


// In-memory variables (will be loaded from localStorage on app start)
export let dummyCourses: Course[] = loadCourses();
export let dummyCurricula: Curriculum[] = loadCurricula();
export let dummyEstablishments: Establishment[] = loadEstablishments();
export let dummyClasses: Class[] = loadClasses();

// Reset functions for all data types
export const resetCourses = () => {
  localStorage.removeItem(LOCAL_STORAGE_COURSES_KEY);
  dummyCourses = [];
  saveCourses(dummyCourses);
};

export const resetCurricula = () => {
  localStorage.removeItem(LOCAL_STORAGE_CURRICULA_KEY);
  dummyCurricula = [];
  saveCurricula(dummyCurricula);
};

export const resetEstablishments = () => {
  localStorage.removeItem(LOCAL_STORAGE_ESTABLISHMENTS_KEY);
  dummyEstablishments = [];
  saveEstablishments(dummyEstablishments);
};

export const resetClasses = () => {
  localStorage.removeItem(LOCAL_STORAGE_CLASSES_KEY);
  dummyClasses = [];
  saveClasses(dummyClasses);
};