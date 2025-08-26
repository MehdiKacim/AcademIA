import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, GripVertical, LayoutList, Globe, ExternalLink, X,
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, Link as LinkIcon, BarChart2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
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
import SearchableDropdown from '@/components/ui/SearchableDropdown';
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
import { cn } from '@/lib/utils'; // Import cn for conditional styling
import AddExistingNavItemDialog from '@/components/AdminMenu/AddExistingNavItemDialog'; // New import
import EditRoleConfigDialog from '@/components/AdminMenu/EditRoleConfigDialog'; // New import

// Map icon_name strings to Lucide React components
const iconMap: { [key: string]: React.ElementType } = {
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, LinkIcon, ExternalLink, Globe, BarChart2, RefreshCw, ChevronDown, ChevronUp
};

// All possible roles for selection
const navItemTypes: NavItem['type'][] = ['route', 'category_or_action'];

// Helper function moved to top-level scope
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
  isDragging?: boolean;
  isDraggableAndDeletable: boolean;
  selectedRoleFilter: Profile['role'] | 'all';
  isExpanded: boolean;
  onToggleExpand: (itemId: string) => void;
}

const SortableNavItem = React.forwardRef<HTMLDivElement, SortableNavItemProps>(({ item, level, onEditGenericItem, onEditRoleConfig, onDelete, onManageChildren, isDragging, isDraggableAndDeletable, selectedRoleFilter, isExpanded, onToggleExpand }, ref) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.configId || item.id, disabled: !isDraggableAndDeletable });

  // Adjust paddingLeft based on level and screen size
  const effectivePaddingLeft = `calc(${level * 10}px + ${level > 0 ? '0.5rem' : '0px'})`; // Reduced indentation for mobile

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto', // Bring dragged item to front
    opacity: isDragging ? 0.8 : 1,
    paddingLeft: effectivePaddingLeft, // Apply responsive padding
  };

  const IconComponent = iconMap[item.icon_name || 'Info'] || Info;

  const config: RoleNavItemConfig | undefined = item.configId && selectedRoleFilter !== 'all' ? {
    id: item.configId,
    nav_item_id: item.id, // Ensure nav_item_id is correct
    role: selectedRoleFilter as Profile['role'],
    parent_nav_item_id: item.parent_nav_item_id,
    order_index: item.order_index,
  } : undefined;

  const hasChildren = item.children && item.children.length > 0;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div 
          ref={setNodeRef} 
          style={style} 
          className={cn(
            "p-3 border rounded-android-tile flex items-center justify-between gap-2 mb-2", // Apply rounded-android-tile
            isDragging && "ring-2 ring-primary/50 shadow-xl",
            item.type === 'category_or_action' && (item.route === null || item.route === undefined) ? "bg-muted/40 font-semibold text-lg" : "bg-background text-base",
            item.type === 'category_or_action' && (item.route === null || item.route === undefined) && level === 0 && "border-l-4 border-primary/50",
            "flex-wrap sm:flex-nowrap select-none" // Added select-none here
          )}
        >
          <div className="flex items-center gap-2 flex-grow cursor-pointer select-none" onClick={(e) => { // Added select-none here
            if (hasChildren) {
              e.stopPropagation();
              onToggleExpand(item.id);
            }
          }}>
            {isDraggableAndDeletable && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                {...listeners}
                {...attributes}
                className="cursor-grab"
              >
                <GripVertical className="h-5 w-5" />
                <span className="sr-only">Déplacer l'élément</span>
              </Button>
            )}
            {hasChildren && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(item.id);
                }}
                className="h-5 w-5"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span className="sr-only">{isExpanded ? 'Réduire' : 'Étendre'}</span>
              </Button>
            )}
            <IconComponent className="h-5 w-5 text-primary" />
            <span className="font-medium">{item.label}</span>
            <span className="text-sm text-muted-foreground italic">({getItemTypeLabel(item.type)})</span>
            {item.route && <span className="text-sm text-muted-foreground italic">{item.route}</span>}
            {item.is_external && <ExternalLink className="h-4 w-4 text-muted-foreground ml-1" />}
            {item.is_global && <Globe className="h-4 w-4 text-muted-foreground ml-1" title="Configuration globale" />}
          </div>
          <div className="flex gap-2 flex-shrink-0 mt-2 sm:mt-0"> {/* Allow buttons to wrap on new line on small screens */}
            <Button variant="outline" size="sm" onClick={() => onEditGenericItem(item)}>
              <Edit className="h-4 w-4" />
            </Button>
            {config && (
              <Button variant="outline" size="sm" onClick={() => onEditRoleConfig(item, config)}>
                <UserRoundCog className="h-4 w-4" />
              </Button>
            )}
            {isDraggableAndDeletable && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(item.id, item.configId)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      {/* Only show "Gérer les sous-éléments" for true categories (type 'category_or_action' with no route) */}
      {item.type === 'category_or_action' && (item.route === null || item.route === undefined) && (
        <ContextMenuContent className="w-auto p-1 pointer-events-auto rounded-android-tile">
          <ContextMenuItem className="p-2" onClick={() => onManageChildren(item)}>
            <LayoutList className="mr-2 h-4 w-4" /> Gérer les sous-éléments
          </ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
});

const RoleNavConfigsPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const [allGenericNavItems, setAllGenericNavItems] = useState<NavItem[]>([]);
  const [configuredItemsTree, setConfiguredItemsTree] = useState<NavItem[]>([]);
  const [allConfiguredItemsFlat, setAllConfiguredItemsFlat] = useState<NavItem[]>([]);

  const [selectedRoleFilter, setSelectedRoleFilter] = useState<Profile['role'] | 'all'>('all');
  // Removed selectedGenericItemTypeFilter as it's now handled within AddExistingNavItemDialog

  const [isEditConfigDialogOpen, setIsEditConfigDialogOpen] = useState(false);
  const [currentConfigToEdit, setCurrentConfigToEdit] = useState<RoleNavItemConfig | null>(null);
  const [currentItemToEdit, setCurrentItemToEdit] = useState<NavItem | null>(null);
  // Removed editConfigParentId, editConfigOrderIndex, isSavingEdit as they are now internal to EditRoleConfigDialog

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

  // States for search in dropdowns
  // Removed selectedParentForEdit, parentSearchQuery as they are now internal to EditRoleConfigDialog

  const [isAddExistingItemDialogOpen, setIsAddExistingItemDialogOpen] = useState(false); // New state for the add existing item dialog


  const findItemInTree = useCallback((items: NavItem[], targetId: string): NavItem | undefined => {
    for (const item of items) {
      if (item.configId === targetId || item.id === targetId) return item;
      if (item.children) {
        const foundChild = findItemInTree(item.children, targetId);
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
      console.log("[RoleNavConfigsPage] allConfiguredItemsFlatList after fetch:", allConfiguredItemsFlatList);


      const groupedByParent = new Map<string | null, NavItem[]>();
      allConfiguredItemsFlatList.forEach(item => {
        const parentId = item.parent_nav_item_id || null;
        if (!groupedByParent.has(parentId)) {
          groupedByParent.set(parentId, []);
        }
        groupedByParent.get(parentId)?.push(item);
      });

      const sortAndReindex = async (items: NavItem[], parentId: string | null) => {
        items.sort((a, b) => a.order_index - b.order_index);
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.order_index !== i || (item.parent_nav_item_id || null) !== parentId) {
            const updatedConfig: Omit<RoleNavItemConfig, 'created_at' | 'updated_at'> = {
              id: item.configId!,
              nav_item_id: item.id,
              role: role,
              parent_nav_item_id: parentId, // <--- This is the parentId passed to sortAndReindex
              order_index: i,
            };
            await updateRoleNavItemConfig(updatedConfig);
            item.order_index = i;
            item.parent_nav_item_id = parentId;
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
  }, [selectedRoleFilter]);

  useEffect(() => {
    fetchAndStructureNavItems();
  }, [fetchAndStructureNavItems]);

  // Memoize availableParentsForConfig to ensure it's only computed when dependencies change
  // Removed availableParentsForConfig as it's now internal to EditRoleConfigDialog


  // Effect to handle adding the selected generic item (now triggered by AddExistingNavItemDialog)
  useEffect(() => {
    // This useEffect is no longer needed here as the logic is moved to AddExistingNavItemDialog
    // It will be triggered by the onItemAdded callback from the dialog.
  }, []);


  const handleDeleteGenericNavItem = async (navItemId: string, configId?: string) => {
    if (selectedRoleFilter !== 'all' && configId) {
      if (window.confirm(`Êtes-vous sûr de vouloir supprimer cette configuration de rôle pour l'élément ? Cela supprimera toutes ses configurations de rôle associées. Cette action est irréversible.`)) {
        try {
          await deleteRoleNavItemConfig(configId);
          showSuccess("Configuration de rôle supprimée !");
          await fetchAndStructureNavItems();
        } catch (error: any) {
          console.error("Error deleting role nav item config:", error);
          showError(`Erreur lors de la suppression de la configuration de rôle: ${error.message}`);
        }
      }
    } else {
      showError("Veuillez sélectionner un rôle spécifique pour supprimer une configuration, ou utilisez la gestion des éléments génériques pour supprimer l'élément de base.");
    }
  };

  const handleEditGenericItem = (item: NavItem) => {
    showError("Veuillez utiliser la page 'Éléments de navigation' pour modifier les propriétés génériques des éléments.");
  };

  const handleEditRoleConfig = (item: NavItem, config: RoleNavItemConfig) => {
    setCurrentItemToEdit(item);
    setCurrentConfigToEdit(config);
    setIsEditConfigDialogOpen(true);
  };

  // Removed handleSaveEditedRoleConfig as it's now internal to EditRoleConfigDialog

  const handleDragStart = (event: any) => {
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
    const { active, over } = event;

    if (!activeDragItem || !activeDragConfig || !over || active.id === over.id) {
      setActiveDragItem(null);
      setActiveDragConfig(null);
      return;
    }

    const activeConfigId = active.id as string;
    const overId = over.id as string;

    try {
      let newParentNavItemId: string | null = null;
      let tempOrderIndex: number = 0; 

      if (selectedRoleFilter === 'all') {
        showError("Veuillez sélectionner un rôle spécifique pour configurer les menus.");
        return;
      }

      const overConfiguredItem = allConfiguredItemsFlat.find(item => item.configId === overId);
      const overIsRootContainer = overId === 'configured-container';
      const overIsChildContainer = overId.startsWith('configured-container-children-of-');

      if (overConfiguredItem) {
        if (activeDragItem.id === overConfiguredItem.id) {
          showError("Un élément ne peut pas être déplacé sur lui-même.");
          return;
        }
        const descendantsOfActiveItem = getDescendantIds(activeDragItem, allConfiguredItemsFlat);
        if (descendantsOfActiveItem.has(overConfiguredItem.id)) {
          showError("Un élément ne peut pas être le parent d'un de ses propres descendants.");
          return;
        }
        newParentNavItemId = overConfiguredItem.parent_nav_item_id || null;
      } else if (overIsRootContainer) {
        newParentNavItemId = null;
      } else if (overIsChildContainer) {
        newParentNavItemId = overId.replace('configured-container-children-of-', '');
        const parentItem = allConfiguredItemsFlat.find(item => item.id === newParentNavItemId);

        if (activeDragItem.id === newParentNavItemId) {
          showError("Un élément ne peut pas être déplacé dans lui-même.");
          return;
        }
        const descendantsOfActiveItem = getDescendantIds(activeDragItem, allConfiguredItemsFlat);
        if (descendantsOfActiveItem.has(newParentNavItemId)) {
          showError("Un élément ne peut pas être déplacé dans un de ses propres descendants.");
          return;
        }
        if (parentItem && parentItem.type === 'route') {
          showError("Vous ne pouvez pas placer un élément sous une route.");
          return;
        }
      } else {
        showError("Cible de dépôt non valide.");
        return;
      }

      const updatedConfig: Omit<RoleNavItemConfig, 'created_at' | 'updated_at'> = {
        id: activeDragConfig.id,
        nav_item_id: activeDragConfig.nav_item_id,
        role: activeDragConfig.role,
        parent_nav_item_id: newParentNavItemId,
        order_index: tempOrderIndex,
      };
      await updateRoleNavItemConfig(updatedConfig);
      showSuccess("Élément de navigation réorganisé/déplacé !");

      await fetchAndStructureNavItems();
    } catch (error: any) {
      console.error("Error during drag and drop:", error);
      showError(`Erreur lors du glisser-déposer: ${error.message}`);
    } finally {
      setActiveDragItem(null);
      setActiveDragConfig(null);
    }
  };

  const handleManageChildren = (parentItem: NavItem) => {
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
                isDragging={activeDragItem?.id === item.id || activeDragConfig?.id === item.configId}
                isDraggableAndDeletable={true}
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
    if (selectedRoleFilter === 'all') {
      showError("Veuillez sélectionner un rôle spécifique à réinitialiser.");
      return;
    }
    if (window.confirm(`Êtes-vous sûr de vouloir réinitialiser la navigation par défaut pour le rôle '${selectedRoleFilter}' ? Cela écrasera toutes les configurations existantes pour ce rôle.`)) {
      try {
        await resetRoleNavConfigsForRole(selectedRoleFilter as Profile['role']);
        showSuccess(`Navigation par défaut réinitialisée pour le rôle '${selectedRoleFilter}' !`);
        await fetchAndStructureNavItems(); // Re-fetch to update UI
      } catch (error: any) {
        console.error("Error resetting role navigation defaults:", error);
        showError(`Erreur lors de la réinitialisation de la navigation: ${error.message}`);
      }
    }
  };

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

  // Log the options being passed to the SearchableDropdown
  const dropdownOptions = allGenericNavItems
    .filter(item => !allConfiguredItemsFlat.some(configured => configured.id === item.id))
    .map(item => ({
      id: item.id,
      label: item.label,
      icon_name: item.icon_name,
      level: 0,
      isNew: false,
    }));
  // Removed the problematic console.log line
  // console.log("[RoleNavConfigsPage] Current selectedGenericItemToAdd:", selectedGenericItemToAdd);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Configuration des Menus par Rôle
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Sélectionnez un rôle pour voir et gérer les éléments de menu qui lui sont associés.
      </p>

      <Card className="rounded-android-tile">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRoundCog className="h-6 w-6 text-primary" /> Configurer les menus par rôle
          </CardTitle>
          <CardDescription>Sélectionnez un rôle pour voir et gérer les éléments de menu qui lui sont associés.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="role-filter">Rôle sélectionné</Label>
            <Select value={selectedRoleFilter} onValueChange={(value: Profile['role'] | 'all') => setSelectedRoleFilter(value)}>
              <SelectTrigger id="role-filter" className="rounded-android-tile">
                <SelectValue placeholder="Sélectionner un rôle..." />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-lg bg-background/80 rounded-android-tile">
                <SelectItem value="all">Sélectionner un rôle...</SelectItem>
                {ALL_ROLES.map(role => (
                  <SelectItem key={role} value={role}>
                    {role === 'student' ? 'Élève' :
                     role === 'professeur' ? 'Professeur' :
                     role === 'tutor' ? 'Tuteur' :
                     role === 'director' ? 'Directeur' :
                     role === 'deputy_director' ? 'Directeur Adjoint' :
                     'Administrateur'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedRoleFilter !== 'all' && (
            <Button onClick={handleResetRoleNav} variant="outline" className="mt-auto">
              <RefreshCw className="h-4 w-4 mr-2" /> Réinitialiser la navigation pour ce rôle
            </Button>
          )}
        </CardContent>
      </Card>

      {selectedRoleFilter !== 'all' && (
        <div className="grid grid-cols-1 gap-8">
          <Card className="rounded-android-tile">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutList className="h-6 w-6 text-primary" /> Structure de Navigation pour {selectedRoleFilter}
              </CardTitle>
              <CardDescription>Réorganisez les éléments par glisser-déposer. Utilisez le menu contextuel (clic droit) pour gérer les sous-éléments.</CardDescription>
            </CardHeader>
            <ContextMenu>
              <ContextMenuTrigger asChild>
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
                          isDragging={true}
                          isDraggableAndDeletable={true}
                          selectedRoleFilter={selectedRoleFilter}
                          isExpanded={false}
                          onToggleExpand={() => {}}
                        />
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </CardContent>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-auto p-1 pointer-events-auto rounded-android-tile">
                <ContextMenuItem className="p-2" onClick={() => setIsAddExistingItemDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un élément existant
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </Card>
        </div>
      )}

      {/* Edit Role Config Dialog */}
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
          onSave={fetchAndStructureNavItems} // Callback to refresh the list
          getDescendantIds={getDescendantIds}
          iconMap={iconMap}
        />
      )}

      {/* Manage Children Dialog */}
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
        />
      )}

      {/* New Add Existing Nav Item Dialog */}
      {selectedRoleFilter !== 'all' && (
        <AddExistingNavItemDialog
          isOpen={isAddExistingItemDialogOpen}
          onClose={() => setIsAddExistingItemDialogOpen(false)}
          selectedRoleFilter={selectedRoleFilter as Profile['role']}
          allGenericNavItems={allGenericNavItems}
          allConfiguredItemsFlat={allConfiguredItemsFlat}
          onItemAdded={fetchAndStructureNavItems}
          getDescendantIds={getDescendantIds}
          iconMap={iconMap}
        />
      )}
    </div>
  );
};

export default RoleNavConfigsPage;