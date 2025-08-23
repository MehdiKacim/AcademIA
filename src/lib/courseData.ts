import { Course, Module, ModuleSection, QuizQuestion, QuizOption, Curriculum, Establishment, Class, StudentClassEnrollment, EstablishmentType, Subject, ClassSubject, ProfessorSubjectAssignment } from "./dataModels";
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client

export type EntityType = 'course' | 'module' | 'section';

/**
 * Récupère les IDs des cours accessibles pour un élève en fonction de ses affectations de classe et des cursus associés.
 * @param studentProfileId L'ID du profil de l'élève.
 * @returns Un tableau de promesses résolues en IDs de cours accessibles.
 */
export const getAccessibleCourseIdsForStudent = async (studentProfileId: string): Promise<string[]> => {
  // 1. Get the student's current class enrollments for the current school year
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const currentSchoolYear = `${currentYear}-${nextYear}`;

  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('student_class_enrollments')
    .select('class_id')
    .eq('student_id', studentProfileId)
    .eq('enrollment_year', currentSchoolYear); // Filter by current school year

  if (enrollmentsError || !enrollments || enrollments.length === 0) {
    // console.warn("Student not enrolled in any class for the current school year, no courses accessible.");
    return [];
  }

  const classIds = enrollments.map(e => e.class_id);

  // 2. Get the classes to find their curriculum_ids
  const { data: classesData, error: classesError } = await supabase
    .from('classes')
    .select('curriculum_id')
    .in('id', classIds);

  if (classesError || !classesData || classesData.length === 0) {
    console.error("Error fetching classes for student enrollments:", classesError);
    return [];
  }

  const curriculumIds = classesData.map(c => c.curriculum_id);

  // 3. Get the curricula to find their course_ids
  const { data: curriculaData, error: curriculaError } = await supabase
    .from('curricula')
    .select('course_ids')
    .in('id', curriculumIds);

  if (curriculaError || !curriculaData || curriculaData.length === 0) {
    console.error("Error fetching curricula for classes:", curriculaError);
    return [];
  }

  // Aggregate all unique course IDs
  const accessibleCourseIds = new Set<string>();
  curriculaData.forEach(curriculum => {
    curriculum.course_ids.forEach((courseId: string) => accessibleCourseIds.add(courseId));
  });

  return Array.from(accessibleCourseIds);
};


// --- Course Management ---
export const loadCourses = async (userId?: string, userRole?: 'student' | 'professeur' | 'tutor' | 'administrator' | 'director' | 'deputy_director'): Promise<Course[]> => {
  let query = supabase.from('courses').select('*, subjects(name)'); // Select subject name

  if (userRole === 'student' && userId) {
    const accessibleCourseIds = await getAccessibleCourseIdsForStudent(userId);
    if (accessibleCourseIds.length === 0) {
      return []; // No courses accessible for this student
    }
    query = query.in('id', accessibleCourseIds);
  }
  // For professeurs, they should only see courses they created
  if (userRole === 'professeur' && userId) {
    query = query.eq('creator_id', userId);
  }
  // For tutors, directors, deputy_directors, and administrators, they can see all courses
  // No additional filtering needed here as RLS policies handle creation/update permissions.

  const { data, error } = await query;

  if (error) {
    console.error("Error loading courses:", error);
    return [];
  }
  // Map snake_case from DB to camelCase for frontend if necessary, or adjust frontend to use snake_case
  return data.map((course: any) => ({
    id: course.id,
    title: course.title,
    description: course.description || '',
    modules: course.modules as Module[], // Assuming modules JSONB matches Module[] structure
    skills_to_acquire: course.skills_to_acquire || [],
    image_url: course.image_url || undefined,
    subject_id: course.subject_id || undefined, // Changed from category
    // category: course.subjects?.name || undefined, // Can derive category from subject name if needed for display
    difficulty: course.difficulty as 'Débutant' | 'Intermédiaire' | 'Avancé' || undefined,
    created_at: course.created_at || undefined,
    creator_id: course.creator_id || undefined,
  }));
};

