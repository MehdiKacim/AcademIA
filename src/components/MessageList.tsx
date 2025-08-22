import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message } from "@/lib/dataModels";
import { getRecentConversations, getUnreadMessageCount } from "@/lib/messageData";
import { getAllProfiles } from "@/lib/studentData";
import { useRole } from "@/contexts/RoleContext";
import { Profile } from '@/lib/dataModels';
import { cn } from "@/lib/utils";
import { MessageSquare, Mail, FileText, Paperclip, Archive, ArchiveRestore } from "lucide-react"; // Import Paperclip, Archive, ArchiveRestore
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface MessageListProps {
  recentMessages: Message[]; // Now represents either recent or archived based on isArchivedView
  allProfiles: Profile[];
  onSelectContact: (contact: Profile, initialCourseId?: string, initialCourseTitle?: string) => void;
  selectedContactId: string | null;
  onUnreadCountChange: (count: number) => void;
  onArchiveConversation: (contactId: string) => void; // New prop
  onUnarchiveConversation: (contactId: string) => void; // New prop
  isArchivedView?: boolean; // New prop to indicate if this list shows archived messages
}

const MessageList = ({ recentMessages, allProfiles, onSelectContact, selectedContactId, onUnreadCountChange, onArchiveConversation, onUnarchiveConversation, isArchivedView = false }: MessageListProps) => {
  const { currentUserProfile } = useRole();
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());

  const currentUserId = currentUserProfile?.id;

  // Calculate unread counts whenever recentMessages or currentUserId changes
  useEffect(() => {
    if (!currentUserId) return;

    const counts = new Map<string, number>();
    let totalUnread = 0;
    for (const msg of recentMessages) {
      if (msg.receiver_id === currentUserId && !msg.is_read && !msg.is_archived) { // Only count unread, non-archived
        const senderId = msg.sender_id;
        counts.set(senderId, (counts.get(senderId) || 0) + 1);
        totalUnread++;
      }
    }
    setUnreadCounts(counts);
    onUnreadCountChange(totalUnread);
    console.log(`[MessageList] Unread counts updated. Total unread: ${totalUnread}`);
  }, [recentMessages, currentUserId, onUnreadCountChange]);


  const getContactProfile = (message: Message) => {
    const contactId = message.sender_id === currentUserId ? message.receiver_id : message.sender_id;
    return allProfiles.find(p => p.id === contactId);
  };

  // Long press logic for mobile
  const touchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTouchStart = (e: React.TouchEvent, contactProfile: Profile) => {
    console.log("[MessageList] Touch start for long press.");
    touchTimeout.current = setTimeout(() => {
      // Prevent default touch behavior (like scrolling)
      e.preventDefault(); 
      // For simplicity, we'll just trigger the archive/unarchive directly for now
      // In a real app, you might open a custom modal or action sheet
      if (isArchivedView) {
        console.log("[MessageList] Long press: Unarchiving conversation.");
        onUnarchiveConversation(contactProfile.id);
      } else {
        console.log("[MessageList] Long press: Archiving conversation.");
        onArchiveConversation(contactProfile.id);
      }
    }, 700); // 700ms for long press
  };

  const handleTouchEnd = () => {
    console.log("[MessageList] Touch end.");
    if (touchTimeout.current) {
      clearTimeout(touchTimeout.current);
    }
  };

  const handleTouchMove = () => {
    console.log("[MessageList] Touch move.");
    if (touchTimeout.current) {
      clearTimeout(touchTimeout.current);
    }
  };

  console.log(`[MessageList] Rendering with ${recentMessages.length} messages. isArchivedView: ${isArchivedView}`);

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          {isArchivedView ? <Archive className="h-6 w-6 text-primary" /> : <MessageSquare className="h-6 w-6 text-primary" />}
          {isArchivedView ? 'Conversations Archivées' : 'Mes Conversations'}
        </CardTitle>
        <CardDescription>
          {isArchivedView ? 'Retrouvez vos conversations archivées ici.' : 'Sélectionnez une conversation pour commencer à chatter.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto pr-2">
        {recentMessages.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            {isArchivedView ? 'Aucune conversation archivée.' : 'Aucune conversation récente.'}
          </p>
        ) : (
          <div className="space-y-2">
            {recentMessages.map((message) => {
              const contactProfile = getContactProfile(message);
              if (!contactProfile) return null;

              const unreadCount = unreadCounts.get(contactProfile.id) || 0;

              return (
                <ContextMenu key={message.id}>
                  <ContextMenuTrigger asChild>
                    <Card
                      className={cn(
                        "cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
                        selectedContactId === contactProfile.id && "bg-accent text-accent-foreground",
                        isArchivedView && "opacity-60 border-dashed border-muted-foreground/50" // Visual indicator for archived
                      )}
                      onClick={() => onSelectContact(contactProfile, message.course_id, message.course_id ? `Cours ID: ${message.course_id}` : undefined)}
                      onTouchStart={(e) => handleTouchStart(e, contactProfile)}
                      onTouchEnd={handleTouchEnd}
                      onTouchMove={handleTouchMove}
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
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-auto p-1">
                    {isArchivedView ? (
                      <ContextMenuItem className="p-2" onClick={() => onUnarchiveConversation(contactProfile.id)}>
                        <ArchiveRestore className="mr-2 h-4 w-4" /> Désarchiver
                      </ContextMenuItem>
                    ) : (
                      <ContextMenuItem className="p-2" onClick={() => onArchiveConversation(contactProfile.id)}>
                        <Archive className="mr-2 h-4 w-4" /> Archiver
                      </ContextMenuItem>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>
        )}
      </CardContent>
    </div>
  );
};

export default MessageList;