import { supabase } from "@/integrations/supabase/client";
import { NavItem, Profile, RoleNavItemConfig } from "./dataModels";

/**
 * Récupère tous les éléments de navigation depuis Supabase, triés et structurés hiérarchiquement pour un rôle donné.
 * @param userRole Le rôle de l'utilisateur actuel pour filtrer les éléments autorisés.
 * @param unreadMessagesCount Le nombre de messages non lus pour mettre à jour le badge.
 * @returns Un tableau d'éléments de navigation de premier niveau avec leurs enfants.
 */
export const loadNavItems = async (userRole: Profile['role'] | null, unreadMessagesCount: number = 0): Promise<NavItem[]> => { // Removed unreadNotificationsCount
  // console.log(`[loadNavItems] Called with userRole: ${userRole}, unreadMessagesCount: ${unreadMessagesCount}`); // Removed unreadNotificationsCount from log

  if (!userRole) {
    // console.log("[loadNavItems] No user role, returning empty array.");
    return [];
  }

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
        label,
        route,
        icon_name,
        description,
        is_external,
        type
      )
    `)
    .eq('role', userRole) // This is the WHERE clause on role
    .order('order_index', { ascending: true });

  const { data: fetchedConfigs, error: configsError } = await query;
    // Removed the erroneous `query.get` line here.

  if (configsError) {
    // console.error(`[loadNavItems] Error loading role nav configs for ${userRole}:`, configsError);
    return [];
  }

  // console.log(`[loadNavItems] Fetched configs for ${userRole} (count): ${fetchedConfigs.length}, data:`, JSON.stringify(fetchedConfigs, null, 2));

  // Create a flat list of all configured NavItem objects, keyed by their configId for easy lookup
  const configuredItemsMap = new Map<string, NavItem>(); // Key: configId (unique instance of a configured item)

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
      configuredItemsMap.set(navItem.configId!, navItem);
    } else {
      // console.warn(`[loadNavItems] Config with ID ${config.id} has no associated nav_item. Skipping.`);
    }
  });

  // console.log(`[loadNavItems] Populated configuredItemsMap (count): ${configuredItemsMap.size}`);

  const rootItems: NavItem[] = [];

  // Build the hierarchy
  // Iterate over the map values to ensure we process each configured item
  configuredItemsMap.forEach(item => {
    // console.log(`[loadNavItems] Processing item: ${item.label} (Generic ID: ${item.id}, ConfigID: ${item.configId}, ParentGenericID: ${item.parent_nav_item_id}, Type: ${item.type})`);

    if (item.parent_nav_item_id) {
      // Find the parent configured item. The parent_nav_item_id refers to the *generic ID* of the parent.
      // We need to find a configured item in our `configuredItemsMap` whose `id` (generic ID) matches `item.parent_nav_item_id`.
      // And that parent must itself be a category.
      let parentConfiguredItem: NavItem | undefined;
      for (const configuredItem of configuredItemsMap.values()) {
        if (configuredItem.id === item.parent_nav_item_id && configuredItem.type === 'category_or_action' && (configuredItem.route === null || configuredItem.route === undefined)) {
          parentConfiguredItem = configuredItem;
          break;
        }
      }

      if (parentConfiguredItem) {
        // console.log(`[loadNavItems] Found parent for ${item.label}: ${parentConfiguredItem.label} (ConfigID: ${parentConfiguredItem.configId}). Adding as child.`);
        parentConfiguredItem.children?.push(item);
      } else {
        // If a parent_nav_item_id is specified but no suitable parent configured item is found,
        // it means the parent is either not configured as a category for this role, or it's a dangling reference.
        // For now, we'll treat it as a root item.
        // console.warn(`[loadNavItems] No suitable parent configured item found for ${item.label} (ParentGenericID: ${item.parent_nav_item_id}). Adding to rootItems as fallback.`);
        rootItems.push(item);
      }
    } else {
      rootItems.push(item); // This is a root item
    }
  });

  // Sort children within each parent and root items
  rootItems.sort((a, b) => a.order_index - b.order_index);
  configuredItemsMap.forEach(item => {
    if (item.children) {
      item.children.sort((a, b) => a.order_index - b.order_index);
    }
  });

  // console.log(`[loadNavItems] Final structured nav items for ${userRole} (root items count): ${rootItems.length}, items:`, JSON.stringify(rootItems, null, 2));

  // Apply badge for messages
  const applyBadges = (items: NavItem[]) => {
    items.forEach(item => {
      if (item.route === '/messages') {
        item.badge = unreadMessagesCount;
      }
      // Removed badge for notifications
      if (item.children) {
        applyBadges(item.children);
      }
    });
  };
  applyBadges(rootItems);

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
    // console.error("Error loading raw nav items:", error);
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

// Helper to check for active session
const ensureAuthenticated = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new Error("Non authentifié. Veuillez vous reconnecter.");
  }
  return session;
};

/**
 * Ajoute un nouvel élément de navigation générique.
 * @param newItem Les données du nouvel élément de navigation.
 * @returns L'élément de navigation ajouté.
 */
export const addNavItem = async (newItem: Omit<NavItem, 'id' | 'created_at' | 'updated_at' | 'children' | 'badge' | 'configId' | 'parent_nav_item_id' | 'order_index' | 'is_global'>): Promise<NavItem | null> => {
  await ensureAuthenticated(); // Ensure user is authenticated

  // console.log("[addNavItem] Sending payload to Edge Function:", newItem); // Add this log

  // Check for existing item with same label or route (if route is not null)
  const { data: existingItems, error: fetchError } = await supabase
    .from('nav_items')
    .select('id, label, route')
    .or(`label.eq.${newItem.label},route.eq.${newItem.route}`);

  if (fetchError) {
    // console.error("Error checking for existing nav items:", fetchError);
    throw new Error("Erreur lors de la vérification des éléments de navigation existants.");
  }

  if (existingItems && existingItems.length > 0) {
    const duplicateLabel = existingItems.some(item => item.label === newItem.label);
    const duplicateRoute = newItem.route && existingItems.some(item => item.route === newItem.route);

    if (duplicateLabel && duplicateRoute) {
      throw new Error("Un élément avec le même libellé ET la même route existe déjà.");
    } else if (duplicateLabel) {
      throw new Error("Un élément avec le même libellé existe déjà.");
    } else if (duplicateRoute) {
      throw new Error("Un élément avec la même route existe déjà.");
    }
  }

  const { data, error } = await supabase.functions.invoke('manage-nav-items', {
    body: { action: 'create', payload: newItem },
  });

  if (error) {
    // console.error("Error adding nav item via Edge Function:", error);
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
  await ensureAuthenticated(); // Ensure user is authenticated
  const { data, error } = await supabase.functions.invoke('manage-nav-items', {
    body: { action: 'update', payload: updatedItem },
  });

  if (error) {
    // console.error("Error updating nav item via Edge Function:", error);
    throw error;
  }
  return data.data as NavItem;
};

/**
 * Supprime un élément de navigation générique.
 * @param navItemId L'ID de l'élément de navigation à supprimer.
 */
export const deleteNavItem = async (navItemId: string): Promise<void> => {
  await ensureAuthenticated(); // Ensure user is authenticated
  const { error } = await supabase.functions.invoke('manage-nav-items', {
    body: { action: 'delete', payload: { id: navItemId } },
  });

  if (error) {
    // console.error("Error deleting nav item via Edge Function:", error);
    throw error;
  }
};

/**
 * Récupère les configurations de navigation pour un rôle donné.
 * @param role Le rôle de l'utilisateur.
 * @returns Un tableau de configurations de navigation.
 */
export const getRoleNavItemConfigsByRole = async (role: Profile['role']): Promise<RoleNavItemConfig[]> => {
  // No authentication check here, as this is for reading configurations,
  // and the RLS policies on `role_nav_configs` will handle access.
  let query = supabase
    .from('role_nav_configs')
    .select('*')
    .eq('role', role)
    .order('order_index', { ascending: true });

  const { data, error } = await query;

  if (error) {
    // console.error("Error fetching role nav item configs:", error);
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
  await ensureAuthenticated(); // Ensure user is authenticated
  // console.log("[addRoleNavItemConfig] Adding new config:", newConfig); // Diagnostic log
  const { data, error } = await supabase.functions.invoke('manage-nav-items', {
    body: { action: 'create_config', payload: newConfig }, // New action for config
  });

  if (error) {
    // console.error("Error adding role nav item config via Edge Function:", error);
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
  await ensureAuthenticated(); // Ensure user is authenticated
  // console.log("[updateRoleNavItemConfig] Updating config:", updatedConfig); // Diagnostic log
  const { data, error } = await supabase.functions.invoke('manage-nav-items', {
    body: { action: 'update_config', payload: updatedConfig }, // New action for config
  });

  if (error) {
    // console.error("Error updating role nav item config via Edge Function:", error);
    throw error;
  }
  return data.data as RoleNavItemConfig;
};

/**
 * Supprime une configuration de navigation pour un rôle.
 * @param configId L'ID de la configuration à supprimer.
 */
export const deleteRoleNavItemConfig = async (configId: string): Promise<void> => {
  await ensureAuthenticated(); // Ensure user is authenticated
  const { error } = await supabase.functions.invoke('manage-nav-items', {
    body: { action: 'delete_config', payload: { id: configId } }, // New action for config
  });

  if (error) {
    // console.error("Error deleting role nav item config via Edge Function:", error);
    throw error;
  }
};

/**
 * Réinitialise la table nav_items (pour le développement/test).
 */
export const resetNavItems = async (): Promise<void> => {
  await ensureAuthenticated(); // Ensure user is authenticated
  const { error } = await supabase.functions.invoke('manage-nav-items', {
    body: { action: 'reset_nav_items' }, // New action for reset
  });
  if (error) {
    // console.error("Error resetting nav items via Edge Function:", error);
    throw error;
  }
};

/**
 * Réinitialise la table role_nav_configs (pour le développement/test).
 */
export const resetRoleNavConfigs = async (): Promise<void> => {
  await ensureAuthenticated(); // Ensure user is authenticated
  const { error } = await supabase.functions.invoke('manage-nav-items', {
    body: { action: 'reset_role_nav_configs' }, // New action for reset
  });
  if (error) {
    // console.error("Error resetting nav items via Edge Function:", error);
    throw error;
  }
};

// New helper function to delete role_nav_configs for a specific role
export const resetRoleNavConfigsForRole = async (role: Profile['role']): Promise<void> => { // Removed establishmentId
  await ensureAuthenticated(); // Ensure user is authenticated
  // console.warn(`[resetRoleNavConfigsForRole] Deleting all role_nav_configs for role: ${role}`);
  const { error } = await supabase.functions.invoke('manage-nav-items', {
    body: { action: 'reset_role_nav_configs_for_role', payload: { role } }, // Removed establishment_id
  });
  if (error) {
    // console.error(`Error resetting role nav configs for role ${role} via Edge Function:`, error);
    throw error;
  }
};

/**
 * Déclenche le bootstrap des éléments de navigation et des configurations de rôle par défaut.
 */
export const bootstrapNavItems = async (): Promise<void> => {
  await ensureAuthenticated(); // Ensure user is authenticated
  // console.log("[bootstrapNavItems] Invoking 'bootstrap-nav' Edge Function...");
  const { data, error } = await supabase.functions.invoke('bootstrap-nav');
  if (error) {
    // console.error("Error bootstrapping nav items via Edge Function:", error);
    throw error;
  }
  // console.log("[bootstrapNavItems] Bootstrap successful:", data);
};