export const addCourseToStorage = async (newCourse: Course): Promise<Course | null> => {
  const { data, error } = await supabase
    .from('courses')
    .insert({
      title: newCourse.title,
      description: newCourse.description,
      modules: newCourse.modules,
      skills_to_acquire: newCourse.skills_to_acquire,
      image_url: newCourse.image_url,
      subject_id: newCourse.subject_id, // Changed from category
      difficulty: newCourse.difficulty,
      creator_id: newCourse.creator_id, // Include creator_id
    })
    .select()
    .single();
  if (error) {
    console.error("Error adding course:", error);
    throw error;
  }
  return {
    id: data.id,
    title: data.title,
    description: data.description || '',
    modules: data.modules as Module[],
    skills_to_acquire: data.skills_to_acquire || [],
    image_url: data.image_url || undefined,
    subject_id: data.subject_id || undefined, // Changed from category
    difficulty: data.difficulty as 'Débutant' | 'Intermédiaire' | 'Avancé' || undefined,
    created_at: data.created_at || undefined,
    creator_id: data.creator_id || undefined,
  };
};

export const updateCourseInStorage = async (updatedCourse: Course): Promise<Course | null> => {
  const { data, error } = await supabase
    .from('courses')
    .update({
      title: updatedCourse.title,
      description: updatedCourse.description,
      modules: updatedCourse.modules,
      skills_to_acquire: updatedCourse.skills_to_acquire,
      image_url: updatedCourse.image_url,
      subject_id: updatedCourse.subject_id, // Changed from category
      difficulty: updatedCourse.difficulty,
      updated_at: new Date().toISOString(), // Add updated_at if your table has it
      creator_id: updatedCourse.creator_id, // Include creator_id
    })
    .eq('id', updatedCourse.id)
    .select()
    .single();
  if (error) {
    console.error("Error updating course:", error);
    throw error;
  }
  return {
    id: data.id,
    title: data.title,
    description: data.description || '',
    modules: data.modules as Module[],
    skills_to_acquire: data.skills_to_acquire || [],
    image_url: data.image_url || undefined,
    subject_id: data.subject_id || undefined, // Changed from category
    difficulty: data.difficulty as 'Débutant' | 'Intermédiaire' | 'Avancé' || undefined,
    created_at: data.created_at || undefined,
    creator_id: data.creator_id || undefined,
  };
};

export const deleteCourseFromStorage = async (courseId: string): Promise<void> => {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);
  if (error) {
    console.error("Error deleting course:", error);
    throw error;
  }
};

export const getAllCoursesByCreatorId = async (creatorId: string): Promise<Course[]> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*, subjects(name)') // Select subject name
    .eq('creator_id', creatorId);
  if (error) {
    console.error("Error fetching courses by creator ID:", error);
    return [];
  }
  return data.map((course: any) => ({
    id: course.id,
    title: course.title,
    description: course.description || '',
    modules: course.modules as Module[],
    skills_to_acquire: course.skills_to_acquire || [],
    image_url: course.image_url || undefined,
    subject_id: course.subject_id || undefined, // Changed from category
    // category: course.subjects?.name || undefined,
    difficulty: course.difficulty as 'Débutant' | 'Intermédiaire' | 'Avancé' || undefined,
    created_at: course.created_at || undefined,
    creator_id: course.creator_id || undefined,
  }));
};


// --- Curriculum Management ---
export const loadCurricula = async (): Promise<Curriculum[]> => {
  const { data, error } = await supabase
    .from('curricula')
    .select('*');
  if (error) {
    console.error("Error loading curricula:", error);
    return [];
  }
  return data.map(curriculum => ({
    id: curriculum.id,
    name: curriculum.name,
    description: curriculum.description || undefined,
    establishment_id: curriculum.establishment_id,
    course_ids: curriculum.course_ids || [],
    created_at: curriculum.created_at || undefined,
  }));
};

export const addCurriculumToStorage = async (newCurriculum: Curriculum): Promise<Curriculum | null> => {
  const { data, error } = await supabase
    .from('curricula')
    .insert({
      name: newCurriculum.name,
      description: newCurriculum.description,
      establishment_id: newCurriculum.establishment_id,
      course_ids: newCurriculum.course_ids,
    })
    .select()
    .single();
  if (error) {
    console.error("Error adding curriculum:", error);
    throw error;
  }
  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    establishment_id: data.establishment_id,
    course_ids: data.course_ids || [],
    created_at: data.created_at || undefined,
  };
};

