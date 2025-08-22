import { Profile, User, StudentCourseProgress } from "./dataModels"; // Import Profile and StudentCourseProgress
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client
import { User as SupabaseUser } from '@supabase/supabase-js'; // Import Supabase User type

// --- User & Profile Management (Supabase) ---

// Note: User authentication (signup, login) will be handled by Supabase Auth directly.
// This file will focus on managing the 'profiles' table and related data.

export const getProfileById = async (id: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    console.error("Error fetching profile by ID:", error);
    return null;
  }
  return data;
};

/**
 * Trouve un profil par nom d'utilisateur.
 * @param username Le nom d'utilisateur à rechercher.
 * @returns Le profil trouvé ou null si non trouvé.
 */
export const findProfileByUsername = async (username: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error("Error finding profile by username:", error);
    return null;
  }
  return data;
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
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error("Error finding profile by email:", error);
    return null;
  }
  return data;
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
  const { data, error } = await supabase
    .from('profiles')
    .update(updatedProfile)
    .eq('id', updatedProfile.id)
    .select()
    .single();
  if (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
  return data;
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
  const { data, error } = await supabase
    .from('profiles')
    .select('*');
  if (error) {
    console.error("Error fetching all profiles:", error);
    return [];
  }
  return data;
};

export const getAllStudents = async (): Promise<Profile[]> => {
  const profiles = await getAllProfiles();
  return profiles.filter(p => p.role === 'student');
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
  const { error } = await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except a dummy ID if needed
  if (error) console.error("Error resetting profiles:", error);
};

export const resetStudentCourseProgress = async () => {
  const { error } = await supabase.from('student_course_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) console.error("Error resetting student course progress:", error);
};