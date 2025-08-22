import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, PlusSquare, BarChart2, User, LogOut, Settings, GraduationCap, PenTool, Users, NotebookText, School, Search, ArrowLeft, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, BarChartBig, MessageSquare, LogIn, Info } from "lucide-react"; // Added LogIn, Info
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
import FloatingAiAChatButton from "@/components/FloatingAiAChatButton"; // Import the new floating button
import GlobalSearchOverlay from "@/components/GlobalSearchOverlay";
import DataModelModal from "@/components/DataModelModal";
import React, { useState, useEffect, useCallback, useRef } from "react"; // Import useRef
import { getUnreadMessageCount } from "@/lib/messageData"; // Import getUnreadMessageCount
import { supabase } from "@/integrations/supabase/client"; // Import supabase for realtime
import { Message } from "@/lib/dataModels"; // Import Message type
import { NavItem } from "@/lib/dataModels"; // Import NavItem from dataModels
import AuthModal from "@/components/AuthModal"; // Import AuthModal
import AboutModal from "@/components/AboutModal"; // Import AboutModal

const DashboardLayout = () => {
  const isMobile = useIsMobile();
  const { currentUserProfile, currentRole, signOut } = useRole(); // Destructure signOut
  const { openChat } = useCourseChat();
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [isDataModelModalOpen, setIsDataModelModalOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0); // State for unread messages
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); // New state for AuthModal
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false); // State for AboutModal
  const navigate = useNavigate();
  const location = useLocation();

  const [currentNavLevel, setCurrentNavLevel] = useState<string | null>(null);
  const [showFloatingButton, setShowFloatingButton] = useState(true); // Nouvel état pour le bouton flottant
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogout = async () => { // Make it async
    await signOut(); // Call the signOut function from context
    navigate("/");
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false); // Close auth modal on success
    // The RoleContext's onAuthStateChange listener will handle navigation to dashboard
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
              // Only decrement if the message was previously unread and is now read, and not archived
              if (updatedMessage.is_read && !updatedMessage.is_archived && (payload.old as Message)?.is_read === false) {
                setUnreadMessages(prev => Math.max(0, prev - 1)); // Ensure count doesn't go below zero
              }
              // If a message is archived and was unread, it should no longer count towards unread
              if (updatedMessage.is_archived && (payload.old as Message)?.is_read === false && !updatedMessage.is_read) {
                 setUnreadMessages(prev => Math.max(0, prev - 1));
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
      { to: "/dashboard", icon: Home, label: "Accueil", type: 'link' }, // Changed label
      { to: "/messages", icon: MessageSquare, label: "Messages", type: 'link', badge: unreadMessages }, // Add messages link with badge
    ];

    if (currentRole === 'student') {
      return [
        ...baseItems,
        {
          icon: GraduationCap, // New icon for Apprentissage
          label: "Apprentissage", // New group label
          type: 'trigger',
          onClick: () => setCurrentNavLevel('apprentissage'),
          items: [
            { to: "/courses", label: "Mes Cours", icon: BookOpen, type: 'link' },
            { to: "/all-notes", label: "Mes Notes", icon: NotebookText, type: 'link' },
          ],
        },
        {
          icon: BarChart2,
          label: "Progression", // Renamed for student
          type: 'trigger',
          onClick: () => setCurrentNavLevel('progression'), // Updated level name
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
          icon: BookOpen, // Icon for Contenu
          label: "Contenu", // New group label
          type: 'trigger',
          onClick: () => setCurrentNavLevel('contenu'),
          items: [
            { to: "/courses", label: "Mes Cours", icon: BookOpen, type: 'link' },
            { to: "/create-course", label: "Créer un cours", icon: PlusSquare, type: 'link' },
          ],
        },
        {
          icon: Users, // Icon for Gestion
          label: "Gestion", // New group label
          type: 'trigger',
          onClick: () => setCurrentNavLevel('gestion'),
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
          icon: UsersRound, // Icon for Suivi
          label: "Suivi", // New group label
          type: 'trigger',
          onClick: () => setCurrentNavLevel('suivi'),
          items: [
            { to: "/classes", label: "Mes Classes", icon: Users, type: 'link' },
            { to: "/students", label: "Tous les Élèves", icon: GraduationCap, type: 'link' },
          ],
        },
        {
          icon: BarChart2,
          label: "Analytiques",
          type: 'trigger',
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

  // Handle scroll to hide/show floating button
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      const currentScrollY = event.currentTarget.scrollTop;
      const isScrollingDown = currentScrollY > lastScrollY.current;

      if (isScrollingDown && currentScrollY > 100) { // Hide only if scrolled down significantly
        setShowFloatingButton(false);
      } else {
        setShowFloatingButton(true);
      }
      lastScrollY.current = currentScrollY;
    }, 100); // Debounce time
  }, []);


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
          {/* Mobile-only About button (icon only) */}
          <Button variant="outline" size="icon" onClick={() => setIsAboutModalOpen(true)} className="md:hidden">
            <Info className="h-5 w-5" />
            <span className="sr-only">À propos</span>
          </Button>
          {/* Desktop-only About button (text + icon) */}
          <Button variant="outline" onClick={() => setIsAboutModalOpen(true)} className="hidden md:flex">
            <Info className="h-5 w-5 mr-2" /> À propos
          </Button>
          {!isMobile && !currentUserProfile && (
            <Button variant="outline" onClick={() => setIsAuthModalOpen(true)}>
              <LogIn className="h-5 w-5 mr-2" /> Authentification
            </Button>
          )}
          {currentUserProfile && (
            <span className="text-sm font-medium text-muted-foreground hidden md:block">
              Bonjour, {currentUserProfile.first_name} !
            </span>
          )}
        </div>
      </header>
      <main className={cn("flex-grow p-4 sm:p-6 md:p-8 pt-24 md:pt-32 overflow-y-auto", isMobile && "pb-20")} onScroll={handleScroll}>
        <Outlet />
      </main>
      <footer className="p-4 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} AcademIA. Tous droits réservés.{" "}
        <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground" onClick={() => setIsAboutModalOpen(true)}>
          À propos
        </Button>
      </footer>
      <BottomNavigationBar navItems={getMainNavItems()} onOpenGlobalSearch={currentUserProfile ? () => setIsSearchOverlayOpen(true) : undefined} currentUser={currentUserProfile} onOpenAboutModal={() => setIsAboutModalOpen(true)} />
      {currentUserProfile && <AiAPersistentChat />}
      {currentUserProfile && <FloatingAiAChatButton isVisible={showFloatingButton} />} {/* Pass isVisible prop */}
      {currentUserProfile && <GlobalSearchOverlay isOpen={isSearchOverlayOpen} onClose={() => setIsSearchOverlayOpen(false)} />}
      {currentUserProfile && <DataModelModal isOpen={isDataModelModalOpen} onClose={() => setIsDataModelModalOpen(false)} />}
      {!currentUserProfile && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={handleAuthSuccess} />}
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
    </div>
  );
};

export default DashboardLayout;