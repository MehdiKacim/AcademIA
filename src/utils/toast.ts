import { toast } from "sonner";
// Removed import for addNotification
import { supabase } from "@/integrations/supabase/client"; // Import supabase client
import { Profile } from "@/lib/dataModels"; // Import Profile type

// Helper to get current user ID (no longer needed for toasts, but kept for potential future use if needed elsewhere)
const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

export const showSuccess = (message: string, title: string = "Succès", link?: string) => {
  toast.success(message);
  // Removed optional add to persistent notifications
};

export const showError = (message: string, title: string = "Erreur", link?: string) => {
  toast.error(message);
  // Removed always add errors to persistent notifications
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};