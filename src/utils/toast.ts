import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/lib/dataModels";
import ImmersiveToast from "@/components/ui/ImmersiveToast"; // Import the new component
import React from "react"; // Import React for JSX

// Helper to get current user ID (no longer needed for toasts, but kept for potential future use if needed elsewhere)
const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

interface ToastAction {
  label: string;
  onClick: () => void;
}

export const showSuccess = (message: string, title: string = "Succès", action?: ToastAction) => {
  toast.custom((t) => (
    <ImmersiveToast
      title={title}
      message={message}
      type="success"
      action={action}
    />
  ), { duration: 5000 });
};

export const showError = (message: string, title: string = "Erreur", action?: ToastAction) => {
  toast.custom((t) => (
    <ImmersiveToast
      title={title}
      message={message}
      type="error"
      action={action}
    />
  ), { duration: 5000 });
};

export const showLoading = (message: string, title: string = "Chargement...", action?: ToastAction) => {
  return toast.custom((t) => (
    <ImmersiveToast
      title={title}
      message={message}
      type="loading"
      action={action}
    />
  ), { duration: Infinity }); // Loading toasts usually have infinite duration until dismissed
};

export const dismissToast = (toastId: string | number) => { // toastId can be string or number
  toast.dismiss(toastId);
};