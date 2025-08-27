import { supabase } from "@/integrations/supabase/client";
import { Notification } from "./dataModels";

/**
 * Ajoute une nouvelle notification à la base de données.
 * @param userId L'ID de l'utilisateur destinataire.
 * @param title Le titre de la notification.
 * @param message Le message de la notification.
 * @param type Le type de notification ('info', 'warning', 'success', 'alert').
 * @param link Un lien optionnel pour la navigation.
 * @returns La notification ajoutée.
 */
export const addNotification = async (
  userId: string,
  title: string,
  message: string,
  type: Notification['type'] = 'info',
  link?: string
): Promise<Notification | null> => {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
      link,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding notification:", error);
    throw error;
  }
  return data;
};

/**
 * Récupère toutes les notifications pour un utilisateur donné.
 * @param userId L'ID de l'utilisateur.
 * @returns Un tableau de notifications, triées par date de création décroissante.
 */
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
  return data;
};

/**
 * Marque une notification spécifique comme lue.
 * @param notificationId L'ID de la notification à marquer comme lue.
 * @returns La notification mise à jour ou null.
 */
export const markNotificationAsRead = async (notificationId: string): Promise<Notification | null> => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
  return data;
};

/**
 * Marque toutes les notifications d'un utilisateur comme lues.
 * @param userId L'ID de l'utilisateur.
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false); // Only update unread ones

  if (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

/**
 * Supprime une notification spécifique.
 * @param notificationId L'ID de la notification à supprimer.
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
};

/**
 * Récupère le nombre de notifications non lues pour un utilisateur.
 * @param userId L'ID de l'utilisateur.
 * @returns Le nombre de notifications non lues.
 */
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error("Error fetching unread notification count:", error);
    return 0;
  }
  return count || 0;
};

/**
 * Réinitialise la table des notifications (pour le développement/test).
 */
export const resetNotifications = async (): Promise<void> => {
  const { error } = await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) console.error("Error resetting notifications:", error);
};