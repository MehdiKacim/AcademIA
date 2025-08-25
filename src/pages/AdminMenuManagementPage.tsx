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
    import { PlusCircle, Edit, Trash2, GripVertical, ChevronDown, ChevronUp, Link as LinkIcon, ExternalLink, Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck } from "lucide-react";
    import { NavItem, Profile, RoleNavItemConfig } from "@/lib/dataModels"; // Import RoleNavItemConfig
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

    // Map icon_name strings to Lucide React components
    const iconMap: { [key: string]: React.ElementType } = {
      Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, LinkIcon, ExternalLink
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
    }

    const SortableNavItem = React.forwardRef<HTMLDivElement, SortableNavItemProps>(({ item, configId, level, onEdit, onDelete, isDragging }, ref) => {
      const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
      } = useSortable({ id: configId || item.id }); // Use configId for sortable if available

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
            <IconComponent className="h-5 w-5 text-primary" />
            <span className="font-medium">{item.label}</span>
            {item.route && <span className="text-sm text-muted-foreground italic">{item.route}</span>}
            {item.is_external && <ExternalLink className="h-4 w-4 text-muted-foreground ml-1" />}
            {item.is_root && !item.children?.length && <span className="text-xs text-muted-foreground ml-2">(Élément générique)</span>}
            {!item.is_root && item.children?.length && <span className="text-xs text-muted-foreground ml-2">(Catégorie)</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(item, configId ? { id: configId, nav_item_id: item.id, role: selectedRoleFilter as Profile['role'], parent_nav_item_id: item.parent_id, order_index: item.order_index } : undefined)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(item.id, configId)}>
              <Trash2 className="h-4 w-4" />
            </Button>
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

      // State for global role filter
      const [selectedRoleFilter, setSelectedRoleFilter] = useState<Profile['role'] | 'all'>('all');

      // States for new generic item form
      const [newItemLabel, setNewItemLabel] = useState('');
      const [newItemRoute, setNewItemRoute] = useState('');
      const [newItemIsRoot, setNewItemIsRoot] = useState(false);
      const [newItemIconName, setNewItemIconName] = useState('');
      const [newItemDescription, setNewItemDescription] = useState('');
      const [newItemIsExternal, setNewItemIsExternal] = useState(false);
      const [isAddingItem, setIsAddingItem] = useState(false);

      // States for edit dialog (for generic nav item properties)
      const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
      const [currentItemToEdit, setCurrentItemToEdit] = useState<NavItem | null>(null);
      const [editItemLabel, setEditItemLabel] = useState('');
      const [editItemRoute, setEditItemRoute] = useState('');
      const [editItemIsRoot, setEditItemIsRoot] = useState(false);
      const [editItemIconName, setEditItemIconName] = useState('');
      const [editItemDescription, setEditItemDescription] = useState('');
      const [editItemIsExternal, setEditItemIsExternal] = useState(false);
      const [isSavingEdit, setIsSavingEdit] = useState(false);

      // States for edit dialog (for role-specific config properties)
      const [isEditConfigDialogOpen, setIsEditConfigDialogOpen] = useState(false);
      const [currentConfigToEdit, setCurrentConfigToEdit] = useState<RoleNavItemConfig | null>(null);
      const [editConfigParentId, setEditConfigParentId] = useState<string | undefined>(undefined);
      const [editConfigOrderIndex, setEditConfigOrderIndex] = useState(0);
      const [isSavingConfigEdit, setIsSavingConfigEdit] = useState(false);


      const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
          coordinateGetter: sortableKeyboardCoordinates,
        })
      );

      const [activeDragItem, setActiveDragItem] = useState<NavItem | null>(null);
      const [activeDragConfig, setActiveDragConfig] = useState<RoleNavItemConfig | null>(null);


      const fetchAndStructureNavItems = useCallback(async () => {
        const genericItems = await loadAllNavItemsRaw();
        setAllGenericNavItems(genericItems);

        if (selectedRoleFilter === 'all') {
          // When 'all' is selected, show all generic items as unconfigured
          setUnconfiguredItems(genericItems);
          setConfiguredItemsTree([]);
        } else {
          const roleConfigs = await getRoleNavItemConfigsByRole(selectedRoleFilter as Profile['role']);

          const configuredMap = new Map<string, NavItem>();
          const unconfigured: NavItem[] = [];

          // First, create a map of all generic items
          const genericItemMap = new Map<string, NavItem>();
          genericItems.forEach(item => genericItemMap.set(item.id, { ...item, children: [] }));

          // Populate configured items based on role configs
          roleConfigs.forEach(config => {
            const genericItem = genericItemMap.get(config.nav_item_id);
            if (genericItem) {
              const configuredItem: NavItem = {
                ...genericItem,
                children: [],
                // Store config ID on the item for easier access in DND/edit
                configId: config.id,
                parent_nav_item_id: config.parent_nav_item_id, // Store parent_nav_item_id from config
                order_index: config.order_index, // Store order_index from config
              };
              configuredMap.set(configuredItem.id, configuredItem);
            }
          });

          // Build the configured tree
          const rootConfiguredItems: NavItem[] = [];
          const childrenOfConfigured: { [key: string]: NavItem[] } = {};

          configuredMap.forEach(item => {
            if (item.parent_nav_item_id && configuredMap.has(item.parent_nav_item_id)) {
              if (!childrenOfConfigured[item.parent_nav_item_id]) {
                childrenOfConfigured[item.parent_nav_item_id] = [];
              }
              childrenOfConfigured[item.parent_nav_item_id].push(item);
            } else {
              rootConfiguredItems.push(item);
            }
          });

          // Attach children and sort
          const attachConfiguredChildren = (items: NavItem[]) => {
            items.forEach(item => {
              if (childrenOfConfigured[item.id]) {
                item.children = childrenOfConfigured[item.id].sort((a, b) => a.order_index - b.order_index);
                attachConfiguredChildren(item.children);
              }
            });
          };
          attachConfiguredChildren(rootConfiguredItems);
          rootConfiguredItems.sort((a, b) => a.order_index - b.order_index);

          setConfiguredItemsTree(rootConfiguredItems);

          // Determine unconfigured items (generic items not in roleConfigs)
          genericItems.forEach(genericItem => {
            if (!configuredMap.has(genericItem.id)) {
              unconfigured.push(genericItem);
            }
          });
          setUnconfiguredItems(unconfigured);
        }
      }, [selectedRoleFilter]);

      useEffect(() => {
        fetchAndStructureNavItems();
      }, [fetchAndStructureNavItems]);

      const handleAddGenericNavItem = async () => {
        if (!newItemLabel.trim()) {
          showError("Le libellé est requis.");
          return;
        }
        if (newItemIsRoot && newItemParentId) { // ParentId is not relevant for generic items anymore
          showError("Un élément racine ne peut pas avoir de parent.");
          return;
        }

        setIsAddingItem(true);
        try {
          const newItemData: Omit<NavItem, 'id' | 'created_at' | 'updated_at' | 'children' | 'badge'> = {
            label: newItemLabel.trim(),
            route: newItemRoute.trim() || null,
            is_root: newItemIsRoot,
            description: newItemDescription.trim() || null,
            is_external: newItemIsExternal,
            icon_name: newItemIconName || null,
          };
          await addNavItem(newItemData);
          showSuccess("Élément de navigation générique ajouté !");
          await fetchAndStructureNavItems(); // Refresh list
          // Reset form
          setNewItemLabel('');
          setNewItemRoute('');
          setNewItemIsRoot(false);
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

      const handleDeleteGenericNavItem = async (navItemId: string) => {
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
      };

      const handleEditGenericNavItem = (item: NavItem) => {
        setCurrentItemToEdit(item);
        setEditItemLabel(item.label);
        setEditItemRoute(item.route || '');
        setEditItemIsRoot(item.is_root);
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
          const updatedItemData: Omit<NavItem, 'created_at' | 'updated_at' | 'children' | 'badge'> = {
            id: currentItemToEdit.id,
            label: editItemLabel.trim(),
            route: editItemRoute.trim() || null,
            is_root: editItemIsRoot,
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
        setCurrentItemToEdit(item); // Keep generic item context
        setCurrentConfigToEdit(config);
        setEditConfigParentId(config.parent_nav_item_id || undefined);
        setEditConfigOrderIndex(config.order_index);
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
          // Case 1: Dragging from Unconfigured to Configured list
          if (unconfiguredItems.some(item => item.id === activeId) && (overId === 'configured-container' || configuredItemsTree.some(item => item.configId === overId || item.children?.some(c => c.configId === overId)))) {
            if (selectedRoleFilter === 'all') {
              showError("Veuillez sélectionner un rôle spécifique pour configurer les menus.");
              return;
            }
            // Create a new role_nav_config entry
            const newOrderIndex = configuredItemsTree.length; // Default to end of root items
            let parentNavItemId: string | null = null;

            if (overId !== 'configured-container') {
              // Dropped onto an existing configured item, make it a sibling
              const overConfiguredItem = configuredItemsTree.find(item => item.configId === overId || item.children?.some(c => c.configId === overId));
              if (overConfiguredItem) {
                parentNavItemId = overConfiguredItem.parent_nav_item_id || null;
                // Find the correct order index relative to siblings
                const siblings = configuredItemsTree.filter(item => item.parent_nav_item_id === parentNavItemId);
                newOrderIndex = siblings.findIndex(item => item.configId === overId) + 1;
                if (newOrderIndex === 0) newOrderIndex = siblings.length; // If dropped before first, put at end
              }
            }

            const newConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'> = {
              nav_item_id: activeDragItem.id,
              role: selectedRoleFilter as Profile['role'],
              parent_nav_item_id: parentNavItemId,
              order_index: newOrderIndex,
            };
            await addRoleNavItemConfig(newConfig);
            successMessage = "Élément ajouté à la configuration du rôle !";
          }
          // Case 2: Dragging from Configured to Unconfigured list
          else if (activeDragConfig && overId === 'unconfigured-container') {
            // Delete the role_nav_config entry
            await deleteRoleNavItemConfig(activeDragConfig.id);
            successMessage = "Élément retiré de la configuration du rôle !";
          }
          // Case 3: Reordering within the Configured list
          else if (activeDragConfig && (overId === 'configured-container' || configuredItemsTree.some(item => item.configId === overId || item.children?.some(c => c.configId === overId)))) {
            const { item: activeFound, config: activeConfigFound, parent: activeParent, index: activeIndex } = findConfigItemAndParent(configuredItemsTree, activeId, selectedRoleFilter as Profile['role']);
            const { item: overFound, config: overConfigFound, parent: overParent, index: overIndex } = findConfigItemAndParent(configuredItemsTree, overId, selectedRoleFilter as Profile['role']);

            if (activeFound && activeConfigFound && overFound && overConfigFound) {
              let sourceList = activeParent ? activeParent.children : configuredItemsTree;
              let destinationList = overParent ? overParent.children : configuredItemsTree;

              if (sourceList === destinationList) { // Moving within the same parent/level
                const newOrder = arrayMove(sourceList, activeIndex, overIndex);
                // Update order_index for all affected items
                for (let i = 0; i < newOrder.length; i++) {
                  const item = newOrder[i];
                  const config = {
                    id: item.configId!,
                    nav_item_id: item.id,
                    role: selectedRoleFilter as Profile['role'],
                    parent_nav_item_id: item.parent_nav_item_id,
                    order_index: i,
                  };
                  await updateRoleNavItemConfig(config);
                }
              } else { // Moving to a different parent/level (make it a sibling of overItem)
                // Remove from old parent's children
                if (activeParent) {
                  activeParent.children = activeParent.children.filter(item => item.configId !== activeId);
                  // Re-index remaining siblings
                  for (let i = 0; i < activeParent.children.length; i++) {
                    const item = activeParent.children[i];
                    const config = {
                      id: item.configId!,
                      nav_item_id: item.id,
                      role: selectedRoleFilter as Profile['role'],
                      parent_nav_item_id: item.parent_nav_item_id,
                      order_index: i,
                    };
                    await updateRoleNavItemConfig(config);
                  }
                } else { // Was a root item
                  setConfiguredItemsTree(prev => prev.filter(item => item.configId !== activeId));
                }

                // Add to new parent's children (as sibling of overItem)
                const newDestinationList = [...destinationList];
                newDestinationList.splice(overIndex, 0, { ...activeFound, parent_nav_item_id: overParent?.id || null, order_index: overIndex }); // Temporarily add
                // Re-index all items in the new destination list
                for (let i = 0; i < newDestinationList.length; i++) {
                  const item = newDestinationList[i];
                  const config = {
                    id: item.configId!,
                    nav_item_id: item.id,
                    role: selectedRoleFilter as Profile['role'],
                    parent_nav_item_id: overParent?.id || null, // All items in this list get the same parent
                    order_index: i,
                  };
                  await updateRoleNavItemConfig(config);
                }
              }
            }
            successMessage = "Ordre de navigation mis à jour !";
          }
          // Case 4: Reordering within Unconfigured list
          else if (unconfiguredItems.some(item => item.id === activeId) && unconfiguredItems.some(item => item.id === overId)) {
            // No DB update needed for unconfigured list reordering, only local state
            const oldIndex = unconfiguredItems.findIndex(item => item.id === activeId);
            const newIndex = unconfiguredItems.findIndex(item => item.id === overId);
            if (oldIndex !== -1 && newIndex !== -1) {
              const newUnconfigured = arrayMove(unconfiguredItems, oldIndex, newIndex);
              setUnconfiguredItems(newUnconfigured);
            }
            successMessage = "Liste non configurée réorganisée.";
          }
          else {
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
      const availableParentsForConfig = configuredItemsTree.filter(item => item.route === null); // Only categories can be parents

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
              <CardDescription>Sélectionnez un rôle pour voir et gérer les éléments de menu qui lui sont associés.</CardDescription>
            </CardHeader>
            <CardContent>
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
                      <Switch id="new-item-is-root" checked={newItemIsRoot} onCheckedChange={setNewItemIsRoot} />
                      <Label htmlFor="new-item-is-root">Est une catégorie (pas de route directe)</Label>
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
                    <Label htmlFor="edit-item-is-root" className="text-right">Est une catégorie</Label>
                    <Switch id="edit-item-is-root" checked={editItemIsRoot} onCheckedChange={setEditItemIsRoot} className="col-span-3" />
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