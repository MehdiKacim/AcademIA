import { supabase } from "@/integrations/supabase/client";
import { NavItem } from "./dataModels";
import { Profile } from "./dataModels"; // Import Profile for role type

/**
 * Récupère tous les éléments de navigation depuis Supabase, triés et structurés hiérarchiquement.
 * @param userRole Le rôle de l'utilisateur actuel pour filtrer les éléments autorisés.
 * @param unreadMessagesCount Le nombre de messages non lus pour mettre à jour le badge.
 * @returns Un tableau d'éléments de navigation de premier niveau avec leurs enfants.
 */
export const loadNavItems = async (userRole: Profile['role'] | null, unreadMessagesCount: number = 0): Promise<NavItem[]> => {
  const { data, error } = await supabase
    .from('nav_items')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    console.error("Error loading nav items:", error);
    return [];
  }

  const navItems: NavItem[] = data.map(item => ({
    id: item.id,
    label: item.label,
    route: item.route || undefined,
    icon_name: item.icon_name || undefined, // Changed from 'icon' to 'icon_name'
    is_root: item.is_root,
    allowed_roles: item.allowed_roles as Array<Profile['role']>,
    parent_id: item.parent_id || undefined,
    order_index: item.order_index,
    description: item.description || undefined,
    is_external: item.is_external,
    children: [], // Initialiser les enfants
  }));

  // Filtrer par rôle
  const filteredItems = navItems.filter(item => userRole && item.allowed_roles.includes(userRole));

  // Construire la structure hiérarchique
  const rootItems: NavItem[] = [];
  const childrenOf: { [key: string]: NavItem[] } = {};

  filteredItems.forEach(item => {
    if (item.parent_id) {
      if (!childrenOf[item.parent_id]) {
        childrenOf[item.parent_id] = [];
      }
      childrenOf[item.parent_id].push(item);
    } else {
      rootItems.push(item);
    }
  });

  // Attacher les enfants récursivement
  const attachChildren = (items: NavItem[]) => {
    items.forEach(item => {
      if (childrenOf[item.id]) {
        item.children = childrenOf[item.id].sort((a, b) => a.order_index - b.order_index);
        attachChildren(item.children);
      }
      // Mettre à jour le badge des messages si c'est l'élément "Messages"
      if (item.route === '/messages') {
        item.badge = unreadMessagesCount;
      }
    });
  };

  attachChildren(rootItems);

  return rootItems.sort((a, b) => a.order_index - b.order_index);
};

/**
 * Récupère tous les éléments de navigation depuis Supabase sans filtrage ni construction d'arbre.
 * Utile pour la gestion administrative où tous les éléments doivent être visibles.
 * @returns Un tableau plat de tous les éléments de navigation.
 */
export const loadAllNavItemsRaw = async (): Promise<NavItem[]> => {
  const { data, error } = await supabase
    .from('nav_items')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    console.error("Error loading all raw nav items:", error);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    label: item.label,
    route: item.route || undefined,
    icon_name: item.icon_name || undefined,
    is_root: item.is_root,
    allowed_roles: item.allowed_roles as Array<Profile['role']>,
    parent_id: item.parent_id || undefined,
    order_index: item.order_index,
    description: item.description || undefined,
    is_external: item.is_external,
    children: [], // Children are not built in this raw load
  }));
};

/**
 * Ajoute un nouvel élément de navigation.
 * @param newItem L'objet NavItem à ajouter (sans l'ID).
 * @returns L'élément de navigation ajouté.
 */
export const addNavItem = async (newItem: Omit<NavItem, 'id' | 'created_at' | 'updated_at' | 'children' | 'badge'>): Promise<NavItem | null> => {
  const { data, error } = await supabase
    .from('nav_items')
    .insert({
      label: newItem.label,
      route: newItem.route || null,
      icon_name: newItem.icon_name || null, // Changed from 'icon' to 'icon_name'
      is_root: newItem.is_root,
      allowed_roles: newItem.allowed_roles,
      parent_id: newItem.parent_id || null,
      order_index: newItem.order_index,
      description: newItem.description || null,
      is_external: newItem.is_external,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding nav item:", error);
    throw error;
  }
  return data as NavItem;
};

/**
 * Met à jour un élément de navigation existant.
 * @param updatedItem L'objet NavItem avec les données mises à jour.
 * @returns L'élément de navigation mis à jour.
 */
export const updateNavItem = async (updatedItem: Omit<NavItem, 'created_at' | 'updated_at' | 'children' | 'badge'>): Promise<NavItem | null> => {
  const { data, error } = await supabase
    .from('nav_items')
    .update({
      label: updatedItem.label,
      route: updatedItem.route || null,
      icon_name: updatedItem.icon_name || null, // Changed from 'icon' to 'icon_name'
      is_root: updatedItem.is_root,
      allowed_roles: updatedItem.allowed_roles,
      parent_id: updatedItem.parent_id || null,
      order_index: updatedItem.order_index,
      description: updatedItem.description || null,
      is_external: updatedItem.is_external,
      updated_at: new Date().toISOString(),
    })
    .eq('id', updatedItem.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating nav item:", error);
    throw error;
  }
  return data as NavItem;
};

/**
 * Supprime un élément de navigation.
 * @param navItemId L'ID de l'élément de navigation à supprimer.
 */
export const deleteNavItem = async (navItemId: string): Promise<void> => {
  const { error } = await supabase
    .from('nav_items')
    .delete()
    .eq('id', navItemId);

  if (error) {
    console.error("Error deleting nav item:", error);
    throw error;
  }
};

/**
 * Récupère un seul élément de navigation par son ID.
 * @param id L'ID de l'élément de navigation.
 * @returns L'élément de navigation ou null.
 */
export const getNavItemById = async (id: string): Promise<NavItem | null> => {
  const { data, error } = await supabase
    .from('nav_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error("Error fetching nav item by ID:", error);
    return null;
  }
  return data as NavItem;
};

/**
 * Réinitialise la table nav_items (pour le développement/test).
 */
export const resetNavItems = async (): Promise<void> => {
  const { error } = await supabase.from('nav_items').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except a dummy ID if needed
  if (error) console.error("Error resetting nav items:", error);
};