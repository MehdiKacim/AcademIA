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
  // For security, direct email lookup on profiles table is not recommended as email is in auth.users
  // Instead, you'd typically get the user from auth.users first, then their profile by ID.
  // For now, we'll simulate by checking if a profile exists with that email (less secure for direct lookup)
  // In a real app, you'd use auth.getUser() or similar.
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error("Error listing users for email lookup:", userError);
    return null;
  }
  const foundUser = users?.find((u: SupabaseUser) => u.email === email);
  if (foundUser) {
    return getProfileById(foundUser.id);
  }
  return null;
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