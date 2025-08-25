import { supabase } from "@/integrations/supabase/client";
import { NavItem, Profile, RoleNavItemConfig } from "./dataModels"; // Import RoleNavItemConfig

/**
 * Récupère tous les éléments de navigation depuis Supabase, triés et structurés hiérarchiquement pour un rôle donné.
 * @param userRole Le rôle de l'utilisateur actuel pour filtrer les éléments autorisés.
 * @param unreadMessagesCount Le nombre de messages non lus pour mettre à jour le badge.
 * @param userEstablishmentId L'ID de l'établissement de l'utilisateur (optionnel).
 * @returns Un tableau d'éléments de navigation de premier niveau avec leurs enfants.
 */
export const loadNavItems = async (userRole: Profile['role'] | null, unreadMessagesCount: number = 0, userEstablishmentId?: string): Promise<NavItem[]> => {
  console.log("[loadNavItems] Called with userRole:", userRole, "userEstablishmentId:", userEstablishmentId);

  if (!userRole) {
    console.log("[loadNavItems] No user role, returning empty array.");
    return [];
  }

  let query = supabase
    .from('role_nav_configs')
    .select(`
      *,
      nav_item:nav_items!role_nav_configs_nav_item_id_fkey (
        id,
        label,
        route,
        icon_name,
        description,
        is_external
      )
    `)
    .eq('role', userRole)
    .order('order_index', { ascending: true });

  let orConditions: string[] = [`establishment_id.is.null`]; // Always include global configs

  if (userEstablishmentId) {
    orConditions.push(`establishment_id.eq.${userEstablishmentId}`);
  }

  query = query.or(orConditions.join(','));
  console.log("[loadNavItems] Supabase query OR conditions:", orConditions.join(','));

  const { data: configs, error: configsError } = await query;

  if (configsError) {
    console.error("[loadNavItems] Error loading role nav configs:", configsError);
    return [];
  }
  console.log("[loadNavItems] Fetched configs:", configs);

  // --- TEMPORARY DEBUGGING: Add default items for administrator if no configs found ---
  if (configs.length === 0 && userRole === 'administrator') {
    console.warn("[loadNavItems] No configs found for administrator. Returning default items for debugging.");
    return [
      { id: 'temp-home', label: 'Accueil', route: '/dashboard', icon_name: 'Home', is_external: false, order_index: 0, parent_nav_item_id: null, configId: 'temp-config-home', is_global: true, children: [] },
      { id: 'temp-users', label: 'Utilisateurs', route: '/admin-users', icon_name: 'Users', is_external: false, order_index: 1, parent_nav_item_id: null, configId: 'temp-config-users', is_global: true, children: [] },
      { id: 'temp-establishments', label: 'Établissements', route: '/establishments', icon_name: 'Building2', is_external: false, order_index: 2, parent_nav_item_id: null, configId: 'temp-config-establishments', is_global: true, children: [] },
      { id: 'temp-settings', label: 'Paramètres', route: '/settings', icon_name: 'Settings', is_external: false, order_index: 3, parent_nav_item_id: null, configId: 'temp-config-settings', is_global: true, children: [] },
      { id: 'temp-menu-management', label: 'Gestion des Menus', route: '/admin-menu-management', icon_name: 'LayoutList', is_external: false, order_index: 4, parent_nav_item_id: null, configId: 'temp-config-menu', is_global: true, children: [] },
    ];
  }
  // --- END TEMPORARY DEBUGGING ---

  const navItemsMap = new Map<string, NavItem>();
  const allItems: NavItem[] = [];

  configs.forEach((config: any) => {
    if (config.nav_item) {
      const navItem: NavItem = {
        id: config.nav_item.id,
        label: config.nav_item.label,
        route: config.nav_item.route || undefined,
        icon_name: config.nav_item.icon_name || undefined,
        description: config.nav_item.description || undefined,
        is_external: config.nav_item.is_external,
        children: [],
        parent_nav_item_id: config.parent_nav_item_id || undefined,
        order_index: config.order_index, // Now mandatory, should always be a number from DB
        configId: config.id,
        establishment_id: config.establishment_id || undefined,
        is_global: config.establishment_id === null, // New: Indicate if it's a global config
      };
      navItemsMap.set(navItem.id, navItem);
      allItems.push(navItem);
    }
  });
  console.log("[loadNavItems] All items after mapping from configs:", allItems);

  const rootItems: NavItem[] = [];
  const childrenOf: { [key: string]: NavItem[] } = {};

  allItems.forEach((item: NavItem) => {
    if (item.parent_nav_item_id && navItemsMap.has(item.parent_nav_item_id)) {
      if (!childrenOf[item.parent_nav_item_id]) {
        childrenOf[item.parent_nav_item_id] = [];
      }
      childrenOf[item.parent_nav_item_id].push(item);
    } else {
      rootItems.push(item);
    }
  });
  console.log("[loadNavItems] Root items before attaching children:", rootItems);
  console.log("[loadNavItems] ChildrenOf map:", childrenOf);


  const attachChildren = (items: NavItem[]) => {
    items.forEach(item => {
      if (childrenOf[item.id]) {
        item.children = childrenOf[item.id].sort((a, b) => a.order_index - b.order_index);
        attachChildren(item.children);
      }
      if (item.route === '/messages') {
        item.badge = unreadMessagesCount;
      }
    });
  };

  attachChildren(rootItems);

  rootItems.sort((a, b) => a.order_index - b.order_index);
  console.log("[loadNavItems] Final structured nav items:", rootItems);

  return rootItems;
};

