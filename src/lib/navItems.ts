import { supabase } from "@/integrations/supabase/client";
import { NavItem, Profile, RoleNavItemConfig } from "./dataModels";

/**
 * Récupère tous les éléments de navigation depuis Supabase, triés et structurés hiérarchiquement pour un rôle donné.
 * @param userRole Le rôle de l'utilisateur actuel pour filtrer les éléments autorisés.
 * @param unreadMessagesCount Le nombre de messages non lus pour mettre à jour le badge.
 * @returns Un tableau d'éléments de navigation de premier niveau avec leurs enfants.
 */
export const loadNavItems = async (userRole: Profile['role'] | null, unreadMessagesCount: number = 0): Promise<NavItem[]> => {
  console.log(`[loadNavItems] Called with userRole: ${userRole}, unreadMessagesCount: ${unreadMessagesCount}`);

  if (!userRole) {
    console.log("[loadNavItems] No user role, returning empty array.");
    return [];
  }

  let query = supabase
    .from('role_nav_configs')
    .select(`
      id, // This is the configId (unique for this role's menu item instance)
      nav_item_id, // This is the generic nav_item.id (from public.nav_items)
      role,
      parent_nav_item_id, // This is the generic nav_item.id of the parent (from public.nav_items)
      order_index,
      nav_item:nav_items!role_nav_configs_nav_item_id_fkey (
        id,
        label,
        route,
        icon_name,
        description,
        is_external,
        type
      )
    `)
    .eq('role', userRole)
    .order('order_index', { ascending: true });

  const { data: fetchedConfigs, error: configsError } = await query;

  if (configsError) {
    console.error(`[loadNavItems] Error loading role nav configs for ${userRole}:`, configsError);
    return [];
  }

  console.log(`[loadNavItems] Fetched configs for ${userRole} (count): ${fetchedConfigs.length}, data:`, JSON.stringify(fetchedConfigs, null, 2));

  // Create a flat list of all configured NavItem objects
  const allConfiguredItemsFlat: NavItem[] = [];
  const configuredItemMapByConfigId = new Map<string, NavItem>(); // Key: configId (unique instance)

  fetchedConfigs.forEach((config: any) => {
    if (config.nav_item) {
      const navItem: NavItem = {
        id: config.nav_item.id, // Generic nav_item ID
        label: config.nav_item.label,
        route: config.nav_item.route || undefined,
        icon_name: config.nav_item.icon_name || undefined,
        description: config.nav_item.description || undefined,
        is_external: config.nav_item.is_external,
        type: config.nav_item.type,
        children: [], // Initialize empty children array
        
        // Properties from role_nav_configs
        configId: config.id, // Unique ID for this configured instance
        parent_nav_item_id: config.parent_nav_item_id || undefined, // Generic nav_item ID of the parent
        order_index: config.order_index,
      };
      allConfiguredItemsFlat.push(navItem);
      configuredItemMapByConfigId.set(navItem.configId!, navItem);
    } else {
      console.warn(`[loadNavItems] Config with ID ${config.id} has no associated nav_item. Skipping.`);
    }
  });

  console.log(`[loadNavItems] All configured items flat (count): ${allConfiguredItemsFlat.length}, content:`, JSON.stringify(allConfiguredItemsFlat, null, 2));

  const rootItems: NavItem[] = [];

  // Build the hierarchy
  allConfiguredItemsFlat.forEach(item => {
    console.log(`[loadNavItems] Processing item: ${item.label} (ID: ${item.id}, ConfigID: ${item.configId}, ParentID: ${item.parent_nav_item_id}, Type: ${item.type})`);

    if (item.parent_nav_item_id) {
      // Find the parent item in the flat list by its generic ID
      // We need to find the *configured instance* of the parent.
      // A parent must be a 'category_or_action' type and not have a route itself.
      const parentCandidate = allConfiguredItemsFlat.find(
        p => p.id === item.parent_nav_item_id && // Generic ID matches
             p.type === 'category_or_action' && // Must be a category
             !p.route // Must not be a route itself (i.e., a true category)
      );

      if (parentCandidate) {
        console.log(`[loadNavItems] Found parent candidate for ${item.label}: ${parentCandidate.label} (ConfigID: ${parentCandidate.configId}). Adding as child.`);
        parentCandidate.children?.push(item);
      } else {
        console.warn(`[loadNavItems] No suitable parent candidate found for ${item.label} (ParentID: ${item.parent_nav_item_id}). Adding to rootItems as fallback.`);
        rootItems.push(item);
      }
    } else {
      console.log(`[loadNavItems] Item ${item.label} has no parent_nav_item_id. Adding to rootItems.`);
      rootItems.push(item); // This is a root item
    }
  });

  // Sort children within each parent and root items
  rootItems.sort((a, b) => a.order_index - b.order_index);
  configuredItemMapByConfigId.forEach(item => { // Iterate over map values to ensure all items are processed
    if (item.children) {
      item.children.sort((a, b) => a.order_index - b.order_index);
    }
  });

  console.log(`[loadNavItems] Final structured nav items for ${userRole} (root items count): ${rootItems.length}, items:`, JSON.stringify(rootItems, null, 2));

  // Apply badge for messages
  const applyMessageBadge = (items: NavItem[]) => {
    items.forEach(item => {
      if (item.route === '/messages') {
        item.badge = unreadMessagesCount;
      }
      if (item.children) {
        applyMessageBadge(item.children);
      }
    });
  };
  applyMessageBadge(rootItems);

  return rootItems;
};

