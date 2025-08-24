import { Profile, User, StudentCourseProgress, StudentClassEnrollment } from "./dataModels"; // Import Profile, StudentCourseProgress, StudentClassEnrollment
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client
import { User as SupabaseUser } from '@supabase/supabase-js'; // Import Supabase User type

// --- User & Profile Management (Supabase) ---

// Note: User authentication (signup, login) will be handled by Supabase Auth directly.
// This file will focus on managing the 'profiles' table and related data.

export const getProfileById = async (id: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      username,
      email,
      establishment_id,
      enrollment_start_date,
      enrollment_end_date,
      theme,
      created_at,
      updated_at,
      roles(name)
    `) // Select role_id and join to get role_name from roles table
    .eq('id', id)
    .single();

  if (error) {
    console.error("Error fetching profile by ID:", error);
    return null;
  }

  if (!data) return null;

  // Map the fetched data to the Profile interface
  return {
    id: data.id,
    first_name: data.first_name,
    last_name: data.last_name,
    username: data.username,
    email: data.email,
    // Assuming roles is an object with a name property, but Supabase sometimes returns an array for joined tables
    role: (data.roles as { name: Profile['role'] } | null)?.name || 'student',
    establishment_id: data.establishment_id || undefined,
    enrollment_start_date: data.enrollment_start_date || undefined,
    enrollment_end_date: data.enrollment_end_date || undefined,
    theme: data.theme || undefined,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
};

/**
 * Trouve un profil par nom d'utilisateur.
 * @param username Le nom d'utilisateur à rechercher.
 * @returns Le profil trouvé ou null si non trouvé.
 */
export const findProfileByUsername = async (username: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      username,
      email,
      establishment_id,
      enrollment_start_date,
      enrollment_end_date,
      theme,
      created_at,
      updated_at,
      roles(name)
    `)
    .eq('username', username)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error("Error finding profile by username:", error);
    return null;
  }
  if (!data) return null;
  return {
    id: data.id,
    first_name: data.first_name,
    last_name: data.last_name,
    username: data.username,
    email: data.email,
    role: (data.roles as { name: Profile['role'] } | null)?.name || 'student',
    establishment_id: data.establishment_id || undefined,
    enrollment_start_date: data.enrollment_start_date || undefined,
    enrollment_end_date: data.enrollment_end_date || undefined,
    theme: data.theme || undefined,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
};

/**
 * Vérifie si un nom d'utilisateur existe déjà.
 * @param username Le nom d'utilisateur à vérifier.
 * @returns True si le nom d'utilisateur est pris, false sinon.
 */
export const checkUsernameExists = async (username: string): Promise<boolean> => {
  console.log(`[checkUsernameExists] Checking if username '${username}' exists...`);
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    console.error(`[checkUsernameExists] Error checking username availability for '${username}':`, error);
    if (error.code === 'PGRST116') {
      console.log(`[checkUsernameExists] Username '${username}' does not exist (PGRST116).`);
      return false; // No rows found, username is available
    }
    console.log(`[checkUsernameExists] Returning true (assuming taken) due to unexpected error for username '${username}'.`);
    return true; // Safer default: assume taken on unexpected error
  }
  
  console.log(`[checkUsernameExists] Result for username '${username}': data =`, data);
  return !!data; // If data is not null, username exists
};

/**
 * Trouve un profil par email.
 * @param email L'email à rechercher.
 * @returns Le profil trouvé ou null si non trouvé.
 */
