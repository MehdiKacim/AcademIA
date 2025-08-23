import { Course, Module, ModuleSection, QuizQuestion, QuizOption, Curriculum, Establishment, Class, StudentClassEnrollment, EstablishmentType } from "./dataModels";
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client

export type EntityType = 'course' | 'module' | 'section';

/**
 * Récupère les IDs des cours accessibles pour un élève en fonction de ses affectations de classe et des cursus associés.
 * @param studentProfileId L'ID du profil de l'élève.
 * @returns Un tableau de promesses résolues en IDs de cours accessibles.
 */
export const getAccessibleCourseIdsForStudent = async (studentProfileId: string): Promise<string[]> => {
  // 1. Get the student's current class enrollments
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('student_class_enrollments')
    .select('class_id')
    .eq('student_id', studentProfileId);

  if (enrollmentsError || !enrollments || enrollments.length === 0) {
    // console.warn("Student not enrolled in any class, no courses accessible.");
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
  let query = supabase.from('courses').select('*');

  if (userRole === 'student' && userId) {
    const accessibleCourseIds = await getAccessibleCourseIdsForStudent(userId);
    if (accessibleCourseIds.length === 0) {
      return []; // No courses accessible for this student
    }
    query = query.in('id', accessibleCourseIds);
  }
  // For professeurs and tutors, they can see all courses (or courses they created/are associated with)
  // For now, we'll let them see all courses, as RLS policies handle creation/update permissions.

  const { data, error } = await query;

  if (error) {
    console.error("Error loading courses:", error);
    return [];
  }
  // Map snake_case from DB to camelCase for frontend if necessary, or adjust frontend to use snake_case
  return data.map(course => ({
    id: course.id,
    title: course.title,
    description: course.description || '',
    modules: course.modules as Module[], // Assuming modules JSONB matches Module[] structure
    skills_to_acquire: course.skills_to_acquire || [],
    image_url: course.image_url || undefined,
    category: course.category || undefined,
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
      category: newCourse.category,
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
    category: data.category || undefined,
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
      category: updatedCourse.category,
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
    category: data.category || undefined,
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
    .select('*')
    .eq('creator_id', creatorId);
  if (error) {
    console.error("Error fetching courses by creator ID:", error);
    return [];
  }
  return data.map(course => ({
    id: course.id,
    title: course.title,
    description: course.description || '',
    modules: course.modules as Module[],
    skills_to_acquire: course.skills_to_acquire || [],
    image_url: course.image_url || undefined,
    category: course.category || undefined,
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
    address: establishment.address, // Now mandatory
    phone_number: establishment.phone_number || undefined, // New field
    director_id: establishment.director_id || undefined, // New field
    deputy_director_id: establishment.deputy_director_id || undefined, // New field
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
      address: newEstablishment.address, // Now mandatory
      phone_number: newEstablishment.phone_number, // New field
      director_id: newEstablishment.director_id, // New field
      deputy_director_id: newEstablishment.deputy_director_id, // New field
      contact_email: newEstablishment.contact_email,
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
    address: data.address, // Now mandatory
    phone_number: data.phone_number || undefined, // New field
    director_id: data.director_id || undefined, // New field
    deputy_director_id: data.deputy_director_id || undefined, // New field
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
      address: updatedEstablishment.address, // Now mandatory
      phone_number: updatedEstablishment.phone_number, // New field
      director_id: updatedEstablishment.director_id, // New field
      deputy_director_id: updatedEstablishment.deputy_director_id, // New field
      contact_email: updatedEstablishment.contact_email,
      updated_at: new Date().toISOString(), // Add updated_at if your table has it
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
    address: data.address, // Now mandatory
    phone_number: data.phone_number || undefined, // New field
    director_id: data.director_id || undefined, // New field
    deputy_director_id: data.deputy_director_id || undefined, // New field
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
    establishment_id: cls.establishment_id || undefined, // New field
    school_year: cls.school_year || undefined, // New field
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
      establishment_id: newClass.establishment_id, // New field
      school_year: newClass.school_year, // New field
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
    establishment_id: data.establishment_id || undefined, // New field
    school_year: data.school_year || undefined, // New field
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
      establishment_id: updatedClass.establishment_id, // New field
      school_year: updatedClass.school_year, // New field
      updated_at: new Date().toISOString(), // Add updated_at if your table has it
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
    establishment_id: data.establishment_id || undefined, // New field
    school_year: data.school_year || undefined, // New field
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