/**
 * Récupère tous les éléments de navigation génériques (de la table nav_items).
 * @returns Un tableau de tous les éléments de navigation génériques.
 */
export const loadAllNavItemsRaw = async (): Promise<NavItem[]> => {
  const { data, error } = await supabase
    .from('nav_items')
    .select('id, label, route, icon_name, description, is_external, type'); // Removed logical_id

  if (error) {
    console.error("Error loading raw nav items:", error);
    throw error; // Throw error to be caught by calling component
  }
  return data.map(item => ({
    id: item.id, // This is the actual DB UUID
    label: item.label,
    route: item.route || undefined,
    icon_name: item.icon_name || undefined,
    description: item.description || undefined,
    is_external: item.is_external,
    type: item.type, // Ensure type is included
    children: [], // Children are built dynamically, not stored in raw item
    order_index: 0, // Default order for raw items (not used for display, but required by interface)
    parent_nav_item_id: undefined,
    // is_global is a frontend concept, not directly from DB here
  }));
};

/**
 * Ajoute un nouvel élément de navigation générique.
 * @param newItem Les données du nouvel élément de navigation.
 * @returns L'élément de navigation ajouté.
 */
export const addNavItem = async (newItem: Omit<NavItem, 'id' | 'created_at' | 'updated_at' | 'children' | 'badge' | 'configId' | 'parent_nav_item_id' | 'order_index' | 'is_global'>): Promise<NavItem | null> => {
  const { data, error } = await supabase.functions.invoke('manage-nav-items', {
    body: { action: 'create', payload: newItem },
  });

  if (error) {
    console.error("Error adding nav item via Edge Function:", error);
    throw error;
  }
  return data.data as NavItem;
};

/**
 * Met à jour un élément de navigation générique existant.
 * @param updatedItem Les données de l'élément de navigation à mettre à jour.
 * @returns L'élément de navigation mis à jour.
 */
export const updateNavItem = async (updatedItem: Omit<NavItem, 'created_at' | 'updated_at' | 'children' | 'badge' | 'configId' | 'parent_nav_item_id' | 'order_index' | 'is_global'>): Promise<NavItem | null> => {
  const { data, error } = await supabase.functions.invoke('manage-nav-items', {
    body: { action: 'update', payload: updatedItem },
  });

  if (error) {
    console.error("Error updating nav item via Edge Function:", error);
    throw error;
  }
  return data.data as NavItem;
};

/**
 * Supprime un élément de navigation générique.
 * @param navItemId L'ID de l'élément de navigation à supprimer.
 */
export const deleteNavItem = async (navItemId: string): Promise<void> => {
  const { error } = await supabase.functions.invoke('manage-nav-items', {
    body: { action: 'delete', payload: { id: navItemId } },
  });

  if (error) {
    console.error("Error deleting nav item via Edge Function:", error);
    throw error;
  }
};

/**
 * Récupère les configurations de navigation pour un rôle donné.
 * @param role Le rôle de l'utilisateur.
 * @returns Un tableau de configurations de navigation.
 */