export const updateCurriculumInStorage = async (updatedCurriculum: Curriculum): Promise<Curriculum | null> => {
  const { data, error } = await supabase
    .from('curricula')
    .update({
      name: updatedCurriculum.name,
      description: updatedCurriculum.description,
      establishment_id: updatedCurriculum.establishment_id,
      course_ids: updatedCurriculum.course_ids,
      updated_at: new Date().toISOString(), // Add updated_at if your table has it
    })
    .eq('id', updatedCurriculum.id)
    .select()
    .single();
  if (error) {
    console.error("Error updating curriculum:", error);
    throw error;
  }
  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    establishment_id: data.establishment_id,
    course_ids: data.course_ids || [],
    created_at: data.created_at || undefined,
  };
};

export const deleteCurriculumFromStorage = async (curriculumId: string): Promise<void> => {
  const { error } = await supabase
    .from('curricula')
    .delete()
    .eq('id', curriculumId);
  if (error) {
    console.error("Error deleting curriculum:", error);
    throw error;
  }
};

// --- Establishment Management ---
export const loadEstablishments = async (): Promise<Establishment[]> => {
  const { data, error } = await supabase
    .from('establishments')
    .select('*');
  if (error) {
    console.error("Error loading establishments:", error);
    return [];
  }
  return data.map(establishment => ({
    id: establishment.id,
    name: establishment.name,
    type: establishment.type as EstablishmentType,
    address: establishment.address || undefined, // Now optional
    phone_number: establishment.phone_number || undefined,
    director_id: establishment.director_id || undefined, // Now optional
    deputy_director_id: establishment.deputy_director_id || undefined, // Now optional
    contact_email: establishment.contact_email || undefined,
    created_at: establishment.created_at || undefined,
  }));
};

export const addEstablishmentToStorage = async (newEstablishment: Establishment): Promise<Establishment | null> => {
  const { data, error } = await supabase
    .from('establishments')
    .insert({
      name: newEstablishment.name,
      type: newEstablishment.type,
      address: newEstablishment.address || null, // Pass null if undefined
      phone_number: newEstablishment.phone_number || null, // Pass null if undefined
      director_id: newEstablishment.director_id || null, // Pass null if undefined
      deputy_director_id: newEstablishment.deputy_director_id || null, // Pass null if undefined
      contact_email: newEstablishment.contact_email || null,
    })
    .select()
    .single();
  if (error) {
    console.error("Error adding establishment:", error);
    throw error;
  }
  return {
    id: data.id,
    name: data.name,
    type: data.type as EstablishmentType,
    address: data.address || undefined,
    phone_number: data.phone_number || undefined,
    director_id: data.director_id || undefined,
    deputy_director_id: data.deputy_director_id || undefined,
    contact_email: data.contact_email || undefined,
    created_at: data.created_at || undefined,
  };
};

