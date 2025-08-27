import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2, Home, Info, Search as SearchIcon, ArrowLeft, XCircle, Check } from "lucide-react";
import { NavItem, Profile, RoleNavItemConfig } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import { addRoleNavItemConfig, updateRoleNavItemConfig } from "@/lib/navItems";
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EditRoleConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfigToEdit: RoleNavItemConfig | null;
  currentItemToEdit: NavItem | null;
  selectedRoleFilter: Profile['role'];
  allGenericNavItems: NavItem[];
  allConfiguredItemsFlat: NavItem[];
  onSave: () => void; // Callback to refresh parent list
  getDescendantIds: (item: NavItem, allItemsFlat: NavItem[]) => Set<string>;
  iconMap: { [key: string]: React.ElementType };
}

// Helper function to get item type label
const getItemTypeLabel = (type: NavItem['type']) => {
  switch (type) {
    case 'route': return "Route";
    case 'category_or_action': return "Catégorie/Action";
    default: return "Inconnu";
  }
};

const EditRoleConfigDialog = ({
  isOpen,
  onClose,
  currentConfigToEdit,
  currentItemToEdit,
  selectedRoleFilter,
  allGenericNavItems,
  allConfiguredItemsFlat,
  onSave,
  getDescendantIds,
  iconMap,
}: EditRoleConfigDialogProps) => {
  const [selectedParentForEdit, setSelectedParentForEdit] = useState<string | null>(null);
  const [editConfigOrderIndex, setEditConfigOrderIndex] = useState(0);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [parentSearchQuery, setParentSearchQuery] = useState('');

  // State to manage the two-step selection process
  const [isParentSelectionStep, setIsParentSelectionStep] = useState(true);

  useEffect(() => {
    if (isOpen && currentConfigToEdit && currentItemToEdit) {
      // Initialize states when dialog opens
      setSelectedParentForEdit(currentConfigToEdit.parent_nav_item_id || null);
      setEditConfigOrderIndex(currentConfigToEdit.order_index);
      setIsSavingEdit(false);
      setParentSearchQuery('');
      setIsParentSelectionStep(true); // Always start with parent selection
    }
  }, [isOpen, currentConfigToEdit, currentItemToEdit]);

  const availableParentsOptions = useMemo(() => {
    if (!currentItemToEdit) return [];

    const descendantsOfCurrentItem = getDescendantIds(currentItemToEdit, allConfiguredItemsFlat);
    const configuredItemIds = new Set(allConfiguredItemsFlat.map(item => item.id));

    const potentialParents: { id: string; label: string; level: number; icon_name?: string; typeLabel: string; isNew: boolean }[] = [];

    // 1. Add already configured categories that are valid parents
    allConfiguredItemsFlat.forEach(item => {
      const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);
      const isNotSelf = item.id !== currentItemToEdit.id;
      const isNotDescendant = !descendantsOfCurrentItem.has(item.id);

      if (isCategory && isNotSelf && isNotDescendant) {
        let level = 0;
        let currentParentId = item.parent_nav_item_id;
        while (currentParentId) {
          level++;
          const parent = allConfiguredItemsFlat.find(i => i.id === currentParentId);
          currentParentId = parent?.parent_nav_item_id;
        }
        potentialParents.push({
          id: item.id,
          label: item.label,
          level: level,
          icon_name: item.icon_name,
          typeLabel: getItemTypeLabel(item.type),
          isNew: false, // This is an existing configured parent
        });
      }
    });

    // 2. Add generic categories that are NOT YET configured for this role and are valid parents
    allGenericNavItems.forEach(item => {
      // Only consider if it's a category and not already configured for this role
      const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);
      const isNotConfiguredForRole = !configuredItemIds.has(item.id);
      const isNotSelf = item.id !== currentItemToEdit.id;
      const isNotDescendant = !descendantsOfCurrentItem.has(item.id); // Check against descendants of currentItemToEdit

      if (isCategory && isNotConfiguredForRole && isNotSelf && isNotDescendant) {
        // For new generic items, assume level 0 for display in the dropdown
        potentialParents.push({
          id: item.id,
          label: item.label,
          level: 0, // Treat as a potential root-level parent for now
          icon_name: item.icon_name,
          typeLabel: getItemTypeLabel(item.type),
          isNew: true, // This is a new generic parent to be configured
        });
      }
    });

    const sortedParents = potentialParents.sort((a, b) => a.label.localeCompare(b.label));
    
    // Apply search filter
    const lowerCaseQuery = parentSearchQuery.toLowerCase();
    return [
      { id: 'none', label: 'Aucun (élément racine)', icon_name: 'Home', level: 0, isNew: false },
      ...sortedParents.filter(p => p.label.toLowerCase().includes(lowerCaseQuery))
    ];
  }, [currentItemToEdit, allConfiguredItemsFlat, allGenericNavItems, getDescendantIds, parentSearchQuery]);

  const handleSaveEditedRoleConfig = async () => {
    if (!currentConfigToEdit || !currentItemToEdit) return;

    setIsSavingEdit(true);
    try {
      let finalParentId: string | null = selectedParentForEdit === 'none' ? null : selectedParentForEdit;

      // Check if the selected parent is a new generic item (not yet configured for this role)
      const selectedParentInfo = availableParentsOptions.find(p => p.id === finalParentId);

      if (selectedParentInfo?.isNew) {
          try {
              const newParentConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'> = {
                  nav_item_id: finalParentId!,
                  role: selectedRoleFilter,
                  parent_nav_item_id: null,
                  order_index: 9999,
              };
              const addedConfig = await addRoleNavItemConfig(newParentConfig);
              if (addedConfig) {
                  finalParentId = addedConfig.nav_item_id;
                  showSuccess(`Catégorie '${selectedParentInfo.label}' ajoutée au menu du rôle.`);
              } else {
                  showError(`Échec de l'ajout de la catégorie '${selectedParentInfo.label}' au menu du rôle.`);
                  setIsSavingEdit(false);
                  return;
              }
          } catch (error: any) {
              console.error("Error adding new generic parent to role config:", error);
              showError(`Erreur lors de l'ajout de la nouvelle catégorie parente: ${error.message}`);
              setIsSavingEdit(false);
              return;
          }
      }

      if (finalParentId && currentItemToEdit.id === finalParentId) {
        showError("Un élément ne peut pas être son propre parent.");
        setIsSavingEdit(false);
        return;
      }
      const descendantsOfCurrentItem = getDescendantIds(currentItemToEdit, allConfiguredItemsFlat);
      if (finalParentId && descendantsOfCurrentItem.has(finalParentId)) {
        showError("Un élément ne peut pas être le parent d'un de ses propres descendants.");
        setIsSavingEdit(false);
        return;
      }

      const updatedConfigData: Omit<RoleNavItemConfig, 'created_at' | 'updated_at'> = {
        id: currentConfigToEdit.id,
        nav_item_id: currentConfigToEdit.nav_item_id,
        role: currentConfigToEdit.role,
        parent_nav_item_id: finalParentId,
        order_index: editConfigOrderIndex,
      };
      await updateRoleNavItemConfig(updatedConfigData);
      showSuccess("Configuration de rôle mise à jour !");
      onSave(); // Trigger refresh in parent
      onClose();
    } catch (error: any) {
      console.error("Error updating role config:", error);
      showError(`Erreur lors de la mise à jour de la configuration de rôle: ${error.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleSelectParent = (parentId: string | null) => {
    setSelectedParentForEdit(parentId);
    setIsParentSelectionStep(false); // Move to the next step
  };

  const handleCancelParentSelection = () => {
    setSelectedParentForEdit(null);
    setIsParentSelectionStep(true); // Go back to parent selection
  };

  if (!currentConfigToEdit || !currentItemToEdit) return null;

  const ItemIcon = currentItemToEdit.icon_name ? (iconMap[currentItemToEdit.icon_name] || Info) : Info;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-svh sm:max-w-[600px] sm:h-auto bg-card z-[100] rounded-android-tile">
        <div className="flex flex-col h-full"> {/* Wrap children in a single div */}
          <DialogHeader>
            <DialogTitle>Modifier la configuration de "{currentItemToEdit.label}" pour {selectedRoleFilter}</DialogTitle>
            <DialogDescription>
              Ajustez la position et le parent de cet élément dans le menu de ce rôle.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 flex-grow"> {/* Added flex-grow */}
            {isParentSelectionStep ? (
              // Step 1: Select Parent
              <div className="space-y-4">
                <Label htmlFor="parent-search-input">1. Rechercher et sélectionner un parent</Label>
                <Input
                  id="parent-search-input"
                  placeholder="Rechercher un parent..."
                  value={parentSearchQuery}
                  onChange={(e) => setParentSearchQuery(e.target.value)}
                  className="mb-2 rounded-android-tile"
                />
                <ScrollArea className="h-64 w-full rounded-md border">
                  <div className="p-2 space-y-2">
                    {availableParentsOptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucun parent disponible.
                      </p>
                    ) : (
                      availableParentsOptions.map(item => {
                        const ParentIcon = item.icon_name ? (iconMap[item.icon_name] || Info) : Info;
                        const isSelected = selectedParentForEdit === item.id;
                        return (
                          <Card 
                            key={item.id} 
                            className={cn(
                              "flex items-center justify-between p-3 rounded-android-tile cursor-pointer hover:bg-muted/20",
                              isSelected && "border-primary ring-2 ring-primary/50 bg-primary/5"
                            )}
                            onClick={() => handleSelectParent(item.id)}
                          >
                            <div className="flex items-center gap-3 select-none"> {/* Added select-none */}
                              <ParentIcon className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium">{item.label}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.typeLabel} {item.id !== 'none' && item.id !== currentItemToEdit.id && `(ID: ${item.id.substring(0, 8)}...)`}
                                  {item.isNew && <span className="ml-2 italic">(Nouvelle catégorie générique)</span>}
                                </p>
                              </div>
                            </div>
                            <Button size="sm" onClick={() => handleSelectParent(item.id)}>
                              Sélectionner
                            </Button>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              // Step 2: Confirm Parent and Set Order
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>2. Confirmer le parent et définir l'ordre</Label>
                  <Button variant="ghost" size="sm" onClick={handleCancelParentSelection}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Changer de parent
                  </Button>
                </div>
                <Card className="p-3 rounded-android-tile bg-muted/20">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ItemIcon className="h-5 w-5 text-primary" /> {currentItemToEdit.label}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Parent sélectionné: {selectedParentForEdit === 'none' ? 'Aucun (élément racine)' : availableParentsOptions.find(p => p.id === selectedParentForEdit)?.label || 'Inconnu'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 text-sm text-muted-foreground">
                    {currentItemToEdit.description || "Aucune description."}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4"> {/* Adjusted grid for mobile */}
                  <Label htmlFor="edit-config-order" className="sm:text-right">Ordre</Label>
                  <Input id="edit-config-order" type="number" value={editConfigOrderIndex} onChange={(e) => setEditConfigOrderIndex(parseInt(e.target.value))} className="sm:col-span-3 rounded-android-tile" />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEditedRoleConfig} disabled={isSavingEdit || isParentSelectionStep}>
              {isSavingEdit ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Enregistrer les modifications"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditRoleConfigDialog;