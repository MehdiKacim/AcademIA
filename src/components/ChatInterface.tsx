import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip, Download, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message } from "@/lib/dataModels";
import { sendMessage, getConversation, markMessagesAsRead, getSignedFileUrl } from "@/lib/messageData";
import { useRole } from "@/contexts/RoleContext";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from '@/lib/dataModels';

interface ChatInterfaceProps {
  contact: Profile; // The other user in the conversation
  onMessageSent: () => void; // Callback to refresh parent list (e.g., unread count)
  initialCourseId?: string; // Optional course context
  initialCourseTitle?: string; // Optional course title for context
}

const ChatInterface = ({ contact, onMessageSent, initialCourseId, initialCourseTitle }: ChatInterfaceProps) => {
  const { currentUserProfile } = useRole();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUserId = currentUserProfile?.id;
  const contactId = contact.id;

  useEffect(() => {
    if (!currentUserId || !contactId) return;

    const fetchMessages = async () => {
      const fetchedMessages = await getConversation(currentUserId, contactId);
      setMessages(fetchedMessages);
      // Mark messages received by current user as read
      const unreadMessages = fetchedMessages.filter(msg => msg.receiver_id === currentUserId && !msg.is_read);
      if (unreadMessages.length > 0) {
        await markMessagesAsRead(unreadMessages.map(msg => msg.id), currentUserId);
        onMessageSent(); // Notify parent to update unread count
      }
    };

    fetchMessages();

    // Set up real-time listener for new messages
    const channel = supabase
      .channel(`chat_${currentUserId}_${contactId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `(sender_id=eq.${contactId},receiver_id=eq.${currentUserId})`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prevMessages) => [...prevMessages, newMessage]);
          // Mark new message as read immediately
          markMessagesAsRead([newMessage.id], currentUserId);
          onMessageSent(); // Notify parent
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, contactId, onMessageSent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentUserId || !contactId || (!inputContent.trim() && !attachedFile)) return;

    setIsSending(true);
    try {
      await sendMessage(currentUserId, contactId, inputContent.trim(), initialCourseId, attachedFile || undefined);
      setInputContent('');
      setAttachedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear file input
      }
      const updatedMessages = await getConversation(currentUserId, contactId); // Re-fetch to get the new message
      setMessages(updatedMessages);
      onMessageSent(); // Notify parent
      showSuccess("Message envoyé !");
    } catch (error: any) {
      console.error("Failed to send message:", error);
      showError(`Échec de l'envoi du message: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadFile = async (filePath: string) => {
    try {
      const signedUrl = await getSignedFileUrl(filePath);
      if (signedUrl) {
        window.open(signedUrl, '_blank');
      } else {
        showError("Impossible de télécharger le fichier.");
      }
    } catch (error: any) {
      console.error("Error downloading file:", error);
      showError(`Erreur lors du téléchargement: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Chat avec {contact.first_name} {contact.last_name} (@{contact.username})
        </h3>
        {initialCourseTitle && (
          <span className="text-sm text-muted-foreground">Contexte: {initialCourseTitle}</span>
        )}
      </div>
      <ScrollArea className="flex-grow p-4">
        <div className="flex flex-col space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-end gap-2",
                msg.sender_id === currentUserId ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[70%] p-3 rounded-lg",
                  msg.sender_id === currentUserId
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-muted-foreground rounded-bl-none"
                )}
              >
                {msg.content}
                {msg.file_url && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownloadFile(msg.file_url!)}
                      className="flex items-center gap-1"
                    >
                      <Paperclip className="h-4 w-4" />
                      <Download className="h-4 w-4" />
                      Fichier
                    </Button>
                  </div>
                )}
                <div className="text-right text-xs opacity-70 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.sender_id === currentUserId && (
                    <span className="ml-2">
                      {msg.is_read ? 'Lu' : 'Envoyé'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-border">
        {attachedFile && (
          <div className="flex items-center justify-between p-2 mb-2 border rounded-md bg-muted text-muted-foreground">
            <span>Fichier attaché: {attachedFile.name}</span>
            <Button variant="ghost" size="icon" onClick={handleRemoveFile}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="Écrivez votre message..."
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isSending}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
          >
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Joindre un fichier</span>
          </Button>
          <Button onClick={handleSendMessage} disabled={isSending || (!inputContent.trim() && !attachedFile)}>
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            <span className="sr-only">Envoyer</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;