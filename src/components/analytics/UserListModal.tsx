import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Profile } from "@/lib/dataModels";
import { User, Mail, Building2 } from "lucide-react";

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  users: Profile[];
  establishments: { id: string; name: string }[];
}

const UserListModal = ({ isOpen, onClose, title, description, users, establishments }: UserListModalProps) => {
  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-6 backdrop-blur-lg bg-background/80 rounded-android-tile">
        <div className="flex flex-col h-full"> {/* Wrap children in a single div */}
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
              {title}
            </DialogTitle>
            <DialogDescription>
              {description}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-grow pr-2">
            <div className="grid gap-4">
              {users.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Aucun utilisateur trouvé.</p>
              ) : (
                users.map(user => (
                  <Card key={user.id} className="p-3 rounded-android-tile"> {/* Apply rounded-android-tile */}
                    <CardContent className="p-0 flex items-center gap-3">
                      <User className="h-8 w-8 text-primary" />
                      <div className="flex-grow">
                        <p className="font-medium">{user.first_name} {user.last_name} (@{user.username})</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {user.email}
                        </p>
                        {/* Removed establishment_id display */}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserListModal;