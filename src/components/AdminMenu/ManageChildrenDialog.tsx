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
import { PlusCircle, Edit, Trash2, GripVertical, LayoutList, Globe, ExternalLink, X } from "lucide-react";
import { NavItem, Profile, RoleNavItemConfig } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import { addRoleNavItemConfig, updateRoleNavItemConfig, deleteRoleNavItemConfig } from "@/lib/navItems";
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

// Map icon_name strings to Lucide React components (re-declare or import from a central place)
const iconMap: { [key: string]: React.ElementType } = {
  // ... (same as in DashboardLayout or AdminMenuManagementPage) ...
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
  const [availableChildren, setAvailableChildren] = useState<NavItem[]>([]);
  const [currentChildren, setCurrentChildren] = useState<NavItem[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeDragItem, setActiveDragItem] = useState<NavItem | null>(null);

  useEffect(() => {
    if (isOpen && parentItem) {
      // Filter generic items: not the parent itself, and not already a child
      const currentChildIds = new Set(parentItem.children?.map(c => c.id) || []);
      const filteredAvailable = allGenericNavItems.filter(
        item => item.id !== parentItem.id && !currentChildIds.has(item.id)
      );
      setAvailableChildren(filteredAvailable);
      setCurrentChildren(parentItem.children || []);
    }
  }, [isOpen, parentItem, allGenericNavItems]);

  const handleDragStart = (event: any) => {
    const { active } = event;
    const item = availableChildren.find(i => i.id === active.id) || currentChildren.find(i => i.configId === active.id);
    setActiveDragItem(item || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!activeDragItem || !over || active.id === over.id) {
      setActiveDragItem(null);
      return;
    }

    const activeId = active.id as string; // This could be generic nav item ID or configId
    const overId = over.id as string; // This could be configId or container ID

    try {
      // Dropped into "Available Children" container (remove from current children)
      if (overId === 'available-children-container' && activeDragItem.configId) {
        await deleteRoleNavItemConfig(activeDragItem.configId);
        showSuccess("Élément retiré des sous-éléments !");
      }
      // Dropped into "Current Children" container (add or reorder)
      else if (overId === 'current-children-container' || currentChildren.some(c => c.configId === overId)) {
        // If dragging from available to current
        if (!activeDragItem.configId) { // It's a generic item, needs a new config
          const newConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'> = {
            nav_item_id: activeDragItem.id,
            role: selectedRoleFilter,
            parent_nav_item_id: parentItem.id,
            order_index: currentChildren.length, // Add to end, re-index later
            establishment_id: selectedEstablishmentFilter || null,
          };
          await addRoleNavItemConfig(newConfig);
          showSuccess("Élément ajouté aux sous-éléments !");
        }
        // If reordering within current children
        else {
          const oldIndex = currentChildren.findIndex(item => item.configId === activeId);
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
                  <CardTitle className="text-lg">Éléments disponibles</CardTitle>
                  <CardDescription>Faites glisser pour ajouter aux sous-éléments.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto">
                  {renderChildItemsList(availableChildren, 'available-children-container', true)}
                </CardContent>
              </Card>

              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">Sous-éléments actuels</CardTitle>
                  <CardDescription>Réorganisez ou faites glisser pour retirer.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto">
                  {renderChildItemsList(currentChildren, 'current-children-container', true, (configId) => {
                    // This is a direct remove action, not drag-and-drop
                    deleteRoleNavItemConfig(configId).then(() => {
                      showSuccess("Sous-élément retiré !");
                      onChildrenUpdated();
                    }).catch(err => showError(`Erreur: ${err.message}`));
                  })}
                </CardContent>
              </Card>
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