import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, GripVertical, LayoutList, Globe, ExternalLink, X,
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, Link as LinkIcon // Import Link as LinkIcon to avoid conflict
} from "lucide-react";
import { NavItem, Profile, RoleNavItemConfig } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import { addRoleNavItemConfig, updateRoleNavItemConfig, deleteRoleNavItemConfig, addNavItem, loadAllNavItemsRaw } from "@/lib/navItems"; // Import addNavItem and loadAllNavItemsRaw
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"; // Import Collapsible
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { Switch } from '@/components/ui/switch'; // Import Switch
import { Loader2 } from 'lucide-react'; // Import Loader2

// Map icon_name strings to Lucide React components (re-declare or import from a central place)
const iconMap: { [key: string]: React.ElementType } = {
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, LinkIcon, ExternalLink, Globe
};

interface SortableChildItemProps {
  item: NavItem;
  level: number;
  onRemove: (configId: string) => void;
  isDragging?: boolean;
  isDraggableAndDeletable: boolean;
}

const SortableChildItem = React.forwardRef<HTMLDivElement, SortableChildItemProps>(({ item, level, onRemove, isDragging, isDraggableAndDeletable }, ref) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.configId!, disabled: !isDraggableAndDeletable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.8 : 1,
    paddingLeft: `${level * 20}px`,
  };

  const IconComponent = iconMap[item.icon_name || 'Info'] || Info;

  return (
    <div ref={setNodeRef} style={style} className={cn("p-2 border rounded-md bg-background flex items-center justify-between gap-2 mb-1", isDragging && "ring-2 ring-primary/50 shadow-xl")}>
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
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Déplacer l'élément</span>
          </Button>
        )}
        <IconComponent className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">{item.label}</span>
        {item.is_global && <Globe className="h-3 w-3 text-muted-foreground ml-1" title="Configuration globale" />}
      </div>
      {isDraggableAndDeletable && (
        <Button variant="destructive" size="sm" onClick={() => onRemove(item.configId!)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
});

interface ManageChildrenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parentItem: NavItem;
  selectedRoleFilter: Profile['role'];
  selectedEstablishmentFilter?: string;
  allGenericNavItems: NavItem[];
  onChildrenUpdated: () => void;
}

