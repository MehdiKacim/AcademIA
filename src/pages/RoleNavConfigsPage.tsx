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
import { PlusCircle, Edit, Trash2, GripVertical, ChevronDown, ChevronUp, Link as LinkIcon, ExternalLink, Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, Globe, Loader2, RefreshCw, Check } from "lucide-react";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

// Map icon_name strings to Lucide React components
const iconMap: { [key: string]: React.ElementType } = {
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, LinkIcon, ExternalLink, Globe
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto', // Bring dragged item to front
    opacity: isDragging ? 0.8 : 1,
    paddingLeft: `${level * 20}px`,
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
            "p-3 border rounded-md flex items-center justify-between gap-2 mb-2", 
            isDragging && "ring-2 ring-primary/50 shadow-xl",
            item.type === 'category_or_action' && (item.route === null || item.route === undefined) ? "bg-muted/40 font-semibold text-lg" : "bg-background text-base",
            item.type === 'category_or_action' && (item.route === null || item.route === undefined) && level === 0 && "border-l-4 border-primary/50"
          )}
        >
          <div className="flex items-center gap-2 flex-grow cursor-pointer" onClick={(e) => {
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
                <GripVertical className="h-5 w-5 text-muted-foreground" />
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
          <div className="flex gap-2">
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
        <ContextMenuContent className="w-auto p-1">
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

  const [isEditConfigDialogOpen, setIsEditConfigDialogOpen] = useState(false);
  const [currentConfigToEdit, setCurrentConfigToEdit] = useState<RoleNavItemConfig | null>(null);
  const [currentItemToEdit, setCurrentItemToEdit] = useState<NavItem | null>(null);
  const [editConfigParentId, setEditConfigParentId] = useState<string | null>(null); // Can be null for root
  const [editConfigOrderIndex, setEditConfigOrderIndex] = useState(0);
  const [isSavingConfigEdit, setIsSavingEdit] = useState(false); // Corrected state variable name

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
  const [openAddExistingPopover, setOpenAddExistingPopover] = useState(false);
  const [addExistingSearch, setAddExistingSearch] = useState('');
  const [openEditParentPopover, setOpenEditParentPopover] = useState(false);
  const [editParentSearch, setEditParentSearch] = useState('');


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

  const handleAddExistingGenericItemToRole = async (navItemId: string) => {
    if (selectedRoleFilter === 'all') {
      showError("Veuillez sélectionner un rôle spécifique pour ajouter un élément.");
      return;
    }
    const role = selectedRoleFilter as Profile['role'];

    const isAlreadyConfigured = allConfiguredItemsFlat.some(item => item.id === navItemId);
    if (isAlreadyConfigured) {
      showError("Cet élément est déjà configuré pour ce rôle.");
      return;
    }

    try {
      const newConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'> = {
        nav_item_id: navItemId,
        role: role,
        parent_nav_item_id: null,
        order_index: configuredItemsTree.filter(item => item.parent_nav_item_id === null).length,
      };
      await addRoleNavItemConfig(newConfig);
      showSuccess("Élément ajouté au menu du rôle !");

      await fetchAndStructureNavItems();
    } catch (error: any) {
      console.error("Error adding generic item to role menu:", error);
      showError(`Erreur lors de l'ajout de l'élément au menu du rôle: ${error.message}`);
    }
  };

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
    setEditConfigParentId(config.parent_nav_item_id || null);
    setEditConfigOrderIndex(config.order_index);
    setIsEditConfigDialogOpen(true);
  };

  const handleSaveEditedRoleConfig = async () => {
    console.log("[handleSaveEditedRoleConfig] Function called.");
    console.log("[handleSaveEditedRoleConfig] isSavingConfigEdit state:", isSavingConfigEdit); // Diagnostic log
    if (!currentConfigToEdit || !currentItemToEdit || selectedRoleFilter === 'all') return;

    let finalParentId: string | null = editConfigParentId; // This is the ID from the dropdown

    // Check if the selected parent is a new generic item (not yet configured for this role)
    const selectedParentInfo = availableParentsForConfig.find(p => p.id === finalParentId);

    if (selectedParentInfo?.isNew) {
        // This means we need to create a role_nav_config for this generic item first
        try {
            const newParentConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'> = {
                nav_item_id: finalParentId!, // The ID of the generic item
                role: selectedRoleFilter as Profile['role'],
                parent_nav_item_id: null, // Initially, add it as a root item for the role
                order_index: 9999, // A high number, will be re-indexed later
            };
            const addedConfig = await addRoleNavItemConfig(newParentConfig);
            if (addedConfig) {
                // Now, the generic item is configured for this role, and we can use its ID as the parent
                // The actual parent_nav_item_id for the item being edited will be the generic item's ID
                finalParentId = addedConfig.nav_item_id; // Use the generic item's ID as the parent
                showSuccess(`Catégorie '${selectedParentInfo.label}' ajoutée au menu du rôle.`);
            } else {
                showError(`Échec de l'ajout de la catégorie '${selectedParentInfo.label}' au menu du rôle.`);
                setIsSavingEdit(false);
                return;
            }
        } catch (error: any) {
            console.error("Error adding new generic parent to role config:", error);
            showError(`Erreur lors de l'ajout de la nouvelle catégorie parente: ${error.message}`);
            setIsSavingEdit(false);
            return;
        }
    }

    if (finalParentId && finalParentId === currentItemToEdit.id) {
      showError("Un élément ne peut pas être son propre parent.");
      setIsSavingEdit(false);
      return;
    }
    const descendantsOfCurrentItem = getDescendantIds(currentItemToEdit, allConfiguredItemsFlat);
    if (finalParentId && descendantsOfCurrentItem.has(finalParentId)) {
      showError("Un élément ne peut pas être le parent d'un de ses propres descendants.");
      setIsSavingEdit(false);
      return;
    }

    setIsSavingEdit(true); // Corrected state setter name
    try {
      const updatedConfigData: Omit<RoleNavItemConfig, 'created_at' | 'updated_at'> = {
        id: currentConfigToEdit.id,
        nav_item_id: currentConfigToEdit.nav_item_id,
        role: currentConfigToEdit.role,
        parent_nav_item_id: finalParentId,
        order_index: editConfigOrderIndex,
      };
      console.log("[handleSaveEditedRoleConfig] Updating config with parent_nav_item_id:", updatedConfigData.parent_nav_item_id); // Diagnostic log
      await updateRoleNavItemConfig(updatedConfigData);
      showSuccess("Configuration de rôle mise à jour !");
      await fetchAndStructureNavItems();
      setIsEditConfigDialogOpen(false);
      setCurrentConfigToEdit(null);
      setCurrentItemToEdit(null);
    } catch (error: any) {
      console.error("Error updating role config:", error);
      showError(`Erreur lors de la mise à jour de la configuration de rôle: ${error.message}`);
    } finally {
      setIsSavingEdit(false); // Corrected state setter name
    }
  };

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
      <div id={containerId} className="min-h-[50px] p-2 border border-dashed border-muted-foreground/30 rounded-md">
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

  const availableParentsForConfig = useMemo(() => {
    if (!currentItemToEdit) {
      return [];
    }

    const descendantsOfCurrentItem = getDescendantIds(currentItemToEdit, allConfiguredItemsFlat);
    const configuredItemIds = new Set(allConfiguredItemsFlat.map(item => item.id));

    const potentialParents: { id: string; label: string; level: number; icon_name?: string; typeLabel: string; isNew: boolean }[] = [];

    // 1. Add already configured categories that are valid parents
    allConfiguredItemsFlat.forEach(item => {
      const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);
      const isNotSelf = item.id !== currentItemToEdit.id;
      const isNotDescendant = !descendantsOfCurrentItem.has(item.id);

      if (isCategory && isNotSelf && isNotDescendant) {
        let level = 0;
        let currentParentId = item.parent_nav_item_id;
        while (currentParentId) {
          level++;
          const parent = allConfiguredItemsFlat.find(i => i.id === currentParentId);
          currentParentId = parent?.parent_nav_item_id;
        }
        potentialParents.push({
          id: item.id,
          label: item.label,
          level: level,
          icon_name: item.icon_name,
          typeLabel: getItemTypeLabel(item.type),
          isNew: false, // This is an existing configured parent
        });
      }
    });

    // 2. Add generic categories that are NOT YET configured for this role and are valid parents
    allGenericNavItems.forEach(item => {
      // Only consider if it's a category and not already configured for this role
      const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);
      const isNotConfiguredForRole = !configuredItemIds.has(item.id);
      const isNotSelf = item.id !== currentItemToEdit.id;
      const isNotDescendant = !descendantsOfCurrentItem.has(item.id); // Check against descendants of currentItemToEdit

      if (isCategory && isNotConfiguredForRole && isNotSelf && isNotDescendant) {
        // For new generic items, assume level 0 for display in the dropdown
        potentialParents.push({
          id: item.id,
          label: item.label,
          level: 0, // Treat as a potential root-level parent for now
          icon_name: item.icon_name,
          typeLabel: getItemTypeLabel(item.type),
          isNew: true, // This is a new generic parent to be configured
        });
      }
    });

    const sortedParents = potentialParents.sort((a, b) => a.label.localeCompare(b.label));
    return sortedParents;
  }, [currentItemToEdit, allConfiguredItemsFlat, allGenericNavItems, getDescendantIds]);

  const handleResetRoleNav = async () => {
    if (selectedRoleFilter === 'all') {
      showError("Veuillez sélectionner un rôle spécifique à réinitialiser.");
      return;
    }
    if (window.confirm(`Êtes-vous sûr de vouloir réinitialiser la navigation par défaut pour le rôle '${selectedRoleFilter}' ? Cela écrasera toutes les configurations existantes pour ce rôle.`)) {
      try {
        await resetRoleNavConfigsForRole(selectedRoleFilter as Profile['role']);
        // Removed call to bootstrapDefaultNavItemsForRole
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

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Configuration des Menus par Rôle
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Sélectionnez un rôle pour voir et gérer les éléments de menu qui lui sont associés.
      </p>

      <Card>
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
              <SelectTrigger id="role-filter">
                <SelectValue placeholder="Sélectionner un rôle..." />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-lg bg-background/80">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutList className="h-6 w-6 text-primary" /> Structure de Navigation pour {selectedRoleFilter}
              </CardTitle>
              <CardDescription>Réorganisez les éléments par glisser-déposer. Utilisez le menu contextuel (clic droit) pour gérer les sous-éléments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label htmlFor="add-existing-to-role">Ajouter un élément générique existant</Label>
                <Popover open={openAddExistingPopover} onOpenChange={setOpenAddExistingPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openAddExistingPopover}
                      className="w-full justify-between"
                      id="add-existing-to-role"
                    >
                      {selectedGenericItemToAdd
                        ? allGenericNavItems.find(item => item.id === selectedGenericItemToAdd)?.label
                        : "Ajouter un élément existant au menu de ce rôle"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Rechercher un élément..."
                        value={addExistingSearch}
                        onValueChange={setAddExistingSearch}
                      />
                      <CommandList>
                        <CommandEmpty>Aucun élément trouvé.</CommandEmpty>
                        <CommandGroup>
                          {allGenericNavItems
                            .filter(item => !allConfiguredItemsFlat.some(configured => configured.id === item.id))
                            .filter(item => item.label.toLowerCase().includes(addExistingSearch.toLowerCase()))
                            .map(item => (
                              <CommandItem
                                key={item.id}
                                value={item.label}
                                onSelect={() => {
                                  handleAddExistingGenericItemToRole(item.id);
                                  setSelectedGenericItemToAdd(item.id); // Update selected item for display
                                  setOpenAddExistingPopover(false);
                                  setAddExistingSearch(''); // Clear search after selection
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedGenericItemToAdd === item.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {iconMap[item.icon_name || 'Info'] && React.createElement(iconMap[item.icon_name || 'Info'], { className: "h-4 w-4 mr-2" })}
                                <span>{item.label} ({getItemTypeLabel(item.type)}) {item.route && `(${item.route})`}</span>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

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
          </Card>
        </div>
      )}

      {/* Edit Role Config Dialog */}
      {currentConfigToEdit && currentItemToEdit && (
        <Dialog open={isEditConfigDialogOpen} onOpenChange={setIsEditConfigDialogOpen}>
          <DialogContent className="sm:max-w-[600px] bg-card z-[100]">
            <DialogHeader>
              <DialogTitle>Modifier la configuration de "{currentItemToEdit.label}" pour {selectedRoleFilter}</DialogTitle>
              <DialogDescription>
                Ajustez la position et le parent de cet élément dans le menu de ce rôle.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-config-parent" className="text-right">Parent</Label>
                <Popover open={openEditParentPopover} onOpenChange={setOpenEditParentPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openEditParentPopover}
                      className="col-span-3 justify-between"
                      id="edit-config-parent-select"
                    >
                      {editConfigParentId
                        ? availableParentsForConfig.find(p => p.id === editConfigParentId)?.label || "Sélectionner un parent..."
                        : "Aucun (élément racine)"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Rechercher un parent..."
                        value={editParentSearch}
                        onValueChange={setEditParentSearch}
                      />
                      <CommandList>
                        <CommandEmpty>Aucun parent trouvé.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="none"
                            onSelect={() => {
                              setEditConfigParentId(null);
                              setOpenEditParentPopover(false);
                              setEditParentSearch(''); // Clear search after selection
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                editConfigParentId === null ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Aucun (élément racine)
                          </CommandItem>
                          {availableParentsForConfig
                            .filter(item => item.label.toLowerCase().includes(editParentSearch.toLowerCase()))
                            .map((item) => {
                              const IconComponentToRender: React.ElementType = (item.icon_name && typeof item.icon_name === 'string' && iconMap[item.icon_name]) ? iconMap[item.icon_name] : Info;
                              return (
                                <CommandItem
                                  key={item.id}
                                  value={item.label}
                                  onSelect={() => {
                                    setEditConfigParentId(item.id);
                                    setOpenEditParentPopover(false);
                                    setEditParentSearch(''); // Clear search after selection
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      editConfigParentId === item.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex items-center gap-2">
                                    {Array(item.level).fill('—').join('') && <span>{Array(item.level).fill('—').join('')}</span>}
                                    <IconComponentToRender className="h-4 w-4" /> 
                                    <span>{item.label} ({getItemTypeLabel(item.type)}) {item.isNew && <span className="font-bold text-primary">(Nouveau)</span>}</span>
                                  </div>
                                </CommandItem>
                              );
                            })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-config-order" className="text-right">Ordre</Label>
                <Input id="edit-config-order" type="number" value={editConfigOrderIndex} onChange={(e) => setEditConfigOrderIndex(parseInt(e.target.value))} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveEditedRoleConfig} disabled={isSavingConfigEdit}>
                {isSavingConfigEdit ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Enregistrer les modifications"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
    </div>
  );
};

export default RoleNavConfigsPage;