export const findProfileByEmail = async (email: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      username,
      email,
      establishment_id,
      enrollment_start_date,
      enrollment_end_date,
      theme,
      created_at,
      updated_at,
      roles(name)
    `)
    .eq('email', email)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error("Error finding profile by email:", error);
    return null;
  }
  if (!data) return null;
  return {
    id: data.id,
    first_name: data.first_name,
    last_name: data.last_name,
    username: data.username,
    email: data.email,
    role: (data.roles as { name: Profile['role'] } | null)?.name || 'student',
    establishment_id: data.establishment_id || undefined,
    enrollment_start_date: data.enrollment_start_date || undefined,
    enrollment_end_date: data.enrollment_end_date || undefined,
    theme: data.theme || undefined,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
};

/**
 * Vérifie si un email existe déjà dans la table des profils.
 * @param email L'email à vérifier.
 * @returns True si l'email est pris, false sinon.
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  console.log(`[checkEmailExists] Checking if email '${email}' exists...`);
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error(`[checkEmailExists] Error checking email availability for '${email}':`, error);
    if (error.code === 'PGRST116') {
      console.log(`[checkEmailExists] Email '${email}' does not exist (PGRST116).`);
      return false; // No rows found, email is available
    }
    console.log(`[checkEmailExists] Returning true (assuming taken) due to unexpected error for email '${email}'.`);
    return true; // Safer default: assume taken on unexpected error
  }

  console.log(`[checkEmailExists] Result for email '${email}': data =`, data);
  return !!data; // If data is not null, email exists
};

export const updateProfile = async (updatedProfile: Partial<Profile>): Promise<Profile | null> => {
  // If role is being updated, get the role_id
  let role_id_to_update: string | undefined;
  if (updatedProfile.role) {
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', updatedProfile.role)
      .single();
    if (roleError) {
      console.error("Error fetching role_id for update:", roleError);
      throw roleError;
    }
    role_id_to_update = roleData.id;
  }

  const payload: any = {
    ...updatedProfile,
    role_id: role_id_to_update, // Use role_id for DB update
    role: undefined, // Remove role from payload to avoid sending it to DB
    // Explicitly set optional fields to null if they are undefined or empty string
    establishment_id: updatedProfile.establishment_id === '' ? null : updatedProfile.establishment_id,
    enrollment_start_date: updatedProfile.enrollment_start_date === '' ? null : updatedProfile.enrollment_start_date,
    enrollment_end_date: updatedProfile.enrollment_end_date === '' ? null : updatedProfile.enrollment_end_date,
    theme: updatedProfile.theme === undefined ? null : updatedProfile.theme,
  };

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', updatedProfile.id!);
    // Removed .select().single() to avoid PGRST116 error if no row is returned by RLS or query
  if (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
  // Re-fetch the profile to ensure we have the latest data after the update
  return getProfileById(updatedProfile.id!);
};

export const deleteProfile = async (profileId: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', profileId);
  if (error) {
    console.error("Error deleting profile:", error);
    throw error;
  }
};

export const getAllProfiles = async (): Promise<Profile[]> => {
  console.log("[getAllProfiles] Attempting to fetch all profiles...");
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      username,
      email,
      establishment_id,
      enrollment_start_date,
      enrollment_end_date,
      theme,
      created_at,
      updated_at,
      roles(name)
    `);
  if (error) {
    console.error("[getAllProfiles] Error fetching all profiles:", error);
    return [];
  }
  console.log(`[getAllProfiles] Successfully fetched ${data.length} profiles. Data:`, data);
  return data.map((p: any) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    username: p.username,
    email: p.email,
    role: (p.roles as { name: Profile['role'] } | null)?.name || 'student',
    establishment_id: p.establishment_id || undefined,
    enrollment_start_date: p.enrollment_start_date || undefined,
    enrollment_end_date: p.enrollment_end_date || undefined,
    theme: p.theme || undefined,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));
};

/**
 * Récupère tous les profils d'un rôle spécifique.
 * @param role Le rôle à filtrer.
 * @returns Un tableau de profils.
 */
