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
import { NavItem, Profile } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import { loadAllNavItemsRaw, addNavItem, updateNavItem, deleteNavItem } from "@/lib/navItems"; // Use loadAllNavItemsRaw
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
  level: number;
  onEdit: (item: NavItem) => void;
  onDelete: (id: string) => void;
  // onMove is no longer passed down directly, handled by DndContext
  isDragging?: boolean; // Prop to indicate if this item is currently being dragged
}

const SortableNavItem = React.forwardRef<HTMLDivElement, SortableNavItemProps>(({ item, level, onEdit, onDelete, isDragging }, ref) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

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
        {item.is_root && !item.parent_id && item.children && item.children.length > 0 && <span className="text-xs text-muted-foreground ml-2">(Catégorie)</span>}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

const AdminMenuManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const [allRawNavItems, setAllRawNavItems] = useState<NavItem[]>([]); // All items from DB
  const [unconfiguredItems, setUnconfiguredItems] = useState<NavItem[]>([]); // Items not in tree
  const [configuredItemsTree, setConfiguredItemsTree] = useState<NavItem[]>([]); // Items in tree structure
  const [isNewItemFormOpen, setIsNewItemFormOpen] = useState(false);

  // States for new item form
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemRoute, setNewItemRoute] = useState('');
  const [newItemIsRoot, setNewItemIsRoot] = useState(false);
  const [newItemAllowedRoles, setNewItemAllowedRoles] = useState<Profile['role'][]>([]);
  const [newItemParentId, setNewItemParentId] = useState<string | undefined>(undefined);
  const [newItemOrderIndex, setNewItemOrderIndex] = useState(0);
  const [newItemIconName, setNewItemIconName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemIsExternal, setNewItemIsExternal] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);

  // States for edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentItemToEdit, setCurrentItemToEdit] = useState<NavItem | null>(null);
  const [editItemLabel, setEditItemLabel] = useState('');
  const [editItemRoute, setEditItemRoute] = useState('');
  const [editItemIsRoot, setEditItemIsRoot] = useState(false);
  const [editItemAllowedRoles, setEditItemAllowedRoles] = useState<Profile['role'][]>([]);
  const [editItemParentId, setEditItemParentId] = useState<string | undefined>(undefined);
  const [editItemOrderIndex, setEditItemOrderIndex] = useState(0);
  const [editItemIconName, setEditItemIconName] = useState('');
  const [editItemDescription, setEditItemDescription] = useState('');
  const [editItemIsExternal, setEditItemIsExternal] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeDragItem, setActiveDragItem] = useState<NavItem | null>(null);

  const fetchAndStructureNavItems = useCallback(async () => {
    const rawItems = await loadAllNavItemsRaw();
    setAllRawNavItems(rawItems);

    const configured: NavItem[] = [];
    const unconfigured: NavItem[] = [];

    const itemMap = new Map<string, NavItem>();
    rawItems.forEach(item => {
      const newItem = { ...item, children: [] }; // Ensure children array exists
      itemMap.set(item.id, newItem);
    });

    itemMap.forEach(item => {
      if (item.parent_id && itemMap.has(item.parent_id)) {
        const parent = itemMap.get(item.parent_id);
        if (parent) {
          parent.children.push(item);
        }
      } else if (item.is_root) {
        configured.push(item);
      } else {
        unconfigured.push(item);
      }
    });

    // Sort root items and their children
    configured.sort((a, b) => a.order_index - b.order_index);
    configured.forEach(item => {
      if (item.children) {
        item.children.sort((a, b) => a.order_index - b.order_index);
      }
    });

    // Sort unconfigured items
    unconfigured.sort((a, b) => a.order_index - b.order_index);

    setConfiguredItemsTree(configured);
    setUnconfiguredItems(unconfigured);
  }, []);

  useEffect(() => {
    fetchAndStructureNavItems();
  }, [fetchAndStructureNavItems]);

  const handleAddNavItem = async () => {
    if (!newItemLabel.trim() || newItemAllowedRoles.length === 0) {
      showError("Le libellé et au moins un rôle autorisé sont requis.");
      return;
    }
    if (newItemIsRoot && newItemParentId) {
      showError("Un élément racine ne peut pas avoir de parent.");
      return;
    }
    if (!newItemIsRoot && !newItemParentId) {
      showError("Un élément non-racine doit avoir un parent.");
      return;
    }

    setIsAddingItem(true);
    try {
      const newItemData: Omit<NavItem, 'id' | 'created_at' | 'updated_at' | 'children' | 'badge'> = {
        label: newItemLabel.trim(),
        route: newItemRoute.trim() || null,
        is_root: newItemIsRoot,
        allowed_roles: newItemAllowedRoles,
        parent_id: newItemParentId || null,
        order_index: newItemOrderIndex,
        icon_name: newItemIconName || null,
        description: newItemDescription.trim() || null,
        is_external: newItemIsExternal,
      };
      await addNavItem(newItemData);
      showSuccess("Élément de navigation ajouté !");
      await fetchAndStructureNavItems(); // Refresh list
      // Reset form
      setNewItemLabel('');
      setNewItemRoute('');
      setNewItemIsRoot(false);
      setNewItemAllowedRoles([]);
      setNewItemParentId(undefined);
      setNewItemOrderIndex(0);
      setNewItemIconName('');
      setNewItemDescription('');
      setNewItemIsExternal(false);
      setIsNewItemFormOpen(false);
    } catch (error: any) {
      console.error("Error adding nav item:", error);
      showError(`Erreur lors de l'ajout de l'élément: ${error.message}`);
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteNavItem = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet élément de navigation ? Cela supprimera également tous ses sous-éléments. Cette action est irréversible.")) {
      try {
        await deleteNavItem(id);
        showSuccess("Élément de navigation supprimé !");
        await fetchAndStructureNavItems(); // Refresh list
      } catch (error: any) {
        console.error("Error deleting nav item:", error);
        showError(`Erreur lors de la suppression de l'élément: ${error.message}`);
      }
    }
  };

  const handleEditNavItem = (item: NavItem) => {
    setCurrentItemToEdit(item);
    setEditItemLabel(item.label);
    setEditItemRoute(item.route || '');
    setEditItemIsRoot(item.is_root);
    setEditItemAllowedRoles(item.allowed_roles);
    setEditItemParentId(item.parent_id || undefined);
    setEditItemOrderIndex(item.order_index);
    setEditItemIconName(item.icon_name || '');
    setEditItemDescription(item.description || '');
    setEditItemIsExternal(item.is_external || false);
    setIsEditDialogOpen(true);
  };

  const handleSaveEditedNavItem = async () => {
    if (!currentItemToEdit) return;
    if (!editItemLabel.trim() || editItemAllowedRoles.length === 0) {
      showError("Le libellé et au moins un rôle autorisé sont requis.");
      return;
    }
    if (editItemIsRoot && editItemParentId) {
      showError("Un élément racine ne peut pas avoir de parent.");
      return;
    }
    if (!editItemIsRoot && !editItemParentId) {
      showError("Un élément non-racine doit avoir un parent.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const updatedItemData: Omit<NavItem, 'created_at' | 'updated_at' | 'children' | 'badge'> = {
        id: currentItemToEdit.id,
        label: editItemLabel.trim(),
        route: editItemRoute.trim() || null,
        is_root: editItemIsRoot,
        allowed_roles: editItemAllowedRoles,
        parent_id: editItemParentId || null,
        order_index: editItemOrderIndex,
        icon_name: editItemIconName || null,
        description: editItemDescription.trim() || null,
        is_external: editItemIsExternal,
      };
      await updateNavItem(updatedItemData);
      showSuccess("Élément de navigation mis à jour !");
      await fetchAndStructureNavItems(); // Refresh list
      setIsEditDialogOpen(false);
      setCurrentItemToEdit(null);
    } catch (error: any) {
      console.error("Error updating nav item:", error);
      showError(`Erreur lors de la mise à jour de l'élément: ${error.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    const item = allRawNavItems.find(i => i.id === active.id);
    setActiveDragItem(item || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!activeDragItem || !over) {
      setActiveDragItem(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determine if the item is being moved within the same list or between lists
    const isMovingWithinUnconfigured = unconfiguredItems.some(item => item.id === activeId) && unconfiguredItems.some(item => item.id === overId);
    const isMovingWithinConfigured = configuredItemsTree.some(item => item.id === activeId || item.children?.some(c => c.id === activeId)) && configuredItemsTree.some(item => item.id === overId || item.children?.some(c => c.id === overId));
    const isMovingToConfigured = unconfiguredItems.some(item => item.id === activeId) && configuredItemsTree.some(item => item.id === overId || item.children?.some(c => c.id === overId));
    const isMovingToUnconfigured = configuredItemsTree.some(item => item.id === activeId || item.children?.some(c => c.id === activeId)) && unconfiguredItems.some(item => item.id === overId);

    let updatedItem: NavItem | null = null;
    let newParentId: string | undefined = undefined;
    let newIsRoot: boolean = false;
    let newOrderIndex: number;

    // Helper to find item and its parent in the tree
    const findItemAndParent = (items: NavItem[], targetId: string, parent: NavItem | null = null): { item: NavItem | null, parent: NavItem | null, index: number } => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.id === targetId) {
          return { item, parent, index: i };
        }
        if (item.children && item.children.length > 0) {
          const found = findItemAndParent(item.children, targetId, item);
          if (found.item) return found;
        }
      }
      return { item: null, parent: null, index: -1 };
    };

    // Case 1: Moving within Unconfigured list
    if (isMovingWithinUnconfigured) {
      const oldIndex = unconfiguredItems.findIndex(item => item.id === activeId);
      const newIndex = unconfiguredItems.findIndex(item => item.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newUnconfigured = arrayMove(unconfiguredItems, oldIndex, newIndex);
        // Re-index order_index for all items in the new list
        newUnconfigured.forEach((item, idx) => item.order_index = idx);
        setUnconfiguredItems(newUnconfigured);
        updatedItem = { ...activeDragItem, parent_id: null, is_root: false, order_index: newIndex };
      }
    }
    // Case 2: Moving within Configured list (only reordering root items for now)
    else if (isMovingWithinConfigured && activeDragItem.is_root && overId === 'configured-container') { // Dropped on the root container
      const oldIndex = configuredItemsTree.findIndex(item => item.id === activeId);
      const newIndex = configuredItemsTree.length; // Add to end if dropped on container
      if (oldIndex !== -1) {
        const newConfigured = arrayMove(configuredItemsTree, oldIndex, newIndex);
        newConfigured.forEach((item, idx) => item.order_index = idx);
        setConfiguredItemsTree(newConfigured);
        updatedItem = { ...activeDragItem, parent_id: null, is_root: true, order_index: newIndex };
      }
    }
    // Case 3: Moving from Unconfigured to Configured (as a new root item)
    else if (unconfiguredItems.some(item => item.id === activeId) && (overId === 'configured-container' || configuredItemsTree.some(item => item.id === overId))) {
      newIsRoot = true;
      newParentId = undefined;
      newOrderIndex = configuredItemsTree.length; // Add to the end of root items

      const newUnconfigured = unconfiguredItems.filter(item => item.id !== activeId);
      newUnconfigured.forEach((item, idx) => item.order_index = idx); // Re-index remaining unconfigured
      setUnconfiguredItems(newUnconfigured);

      const newConfigured = [...configuredItemsTree, { ...activeDragItem, is_root: newIsRoot, parent_id: newParentId, order_index: newOrderIndex, children: [] }];
      newConfigured.sort((a, b) => a.order_index - b.order_index); // Re-sort to maintain order
      setConfiguredItemsTree(newConfigured);
      updatedItem = { ...activeDragItem, is_root: newIsRoot, parent_id: newParentId, order_index: newOrderIndex };
    }
    // Case 4: Moving from Configured to Unconfigured
    else if (configuredItemsTree.some(item => item.id === activeId || item.children?.some(c => c.id === activeId)) && overId === 'unconfigured-container') {
      newIsRoot = false;
      newParentId = undefined;
      newOrderIndex = unconfiguredItems.length; // Add to the end of unconfigured items

      // Remove from configured tree
      const newConfiguredTree = configuredItemsTree.map(rootItem => {
        if (rootItem.id === activeId) return null; // If it's a root item
        if (rootItem.children) {
          rootItem.children = rootItem.children.filter(child => child.id !== activeId);
        }
        return rootItem;
      }).filter(Boolean) as NavItem[];
      newConfiguredTree.forEach((item, idx) => item.order_index = idx); // Re-index remaining configured roots
      setConfiguredItemsTree(newConfiguredTree);

      const newUnconfigured = [...unconfiguredItems, { ...activeDragItem, is_root: newIsRoot, parent_id: newParentId, order_index: newOrderIndex, children: [] }];
      newUnconfigured.sort((a, b) => a.order_index - b.order_index); // Re-sort to maintain order
      setUnconfiguredItems(newUnconfigured);
      updatedItem = { ...activeDragItem, is_root: newIsRoot, parent_id: newParentId, order_index: newOrderIndex };
    }
    // Case 5: Reordering within configured items (children) - this is more complex and will be simplified for now
    // For now, if dropped on another item, it becomes a sibling at the same level.
    else if (isMovingWithinConfigured && activeId !== overId) {
      const { item: activeFound, parent: activeParent, index: activeIndex } = findItemAndParent(configuredItemsTree, activeId);
      const { item: overFound, parent: overParent, index: overIndex } = findItemAndParent(configuredItemsTree, overId);

      if (activeFound && overFound) {
        let sourceList = activeParent ? activeParent.children : configuredItemsTree;
        let destinationList = overParent ? overParent.children : configuredItemsTree;

        if (sourceList === destinationList) { // Moving within the same parent/level
          const newOrder = arrayMove(sourceList, activeIndex, overIndex);
          newOrder.forEach((item, idx) => item.order_index = idx);
          if (activeParent) {
            activeParent.children = newOrder;
          } else {
            setConfiguredItemsTree(newOrder);
          }
          updatedItem = { ...activeDragItem, order_index: newOrder[overIndex].order_index };
        } else { // Moving to a different parent/level (make it a sibling of overItem)
          // Remove from old parent's children
          if (activeParent) {
            activeParent.children = activeParent.children.filter(item => item.id !== activeId);
            activeParent.children.forEach((item, idx) => item.order_index = idx);
          } else { // Was a root item
            setConfiguredItemsTree(prev => prev.filter(item => item.id !== activeId));
          }

          // Add to new parent's children (as sibling of overItem)
          const newDestinationList = [...destinationList];
          newDestinationList.splice(overIndex, 0, { ...activeDragItem, parent_id: overParent?.id || null, is_root: !overParent, children: [] });
          newDestinationList.forEach((item, idx) => item.order_index = idx);

          if (overParent) {
            overParent.children = newDestinationList;
          } else {
            setConfiguredItemsTree(newDestinationList);
          }
          updatedItem = { ...activeDragItem, parent_id: overParent?.id || null, is_root: !overParent, order_index: newDestinationList[overIndex].order_index };
        }
      }
    }

    if (updatedItem) {
      try {
        await updateNavItem(updatedItem);
        showSuccess("Élément de navigation mis à jour !");
        await fetchAndStructureNavItems(); // Re-fetch and re-structure to ensure consistency
      } catch (error: any) {
        console.error("Error updating nav item after drag:", error);
        showError(`Erreur lors de la mise à jour de l'élément: ${error.message}`);
      }
    }
    setActiveDragItem(null);
  };

  const renderNavItemsList = (items: NavItem[], level: number, containerId: string) => {
    return (
      <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <div id={containerId} className="min-h-[50px] p-2 border border-dashed border-muted-foreground/30 rounded-md">
          {items.length === 0 && <p className="text-muted-foreground text-center text-sm py-2">Déposez des éléments ici</p>}
          {items.map(item => (
            <React.Fragment key={item.id}>
              <SortableNavItem
                item={item}
                level={level}
                onEdit={handleEditNavItem}
                onDelete={handleDeleteNavItem}
                isDragging={activeDragItem?.id === item.id}
              />
              {item.children && item.children.length > 0 && (
                <div className="ml-4">
                  {renderNavItemsList(item.children, level + 1, `${containerId}-child-${item.id}`)}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </SortableContext>
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

  const availableParents = allRawNavItems.filter(item => item.is_root && !item.parent_id && item.route === null); // Only categories can be parents

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion des Menus de Navigation
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Créez, modifiez, supprimez et réorganisez les éléments de navigation de l'application.
      </p>

      {/* Section: Ajouter un nouvel élément de navigation */}
      <Collapsible open={isNewItemFormOpen} onOpenChange={setIsNewItemFormOpen}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0">
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="h-6 w-6 text-primary" /> Ajouter un élément de navigation
                </CardTitle>
                {isNewItemFormOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </CollapsibleTrigger>
            <CardDescription>Ajoutez un nouveau lien, une catégorie ou un déclencheur au menu.</CardDescription>
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
                  <Label htmlFor="new-item-is-root">Élément racine (menu principal)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="new-item-is-external" checked={newItemIsExternal} onCheckedChange={setNewItemIsExternal} />
                  <Label htmlFor="new-item-is-external">Lien externe (ouvre dans un nouvel onglet)</Label>
                </div>
                <div>
                  <Label htmlFor="new-item-parent">Parent (pour les sous-éléments)</Label>
                  <Select value={newItemParentId || "none"} onValueChange={(value) => setNewItemParentId(value === "none" ? undefined : value)} disabled={newItemIsRoot}>
                    <SelectTrigger id="new-item-parent">
                      <SelectValue placeholder="Sélectionner un parent" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-lg bg-background/80">
                      <SelectItem value="none">Aucun</SelectItem>
                      {availableParents.map(item => (
                        <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new-item-order">Ordre d'affichage</Label>
                  <Input id="new-item-order" type="number" value={newItemOrderIndex} onChange={(e) => setNewItemOrderIndex(parseInt(e.target.value))} />
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
                <div className="md:col-span-2">
                  <Label htmlFor="new-item-roles">Rôles autorisés</Label>
                  <Select value={newItemAllowedRoles} onValueChange={(value: Profile['role'][]) => setNewItemAllowedRoles(value)} multiple>
                    <SelectTrigger id="new-item-roles">
                      <SelectValue placeholder="Sélectionner les rôles" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-lg bg-background/80">
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
              </div>
              <Button onClick={handleAddNavItem} disabled={isAddingItem}>
                {isAddingItem ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />} Ajouter l'élément
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section: Liste des éléments de navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutList className="h-6 w-6 text-primary" /> Éléments non configurés
            </CardTitle>
            <CardDescription>Ces éléments ne font pas partie du menu de navigation principal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              {renderNavItemsList(unconfiguredItems, 0, 'unconfigured-container')}
              <DragOverlay>
                {activeDragItem ? (
                  <SortableNavItem
                    item={activeDragItem}
                    level={0}
                    onEdit={handleEditNavItem}
                    onDelete={handleDeleteNavItem}
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
              <LayoutList className="h-6 w-6 text-primary" /> Structure de Navigation
            </CardTitle>
            <CardDescription>Réorganisez les éléments par glisser-déposer. Les éléments de niveau racine sont affichés en premier.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              {renderNavItemsList(configuredItemsTree, 0, 'configured-container')}
              <DragOverlay>
                {activeDragItem ? (
                  <SortableNavItem
                    item={activeDragItem}
                    level={0}
                    onEdit={handleEditNavItem}
                    onDelete={handleDeleteNavItem}
                    isDragging={true}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </CardContent>
        </Card>
      </div>

      {/* Edit Nav Item Dialog */}
      {currentItemToEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] backdrop-blur-lg bg-background/80">
            <DialogHeader>
              <DialogTitle>Modifier l'élément de navigation</DialogTitle>
              <DialogDescription>
                Mettez à jour les détails de l'élément.
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
                <Label htmlFor="edit-item-is-root" className="text-right">Élément racine</Label>
                <Switch id="edit-item-is-root" checked={editItemIsRoot} onCheckedChange={setEditItemIsRoot} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-item-is-external" className="text-right">Lien externe</Label>
                <Switch id="edit-item-is-external" checked={editItemIsExternal} onCheckedChange={setEditItemIsExternal} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-item-parent" className="text-right">Parent</Label>
                <Select value={editItemParentId || "none"} onValueChange={(value) => setEditItemParentId(value === "none" ? undefined : value)} disabled={editItemIsRoot}>
                  <SelectTrigger id="edit-item-parent" className="col-span-3">
                    <SelectValue placeholder="Sélectionner un parent" />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-lg bg-background/80">
                    <SelectItem value="none">Aucun</SelectItem>
                    {availableParents.filter(p => p.id !== currentItemToEdit.id).map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-item-order" className="text-right">Ordre</Label>
                <Input id="edit-item-order" type="number" value={editItemOrderIndex} onChange={(e) => setEditItemOrderIndex(parseInt(e.target.value))} className="col-span-3" />
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-item-roles" className="text-right">Rôles</Label>
                <Select value={editItemAllowedRoles} onValueChange={(value: Profile['role'][]) => setEditItemAllowedRoles(value)} multiple>
                  <SelectTrigger id="edit-item-roles" className="col-span-3">
                    <SelectValue placeholder="Sélectionner les rôles" />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-lg bg-background/80">
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
            </div>
            <DialogFooter>
              <Button onClick={handleSaveEditedNavItem} disabled={isSavingEdit}>
                {isSavingEdit ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Enregistrer les modifications"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminMenuManagementPage;