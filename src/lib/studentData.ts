import { Student, User, CreatorProfile, TutorProfile } from "./dataModels";
import { loadData, saveData, addData, updateData, deleteData } from "./localStorageUtils";

// Local Storage Keys
const LOCAL_STORAGE_USERS_KEY = 'academia_users';
const LOCAL_STORAGE_STUDENTS_KEY = 'academia_students';
const LOCAL_STORAGE_CREATOR_PROFILES_KEY = 'academia_creator_profiles';
const LOCAL_STORAGE_TUTOR_PROFILES_KEY = 'academia_tutor_profiles';

// --- User Management ---
export const loadUsers = (): User[] => {
  return loadData<User>(LOCAL_STORAGE_USERS_KEY);
};

export const saveUsers = (users: User[]) => {
  saveData(LOCAL_STORAGE_USERS_KEY, users);
  dummyUsers = users;
};

export const addUser = (newUser: User) => {
  const updatedUsers = addData<User>(LOCAL_STORAGE_USERS_KEY, newUser);
  dummyUsers = updatedUsers;
  return updatedUsers;
};

export const updateUser = (updatedUser: User) => {
  const updatedUsers = updateData<User>(LOCAL_STORAGE_USERS_KEY, updatedUser);
  dummyUsers = updatedUsers;
  return updatedUsers;
};

export const deleteUser = (userId: string) => {
  const updatedUsers = deleteData<User>(LOCAL_STORAGE_USERS_KEY, userId);
  dummyUsers = updatedUsers;
  return updatedUsers;
};

export const getUserById = (id: string): User | undefined => {
  return dummyUsers.find(user => user.id === id);
};

export const getUserByUsername = (username: string): User | undefined => {
  return dummyUsers.find(user => user.username.toLowerCase() === username.toLowerCase());
};

export const getUserByEmail = (email: string): User | undefined => {
  return dummyUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
};

// --- Student Profile Management ---
export const loadStudents = (): Student[] => {
  return loadData<Student>(LOCAL_STORAGE_STUDENTS_KEY);
};

export const saveStudents = (students: Student[]) => {
  saveData(LOCAL_STORAGE_STUDENTS_KEY, students);
  dummyStudents = students;
};

export const addStudentProfile = (newStudent: Student) => {
  const updatedStudents = addData<Student>(LOCAL_STORAGE_STUDENTS_KEY, newStudent);
  dummyStudents = updatedStudents;
  return updatedStudents;
};

export const updateStudentProfile = (updatedStudent: Student) => {
  const updatedStudents = updateData<Student>(LOCAL_STORAGE_STUDENTS_KEY, updatedStudent);
  dummyStudents = updatedStudents;
  return updatedStudents;
};

export const deleteStudentProfile = (studentId: string) => {
  const updatedStudents = deleteData<Student>(LOCAL_STORAGE_STUDENTS_KEY, studentId);
  dummyStudents = updatedStudents;
  return updatedStudents;
};

export const getStudentProfileByUserId = (userId: string): Student | undefined => {
  return dummyStudents.find(student => student.userId === userId);
};

// --- Creator Profile Management ---
export const loadCreatorProfiles = (): CreatorProfile[] => {
  return loadData<CreatorProfile>(LOCAL_STORAGE_CREATOR_PROFILES_KEY);
};

export const saveCreatorProfiles = (profiles: CreatorProfile[]) => {
  saveData(LOCAL_STORAGE_CREATOR_PROFILES_KEY, profiles);
  dummyCreatorProfiles = profiles;
};

export const addCreatorProfile = (newProfile: CreatorProfile) => {
  const updatedProfiles = addData<CreatorProfile>(LOCAL_STORAGE_CREATOR_PROFILES_KEY, newProfile);
  dummyCreatorProfiles = updatedProfiles;
  return updatedProfiles;
};

export const updateCreatorProfile = (updatedProfile: CreatorProfile) => {
  const updatedProfiles = updateData<CreatorProfile>(LOCAL_STORAGE_CREATOR_PROFILES_KEY, updatedProfile);
  dummyCreatorProfiles = updatedProfiles;
  return updatedProfiles;
};

export const deleteCreatorProfile = (profileId: string) => {
  const updatedProfiles = deleteData<CreatorProfile>(LOCAL_STORAGE_CREATOR_PROFILES_KEY, profileId);
  dummyCreatorProfiles = updatedProfiles;
  return updatedProfiles;
};

export const getCreatorProfileByUserId = (userId: string): CreatorProfile | undefined => {
  return dummyCreatorProfiles.find(profile => profile.userId === userId);
};

// --- Tutor Profile Management ---
export const loadTutorProfiles = (): TutorProfile[] => {
  return loadData<TutorProfile>(LOCAL_STORAGE_TUTOR_PROFILES_KEY);
};

export const saveTutorProfiles = (profiles: TutorProfile[]) => {
  saveData(LOCAL_STORAGE_TUTOR_PROFILES_KEY, profiles);
  dummyTutorProfiles = profiles;
};

export const addTutorProfile = (newProfile: TutorProfile) => {
  const updatedProfiles = addData<TutorProfile>(LOCAL_STORAGE_TUTOR_PROFILES_KEY, newProfile);
  dummyTutorProfiles = updatedProfiles;
  return updatedProfiles;
};

export const updateTutorProfile = (updatedProfile: TutorProfile) => {
  const updatedProfiles = updateData<TutorProfile>(LOCAL_STORAGE_TUTOR_PROFILES_KEY, updatedProfile);
  dummyTutorProfiles = updatedProfiles;
  return updatedProfiles;
};

export const deleteTutorProfile = (profileId: string) => {
  const updatedProfiles = deleteData<TutorProfile>(LOCAL_STORAGE_TUTOR_PROFILES_KEY, profileId);
  dummyTutorProfiles = updatedProfiles;
  return updatedProfiles;
};

export const getTutorProfileByUserId = (userId: string): TutorProfile | undefined => {
  return dummyTutorProfiles.find(profile => profile.userId === userId);
};

// In-memory variables (will be loaded from localStorage on app start)
export let dummyUsers: User[] = loadUsers();
export let dummyStudents: Student[] = loadStudents();
export let dummyCreatorProfiles: CreatorProfile[] = loadCreatorProfiles();
export let dummyTutorProfiles: TutorProfile[] = loadTutorProfiles();

// Reset functions for all data types
export const resetUsers = () => {
  localStorage.removeItem(LOCAL_STORAGE_USERS_KEY);
  dummyUsers = [];
  saveUsers(dummyUsers);
};

export const resetStudentProfiles = () => {
  localStorage.removeItem(LOCAL_STORAGE_STUDENTS_KEY);
  dummyStudents = [];
  saveStudents(dummyStudents);
};

export const resetCreatorProfiles = () => {
  localStorage.removeItem(LOCAL_STORAGE_CREATOR_PROFILES_KEY);
  dummyCreatorProfiles = [];
  saveCreatorProfiles(dummyCreatorProfiles);
};

export const resetTutorProfiles = () => {
  localStorage.removeItem(LOCAL_STORAGE_TUTOR_PROFILES_KEY);
  dummyTutorProfiles = [];
  saveTutorProfiles(dummyTutorProfiles);
};