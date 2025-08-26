import React, { useState, useMemo, useCallback } from 'react';
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
import { PlusCircle, Loader2, Home, Info } from "lucide-react";
import { NavItem, Profile, RoleNavItemConfig } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import { addRoleNavItemConfig, updateRoleNavItemConfig } from "@/lib/navItems";
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import { cn } from '@/lib/utils';

interface AddExistingNavItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoleFilter: Profile['role'];
  allGenericNavItems: NavItem[];
  allConfiguredItemsFlat: NavItem[];
  onItemAdded: () => void;
  getDescendantIds: (item: NavItem, allItemsFlat: NavItem[]) => Set<string>;
  iconMap: { [key: string]: React.ElementType };
}

const AddExistingNavItemDialog = ({
  isOpen,
  onClose,
  selectedRoleFilter,
  allGenericNavItems,
  allConfiguredItemsFlat,
  onItemAdded,
  getDescendantIds,
  iconMap,
}: AddExistingNavItemDialogProps) => {
  const [selectedGenericItemToAdd, setSelectedGenericItemToAdd] = useState<string | null>(null);
  const [selectedParentForNewItem, setSelectedParentForNewItem] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Reset states when dialog opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedGenericItemToAdd(null);
      setSelectedParentForNewItem(null);
      setIsAdding(false);
    }
  }, [isOpen]);

  const availableGenericItemsOptions = useMemo(() => {
    return allGenericNavItems
      .filter(item => !allConfiguredItemsFlat.some(configured => configured.id === item.id))
      .map(item => ({
        id: item.id,
        label: item.label,
        icon_name: item.icon_name,
        level: 0,
        isNew: false,
      }));
  }, [allGenericNavItems, allConfiguredItemsFlat]);

  const availableParentsOptions = useMemo(() => {
    const potentialParents: { id: string; label: string; level: number; icon_name?: string; typeLabel: string; isNew: boolean }[] = [];

    // Add already configured categories that are valid parents
    allConfiguredItemsFlat.forEach(item => {
      const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);
      if (isCategory) {
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
          isNew: false,
        });
      }
    });

    // Add generic categories that are NOT YET configured for this role and are valid parents
    const configuredItemIds = new Set(allConfiguredItemsFlat.map(item => item.id));
    allGenericNavItems.forEach(item => {
      const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);
      const isNotConfiguredForRole = !configuredItemIds.has(item.id);

      if (isCategory && isNotConfiguredForRole) {
        potentialParents.push({
          id: item.id,
          label: item.label,
          level: 0,
          icon_name: item.icon_name,
          typeLabel: getItemTypeLabel(item.type),
          isNew: true,
        });
      }
    });

    const sortedParents = potentialParents.sort((a, b) => a.label.localeCompare(b.label));
    return [
      { id: 'none', label: 'Aucun (élément racine)', icon_name: 'Home', level: 0, isNew: false },
      ...sortedParents
    ];
  }, [allConfiguredItemsFlat, allGenericNavItems]);

  const handleAddExistingItem = async () => {
    if (!selectedGenericItemToAdd) {
      showError("Veuillez sélectionner un élément générique à ajouter.");
      return;
    }

    setIsAdding(true);
    try {
      const genericItem = allGenericNavItems.find(item => item.id === selectedGenericItemToAdd);
      if (!genericItem) {
        showError("Élément générique introuvable.");
        setIsAdding(false);
        return;
      }

      let finalParentId: string | null = selectedParentForNewItem === 'none' ? null : selectedParentForNewItem;

      // If the selected parent is a new generic item (not yet configured for this role),
      // we need to configure it first as a root item.
      const selectedParentInfo = availableParentsOptions.find(p => p.id === finalParentId);
      if (selectedParentInfo?.isNew) {
        try {
          const newParentConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'> = {
            nav_item_id: finalParentId!,
            role: selectedRoleFilter,
            parent_nav_item_id: null, // Initially add as root
            order_index: 9999, // Will be re-indexed later
          };
          const addedConfig = await addRoleNavItemConfig(newParentConfig);
          if (addedConfig) {
            finalParentId = addedConfig.nav_item_id; // Use the generic ID of the newly configured parent
            showSuccess(`Catégorie '${selectedParentInfo.label}' ajoutée au menu du rôle.`);
          } else {
            showError(`Échec de l'ajout de la catégorie '${selectedParentInfo.label}' au menu du rôle.`);
            setIsAdding(false);
            return;
          }
        } catch (error: any) {
          console.error("Error adding new generic parent to role config:", error);
          showError(`Erreur lors de l'ajout de la nouvelle catégorie parente: ${error.message}`);
          setIsAdding(false);
          return;
        }
      }

      // Check for circular dependency if adding to an existing configured parent
      if (finalParentId && genericItem.id === finalParentId) {
        showError("Un élément ne peut pas être son propre parent.");
        setIsAdding(false);
        return;
      }
      if (finalParentId) {
        const descendantsOfItem = getDescendantIds(genericItem, allConfiguredItemsFlat);
        if (descendantsOfItem.has(finalParentId)) {
          showError("Un élément ne peut pas être le parent d'un de ses propres descendants.");
          setIsAdding(false);
          return;
        }
      }

      // Add the new configuration for the selected generic item
      const newConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'> = {
        nav_item_id: genericItem.id,
        role: selectedRoleFilter,
        parent_nav_item_id: finalParentId,
        order_index: 9999, // Will be re-indexed by fetchAndStructureNavItems
      };
      await addRoleNavItemConfig(newConfig);
      showSuccess(`'${genericItem.label}' ajouté au menu du rôle !`);
      onItemAdded(); // Trigger refresh in parent
      onClose();
    } catch (error: any) {
      console.error("Error adding existing nav item to role menu:", error);
      showError(`Erreur lors de l'ajout de l'élément au menu du rôle: ${error.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card z-[100]">
        <DialogHeader>
          <DialogTitle>Ajouter un élément existant au menu</DialogTitle>
          <DialogDescription>
            Sélectionnez un élément générique et son parent pour l'ajouter au menu de ce rôle.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="select-generic-item">Élément générique à ajouter</Label>
            <SearchableDropdown
              value={selectedGenericItemToAdd}
              onValueChange={setSelectedGenericItemToAdd}
              options={availableGenericItemsOptions}
              placeholder="Sélectionner un élément..."
              searchPlaceholder="Rechercher un élément..."
              emptyMessage="Aucun élément disponible."
              iconMap={iconMap}
              popoverContentClassName="z-[999]"
            />
          </div>
          <div>
            <Label htmlFor="select-parent-for-new-item">Parent (optionnel)</Label>
            <SearchableDropdown
              value={selectedParentForNewItem}
              onValueChange={setSelectedParentForNewItem}
              options={availableParentsOptions}
              placeholder="Sélectionner un parent..."
              searchPlaceholder="Rechercher un parent..."
              emptyMessage="Aucun parent trouvé."
              iconMap={iconMap}
              popoverContentClassName="z-[999]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAddExistingItem} disabled={isAdding || !selectedGenericItemToAdd}>
            {isAdding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />} Ajouter l'élément
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddExistingNavItemDialog;