import { Course, Module, ModuleSection, QuizQuestion, QuizOption, Curriculum, Establishment, Class } from "./dataModels";
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client

export type EntityType = 'course' | 'module' | 'section';

// --- Course Management ---
export const loadCourses = async (): Promise<Course[]> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*');
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
    address: establishment.address || undefined,
    contact_email: establishment.contact_email || undefined,
    created_at: establishment.created_at || undefined,
  }));
};

export const addEstablishmentToStorage = async (newEstablishment: Establishment): Promise<Establishment | null> => {
  const { data, error } = await supabase
    .from('establishments')
    .insert({
      name: newEstablishment.name,
      address: newEstablishment.address,
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
    address: data.address || undefined,
    contact_email: data.contact_email || undefined,
    created_at: data.created_at || undefined,
  };
};

export const updateEstablishmentInStorage = async (updatedEstablishment: Establishment): Promise<Establishment | null> => {
  const { data, error } = await supabase
    .from('establishments')
    .update({
      name: updatedEstablishment.name,
      address: updatedEstablishment.address,
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
    address: data.address || undefined,
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