/**
 * Récupère tous les éléments de navigation génériques (de la table nav_items).
 * @returns Un tableau de tous les éléments de navigation génériques.
 */
export const loadAllNavItemsRaw = async (): Promise<NavItem[]> => {
  const { data, error } = await supabase
    .from('nav_items')
    .select('*')
    .order('label', { ascending: true }); // Order by label as order_index is removed

  if (error) {
    console.error("Error loading raw nav items:", error);
    return [];
  }
  return data.map(item => ({
    id: item.id,
    label: item.label,
    route: item.route || undefined,
    icon_name: item.icon_name || undefined,
    description: item.description || undefined,
    is_external: item.is_external,
    children: [], // Children are built dynamically, not stored in raw item
    order_index: 0, // Default order for raw items
    // parent_nav_item_id and establishment_id are not part of raw nav_items
  }));
};

/**
 * Ajoute un nouvel élément de navigation générique.
 * @param newItem Les données du nouvel élément de navigation.
 * @returns L'élément de navigation ajouté.
 */
export const addNavItem = async (newItem: Omit<NavItem, 'id' | 'created_at' | 'updated_at' | 'children' | 'badge' | 'configId' | 'establishment_id' | 'parent_nav_item_id' | 'order_index' | 'is_global'>): Promise<NavItem | null> => {
  const { data, error } = await supabase
    .from('nav_items')
    .insert({
      label: newItem.label,
      route: newItem.route || null,
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
  return data as NavItem;
};

/**
 * Met à jour un élément de navigation générique existant.
 * @param updatedItem Les données de l'élément de navigation à mettre à jour.
 * @returns L'élément de navigation mis à jour.
 */
export const updateNavItem = async (updatedItem: Omit<NavItem, 'created_at' | 'updated_at' | 'children' | 'badge' | 'configId' | 'establishment_id' | 'parent_nav_item_id' | 'order_index' | 'is_global'>): Promise<NavItem | null> => {
  const { data, error } = await supabase
    .from('nav_items')
    .update({
      label: updatedItem.label,
      route: updatedItem.route || null,
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
  return data as NavItem;
};

/**
 * Supprime un élément de navigation générique.
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
 * Récupère les configurations de navigation pour un rôle donné.
 * @param role Le rôle de l'utilisateur.
 * @param establishmentId L'ID de l'établissement (optionnel).
 * @returns Un tableau de configurations de navigation.
 */
export const getRoleNavItemConfigsByRole = async (role: Profile['role'], establishmentId?: string): Promise<RoleNavItemConfig[]> => {
  let query = supabase
    .from('role_nav_configs')
    .select('*')
    .eq('role', role)
    .order('order_index', { ascending: true });

  if (establishmentId) {
    query = query.or(`establishment_id.eq.${establishmentId},establishment_id.is.null`);
  } else {
    query = query.is('establishment_id', null); // Only global configs if no establishmentId provided
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching role nav item configs:", error);
    return [];
  }
  return data as RoleNavItemConfig[];
};

/**
 * Ajoute une nouvelle configuration de navigation pour un rôle.
 * @param newConfig Les données de la nouvelle configuration.
 * @returns La configuration ajoutée.
 */
export const addRoleNavItemConfig = async (newConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'>): Promise<RoleNavItemConfig | null> => {
  const { data, error } = await supabase
    .from('role_nav_configs')
    .insert({
      nav_item_id: newConfig.nav_item_id,
      role: newConfig.role,
      parent_nav_item_id: newConfig.parent_nav_item_id || null,
      order_index: newConfig.order_index,
      establishment_id: newConfig.establishment_id || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding role nav item config:", error);
    throw error;
  }
  return data as RoleNavItemConfig;
};

/**
 * Met à jour une configuration de navigation existante pour un rôle.
 * @param updatedConfig Les données de la configuration à mettre à jour.
 * @returns La configuration mise à jour.
 */
export const updateRoleNavItemConfig = async (updatedConfig: Omit<RoleNavItemConfig, 'created_at' | 'updated_at'>): Promise<RoleNavItemConfig | null> => {
  const { data, error } = await supabase
    .from('role_nav_configs')
    .update({
      parent_nav_item_id: updatedConfig.parent_nav_item_id || null,
      order_index: updatedConfig.order_index,
      establishment_id: updatedConfig.establishment_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', updatedConfig.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating role nav item config:", error);
    throw error;
  }
  return data as RoleNavItemConfig;
};

/**
 * Supprime une configuration de navigation pour un rôle.
 * @param configId L'ID de la configuration à supprimer.
 */
export const deleteRoleNavItemConfig = async (configId: string): Promise<void> => {
  const { error } = await supabase
    .from('role_nav_configs')
    .delete()
    .eq('id', configId);

  if (error) {
    console.error("Error deleting role nav item config:", error);
    throw error;
  }
};

/**
 * Réinitialise la table nav_items (pour le développement/test).
 */
export const resetNavItems = async (): Promise<void> => {
  const { error } = await supabase.from('nav_items').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except a dummy ID if needed
  if (error) console.error("Error resetting nav items:", error);
};

/**
 * Réinitialise la table role_nav_configs (pour le développement/test).
 */
export const resetRoleNavConfigs = async (): Promise<void> => {
  const { error } = await supabase.from('role_nav_configs').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except a dummy ID if needed
  if (error) console.error("Error resetting role nav configs:", error);
};