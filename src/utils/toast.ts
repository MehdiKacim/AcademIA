import { toast } from "sonner";
import { addNotification } from "@/lib/notificationData"; // Import addNotification
import { supabase } from "@/integrations/supabase/client"; // Import supabase client
import { Profile } from "@/lib/dataModels"; // Import Profile type

// Helper to get current user ID
const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

export const showSuccess = (message: string, title: string = "Succès", link?: string) => {
  toast.success(message);
  // Optionally add to persistent notifications
  getCurrentUserId().then(userId => {
    if (userId) {
      addNotification(userId, title, message, 'success', link).catch(console.error);
    }
  });
};

export const showError = (message: string, title: string = "Erreur", link?: string) => {
  toast.error(message);
  // Always add errors to persistent notifications
  getCurrentUserId().then(userId => {
    if (userId) {
      addNotification(userId, title, message, 'alert', link).catch(console.error);
    }
  });
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};