import { supabase } from "@/integrations/supabase/client";
import { Message, Profile } from "./dataModels";

const MESSAGE_BUCKET = 'message_attachments';

/**
 * Envoie un nouveau message.
 * @param senderId L'ID de l'expéditeur.
 * @param receiverId L'ID du destinataire.
 * @param content Le contenu du message.
 * @param courseId L'ID du cours si le message est lié à un cours (optionnel).
 * @param file Le fichier à joindre (optionnel).
 * @returns Le message envoyé avec son ID.
 */
export const sendMessage = async (
  senderId: string,
  receiverId: string,
  content: string,
  courseId?: string,
  file?: File
): Promise<Message | null> => {
  let fileUrl: string | undefined;
  let messageId: string | undefined;

  // First, insert the message to get an ID for the file path
  const { data: messageData, error: messageError } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      course_id: courseId,
      content: content,
      is_read: false,
      is_archived: false, // New messages are not archived by default
    })
    .select()
    .single();

  if (messageError) {
    console.error("Error sending message:", messageError);
    throw messageError;
  }

  messageId = messageData.id;

  if (file && messageId) {
    const filePath = `${senderId}/${messageId}/${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(MESSAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      // Attempt to delete the message if file upload fails
      await supabase.from('messages').delete().eq('id', messageId);
      throw uploadError;
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(MESSAGE_BUCKET)
      .getPublicUrl(filePath);
    
    fileUrl = urlData?.publicUrl;

    // Update the message with the file URL
    const { data: updatedMessageData, error: updateError } = await supabase
      .from('messages')
      .update({ file_url: fileUrl })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating message with file URL:", updateError);
      throw updateError;
    }
    return updatedMessageData;
  }

  return messageData;
};

/**
 * Récupère tous les messages entre deux utilisateurs.
 * @param userId1 L'ID du premier utilisateur.
 * @param userId2 L'ID du second utilisateur.
 * @returns Un tableau de messages.
 */
export const getConversation = async (userId1: string, userId2: string): Promise<Message[]> => {
  // First, implicitly unarchive the conversation when it's opened
  await unarchiveConversation(userId1, userId2);

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error fetching conversation:", error);
    throw error; // Re-throw to be caught by the calling component
  }

  return data;
};

/**
 * Récupère toutes les conversations récentes d'un utilisateur (les derniers messages de chaque contact non archivés).
 * @param userId L'ID de l'utilisateur.
 * @returns Un tableau des derniers messages de chaque conversation non archivée.
 */
export const getRecentConversations = async (userId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq('is_archived', false) // Filter out archived messages
    .order('created_at', { ascending: false }); // Order by most recent first

  if (error) {
    console.error("Error fetching recent conversations:", error);
    return [];
  }

  const conversationsMap = new Map<string, Message>(); // Key: other_user_id

  for (const message of data) {
    const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;
    // Only keep the most recent message for each conversation
    if (!conversationsMap.has(otherUserId)) {
      conversationsMap.set(otherUserId, message);
    }
  }

  return Array.from(conversationsMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

/**
 * Récupère toutes les conversations archivées d'un utilisateur.
 * @param userId L'ID de l'utilisateur.
 * @returns Un tableau des derniers messages de chaque conversation archivée.
 */
export const getArchivedConversations = async (userId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq('is_archived', true) // Only archived messages
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching archived conversations:", error);
    return [];
  }

  const conversationsMap = new Map<string, Message>(); // Key: other_user_id

  for (const message of data) {
    const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;
    if (!conversationsMap.has(otherUserId)) {
      conversationsMap.set(otherUserId, message);
    }
  }

  return Array.from(conversationsMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

/**
 * Archive une conversation entre deux utilisateurs.
 * @param userId1 L'ID du premier utilisateur.
 * @param userId2 L'ID du second utilisateur.
 */
export const archiveConversation = async (userId1: string, userId2: string): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .update({ is_archived: true })
    .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`);

  if (error) {
    console.error("Error archiving conversation:", error);
    throw error;
  }
};

/**
 * Désarchive une conversation entre deux utilisateurs.
 * @param userId1 L'ID du premier utilisateur.
 * @param userId2 L'ID du second utilisateur.
 */
export const unarchiveConversation = async (userId1: string, userId2: string): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .update({ is_archived: false })
    .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`);

  if (error) {
    console.error("Error unarchiving conversation:", error);
    throw error;
  }
};

/**
 * Marque les messages comme lus.
 * @param messageIds Un tableau d'IDs de messages à marquer comme lus.
 * @param userId L'ID de l'utilisateur qui marque les messages comme lus (doit être le destinataire).
 */
export const markMessagesAsRead = async (messageIds: string[], userId: string): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .in('id', messageIds)
    .eq('receiver_id', userId); // Only the receiver can mark as read

  if (error) {
    console.error("Error marking messages as read:", error);
    throw error;
  }
};

/**
 * Récupère le nombre de messages non lus pour un utilisateur.
 * @param userId L'ID de l'utilisateur.
 * @returns Le nombre de messages non lus.
 */
export const getUnreadMessageCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact' })
    .eq('receiver_id', userId)
    .eq('is_read', false)
    .eq('is_archived', false); // Only count unread, non-archived messages

  if (error) {
    console.error("Error fetching unread message count:", error);
    return 0;
  }
  return count || 0;
};

/**
 * Supprime un message.
 * @param messageId L'ID du message à supprimer.
 * @param userId L'ID de l'utilisateur qui supprime le message (doit être l'expéditeur).
 */
export const deleteMessage = async (messageId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
    .eq('sender_id', userId); // Only sender can delete their own message

  if (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
};

/**
 * Récupère l'URL signée d'un fichier attaché.
 * @param filePath Le chemin du fichier dans le bucket de stockage.
 * @returns L'URL signée du fichier.
 */
export const getSignedFileUrl = async (filePath: string): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from(MESSAGE_BUCKET)
    .createSignedUrl(filePath, 60); // URL valide pour 60 secondes

  if (error) {
    console.error("Error getting signed URL:", error);
    return null;
  }
  return data?.signedUrl;
};