const ManageChildrenDialog = ({ isOpen, onClose, parentItem, selectedRoleFilter, selectedEstablishmentFilter, allGenericNavItems, onChildrenUpdated }: ManageChildrenDialogProps) => {
  const [availableChildrenForAdd, setAvailableChildrenForAdd] = useState<NavItem[]>([]);
  const [currentChildren, setCurrentChildren] = useState<NavItem[]>([]);
  const [selectedGenericItemToAdd, setSelectedGenericItemToAdd] = useState<string | null>(null);

  // States for new generic item creation form
  const [isNewChildFormOpen, setIsNewChildFormOpen] = useState(false);
  const [newChildLabel, setNewChildLabel] = useState('');
  const [newChildRoute, setNewChildRoute] = useState('');
  const [newChildIconName, setNewChildIconName] = useState('');
  const [newChildDescription, setNewChildDescription] = useState('');
  const [newChildIsExternal, setNewChildIsExternal] = useState(false);
  const [isAddingNewChild, setIsAddingNewChild] = useState(false);


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeDragItem, setActiveDragItem] = useState<NavItem | null>(null);

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

  useEffect(() => {
    if (isOpen && parentItem) {
      // Filter generic items: not the parent itself, and not already a child
      const currentChildIds = new Set(parentItem.children?.map(c => c.id) || []);
      const descendantsOfParent = getDescendantIds(parentItem, allGenericNavItems); // Get descendants from generic items

      const filteredAvailable = allGenericNavItems.filter(
        item => item.id !== parentItem.id && // Cannot be the parent itself
                !currentChildIds.has(item.id) && // Not already a direct child
                !descendantsOfParent.has(item.id) // Not already a descendant (to prevent circular dependency)
      );
      setAvailableChildrenForAdd(filteredAvailable);
      setCurrentChildren(parentItem.children || []);
      setSelectedGenericItemToAdd(null); // Reset selection
    }
  }, [isOpen, parentItem, allGenericNavItems, getDescendantIds]);

  const handleDragStart = (event: any) => {
    const { active } = event;
    const item = currentChildren.find(i => i.configId === active.id);
    setActiveDragItem(item || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!activeDragItem || !over || active.id === over.id) {
      setActiveDragItem(null);
      return;
    }

    const activeConfigId = active.id as string;
    const overId = over.id as string;

    try {
      // Dropped into "Current Children" container (reorder)
      if (overId === 'current-children-container' || currentChildren.some(c => c.configId === overId)) {
        const oldIndex = currentChildren.findIndex(item => item.configId === activeConfigId);
        const newIndex = currentChildren.findIndex(item => item.configId === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(currentChildren, oldIndex, newIndex);
          // Update order_index for all affected children in DB
          for (let i = 0; i < newOrder.length; i++) {
            const item = newOrder[i];
            if (item.order_index !== i) {
              const updatedConfig: Omit<RoleNavItemConfig, 'created_at' | 'updated_at'> = {
                id: item.configId!,
                nav_item_id: item.id,
                role: selectedRoleFilter,
                parent_nav_item_id: parentItem.id,
                order_index: i,
                establishment_id: selectedEstablishmentFilter || null,
              };
              await updateRoleNavItemConfig(updatedConfig);
            }
          }
          showSuccess("Sous-éléments réorganisés !");
        }
      } else {
        showError("Cible de dépôt non valide.");
        return;
      }

      onChildrenUpdated(); // Refresh parent tree
    } catch (error: any) {
      console.error("Error during drag and drop in ManageChildrenDialog:", error);
      showError(`Erreur lors du glisser-déposer: ${error.message}`);
    } finally {
      setActiveDragItem(null);
    }
  };

  const handleAddSelectedGenericItemAsChild = async () => {
    if (!selectedGenericItemToAdd) {
      showError("Veuillez sélectionner un élément à ajouter.");
      return;
    }

    const genericItem = allGenericNavItems.find(item => item.id === selectedGenericItemToAdd);
    if (!genericItem) {
      showError("Élément générique introuvable.");
      return;
    }

    try {
      const newConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'> = {
        nav_item_id: genericItem.id,
        role: selectedRoleFilter,
        parent_nav_item_id: parentItem.id, // Add as child of current parentItem
        order_index: currentChildren.length, // Add to end
        establishment_id: selectedEstablishmentFilter || null,
      };
      await addRoleNavItemConfig(newConfig);
      showSuccess(`'${genericItem.label}' ajouté comme sous-élément !`);
      onChildrenUpdated(); // Refresh parent tree
    } catch (error: any) {
      console.error("Error adding generic item as child:", error);
      showError(`Erreur lors de l'ajout du sous-élément: ${error.message}`);
    }
  };

  const handleAddNewGenericChild = async () => {
    if (!newChildLabel.trim()) {
      showError("Le libellé est requis.");
      return;
    }

    setIsAddingNewChild(true);
    try {
      const newItemData: Omit<NavItem, 'id' | 'created_at' | 'updated_at' | 'children' | 'badge' | 'configId' | 'establishment_id' | 'parent_nav_item_id' | 'order_index' | 'is_global'> = {
        label: newChildLabel.trim(),
        route: newChildRoute.trim() || null,
        description: newChildDescription.trim() || null,
        is_external: newChildIsExternal,
        icon_name: newChildIconName || null,
      };
      const addedGenericItem = await addNavItem(newItemData);

      if (addedGenericItem) {
        const newConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'> = {
          nav_item_id: addedGenericItem.id,
          role: selectedRoleFilter,
          parent_nav_item_id: parentItem.id,
          order_index: currentChildren.length,
          establishment_id: selectedEstablishmentFilter || null,
        };
        await addRoleNavItemConfig(newConfig);
        showSuccess(`'${addedGenericItem.label}' créé et ajouté comme sous-élément !`);
        onChildrenUpdated(); // Refresh parent tree

        // Reset form
        setNewChildLabel('');
        setNewChildRoute('');
        setNewChildIconName('');
        setNewChildDescription('');
        setNewChildIsExternal(false);
        setIsNewChildFormOpen(false);
      } else {
        showError("Échec de la création du nouvel élément générique.");
      }
    } catch (error: any) {
      console.error("Error creating and adding new generic child:", error);
      showError(`Erreur lors de la création et de l'ajout du sous-élément: ${error.message}`);
    } finally {
      setIsAddingNewChild(false);
    }
  };

  const handleRemoveChild = async (configId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir retirer ce sous-élément ?")) {
      try {
        await deleteRoleNavItemConfig(configId);
        showSuccess("Sous-élément retiré !");
        onChildrenUpdated();
      } catch (error: any) {
        console.error("Error removing child item:", error);
        showError(`Erreur lors du retrait du sous-élément: ${error.message}`);
      }
    }
  };

  const renderChildItemsList = (items: NavItem[], containerId: string, isDraggableAndDeletable: boolean, onRemove?: (configId: string) => void) => {
    return (
      <div id={containerId} className="min-h-[50px] p-2 border border-dashed border-muted-foreground/30 rounded-md">
        {items.length === 0 && <p className="text-muted-foreground text-center text-sm py-2">Déposez des éléments ici</p>}
        <SortableContext items={items.map(item => item.configId || item.id)} strategy={verticalListSortingStrategy}>
          {items.map(item => (
            <SortableChildItem
              key={item.configId || item.id}
              item={item}
              level={0}
              onRemove={onRemove || (() => {})}
              isDragging={activeDragItem?.id === item.id || activeDragItem?.configId === item.configId}
              isDraggableAndDeletable={isDraggableAndDeletable && (!item.is_global || selectedEstablishmentFilter === undefined)}
            />
          ))}
        </SortableContext>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-6 backdrop-blur-lg bg-background/80">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
            Gérer les sous-éléments de "{parentItem.label}"
          </DialogTitle>
          <DialogDescription>
            Ajoutez, supprimez et réorganisez les éléments enfants de cette catégorie.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">Ajouter un sous-élément existant</CardTitle>
                  <CardDescription>Sélectionnez un élément générique déjà créé à ajouter comme enfant.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col gap-4">
                  <Select value={selectedGenericItemToAdd || ""} onValueChange={setSelectedGenericItemToAdd}>
                    <SelectTrigger id="add-child-select">
                      <SelectValue placeholder="Sélectionner un élément à ajouter" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-lg bg-background/80">
                      <ScrollArea className="h-40">
                        {availableChildrenForAdd.length === 0 ? (
                          <SelectItem value="no-items" disabled>Aucun élément disponible</SelectItem>
                        ) : (
                          availableChildrenForAdd.map(item => (
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
                  <Button onClick={handleAddSelectedGenericItemAsChild} disabled={!selectedGenericItemToAdd}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Ajouter comme enfant
                  </Button>
                </CardContent>
              </Card>

              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">Sous-éléments actuels</CardTitle>
                  <CardDescription>Réorganisez ou supprimez les sous-éléments.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto">
                  {renderChildItemsList(currentChildren, 'current-children-container', true, handleRemoveChild)}
                </CardContent>
              </Card>

              {/* New section for creating a new generic item and adding it as a child */}
              <Collapsible open={isNewChildFormOpen} onOpenChange={setIsNewChildFormOpen} className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-0">
                        <CardTitle className="flex items-center gap-2">
                          <PlusCircle className="h-6 w-6 text-primary" /> Créer un nouvel élément générique et l'ajouter
                        </CardTitle>
                        {isNewChildFormOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CardDescription>Créez un tout nouvel élément de navigation et ajoutez-le directement comme enfant de "{parentItem.label}".</CardDescription>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="new-child-label">Libellé</Label>
                          <Input id="new-child-label" value={newChildLabel} onChange={(e) => setNewChildLabel(e.target.value)} required />
                        </div>
                        <div>
                          <Label htmlFor="new-child-route">Route (URL interne ou #hash, laisser vide pour catégorie/déclencheur)</Label>
                          <Input id="new-child-route" value={newChildRoute} onChange={(e) => setNewChildRoute(e.target.value)} />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="new-child-is-external" checked={newChildIsExternal} onCheckedChange={setNewChildIsExternal} />
                          <Label htmlFor="new-child-is-external">Lien externe (ouvre dans un nouvel onglet)</Label>
                        </div>
                        <div>
                          <Label htmlFor="new-child-icon">Nom de l'icône (Lucide React)</Label>
                          <Select value={newChildIconName} onValueChange={setNewChildIconName}>
                            <SelectTrigger id="new-child-icon">
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
                          <Label htmlFor="new-child-description">Description (optionnel)</Label>
                          <Textarea id="new-child-description" value={newChildDescription} onChange={(e) => setNewChildDescription(e.target.value)} />
                        </div>
                      </div>
                      <Button onClick={handleAddNewGenericChild} disabled={isAddingNewChild || !newChildLabel.trim()}>
                        {isAddingNewChild ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />} Créer et ajouter
                      </Button>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>
            <DragOverlay>
              {activeDragItem ? (
                <SortableChildItem
                  item={activeDragItem}
                  level={0}
                  onRemove={() => {}}
                  isDragging={true}
                  isDraggableAndDeletable={true}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageChildrenDialog;