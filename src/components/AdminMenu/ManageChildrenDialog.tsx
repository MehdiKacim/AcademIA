import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button, MotionButton } from "@/components/ui/button"; // Import MotionButton
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, GripVertical, LayoutList, Globe, ExternalLink, X,
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, Link as LinkIcon, BarChart2, ChevronDown, Code, Check
} from "lucide-react";
import { NavItem, Profile, RoleNavItemConfig } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import { addRoleNavItemConfig, updateRoleNavItemConfig, deleteRoleNavItemConfig, addNavItem, loadAllNavItemsRaw } from "@/lib/navItems";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import LoadingSpinner from "@/components/LoadingSpinner";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  MotionCard, // Import MotionCard
} from "@/components/ui/card";
import SimpleItemSelector from '@/components/ui/SimpleItemSelector';

const iconMap: { [key: string]: React.ElementType } = {
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, LinkIcon, ExternalLink, Globe, BarChart2, ChevronDown, Code
};

const navItemTypes: NavItem['type'][] = ['route', 'category_or_action'];

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
    isDragging: isSortableDragging,
  } = useSortable({ id: item.configId!, disabled: !isDraggableAndDeletable });

  const effectivePaddingLeft = `calc(${level * 10}px + ${level > 0 ? '0.5rem' : '0px'})`;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isSortableDragging ? 100 : 'auto',
    opacity: isSortableDragging ? 0.8 : 1,
    paddingLeft: effectivePaddingLeft,
  };

  const IconComponent = item.icon_name ? (iconMap[item.icon_name] || Info) : Info;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div ref={setNodeRef} style={style} className={cn("p-2 border rounded-android-tile bg-background flex items-center justify-between gap-2 mb-1 flex-wrap sm:flex-nowrap select-none", isSortableDragging && "ring-2 ring-primary/50 shadow-xl")}>
          <div className="flex items-center gap-2 flex-grow select-none">
            {isDraggableAndDeletable && (
              <div
                {...listeners}
                {...attributes}
                className="cursor-grab p-1 rounded-md hover:bg-muted/20"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Déplacer l'élément</span>
              </div>
            )}
            <IconComponent className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">{item.label}</span>
            <span className="text-xs text-muted-foreground italic">({getItemTypeLabel(item.type)})</span>
            {item.is_global && <Globe className="h-3 w-3 text-muted-foreground ml-1" title="Configuration globale" />}
          </div>
          {isDraggableAndDeletable && (
            <MotionButton variant="destructive" size="sm" onClick={() => onRemove(item.configId!)} className="flex-shrink-0 mt-2 sm:mt-0" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Trash2 className="h-3 w-3" />
            </MotionButton>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-auto p-1 pointer-events-auto rounded-android-tile z-[9999]">
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
  allGenericNavItems: NavItem[];
  allConfiguredItemsFlat: NavItem[];
  onChildrenUpdated: () => void;
  getDescendantIds: (item: NavItem, allItemsFlat: NavItem[]) => Set<string>;
  getAncestorIds: (itemId: string, allItemsFlat: NavItem[]) => Set<string>;
}

const ManageChildrenDialog = ({ isOpen, onClose, parentItem, selectedRoleFilter, allGenericNavItems, allConfiguredItemsFlat, onChildrenUpdated, getDescendantIds, getAncestorIds }: ManageChildrenDialogProps) => {
  const [selectedGenericItemToAdd, setSelectedGenericItemToAdd] = useState<string | null>(null);
  const [currentChildren, setCurrentChildren] = useState<NavItem[]>([]);
  const [genericItemSearchQuery, setGenericItemSearchQuery] = useState('');
  const [availableChildrenForAdd, setAvailableChildrenForAdd] = useState<NavItem[]>([]);

  const [isNewChildFormOpen, setIsNewChildFormOpen] = useState(false);
  const [newChildLabel, setNewChildLabel] = useState('');
  const [newChildRoute, setNewChildRoute] = useState('');
  const [newChildIconName, setNewChildIconName] = useState('');
  const [newChildDescription, setNewChildDescription] = useState('');
  const [newChildIsExternal, setNewChildIsExternal] = useState(false);
  const [newChildType, setNewChildType] = useState<NavItem['type']>('route');
  const [isAddingNewChild, setIsAddingNewChild] = useState(false);
  const [isIconSelectOpen, setIsIconSelectOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeDragItem, setActiveDragItem] = useState<NavItem | null>(null);

  useEffect(() => {
    if (isOpen && parentItem) {
      const currentChildIds = new Set(parentItem.children?.map(c => c.id) || []);
      const descendantsOfParent = getDescendantIds(parentItem, allConfiguredItemsFlat);
      const ancestorsOfParent = getAncestorIds(parentItem.id, allGenericNavItems);

      const filteredAvailable = allGenericNavItems.filter(
        item => item.id !== parentItem.id &&
                !currentChildIds.has(item.id) &&
                !descendantsOfParent.has(item.id) &&
                !ancestorsOfParent.has(item.id)
      );
      
      setAvailableChildrenForAdd(filteredAvailable);
      setCurrentChildren(parentItem.children || []);
      setSelectedGenericItemToAdd(null);
      setGenericItemSearchQuery('');
      setNewChildLabel('');
      setNewChildRoute('');
      setNewChildIconName('');
      setNewChildDescription('');
      setNewChildIsExternal(false);
      setNewChildType('route');
      setIsAddingNewChild(false);
      setIsIconSelectOpen(false);
    }
  }, [isOpen, parentItem, allGenericNavItems, allConfiguredItemsFlat, getDescendantIds, getAncestorIds]);

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
      if (overId === 'current-children-container' || currentChildren.some(c => c.configId === overId)) {
        const oldIndex = currentChildren.findIndex(item => item.configId === activeConfigId);
        const newIndex = currentChildren.findIndex(item => item.configId === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(currentChildren, oldIndex, newIndex);
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

    const existingConfiguredItem = allConfiguredItemsFlat.find(item => item.id === genericItem.id);

    try {
      if (existingConfiguredItem) {
        const updatedConfig: Omit<RoleNavItemConfig, 'created_at' | 'updated_at'> = {
          id: existingConfiguredItem.configId!,
          nav_item_id: genericItem.id,
          role: selectedRoleFilter,
          parent_nav_item_id: parentItem.id,
          order_index: currentChildren.length,
        };
        await updateRoleNavItemConfig(updatedConfig);
        showSuccess(`'${genericItem.label}' déplacé sous '${parentItem.label}' !`);
      } else {
        const newConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'> = {
          nav_item_id: genericItem.id,
          role: selectedRoleFilter,
          parent_nav_item_id: parentItem.id,
          order_index: currentChildren.length,
        };
        await addRoleNavItemConfig(newConfig);
        showSuccess(`'${genericItem.label}' ajouté comme sous-élément !`);
      }
      onChildrenUpdated();
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
    if (newChildType === 'category_or_action' && newChildRoute.trim()) {
      showError("Une catégorie/action ne doit pas avoir de route.");
      return;
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

  const filteredAvailableChildren = availableChildrenForAdd.filter(item =>
    item.label.toLowerCase().includes(genericItemSearchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(genericItemSearchQuery.toLowerCase())) ||
    (item.icon_name && item.icon_name.toLowerCase().includes(genericItemSearchQuery.toLowerCase())) ||
    (item.route && item.route.toLowerCase().includes(genericItemSearchQuery.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-svh sm:max-w-4xl sm:h-[90vh] flex flex-col p-6 backdrop-blur-lg bg-background/80 z-[1000] rounded-android-tile">
        <div className="flex flex-col h-full">
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
                <MotionCard className="flex flex-col rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
                  <CardHeader>
                    <CardTitle className="text-lg">Ajouter un sous-élément existant</CardTitle>
                    <CardDescription>Sélectionnez un élément générique déjà créé à ajouter comme enfant.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex-col gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un élément..."
                        className="pl-10 rounded-android-tile"
                        value={genericItemSearchQuery}
                        onChange={(e) => setGenericItemSearchQuery(e.target.value)}
                      />
                    </div>
                    <ScrollArea className="h-40 w-full rounded-md border">
                      <div className="grid grid-cols-1 gap-2 p-2">
                        {filteredAvailableChildren.length === 0 ? (
                          <p className="text-muted-foreground text-center py-2">Aucun élément disponible.</p>
                        ) : (
                          filteredAvailableChildren.map(item => {
                            const IconComponent = item.icon_name ? (iconMap[item.icon_name] || Info) : Info;
                            const isSelected = selectedGenericItemToAdd === item.id;
                            return (
                              <MotionButton
                                key={item.id}
                                variant="outline"
                                className={cn(
                                  "flex items-center justify-start gap-2 p-2 h-auto rounded-android-tile",
                                  isSelected ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent hover:text-accent-foreground"
                                )}
                                onClick={() => setSelectedGenericItemToAdd(item.id)}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                              >
                                <Check className={cn("h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                <IconComponent className="h-4 w-4 text-primary" />
                                <div className="flex flex-col items-start">
                                  <span className="font-medium">{item.label}</span>
                                  <span className="text-xs text-muted-foreground italic">({getItemTypeLabel(item.type)})</span>
                                </div>
                              </MotionButton>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                    <MotionButton onClick={handleAddSelectedGenericItemAsChild} disabled={!selectedGenericItemToAdd} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      <PlusCircle className="h-4 w-4 mr-2" /> Ajouter comme enfant
                    </MotionButton>
                  </CardContent>
                </MotionCard>

                <MotionCard className="rounded-android-tile lg:col-span-2" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
                  <Collapsible open={isNewChildFormOpen} onOpenChange={setIsNewChildFormOpen}>
                    <CardHeader>
                      <CollapsibleTrigger asChild>
                        <MotionButton variant="ghost" className="w-full justify-between p-0" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                          <CardTitle className="flex items-center gap-2">
                            <PlusCircle className="h-6 w-6 text-primary" /> Créer un nouvel élément générique et l'ajouter
                          </CardTitle>
                          {isNewChildFormOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </MotionButton>
                      </CollapsibleTrigger>
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
                            <RadioGroup
                              value={newChildType}
                              onValueChange={(value: NavItem['type']) => {
                                setNewChildType(value);
                                if (value === 'category_or_action') {
                                  setNewChildIsExternal(false);
                                  setNewChildRoute('');
                                }
                              }}
                              className="flex space-x-4 mt-2"
                            >
                              {navItemTypes.map(type => (
                                <div key={type} className="flex items-center space-x-2">
                                  <RadioGroupItem value={type} id={`new-child-type-${type}`} />
                                  <Label htmlFor={`new-child-type-${type}`}>{getItemTypeLabel(type)}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                          <div>
                            <Label htmlFor="new-child-route">Route (URL interne ou #hash)</Label>
                            <Input id="new-child-route" value={newChildRoute} onChange={(e) => setNewChildRoute(e.target.value)} disabled={newChildType === 'category_or_action'} />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="new-child-is-external" checked={newChildIsExternal} onCheckedChange={setNewChildIsExternal} disabled={newChildType === 'category_or_action'} />
                            <Label htmlFor="new-child-is-external">Lien externe (ouvre dans un nouvel onglet)</Label>
                          </div>
                          <div>
                            <Label htmlFor="new-child-icon">Nom de l'icône (Lucide React)</Label>
                            <Popover open={isIconSelectOpen} onOpenChange={setIsIconSelectOpen}>
                              <PopoverTrigger asChild>
                                <MotionButton
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={isIconSelectOpen}
                                  className="w-full justify-between rounded-android-tile"
                                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                >
                                  {newChildIconName ? (
                                    <div className="flex items-center gap-2">
                                      {React.createElement(iconMap[newChildIconName] || Info, { className: "h-4 w-4" })}
                                      {newChildIconName}
                                    </div>
                                  ) : (
                                    "Sélectionner une icône..."
                                  )}
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </MotionButton>
                              </PopoverTrigger>
                              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-android-tile z-[9999]">
                                <Command>
                                  <CommandInput placeholder="Rechercher une icône..." />
                                  <CommandList>
                                    <CommandEmpty>Aucune icône trouvée.</CommandEmpty>
                                    <CommandGroup>
                                      {Object.keys(iconMap).sort().map(iconName => {
                                        const IconComponent = iconMap[iconName];
                                        return (
                                          <CommandItem
                                            key={iconName}
                                            value={iconName}
                                            onSelect={() => {
                                              setNewChildIconName(iconName);
                                              setIsIconSelectOpen(false);
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                newChildIconName === iconName ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            <IconComponent className="mr-2 h-4 w-4" />
                                            <span>{iconName}</span>
                                          </CommandItem>
                                        );
                                      })}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div>
                            <Label htmlFor="new-child-description">Description (optionnel)</Label>
                            <Textarea id="new-child-description" value={newChildDescription} onChange={(e) => setNewChildDescription(e.target.value)} />
                          </div>
                        </div>
                        <MotionButton onClick={handleAddNewGenericChild} disabled={isAddingNewChild || !newChildLabel.trim()} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                          {isAddingNewChild ? <LoadingSpinner iconClassName="h-4 w-4 mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />} Créer et ajouter
                        </MotionButton>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </MotionCard>
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
            <MotionButton onClick={onClose} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>Fermer</MotionButton>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageChildrenDialog;