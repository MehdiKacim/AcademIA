import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message } from "@/lib/dataModels";
import { getRecentConversations, getUnreadMessageCount } from "@/lib/messageData";
import { getAllProfiles } from "@/lib/studentData";
import { useRole } from "@/contexts/RoleContext";
import { Profile } from '@/lib/dataModels';
import { cn } from "@/lib/utils";
import { MessageSquare, Mail, FileText } from "lucide-react";

interface MessageListProps {
  onSelectContact: (contact: Profile, initialCourseId?: string, initialCourseTitle?: string) => void;
  selectedContactId: string | null;
  onUnreadCountChange: (count: number) => void;
}

const MessageList = ({ onSelectContact, selectedContactId, onUnreadCountChange }: MessageListProps) => {
  const { currentUserProfile } = useRole();
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());

  const currentUserId = currentUserProfile?.id;

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUserId) return;
      const profiles = await getAllProfiles();
      setAllProfiles(profiles);
      const messages = await getRecentConversations(currentUserId);
      setRecentMessages(messages);

      const totalUnread = await getUnreadMessageCount(currentUserId);
      onUnreadCountChange(totalUnread);

      const counts = new Map<string, number>();
      for (const msg of messages) {
        if (msg.receiver_id === currentUserId && !msg.is_read) {
          const senderId = msg.sender_id;
          counts.set(senderId, (counts.get(senderId) || 0) + 1);
        }
      }
      setUnreadCounts(counts);
    };

    fetchData();

    // Set up real-time listener for new messages to update the list and unread counts
    const channel = supabase
      .channel(`messages_list_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setRecentMessages(prev => {
            const existingIndex = prev.findIndex(msg =>
              (msg.sender_id === newMessage.sender_id && msg.receiver_id === newMessage.receiver_id) ||
              (msg.sender_id === newMessage.receiver_id && msg.receiver_id === newMessage.sender_id)
            );
            if (existingIndex > -1) {
              const updated = [...prev];
              updated[existingIndex] = newMessage;
              return updated.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            }
            return [newMessage, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          });
          setUnreadCounts(prev => {
            const newCounts = new Map(prev);
            newCounts.set(newMessage.sender_id, (newCounts.get(newMessage.sender_id) || 0) + 1);
            return newCounts;
          });
          onUnreadCountChange((prev) => prev + 1); // Increment total unread count
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          if (updatedMessage.is_read) {
            setUnreadCounts(prev => {
              const newCounts = new Map(prev);
              const senderId = updatedMessage.sender_id;
              if (newCounts.has(senderId) && newCounts.get(senderId)! > 0) {
                newCounts.set(senderId, newCounts.get(senderId)! - 1);
              }
              return newCounts;
            });
            onUnreadCountChange((prev) => prev - 1); // Decrement total unread count
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, onUnreadCountChange]);

  const getContactProfile = (message: Message) => {
    const contactId = message.sender_id === currentUserId ? message.receiver_id : message.sender_id;
    return allProfiles.find(p => p.id === contactId);
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" /> Mes Conversations
        </CardTitle>
        <CardDescription>Sélectionnez une conversation pour commencer à chatter.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto pr-2">
        {recentMessages.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Aucune conversation récente.</p>
        ) : (
          <div className="space-y-2">
            {recentMessages.map((message) => {
              const contactProfile = getContactProfile(message);
              if (!contactProfile) return null;

              const unreadCount = unreadCounts.get(contactProfile.id) || 0;

              return (
                <Card
                  key={message.id}
                  className={cn(
                    "cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
                    selectedContactId === contactProfile.id && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => onSelectContact(contactProfile, message.course_id, message.course_id ? `Cours ID: ${message.course_id}` : undefined)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${contactProfile.first_name} ${contactProfile.last_name}`} />
                      <AvatarFallback>{contactProfile.first_name[0]}{contactProfile.last_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                      <p className="font-medium">{contactProfile.first_name} {contactProfile.last_name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {message.sender_id === currentUserId ? "Vous: " : ""}
                        {message.file_url ? <><Paperclip className="inline h-3 w-3 mr-1" /> Fichier</> : message.content}
                      </p>
                    </div>
                    <div className="flex flex-col items-end text-xs text-muted-foreground">
                      <span>{new Date(message.created_at).toLocaleDateString()}</span>
                      {unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 mt-1">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </div>
  );
};

export default MessageList;