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
    import { NavItem, Profile, RoleNavItemConfig, Establishment } from "@/lib/dataModels"; // Import RoleNavItemConfig, Establishment
    import { showSuccess, showError } from "@/utils/toast";
    import { loadAllNavItemsRaw, addNavItem, updateNavItem, deleteNavItem, addRoleNavItemConfig, updateRoleNavItemConfig, deleteRoleNavItemConfig, getRoleNavItemConfigsByRole } from "@/lib/navItems"; // Use new functions
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
    import { loadEstablishments } from '@/lib/courseData'; // Import loadEstablishments
    import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'; // Import ContextMenu
    import ManageChildrenDialog from '@/components/AdminMenu/ManageChildrenDialog'; // Import new dialog
    import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea
    import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"; // Import Command components

    // Map icon_name strings to Lucide React components
    const iconMap: { [key: string]: React.ElementType } = {
      Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, LinkIcon, ExternalLink, Globe
    };

    // All possible roles for selection
    const allRoles: Profile['role'][] = ['student', 'professeur', 'tutor', 'administrator', 'director', 'deputy_director'];

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
        zIndex: isDragging ? 100 : 'auto',
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
        establishment_id: item.establishment_id,
      } : undefined;

      const hasChildren = item.children && item.children.length > 0;

      return (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div ref={setNodeRef} style={style} className={cn("p-3 border rounded-md bg-background flex items-center justify-between gap-2 mb-2", isDragging && "ring-2 ring-primary/50 shadow-xl")}>
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
          {!item.route && (
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
      const [isNewItemFormOpen, setIsNewItemFormOpen] = useState(false);
      const [establishments, setEstablishments] = useState<Establishment[]>([]); // All establishments

      // State for global role filter
      const [selectedRoleFilter, setSelectedRoleFilter] = useState<Profile['role'] | 'all'>('all');
      const [selectedEstablishmentFilter, setSelectedEstablishmentFilter] = useState<string | 'all'>('all'); // New: Filter by establishment

      // States for new generic item form
      const [newItemLabel, setNewItemLabel] = useState('');
      const [newItemRoute, setNewItemRoute] = useState('');
      const [newItemIconName, setNewItemIconName] = useState('');
      const [newItemDescription, setNewItemDescription] = useState('');
      const [newItemIsExternal, setNewItemIsExternal] = useState(false);
      const [isAddingItem, setIsAddingItem] = useState(false);

      // States for edit dialog (for generic nav item properties)
      const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
      const [currentItemToEdit, setCurrentItemToEdit] = useState<NavItem | null>(null);
      const [editItemLabel, setEditItemLabel] = useState('');
      const [editItemRoute, setEditItemRoute] = useState('');
      const [editItemIconName, setEditItemIconName] = useState('');
      const [editItemDescription, setEditItemDescription] = useState('');
      const [editItemIsExternal, setEditItemIsExternal] = useState(false);
      const [isSavingEdit, setIsSavingEdit] = useState(false);

      // States for edit dialog (for role-specific config properties)
      const [isEditConfigDialogOpen, setIsEditConfigDialogOpen] = useState(false);
      const [currentConfigToEdit, setCurrentConfigToEdit] = useState<RoleNavItemConfig | null>(null);
      const [editConfigParentId, setEditConfigParentId] = useState<string | undefined>(undefined);
      const [editConfigOrderIndex, setEditConfigOrderIndex] = useState(0);
      const [editConfigEstablishmentId, setEditConfigEstablishmentId] = useState<string | undefined>(undefined); // New: for editing config
      const [isSavingConfigEdit, setIsSavingConfigEdit] = useState(false);

      // States for managing children dialog
      const [isManageChildrenDialogOpen, setIsManageChildrenDialogOpen] = useState(false);
      const [selectedParentForChildrenManagement, setSelectedParentForChildrenManagement] = useState<NavItem | null>(null);

      // State for adding an item directly to the configured tree
      const [selectedGenericItemToAdd, setSelectedGenericItemToAdd] = useState<string | null>(null);
      const [newConfigParentInput, setNewConfigParentInput] = useState<string>(''); // For Command input
      const [openNewConfigParentSelect, setOpenNewConfigParentSelect] = useState(false);
      const [availableGenericItemsForAdd, setAvailableGenericItemsForAdd] = useState<NavItem[]>([]);

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

      useEffect(() => {
        const fetchEstablishments = async () => {
          setEstablishments(await loadEstablishments());
        };
        fetchEstablishments();
      }, []);

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
          setAvailableGenericItemsForAdd(genericItems); // All generic items are available if no role selected
        } else {
          const role = selectedRoleFilter as Profile['role'];
          const establishmentId = selectedEstablishmentFilter === 'all' ? undefined : selectedEstablishmentFilter;
          const roleConfigs = await getRoleNavItemConfigsByRole(role, establishmentId);

          const configuredMap = new Map<string, NavItem>();
          const allConfiguredItemsFlat: NavItem[] = [];

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
                order_index: config.order_index, // Now mandatory, should always be a number from DB
                establishment_id: config.establishment_id || undefined,
                is_global: config.establishment_id === null, // Indicate if it's a global config
              };
              configuredMap.set(configuredItem.id, configuredItem);
              allConfiguredItemsFlat.push(configuredItem);
            }
          });

          // Rebuild the tree and re-index
          // Group items by parent_nav_item_id
          const groupedByParent = new Map<string | null, NavItem[]>();
          allConfiguredItemsFlat.forEach(item => {
            const parentId = item.parent_nav_item_id || null;
            if (!groupedByParent.has(parentId)) {
              groupedByParent.set(parentId, []);
            }
            groupedByParent.get(parentId)?.push(item);
          });

          // Function to sort and re-index a list of items and update DB
          const sortAndReindex = async (items: NavItem[], parentId: string | null) => {
            items.sort((a, b) => a.order_index - b.order_index); // Sort by current order
            for (let i = 0; i < items.length; i++) {
              const item = items[i];
              if (item.order_index !== i || item.parent_nav_item_id !== parentId) {
                const updatedConfig: Omit<RoleNavItemConfig, 'created_at' | 'updated_at'> = {
                  id: item.configId!,
                  nav_item_id: item.id,
                  role: role,
                  parent_nav_item_id: parentId,
                  order_index: i,
                  establishment_id: item.establishment_id,
                };
                await updateRoleNavItemConfig(updatedConfig); // Update DB
                item.order_index = i; // Update local item
                item.parent_nav_item_id = parentId; // Update local item
              }
            }
          };

          // Process root items
          const rootItemsToProcess = groupedByParent.get(null) || [];
          await sortAndReindex(rootItemsToProcess, null);
          const finalRootItems: NavItem[] = [...rootItemsToProcess];

          // Recursively process children
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


          // Determine available generic items for adding (not yet configured for current context)
          const configuredGenericItemIds = new Set(allConfiguredItemsFlat.map(item => item.id));
          const availableForAdd = genericItems.filter(genericItem => !configuredGenericItemIds.has(genericItem.id));
          setAvailableGenericItemsForAdd(availableForAdd);
          setSelectedGenericItemToAdd(null); // Reset selection
        }
      }, [selectedRoleFilter, selectedEstablishmentFilter, findItemInTree, getDescendantIds]);

      useEffect(() => {
        fetchAndStructureNavItems();
      }, [fetchAndStructureNavItems]);

      const handleAddGenericNavItem = async () => {
        if (!newItemLabel.trim()) {
          showError("Le libellé est requis.");
          return;
        }

        setIsAddingItem(true);
        try {
          const newItemData: Omit<NavItem, 'id' | 'created_at' | 'updated_at' | 'children' | 'badge' | 'configId' | 'establishment_id' | 'parent_nav_item_id' | 'order_index' | 'is_global'> = {
            label: newItemLabel.trim(),
            route: newItemRoute.trim() || null,
            description: newItemDescription.trim() || null,
            is_external: newItemIsExternal,
            icon_name: newItemIconName || null,
          };
          const addedItem = await addNavItem(newItemData);
          showSuccess("Élément de navigation générique ajouté !");

          // If a specific role is selected, also add a config for it as a root item
          if (selectedRoleFilter !== 'all' && addedItem) {
            const newConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'> = {
              nav_item_id: addedItem.id,
              role: selectedRoleFilter as Profile['role'],
              parent_nav_item_id: null, // Add as a root item
              order_index: configuredItemsTree.filter(item => item.parent_nav_item_id === null).length, // Add to end of root items
              establishment_id: selectedEstablishmentFilter === 'all' ? null : selectedEstablishmentFilter, // Use selected establishment
            };
            await addRoleNavItemConfig(newConfig);
            showSuccess("Configuration de rôle ajoutée pour le nouvel élément !");
          }

          await fetchAndStructureNavItems(); // Refresh list
          // Reset form
          setNewItemLabel('');
          setNewItemRoute('');
          setNewItemIconName('');
          setNewItemDescription('');
          setNewItemIsExternal(false);
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
          if (configToDelete?.is_global && selectedEstablishmentFilter !== 'all') {
            showError("Vous ne pouvez pas supprimer une configuration globale depuis un établissement spécifique.");
            return;
          }
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
              await deleteNavItem(navItemId); // This should cascade delete from role_nav_configs
              showSuccess("Élément de navigation générique supprimé !");
              await fetchAndStructureNavItems(); // Refresh list
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
        setIsEditDialogOpen(true);
      };

      const handleSaveEditedGenericNavItem = async () => {
        if (!currentItemToEdit) return;
        if (!editItemLabel.trim()) {
          showError("Le libellé est requis.");
          return;
        }

        setIsSavingEdit(true);
        try {
          const updatedItemData: Omit<NavItem, 'created_at' | 'updated_at' | 'children' | 'badge' | 'configId' | 'establishment_id' | 'parent_nav_item_id' | 'order_index' | 'is_global'> = {
            id: currentItemToEdit.id,
            label: editItemLabel.trim(),
            route: editItemRoute.trim() || null,
            description: editItemDescription.trim() || null,
            is_external: editItemIsExternal,
            icon_name: editItemIconName || null,
          };
          await updateNavItem(updatedItemData);
          showSuccess("Élément de navigation générique mis à jour !");
          await fetchAndStructureNavItems(); // Refresh list
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
        if (config.is_global && selectedEstablishmentFilter !== 'all') {
          showError("Vous ne pouvez pas modifier une configuration globale depuis un établissement spécifique.");
          return;
        }
        setCurrentItemToEdit(item); // Keep generic item context
        setCurrentConfigToEdit(config);
        setNewConfigParentInput(item.parent_nav_item_id ? configuredItemsTree.find(i => i.id === item.parent_nav_item_id)?.label || '' : ''); // Set input for existing parent
        setEditConfigParentId(config.parent_nav_item_id || undefined);
        setEditConfigOrderIndex(config.order_index);
        setEditConfigEstablishmentId(config.establishment_id || undefined); // Set establishment_id for editing
        setIsEditConfigDialogOpen(true);
      };

      const handleSaveEditedRoleConfig = async () => {
        if (!currentConfigToEdit || !currentItemToEdit || selectedRoleFilter === 'all') return;

        let finalParentId: string | null = null;
        if (newConfigParentInput.trim() !== '') {
          // Check if parent category exists
          let parentItem = allGenericNavItems.find(item => item.label.toLowerCase() === newConfigParentInput.trim().toLowerCase() && !item.route);

          if (!parentItem) {
            // Create new generic category if it doesn't exist
            const newCategory: Omit<NavItem, 'id' | 'created_at' | 'updated_at' | 'children' | 'badge' | 'configId' | 'establishment_id' | 'parent_nav_item_id' | 'order_index' | 'is_global'> = {
              label: newConfigParentInput.trim(),
              route: null, // It's a category
              description: `Catégorie générée automatiquement pour '${newConfigParentInput.trim()}'`,
              is_external: false,
              icon_name: 'LayoutList', // Default icon for categories
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

        // Prevent circular dependency: an item cannot be its own parent or a descendant of itself
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
            establishment_id: editConfigEstablishmentId === 'all' ? null : editConfigEstablishmentId, // Save establishment_id
          };
          console.log("[AdminMenuManagementPage] Saving updated config:", updatedConfigData);
          await updateRoleNavItemConfig(updatedConfigData);
          showSuccess("Configuration de rôle mise à jour !");
          await fetchAndStructureNavItems(); // Refresh list
          setIsEditConfigDialogOpen(false);
          setCurrentConfigToEdit(null);
          setCurrentItemToEdit(null);
          setNewConfigParentInput('');
        } catch (error: any) {
          console.error("Error updating role config:", error);
          showError(`Erreur lors de la mise à jour de la configuration de rôle: ${error.message}`);
        } finally {
          setIsSavingConfigEdit(false);
        }
      };

      const handleDragStart = (event: any) => {
        const { active } = event;
        // Only allow dragging of configured items within the configured tree
        const configuredItem = findItemInTree(configuredItemsTree, active.id);
        if (configuredItem && configuredItem.configId) {
          const config = {
            id: configuredItem.configId,
            nav_item_id: configuredItem.id,
            role: selectedRoleFilter as Profile['role'],
            parent_nav_item_id: configuredItem.parent_nav_item_id,
            order_index: configuredItem.order_index,
            establishment_id: configuredItem.establishment_id,
          };
          setActiveDragItem(configuredItem);
          setActiveDragConfig(config);
        } else {
          // If it's not a configured item, don't allow dragging in this context
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
          // Prevent dragging/dropping global items when viewing a specific establishment
          if (activeDragItem.is_global && selectedEstablishmentFilter !== 'all') {
            showError("Vous ne pouvez pas déplacer ou modifier une configuration globale depuis un établissement spécifique.");
            return;
          }

          let newParentNavItemId: string | null = null;
          let newOrderIndex: number = 0;

          const overConfiguredItem = findItemInTree(configuredItemsTree, overId);
          const overIsConfiguredRootContainer = overId === 'configured-container';
          const overIsConfiguredChildContainer = overId.startsWith('configured-container-children-of-');

          if (selectedRoleFilter === 'all') {
            showError("Veuillez sélectionner un rôle spécifique pour configurer les menus.");
            return;
          }

          console.log("[handleDragEnd] Active item:", activeDragItem);
          console.log("[handleDragEnd] Over ID:", overId);
          console.log("[handleDragEnd] Over configured item:", overConfiguredItem);

          if (overConfiguredItem) {
            // Prevent circular dependency: an item cannot be its own parent or a descendant of itself
            if (activeDragItem.id === overConfiguredItem.id) {
              showError("Un élément ne peut pas être déplacé sur lui-même.");
              return;
            }
            const descendantsOfActiveItem = getDescendantIds(activeDragItem, configuredItemsTree);
            if (descendantsOfActiveItem.has(overConfiguredItem.id)) {
              showError("Un élément ne peut pas être le parent d'un de ses propres descendants.");
              return;
            }

            // Logic to determine if dropping ONTO an item (to make it a child) or BETWEEN items (to make it a sibling)
            // If dropping onto an item, it becomes a child of that item.
            // If dropping between items, it becomes a sibling.
            // For simplicity, let's assume dropping onto an item makes it a child.
            // For dropping between items, we need to find the correct sibling position.

            // Check if the drop target is a valid parent (i.e., a category, an item without a route)
            if (!overConfiguredItem.route) { // If the over item is a category (no route)
                newParentNavItemId = overConfiguredItem.id;
                newOrderIndex = overConfiguredItem.children?.length || 0; // Add to the end of its children
                console.log("[handleDragEnd] Dropped ONTO category. New parent:", newParentNavItemId, "New order:", newOrderIndex);
            } else { // If the over item is a leaf node (has a route) or a root item with a route
                // If dropping onto a leaf node, it should become a sibling of that leaf node.
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
            // Dropped into the root container (no specific parent)
            newParentNavItemId = null;
            newOrderIndex = configuredItemsTree.filter((item) => item.parent_nav_item_id === null)
              .length;
            console.log("[handleDragEnd] Dropped into root container. New parent:", newParentNavItemId, "New order:", newOrderIndex);
          } else if (overIsConfiguredChildContainer) {
            // Dropped into a specific child container (e.g., children of a category)
            newParentNavItemId = overId.replace(
              'configured-container-children-of-',
              ''
            );
            const parentItem = findItemInTree(
              configuredItemsTree,
              newParentNavItemId
            );

            // Prevent circular dependency when dropping into a child container
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

          // Update the existing configured item
          const updatedConfig: Omit<RoleNavItemConfig, 'created_at' | 'updated_at'> = {
            ...activeDragConfig,
            parent_nav_item_id: newParentNavItemId,
            order_index: newOrderIndex, // This will be re-indexed by fetchAndStructureNavItems
            establishment_id: selectedEstablishmentFilter === 'all' ? null : selectedEstablishmentFilter,
          };
          console.log("[handleDragEnd] Updating config with:", updatedConfig);
          await updateRoleNavItemConfig(updatedConfig);
          showSuccess("Élément de navigation réorganisé/déplacé !");

          await fetchAndStructureNavItems(); // Re-fetch and re-structure all items to update the UI
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

      const handleAddSelectedGenericItemToMenu = async () => {
        if (!selectedGenericItemToAdd || selectedRoleFilter === 'all') {
          showError("Veuillez sélectionner un élément générique et un rôle.");
          return;
        }

        const genericItem = allGenericNavItems.find(item => item.id === selectedGenericItemToAdd);
        if (!genericItem) {
          showError("Élément générique introuvable.");
          return;
        }

        let finalParentId: string | null = null;
        if (newConfigParentInput.trim() !== '') {
          // Check if parent category exists
          let parentItem = allGenericNavItems.find(item => item.label.toLowerCase() === newConfigParentInput.trim().toLowerCase() && !item.route);

          if (!parentItem) {
            // Create new generic category if it doesn't exist
            const newCategory: Omit<NavItem, 'id' | 'created_at' | 'updated_at' | 'children' | 'badge' | 'configId' | 'establishment_id' | 'parent_nav_item_id' | 'order_index' | 'is_global'> = {
              label: newConfigParentInput.trim(),
              route: null, // It's a category
              description: `Catégorie générée automatiquement pour '${newConfigParentInput.trim()}'`,
              is_external: false,
              icon_name: 'LayoutList', // Default icon for categories
            };
            parentItem = await addNavItem(newCategory);
            if (!parentItem) {
              showError("Échec de la création de la nouvelle catégorie parente.");
              return;
            }
            showSuccess(`Catégorie '${parentItem.label}' créée automatiquement !`);
          }
          finalParentId = parentItem.id;
        }

        // Determine the order index for the new config
        let orderIndex: number = 0;
        if (finalParentId) {
          const parentInTree = findItemInTree(configuredItemsTree, finalParentId);
          orderIndex = parentInTree?.children?.length || 0;
        } else {
          orderIndex = configuredItemsTree.filter(item => item.parent_nav_item_id === null).length;
        }

        try {
          const newConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'> = {
            nav_item_id: genericItem.id,
            role: selectedRoleFilter as Profile['role'],
            parent_nav_item_id: finalParentId,
            order_index: orderIndex,
            establishment_id: selectedEstablishmentFilter === 'all' ? null : selectedEstablishmentFilter,
          };
          await addRoleNavItemConfig(newConfig);
          showSuccess(`'${genericItem.label}' ajouté au menu !`);
          await fetchAndStructureNavItems(); // Refresh lists
          setSelectedGenericItemToAdd(null); // Reset selection
          setNewConfigParentInput(''); // Reset parent input
          setOpenNewConfigParentSelect(false);
        } catch (error: any) {
          console.error("Error adding generic item to menu:", error);
          showError(`Erreur lors de l'ajout au menu: ${error.message}`);
        }
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
            {items.length === 0 && <p className="text-muted-foreground text-center text-sm py-2">Déposez des éléments ici</p>}
            <SortableContext items={items.map(item => item.configId || item.id)} strategy={verticalListSortingStrategy}>
              {items.map(item => (
                <React.Fragment key={item.id}>
                  <SortableNavItem
                    item={item}
                    level={level}
                    onEditGenericItem={handleEditGenericNavItem}
                    onEditRoleConfig={handleEditRoleConfig} // This will open the role config edit dialog
                    onDelete={handleDeleteGenericNavItem}
                    onManageChildren={handleManageChildren} // Pass the new handler
                    isDragging={activeDragItem?.id === item.id || activeDragConfig?.id === item.configId}
                    isDraggableAndDeletable={!item.is_global || selectedEstablishmentFilter === 'all'}
                    selectedRoleFilter={selectedRoleFilter} // Pass selectedRoleFilter
                    isExpanded={!!expandedItems[item.id]} // Pass expansion state
                    onToggleExpand={toggleExpand} // Pass toggle function
                  />
                  {item.children && item.children.length > 0 && expandedItems[item.id] && (
                    <div className="ml-4">
                      {/* Recursive call for children, passing a unique containerId for them */}
                      {renderNavItemsList(item.children, level + 1, `${containerId}-children-of-${item.id}`)}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </SortableContext>
          </div>
        );
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

      // Helper to flatten the tree for parent selection, excluding self and descendants
      const getFlattenedCategoriesForParentSelection = useCallback((items: NavItem[], excludeId?: string, currentLevel = 0, prefix = ''): { id: string; label: string; level: number; icon_name?: string }[] => {
        let flattened: { id: string; label: string; level: number; icon_name?: string }[] = [];
        items.forEach(item => {
          // Only items without a route (categories) can be parents
          if (!item.route && item.id !== excludeId) {
            const newLabel = prefix ? `${prefix} > ${item.label}` : item.label;
            flattened.push({ id: item.id, label: newLabel, level: currentLevel, icon_name: item.icon_name }); // Include icon_name
            // Recursively add children of this category
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
          parent.id !== currentItemToEdit.id && // Cannot be its own parent
          !descendantsOfCurrentItem.has(parent.id) // Cannot be a descendant of itself
        );
        console.log("[availableParentsForConfig] Filtered parents:", filteredParents);
        return filteredParents;
      }, [currentItemToEdit, configuredItemsTree, getFlattenedCategoriesForParentSelection, getDescendantIds]);

      const availableParentsForNewConfig = useMemo(() => {
        // When adding a new item, any existing category can be a parent
        return getFlattenedCategoriesForParentSelection(configuredItemsTree);
      }, [configuredItemsTree, getFlattenedCategoriesForParentSelection]);


      return (
        <div className="space-y-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
            Gestion des Menus de Navigation
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Créez, modifiez, supprimez et réorganisez les éléments de navigation de l'application.
          </p>

          {/* Global Role Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRoundCog className="h-6 w-6 text-primary" /> Configurer les menus par rôle
              </CardTitle>
              <CardDescription>Sélectionnez un rôle et un établissement pour voir et gérer les éléments de menu qui lui sont associés.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role-filter">Rôle sélectionné</Label>
                <Select value={selectedRoleFilter} onValueChange={(value: Profile['role'] | 'all') => setSelectedRoleFilter(value)}>
                  <SelectTrigger id="role-filter">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-lg bg-background/80">
                    <SelectItem value="all">Tous les rôles (éléments génériques)</SelectItem>
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
              <div>
                <Label htmlFor="establishment-filter">Établissement</Label>
                <Select value={selectedEstablishmentFilter} onValueChange={(value: string | 'all') => setSelectedEstablishmentFilter(value)} disabled={selectedRoleFilter === 'all'}>
                  <SelectTrigger id="establishment-filter">
                    <SelectValue placeholder="Tous les établissements (Global)" />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-lg bg-background/80">
                    <SelectItem value="all">Tous les établissements (Global)</SelectItem>
                    {establishments.map(est => (
                      <SelectItem key={est.id} value={est.id}>
                        {est.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Section: Ajouter un nouvel élément de navigation (toujours visible pour ajouter des éléments génériques) */}
          <Collapsible open={isNewItemFormOpen} onOpenChange={setIsNewItemFormOpen}>
            <Card>
              <CardHeader>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0">
                    <CardTitle className="flex items-center gap-2">
                      <PlusCircle className="h-6 w-6 text-primary" /> Ajouter un élément de navigation générique
                    </CardTitle>
                    {isNewItemFormOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </Button>
                </CollapsibleTrigger>
                <CardDescription>Ajoutez un nouveau lien ou une catégorie disponible pour tous les rôles.</CardDescription>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="new-item-label">Libellé</Label>
                      <Input id="new-item-label" value={newItemLabel} onChange={(e) => setNewItemLabel(e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="new-item-route">Route (URL interne ou #hash, laisser vide pour catégorie/déclencheur)</Label>
                      <Input id="new-item-route" value={newItemRoute} onChange={(e) => setNewItemRoute(e.target.value)} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="new-item-is-external" checked={newItemIsExternal} onCheckedChange={setNewItemIsExternal} />
                      <Label htmlFor="new-item-is-external">Lien externe (ouvre dans un nouvel onglet)</Label>
                    </div>
                    <div>
                      <Label htmlFor="new-item-icon">Nom de l'icône (Lucide React)</Label>
                      <Select value={newItemIconName} onValueChange={setNewItemIconName}>
                        <SelectTrigger id="new-item-icon">
                          <SelectValue placeholder="Sélectionner une icône" />
                        </SelectTrigger>
                        <SelectContent className="backdrop-blur-lg bg-background/80">
                          <ScrollArea className="h-40"> {/* Added ScrollArea */}
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
                  <Button onClick={handleAddGenericNavItem} disabled={isAddingItem}>
                    {isAddingItem ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />} Ajouter l'élément générique
                  </Button>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {selectedRoleFilter !== 'all' && (
            <div className="grid grid-cols-1 gap-8">
              {/* New section for adding available generic items to the menu */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlusCircle className="h-6 w-6 text-primary" /> Ajouter un élément disponible au menu
                  </CardTitle>
                  <CardDescription>Sélectionnez un élément générique et ajoutez-le au menu de {selectedRoleFilter} en tant qu'élément racine ou enfant. Vous pouvez taper un nouveau nom de catégorie pour la créer dynamiquement.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="add-generic-item-select">Élément générique</Label>
                    <Select value={selectedGenericItemToAdd || ""} onValueChange={setSelectedGenericItemToAdd}>
                      <SelectTrigger id="add-generic-item-select">
                        <SelectValue placeholder="Sélectionner un élément à ajouter" />
                      </SelectTrigger>
                      <SelectContent className="backdrop-blur-lg bg-background/80">
                        <ScrollArea className="h-40"> {/* Added ScrollArea */}
                          {availableGenericItemsForAdd.length === 0 ? (
                            <SelectItem value="no-items" disabled>Aucun élément disponible</SelectItem>
                          ) : (
                            availableGenericItemsForAdd.map(item => (
                              <SelectItem key={item.id} value={item.id}>
                                <div className="flex items-center gap-2">
                                  {iconMap[item.icon_name || 'Info'] && React.createElement(iconMap[item.icon_name || 'Info'], { className: "h-4 w-4" })}
                                  {item.label} {item.route && `(${item.route})`}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="add-parent-for-new-config">Parent (laisser vide pour élément racine)</Label>
                    <Popover open={openNewConfigParentSelect} onOpenChange={setOpenNewConfigParentSelect}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openNewConfigParentSelect}
                          className="w-full justify-between"
                        >
                          {newConfigParentInput
                            ? availableParentsForNewConfig.find(
                                (item) => item.id === newConfigParentInput,
                              )?.label || newConfigParentInput
                            : "Aucun (élément racine)"}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 backdrop-blur-lg bg-background/80">
                        <Command>
                          <CommandInput
                            placeholder="Rechercher ou créer une catégorie..."
                            value={newConfigParentInput}
                            onValueChange={setNewConfigParentInput}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {newConfigParentInput.trim() !== '' ? (
                                <CommandItem
                                  onSelect={() => {
                                    setSelectedParentForNewConfig(newConfigParentInput);
                                    setOpenNewConfigParentSelect(false);
                                  }}
                                >
                                  <PlusCircle className="mr-2 h-4 w-4" /> Créer la catégorie "{newConfigParentInput}"
                                </CommandItem>
                              ) : (
                                "Aucune catégorie trouvée."
                              )}
                            </CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="none"
                                onSelect={() => {
                                  setSelectedParentForNewConfig(null);
                                  setNewConfigParentInput('');
                                  setOpenNewConfigParentSelect(false);
                                }}
                              >
                                Aucun (élément racine)
                              </CommandItem>
                              {availableParentsForNewConfig.map((item) => {
                                const IconComponentToRender: React.ElementType = (item.icon_name && typeof item.icon_name === 'string' && iconMap[item.icon_name]) ? iconMap[item.icon_name] : Info;
                                return (
                                  <CommandItem
                                    key={item.id}
                                    value={item.label} // Use label for search matching
                                    onSelect={() => {
                                      setSelectedParentForNewConfig(item.id);
                                      setNewConfigParentInput(item.label);
                                      setOpenNewConfigParentSelect(false);
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      {Array(item.level).fill('—').join('')}
                                      <IconComponentToRender className="h-4 w-4" /> {item.label}
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
                  <Button onClick={handleAddSelectedGenericItemToMenu} disabled={!selectedGenericItemToAdd}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Ajouter au menu
                  </Button>
                </CardContent>
              </Card>

              {/* Configured Items Tree (now full width) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutList className="h-6 w-6 text-primary" /> Structure de Navigation pour {selectedRoleFilter}
                    {selectedEstablishmentFilter !== 'all' && ` (${establishments.find(e => e.id === selectedEstablishmentFilter)?.name || 'Global'})`}
                  </CardTitle>
                  <CardDescription>Réorganisez les éléments par glisser-déposer. Utilisez le menu contextuel (clic droit) pour gérer les sous-éléments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
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
                          isDraggableAndDeletable={!activeDragItem.is_global || selectedEstablishmentFilter === 'all'}
                          selectedRoleFilter={selectedRoleFilter}
                          isExpanded={false} // Drag overlay is never expanded
                          onToggleExpand={() => {}} // No-op for drag overlay
                        />
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </CardContent>
              </Card>
            </div>
          )}

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
                    <Label htmlFor="edit-item-route" className="text-right">Route</Label>
                    <Input id="edit-item-route" value={editItemRoute} onChange={(e) => setEditItemRoute(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-item-is-external" className="text-right">Lien externe</Label>
                    <Switch id="edit-item-is-external" checked={editItemIsExternal} onCheckedChange={setEditItemIsExternal} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-item-icon">Icône</Label>
                    <Select value={editItemIconName} onValueChange={setEditItemIconName}>
                      <SelectTrigger id="edit-item-icon" className="col-span-3">
                        <SelectValue placeholder="Sélectionner une icône" />
                      </SelectTrigger>
                      <SelectContent className="backdrop-blur-lg bg-background/80">
                        <ScrollArea className="h-40"> {/* Added ScrollArea */}
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
                    <Popover open={openNewConfigParentSelect} onOpenChange={setOpenNewConfigParentSelect}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openNewConfigParentSelect}
                          className="col-span-3 justify-between"
                        >
                          {newConfigParentInput
                            ? availableParentsForConfig.find(
                                (item) => item.id === newConfigParentInput,
                              )?.label || newConfigParentInput
                            : "Aucun (élément racine)"}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 backdrop-blur-lg bg-background/80">
                        <Command>
                          <CommandInput
                            placeholder="Rechercher ou créer une catégorie..."
                            value={newConfigParentInput}
                            onValueChange={setNewConfigParentInput}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {newConfigParentInput.trim() !== '' ? (
                                <CommandItem
                                  onSelect={() => {
                                    setEditConfigParentId(newConfigParentInput); // Use input as ID for new category
                                    setOpenNewConfigParentSelect(false);
                                  }}
                                >
                                  <PlusCircle className="mr-2 h-4 w-4" /> Créer la catégorie "{newConfigParentInput}"
                                </CommandItem>
                              ) : (
                                "Aucune catégorie trouvée."
                              )}
                            </CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="none"
                                onSelect={() => {
                                  setEditConfigParentId(undefined);
                                  setNewConfigParentInput('');
                                  setOpenNewConfigParentSelect(false);
                                }}
                              >
                                Aucun (élément racine)
                              </CommandItem>
                              {availableParentsForConfig.map((item) => {
                                const IconComponentToRender: React.ElementType = (item.icon_name && typeof item.icon_name === 'string' && iconMap[item.icon_name]) ? iconMap[item.icon_name] : Info;
                                return (
                                  <CommandItem
                                    key={item.id}
                                    value={item.label}
                                    onSelect={() => {
                                      setEditConfigParentId(item.id);
                                      setNewConfigParentInput(item.label);
                                      setOpenNewConfigParentSelect(false);
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      {Array(item.level).fill('—').join('')}
                                      <IconComponentToRender className="h-4 w-4" /> {item.label}
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
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-config-establishment" className="text-right">Établissement</Label>
                    <Select value={editConfigEstablishmentId || "all"} onValueChange={(value) => setEditConfigEstablishmentId(value === "all" ? undefined : value)} disabled={currentConfigToEdit.is_global}>
                      <SelectTrigger id="edit-config-establishment" className="col-span-3">
                        <SelectValue placeholder="Tous les établissements (Global)" />
                      </SelectTrigger>
                      <SelectContent className="backdrop-blur-lg bg-background/80">
                        <SelectItem value="all">Tous les établissements (Global)</SelectItem>
                        {establishments.map(est => (
                          <SelectItem key={est.id} value={est.id}>
                            {est.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
              selectedEstablishmentFilter={selectedEstablishmentFilter === 'all' ? undefined : selectedEstablishmentFilter}
              allGenericNavItems={allGenericNavItems}
              onChildrenUpdated={fetchAndStructureNavItems} // Callback to refresh the main tree
            />
          )}
        </div>
      );
    };

    export default AdminMenuManagementPage;