import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MotionCard, // Import MotionCard
} from "@/components/ui/card";
import { Button, MotionButton } from "@/components/ui/button"; // Import MotionButton
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, GripVertical, LayoutList, Globe, ExternalLink, X,
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, Link as LinkIcon, BarChart2, RefreshCw, ChevronDown, ChevronUp, Check, Move, Code
} from "lucide-react";
import { NavItem, Profile, RoleNavItemConfig, ALL_ROLES } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import { loadAllNavItemsRaw, addNavItem, updateNavItem, deleteNavItem, addRoleNavItemConfig, updateRoleNavItemConfig, deleteRoleNavItemConfig, getRoleNavItemConfigsByRole, resetRoleNavConfigsForRole } from "@/lib/navItems";
import { useRole } from '@/contexts/RoleContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea }
 from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import ManageChildrenDialog from '@/components/AdminMenu/ManageChildrenDialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import SimpleItemSelector from '@/components/ui/SimpleItemSelector';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import AddExistingNavItemDialog from '@/components/AdminMenu/AddExistingNavItemDialog';
import EditRoleConfigDialog from '@/components/AdminMenu/EditRoleConfigDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import LoadingSpinner from "@/components/LoadingSpinner"; // Import LoadingSpinner

const iconMap: { [key: string]: React.ElementType } = {
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, LinkIcon, ExternalLink, Globe, BarChart2, RefreshCw, ChevronDown, ChevronUp, Check, Move, Code,
  // Icons for roles
  student: GraduationCap,
  professeur: PenTool,
  tutor: Users,
  director: BriefcaseBusiness,
  deputy_director: BriefcaseBusiness, // Same as director for now
  administrator: UserRoundCog,
};

const navItemTypes: NavItem['type'][] = ['route', 'category_or_action'];

const getItemTypeLabel = (type: NavItem['type']) => {
  switch (type) {
    case 'route': return "Route";
    case 'category_or_action': return "Catégorie/Action";
    default: return "Inconnu";
  }
};

interface SortableNavItemProps {
  item: NavItem;
  level: number;
  onEditGenericItem: (item: NavItem) => void;
  onEditRoleConfig: (item: NavItem, config: RoleNavItemConfig) => void;
  onDelete: (navItemId: string, configId?: string) => void;
  onManageChildren: (parentItem: NavItem) => void;
  onAssignParent: (item: NavItem, config: RoleNavItemConfig) => void;
  isDragging?: boolean;
  isDraggableAndDeletable: boolean;
  selectedRoleFilter: Profile['role'] | 'all';
  isExpanded: boolean;
  onToggleExpand: (itemId: string) => void;
}