export const getRoleNavItemConfigsByRole = async (role: Profile['role']): Promise<RoleNavItemConfig[]> => {
  let query = supabase
    .from('role_nav_configs')
    .select('*')
    .eq('role', role)
    .order('order_index', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching role nav item configs:", error);
    throw error; // Throw error to be caught by calling component
  }
  return data as RoleNavItemConfig[];
};

/**
 * Ajoute une nouvelle configuration de navigation pour un rôle.
 * @param newConfig Les données de la nouvelle configuration.
 * @returns La configuration ajoutée.
 */
export const addRoleNavItemConfig = async (newConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'>): Promise<RoleNavItemConfig | null> => {
  console.log("[addRoleNavItemConfig] Adding new config:", newConfig); // Diagnostic log
  const { data, error } = await supabase.functions.invoke('manage-nav-items', {
    body: { action: 'create_config', payload: newConfig }, // New action for config
  });

  if (error) {
    console.error("Error adding role nav item config via Edge Function:", error);
    throw error;
  }
  return data.data as RoleNavItemConfig;
};

/**
 * Met à jour une configuration de navigation existante pour un rôle.
 * @param updatedConfig Les données de la configuration à mettre à jour.
 * @returns La configuration mise à jour.
 */
export const updateRoleNavItemConfig = async (updatedConfig: Omit<RoleNavItemConfig, 'created_at' | 'updated_at'>): Promise<RoleNavItemConfig | null> => {
  console.log("[updateRoleNavItemConfig] Updating config:", updatedConfig); // Diagnostic log
  const { data, error } = await supabase.functions.invoke('manage-nav-items', {
    body: { action: 'update_config', payload: updatedConfig }, // New action for config
  });

  if (error) {
    console.error("Error updating role nav item config via Edge Function:", error);
    throw error;
  }
  return data.data as RoleNavItemConfig;
};

/**
 * Supprime une configuration de navigation pour un rôle.
 * @param configId L'ID de la configuration à supprimer.
 */
export const deleteRoleNavItemConfig = async (configId: string): Promise<void> => {
  const { error } = await supabase.functions.invoke('manage-nav-items', {
    body: { action: 'delete_config', payload: { id: configId } }, // New action for config
  });

  if (error) {
    console.error("Error deleting role nav item config via Edge Function:", error);
    throw error;
  }
};

/**
 * Réinitialise la table nav_items (pour le développement/test).
 */
export const resetNavItems = async (): Promise<void> => {
  const { error } = await supabase.functions.invoke('manage-nav-items', {
    body: { action: 'reset_nav_items' }, // New action for reset
  });
  if (error) {
    console.error("Error resetting nav items via Edge Function:", error);
    throw error;
  }
};

/**
 * Réinitialise la table role_nav_configs (pour le développement/test).
 */
export const resetRoleNavConfigs = async (): Promise<void> => {
  const { error } = await supabase.functions.invoke('manage-nav-items', {
    body: { action: 'reset_role_nav_configs' }, // New action for reset
  });
  if (error) {
    console.error("Error resetting nav items via Edge Function:", error);
    throw error;
  }
};

// New helper function to delete role_nav_configs for a specific role
export const resetRoleNavConfigsForRole = async (role: Profile['role']): Promise<void> => { // Removed establishmentId
  console.warn(`[resetRoleNavConfigsForRole] Deleting all role_nav_configs for role: ${role}`);
  const { error } = await supabase.functions.invoke('manage-nav-items', {
    body: { action: 'reset_role_nav_configs_for_role', payload: { role } }, // Removed establishment_id
  });
  if (error) {
    console.error(`Error resetting role nav configs for role ${role} via Edge Function:`, error);
    throw error;
  }
};

/**
 * Déclenche le bootstrap des éléments de navigation et des configurations de rôle par défaut.
 */
export const bootstrapNavItems = async (): Promise<void> => {
  console.log("[bootstrapNavItems] Invoking 'bootstrap-nav' Edge Function...");
  const { data, error } = await supabase.functions.invoke('bootstrap-nav');
  if (error) {
    console.error("Error bootstrapping nav items via Edge Function:", error);
    throw error;
  }
  console.log("[bootstrapNavItems] Bootstrap successful:", data);
};