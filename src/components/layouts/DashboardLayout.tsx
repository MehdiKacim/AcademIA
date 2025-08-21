import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, PlusSquare, BarChart2, User, LogOut, Settings, GraduationCap, PenTool, Users, NotebookText, School, Search, ArrowLeft, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, BarChartBig, MessageSquare } from "lucide-react"; // Added MessageSquare
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { ThemeToggle } from "../theme-toggle";
import { Button } from "@/components/ui/button";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRole } from "@/contexts/RoleContext";
import AiAPersistentChat from "@/components/AiAPersistentChat";
import { useCourseChat } from "@/contexts/CourseChatContext";
import FloatingAiAChatButton from "@/components/FloatingAiAChatButton";
import GlobalSearchOverlay from "@/components/GlobalSearchOverlay";
import DataModelModal from "@/components/DataModelModal";
import React, { useState, useEffect, useCallback } from "react";
import { getUnreadMessageCount } from "@/lib/messageData"; // Import getUnreadMessageCount
import { supabase } from "@/integrations/supabase/client"; // Import supabase for realtime
import { Message } from "@/lib/dataModels"; // Import Message type
import { NavItem } from "@/lib/dataModels"; // Import NavItem from dataModels

const DashboardLayout = () => {
  const isMobile = useIsMobile();
  const { currentUserProfile, currentRole, signOut } = useRole(); // Destructure signOut
  const { openChat } = useCourseChat();
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [isDataModelModalOpen, setIsDataModelModalOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0); // State for unread messages
  const navigate = useNavigate();
  const location = useLocation();

  const [currentNavLevel, setCurrentNavLevel] = useState<string | null>(null);

  const handleLogout = async () => { // Make it async
    await signOut(); // Call the signOut function from context
    navigate("/");
  };

  useEffect(() => {
    const mainItems = getMainNavItems();
    let foundParentLabel: string | null = null;

    // Iterate through main items to find if current path belongs to any sub-menu
    for (const item of mainItems) {
      if (item.type === 'trigger' && item.items) {
        // Check if any sub-item's full path (including query) matches the current full path
        const currentFullPath = location.pathname + location.search;
        if (item.items.some(subItem => subItem.to && currentFullPath.startsWith(subItem.to))) {
          foundParentLabel = item.label.toLowerCase().replace(/\s/g, '-');
          break;
        }
      }
    }
    setCurrentNavLevel(foundParentLabel);
  }, [location.pathname, location.search, currentRole]); // Add location.search to dependencies


  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isModifierPressed = event.ctrlKey || event.metaKey;

    if (currentUserProfile) { // Use currentUserProfile
      if (isModifierPressed && event.key === 'f') {
        event.preventDefault();
        setIsSearchOverlayOpen(true);
      } else if (isModifierPressed && event.key === 'm') {
        event.preventDefault();
        setIsDataModelModalOpen(true);
      }
    }
  }, [currentUserProfile]); // Depend on currentUserProfile

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Fetch unread message count and set up real-time listener
  useEffect(() => {
    let channel: any;
    const fetchUnreadCount = async () => {
      if (currentUserProfile?.id) {
        const count = await getUnreadMessageCount(currentUserProfile.id);
        setUnreadMessages(count);

        // Set up real-time listener for new messages
        channel = supabase
          .channel(`unread_messages_${currentUserProfile.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `receiver_id=eq.${currentUserProfile.id}`
            },
            (payload) => {
              setUnreadMessages(prev => prev + 1);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'messages',
              filter: `receiver_id=eq.${currentUserProfile.id}`
            },
            (payload) => {
              const updatedMessage = payload.new as Message;
              if (updatedMessage.is_read) {
                setUnreadMessages(prev => Math.max(0, prev - 1)); // Ensure count doesn't go below zero
              }
            }
          )
          .subscribe();
      }
    };

    fetchUnreadCount();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [currentUserProfile?.id]);


  const getMainNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      { to: "/dashboard", icon: Home, label: "Tableau de bord", type: 'link' },
      { to: "/messages", icon: MessageSquare, label: "Messages", type: 'link', badge: unreadMessages }, // Add messages link with badge
    ];

    if (currentRole === 'student') {
      return [
        ...baseItems,
        { to: "/courses", icon: BookOpen, label: "Mes Cours", type: 'link' },
        { to: "/all-notes", icon: NotebookText, label: "Mes Notes", type: 'link' },
        {
          icon: BarChart2,
          label: "Analytiques",
          type: 'trigger',
          // No 'to' for trigger parents
          onClick: () => setCurrentNavLevel('analytiques'),
          items: [
            { to: "/analytics?view=personal", label: "Mes Statistiques", icon: UserRoundCog, type: 'link' },
            { to: "/analytics?view=quiz-performance", label: "Performance Quiz", icon: ClipboardCheck, type: 'link' },
            { to: "/analytics?view=aia-engagement", label: "Engagement AiA", icon: BotMessageSquare, type: 'link' },
          ],
        },
      ];
    } else if (currentRole === 'creator') {
      return [
        ...baseItems,
        {
          icon: BookOpen,
          label: "Cours",
          type: 'trigger',
          // No 'to' for trigger parents
          onClick: () => setCurrentNavLevel('cours'),
          items: [
            { to: "/courses", label: "Mes Cours", icon: BookOpen, type: 'link' }, // This is now a sub-item
            { to: "/create-course", label: "Créer un cours", icon: PlusSquare, type: 'link' },
          ],
        },
        {
          icon: BriefcaseBusiness,
          label: "Administration",
          type: 'trigger',
          // No 'to' for trigger parents
          onClick: () => setCurrentNavLevel('administration'),
          items: [
            { to: "/establishments", label: "Établissements", icon: School, type: 'link' },
            { to: "/curricula", label: "Cursus", icon: LayoutList, type: 'link' },
            { to: "/classes", label: "Classes", icon: Users, type: 'link' },
            { to: "/students", label: "Élèves", icon: GraduationCap, type: 'link' },
          ],
        },
        {
          icon: BarChart2,
          label: "Analytiques",
          type: 'trigger',
          // No 'to' for trigger parents
          onClick: () => setCurrentNavLevel('analytiques'),
          items: [
            { to: "/analytics?view=overview", label: "Vue d'ensemble", icon: LayoutDashboard, type: 'link' },
            { to: "/analytics?view=course-performance", label: "Performance des Cours", icon: LineChart, type: 'link' },
            { to: "/analytics?view=student-engagement", label: "Engagement Élèves", icon: UsersRound, type: 'link' },
          ],
        },
      ];
    } else if (currentRole === 'tutor') {
      return [
        ...baseItems,
        {
          icon: Users,
          label: "Gestion des Utilisateurs",
          type: 'trigger',
          // No 'to' for trigger parents
          onClick: () => setCurrentNavLevel('gestion-des-utilisateurs'),
          items: [
            { to: "/classes", label: "Mes Classes", icon: Users, type: 'link' },
            { to: "/students", label: "Tous les Élèves", icon: GraduationCap, type: 'link' },
          ],
        },
        {
          icon: BarChart2,
          label: "Analytiques",
          type: 'trigger',
          // No 'to' for trigger parents
          onClick: () => setCurrentNavLevel('analytiques'),
          items: [
            { to: "/analytics?view=student-monitoring", label: "Suivi des Élèves", icon: UserRoundSearch, type: 'link' },
            { to: "/analytics?view=alerts", label: "Alertes & Recommandations", icon: BellRing, type: 'link' },
            { to: "/analytics?view=class-performance", label: "Performance par Classe", icon: BarChartBig, type: 'link' },
          ],
        },
      ];
    }
    return baseItems;
  };

  // Helper to determine if a parent trigger button should be active
  const getIsParentTriggerActive = (item: NavItem): boolean => {
    if (item.type !== 'trigger' || !item.items) return false;

    // Check if the current full path (pathname + search) matches any sub-item's full path
    const currentFullPath = location.pathname + location.search;

    return item.items.some(subItem => {
      if (subItem.to) {
        // Check if the current full path starts with the sub-item's 'to' path (including query if present)
        return currentFullPath.startsWith(subItem.to);
      }
      return false;
    });
  };

  const navItemsToDisplayForDesktop = () => {
    // If a specific sub-level is active (e.g., 'analytiques'), display its items
    const mainItems = getMainNavItems();
    const activeParent = mainItems.find(item => item.type === 'trigger' && item.label.toLowerCase().replace(/\s/g, '-') === currentNavLevel);

    if (activeParent && activeParent.items) {
      return [
        { icon: ArrowLeft, label: "Retour", type: 'trigger', onClick: () => setCurrentNavLevel(null) },
        ...activeParent.items,
      ];
    }
    // Otherwise, display the main navigation items
    return mainItems;
  };


  return (
    <div className="flex flex-col min-h-screen bg-muted/40 overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 px-2 py-4 flex items-center justify-between border-b backdrop-blur-lg bg-background/80">
        <Logo />
        {!isMobile && (
          <nav className="flex flex-grow justify-center items-center gap-2 sm:gap-4 flex-wrap">
            {navItemsToDisplayForDesktop().map((item) => {
              // Determine if a link is active
              const isLinkActive = item.to && (location.pathname + location.search).startsWith(item.to);
              // Determine if a trigger is active (itself or one of its children)
              const isTriggerActive = item.type === 'trigger' && (
                currentNavLevel === item.label.toLowerCase().replace(/\s/g, '-') || // This trigger's sub-menu is explicitly open
                getIsParentTriggerActive(item) // One of its children's routes is active
              );

              return item.type === 'link' && item.to ? (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={() =>
                    cn(
                      "flex items-center p-2 rounded-md text-sm font-medium whitespace-nowrap",
                      isLinkActive // Use the new isLinkActive logic
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )
                  }
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-2 bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ) : item.type === 'trigger' && item.onClick ? (
                <Button
                  key={item.label}
                  variant="ghost"
                  onClick={item.onClick}
                  className={cn(
                    "flex items-center p-2 rounded-md text-sm font-medium whitespace-nowrap",
                    isTriggerActive // Use the combined logic for trigger active state
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              ) : null
            })}
          </nav>
        )}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          {!isMobile && currentUserProfile && ( // Use currentUserProfile
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setIsSearchOverlayOpen(true)}>
                  <Search className="h-5 w-5" />
                  <span className="sr-only">Recherche globale</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Recherche (Ctrl + F)</p>
              </TooltipContent>
            </Tooltip>
          )}

          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">Menu utilisateur</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Mon profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className={cn("flex-grow p-4 sm:p-6 md:p-8 pt-24 md:pt-32", isMobile && "pb-20")}>
        <Outlet />
      </main>
      <BottomNavigationBar navItems={getMainNavItems()} onOpenGlobalSearch={currentUserProfile ? () => setIsSearchOverlayOpen(true) : undefined} currentUser={currentUserProfile} />
      {currentUserProfile && <AiAPersistentChat />}
      {currentUserProfile && <FloatingAiAChatButton />}
      {currentUserProfile && <GlobalSearchOverlay isOpen={isSearchOverlayOpen} onClose={() => setIsSearchOverlayOpen(false)} />}
      {currentUserProfile && <DataModelModal isOpen={isDataModelModalOpen} onClose={() => setIsDataModelModalOpen(false)} />}
    </div>
  );
};

export default DashboardLayout;