const SortableNavItem = React.forwardRef<HTMLDivElement, SortableNavItemProps>(({ item, level, onEditGenericItem, onEditRoleConfig, onDelete, onManageChildren, onAssignParent, isDragging, isDraggableAndDeletable, selectedRoleFilter, isExpanded, onToggleExpand }, ref) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.configId!, disabled: !isDraggableAndDeletable });

  const effectivePaddingLeft = `calc(${level * 10}px + ${level > 0 ? '0.5rem' : '0px'})`;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isSortableDragging ? 100 : 'auto', // Bring dragged item to front
    opacity: isSortableDragging ? 0.8 : 1,
    paddingLeft: effectivePaddingLeft,
  };

  const IconComponent = item.icon_name ? (iconMap[item.icon_name] || Info) : Info;

  const config: RoleNavItemConfig | undefined = item.configId && selectedRoleFilter !== 'all' ? {
    id: item.configId,
    nav_item_id: item.id,
    role: selectedRoleFilter as Profile['role'],
    parent_nav_item_id: item.parent_nav_item_id,
    order_index: item.order_index,
  } : undefined;

  const hasChildren = item.children && item.children.length > 0;
  const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div 
          ref={setNodeRef} 
          style={style} 
          className={cn(
            "p-3 border rounded-android-tile flex items-center justify-between gap-2 mb-2",
            isDragging && "ring-2 ring-primary/50 shadow-xl",
            isCategory ? "bg-muted/40 font-semibold text-lg" : "bg-background text-base",
            isCategory && level === 0 && "border-l-4 border-primary/50",
            "flex-wrap sm:flex-nowrap select-none hover:scale-[1.01] transition-transform" // Added hover effect
          )}
        >
          <div className="flex items-center gap-2 flex-grow cursor-pointer select-none" onClick={(e) => {
            if (hasChildren) {
              e.stopPropagation();
              onToggleExpand(item.id);
            }
          }}>
            {isDraggableAndDeletable && (
              <div
                {...listeners}
                {...attributes}
                className="cursor-grab p-1 rounded-md hover:bg-muted/20"
              >
                <GripVertical className="h-5 w-5" />
                <span className="sr-only">Déplacer l'élément</span>
              </div>
            )}
            {hasChildren && (
              <MotionButton
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(item.id);
                }}
                className="h-5 w-5"
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span className="sr-only">{isExpanded ? 'Réduire' : 'Étendre'}</span>
              </MotionButton>
            )}
            <IconComponent className="h-5 w-5 text-primary" />
            <span className="font-medium">{item.label}</span>
            <span className="text-sm text-muted-foreground italic">({getItemTypeLabel(item.type)})</span>
            {item.route && <span className="text-sm text-muted-foreground italic">{item.route}</span>}
            {item.is_external && <ExternalLink className="h-4 w-4 text-muted-foreground ml-1" />}
            {item.is_global && <Globe className="h-4 w-4 text-muted-foreground ml-1" title="Configuration globale" />}
          </div>
          <div className="flex gap-2 flex-shrink-0 mt-2 sm:mt-0">
            <MotionButton variant="outline" size="sm" onClick={() => onEditGenericItem(item)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Edit className="h-4 w-4" />
            </MotionButton>
            {config && (
              <MotionButton variant="outline" size="sm" onClick={() => onEditRoleConfig(item, config)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <UserRoundCog className="h-4 w-4" />
              </MotionButton>
            )}
            {isDraggableAndDeletable && (
              <MotionButton variant="destructive" size="sm" onClick={() => onDelete(item.id, item.configId)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Trash2 className="h-4 w-4" />
              </MotionButton>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-auto p-1 pointer-events-auto rounded-android-tile z-[9999]">
        {isCategory && (
          <ContextMenuItem className="p-2" onClick={() => onManageChildren(item)}>
            <LayoutList className="mr-2 h-4 w-4" /> Gérer les sous-éléments
          </ContextMenuItem>
        )}
        {config && (
          <ContextMenuItem className="p-2" onClick={() => onAssignParent(item, config)}>
            <Move className="mr-2 h-4 w-4" /> Assigner un parent
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
});

const RoleNavConfigsPage = () => {
  const [isAddExistingItemDialogOpen, setIsAddExistingItemDialogOpen] = useState(false);
  const [addDialogDefaultParentId, setAddDialogDefaultParentId] = useState<string | null | undefined>(undefined);
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const isMobile = useIsMobile();
  const [allGenericNavItems, setAllGenericNavItems] = useState<NavItem[]>([]);
  const [configuredItemsTree, setConfiguredItemsTree] = useState<NavItem[]>([]);
  const [allConfiguredItemsFlat, setAllConfiguredItemsFlat] = useState<NavItem[]>([]);

  const [selectedRoleFilter, setSelectedRoleFilter] = useState<Profile['role'] | 'all'>('all');
  const [roleSearchQuery, setRoleSearchQuery] = useState('');

  const [isEditConfigDialogOpen, setIsEditConfigDialogOpen] = useState(false);
  const [currentConfigToEdit, setCurrentConfigToEdit] = useState<RoleNavItemConfig | null>(null);
  const [currentItemToEdit, setCurrentItemToEdit] = useState<NavItem | null>(null);

  const [isManageChildrenDialogOpen, setIsManageChildrenDialogOpen] = useState(false);
  const [selectedParentForChildrenManagement, setSelectedParentForChildrenManagement] = useState<NavItem | null>(null);

  const [expandedItems, setExpandedItems] = useState<{ [itemId: string]: boolean }>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeDragItem, setActiveDragItem] = useState<NavItem | null>(null);
  const [activeDragConfig, setActiveDragConfig] = useState<RoleNavItemConfig | null>(null);

  const findItemInTree = useCallback((items: NavItem[], targetConfigId: string): NavItem | undefined => {
    for (const item of items) {
      if (item.configId === targetConfigId || item.id === targetConfigId) return item;
      if (item.children) {
        const foundChild = findItemInTree(item.children, targetConfigId);
        if (foundChild) return foundChild;
      }
    }
    return undefined;
  }, []);

  const getDescendantIds = useCallback((item: NavItem, allItemsFlat: NavItem[]): Set<string> => {
    const descendants = new Set<string>();
    const queue: NavItem[] = [item];
    let head = 0;
    while (head < queue.length) {
      const current = queue[head++];
      const childrenOfCurrent = allItemsFlat.filter(i => (i.parent_nav_item_id || null) === current.id);
      for (const child of childrenOfCurrent) {
        if (!descendants.has(child.id)) {
          descendants.add(child.id);
          queue.push(child);
        }
      }
    }
    descendants.delete(item.id);
    return descendants;
  }, []);

  const getAncestorIds = useCallback((itemId: string, allItemsFlat: NavItem[]): Set<string> => {
    const ancestors = new Set<string>();
    let currentItem = allItemsFlat.find(item => item.id === itemId);
    while (currentItem && currentItem.parent_nav_item_id) {
      ancestors.add(currentItem.parent_nav_item_id);
      currentItem = allItemsFlat.find(item => item.id === currentItem.parent_nav_item_id);
    }
    return ancestors;
  }, []);

  const fetchAndStructureNavItems = useCallback(async () => {
    const genericItems = await loadAllNavItemsRaw();
    setAllGenericNavItems(genericItems);

    if (selectedRoleFilter === 'all') {
      setConfiguredItemsTree([]);
      setAllConfiguredItemsFlat([]);
    } else {
      const role = selectedRoleFilter as Profile['role'];
      const roleConfigs = await getRoleNavItemConfigsByRole(role);

      const configuredMap = new Map<string, NavItem>();
      const allConfiguredItemsFlatList: NavItem[] = [];

      const genericItemMap = new Map<string, NavItem>();
      genericItems.forEach(item => genericItemMap.set(item.id, { ...item, children: [] }));

      roleConfigs.forEach(config => {
        const genericItem = genericItemMap.get(config.nav_item_id);
        if (genericItem) {
          const configuredItem: NavItem = {
            ...genericItem,
            children: [],
            configId: config.id,
            parent_nav_item_id: config.parent_nav_item_id || undefined,
            order_index: config.order_index,
            is_global: true,
          };
          configuredMap.set(configuredItem.id, configuredItem);
          allConfiguredItemsFlatList.push(configuredItem);
        }
      });
      setAllConfiguredItemsFlat(allConfiguredItemsFlatList);

      const groupedByParent = new Map<string | null, NavItem[]>();
      allConfiguredItemsFlatList.forEach(item => {
        const parentId = item.parent_nav_item_id || null;
        if (!groupedByParent.has(parentId)) {
          groupedByParent.set(parentId, []);
        }
        groupedByParent.get(parentId)?.push(item);
      });

      const sortAndReindex = async (items: NavItem[], currentParentId: string | null) => {
        items.sort((a, b) => a.order_index - b.order_index);
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.configId) { // Only update if it's a configured item
            if (item.order_index !== i || (item.parent_nav_item_id || null) !== currentParentId) {
              const updatedConfig: Omit<RoleNavItemConfig, 'created_at' | 'updated_at'> = {
                id: item.configId!,
                nav_item_id: item.id,
                role: role,
                parent_nav_item_id: currentParentId,
                order_index: i,
              };
              await updateRoleNavItemConfig(updatedConfig);
              item.order_index = i;
              item.parent_nav_item_id = currentParentId;
            }
          }
        }
      };

      const rootItemsToProcess = groupedByParent.get(null) || [];
      await sortAndReindex(rootItemsToProcess, null);
      const finalRootItems: NavItem[] = [...rootItemsToProcess];

      const processChildren = async (parentItem: NavItem) => {
        const children = groupedByParent.get(parentItem.id) || [];
        await sortAndReindex(children, parentItem.id);
        parentItem.children = children;
        for (const child of children) {
          await processChildren(child);
        }
      };

      for (const rootItem of finalRootItems) {
        await processChildren(rootItem);
      }

      setConfiguredItemsTree(finalRootItems);
    }
  }, [selectedRoleFilter, getAncestorIds]);

  useEffect(() => {
    fetchAndStructureNavItems();
  }, [fetchAndStructureNavItems]);

  const handleDeleteGenericNavItem = async (navItemId: string, configId?: string) => {
    if (currentRole !== 'administrator') {
      showError("Vous n'êtes pas autorisé à supprimer des éléments de navigation.");
      return;
    }
    if (selectedRoleFilter !== 'all' && configId) {
      if (window.confirm(`Êtes-vous sûr de vouloir supprimer cette configuration de rôle pour l'élément ? Cela supprimera toutes ses configurations de rôle associées. Cette action est irréversible.`)) {
        try {
          await deleteRoleNavItemConfig(configId);
          showSuccess("Configuration de rôle supprimée !");
          await fetchAndStructureNavItems();
        } catch (error: any) {
          showError(`Erreur lors de la suppression de la configuration de rôle: ${error.message}`);
        }
      }
    } else {
      showError("Veuillez sélectionner un rôle spécifique pour supprimer une configuration, ou utilisez la gestion des éléments génériques pour supprimer l'élément de base.");
    }
  };

  const handleEditGenericItem = (item: NavItem) => {
    if (currentRole !== 'administrator') {
      showError("Vous n'êtes pas autorisé à modifier les propriétés génériques des éléments.");
      return;
    }
    showError("Veuillez utiliser la page 'Éléments de navigation' pour modifier les propriétés génériques des éléments.");
  };

  const handleEditRoleConfig = (item: NavItem, config: RoleNavItemConfig) => {
    if (currentRole !== 'administrator') {
      showError("Vous n'êtes pas autorisé à modifier les configurations de rôle.");
      return;
    }
    setCurrentItemToEdit(item);
    setCurrentConfigToEdit(config);
    setIsEditConfigDialogOpen(true);
  };

  const handleAssignParent = (item: NavItem, config: RoleNavItemConfig) => {
    if (currentRole !== 'administrator') {
      showError("Vous n'êtes pas autorisé à assigner un parent.");
      return;
    }
    setCurrentItemToEdit(item);
    setCurrentConfigToEdit(config);
    setIsEditConfigDialogOpen(true);
  };

  const handleDragStart = (event: any) => {
    if (currentRole !== 'administrator') {
      showError("Vous n'êtes pas autorisé à réorganiser les éléments.");
      setActiveDragItem(null);
      setActiveDragConfig(null);
      return;
    }
    const { active } = event;
    const configuredItem = allConfiguredItemsFlat.find(item => item.configId === active.id);
    if (configuredItem && configuredItem.configId) {
      const config = {
        id: configuredItem.configId,
        nav_item_id: configuredItem.id,
        role: selectedRoleFilter as Profile['role'],
        parent_nav_item_id: configuredItem.parent_nav_item_id,
        order_index: configuredItem.order_index,
      };
      setActiveDragItem(configuredItem);
      setActiveDragConfig(config);
    } else {
      setActiveDragItem(null);
      setActiveDragConfig(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (currentRole !== 'administrator') {
      showError("Vous n'êtes pas autorisé à réorganiser les éléments.");
      setActiveDragItem(null);
      setActiveDragConfig(null);
      return;
    }
    const { active, over } = event;

    if (!activeDragItem || !activeDragConfig || !over || active.id === over.id) {
      setActiveDragItem(null);
      setActiveDragConfig(null);
      return;
    }

    if (selectedRoleFilter === 'all') {
      showError("Veuillez sélectionner un rôle spécifique pour configurer les menus.");
      setActiveDragItem(null);
      setActiveDragConfig(null);
      return;
    }

    const activeConfigId = active.id as string;
    const overId = over.id as string;

    // Helper to find the list an item belongs to and its index
    const findListAndIndex = (items: NavItem[], targetConfigId: string, currentParentId: string | null = null): { parentId: string | null, index: number, list: NavItem[] } | null => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].configId === targetConfigId) {
          return { parentId: currentParentId, index: i, list: items };
        }
        if (items[i].children && items[i].children.length > 0) {
          const found = findListAndIndex(items[i].children, targetConfigId, items[i].id);
          if (found) return found;
        }
      }
      return null;
    };

    const activeItemInfo = findListAndIndex(configuredItemsTree, activeConfigId);
    if (!activeItemInfo) {
      showError("Élément déplacé introuvable dans la structure actuelle.");
      setActiveDragItem(null);
      setActiveDragConfig(null);
      return;
    }

    // Determine the new parent and new index
    let newParentId: string | null = null;
    let newIndex: number = 0;

    const overSortable = over.data.current?.sortable;
    const overConfiguredItem = allConfiguredItemsFlat.find(item => item.configId === overId);
    const overIsRootContainer = overId === 'configured-container';
    const overIsChildContainer = overId.startsWith('configured-container-children-of-');

    if (overSortable) {
        // Dropped on another sortable item
        const overItemInfo = findListAndIndex(configuredItemsTree, overId);
        if (!overItemInfo) {
            showError("Cible de dépôt introuvable.");
            setActiveDragItem(null);
            setActiveDragConfig(null);
            return;
        }

        // If dropping on an expanded category, make it a child of that category
        if (overConfiguredItem && overConfiguredItem.type === 'category_or_action' && (overConfiguredItem.route === null || overConfiguredItem.route === undefined) && expandedItems[overConfiguredItem.id]) {
            newParentId = overConfiguredItem.id;
            newIndex = overConfiguredItem.children?.length || 0; // Add to the end of its children
        } else {
            // Dropped next to an item (or on a collapsed category/route)
            newParentId = overItemInfo.parentId;
            newIndex = overSortable.index; // Use the index provided by dnd-kit's sortable context
        }
    } else if (overIsRootContainer) {
        newParentId = null;
        newIndex = configuredItemsTree.length; // Add to the end of root items
    } else if (overIsChildContainer) {
        newParentId = overId.replace('configured-container-children-of-', '');
        const parentItem = allConfiguredItemsFlat.find(item => item.id === newParentId);
        if (!parentItem || parentItem.type === 'route') {
            showError("Vous ne pouvez pas déposer un élément sous une route ou une cible invalide.");
            setActiveDragItem(null);
            setActiveDragConfig(null);
            return;
        }
        newIndex = parentItem.children?.length || 0; // Add to the end of its children
    } else {
        showError("Cible de dépôt non valide.");
        setActiveDragItem(null);
        setActiveDragConfig(null);
        return;
    }

    // Prevent dropping an item into itself or its own descendants
    if (activeDragItem.id === newParentId) {
      showError("Un élément ne peut pas être déplacé dans lui-même.");
      setActiveDragItem(null);
      setActiveDragConfig(null);
      return;
    }
    const descendantsOfActiveItem = getDescendantIds(activeDragItem, allConfiguredItemsFlat);
    if (newParentId && descendantsOfActiveItem.has(newParentId)) {
      showError("Un élément ne peut pas être déplacé dans un de ses propres descendants.");
      setActiveDragItem(null);
      setActiveDragConfig(null);
      return;
    }

    // Deep copy the current tree to perform local modifications
    let updatedTree = JSON.parse(JSON.stringify(configuredItemsTree));

    // 1. Remove the active item from its old position in the copied tree
    const removeNode = (nodes: NavItem[], configIdToRemove: string): NavItem[] => {
      return nodes.filter(node => node.configId !== configIdToRemove).map(node => ({
        ...node,
        children: node.children ? removeNode(node.children, configIdToRemove) : [],
      }));
    };
    updatedTree = removeNode(updatedTree, activeConfigId);

    // 2. Prepare the item to be inserted with its new parent_nav_item_id
    const itemToInsert = { ...activeDragItem, parent_nav_item_id: newParentId };

    // 3. Insert the item into its new position in the copied tree
    const insertNode = (nodes: NavItem[], nodeToInsert: NavItem, targetParentId: string | null, targetIndex: number): NavItem[] => {
      if (targetParentId === null) {
        const newRootNodes = [...nodes];
        newRootNodes.splice(targetIndex, 0, nodeToInsert);
        return newRootNodes;
      }
      return nodes.map(node => {
        if (node.id === targetParentId) {
          const updatedChildren = [...(node.children || [])];
          updatedChildren.splice(targetIndex, 0, nodeToInsert);
          return { ...node, children: updatedChildren };
        }
        if (node.children) {
          return { ...node, children: insertNode(node.children, nodeToInsert, targetParentId, targetIndex) };
        }
        return node; // Important: return the original node if no changes
      });
    };
    updatedTree = insertNode(updatedTree, itemToInsert, newParentId, newIndex);

    // 4. Re-index all affected items and collect updates for the database
    const itemsToUpdateInDb: RoleNavItemConfig[] = [];
    const reindexAndCollect = (items: NavItem[], currentParentId: string | null = null) => {
      items.forEach((item, index) => {
        if (item.configId) {
          itemsToUpdateInDb.push({
            id: item.configId,
            nav_item_id: item.id,
            role: selectedRoleFilter as Profile['role'],
            parent_nav_item_id: currentParentId,
            order_index: index,
          });
        }
        if (item.children && item.children.length > 0) {
          reindexAndCollect(item.children, item.id);
        }
      });
    };
    reindexAndCollect(updatedTree, null);

    // 5. Perform batch update to DB
    try {
      for (const config of itemsToUpdateInDb) {
        await updateRoleNavItemConfig(config);
      }
      showSuccess("Élément de navigation réorganisé/déplacé !");
      await fetchAndStructureNavItems(); // Re-fetch to ensure UI is consistent with DB
    } catch (error: any) {
      // Check if the error is due to authentication
      if (error.message && error.message.includes("Non authentifié")) {
        showError("Votre session a expiré. Veuillez vous reconnecter pour réorganiser les menus.");
      } else {
        showError(`Erreur lors de la mise à jour de la base de données: ${error.message}`);
      }
    } finally {
      setActiveDragItem(null);
      setActiveDragConfig(null);
    }
  };

  const handleManageChildren = (parentItem: NavItem) => {
    if (currentRole !== 'administrator') {
      showError("Vous n'êtes pas autorisé à gérer les sous-éléments.");
      return;
    }
    setSelectedParentForChildrenManagement(parentItem);
    setIsManageChildrenDialogOpen(true);
  };

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const renderNavItemsList = (items: NavItem[], level: number, containerId: string) => {
    return (
      <div id={containerId} className="min-h-[50px] p-2 border border-dashed border-muted-foreground/30 rounded-android-tile">
        {items.length === 0 && <p className="text-muted-foreground text-center text-sm py-2"><span>Déposez des éléments ici</span></p>}
        <SortableContext items={items.map(item => item.configId || item.id)} strategy={verticalListSortingStrategy}>
          {items.map(item => (
            <React.Fragment key={item.id}>
              <SortableNavItem
                item={item}
                level={level}
                onEditGenericItem={handleEditGenericItem}
                onEditRoleConfig={handleEditRoleConfig}
                onDelete={handleDeleteGenericNavItem}
                onManageChildren={handleManageChildren}
                onAssignParent={handleAssignParent}
                isDragging={activeDragItem?.id === item.id || activeDragConfig?.id === item.configId}
                isDraggableAndDeletable={currentRole === 'administrator'} // Only admin can drag/delete
                selectedRoleFilter={selectedRoleFilter}
                isExpanded={!!expandedItems[item.id]}
                onToggleExpand={toggleExpand}
              />
              {item.children && item.children.length > 0 && expandedItems[item.id] && (
                <div className="ml-4">
                  {renderNavItemsList(item.children, level + 1, `${containerId}-children-of-${item.id}`)}
                </div>
              )}
            </React.Fragment>
          ))}
        </SortableContext>
      </div>
    );
  };

  const handleResetRoleNav = async () => {
    if (currentRole !== 'administrator') {
      showError("Vous n'êtes pas autorisé à réinitialiser la navigation.");
      return;
    }
    if (selectedRoleFilter === 'all') {
      showError("Veuillez sélectionner un rôle spécifique à réinitialiser.");
      return;
    }
    if (window.confirm(`Êtes-vous sûr de vouloir réinitialiser la navigation par défaut pour le rôle '${selectedRoleFilter}' ? Cela écrasera toutes les configurations existantes pour ce rôle.`)) {
      try {
        await resetRoleNavConfigsForRole(selectedRoleFilter as Profile['role']);
        showSuccess(`Navigation par défaut réinitialisée pour le rôle '${selectedRoleFilter}' !`);
        await fetchAndStructureNavItems();
      } catch (error: any) {
        showError(`Erreur lors de la réinitialisation de la navigation: ${error.message}`);
      }
    }
  };

  const handleSelectRole = (role: Profile['role'] | 'all') => {
    setSelectedRoleFilter(role);
    setRoleSearchQuery('');
  };

  const filteredRoles = useMemo(() => {
    const lowerCaseQuery = roleSearchQuery.toLowerCase();
    return ALL_ROLES.filter(role => getRoleDisplayName(role).toLowerCase().includes(lowerCaseQuery));
  }, [roleSearchQuery]);

  if (isLoadingUser) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Chargement...
        </h1>
        <p className="text-lg text-muted-foreground">
          Veuillez patienter.
        </p>
      </div>
    );
  }

  if (!currentUserProfile || currentRole !== 'administrator') {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès Restreint
        </h1>
        <p className="text-lg text-muted-foreground">
          Seuls les administrateurs peuvent accéder à cette page.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Configuration des Menus par Rôle
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Sélectionnez un rôle pour voir et gérer les éléments de menu qui lui sont associés.
      </p>

      <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRoundCog className="h-6 w-6 text-primary" /> Sélectionner un rôle
          </CardTitle>
          <CardDescription>Choisissez le rôle dont vous souhaitez configurer le menu.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher un rôle..."
              className="pl-10 rounded-android-tile"
              value={roleSearchQuery}
              onChange={(e) => setRoleSearchQuery(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredRoles.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 col-span-full">Aucun rôle trouvé.</p>
            ) : (
              filteredRoles.map(role => {
                const RoleIcon = iconMap[role as string] || User; // Get icon from map
                return (
                  <MotionButton
                    key={role}
                    variant="outline"
                    className={cn(
                      "flex flex-col items-center justify-center h-24 w-full text-center p-2 rounded-android-tile hover:scale-[1.02] transition-transform", // Added hover effect
                      selectedRoleFilter === role ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent hover:text-accent-foreground",
                      "transition-all duration-200 ease-in-out"
                    )}
                    onClick={() => handleSelectRole(role)}
                    whileHover={{ scale: 1.02, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RoleIcon className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium line-clamp-1">{getRoleDisplayName(role)}</span>
                    {selectedRoleFilter === role && <Check className="h-4 w-4 text-primary-foreground mt-1" />}
                  </MotionButton>
                );
              })
            )}
          </div>
          {selectedRoleFilter !== 'all' && (
            <MotionButton onClick={handleResetRoleNav} variant="outline" className="mt-4" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <RefreshCw className="h-4 w-4 mr-2" /> Réinitialiser la navigation pour ce rôle
            </MotionButton>
          )}
        </CardContent>
      </MotionCard>

      {selectedRoleFilter !== 'all' && (
        <div className="grid grid-cols-1 gap-8">
          <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LayoutList className="h-6 w-6 text-primary" /> Structure de Navigation pour {getRoleDisplayName(selectedRoleFilter)}
                </CardTitle>
                <CardDescription>Réorganisez les éléments par glisser-déposer. Utilisez le menu contextuel (clic droit) pour gérer les sous-éléments.</CardDescription>
              </div>
              <MotionButton
                variant="outline"
                size="sm"
                onClick={() => {
                  setAddDialogDefaultParentId(null);
                  setIsAddExistingItemDialogOpen(true);
                }}
                className="flex-shrink-0"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Ajouter racine
              </MotionButton>
            </CardHeader>
            <CardContent className="space-y-2 p-4 border border-dashed border-muted-foreground/30 rounded-android-tile">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                {renderNavItemsList(configuredItemsTree, 0, 'configured-container')}
                <DragOverlay>
                  {activeDragItem ? (
                    <SortableNavItem
                      item={activeDragItem}
                      level={0}
                      onEditGenericItem={handleEditGenericItem}
                      onEditRoleConfig={handleEditRoleConfig}
                      onDelete={handleDeleteGenericNavItem}
                      onManageChildren={handleManageChildren}
                      onAssignParent={handleAssignParent}
                      isDragging={true}
                      isDraggableAndDeletable={currentRole === 'administrator'}
                      selectedRoleFilter={selectedRoleFilter}
                      isExpanded={false}
                      onToggleExpand={() => {}}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </CardContent>
          </MotionCard>
        </div>
      )}

      {currentConfigToEdit && currentItemToEdit && (
        <EditRoleConfigDialog
          isOpen={isEditConfigDialogOpen}
          onClose={() => {
            setIsEditConfigDialogOpen(false);
            setCurrentConfigToEdit(null);
            setCurrentItemToEdit(null);
          }}
          currentConfigToEdit={currentConfigToEdit}
          currentItemToEdit={currentItemToEdit}
          selectedRoleFilter={selectedRoleFilter as Profile['role']}
          allGenericNavItems={allGenericNavItems}
          allConfiguredItemsFlat={allConfiguredItemsFlat}
          onSave={fetchAndStructureNavItems}
          getDescendantIds={getDescendantIds}
          iconMap={iconMap}
        />
      )}

      {selectedParentForChildrenManagement && (
        <ManageChildrenDialog
          isOpen={isManageChildrenDialogOpen}
          onClose={() => setIsManageChildrenDialogOpen(false)}
          parentItem={selectedParentForChildrenManagement}
          selectedRoleFilter={selectedRoleFilter as Profile['role']}
          allGenericNavItems={allGenericNavItems}
          allConfiguredItemsFlat={allConfiguredItemsFlat}
          onChildrenUpdated={fetchAndStructureNavItems}
          getDescendantIds={getDescendantIds}
          getAncestorIds={getAncestorIds}
        />
      )}

      {selectedRoleFilter !== 'all' && (
        <AddExistingNavItemDialog
          isOpen={isAddExistingItemDialogOpen}
          onClose={() => setIsAddExistingItemDialogOpen(false)}
          selectedRoleFilter={selectedRoleFilter as Profile['role']}
          allGenericNavItems={allGenericNavItems}
          allConfiguredItemsFlat={allConfiguredItemsFlat}
          onItemAdded={fetchAndStructureNavItems}
          getDescendantIds={getDescendantIds}
          getAncestorIds={getAncestorIds}
          iconMap={iconMap}
          defaultParentId={addDialogDefaultParentId}
        />
      )}
    </div>
  );
};

export default RoleNavConfigsPage;