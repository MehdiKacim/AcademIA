import { supabase } from "@/integrations/supabase/client";
import { NavItem, Profile, RoleNavItemConfig, ALL_ROLES } from "./dataModels"; // Import RoleNavItemConfig and ALL_ROLES

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

  // Step 1: Load role-specific configurations
  let query = supabase
    .from('role_nav_configs')
    .select(`
      id,
      nav_item_id,
      role,
      parent_nav_item_id,
      order_index,
      nav_item:nav_items!role_nav_configs_nav_item_id_fkey (
        id,
        logical_id,
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

  console.log(`[loadNavItems] Fetched configs for ${userRole} (count): ${fetchedConfigs.length}, data:`, fetchedConfigs);

  const configs = fetchedConfigs as RoleNavItemConfig[];
  const navItemNodes = new Map<string, NavItem>(); // Map nav_item.id (DB UUID) to NavItem object

  configs.forEach((config: any) => {
    if (config.nav_item) {
      const navItem: NavItem = {
        id: config.nav_item.id, // This is the actual DB UUID
        logical_id: config.nav_item.logical_id || undefined, // Include logical_id
        label: config.nav_item.label,
        route: config.nav_item.route || undefined,
        icon_name: config.nav_item.icon_name || undefined,
        description: config.nav_item.description || undefined,
        is_external: config.nav_item.is_external,
        type: config.nav_item.type, // Ensure type is included
        children: [], // Initialize empty children array
        parent_nav_item_id: config.parent_nav_item_id || undefined, // This is also a DB UUID
        order_index: config.order_index,
        configId: config.id, // This is the config's own UUID
        // is_global is a frontend concept, not directly from DB here
      };
      navItemNodes.set(navItem.id, navItem);
    } else {
      console.warn(`[loadNavItems] Config with ID ${config.id} has no associated nav_item. Skipping.`);
    }
  });
  console.log(`[loadNavItems] Populated navItemNodes for ${userRole} (count): ${navItemNodes.size}`);

  const rootItems: NavItem[] = [];

  // Assign children and identify root items
  navItemNodes.forEach(item => {
    if (item.parent_nav_item_id && navItemNodes.has(item.parent_nav_item_id)) {
      const parent = navItemNodes.get(item.parent_nav_item_id);
      if (parent) {
        parent.children?.push(item);
      }
    } else {
      rootItems.push(item); // This is a root item
    }
  });

  // Sort children within each parent and root items
  rootItems.sort((a, b) => a.order_index - b.order_index);
  navItemNodes.forEach(item => {
    if (item.children) {
      item.children.sort((a, b) => a.order_index - b.order_index);
    }
  });

  console.log(`[loadNavItems] Final structured nav items for ${userRole} (root items count): ${rootItems.length}, items:`, rootItems);

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
    .select('id, logical_id, label, route, icon_name, description, is_external, type'); // Include logical_id

  if (error) {
    console.error("Error loading raw nav items:", error);
    throw error; // Throw error to be caught by calling component
  }
  return data.map(item => ({
    id: item.id, // This is the actual DB UUID
    logical_id: item.logical_id || undefined, // Include logical_id
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
 * Déclenche l'initialisation des éléments de navigation par défaut pour un rôle via une fonction Edge.
 * @param role Le rôle pour lequel initialiser les menus.
 */
export const bootstrapDefaultNavItemsForRole = async (role: Profile['role']): Promise<void> => { // Removed establishmentId
  console.log(`[bootstrapDefaultNavItemsForRole] Triggering Edge Function to bootstrap defaults for role: ${role}`);
  const { error } = await supabase.functions.invoke('manage-nav-items', {
    body: { action: 'bootstrap_defaults', payload: { role } }, // Removed establishment_id
  });
  if (error) {
    console.error(`[bootstrapDefaultNavItemsForRole] Error bootstrapping default nav items via Edge Function for role ${role}:`, error);
    throw error;
  }
  console.log(`[bootstrapDefaultNavItemsForRole] Default nav items bootstrapped successfully via Edge Function for role: ${role}.`);
};

/**
 * Réinitialise tous les éléments de navigation génériques et toutes les configurations de rôle,
 * puis initialise les menus par défaut pour chaque rôle.
 */
export const reinitializeAllMenus = async (): Promise<void> => {
  console.log("[reinitializeAllMenus] Starting full menu reinitialization...");
  try {
    // 1. Reset all generic nav items
    await resetNavItems();
    console.log("[reinitializeAllMenus] All generic nav items reset.");

    // 2. Reset all role-specific nav item configurations
    await resetRoleNavConfigs();
    console.log("[reinitializeAllMenus] All role nav configs reset.");

    // 3. Bootstrap default nav items for each role
    for (const role of ALL_ROLES) {
      await bootstrapDefaultNavItemsForRole(role);
      console.log(`[reinitializeAllMenus] Bootstrapped default nav items for role: ${role}`);
    }
    console.log("[reinitializeAllMenus] Full menu reinitialization complete.");
  } catch (error) {
    console.error("[reinitializeAllMenus] Error during full menu reinitialization:", error);
    throw error;
  }
};