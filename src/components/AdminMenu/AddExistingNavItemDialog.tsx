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
import { PlusCircle, Loader2, Home, Info, Search as SearchIcon, ArrowLeft, XCircle } from "lucide-react"; // Import SearchIcon, ArrowLeft, XCircle
import { NavItem, Profile, RoleNavItemConfig } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import { addRoleNavItemConfig, updateRoleNavItemConfig } from "@/lib/navItems";
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input'; // Import Input
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Import Card components
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea

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

// Helper function to get item type label
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
}: AddExistingNavItemDialogProps) => {
  const [selectedGenericItemToAdd, setSelectedGenericItemToAdd] = useState<string | null>(null);
  const [selectedGenericItemInfo, setSelectedGenericItemInfo] = useState<({ isConfiguredAsRoot: boolean } & NavItem) | null>(null); // Store full info
  const [selectedParentForNewItem, setSelectedParentForNewItem] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [genericItemSearchQuery, setGenericItemSearchQuery] = useState('');
  const [parentSearchQuery, setParentSearchQuery] = useState('');

  // Reset states when dialog opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedGenericItemToAdd(null);
      setSelectedGenericItemInfo(null);
      setSelectedParentForNewItem(null);
      setIsAdding(false);
      setGenericItemSearchQuery('');
      setParentSearchQuery('');
    }
  }, [isOpen]);

  const availableGenericItemsOptions = useMemo(() => {
    const itemsNotYetConfigured = allGenericNavItems.filter(
      item => !allConfiguredItemsFlat.some(configured => configured.id === item.id)
    );

    const configuredRootItems = allConfiguredItemsFlat.filter(
      item => item.parent_nav_item_id === null || item.parent_nav_item_id === undefined
    );

    const combinedItems = [...itemsNotYetConfigured, ...configuredRootItems];

    const filtered = combinedItems.filter(item =>
      item.label.toLowerCase().includes(genericItemSearchQuery.toLowerCase())
    );
      
    return filtered.map(item => ({
        ...item,
        isConfiguredAsRoot: allConfiguredItemsFlat.some(configured => configured.id === item.id && (configured.parent_nav_item_id === null || configured.parent_nav_item_id === undefined)),
      }));
  }, [allGenericNavItems, allConfiguredItemsFlat, genericItemSearchQuery]);

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
    
    // Apply search filter
    const lowerCaseQuery = parentSearchQuery.toLowerCase();
    return [
      { id: 'none', label: 'Aucun (élément racine)', icon_name: 'Home', level: 0, isNew: false },
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

      const selectedItemInfo = availableGenericItemsOptions.find(opt => opt.id === selectedGenericItemToAdd);
      const isNewConfiguration = selectedItemInfo?.isNew; // Check if it's a truly new configuration

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

      if (isNewConfiguration) {
        // Add a new configuration for the selected generic item
        const newConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'> = {
          nav_item_id: genericItem.id,
          role: selectedRoleFilter,
          parent_nav_item_id: finalParentId,
          order_index: 9999, // Will be re-indexed by fetchAndStructureNavItems
        };
        await addRoleNavItemConfig(newConfig);
        showSuccess(`'${genericItem.label}' ajouté au menu du rôle !`);
      } else {
        // Update existing configuration (re-parenting)
        const existingConfig = allConfiguredItemsFlat.find(item => item.id === genericItem.id);
        if (!existingConfig || !existingConfig.configId) {
          showError("Configuration existante introuvable pour la mise à jour.");
          setIsAdding(false);
          return;
        }
        const updatedConfig: Omit<RoleNavItemConfig, 'created_at' | 'updated_at'> = {
          id: existingConfig.configId,
          nav_item_id: genericItem.id,
          role: selectedRoleFilter,
          parent_nav_item_id: finalParentId,
          order_index: 9999, // Will be re-indexed by fetchAndStructureNavItems
        };
        await updateRoleNavItemConfig(updatedConfig);
        showSuccess(`'${genericItem.label}' déplacé dans le menu du rôle !`);
      }

      onItemAdded(); // Trigger refresh in parent
      onClose();
    } catch (error: any) {
      console.error("Error adding existing nav item to role menu:", error);
      showError(`Erreur lors de l'ajout de l'élément au menu du rôle: ${error.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  const isAddButtonDisabled = isAdding || !selectedGenericItemInfo || !selectedParentForNewItem;

  const handleSelectGenericItem = (item: ({ isConfiguredAsRoot: boolean } & NavItem)) => {
    setSelectedGenericItemToAdd(item.id);
    setSelectedGenericItemInfo(item);
    // Pre-select current parent if it's already configured
    if (item.isConfiguredAsRoot && item.parent_nav_item_id) {
      setSelectedParentForNewItem(item.parent_nav_item_id);
    } else {
      setSelectedParentForNewItem('none'); // Default to root if not configured or already root
    }
  };

  const handleCancelSelection = () => {
    setSelectedGenericItemToAdd(null);
    setSelectedGenericItemInfo(null);
    setSelectedParentForNewItem(null);
    setGenericItemSearchQuery('');
    setParentSearchQuery('');
  };

  const IconComponent = selectedGenericItemInfo?.icon_name ? (iconMap[selectedGenericItemInfo.icon_name] || Info) : Info;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-svh sm:max-w-[600px] sm:h-auto bg-card z-[100] rounded-android-tile"> {/* Apply responsive dimensions */}
        <DialogHeader>
          <DialogTitle>Ajouter un élément existant au menu</DialogTitle>
          <DialogDescription>
            Sélectionnez un élément générique et son parent pour l'ajouter au menu de ce rôle.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!selectedGenericItemInfo ? (
            // Step 1: Select Generic Item
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
                      Aucun élément disponible à ajouter ou à re-parenté.
                    </p>
                  ) : (
                    availableGenericItemsOptions.map(item => {
                      const ItemIcon = iconMap[item.icon_name || 'Info'] || Info;
                      return (
                        <Card key={item.id} className="flex items-center justify-between p-3 rounded-android-tile">
                          <div className="flex items-center gap-3 select-none"> {/* Added select-none */}
                            <ItemIcon className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{item.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {getItemTypeLabel(item.type)} {item.route && `(${item.route})`}
                                {item.isConfiguredAsRoot && <span className="ml-2 italic">(Actuellement racine)</span>}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleSelectGenericItem(item)}>
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
            // Step 2: Choose Parent for Selected Item
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
                    <IconComponent className="h-5 w-5 text-primary" /> {selectedGenericItemInfo.label}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {getItemTypeLabel(selectedGenericItemInfo.type)} {selectedGenericItemInfo.route && `(${selectedGenericItemInfo.route})`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 text-sm text-muted-foreground">
                  {selectedGenericItemInfo.description || "Aucune description."}
                </CardContent>
              </Card>

              <div>
                <Label htmlFor="parent-search-input" className="mb-2 block">Rechercher un parent</Label>
                <Input
                  id="parent-search-input"
                  placeholder="Rechercher un parent..."
                  value={parentSearchQuery}
                  onChange={(e) => setParentSearchQuery(e.target.value)}
                  className="mb-2 rounded-android-tile"
                />
                <SearchableDropdown
                  value={selectedParentForNewItem}
                  onValueChange={setSelectedParentForNewItem}
                  options={availableParentsOptions}
                  placeholder="Sélectionner un parent..."
                  emptyMessage="Aucun parent trouvé."
                  iconMap={iconMap}
                  popoverContentClassName="z-[999] rounded-android-tile"
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleAddExistingItem} disabled={isAddButtonDisabled}>
            {isAdding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />} Ajouter l'élément
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddExistingNavItemDialog;