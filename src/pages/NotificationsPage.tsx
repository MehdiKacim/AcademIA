import React, { useState, useEffect } from 'react';
import { BellRing, CheckCircle, XCircle, Trash2, Mail, ExternalLink, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRole } from '@/contexts/RoleContext';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '@/lib/notificationData';
import { Notification } from '@/lib/dataModels';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const NotificationsPage = () => {
  const { currentUserProfile, isLoadingUser } = useRole();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (currentUserProfile?.id) {
        const fetchedNotifications = await getNotifications(currentUserProfile.id);
        setNotifications(fetchedNotifications);
      }
    };
    fetchNotifications();
  }, [currentUserProfile?.id, refreshKey]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (currentUserProfile?.id) {
      try {
        await markAllNotificationsAsRead(currentUserProfile.id);
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error("Error marking all notifications as read:", error);
      }
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'alert': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'info':
      default: return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getNotificationColorClass = (type: Notification['type']) => {
    switch (type) {
      case 'success': return "border-green-500 bg-green-50/20 dark:bg-green-900/20";
      case 'warning': return "border-yellow-500 bg-yellow-50/20 dark:bg-yellow-900/20";
      case 'alert': return "border-red-500 bg-red-50/20 dark:bg-red-900/20";
      case 'info':
      default: return "border-blue-500 bg-blue-50/20 dark:bg-blue-900/20";
    }
  };

  if (isLoadingUser) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Chargement des notifications...
        </h1>
        <p className="text-lg text-muted-foreground">
          Veuillez patienter.
        </p>
      </div>
    );
  }

  if (!currentUserProfile) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès Restreint
        </h1>
        <p className="text-lg text-muted-foreground">
          Veuillez vous connecter pour voir vos notifications.
        </p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Mes Notifications
      </h1>
      <p className="text-lg text-muted-foreground">
        Retrouvez ici toutes vos alertes et informations importantes.
      </p>

      <Card className="rounded-android-tile">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-6 w-6 text-primary" />
            Toutes les notifications
          </CardTitle>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              Marquer tout comme lu ({unreadCount})
            </Button>
          )}
        </CardHeader>
        <CardDescription className="px-6">
          Vous avez {unreadCount} notification(s) non lue(s).
        </CardDescription>
        <CardContent className="pt-4">
          <ScrollArea className="h-[60vh] w-full rounded-md border p-3 bg-muted/20">
            {notifications.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucune notification pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={cn(
                      "p-3 flex items-start gap-3 rounded-android-tile transition-all duration-200",
                      getNotificationColorClass(notification.type),
                      notification.is_read ? "opacity-70" : "border-l-4 border-primary/50 shadow-md"
                    )}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-grow cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                      <p className="font-semibold text-foreground">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(parseISO(notification.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </p>
                      {notification.link && (
                        <span className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1">
                          Voir plus <ExternalLink className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {!notification.is_read && (
                        <Button variant="ghost" size="icon" onClick={() => handleMarkAsRead(notification.id)}>
                          <Mail className="h-4 w-4 text-primary" />
                          <span className="sr-only">Marquer comme lu</span>
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Supprimer</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action ne peut pas être annulée. Cela supprimera définitivement cette notification.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteNotification(notification.id)}>Supprimer</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;