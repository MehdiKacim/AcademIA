import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import SimpleItemSelector from '@/components/ui/SimpleItemSelector'; // Import the new component

interface EditRoleConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfigToEdit: RoleNavItemConfig | null;
  currentItemToEdit: NavItem | null;
  selectedRoleFilter: Profile['role'];
  allGenericNavItems: NavItem[];
  allConfiguredItemsFlat: NavItem[];
  onSave: () => void;
  getDescendantIds: (item: NavItem, allItemsFlat: NavItem[]) => Set<string>;
  iconMap: { [key: string]: React.ElementType };
  popoverContentClassName?: string;
}

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
  popoverContentClassName,
}: EditRoleConfigDialogProps) => {
  const [selectedParentForEdit, setSelectedParentForEdit] = useState<string | null>(null);
  const [editConfigOrderIndex, setEditConfigOrderIndex] = useState(0);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [parentSearchQuery, setParentSearchQuery] = useState('');

  const [isParentSelectionStep, setIsParentSelectionStep] = useState(true);

  useEffect(() => {
    if (isOpen && currentConfigToEdit && currentItemToEdit) {
      setSelectedParentForEdit(currentConfigToEdit.parent_nav_item_id || null);
      setEditConfigOrderIndex(currentConfigToEdit.order_index);
      setIsSavingEdit(false);
      setParentSearchQuery('');
      setIsParentSelectionStep(true);
    }
  }, [isOpen, currentConfigToEdit, currentItemToEdit]);

  const availableParentsOptions = useMemo(() => {
    if (!currentItemToEdit) return [];

    const descendantsOfCurrentItem = getDescendantIds(currentItemToEdit, allConfiguredItemsFlat);
    const configuredItemIds = new Set(allConfiguredItemsFlat.map(item => item.id));

    const potentialParents: { id: string; label: string; level: number; icon_name?: string; typeLabel: string; isNew: boolean; description?: string }[] = [];

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
          isNew: false,
          description: item.description,
        });
      }
    });

    allGenericNavItems.forEach(item => {
      const isCategory = item.type === 'category_or_action' && (item.route === null || item.route === undefined);
      const isNotConfiguredForRole = !configuredItemIds.has(item.id);
      const isNotSelf = item.id !== currentItemToEdit.id;
      const isNotDescendant = !descendantsOfCurrentItem.has(item.id);

      if (isCategory && isNotConfiguredForRole && isNotSelf && isNotDescendant) {
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
  }, [currentItemToEdit, allConfiguredItemsFlat, allGenericNavItems, getDescendantIds, parentSearchQuery]);

  const handleSaveEditedRoleConfig = async () => {
    if (!currentConfigToEdit || !currentItemToEdit) return;

    setIsSavingEdit(true);
    try {
      let finalParentId: string | null = selectedParentForEdit === 'none' ? null : selectedParentForEdit;

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
      onSave();
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
    setIsParentSelectionStep(false);
  };

  const handleCancelParentSelection = () => {
    setSelectedParentForEdit(null);
    setIsParentSelectionStep(true);
  };

  if (!currentConfigToEdit || !currentItemToEdit) return null;

  const ItemIcon = currentItemToEdit.icon_name ? (iconMap[currentItemToEdit.icon_name] || Info) : Info;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-svh sm:max-w-[600px] sm:h-auto bg-card z-[100] rounded-android-tile">
        <div className="flex flex-col h-full">
          <DialogHeader>
            <DialogTitle>Modifier la configuration de "{currentItemToEdit.label}" pour {selectedRoleFilter}</DialogTitle>
            <DialogDescription>
              Ajustez la position et le parent de cet élément dans le menu de ce rôle.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 flex-grow">
            {isParentSelectionStep ? (
              <div className="space-y-4">
                <Label htmlFor="parent-selector">1. Rechercher et sélectionner un parent</Label>
                <SimpleItemSelector
                  id="parent-selector"
                  options={availableParentsOptions}
                  value={selectedParentForEdit}
                  onValueChange={handleSelectParent}
                  searchQuery={parentSearchQuery}
                  onSearchQueryChange={setParentSearchQuery}
                  placeholder="Sélectionner un parent..."
                  emptyMessage="Aucun parent disponible."
                  iconMap={iconMap}
                />
              </div>
            ) : (
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

                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
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