export const updateEstablishmentInStorage = async (updatedEstablishment: Establishment): Promise<Establishment | null> => {
  const { data, error } = await supabase
    .from('establishments')
    .update({
      name: updatedEstablishment.name,
      type: updatedEstablishment.type,
      address: updatedEstablishment.address || null, // Pass null if undefined
      phone_number: updatedEstablishment.phone_number || null, // Pass null if undefined
      director_id: updatedEstablishment.director_id || null, // Pass null if undefined
      deputy_director_id: updatedEstablishment.deputy_director_id || null, // Pass null if undefined
      contact_email: updatedEstablishment.contact_email || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', updatedEstablishment.id)
    .select()
    .single();
  if (error) {
    console.error("Error updating establishment:", error);
    throw error;
  }
  return {
    id: data.id,
    name: data.name,
    type: data.type as EstablishmentType,
    address: data.address || undefined,
    phone_number: data.phone_number || undefined,
    director_id: data.director_id || undefined,
    deputy_director_id: data.deputy_director_id || undefined,
    contact_email: data.contact_email || undefined,
    created_at: data.created_at || undefined,
  };
};

export const deleteEstablishmentFromStorage = async (establishmentId: string): Promise<void> => {
  const { error } = await supabase
    .from('establishments')
    .delete()
    .eq('id', establishmentId);
  if (error) {
    console.error("Error deleting establishment:", error);
    throw error;
  }
};

// --- Subject Management (New) ---
export const loadSubjects = async (establishmentId?: string): Promise<Subject[]> => {
  let query = supabase.from('subjects').select('*');
  if (establishmentId) {
    query = query.eq('establishment_id', establishmentId);
  }
  const { data, error } = await query;
  if (error) {
    console.error("Error loading subjects:", error);
    return [];
  }
  return data;
};

export const addSubjectToStorage = async (newSubject: Omit<Subject, 'id' | 'created_at' | 'updated_at'>): Promise<Subject | null> => {
  const { data, error } = await supabase
    .from('subjects')
    .insert(newSubject)
    .select()
    .single();
  if (error) {
    console.error("Error adding subject:", error);
    throw error;
  }
  return data;
};

export const updateSubjectInStorage = async (updatedSubject: Subject): Promise<Subject | null> => {
  const { data, error } = await supabase
    .from('subjects')
    .update({ name: updatedSubject.name, updated_at: new Date().toISOString() })
    .eq('id', updatedSubject.id)
    .select()
    .single();
  if (error) {
    console.error("Error updating subject:", error);
    throw error;
  }
  return data;
};

export const deleteSubjectFromStorage = async (subjectId: string): Promise<void> => {
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', subjectId);
  if (error) {
    console.error("Error deleting subject:", error);
    throw error;
  }
};


// --- Class Management ---
export const loadClasses = async (): Promise<Class[]> => {
  const { data, error } = await supabase
    .from('classes')
    .select('*');
  if (error) {
    console.error("Error loading classes:", error);
    return [];
  }
  return data.map(cls => ({
    id: cls.id,
    name: cls.name,
    curriculum_id: cls.curriculum_id,
    creator_ids: cls.creator_ids || [],
    establishment_id: cls.establishment_id || undefined,
    school_year: cls.school_year || undefined,
    created_at: cls.created_at || undefined,
  }));
};

export const addClassToStorage = async (newClass: Class): Promise<Class | null> => {
  const { data, error } = await supabase
    .from('classes')
    .insert({
      name: newClass.name,
      curriculum_id: newClass.curriculum_id,
      creator_ids: newClass.creator_ids,
      establishment_id: newClass.establishment_id,
      school_year: newClass.school_year,
    })
    .select()
    .single();
  if (error) {
    console.error("Error adding class:", error);
    throw error;
  }
  return {
    id: data.id,
    name: data.name,
    curriculum_id: data.curriculum_id,
    creator_ids: data.creator_ids || [],
    establishment_id: data.establishment_id || undefined,
    school_year: data.school_year || undefined,
    created_at: data.created_at || undefined,
  };
};

export const updateClassInStorage = async (updatedClass: Class): Promise<Class | null> => {
  const { data, error } = await supabase
    .from('classes')
    .update({
      name: updatedClass.name,
      curriculum_id: updatedClass.curriculum_id,
      creator_ids: updatedClass.creator_ids,
      establishment_id: updatedClass.establishment_id,
      school_year: updatedClass.school_year,
      updated_at: new Date().toISOString(),
    })
    .eq('id', updatedClass.id)
    .select()
    .single();
  if (error) {
    console.error("Error updating class:", error);
    throw error;
  }
  return {
    id: data.id,
    name: data.name,
    curriculum_id: data.curriculum_id,
    creator_ids: data.creator_ids || [],
    establishment_id: data.establishment_id || undefined,
    school_year: data.school_year || undefined,
    created_at: data.created_at || undefined,
  };
};

export const deleteClassFromStorage = async (classId: string): Promise<void> => {
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', classId);
  if (error) {
    console.error("Error deleting class:", error);
    throw error;
  }
};

// --- Class Subject Management (New) ---
export const loadClassSubjects = async (classId?: string): Promise<ClassSubject[]> => {
  let query = supabase.from('class_subjects').select('*, subjects(name)');
  if (classId) {
    query = query.eq('class_id', classId);
  }
  const { data, error } = await query;
  if (error) {
    console.error("Error loading class subjects:", error);
    return [];
  }
  return data.map((cs: any) => ({
    id: cs.id,
    class_id: cs.class_id,
    subject_id: cs.subject_id,
    subject_name: cs.subjects?.name, // Add subject name for convenience
    created_at: cs.created_at,
  }));
};

export const addClassSubjectToStorage = async (newClassSubject: Omit<ClassSubject, 'id' | 'created_at'>): Promise<ClassSubject | null> => {
  const { data, error } = await supabase
    .from('class_subjects')
    .insert(newClassSubject)
    .select()
    .single();
  if (error) {
    console.error("Error adding class subject:", error);
    throw error;
  }
  return data;
};

export const deleteClassSubjectFromStorage = async (classSubjectId: string): Promise<void> => {
  const { error } = await supabase
    .from('class_subjects')
    .delete()
    .eq('id', classSubjectId);
  if (error) {
    console.error("Error deleting class subject:", error);
    throw error;
  }
};

// --- Professor Subject Assignment Management (New) ---
export const loadProfessorSubjectAssignments = async (professorId?: string, classId?: string, schoolYear?: string): Promise<ProfessorSubjectAssignment[]> => {
  let query = supabase.from('professor_subject_assignments').select('*, subjects(name), classes(name)');
  if (professorId) {
    query = query.eq('professor_id', professorId);
  }
  if (classId) {
    query = query.eq('class_id', classId);
  }
  if (schoolYear) {
    query = query.eq('school_year', schoolYear);
  }
  const { data, error } = await query;
  if (error) {
    console.error("Error loading professor subject assignments:", error);
    return [];
  }
  return data.map((psa: any) => ({
    id: psa.id,
    professor_id: psa.professor_id,
    subject_id: psa.subject_id,
    subject_name: psa.subjects?.name, // Add subject name for convenience
    class_id: psa.class_id,
    class_name: psa.classes?.name, // Add class name for convenience
    school_year: psa.school_year,
    created_at: psa.created_at,
  }));
};

export const addProfessorSubjectAssignmentToStorage = async (newAssignment: Omit<ProfessorSubjectAssignment, 'id' | 'created_at'>): Promise<ProfessorSubjectAssignment | null> => {
  const { data, error } = await supabase
    .from('professor_subject_assignments')
    .insert(newAssignment)
    .select()
    .single();
  if (error) {
    console.error("Error adding professor subject assignment:", error);
    throw error;
  }
  return data;
};

export const updateProfessorSubjectAssignmentInStorage = async (updatedAssignment: ProfessorSubjectAssignment): Promise<ProfessorSubjectAssignment | null> => {
  const { data, error } = await supabase
    .from('professor_subject_assignments')
    .update({
      professor_id: updatedAssignment.professor_id,
      subject_id: updatedAssignment.subject_id,
      class_id: updatedAssignment.class_id,
      school_year: updatedAssignment.school_year,
      updated_at: new Date().toISOString(),
    })
    .eq('id', updatedAssignment.id)
    .select()
    .single();
  if (error) {
    console.error("Error updating professor subject assignment:", error);
    throw error;
  }
  return data;
};

export const deleteProfessorSubjectAssignmentFromStorage = async (assignmentId: string): Promise<void> => {
  const { error } = await supabase
    .from('professor_subject_assignments')
    .delete()
    .eq('id', assignmentId);
  if (error) {
    console.error("Error deleting professor subject assignment:", error);
    throw error;
  }
};


// New helper function to get establishment address by ID
export const getEstablishmentAddress = async (establishmentId: string): Promise<string | undefined> => {
  const { data, error } = await supabase
    .from('establishments')
    .select('address')
    .eq('id', establishmentId)
    .single();
  if (error) {
    console.error("Error fetching establishment address:", error);
    return undefined;
  }
  return data?.address || undefined;
};


// Reset functions for all data types (for development/testing)
export const resetCourses = async () => {
  const { error } = await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) console.error("Error resetting courses:", error);
};

export const resetCurricula = async () => {
  const { error } = await supabase.from('curricula').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) console.error("Error resetting curricula:", error);
};

export const resetEstablishments = async () => {
  const { error } = await supabase.from('establishments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) console.error("Error resetting establishments:", error);
};

export const resetClasses = async () => {
  const { error } = await supabase.from('classes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) console.error("Error resetting classes:", error);
};

export const resetSubjects = async () => {
  const { error } = await supabase.from('subjects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) console.error("Error resetting subjects:", error);
};

export const resetClassSubjects = async () => {
  const { error } = await supabase.from('class_subjects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) console.error("Error resetting class subjects:", error);
};

export const resetProfessorSubjectAssignments = async () => {
  const { error } = await supabase.from('professor_subject_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) console.error("Error resetting professor subject assignments:", error);
};