export const getProfilesByRole = async (role: Profile['role']): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      username,
      email,
      establishment_id,
      enrollment_start_date,
      enrollment_end_date,
      roles(name)
    `)
    .eq('roles.name', role); // Filter by role name

  if (error) {
    console.error(`Error fetching profiles for role ${role}:`, error);
    return [];
  }

  return data.map((p: any) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    username: p.username,
    email: p.email,
    role: (p.roles as { name: Profile['role'] } | null)?.name || 'student',
    establishment_id: p.establishment_id || undefined,
    enrollment_start_date: p.enrollment_start_date || undefined,
    enrollment_end_date: p.enrollment_end_date || undefined,
  }));
};


export const getAllStudents = async (): Promise<Profile[]> => {
  const profiles = await getAllProfiles();
  return profiles.filter(p => p.role === 'student');
};

// --- Student Class Enrollment Management (Supabase) ---

/**
 * Récupère les affectations de classe pour un élève.
 * @param studentId L'ID de l'élève.
 * @returns Un tableau des affectations de classe.
 */
export const getStudentClassEnrollments = async (studentId: string): Promise<StudentClassEnrollment[]> => {
  const { data, error } = await supabase
    .from('student_class_enrollments')
    .select('*, school_years(name)') // Join to get school year name
    .eq('student_id', studentId);
  if (error) {
    console.error("Error fetching student class enrollments:", error);
    return [];
  }
  return data.map((enrollment: any) => ({
    id: enrollment.id,
    student_id: enrollment.student_id,
    class_id: enrollment.class_id,
    school_year_id: enrollment.school_year_id,
    school_year_name: enrollment.school_years?.name, // For convenience
    created_at: enrollment.created_at,
    updated_at: enrollment.updated_at,
  }));
};

/**
 * Récupère toutes les affectations de classe.
 * @returns Un tableau de toutes les affectations de classe.
 */
export const getAllStudentClassEnrollments = async (): Promise<StudentClassEnrollment[]> => {
  const { data, error } = await supabase
    .from('student_class_enrollments')
    .select('*, school_years(name)'); // Join to get school year name
  if (error) {
    console.error("Error fetching all student class enrollments:", error);
    return [];
  }
  return data.map((enrollment: any) => ({
    id: enrollment.id,
    student_id: enrollment.student_id,
    class_id: enrollment.class_id,
    school_year_id: enrollment.school_year_id,
    school_year_name: enrollment.school_years?.name, // For convenience
    created_at: enrollment.created_at,
    updated_at: enrollment.updated_at,
  }));
};

/**
 * Ajoute ou met à jour une affectation de classe pour un élève.
 * @param enrollment L'objet d'affectation de classe.
 * @returns L'affectation de classe ajoutée/mise à jour.
 */
export const upsertStudentClassEnrollment = async (enrollment: Omit<StudentClassEnrollment, 'id' | 'created_at' | 'updated_at' | 'school_year_name'>): Promise<StudentClassEnrollment | null> => {
  const { data, error } = await supabase
    .from('student_class_enrollments')
    .upsert(enrollment as any) // Cast to any to allow upsert without 'id' if it's new
    .select('*, school_years(name)')
    .single();
  if (error) {
    console.error("Error upserting student class enrollment:", error);
    throw error;
  }
  return {
    id: data.id,
    student_id: data.student_id,
    class_id: data.class_id,
    school_year_id: data.school_year_id,
    school_year_name: (data as any).school_years?.name,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
};

/**
 * Supprime une affectation de classe.
 * @param enrollmentId L'ID de l'affectation à supprimer.
 */
export const deleteStudentClassEnrollment = async (enrollmentId: string): Promise<void> => {
  const { error } = await supabase
    .from('student_class_enrollments')
    .delete()
    .eq('id', enrollmentId);
  if (error) {
    console.error("Error deleting student class enrollment:", error);
    throw error;
  }
};


// --- Student Course Progress Management (Supabase) ---
export const getStudentCourseProgress = async (userId: string, courseId: string): Promise<StudentCourseProgress | null> => {
  const { data, error } = await supabase
    .from('student_course_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();
  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error("Error fetching student course progress:", error);
    return null;
  }
  return data;
};

export const upsertStudentCourseProgress = async (progress: StudentCourseProgress): Promise<StudentCourseProgress | null> => {
  const { data, error } = await supabase
    .from('student_course_progress')
    .upsert(progress)
    .select()
    .single();
  if (error) {
    console.error("Error upserting student course progress:", error);
    throw error;
  }
  return data;
};

export const getAllStudentCourseProgress = async (): Promise<StudentCourseProgress[]> => {
  const { data, error } = await supabase
    .from('student_course_progress')
    .select('*');
  if (error) {
    console.error("Error fetching all student course progress:", error);
    return [];
  }
  return data;
};

// Utility functions (will need to fetch user data from auth.users or profiles table)
export const getUserFullName = async (userId: string): Promise<string> => {
  const profile = await getProfileById(userId);
  return profile ? `${profile.first_name} ${profile.last_name}` : 'N/A';
};

export const getUserUsername = (profile: Profile): string => {
  return profile.username;
};

export const getUserEmail = (profile: Profile): string => {
  return profile.email || 'N/A';
};

// Reset functions (for development/testing)
export const resetProfiles = async () => {
  const { error } = await supabase.from('profiles').delete(); // Delete all except a dummy ID if needed
  if (error) console.error("Error resetting profiles:", error);
};

export const resetStudentCourseProgress = async () => {
  const { error } = await supabase.from('student_course_progress').delete();
  if (error) console.error("Error resetting student course progress:", error);
};

export const resetStudentClassEnrollments = async () => {
  const { error } = await supabase.from('student_class_enrollments').delete();
  if (error) console.error("Error resetting student class enrollments:", error);
};