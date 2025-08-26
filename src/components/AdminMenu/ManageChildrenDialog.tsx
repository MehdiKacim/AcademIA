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
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, Link as LinkIcon, BarChart2 // Import Link as LinkIcon to avoid conflict, added BarChart2
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
  SortableContext, // Corrected import
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'; // Corrected import
import { CSS } from '@dnd-kit/utilities';
import { arrayMove } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"; // Import Collapsible
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { Switch } from '@/components/ui/switch'; // Import Switch
import { Loader2 } from 'lucide-react'; // Import Loader2
import SearchableDropdown from '@/components/ui/SearchableDropdown'; // Import the new component

// Map icon_name strings to Lucide React components (re-declare or import from a central place)
const iconMap: { [key: string]: React.ElementType } = { // Changed ReactType to React.ElementType
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, LinkIcon, ExternalLink, Globe, BarChart2
};

const navItemTypes: NavItem['type'][] = ['route', 'category_or_action'];

// Helper function moved to top-level scope
const getItemTypeLabel = (type: NavItem['type']) => {
  switch (type) {
    case 'route': return "Route";
    case 'category_or_action': return "Catégorie/Action";
    default: return "Inconnu";
  }
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

  return (
    <ContextMenu> {/* Re-added ContextMenu */}
      <ContextMenuTrigger asChild>
        <div ref={setNodeRef} style={style} className={cn("p-2 border rounded-android-tile bg-background flex items-center justify-between gap-2 mb-1 flex-wrap sm:flex-nowrap select-none", isDragging && "ring-2 ring-primary/50 shadow-xl")}> {/* Removed select-none and pointer-events-auto, added flex-wrap */}
          <div className="flex items-center gap-2 flex-grow select-none"> {/* Added select-none here */}
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
            <span className="text-xs text-muted-foreground italic">({getItemTypeLabel(item.type)})</span>
            {item.is_global && <Globe className="h-3 w-3 text-muted-foreground ml-1" title="Configuration globale" />}
          </div>
          {isDraggableAndDeletable && (
            <Button variant="destructive" size="sm" onClick={() => onRemove(item.configId!)} className="flex-shrink-0 mt-2 sm:mt-0"> {/* Allow button to wrap */}
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-auto p-1 pointer-events-auto rounded-android-tile"> {/* Apply rounded-android-tile */}
        <ContextMenuItem className="p-2" onClick={() => onRemove(item.configId!)}>
          <Trash2 className="mr-2 h-4 w-4" /> Retirer
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

interface ManageChildrenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parentItem: NavItem;
  selectedRoleFilter: Profile['role'];
  // Removed selectedEstablishmentFilter
  allGenericNavItems: NavItem[];
  allConfiguredItemsFlat: NavItem[]; // New prop: flat list of all configured items for the current role/establishment
  onChildrenUpdated: () => void;
  getDescendantIds: (item: NavItem, allItemsFlat: NavItem[]) => Set<string>; // Add as prop
}

const ManageChildrenDialog = ({ isOpen, onClose, parentItem, selectedRoleFilter, allGenericNavItems, allConfiguredItemsFlat, onChildrenUpdated, getDescendantIds }: ManageChildrenDialogProps) => { // Removed selectedEstablishmentFilter
  const [availableChildrenForAdd, setAvailableChildrenForAdd] = useState<NavItem[]>([]);
  const [currentChildren, setCurrentChildren] = useState<NavItem[]>([]);
  const [selectedGenericItemToAdd, setSelectedGenericItemToAdd] = useState<string | null>(null);
  const [genericItemSearchQuery, setGenericItemSearchQuery] = useState(''); // New state for search input

  // States for new generic item creation form
  const [isNewChildFormOpen, setIsNewChildFormOpen] = useState(false);
  const [newChildLabel, setNewChildLabel] = useState('');
  const [newChildRoute, setNewChildRoute] = useState('');
  const [newChildIconName, setNewChildIconName] = useState('');
  const [newChildDescription, setNewChildDescription] = useState('');
  const [newChildIsExternal, setNewChildIsExternal] = useState(false);
  const [newChildType, setNewChildType] = useState<NavItem['type']>('route'); // New state for type
  const [isAddingNewChild, setIsAddingNewChild] = useState(false);


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeDragItem, setActiveDragItem] = useState<NavItem | null>(null);

  useEffect(() => {
    if (isOpen && parentItem) {
      console.log("[ManageChildrenDialog] Dialog opened for parent:", parentItem.label, "(ID:", parentItem.id, ")");
      console.log("[ManageChildrenDialog] Parent children (initial):", parentItem.children?.map(c => c.label));
      console.log("[ManageChildrenDialog] All generic nav items:", allGenericNavItems.map(i => ({ id: i.id, label: i.label })));
      console.log("[ManageChildrenDialog] All configured items flat:", allConfiguredItemsFlat.map(i => ({ id: i.id, label: i.label, configId: i.configId, parent: i.parent_nav_item_id })));

      // Filter generic items:
      // 1. Not the parent itself
      // 2. Not already a direct child of this parent
      // 3. Not already a descendant of this parent (to prevent circular dependency)
      const currentChildIds = new Set(parentItem.children?.map(c => c.id) || []);
      const descendantsOfParent = getDescendantIds(parentItem, allConfiguredItemsFlat); // Use the passed getDescendantIds and allConfiguredItemsFlat

      console.log("[ManageChildrenDialog] Current direct child generic IDs:", Array.from(currentChildIds));
      console.log("[ManageChildrenDialog] Descendant generic IDs of parent:", Array.from(descendantsOfParent));

      const filteredAvailable = allGenericNavItems.filter(
        item => item.id !== parentItem.id && // Cannot be the parent itself
                !currentChildIds.has(item.id) && // Not already a direct child
                !descendantsOfParent.has(item.id) // Not already a descendant
      );
      
      // Apply search filter
      const lowerCaseQuery = genericItemSearchQuery.toLowerCase();
      const finalFilteredAvailable = filteredAvailable.filter(item => item.label.toLowerCase().includes(lowerCaseQuery));

      console.log("[ManageChildrenDialog] Filtered available children for add (before search):", filteredAvailable.map(i => i.label));
      console.log("[ManageChildrenDialog] Final filtered available children for add (after search):", finalFilteredAvailable.map(i => i.label));

      setAvailableChildrenForAdd(finalFilteredAvailable);
      setCurrentChildren(parentItem.children || []);
      setSelectedGenericItemToAdd(null); // Reset selection
    }
  }, [isOpen, parentItem, allGenericNavItems, allConfiguredItemsFlat, getDescendantIds, genericItemSearchQuery]); // Add genericItemSearchQuery to deps

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

      onChildrenUpdated();
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

    // Check if the item is already configured for this role
    const existingConfiguredItem = allConfiguredItemsFlat.find(item => item.id === genericItem.id);

    try {
      if (existingConfiguredItem) {
        // Scenario: Move an already configured item
        const updatedConfig: Omit<RoleNavItemConfig, 'created_at' | 'updated_at'> = {
          id: existingConfiguredItem.configId!, // Use the existing configId
          nav_item_id: genericItem.id,
          role: selectedRoleFilter,
          parent_nav_item_id: parentItem.id,
          order_index: currentChildren.length, // Add to the end of current children
        };
        await updateRoleNavItemConfig(updatedConfig);
        showSuccess(`'${genericItem.label}' déplacé sous '${parentItem.label}' !`);
      } else {
        // Scenario: Add a new configuration for this generic item
        const newConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'> = {
          nav_item_id: genericItem.id,
          role: selectedRoleFilter,
          parent_nav_item_id: parentItem.id,
          order_index: currentChildren.length,
        };
        await addRoleNavItemConfig(newConfig);
        showSuccess(`'${genericItem.label}' ajouté comme sous-élément !`);
      }
      onChildrenUpdated(); // Refresh parent component's state
    } catch (error: any) {
      console.error("Error adding/moving generic item as child:", error);
      showError(`Erreur lors de l'opération: ${error.message}`);
    }
  };

  const handleAddNewGenericChild = async () => {
    if (!newChildLabel.trim()) {
      showError("Le libellé est requis.");
      return;
    }
    if (newChildType === 'route' && !newChildRoute.trim()) {
      showError("Une route est requise pour un élément de type 'Route'.");
      return;
    }
    if (newChildType === 'category_or_action' && !newChildRoute.trim()) {
      // Same logic as for new item: allow empty route for category, require for action
    }

    setIsAddingNewChild(true);
    try {
      const newItemData: Omit<NavItem, 'id' | 'created_at' | 'updated_at' | 'children' | 'badge' | 'configId' | 'parent_nav_item_id' | 'order_index' | 'is_global'> = {
        label: newChildLabel.trim(),
        route: newChildRoute.trim() || null,
        description: newChildDescription.trim() || null,
        is_external: newChildIsExternal,
        icon_name: newChildIconName || null,
        type: newChildType,
      };
      const addedGenericItem = await addNavItem(newItemData);

      if (addedGenericItem) {
        const newConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'> = {
          nav_item_id: addedGenericItem.id,
          role: selectedRoleFilter,
          parent_nav_item_id: parentItem.id,
          order_index: currentChildren.length,
        };
        await addRoleNavItemConfig(newConfig);
        showSuccess(`'${addedGenericItem.label}' créé et ajouté comme sous-élément !`);
        onChildrenUpdated();

        // Reset form
        setNewChildLabel('');
        setNewChildRoute('');
        setNewChildIconName('');
        setNewChildDescription('');
        setNewChildIsExternal(false);
        setNewChildType('route');
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
      <div id={containerId} className="min-h-[50px] p-2 border border-dashed border-muted-foreground/30 rounded-android-tile">
        {items.length === 0 && <p className="text-muted-foreground text-center text-sm py-2"><span>Déposez des éléments ici</span></p>}
        <SortableContext items={items.map(item => item.configId || item.id)} strategy={verticalListSortingStrategy}>
          {items.map(item => (
            <SortableChildItem
              key={item.configId || item.id}
              item={item}
              level={0}
              onRemove={onRemove || (() => {})}
              isDragging={activeDragItem?.id === item.id || activeDragItem?.configId === item.configId}
              isDraggableAndDeletable={isDraggableAndDeletable}
            />
          ))}
        </SortableContext>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-svh sm:max-w-4xl sm:h-[90vh] flex flex-col p-6 backdrop-blur-lg bg-background/80 z-[100] rounded-android-tile"> {/* Apply responsive dimensions */}
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
              <Card className="flex flex-col rounded-android-tile">
                <CardHeader>
                  <CardTitle className="text-lg">Ajouter un sous-élément existant</CardTitle>
                  <CardDescription>Sélectionnez un élément générique déjà créé à ajouter comme enfant.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col gap-4">
                  <div>
                    <Label htmlFor="generic-item-search-input">Rechercher un élément</Label>
                    <Input
                      id="generic-item-search-input"
                      placeholder="Rechercher un élément..."
                      value={genericItemSearchQuery}
                      onChange={(e) => setGenericItemSearchQuery(e.target.value)}
                      className="mb-2 rounded-android-tile"
                    />
                  </div>
                  <SearchableDropdown
                    value={selectedGenericItemToAdd}
                    onValueChange={setSelectedGenericItemToAdd}
                    options={availableChildrenForAdd.map(item => ({
                      id: item.id,
                      label: item.label,
                      icon_name: item.icon_name,
                      level: 0,
                      isNew: false,
                    }))}
                    placeholder="Sélectionner un élément à ajouter"
                    emptyMessage="Aucun élément disponible."
                    iconMap={iconMap}
                    popoverContentClassName="z-[999] rounded-android-tile" // Increased z-index, apply rounded-android-tile
                  />
                  <Button onClick={handleAddSelectedGenericItemAsChild} disabled={!selectedGenericItemToAdd}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Ajouter comme enfant
                  </Button>
                </CardContent>
              </Card>

              <Card className="flex flex-col rounded-android-tile">
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
                <Card className="rounded-android-tile">
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
                          <Label htmlFor="new-child-type">Type d'élément</Label>
                          <Select value={newChildType} onValueChange={(value: NavItem['type']) => {
                            setNewChildType(value);
                            if (value === 'category_or_action') {
                              setNewChildIsExternal(false);
                            }
                          }}>
                            <SelectTrigger id="new-child-type" className="rounded-android-tile">
                              <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                            <SelectContent className="backdrop-blur-lg bg-background/80 z-[999] rounded-android-tile"> {/* Increased z-index, apply rounded-android-tile */}
                              <ScrollArea className="h-40">
                                {Object.keys(iconMap).sort().map(iconName => {
                                  const IconComponent = iconMap[iconName];
                                  return (
                                    <SelectItem key={iconName} value={iconName}>
                                      <div className="flex items-center gap-2">
                                        <IconComponent className="h-4 w-4" /> <span>{iconName}</span>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </ScrollArea>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="new-child-route">Route (URL interne ou #hash)</Label>
                          <Input id="new-child-route" value={newChildRoute} onChange={(e) => setNewChildRoute(e.target.value)} disabled={newChildType === 'category_or_action' && (newChildRoute === null || newChildRoute === undefined)} />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="new-child-is-external" checked={newChildIsExternal} onCheckedChange={setNewChildIsExternal} disabled={newChildType === 'category_or_action'} />
                          <Label htmlFor="new-child-is-external">Lien externe (ouvre dans un nouvel onglet)</Label>
                        </div>
                        <div>
                          <Label htmlFor="new-child-icon">Nom de l'icône (Lucide React)</Label>
                          <Select value={newChildIconName} onValueChange={setNewChildIconName}>
                            <SelectTrigger id="new-child-icon" className="rounded-android-tile">
                              <SelectValue placeholder="Sélectionner une icône" />
                            </SelectTrigger>
                            <SelectContent className="backdrop-blur-lg bg-background/80 z-[999] rounded-android-tile"> {/* Increased z-index, apply rounded-android-tile */}
                              <ScrollArea className="h-40">
                                {Object.keys(iconMap).sort().map(iconName => {
                                  const IconComponent = iconMap[iconName];
                                  return (
                                    <SelectItem key={iconName} value={iconName}>
                                      <div className="flex items-center gap-2">
                                        <IconComponent className="h-4 w-4" /> <span>{iconName}</span>
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