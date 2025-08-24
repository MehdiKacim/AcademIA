import { supabase } from "@/integrations/supabase/client";
import { NavItem, Profile } from "./dataModels";

/**
 * Récupère tous les éléments de navigation depuis Supabase, potentiellement filtrés par rôle.
 * Les éléments sont structurés de manière récursive (enfants sous leurs parents).
 * @param userRole Le rôle de l'utilisateur actuel pour filtrer les éléments autorisés.
 * @returns Un tableau d'éléments de navigation de niveau racine avec leurs enfants.
 */
export const loadNavItems = async (userRole: Profile['role'] | null): Promise<NavItem[]> => {
  if (!userRole) {
    return []; // No nav items if no user role
  }

  const { data, error } = await supabase
    .from('nav_items')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    console.error("Error loading nav items:", error);
    return [];
  }

  const navItems: NavItem[] = data.map((item: any) => ({
    id: item.id,
    label: item.label,
    route: item.route || undefined,
    is_root: item.is_root,
    allowed_roles: item.allowed_roles,
    parent_id: item.parent_id || undefined,
    order_index: item.order_index,
    icon_name: item.icon_name || undefined,
    description: item.description || undefined,
    is_external: item.is_external,
    children: [], // Will be populated in the tree building step
  }));

  // Filter by allowed roles
  const filteredNavItems = navItems.filter(item => item.allowed_roles.includes(userRole));

  // Build a recursive tree structure
  const itemMap = new Map<string, NavItem>();
  filteredNavItems.forEach(item => itemMap.set(item.id, item));

  const rootItems: NavItem[] = [];
  filteredNavItems.forEach(item => {
    if (item.parent_id && itemMap.has(item.parent_id)) {
      const parent = itemMap.get(item.parent_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(item);
      }
    } else if (item.is_root) {
      rootItems.push(item);
    }
  });

  // Sort children for each parent
  itemMap.forEach(item => {
    if (item.children) {
      item.children.sort((a, b) => a.order_index - b.order_index);
    }
  });

  return rootItems.sort((a, b) => a.order_index - b.order_index);
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
      is_root: newItem.is_root,
      allowed_roles: newItem.allowed_roles,
      parent_id: newItem.parent_id || null,
      order_index: newItem.order_index,
      icon_name: newItem.icon_name || null,
      description: newItem.description || null,
      is_external: newItem.is_external,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding nav item:", error);
    throw error;
  }
  return data;
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
      is_root: updatedItem.is_root,
      allowed_roles: updatedItem.allowed_roles,
      parent_id: updatedItem.parent_id || null,
      order_index: updatedItem.order_index,
      icon_name: updatedItem.icon_name || null,
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
  return data;
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
  return data;
};

/**
 * Réinitialise la table nav_items (pour le développement/test).
 */
export const resetNavItems = async (): Promise<void> => {
  const { error } = await supabase.from('nav_items').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except a dummy ID if needed
  if (error) console.error("Error resetting nav_items:", error);
};