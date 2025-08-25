import React, { useState, useEffect, useCallback } from 'react';
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
    import { PlusCircle, Edit, Trash2, GripVertical, ChevronDown, ChevronUp, Link as LinkIcon, ExternalLink, Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, Globe } from "lucide-react";
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

    // Map icon_name strings to Lucide React components
    const iconMap: { [key: string]: React.ElementType } = {
      Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, LinkIcon, ExternalLink, Globe
    };

    // All possible roles for selection
    const allRoles: Profile['role'][] = ['student', 'professeur', 'tutor', 'administrator', 'director', 'deputy_director'];

    interface SortableNavItemProps {
      item: NavItem;
      configId?: string; // The ID of the RoleNavItemConfig entry if it's a configured item
      level: number;
      onEdit: (item: NavItem, config?: RoleNavItemConfig) => void;
      onDelete: (id: string, configId?: string) => void;
      isDragging?: boolean; // Prop to indicate if this item is currently being dragged
      isDraggableAndDeletable: boolean; // New prop to control drag/delete
    }

    const SortableNavItem = React.forwardRef<HTMLDivElement, SortableNavItemProps>(({ item, configId, level, onEdit, onDelete, isDragging, isDraggableAndDeletable }, ref) => {
      const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
      } = useSortable({ id: configId || item.id, disabled: !isDraggableAndDeletable }); // Disable sortable if not draggable

      const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 'auto',
        opacity: isDragging ? 0.8 : 1,
        paddingLeft: `${level * 20}px`, // Indent based on level
      };

      const IconComponent = iconMap[item.icon_name || 'Info'] || Info;

      return (
        <div ref={setNodeRef} style={style} className={cn("p-3 border rounded-md bg-background flex items-center justify-between gap-2 mb-2", isDragging && "ring-2 ring-primary/50 shadow-xl")}>
          <div className="flex items-center gap-2 flex-grow">
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
            <IconComponent className="h-5 w-5 text-primary" />
            <span className="font-medium">{item.label}</span>
            {item.route && <span className="text-sm text-muted-foreground italic">{item.route}</span>}
            {item.is_external && <ExternalLink className="h-4 w-4 text-muted-foreground ml-1" />}
            {item.is_global && <Globe className="h-4 w-4 text-muted-foreground ml-1" title="Configuration globale" />}
            {item.children?.length && <span className="text-xs text-muted-foreground ml-2">(Catégorie)</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(item, configId ? { id: configId, nav_item_id: item.id, role: selectedRoleFilter as Profile['role'], parent_nav_item_id: item.parent_nav_item_id, order_index: item.order_index || 0, establishment_id: item.establishment_id } : undefined)}>
              <Edit className="h-4 w-4" />
            </Button>
            {isDraggableAndDeletable && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(item.id, configId)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      );
    });

    const AdminMenuManagementPage = () => {
      const { currentUserProfile, currentRole, isLoadingUser } = useRole();
      const [allGenericNavItems, setAllGenericNavItems] = useState<NavItem[]>([]); // All items from nav_items table
      const [unconfiguredItems, setUnconfiguredItems] = useState<NavItem[]>([]); // Generic items not yet configured for selected role
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

      const fetchAndStructureNavItems = useCallback(async () => {
        const genericItems = await loadAllNavItemsRaw();
        setAllGenericNavItems(genericItems);

        if (selectedRoleFilter === 'all') {
          setUnconfiguredItems(genericItems);
          setConfiguredItemsTree([]);
        } else {
          const roleConfigs = await getRoleNavItemConfigsByRole(
            selectedRoleFilter as Profile['role'],
            selectedEstablishmentFilter === 'all' ? undefined : selectedEstablishmentFilter
          );

          const configuredMap = new Map<string, NavItem>();
          const unconfigured: NavItem[] = [];

          const genericItemMap = new Map<string, NavItem>();
          genericItems.forEach(item => genericItemMap.set(item.id, { ...item, children: [] }));

          roleConfigs.forEach(config => {
            const genericItem = genericItemMap.get(config.nav_item_id);
            if (genericItem) {
              const configuredItem: NavItem = {
                ...genericItem,
                children: [],
                is_root: !config.parent_nav_item_id, // Explicitly set based on parent_nav_item_id
                configId: config.id,
                parent_nav_item_id: config.parent_nav_item_id || undefined,
                order_index: config.order_index,
                establishment_id: config.establishment_id || undefined,
                is_global: config.establishment_id === null, // Indicate if it's a global config
              };
              configuredMap.set(configuredItem.id, configuredItem);
            }
          });

          // Rebuild the tree and re-index
          const allConfiguredItemsFlat: NavItem[] = Array.from(configuredMap.values());

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
                  role: selectedRoleFilter as Profile['role'],
                  parent_nav_item_id: parentId,
                  order_index: i,
                  establishment_id: item.establishment_id,
                };
                await updateRoleNavItemConfig(updatedConfig); // Update DB
                item.order_index = i; // Update local item
                item.parent_nav_item_id = parentId; // Update local item
                item.is_root = (parentId === null); // Update local item
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

          // Determine unconfigured items (generic items not in roleConfigs)
          genericItems.forEach(genericItem => {
            // An item is unconfigured if it's not in the configuredMap for the current role/establishment
            // AND it's not a global item (unless selectedEstablishmentFilter is 'all')
            const isConfiguredForCurrentContext = allConfiguredItemsFlat.some(configuredItem => configuredItem.id === genericItem.id && configuredItem.establishment_id === (selectedEstablishmentFilter === 'all' ? null : selectedEstablishmentFilter));
            const isGlobalConfigured = allConfiguredItemsFlat.some(configuredItem => configuredItem.id === genericItem.id && configuredItem.is_global);

            if (!isConfiguredForCurrentContext && !(isGlobalConfigured && selectedEstablishmentFilter !== 'all')) {
              unconfigured.push(genericItem);
            }
          });
          setUnconfiguredItems(unconfigured);
        }
      }, [selectedRoleFilter, selectedEstablishmentFilter]);

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
          const newItemData: Omit<NavItem, 'id' | 'created_at' | 'updated_at' | 'children' | 'badge' | 'configId' | 'establishment_id' | 'parent_nav_item_id' | 'order_index' | 'is_root' | 'is_global'> = {
            label: newItemLabel.trim(),
            route: newItemRoute.trim() || null,
            description: newItemDescription.trim() || null,
            is_external: newItemIsExternal,
            icon_name: newItemIconName || null,
          };
          const addedItem = await addNavItem(newItemData);
          showSuccess("Élément de navigation générique ajouté !");

          // If a specific role is selected, also add a config for it
          if (selectedRoleFilter !== 'all' && addedItem) {
            const newConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'> = {
              nav_item_id: addedItem.id,
              role: selectedRoleFilter as Profile['role'],
              parent_nav_item_id: undefined, // No parent by default for new generic item config
              order_index: 0, // Temporary, will be re-indexed by fetchAndStructureNavItems
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
        setEditItemIsExternal(item.is_external || false);
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
          const updatedItemData: Omit<NavItem, 'created_at' | 'updated_at' | 'children' | 'badge' | 'configId' | 'establishment_id' | 'parent_nav_item_id' | 'order_index' | 'is_root' | 'is_global'> = {
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

      const handleEditRoleConfig = (item: NavItem, config?: RoleNavItemConfig) => {
        if (!config) {
          showError("Configuration de rôle introuvable pour l'édition.");
          return;
        }
        if (config.is_global && selectedEstablishmentFilter !== 'all') {
          showError("Vous ne pouvez pas modifier une configuration globale depuis un établissement spécifique.");
          return;
        }
        setCurrentItemToEdit(item); // Keep generic item context
        setCurrentConfigToEdit(config);
        setEditConfigParentId(config.parent_nav_item_id || undefined);
        setEditConfigOrderIndex(config.order_index);
        setEditConfigEstablishmentId(config.establishment_id || undefined); // Set establishment_id for editing
        setIsEditConfigDialogOpen(true);
      };

      const handleSaveEditedRoleConfig = async () => {
        if (!currentConfigToEdit || !currentItemToEdit || selectedRoleFilter === 'all') return;

        setIsSavingConfigEdit(true);
        try {
          const updatedConfigData: Omit<RoleNavItemConfig, 'created_at' | 'updated_at'> = {
            id: currentConfigToEdit.id,
            nav_item_id: currentConfigToEdit.nav_item_id,
            role: currentConfigToEdit.role,
            parent_nav_item_id: editConfigParentId || null,
            order_index: editConfigOrderIndex,
            establishment_id: editConfigEstablishmentId === 'all' ? null : editConfigEstablishmentId, // Save establishment_id
          };
          await updateRoleNavItemConfig(updatedConfigData);
          showSuccess("Configuration de rôle mise à jour !");
          await fetchAndStructureNavItems(); // Refresh list
          setIsEditConfigDialogOpen(false);
          setCurrentConfigToEdit(null);
          setCurrentItemToEdit(null);
        } catch (error: any) {
          console.error("Error updating role config:", error);
          showError(`Erreur lors de la mise à jour de la configuration de rôle: ${error.message}`);
        } finally {
          setIsSavingConfigEdit(false);
        }
      };

      const handleDragStart = (event: any) => {
        const { active } = event;
        // Determine if dragging a generic item or a configured item
        const genericItem = allGenericNavItems.find(i => i.id === active.id);
        if (genericItem) {
          setActiveDragItem(genericItem);
          setActiveDragConfig(null);
        } else {
          // Find the configured item and its config
          const configuredItem = configuredItemsTree.find(item => item.configId === active.id);
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
          }
        }
      };

      const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!activeDragItem || !over || active.id === over.id) {
          setActiveDragItem(null);
          setActiveDragConfig(null);
          return;
        }

        const activeId = active.id as string; // This is configId if configured, or navItemId if generic
        const overId = over.id as string; // This is configId if configured, or containerId if container

        let successMessage = "Élément de navigation mis à jour !";
        let errorMessage = "Erreur lors de la mise à jour de l'élément.";

        try {
          // Prevent dragging/dropping global items when viewing a specific establishment
          if (activeDragItem.is_global && selectedEstablishmentFilter !== 'all') {
            showError("Vous ne pouvez pas déplacer ou modifier une configuration globale depuis un établissement spécifique.");
            return;
          }

          // Determine the target parent for the active item
          let newParentNavItemId: string | null = null;
          let newOrderIndex: number = 0;
          let targetList: NavItem[] = [];

          // Find the actual item being dropped over (could be a configured item or a container)
          const overConfiguredItem = configuredItemsTree.find(item => item.configId === overId);
          const overUnconfiguredItem = unconfiguredItems.find(item => item.id === overId);

          if (overConfiguredItem) {
            // Dropped onto an existing configured item
            if (!overConfiguredItem.route) { // Dropped onto a category (make it a child)
              newParentNavItemId = overConfiguredItem.id;
              targetList = overConfiguredItem.children || [];
              newOrderIndex = targetList.length; // Add to the end of children
            } else { // Dropped onto a regular item (make it a sibling)
              newParentNavItemId = overConfiguredItem.parent_nav_item_id || null;
              targetList = (newParentNavItemId === null) ? configuredItemsTree.filter(item => item.is_root) : (configuredItemsTree.find(item => item.id === newParentNavItemId)?.children || []);
              newOrderIndex = overConfiguredItem.order_index + 1; // Insert after the over item
            }
          } else if (overId === 'configured-container') { // Dropped into the root of the configured list
            newParentNavItemId = null;
            targetList = configuredItemsTree.filter(item => item.is_root);
            newOrderIndex = targetList.length; // Add to the end of root items
          } else if (overId === 'unconfigured-container') {
            // Dropped into the unconfigured list, handled by deletion below
          } else if (overUnconfiguredItem) { // Dropped onto an unconfigured item (reorder within unconfigured)
            // This case is handled by local state update for unconfiguredItems
          } else {
            showError("Cible de dépôt non valide.");
            return;
          }

          // Perform DB operations based on source and target
          if (!activeDragConfig && activeDragItem) { // From Unconfigured to Configured
            if (selectedRoleFilter === 'all') {
              showError("Veuillez sélectionner un rôle spécifique pour configurer les menus.");
              return;
            }
            const newConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'> = {
              nav_item_id: activeDragItem.id,
              role: selectedRoleFilter as Profile['role'],
              parent_nav_item_id: newParentNavItemId,
              order_index: newOrderIndex,
              establishment_id: selectedEstablishmentFilter === 'all' ? null : selectedEstablishmentFilter,
            };
            await addRoleNavItemConfig(newConfig);
            successMessage = "Élément ajouté à la configuration du rôle !";
          } else if (activeDragConfig && overId === 'unconfigured-container') { // From Configured to Unconfigured
            await deleteRoleNavItemConfig(activeDragConfig.id);
            successMessage = "Élément retiré de la configuration du rôle !";
          } else if (activeDragConfig && activeDragItem) { // Within Configured (reorder or change parent)
            const updatedConfig: Omit<RoleNavItemConfig, 'created_at' | 'updated_at'> = {
              ...activeDragConfig,
              parent_nav_item_id: newParentNavItemId,
              order_index: newOrderIndex, // This will be re-indexed by fetchAndStructureNavItems
              establishment_id: selectedEstablishmentFilter === 'all' ? null : selectedEstablishmentFilter,
            };
            await updateRoleNavItemConfig(updatedConfig);
            successMessage = "Élément de navigation réorganisé/déplacé !";
          } else {
            errorMessage = "Action de glisser-déposer non valide.";
            showError(errorMessage);
            return;
          }

          showSuccess(successMessage);
          await fetchAndStructureNavItems(); // Re-fetch and re-structure all items to update the UI
        } catch (error: any) {
          console.error("Error during drag and drop:", error);
          showError(`Erreur lors du glisser-déposer: ${error.message}`);
        } finally {
          setActiveDragItem(null);
          setActiveDragConfig(null);
        }
      };

      // Helper to find a configured item and its parent in the tree
      const findConfigItemAndParent = (items: NavItem[], targetConfigId: string, role: Profile['role'], parent: NavItem | null = null): { item: NavItem | null, config: RoleNavItemConfig | null, parent: NavItem | null, index: number } => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.configId === targetConfigId) {
            const config = {
              id: item.configId,
              nav_item_id: item.id,
              role: role,
              parent_nav_item_id: item.parent_nav_item_id,
              order_index: item.order_index,
              establishment_id: item.establishment_id,
            };
            return { item, config, parent, index: i };
          }
          if (item.children && item.children.length > 0) {
            const found = findConfigItemAndParent(item.children, targetConfigId, role, item);
            if (found.item) return found;
          }
        }
        return { item: null, config: null, parent: null, index: -1 };
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
                    configId={item.configId}
                    level={level}
                    onEdit={handleEditGenericNavItem} // Edit generic properties
                    onDelete={handleDeleteGenericNavItem} // Delete generic item
                    isDragging={activeDragItem?.id === item.id || activeDragConfig?.id === item.configId}
                    isDraggableAndDeletable={!item.is_global || selectedEstablishmentFilter === 'all'} // Only draggable/deletable if not global OR if 'all' establishments selected
                  />
                  {item.children && item.children.length > 0 && (
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

      // Filter available parents for the edit/add dialogs
      const availableParentsForConfig = configuredItemsTree.filter(item => !item.route); // Only categories (items without a route) can be parents

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
                    {/* Removed is_root switch */}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutList className="h-6 w-6 text-primary" /> Éléments non configurés pour {selectedRoleFilter}
                    {selectedEstablishmentFilter !== 'all' && ` (${establishments.find(e => e.id === selectedEstablishmentFilter)?.name || 'Global'})`}
                  </CardTitle>
                  <CardDescription>Faites glisser les éléments ici pour les ajouter au menu de {selectedRoleFilter}.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    {renderNavItemsList(unconfiguredItems, 0, 'unconfigured-container')}
                    <DragOverlay>
                      {activeDragItem ? (
                        <SortableNavItem
                          item={activeDragItem}
                          level={0}
                          onEdit={handleEditGenericNavItem}
                          onDelete={handleDeleteGenericNavItem}
                          isDragging={true}
                          isDraggableAndDeletable={true} // Always draggable/deletable in unconfigured list
                        />
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutList className="h-6 w-6 text-primary" /> Structure de Navigation pour {selectedRoleFilter}
                    {selectedEstablishmentFilter !== 'all' && ` (${establishments.find(e => e.id === selectedEstablishmentFilter)?.name || 'Global'})`}
                  </CardTitle>
                  <CardDescription>Réorganisez les éléments par glisser-déposer. Faites glisser ici pour les retirer.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    {renderNavItemsList(configuredItemsTree, 0, 'configured-container')}
                    <DragOverlay>
                      {activeDragItem ? (
                        <SortableNavItem
                          item={activeDragItem}
                          configId={activeDragConfig?.id}
                          level={0}
                          onEdit={handleEditGenericNavItem}
                          onDelete={handleDeleteGenericNavItem}
                          isDragging={true}
                          isDraggableAndDeletable={!activeDragItem.is_global || selectedEstablishmentFilter === 'all'}
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
                  {/* Removed is_root switch */}
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
                    <Select value={editConfigParentId || "none"} onValueChange={(value) => setEditConfigParentId(value === "none" ? undefined : value)}>
                      <SelectTrigger id="edit-config-parent" className="col-span-3">
                        <SelectValue placeholder="Sélectionner un parent" />
                      </SelectTrigger>
                      <SelectContent className="backdrop-blur-lg bg-background/80">
                        <SelectItem value="none">Aucun</SelectItem>
                        {availableParentsForConfig.filter(p => p.id !== currentItemToEdit.id).map(item => (
                          <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
        </div>
      );
    };

    export default AdminMenuManagementPage;