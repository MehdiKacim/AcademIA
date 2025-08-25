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
    import { PlusCircle, Edit, Trash2, GripVertical, ChevronDown, ChevronUp, Link as LinkIcon, ExternalLink, Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, Globe, Loader2 } from "lucide-react";
    import { NavItem, Profile, RoleNavItemConfig } from "@/lib/dataModels"; // Import RoleNavItemConfig
    import { showSuccess, showError } from "@/utils/toast";
    import { loadAllNavItemsRaw, addNavItem, updateNavItem, deleteNavItem, addRoleNavItemConfig, updateRoleNavItemConfig, deleteRoleNavItemConfig, getRoleNavItemConfigsByRole, resetRoleNavConfigsForRole } from "@/lib/navItems"; // Use new functions
    import { useRole } from '@/contexts/RoleContext';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
    import { Textarea } from "@/components/ui/textarea";
    import { Switch } from "@/components/ui/switch";
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
    import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
      DialogFooter,
    } from "@/components/ui/dialog";
    import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"; // Import Collapsible
    import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'; // Import ContextMenu
    import ManageChildrenDialog from '@/components/AdminMenu/ManageChildrenDialog'; // Import new dialog
    import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea
    import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"; // Import Command components
    import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Import Popover components

    // Map icon_name strings to Lucide React components
    const iconMap: { [key: string]: React.ElementType } = {
      Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, LinkIcon, ExternalLink, Globe
    };

    // All possible roles for selection
    const allRoles: Profile['role'][] = ['student', 'professeur', 'tutor', 'administrator', 'director', 'deputy_director'];
    const navItemTypes: NavItem['type'][] = ['route', 'category_or_action']; // Updated: Replaced 'category' and 'action'

    interface SortableNavItemProps {
      item: NavItem;
      level: number;
      onEditGenericItem: (item: NavItem) => void;
      onEditRoleConfig: (item: NavItem, config: RoleNavItemConfig) => void;
      onDelete: (navItemId: string, configId?: string) => void;
      onManageChildren: (parentItem: NavItem) => void; // New prop for managing children
      isDragging?: boolean;
      isDraggableAndDeletable: boolean;
      selectedRoleFilter: Profile['role'] | 'all'; // Pass selectedRoleFilter
      isExpanded: boolean; // New prop for expansion state
      onToggleExpand: (itemId: string) => void; // New prop to toggle expansion
    }

    const SortableNavItem = React.forwardRef<HTMLDivElement, SortableNavItemProps>(({ item, level, onEditGenericItem, onEditRoleConfig, onDelete, onManageChildren, isDragging, isDraggableAndDeletable, selectedRoleFilter, isExpanded, onToggleExpand }, ref) => {
      const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
      } = useSortable({ id: item.configId || item.id, disabled: !isDraggableAndDeletable }); // Disable sortable if not draggable

      const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 'auto', // Bring dragged item to front
        opacity: isDragging ? 0.8 : 1,
        paddingLeft: `${level * 20}px`, // Indent based on level
      };

      const IconComponent = iconMap[item.icon_name || 'Info'] || Info;

      const config: RoleNavItemConfig | undefined = item.configId && selectedRoleFilter !== 'all' ? {
        id: item.configId,
        nav_item_id: item.id,
        role: selectedRoleFilter as Profile['role'],
        parent_nav_item_id: item.parent_nav_item_id,
        order_index: item.order_index,
      } : undefined; // Removed establishment_id

      const hasChildren = item.children && item.children.length > 0;

      // Use item.type directly
      const getItemTypeLabel = (type: NavItem['type']) => {
        switch (type) {
          case 'route': return "Route";
          case 'category_or_action': return "Catégorie/Action"; // Updated label
          default: return "Inconnu";
        }
      };

      return (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div 
              ref={setNodeRef} 
              style={style} 
              className={cn(
                "p-3 border rounded-md flex items-center justify-between gap-2 mb-2", 
                isDragging && "ring-2 ring-primary/50 shadow-xl",
                item.type === 'category_or_action' && (item.route === null || item.route === undefined) ? "bg-muted/40 font-semibold text-lg" : "bg-background text-base", // Distinct styling for categories
                item.type === 'category_or_action' && (item.route === null || item.route === undefined) && level === 0 && "border-l-4 border-primary/50" // Stronger border for root categories
              )}
            >
              <div className="flex items-center gap-2 flex-grow cursor-pointer" onClick={(e) => {
                // Only toggle expand if it has children and click is not on a button
                if (hasChildren) {
                  e.stopPropagation(); // Prevent triggering parent's onClick if any
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
                      e.stopPropagation(); // Prevent triggering parent div's onClick
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
                {config && ( // Only show edit config if it's a configured item
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
          {/* Show "Manage Children" for any item that is a category (no route) */}
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

    const AdminMenuManagementPage = () => {
      const { currentUserProfile, currentRole, isLoadingUser } = useRole();
      const [allGenericNavItems, setAllGenericNavItems] = useState<NavItem[]>([]); // All items from nav_items table
      const [configuredItemsTree, setConfiguredItemsTree] = useState<NavItem[]>([]); // Configured items for selected role
      const [allConfiguredItemsFlat, setAllConfiguredItemsFlat] = useState<NavItem[]>([]); // Flat list of configured items
      const [isNewItemFormOpen, setIsNewItemFormOpen] = useState(false);

      // State for global role filter
      const [selectedRoleFilter, setSelectedRoleFilter] = useState<Profile['role'] | 'all'>('all');

      // States for new generic item form
      const [newItemLabel, setNewItemLabel] = useState('');
      const [newItemRoute, setNewItemRoute] = useState('');
      const [newItemIconName, setNewItemIconName] = useState('');
      const [newItemDescription, setNewItemDescription] = useState('');
      const [newItemIsExternal, setNewItemIsExternal] = useState(false);
      const [newItemType, setNewItemType] = useState<NavItem['type']>('route');
      const [isAddingItem, setIsAddingItem] = useState(false);

      // States for edit dialog (for generic nav item properties)
      const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
      const [currentItemToEdit, setCurrentItemToEdit] = useState<NavItem | null>(null);
      const [editItemLabel, setEditItemLabel] = useState('');
      const [editItemRoute, setEditItemRoute] = useState('');
      const [editItemIconName, setEditItemIconName] = useState('');
      const [editItemDescription, setEditItemDescription] = useState('');
      const [editItemIsExternal, setEditItemIsExternal] = useState(false);
      const [editItemType, setEditItemType] = useState<NavItem['type']>('route');
      const [isSavingEdit, setIsSavingEdit] = useState(false);

      // States for edit dialog (for role-specific config properties)
      const [isEditConfigDialogOpen, setIsEditConfigDialogOpen] = useState(false);
      const [currentConfigToEdit, setCurrentConfigToEdit] = useState<RoleNavItemConfig | null>(null);
      const [editConfigParentId, setEditConfigParentId] = useState<string | undefined>(undefined);
      const [editConfigOrderIndex, setEditConfigOrderIndex] = useState(0);
      const [isSavingConfigEdit, setIsSavingConfigEdit] = useState(false);

      // States for managing children dialog
      const [isManageChildrenDialogOpen, setIsManageChildrenDialogOpen] = useState(false);
      const [selectedParentForChildrenManagement, setSelectedParentForChildrenManagement] = useState<NavItem | null>(null);

      // NEW: Separate state for the edit dialog's parent input
      const [editConfigParentInput, setEditConfigParentInput] = useState<string>('');
      // NEW: Separate state for the edit dialog's Popover open state
      const [openEditConfigParentSelect, setOpenEditConfigParentSelect] = useState(false);


      // New state for expanded items in the tree view
      const [expandedItems, setExpandedItems] = useState<{ [itemId: string]: boolean }>({});

      const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
          coordinateGetter: sortableKeyboardCoordinates,
        })
      );

      const [activeDragItem, setActiveDragItem] = useState<NavItem | null>(null);
      const [activeDragConfig, setActiveDragConfig] = useState<RoleNavItemConfig | null>(null);

      // Helper to find an item in the tree by its configId or id
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

      // Helper to get all descendants of an item
      const getDescendantIds = useCallback((item: NavItem, allItems: NavItem[]): Set<string> => {
        const descendants = new Set<string>();
        const queue: NavItem[] = [...(item.children || [])];
        while (queue.length > 0) {
          const current = queue.shift();
          if (current) {
            descendants.add(current.id);
            const childrenOfCurrent = allItems.filter(i => i.parent_nav_item_id === current.id);
            childrenOfCurrent.forEach(child => queue.push(child));
          }
        }
        return descendants;
      }, []);


      const fetchAndStructureNavItems = useCallback(async () => {
        const genericItems = await loadAllNavItemsRaw();
        setAllGenericNavItems(genericItems);

        if (selectedRoleFilter === 'all') {
          setConfiguredItemsTree([]);
          setAllConfiguredItemsFlat([]); // Clear flat list too
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

          const sortAndReindex = async (items: NavItem[], parentId: string | null) => {
            items.sort((a, b) => a.order_index - b.order_index);
            for (let i = 0; i < items.length; i++) {
              const item = items[i];
              if (item.order_index !== i || item.parent_nav_item_id !== parentId) {
                const updatedConfig: Omit<RoleNavItemConfig, 'created_at' | 'updated_at'> = {
                  id: item.configId!,
                  nav_item_id: item.id,
                  role: role,
                  parent_nav_item_id: parentId,
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
          console.log("[AdminMenuManagementPage] Configured items tree rebuilt:", finalRootItems);
        }
      }, [selectedRoleFilter, findItemInTree, getDescendantIds]);

      useEffect(() => {
        fetchAndStructureNavItems();
      }, [fetchAndStructureNavItems]);

      const handleAddGenericNavItem = async () => {
        if (!newItemLabel.trim()) {
          showError("Le libellé est requis.");
          return;
        }
        if (newItemType === 'route' && !newItemRoute.trim()) {
          showError("Une route est requise pour un élément de type 'Route'.");
          return;
        }
        if (newItemType === 'category_or_action' && !newItemRoute.trim()) {
          // For category_or_action, route can be null (category) or a hash route (action)
          // If it's meant to be an action, a route is required. If it's a category, route should be null.
          // This check is now more flexible.
        }

        setIsAddingItem(true);
        try {
          const newItemData: Omit<NavItem, 'id' | 'created_at' | 'updated_at' | 'children' | 'badge' | 'configId' | 'parent_nav_item_id' | 'order_index' | 'is_global'> = {
            label: newItemLabel.trim(),
            route: newItemRoute.trim() || null,
            description: newItemDescription.trim() || null,
            is_external: newItemIsExternal,
            icon_name: newItemIconName || null,
            type: newItemType,
          };
          const addedItem = await addNavItem(newItemData);
          showSuccess("Élément de navigation générique ajouté !");

          // If a specific role is selected, also add a config for it as a root item
          if (selectedRoleFilter !== 'all' && addedItem) {
            const newConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'> = {
              nav_item_id: addedItem.id,
              role: selectedRoleFilter as Profile['role'],
              parent_nav_item_id: null,
              order_index: configuredItemsTree.filter(item => item.parent_nav_item_id === null).length,
            };
            await addRoleNavItemConfig(newConfig);
            showSuccess("Configuration de rôle ajoutée pour le nouvel élément !");
          }

          await fetchAndStructureNavItems();
          // Reset form
          setNewItemLabel('');
          setNewItemRoute('');
          setNewItemIconName('');
          setNewItemDescription('');
          setNewItemIsExternal(false);
          setNewItemType('route');
          setIsNewItemFormOpen(false);
        } catch (error: any) {
          console.error("Error adding generic nav item:", error);
          showError(`Erreur lors de l'ajout de l'élément générique: ${error.message}`);
        } finally {
          setIsAddingItem(false);
        }
      };

      const handleDeleteGenericNavItem = async (navItemId: string, configId?: string) => {
        if (selectedRoleFilter !== 'all' && configId) {
          const configToDelete = configuredItemsTree.find(item => item.configId === configId);
          if (window.confirm(`Êtes-vous sûr de vouloir supprimer cette configuration de rôle pour l'élément ? Cela ne supprimera pas l'élément générique lui-même.`)) {
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
          if (window.confirm("Êtes-vous sûr de vouloir supprimer cet élément de navigation générique ? Cela supprimera toutes ses configurations de rôle associées. Cette action est irréversible.")) {
            try {
              await deleteNavItem(navItemId);
              showSuccess("Élément de navigation générique supprimé !");
              await fetchAndStructureNavItems();
            } catch (error: any) {
              console.error("Error deleting generic nav item:", error);
              showError(`Erreur lors de la suppression de l'élément générique: ${error.message}`);
            }
          }
        }
      };

      const handleEditGenericNavItem = (item: NavItem) => {
        setCurrentItemToEdit(item);
        setEditItemLabel(item.label);
        setEditItemRoute(item.route || '');
        setEditItemIconName(item.icon_name || '');
        setEditItemDescription(item.description || '');
        setEditItemIsExternal(item.is_external);
        setEditItemType(item.type);
        setIsEditDialogOpen(true);
      };

      const handleSaveEditedGenericNavItem = async () => {
        if (!currentItemToEdit) return;
        if (!editItemLabel.trim()) {
          showError("Le libellé est requis.");
          return;
        }
        if (editItemType === 'route' && !editItemRoute.trim()) {
          showError("Une route est requise pour un élément de type 'Route'.");
          return;
        }
        if (editItemType === 'category_or_action' && !editItemRoute.trim()) {
          // Same logic as for new item: allow empty route for category, require for action
        }

        setIsSavingEdit(true);
        try {
          const updatedItemData: Omit<NavItem, 'created_at' | 'updated_at' | 'children' | 'badge' | 'configId' | 'parent_nav_item_id' | 'order_index' | 'is_global'> = {
            id: currentItemToEdit.id,
            label: editItemLabel.trim(),
            route: editItemRoute.trim() || null,
            description: editItemDescription.trim() || null,
            is_external: editItemIsExternal,
            icon_name: editItemIconName || null,
            type: editItemType,
          };
          await updateNavItem(updatedItemData);
          showSuccess("Élément de navigation générique mis à jour !");
          await fetchAndStructureNavItems();
          setIsEditDialogOpen(false);
          setCurrentItemToEdit(null);
        } catch (error: any) {
          console.error("Error updating generic nav item:", error);
          showError(`Erreur lors de la mise à jour de l'élément générique: ${error.message}`);
        } finally {
          setIsSavingEdit(false);
        }
      };

      const handleEditRoleConfig = (item: NavItem, config: RoleNavItemConfig) => {
        setCurrentItemToEdit(item);
        setCurrentConfigToEdit(config);
        setEditConfigParentInput(item.parent_nav_item_id ? configuredItemsTree.find(i => i.id === item.parent_nav_item_id)?.label || '' : '');
        setEditConfigParentId(config.parent_nav_item_id || undefined);
        setEditConfigOrderIndex(config.order_index);
        setIsEditConfigDialogOpen(true);
        setOpenEditConfigParentSelect(false);
      };

      const handleSaveEditedRoleConfig = async () => {
        if (!currentConfigToEdit || !currentItemToEdit || selectedRoleFilter === 'all') return;

        let finalParentId: string | null = null;
        if (editConfigParentInput.trim() !== '') {
          let parentItem = allGenericNavItems.find(item => item.label.toLowerCase() === editConfigParentInput.trim().toLowerCase() && item.type === 'category_or_action' && (item.route === null || item.route === undefined));

          if (!parentItem) {
            const newCategory: Omit<NavItem, 'id' | 'created_at' | 'updated_at' | 'children' | 'badge' | 'configId' | 'parent_nav_item_id' | 'order_index' | 'is_global'> = {
              label: editConfigParentInput.trim(),
              route: null,
              description: `Catégorie générée automatiquement pour '${editConfigParentInput.trim()}'`,
              is_external: false,
              icon_name: 'LayoutList',
              type: 'category_or_action',
            };
            parentItem = await addNavItem(newCategory);
            if (!parentItem) {
              showError("Échec de la création de la nouvelle catégorie parente.");
              setIsSavingConfigEdit(false);
              return;
            }
            showSuccess(`Catégorie '${parentItem.label}' créée automatiquement !`);
          }
          finalParentId = parentItem.id;
        }

        if (finalParentId === currentItemToEdit.id) {
          showError("Un élément ne peut pas être son propre parent.");
          setIsSavingConfigEdit(false);
          return;
        }
        const descendantsOfCurrentItem = getDescendantIds(currentItemToEdit, configuredItemsTree);
        if (finalParentId && descendantsOfCurrentItem.has(finalParentId)) {
          showError("Un élément ne peut pas être le parent d'un de ses propres descendants.");
          setIsSavingConfigEdit(false);
          return;
        }

        setIsSavingConfigEdit(true);
        try {
          const updatedConfigData: Omit<RoleNavItemConfig, 'created_at' | 'updated_at'> = {
            id: currentConfigToEdit.id,
            nav_item_id: currentConfigToEdit.nav_item_id,
            role: currentConfigToEdit.role,
            parent_nav_item_id: finalParentId,
            order_index: editConfigOrderIndex,
          };
          console.log("[AdminMenuManagementPage] Saving updated config:", updatedConfigData);
          await updateRoleNavItemConfig(updatedConfigData);
          showSuccess("Configuration de rôle mise à jour !");
          await fetchAndStructureNavItems();
          setIsEditConfigDialogOpen(false);
          setCurrentConfigToEdit(null);
          setCurrentItemToEdit(null);
          setEditConfigParentInput('');
        } catch (error: any) {
          console.error("Error updating role config:", error);
          showError(`Erreur lors de la mise à jour de la configuration de rôle: ${error.message}`);
        } finally {
          setIsSavingConfigEdit(false);
        }
      };

      const handleDragStart = (event: any) => {
        const { active } = event;

        const configuredItem = findItemInTree(configuredItemsTree, active.id);
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
          let newOrderIndex: number = 0;

          if (selectedRoleFilter === 'all') {
            showError("Veuillez sélectionner un rôle spécifique pour configurer les menus.");
            return;
          }

          console.log("[handleDragEnd] Active item:", activeDragItem);
          console.log("[handleDragEnd] Over ID:", overId);

          const overConfiguredItem = findItemInTree(configuredItemsTree, overId);
          const overIsConfiguredRootContainer = overId === 'configured-container';
          const overIsConfiguredChildContainer = overId.startsWith('configured-container-children-of-');

          if (overConfiguredItem) {
            if (activeDragItem.id === overConfiguredItem.id) {
              showError("Un élément ne peut pas être déplacé sur lui-même.");
              return;
            }
            const descendantsOfActiveItem = getDescendantIds(activeDragItem, configuredItemsTree);
            if (descendantsOfActiveItem.has(overConfiguredItem.id)) {
              showError("Un élément ne peut pas être le parent d'un de ses propres descendants.");
              return;
            }

            if (overConfiguredItem.type === 'category_or_action' && (overConfiguredItem.route === null || overConfiguredItem.route === undefined)) {
                newParentNavItemId = overConfiguredItem.id;
                newOrderIndex = overConfiguredItem.children?.length || 0;
                console.log("[handleDragEnd] Dropped ONTO category. New parent:", newParentNavItemId, "New order:", newOrderIndex);
            } else {
                newParentNavItemId = overConfiguredItem.parent_nav_item_id || null;
                const siblings =
                    newParentNavItemId === null
                        ? configuredItemsTree.filter((item) => item.parent_nav_item_id === null)
                        : configuredItemsTree.find((item) => item.id === newParentNavItemId)
                            ?.children || [];
                const overItemIndex = siblings.findIndex(
                    (s) => s.configId === overId
                );
                newOrderIndex =
                    overItemIndex !== -1 ? overItemIndex + 1 : siblings.length;
                console.log("[handleDragEnd] Dropped BETWEEN items. New parent:", newParentNavItemId, "New order:", newOrderIndex);
            }

          } else if (overIsConfiguredRootContainer) {
            newParentNavItemId = null;
            newOrderIndex = configuredItemsTree.filter((item) => item.parent_nav_item_id === null)
              .length;
            console.log("[handleDragEnd] Dropped into root container. New parent:", newParentNavItemId, "New order:", newOrderIndex);
          } else if (overIsConfiguredChildContainer) {
            newParentNavItemId = overId.replace(
              'configured-container-children-of-',
              ''
            );
            const parentItem = findItemInTree(
              configuredItemsTree,
              newParentNavItemId
            );

            if (activeDragItem.id === newParentNavItemId) {
              showError("Un élément ne peut pas être déplacé dans lui-même.");
              return;
            }
            const descendantsOfActiveItem = getDescendantIds(activeDragItem, configuredItemsTree);
            if (descendantsOfActiveItem.has(newParentNavItemId)) {
              showError("Un élément ne peut pas être déplacé dans un de ses propres descendants.");
              return;
            }

            newOrderIndex = parentItem?.children?.length || 0;
            console.log("[handleDragEnd] Dropped into child container. New parent:", newParentNavItemId, "New order:", newOrderIndex);
          } else {
            showError("Cible de dépôt non valide.");
            return;
          }

          const updatedConfig: Omit<RoleNavItemConfig, 'created_at' | 'updated_at'> = {
            ...activeDragConfig,
            parent_nav_item_id: newParentNavItemId,
            order_index: newOrderIndex,
          };
          console.log("[handleDragEnd] Updating config with:", updatedConfig);
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
                    onEditGenericItem={handleEditGenericNavItem}
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

      // Function to add an existing generic item to the current role's menu
      const handleAddExistingGenericItemToRole = async (navItemId: string) => {
        if (selectedRoleFilter === 'all') {
          showError("Veuillez sélectionner un rôle spécifique pour ajouter un élément.");
          return;
        }
        const role = selectedRoleFilter as Profile['role'];

        // Check if already configured for this role
        const isAlreadyConfigured = allConfiguredItemsFlat.some(item => item.id === navItemId);
        if (isAlreadyConfigured) {
          showError("Cet élément est déjà configuré pour ce rôle.");
          return;
        }

        try {
          const newConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'> = {
            nav_item_id: navItemId,
            role: role,
            parent_nav_item_id: null, // Add as a root item by default
            order_index: configuredItemsTree.filter(item => item.parent_nav_item_id === null).length, // Add to end of root items
          };
          await addRoleNavItemConfig(newConfig);
          showSuccess("Élément ajouté au menu du rôle !");
          await fetchAndStructureNavItems(); // Refresh list
        } catch (error: any) {
          console.error("Error adding generic item to role menu:", error);
          showError(`Erreur lors de l'ajout de l'élément au menu du rôle: ${error.message}`);
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

      const getFlattenedCategoriesForParentSelection = useCallback((items: NavItem[], excludeId?: string, currentLevel = 0, prefix = ''): { id: string; label: string; level: number; icon_name?: string; typeLabel: string }[] => {
        let flattened: { id: string; label: string; level: number; icon_name?: string; typeLabel: string }[] = [];
        items.forEach(item => {
          if (item.type === 'category_or_action' && (item.route === null || item.route === undefined) && item.id !== excludeId) {
            const newLabel = prefix ? `${prefix} > ${item.label}` : item.label;
            flattened.push({ id: item.id, label: newLabel, level: currentLevel, icon_name: item.icon_name, typeLabel: "Catégorie/Action" });
            if (item.children) {
              flattened = flattened.concat(getFlattenedCategoriesForParentSelection(item.children, excludeId, currentLevel + 1, newLabel));
            }
          }
        });
        return flattened;
      }, []);

      const availableParentsForConfig = useMemo(() => {
        if (!currentItemToEdit) return [];
        console.log("[availableParentsForConfig] currentItemToEdit:", currentItemToEdit);
        console.log("[availableParentsForConfig] configuredItemsTree:", configuredItemsTree);

        const allPotentialParents = getFlattenedCategoriesForParentSelection(configuredItemsTree, currentItemToEdit.id);
        console.log("[availableParentsForConfig] All potential parents (before descendant check):", allPotentialParents);

        const descendantsOfCurrentItem = getDescendantIds(currentItemToEdit, configuredItemsTree);
        console.log("[availableParentsForConfig] Descendants of current item:", descendantsOfCurrentItem);

        const filteredParents = allPotentialParents.filter(parent =>
          parent.id !== currentItemToEdit.id &&
          !descendantsOfCurrentItem.has(parent.id)
        );
        console.log("[availableParentsForConfig] Filtered parents:", filteredParents);
        return filteredParents;
      }, [currentItemToEdit, configuredItemsTree, getFlattenedCategoriesForParentSelection, getDescendantIds]);

      const getItemTypeLabel = (type: NavItem['type']) => {
        switch (type) {
          case 'route': return "Route";
          case 'category_or_action': return "Catégorie/Action";
          default: return "Inconnu";
        }
      };

      return (
        <div className="space-y-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
            Gestion des Menus de Navigation
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Créez, modifiez, supprimez et réorganisez les éléments de navigation de l'application.
          </p>

          {/* Section 1: Gestion des Éléments de Navigation Génériques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutList className="h-6 w-6 text-primary" /> Gestion des Éléments Génériques
              </CardTitle>
              <CardDescription>Définissez les éléments de navigation de base disponibles pour tous les rôles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formulaire d'ajout d'un nouvel élément générique */}
              <Collapsible open={isNewItemFormOpen} onOpenChange={setIsNewItemFormOpen}>
                <Card className="border-none shadow-none">
                  <CardHeader className="p-0 pb-4">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-0">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <PlusCircle className="h-5 w-5 text-primary" /> Ajouter un nouvel élément générique
                        </CardTitle>
                        {isNewItemFormOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CardDescription>Créez un nouveau lien ou une catégorie disponible pour tous les rôles.</CardDescription>
                  </CardHeader>
                  <CollapsibleContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="new-item-label">Libellé</Label>
                        <Input id="new-item-label" value={newItemLabel} onChange={(e) => setNewItemLabel(e.target.value)} required />
                      </div>
                      <div>
                        <Label htmlFor="new-item-type">Type d'élément</Label>
                        <Select value={newItemType} onValueChange={(value: NavItem['type']) => {
                          setNewItemType(value);
                          if (value === 'category_or_action') {
                            setNewItemIsExternal(false);
                          }
                        }}>
                          <SelectTrigger id="new-item-type">
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                          <SelectContent className="backdrop-blur-lg bg-background/80">
                            {navItemTypes.map(type => (
                              <SelectItem key={type} value={type}>
                                {getItemTypeLabel(type)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="new-item-route">Route (URL interne ou #hash)</Label>
                        <Input id="new-item-route" value={newItemRoute} onChange={(e) => setNewItemRoute(e.target.value)} disabled={newItemType === 'category_or_action' && (newItemRoute === null || newItemRoute === undefined)} />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="new-item-is-external" checked={newItemIsExternal} onCheckedChange={setNewItemIsExternal} disabled={newItemType === 'category_or_action'} />
                        <Label htmlFor="new-item-is-external">Lien externe (ouvre dans un nouvel onglet)</Label>
                      </div>
                      <div>
                        <Label htmlFor="new-item-icon">Nom de l'icône (Lucide React)</Label>
                        <Select value={newItemIconName} onValueChange={setNewItemIconName}>
                          <SelectTrigger id="new-item-icon">
                            <SelectValue placeholder="Sélectionner une icône" />
                          </SelectTrigger>
                          <SelectContent className="backdrop-blur-lg bg-background/80">
                            <ScrollArea className="h-40">
                              {Object.keys(iconMap).sort().map(iconName => {
                                const IconComponent = iconMap[iconName];
                                return (
                                  <SelectItem key={iconName} value={iconName}>
                                    <div className="flex items-center gap-2">
                                      <IconComponent className="h-4 w-4" /> {iconName}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="new-item-description">Description (optionnel)</Label>
                        <Textarea id="new-item-description" value={newItemDescription} onChange={(e) => setNewItemDescription(e.target.value)} />
                      </div>
                    </div>
                    <Button onClick={handleAddGenericNavItem} disabled={isAddingItem} className="mt-4">
                      {isAddingItem ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />} Ajouter l'élément générique
                    </Button>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Tableau de tous les éléments génériques */}
              <h3 className="text-xl font-semibold mt-6 mb-4 flex items-center gap-2">
                <LayoutList className="h-5 w-5 text-primary" /> Liste des éléments génériques
              </h3>
              <ScrollArea className="h-80 w-full rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="sticky top-0 bg-background/80 backdrop-blur-lg border-b">
                      <th className="p-2 text-left font-semibold">Libellé</th>
                      <th className="p-2 text-left font-semibold">Type</th>
                      <th className="p-2 text-left font-semibold">Route/Action</th>
                      <th className="p-2 text-left font-semibold">Icône</th>
                      <th className="p-2 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allGenericNavItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">Aucun élément générique à afficher.</td>
                      </tr>
                    ) : (
                      allGenericNavItems.map(item => {
                        const IconComponent = iconMap[item.icon_name || 'Info'] || Info;
                        return (
                          <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/20">
                            <td className="p-2">{item.label}</td>
                            <td className="p-2">{getItemTypeLabel(item.type)}</td>
                            <td className="p-2">{item.route || '-'}</td>
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" /> {item.icon_name || '-'}
                              </div>
                            </td>
                            <td className="p-2 flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditGenericNavItem(item)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteGenericNavItem(item.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Section 2: Configuration des Menus par Rôle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRoundCog className="h-6 w-6 text-primary" /> Configuration des Menus par Rôle
              </CardTitle>
              <CardDescription>Sélectionnez un rôle pour voir et gérer les éléments de menu qui lui sont associés.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="role-filter">Rôle sélectionné</Label>
                <Select value={selectedRoleFilter} onValueChange={(value: Profile['role'] | 'all') => setSelectedRoleFilter(value)}>
                  <SelectTrigger id="role-filter">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-lg bg-background/80">
                    <SelectItem value="all">Sélectionner un rôle...</SelectItem>
                    {allRoles.map(role => (
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
                <>
                  <h3 className="text-xl font-semibold mt-6 mb-4 flex items-center gap-2">
                    <LayoutList className="h-5 w-5 text-primary" /> Structure de Navigation pour {selectedRoleFilter}
                  </h3>
                  <CardDescription>Réorganisez les éléments par glisser-déposer. Utilisez le menu contextuel (clic droit) pour gérer les sous-éléments.</CardDescription>
                  <div className="flex flex-col gap-4">
                    {/* Dropdown to add existing generic item to this role's menu */}
                    <div>
                      <Label htmlFor="add-existing-to-role">Ajouter un élément générique existant</Label>
                      <Select onValueChange={handleAddExistingGenericItemToRole} value="">
                        <SelectTrigger id="add-existing-to-role">
                          <SelectValue placeholder="Ajouter un élément existant au menu de ce rôle" />
                        </SelectTrigger>
                        <SelectContent className="backdrop-blur-lg bg-background/80">
                          <ScrollArea className="h-40">
                            {allGenericNavItems.filter(item => !allConfiguredItemsFlat.some(configured => configured.id === item.id)).length === 0 ? (
                              <SelectItem value="no-available-items" disabled>Aucun élément générique disponible à ajouter</SelectItem>
                            ) : (
                              allGenericNavItems
                                .filter(item => !allConfiguredItemsFlat.some(configured => configured.id === item.id))
                                .map(item => (
                                  <SelectItem key={item.id} value={item.id}>
                                    <div className="flex items-center gap-2">
                                      {iconMap[item.icon_name || 'Info'] && React.createElement(iconMap[item.icon_name || 'Info'], { className: "h-4 w-4" })}
                                      <span>{item.label} ({getItemTypeLabel(item.type)}) {item.route && `(${item.route})`}</span>
                                    </div>
                                  </SelectItem>
                                ))
                            )}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Configured Items Tree */}
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                      {renderNavItemsList(configuredItemsTree, 0, 'configured-container')}
                      <DragOverlay>
                        {activeDragItem ? (
                          <SortableNavItem
                            item={activeDragItem}
                            level={0}
                            onEditGenericItem={handleEditGenericNavItem}
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
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Edit Generic Nav Item Dialog */}
          {currentItemToEdit && (
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[600px] backdrop-blur-lg bg-background/80">
                <DialogHeader>
                  <DialogTitle>Modifier l'élément de navigation générique</DialogTitle>
                  <DialogDescription>
                    Mettez à jour les détails de l'élément de navigation de base.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-item-label" className="text-right">Libellé</Label>
                    <Input id="edit-item-label" value={editItemLabel} onChange={(e) => setEditItemLabel(e.target.value)} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-item-type">Type d'élément</Label>
                    <Select value={editItemType} onValueChange={(value: NavItem['type']) => {
                      setEditItemType(value);
                      if (value === 'category_or_action') {
                        setEditItemIsExternal(false);
                      }
                    }}>
                      <SelectTrigger id="edit-item-type" className="col-span-3">
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent className="backdrop-blur-lg bg-background/80">
                        {navItemTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {getItemTypeLabel(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-item-route" className="text-right">Route</Label>
                    <Input id="edit-item-route" value={editItemRoute} onChange={(e) => setEditItemRoute(e.target.value)} className="col-span-3" disabled={editItemType === 'category_or_action' && (editItemRoute === null || editItemRoute === undefined)} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-item-is-external" className="text-right">Lien externe</Label>
                    <Switch id="edit-item-is-external" checked={editItemIsExternal} onCheckedChange={setEditItemIsExternal} className="col-span-3" disabled={editItemType === 'category_or_action'} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-item-icon">Icône</Label>
                    <Select value={editItemIconName} onValueChange={setEditItemIconName}>
                      <SelectTrigger id="edit-item-icon" className="col-span-3">
                        <SelectValue placeholder="Sélectionner une icône" />
                      </SelectTrigger>
                      <SelectContent className="backdrop-blur-lg bg-background/80">
                        <ScrollArea className="h-40">
                          {Object.keys(iconMap).sort().map(iconName => {
                            const IconComponent = iconMap[iconName];
                            return (
                              <SelectItem key={iconName} value={iconName}>
                                <div className="flex items-center gap-2">
                                  <IconComponent className="h-4 w-4" /> {iconName}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-item-description" className="text-right">Description</Label>
                    <Textarea id="edit-item-description" value={editItemDescription} onChange={(e) => setEditItemDescription(e.target.value)} className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveEditedGenericNavItem} disabled={isSavingEdit}>
                    {isSavingEdit ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Enregistrer les modifications"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Edit Role Config Dialog */}
          {currentConfigToEdit && currentItemToEdit && (
            <Dialog open={isEditConfigDialogOpen} onOpenChange={setIsEditConfigDialogOpen}>
              <DialogContent className="sm:max-w-[600px] backdrop-blur-lg bg-background/80">
                <DialogHeader>
                  <DialogTitle>Modifier la configuration de "{currentItemToEdit.label}" pour {selectedRoleFilter}</DialogTitle>
                  <DialogDescription>
                    Ajustez la position et le parent de cet élément dans le menu de ce rôle.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-config-parent" className="text-right">Parent</Label>
                    <Popover key={currentConfigToEdit.id} open={openEditConfigParentSelect} onOpenChange={setOpenEditConfigParentSelect}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openEditConfigParentSelect}
                          className="col-span-3 justify-between"
                        >
                          {editConfigParentId
                            ? availableParentsForConfig.find(
                                (item) => item.id === editConfigParentId,
                              )?.label || editConfigParentInput
                            : "Aucun (élément racine)"}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 backdrop-blur-lg bg-background/80">
                        <Command>
                          <CommandInput
                            placeholder="Rechercher ou créer une catégorie..."
                            value={editConfigParentInput}
                            onValueChange={setEditConfigParentInput}
                          />
                          <CommandList>
                            {editConfigParentInput.trim() !== '' && !availableParentsForConfig.some(item => item.label.toLowerCase() === editConfigParentInput.trim().toLowerCase()) && (
                              <CommandItem
                                onSelect={() => {
                                  setEditConfigParentId(editConfigParentInput);
                                  setOpenEditConfigParentSelect(false);
                                }}
                              >
                                <PlusCircle className="mr-2 h-4 w-4" /> <span>Créer la catégorie "{editConfigParentInput}"</span>
                              </CommandItem>
                            )}
                            {availableParentsForConfig.length === 0 && editConfigParentInput.trim() === '' && (
                              <CommandEmpty>
                                <span>Aucune catégorie trouvée.</span>
                              </CommandEmpty>
                            )}
                            <CommandGroup>
                              <CommandItem
                                value="none"
                                onSelect={() => {
                                  setEditConfigParentId(undefined);
                                  setEditConfigParentInput('');
                                  setOpenEditConfigParentSelect(false);
                                }}
                              >
                                <span>Aucun (élément racine)</span>
                              </CommandItem>
                              {availableParentsForConfig.map((item) => {
                                const IconComponentToRender: React.ElementType = (item.icon_name && typeof item.icon_name === 'string' && iconMap[item.icon_name]) ? iconMap[item.icon_name] : Info;
                                return (
                                  <CommandItem
                                    key={item.id}
                                    value={item.label}
                                    onSelect={() => {
                                      setEditConfigParentId(item.id);
                                      setEditConfigParentInput(item.label);
                                      setOpenEditConfigParentSelect(false);
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      {Array(item.level).fill('—').join('') && <span>{Array(item.level).fill('—').join('')}</span>}
                                      <IconComponentToRender className="h-4 w-4" /> <span>{item.label} ({item.typeLabel})</span>
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
            />
          )}
        </div>
      );
    };

    export default AdminMenuManagementPage;