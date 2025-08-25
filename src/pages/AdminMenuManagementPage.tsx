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
import { loadNavItems, addNavItem, updateNavItem, deleteNavItem, getNavItemById } from "@/lib/navItems";
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
  onMove: (id: string, newParentId: string | undefined, newIndex: number) => void;
  parentChildrenIds: string[]; // IDs of children in the current parent
  allNavItems: NavItem[]; // All items for parent selection
}

const SortableNavItem = ({ item, level, onEdit, onDelete, onMove, parentChildrenIds, allNavItems }: SortableNavItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
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
};

const AdminMenuManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const [navItems, setNavItems] = useState<NavItem[]>([]);
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

  const fetchNavItems = useCallback(async () => {
    const items = await loadNavItems(currentRole); // Load all items, then filter for display
    setNavItems(items);
  }, [currentRole]);

  useEffect(() => {
    fetchNavItems();
  }, [fetchNavItems]);

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
      await fetchNavItems(); // Refresh list
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
        await fetchNavItems(); // Refresh list
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
      await fetchNavItems(); // Refresh list
      setIsEditDialogOpen(false);
      setCurrentItemToEdit(null);
    } catch (error: any) {
      console.error("Error updating nav item:", error);
      showError(`Erreur lors de la mise à jour de l'élément: ${error.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const activeItem = navItems.find(i => i.id === active.id);
      const overItem = navItems.find(i => i.id === over?.id);

      if (!activeItem || !overItem) return;

      // Create a flat list of all items to easily find indices
      const flatNavItems: NavItem[] = [];
      const collectItems = (items: NavItem[]) => {
        items.forEach(item => {
          flatNavItems.push(item);
          if (item.children) {
            collectItems(item.children);
          }
        });
      };
      collectItems(navItems);

      const oldIndex = flatNavItems.findIndex(item => item.id === active.id);
      const newIndex = flatNavItems.findIndex(item => item.id === over?.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Determine the new parent and order index
      let newParentId: string | undefined = undefined;
      let newOrderIndex = newIndex;

      // If dropped onto another item, try to make it a sibling
      // For simplicity, we'll assume dropping on an item makes it a sibling at the same level
      // More complex logic would be needed for dropping *into* a parent
      newParentId = overItem.parent_id;
      
      // If the over item is a root item and has no children, and the active item is also a root item,
      // then they should remain siblings at the root level.
      if (overItem.is_root && !overItem.children?.length && activeItem.is_root) {
        newParentId = undefined;
      } else if (overItem.is_root && overItem.children?.length === 0 && !activeItem.is_root) {
        // If dropped on an empty root item, make it a child
        newParentId = overItem.id;
        newOrderIndex = 0; // First child
      } else if (overItem.is_root && overItem.children?.length && !activeItem.is_root) {
        // If dropped on a root item with children, add to its children
        newParentId = overItem.id;
        newOrderIndex = overItem.children.length; // Add to the end of children
      }


      // Update the item's parent_id and is_root status
      const updatedItemToMove = {
        ...activeItem,
        parent_id: newParentId || null,
        is_root: newParentId === undefined,
      };

      // Reconstruct the tree with the moved item
      const reorderedNavItems = arrayMove(navItems, oldIndex, newIndex);

      // Re-index all items after move
      const reindexItems = (items: NavItem[], currentParentId: string | null = null) => {
        items.forEach((item, index) => {
          item.order_index = index;
          item.parent_id = currentParentId;
          item.is_root = currentParentId === null;
          if (item.children) {
            reindexItems(item.children, item.id);
          }
        });
      };

      reindexItems(reorderedNavItems);

      // Update all affected items in DB
      try {
        const allItemsToUpdate: NavItem[] = [];
        const collectItems = (items: NavItem[]) => {
          items.forEach(item => {
            allItemsToUpdate.push(item);
            if (item.children) {
              collectItems(item.children);
            }
          });
        };
        collectItems(reorderedNavItems);

        for (const item of allItemsToUpdate) {
          await updateNavItem(item);
        }
        showSuccess("Éléments de navigation réorganisés !");
        await fetchNavItems(); // Final refresh
      } catch (error: any) {
        console.error("Error reordering nav items:", error);
        showError(`Erreur lors de la réorganisation des éléments: ${error.message}`);
      }
    }
  };

  const renderNavItems = (items: NavItem[], level: number) => {
    return (
      <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        {items.map(item => (
          <React.Fragment key={item.id}>
            <SortableNavItem
              item={item}
              level={level}
              onEdit={handleEditNavItem}
              onDelete={handleDeleteNavItem}
              onMove={handleMoveNavItem}
              parentChildrenIds={items.map(i => i.id)}
              allNavItems={navItems}
            />
            {item.children && item.children.length > 0 && (
              <div className="ml-4">
                {renderNavItems(item.children, level + 1)}
              </div>
            )}
          </React.Fragment>
        ))}
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

  const availableParents = navItems.filter(item => item.is_root && !item.parent_id && item.route === null); // Only categories can be parents

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutList className="h-6 w-6 text-primary" /> Structure de Navigation
          </CardTitle>
          <CardDescription>Réorganisez les éléments par glisser-déposer. Les éléments de niveau racine sont affichés en premier.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <DndContext sensors={useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {renderNavItems(navItems.filter(item => item.is_root && !item.parent_id), 0)}
          </DndContext>
        </CardContent>
      </Card>

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
                <Label htmlFor="edit-item-icon" className="text-right">Icône</Label>
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