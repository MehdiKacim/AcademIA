import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, ChevronDown, ChevronUp, Link as LinkIcon, ExternalLink, Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, Globe, Loader2 } from "lucide-react";
import { NavItem, Profile } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import { loadAllNavItemsRaw, addNavItem, updateNavItem, deleteNavItem } from "@/lib/navItems";
import { useRole } from '@/contexts/RoleContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea }
 from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils'; // Import cn for conditional styling

// Map icon_name strings to Lucide React components
const iconMap: { [key: string]: React.ElementType } = {
  Home, MessageSquare, Search, User, LogOut, Settings, Info, BookOpen, PlusSquare, Users, GraduationCap, PenTool, NotebookText, School, LayoutList, BriefcaseBusiness, UserRoundCog, ClipboardCheck, BotMessageSquare, LayoutDashboard, LineChart, UsersRound, UserRoundSearch, BellRing, Building2, BookText, UserCog, TrendingUp, BookMarked, CalendarDays, UserCheck, LinkIcon, ExternalLink, Globe
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

const GenericNavItemsPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const [allGenericNavItems, setAllGenericNavItems] = useState<NavItem[]>([]);
  const [isNewItemFormOpen, setIsNewItemFormOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState(''); // New state for search filter

  // States for new generic item form
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemRoute, setNewItemRoute] = useState('');
  const [newItemIconName, setNewItemIconName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemIsExternal, setNewItemIsExternal] = useState(false);
  const [newItemType, setNewItemType] = useState<NavItem['type']>('route');
  const [isAddingItem, setIsAddingItem] = useState(false);

  // States for edit dialog (for generic nav item properties)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentItemToEdit, setCurrentItemToEdit] = useState<NavItem | null>(null);
  const [editItemLabel, setEditItemLabel] = useState('');
  const [editItemRoute, setEditItemRoute] = useState('');
  const [editItemIconName, setEditItemIconName] = useState('');
  const [editItemDescription, setEditItemDescription] = useState('');
  const [editItemIsExternal, setEditItemIsExternal] = useState(false);
  const [editItemType, setEditItemType] = useState<NavItem['type']>('route');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchGenericNavItems = useCallback(async () => {
    try {
      const items = await loadAllNavItemsRaw();
      setAllGenericNavItems(items);
    } catch (error: any) {
      console.error("Error loading generic nav items:", error);
      showError(`Erreur lors du chargement des éléments génériques: ${error.message}`);
    }
  }, []);

  useEffect(() => {
    fetchGenericNavItems();
  }, [fetchGenericNavItems]);

  const handleAddGenericNavItem = async () => {
    if (!newItemLabel.trim()) {
      showError("Le libellé est requis.");
      return;
    }
    if (newItemType === 'route' && !newItemRoute.trim()) {
      showError("Une route est requise pour un élément de type 'Route'.");
      return;
    }

    setIsAddingItem(true);
    try {
      const newItemData: Omit<NavItem, 'id' | 'created_at' | 'updated_at' | 'children' | 'badge' | 'configId' | 'parent_nav_item_id' | 'order_index' | 'is_global'> = {
        label: newItemLabel.trim(),
        route: newItemRoute.trim() || null,
        description: newItemDescription.trim() || null,
        is_external: newItemIsExternal,
        icon_name: newItemIconName || null,
        type: newItemType,
      };
      await addNavItem(newItemData);
      showSuccess("Élément de navigation générique ajouté !");

      await fetchGenericNavItems();
      // Reset form
      setNewItemLabel('');
      setNewItemRoute('');
      setNewItemIconName('');
      setNewItemDescription('');
      setNewItemIsExternal(false);
      setNewItemType('route');
      setIsNewItemFormOpen(false);
    } catch (error: any) {
      console.error("Error adding generic nav item:", error);
      showError(`Erreur lors de l'ajout de l'élément générique: ${error.message}`);
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteGenericNavItem = async (navItemId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet élément de navigation générique ? Cela supprimera toutes ses configurations de rôle associées. Cette action est irréversible.")) {
      try {
        await deleteNavItem(navItemId);
        showSuccess("Élément de navigation générique supprimé !");
        await fetchGenericNavItems();
      } catch (error: any) {
        console.error("Error deleting generic nav item:", error);
        showError(`Erreur lors de la suppression de l'élément générique: ${error.message}`);
      }
    }
  };

  const handleEditGenericNavItem = (item: NavItem) => {
    setCurrentItemToEdit(item);
    setEditItemLabel(item.label);
    setEditItemRoute(item.route || '');
    setEditItemIconName(item.icon_name || '');
    setEditItemDescription(item.description || '');
    setEditItemIsExternal(item.is_external);
    setEditItemType(item.type);
    setIsEditDialogOpen(true);
  };

  const handleSaveEditedGenericNavItem = async () => {
    if (!currentItemToEdit) return;
    if (!editItemLabel.trim()) {
      showError("Le libellé est requis.");
      return;
    }
    if (editItemType === 'route' && !editItemRoute.trim()) {
      showError("Une route est requise pour un élément de type 'Route'.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const updatedItemData: Omit<NavItem, 'created_at' | 'updated_at' | 'children' | 'badge' | 'configId' | 'parent_nav_item_id' | 'order_index' | 'is_global'> = {
        id: currentItemToEdit.id,
        label: editItemLabel.trim(),
        route: editItemRoute.trim() || null,
        description: editItemDescription.trim() || null,
        is_external: editItemIsExternal,
        icon_name: editItemIconName || null,
        type: editItemType,
      };
      await updateNavItem(updatedItemData);
      showSuccess("Élément de navigation générique mis à jour !");
      await fetchGenericNavItems();
      setIsEditDialogOpen(false);
      setCurrentItemToEdit(null);
    } catch (error: any) {
      console.error("Error updating generic nav item:", error);
      showError(`Erreur lors de la mise à jour de l'élément générique: ${error.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Chargement...
        </h1>
        <p className="text-lg text-muted-foreground">
          Veuillez patienter.
        </p>
      </div>
    );
  }

  if (!currentUserProfile || currentRole !== 'administrator') {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès Restreint
        </h1>
        <p className="text-lg text-muted-foreground">
          Seuls les administrateurs peuvent accéder à cette page.
        </p>
      </div>
    );
  }

  const lowerCaseSearchFilter = searchFilter.toLowerCase();

  const filteredGenericNavItems = allGenericNavItems.filter(item =>
    item.label.toLowerCase().includes(lowerCaseSearchFilter) ||
    (item.route && item.route.toLowerCase().includes(lowerCaseSearchFilter)) ||
    (item.description && item.description.toLowerCase().includes(lowerCaseSearchFilter)) ||
    (item.icon_name && item.icon_name.toLowerCase().includes(lowerCaseSearchFilter))
  );

  const routes = filteredGenericNavItems.filter(item => item.type === 'route').sort((a, b) => a.label.localeCompare(b.label));
  const categoriesAndActions = filteredGenericNavItems.filter(item => item.type === 'category_or_action').sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"> {/* Added responsive padding and max-width */}
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion des Éléments de Navigation Génériques
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Définissez les éléments de navigation de base disponibles pour tous les rôles.
      </p>

      <Card className="rounded-android-tile">
        <Collapsible open={isNewItemFormOpen} onOpenChange={setIsNewItemFormOpen}>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PlusCircle className="h-5 w-5 text-primary" /> Ajouter un nouvel élément générique
                </CardTitle>
                {isNewItemFormOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-item-label">Libellé</Label>
                  <Input id="new-item-label" value={newItemLabel} onChange={(e) => setNewItemLabel(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="new-item-type">Type d'élément</Label>
                  <Select value={newItemType} onValueChange={(value: NavItem['type']) => {
                    setNewItemType(value);
                    if (value === 'category_or_action') {
                      setNewItemIsExternal(false);
                    }
                  }}>
                    <SelectTrigger id="new-item-type" className="rounded-android-tile">
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-lg bg-background/80 rounded-android-tile">
                      <ScrollArea className="h-40">
                        {navItemTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {getItemTypeLabel(type)}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new-item-route">Route (URL interne ou #hash)</Label>
                  <Input id="new-item-route" value={newItemRoute} onChange={(e) => setNewItemRoute(e.target.value)} disabled={newItemType === 'category_or_action' && (newItemRoute === null || newItemRoute === undefined)} />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="new-item-is-external" checked={newItemIsExternal} onCheckedChange={setNewItemIsExternal} disabled={newItemType === 'category_or_action'} />
                  <Label htmlFor="new-item-is-external">Lien externe (ouvre dans un nouvel onglet)</Label>
                </div>
                <div>
                  <Label htmlFor="new-item-icon">Nom de l'icône (Lucide React)</Label>
                  <Select value={newItemIconName} onValueChange={setNewItemIconName}>
                    <SelectTrigger id="new-item-icon" className="rounded-android-tile">
                      <SelectValue placeholder="Sélectionner une icône" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-lg bg-background/80 rounded-android-tile">
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
                  <Label htmlFor="new-item-description">Description (optionnel)</Label>
                  <Textarea id="new-item-description" value={newItemDescription} onChange={(e) => setNewItemDescription(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleAddGenericNavItem} disabled={isAddingItem} className="mt-4">
                {isAddingItem ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />} Ajouter l'élément générique
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Card className="rounded-android-tile">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutList className="h-6 w-6 text-primary" /> Liste des éléments génériques
          </CardTitle>
          <CardDescription>Visualisez et gérez les définitions de base des éléments de navigation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Filtrer les éléments par libellé, route, description ou icône..."
              className="pl-10 rounded-android-tile"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Added grid for side-by-side */}
            {/* Categories/Actions Section (moved to first column) */}
            <Collapsible defaultOpen={true}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <LayoutList className="h-5 w-5 text-primary" /> Catégories / Actions ({categoriesAndActions.length})
                  </h3>
                  <ChevronDown className="h-5 w-5 collapsible-icon" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <ScrollArea className="h-[300px] w-full rounded-md border rounded-android-tile">
                  <div className="overflow-x-auto"> {/* Added overflow-x-auto here */}
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="sticky top-0 bg-background/80 backdrop-blur-lg border-b">
                          <th className="p-2 text-left font-semibold">Libellé</th>
                          <th className="p-2 text-left font-semibold">Route/Action</th>
                          <th className="p-2 text-left font-semibold">Icône</th>
                          <th className="p-2 text-left font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoriesAndActions.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-muted-foreground">Aucune catégorie/action générique à afficher.</td>
                          </tr>
                        ) : (
                          categoriesAndActions.map(item => {
                            const IconComponent = iconMap[item.icon_name || 'Info'] || Info;
                            return (
                              <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/20">
                                <td className="p-2">{item.label}</td>
                                <td className="p-2">{item.route || '-'} {item.is_external && <ExternalLink className="inline h-3 w-3 ml-1" />}</td>
                                <td className="p-2">
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="h-4 w-4" /> 
                                  </div>
                                </td>
                                <td className="p-2 flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleEditGenericNavItem(item)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteGenericNavItem(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>

            {/* Routes Section (moved to second column) */}
            <Collapsible defaultOpen={true}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-primary" /> Routes ({routes.length})
                  </h3>
                  <ChevronDown className="h-5 w-5 collapsible-icon" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <ScrollArea className="h-[300px] w-full rounded-md border rounded-android-tile">
                  <div className="overflow-x-auto"> {/* Added overflow-x-auto here */}
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="sticky top-0 bg-background/80 backdrop-blur-lg border-b">
                          <th className="p-2 text-left font-semibold">Libellé</th>
                          <th className="p-2 text-left font-semibold">Route</th>
                          <th className="p-2 text-left font-semibold">Icône</th>
                          <th className="p-2 text-left font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {routes.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-muted-foreground">Aucune route générique à afficher.</td>
                          </tr>
                        ) : (
                          routes.map(item => {
                            const IconComponent = iconMap[item.icon_name || 'Info'] || Info;
                            return (
                              <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/20">
                                <td className="p-2">{item.label}</td>
                                <td className="p-2">{item.route || '-'} {item.is_external && <ExternalLink className="inline h-3 w-3 ml-1" />}</td>
                                <td className="p-2">
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="h-4 w-4" /> 
                                  </div>
                                </td>
                                <td className="p-2 flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleEditGenericNavItem(item)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteGenericNavItem(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      {/* Edit Generic Nav Item Dialog */}
      {currentItemToEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-full h-svh sm:max-w-[600px] sm:h-auto backdrop-blur-lg bg-background/80 rounded-android-tile">
            <div className="flex flex-col h-full"> {/* Wrap children in a single div */}
              <DialogHeader>
                <DialogTitle>Modifier l'élément de navigation générique</DialogTitle>
                <DialogDescription>
                  Mettez à jour les détails de l'élément de navigation de base.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 flex-grow"> {/* Added flex-grow */}
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4"> {/* Adjusted grid for mobile */}
                  <Label htmlFor="edit-item-label" className="sm:text-right">Libellé</Label>
                  <Input id="edit-item-label" value={editItemLabel} onChange={(e) => setEditItemLabel(e.target.value)} className="sm:col-span-3" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4"> {/* Adjusted grid for mobile */}
                  <Label htmlFor="edit-item-type">Type d'élément</Label>
                  <Select value={editItemType} onValueChange={(value: NavItem['type']) => {
                    setEditItemType(value);
                    if (value === 'category_or_action') {
                      setEditItemIsExternal(false);
                    }
                  }}>
                    <SelectTrigger id="edit-item-type" className="sm:col-span-3 rounded-android-tile"> {/* Adjusted grid for mobile */}
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-lg bg-background/80 rounded-android-tile"> {/* Apply rounded-android-tile */}
                      <ScrollArea className="h-40">
                        {navItemTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {getItemTypeLabel(type)}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4"> {/* Adjusted grid for mobile */}
                  <Label htmlFor="edit-item-route" className="sm:text-right">Route</Label>
                  <Input id="edit-item-route" value={editItemRoute} onChange={(e) => setEditItemRoute(e.target.value)} className="sm:col-span-3" disabled={editItemType === 'category_or_action' && (editItemRoute === null || editItemRoute === undefined)} />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="edit-item-is-external" checked={editItemIsExternal} onCheckedChange={setEditItemIsExternal} className="sm:col-span-3" disabled={editItemType === 'category_or_action'} />
                  <Label htmlFor="edit-item-is-external">Lien externe (ouvre dans un nouvel onglet)</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4"> {/* Adjusted grid for mobile */}
                  <Label htmlFor="edit-item-icon">Icône</Label>
                  <Select value={editItemIconName} onValueChange={setEditItemIconName}>
                    <SelectTrigger id="edit-item-icon" className="sm:col-span-3 rounded-android-tile"> {/* Adjusted grid for mobile */}
                      <SelectValue placeholder="Sélectionner une icône" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-lg bg-background/80 rounded-android-tile"> {/* Apply rounded-android-tile */}
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
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4"> {/* Adjusted grid for mobile */}
                  <Label htmlFor="edit-item-description" className="sm:text-right">Description</Label>
                  <Textarea id="edit-item-description" value={editItemDescription} onChange={(e) => setEditItemDescription(e.target.value)} className="sm:col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveEditedGenericNavItem} disabled={isSavingEdit}>
                  {isSavingEdit ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Enregistrer les modifications"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default GenericNavItemsPage;