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
import { PlusCircle, Loader2, Home, Info, Search as SearchIcon, ArrowLeft, XCircle, Check } from "lucide-react";
import { NavItem, Profile, RoleNavItemConfig } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import { addRoleNavItemConfig, updateRoleNavItemConfig } from "@/lib/navItems";
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddExistingNavItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoleFilter: Profile['role'];
  allGenericNavItems: NavItem[];
  allConfiguredItemsFlat: NavItem[];
  onItemAdded: () => void;
  getDescendantIds: (item: NavItem, allItemsFlat: NavItem[]) => Set<string>;
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
  iconMap,
  defaultParentId,
}: AddExistingNavItemDialogProps) => {
  const [selectedGenericItemToAdd, setSelectedGenericItemToAdd] = useState<string | null>(null);
  // selectedGenericItemInfo est maintenant un useMemo
  const [selectedParentForNewItem, setSelectedParentForNewItem] = useState<string | null>(defaultParentId === null ? 'none' : defaultParentId || null);
  const [isAdding, setIsAdding] = useState(false);
  const [genericItemSearchQuery, setGenericItemSearchQuery] = useState('');
  const [parentSearchQuery, setParentSearchQuery] = useState('');

  // Refactorisation: selectedGenericItemInfo est maintenant un useMemo
  const selectedGenericItemInfo = useMemo(() => {
    if (!selectedGenericItemToAdd) return null;
    const item = allGenericNavItems.find(item => item.id === selectedGenericItemToAdd);
    if (!item) return null;
    const isConfiguredAsRoot = allConfiguredItemsFlat.some(configured => configured.id === item.id && configured.parent_nav_item_id === null);
    return { ...item, isConfiguredAsRoot, isNew: !allConfiguredItemsFlat.some(configured => configured.id === item.id) };
  }, [selectedGenericItemToAdd, allGenericNavItems, allConfiguredItemsFlat]);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedGenericItemToAdd(null);
      setSelectedParentForNewItem(defaultParentId === null ? 'none' : defaultParentId || null);
      setIsAdding(false);
      setGenericItemSearchQuery('');
      setParentSearchQuery('');
      console.log("[AddExistingNavItemDialog] Dialog opened. Available generic items options:", availableGenericItemsOptions);
    }
  }, [isOpen, defaultParentId]);

  const availableGenericItemsOptions = useMemo(() => {
    const configuredGenericItemIds = new Set(allConfiguredItemsFlat.map(item => item.id));

    const filtered = allGenericNavItems.filter(
      item => !configuredGenericItemIds.has(item.id)
    );

    const sorted = filtered.sort((a, b) => a.label.localeCompare(b.label));

    const lowerCaseQuery = genericItemSearchQuery.toLowerCase();
    return sorted.filter(item =>
      item.label.toLowerCase().includes(lowerCaseQuery)
    ).map(item => ({
      ...item,
      isConfiguredAsRoot: false,
      isNew: true,
      typeLabel: getItemTypeLabel(item.type), // Ajout de typeLabel
    }));
  }, [allGenericNavItems, allConfiguredItemsFlat, genericItemSearchQuery]);

  const availableParentsOptions = useMemo(() => {
    const potentialParents: { id: string; label: string; level: number; icon_name?: string; typeLabel: string; isNew: boolean }[] = [];

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
    
    const lowerCaseQuery = parentSearchQuery.toLowerCase();
    return [
      { id: 'none', label: 'Aucun (élément racine)', icon_name: 'Home', level: 0, isNew: false, typeLabel: 'Catégorie/Action' },
      ...sortedParents.filter(p => p.label.toLowerCase().includes(lowerCaseQuery))
    ];
  }, [allConfiguredItemsFlat, allGenericNavItems, parentSearchQuery]);

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
    console.log("[AddExistingNavItemDialog] handleSelectGenericItem called with ID:", id);
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

  const IconComponent = selectedGenericItemInfo?.icon_name ? (iconMap[selectedGenericItemInfo.icon_name] || Info) : Info;

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
                <Label htmlFor="generic-item-search-input">1. Rechercher et sélectionner un élément générique</Label>
                <Input
                  id="generic-item-search-input"
                  placeholder="Rechercher un élément..."
                  value={genericItemSearchQuery}
                  onChange={(e) => setGenericItemSearchQuery(e.target.value)}
                  className="mb-2 rounded-android-tile"
                />
                <ScrollArea className="h-64 w-full rounded-md border">
                  <div className="p-2 space-y-2">
                    {availableGenericItemsOptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucun élément disponible à ajouter.
                      </p>
                    ) : (
                      <SearchableDropdown
                        value={selectedGenericItemToAdd}
                        onValueChange={handleSelectGenericItem}
                        options={availableGenericItemsOptions.map(item => ({
                          id: item.id,
                          label: item.label,
                          icon_name: item.icon_name,
                          level: 0,
                          isNew: item.isNew, // Corrected: pass item.isNew
                          typeLabel: getItemTypeLabel(item.type), // Pass typeLabel
                        }))}
                        placeholder="Sélectionner un élément..."
                        emptyMessage="Aucun élément disponible à ajouter."
                        iconMap={iconMap}
                        popoverContentClassName="z-[9999]"
                      />
                    )}
                  </div>
                </ScrollArea>
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
                      <IconComponent className="h-5 w-5 text-primary" /> {selectedGenericItemInfo?.label}
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
                  <Label htmlFor="parent-search-input" className="mb-2 block">Rechercher un parent</Label>
                  <SearchableDropdown
                    value={selectedParentForNewItem}
                    onValueChange={setSelectedParentForNewItem}
                    options={availableParentsOptions}
                    placeholder="Sélectionner un parent..."
                    emptyMessage="Aucun parent trouvé."
                    iconMap={iconMap}
                    disabled={false}
                    popoverContentClassName="z-[9999]"
                  />
                  {defaultParentId === null && (
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