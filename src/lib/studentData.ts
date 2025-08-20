import { Profile, User, StudentCourseProgress } from "./dataModels"; // Import Profile and StudentCourseProgress
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client

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

export const getProfileByUsername = async (username: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();
  if (error) {
    // console.error("Error fetching profile by username:", error); // Log only if needed for debugging
    return null;
  }
  return data;
};

export const getProfileByEmail = async (email: string): Promise<Profile | null> => {
  // Query the public.profiles table directly for email
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();
  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error("Error fetching profile by email:", error);
    return null;
  }
  return data;
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
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', userId)
    .single();
  if (error || !profile) {
    console.error("Error fetching user full name:", error);
    return 'N/A';
  }
  return `${profile.first_name} ${profile.last_name}`;
};

export const getUserUsername = async (userId: string): Promise<string> => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .single();
  if (error || !profile) {
    console.error("Error fetching user username:", error);
    return 'N/A';
  }
  return profile.username;
};

export const getUserEmail = async (userId: string): Promise<string> => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();
  if (error || !profile) {
    console.error("Error fetching user email:", error);
    return 'N/A';
  }
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