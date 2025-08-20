import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message } from "@/lib/dataModels";
import { getRecentConversations, getUnreadMessageCount } from "@/lib/messageData";
import { getAllProfiles } from "@/lib/studentData";
import { useRole } from "@/contexts/RoleContext";
import { Profile } from '@/lib/dataModels';
import { cn } from "@/lib/utils";
import { MessageSquare, Mail, FileText, Paperclip } from "lucide-react"; // Import Paperclip

interface MessageListProps {
  recentMessages: Message[]; // Now received as prop
  allProfiles: Profile[]; // Now received as prop
  onSelectContact: (contact: Profile, initialCourseId?: string, initialCourseTitle?: string) => void;
  selectedContactId: string | null;
  onUnreadCountChange: (count: number) => void;
}

const MessageList = ({ recentMessages, allProfiles, onSelectContact, selectedContactId, onUnreadCountChange }: MessageListProps) => {
  const { currentUserProfile } = useRole();
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());

  const currentUserId = currentUserProfile?.id;

  // Calculate unread counts whenever recentMessages or currentUserId changes
  useEffect(() => {
    if (!currentUserId) return;

    const counts = new Map<string, number>();
    let totalUnread = 0;
    for (const msg of recentMessages) {
      if (msg.receiver_id === currentUserId && !msg.is_read) {
        const senderId = msg.sender_id;
        counts.set(senderId, (counts.get(senderId) || 0) + 1);
        totalUnread++;
      }
    }
    setUnreadCounts(counts);
    onUnreadCountChange(totalUnread);
  }, [recentMessages, currentUserId, onUnreadCountChange]);


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