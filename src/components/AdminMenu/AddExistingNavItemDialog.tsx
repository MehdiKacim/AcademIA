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
import { PlusCircle, Loader2, Home, Info, Search as SearchIcon, ArrowLeft, XCircle, Check, Code } from "lucide-react";
import { NavItem, Profile, RoleNavItemConfig } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import { addRoleNavItemConfig, updateRoleNavItemConfig } from "@/lib/navItems";
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import SimpleItemSelector from '@/components/ui/SimpleItemSelector';

interface AddExistingNavItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoleFilter: Profile['role'];
  allGenericNavItems: NavItem[];
  allConfiguredItemsFlat: NavItem[];
  onItemAdded: () => void;
  getDescendantIds: (item: NavItem, allItemsFlat: NavItem[]) => Set<string>;
  getAncestorIds: (itemId: string, allItemsFlat: NavItem[]) => Set<string>; // New prop
  iconMap: { [key: string]: React.ElementType };
  defaultParentId?: string | null;
}

const getItemTypeLabel = (type: NavItem['type']) => {
  switch (type) {
    case 'route': return "Route";
    case 'category_or_action': return "Catégorie/Action";
    default: return "Inconnu";
  }
};

const AddExistingNavItemDialog = ({
  isOpen,
  onClose,
  selectedRoleFilter,
  allGenericNavItems,
  allConfiguredItemsFlat,
  onItemAdded,
  getDescendantIds,
  getAncestorIds, // New prop
  iconMap,
  defaultParentId,
}: AddExistingNavItemDialogProps) => {
  const [selectedGenericItemToAdd, setSelectedGenericItemToAdd] = useState<string | null>(null);
  const [selectedParentForNewItem, setSelectedParentForNewItem] = useState<string | null>(defaultParentId === null ? 'none' : defaultParentId || null);
  const [isAdding, setIsAdding] = useState(false);
  const [genericItemSearchQuery, setGenericItemSearchQuery] = useState('');
  const [parentSearchQuery, setParentSearchQuery] = useState('');

  const selectedGenericItemInfo = useMemo(() => {
    if (!selectedGenericItemToAdd) return null;
    const item = allGenericNavItems.find(item => item.id === selectedGenericItemToAdd);
    if (!item) return null;
    const isConfiguredForRole = allConfiguredItemsFlat.some(configured => configured.id === item.id);
    return { ...item, isNew: !isConfiguredForRole };
  }, [selectedGenericItemToAdd, allGenericNavItems, allConfiguredItemsFlat]);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedGenericItemToAdd(null);
      setSelectedParentForNewItem(defaultParentId === null ? 'none' : defaultParentId || null);
      setIsAdding(false);
      setGenericItemSearchQuery('');
      setParentSearchQuery('');
    }
  }, [isOpen, defaultParentId]);

  const availableGenericItemsOptions = useMemo(() => {
    const configuredGenericItemIds = new Set(allConfiguredItemsFlat.map(item => item.id));

    const filtered = allGenericNavItems.filter(
      item => !configuredGenericItemIds.has(item.id)
    );

    const sorted = filtered.sort((a, b) => a.label.localeCompare(b.label));

    return sorted.map(item => ({
      id: item.id,
      label: item.label,
      icon_name: item.icon_name,
      description: item.description,
      isNew: true, // These are always 'new' to the role config
      typeLabel: getItemTypeLabel(item.type),
    }));
  }, [allGenericNavItems, allConfiguredItemsFlat]);

  const availableParentsOptions = useMemo(() => {
    const potentialParents: { id: string; label: string; level: number; icon_name?: string; typeLabel: string; isNew: boolean; description?: string }[] = [];

    // Exclude the item being added itself from being a parent
    const itemBeingAdded = allGenericNavItems.find(item => item.id === selectedGenericItemToAdd);
    const descendantsOfItemBeingAdded = itemBeingAdded ? getDescendantIds(itemBeingAdded, allGenericNavItems) : new Set<string>();
    const ancestorsOfItemBeingAdded = itemBeingAdded ? getAncestorIds(itemBeingAdded.id, allGenericNavItems) : new Set<string>();

    allConfiguredItemsFlat.forEach(item => {
      const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);
      const isNotSelf = item.id !== selectedGenericItemToAdd;
      const isNotDescendant = !descendantsOfItemBeingAdded.has(item.id);
      const isNotAncestor = !ancestorsOfItemBeingAdded.has(item.id);

      if (isCategory && isNotSelf && isNotDescendant && isNotAncestor) {
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
          description: item.description,
        });
      }
    });

    const configuredItemIds = new Set(allConfiguredItemsFlat.map(item => item.id));
    allGenericNavItems.forEach(item => {
      const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);
      const isNotConfiguredForRole = !configuredItemIds.has(item.id);
      const isNotSelf = item.id !== selectedGenericItemToAdd;
      const isNotDescendant = !descendantsOfItemBeingAdded.has(item.id);
      const isNotAncestor = !ancestorsOfItemBeingAdded.has(item.id);

      if (isCategory && isNotConfiguredForRole && isNotSelf && isNotDescendant && isNotAncestor) {
        potentialParents.push({
          id: item.id,
          label: item.label,
          level: 0,
          icon_name: item.icon_name,
          typeLabel: getItemTypeLabel(item.type),
          isNew: true,
          description: item.description,
        });
      }
    });

    const sortedParents = potentialParents.sort((a, b) => a.label.localeCompare(b.label));
    
    return [
      { id: 'none', label: 'Aucun (élément racine)', icon_name: 'Home', level: 0, isNew: false, typeLabel: 'Catégorie/Action', description: "L'élément sera affiché au premier niveau du menu." },
      ...sortedParents
    ];
  }, [selectedGenericItemToAdd, allConfiguredItemsFlat, allGenericNavItems, getDescendantIds, getAncestorIds, parentSearchQuery]);

  const handleAddExistingItem = async () => {
    if (!selectedGenericItemInfo) {
      showError("Veuillez sélectionner un élément générique à ajouter.");
      return;
    }

    setIsAdding(true);
    try {
      const genericItem = allGenericNavItems.find(item => item.id === selectedGenericItemInfo.id);
      if (!genericItem) {
        showError("Élément générique introuvable.");
        setIsAdding(false);
        return;
      }

      let finalParentId: string | null = selectedParentForNewItem === 'none' ? null : selectedParentForNewItem;

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

      const newConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'> = {
        nav_item_id: genericItem.id,
        role: selectedRoleFilter,
        parent_nav_item_id: finalParentId,
        order_index: 9999,
      };
      await addRoleNavItemConfig(newConfig);
      showSuccess(`'${genericItem.label}' ajouté au menu du rôle !`);

      onItemAdded();
      onClose();
    } catch (error: any) {
      console.error("Error adding existing nav item to role menu:", error);
      showError(`Erreur lors de l'ajout de l'élément au menu du rôle: ${error.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  const isAddButtonDisabled = isAdding || !selectedGenericItemToAdd || !selectedParentForNewItem;

  const handleSelectGenericItem = (id: string | null) => {
    setSelectedGenericItemToAdd(id);
    if (defaultParentId === undefined && id !== null) {
      setSelectedParentForNewItem('none');
    }
  };

  const handleCancelSelection = () => {
    setSelectedGenericItemToAdd(null);
    setSelectedParentForNewItem(defaultParentId === null ? 'none' : defaultParentId || null);
    setGenericItemSearchQuery('');
    setParentSearchQuery('');
  };

  const ItemIconComponent = selectedGenericItemInfo?.icon_name ? (iconMap[selectedGenericItemInfo.icon_name] || Info) : Info;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-svh sm:max-w-[600px] sm:h-auto bg-card z-[100] rounded-android-tile">
        <div className="flex flex-col h-full">
          <DialogHeader>
            <DialogTitle>Ajouter un élément existant au menu</DialogTitle>
            <DialogDescription>
              Sélectionnez un élément générique et son parent pour l'ajouter au menu de ce rôle.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 flex-grow">
            {!selectedGenericItemToAdd ? (
              <div className="space-y-4">
                <Label htmlFor="generic-item-selector">1. Rechercher et sélectionner un élément générique</Label>
                <SimpleItemSelector
                  id="generic-item-selector"
                  options={availableGenericItemsOptions}
                  value={selectedGenericItemToAdd}
                  onValueChange={handleSelectGenericItem}
                  searchQuery={genericItemSearchQuery}
                  onSearchQueryChange={setGenericItemSearchQuery}
                  placeholder="Rechercher un élément..."
                  emptyMessage="Aucun élément disponible à ajouter."
                  iconMap={iconMap}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>2. Choisir le parent pour l'élément sélectionné</Label>
                  <Button variant="ghost" size="sm" onClick={handleCancelSelection}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Annuler la sélection
                  </Button>
                </div>
                <Card className="p-3 rounded-android-tile bg-muted/20">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ItemIconComponent className="h-5 w-5 text-primary" /> {selectedGenericItemInfo?.label}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {getItemTypeLabel(selectedGenericItemInfo?.type || 'route')} {selectedGenericItemInfo?.route && `(${selectedGenericItemInfo.route})`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 text-sm text-muted-foreground">
                    {selectedGenericItemInfo?.description || "Aucune description."}
                  </CardContent>
                </Card>

                <div>
                  <Label htmlFor="parent-selector" className="mb-2 block">Rechercher un parent</Label>
                  <SimpleItemSelector
                    id="parent-selector"
                    options={availableParentsOptions}
                    value={selectedParentForNewItem}
                    onValueChange={setSelectedParentForNewItem}
                    searchQuery={parentSearchQuery}
                    onSearchQueryChange={setParentSearchQuery}
                    placeholder="Sélectionner un parent..."
                    emptyMessage="Aucun parent trouvé."
                    iconMap={iconMap}
                  />
                  {selectedParentForNewItem === 'none' && (
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                      <Info className="h-4 w-4" /> Cet élément sera ajouté à la racine du menu.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleAddExistingItem} disabled={isAddButtonDisabled}>
              {isAdding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />} Ajouter l'élément
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddExistingNavItemDialog;