import { supabase } from "@/integrations/supabase/client";
import { NavItem, Profile, RoleNavItemConfig } from "./dataModels"; // Import RoleNavItemConfig

// Define default nav item structures for each role
const DEFAULT_NAV_ITEMS_BY_ROLE: { [key in Profile['role']]: {
  item: Omit<NavItem, 'id' | 'created_at' | 'updated_at' | 'children' | 'badge' | 'configId' | 'establishment_id' | 'parent_nav_item_id' | 'order_index' | 'is_global'>;
  parentLabel?: string; // To link children to parents
}[] } = {
  administrator: [
    { item: { label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de l'application", is_external: false } },
    { item: { label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec les autres utilisateurs", is_external: false } },
    { item: { label: 'Recherche', route: null, icon_name: 'Search', description: "Recherche globale dans l'application", is_external: false } },
    { item: { label: 'Mon profil', route: '/profile', icon_name: 'User', description: "Gérez votre profil utilisateur", is_external: false } },
    { item: { label: 'Mes cours', route: '/courses', icon_name: 'BookOpen', description: "Accédez à vos cours", is_external: false } },
    { item: { label: 'Mes notes', route: '/all-notes', icon_name: 'NotebookText', description: "Retrouvez toutes vos notes", is_external: false } },
    { item: { label: 'Analytiques', route: '/analytics?view=overview', icon_name: 'BarChart2', description: "Consultez les statistiques", is_external: false } },
    { item: { label: 'Système', route: null, icon_name: 'Settings', description: "Gestion des paramètres système et de l'application.", is_external: false } },
    { item: { label: 'Paramètres', route: '/settings', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false }, parentLabel: 'Système' },
    { item: { label: 'Gestion des Menus', route: '/admin-menu-management', icon_name: 'LayoutList', description: "Configurez les menus de navigation", is_external: false }, parentLabel: 'Système' },
    { item: { label: 'Gestion des Utilisateurs', route: '/admin-users', icon_name: 'Users', description: "Gérez les comptes utilisateurs", is_external: false }, parentLabel: 'Système' },
    { item: { label: 'Gestion des Établissements', route: '/establishments', icon_name: 'Building2', description: "Gérez les établissements scolaires", is_external: false }, parentLabel: 'Système' },
    { item: { label: 'Gestion des Matières', route: '/subjects', icon_name: 'BookText', description: "Gérez les matières scolaires", is_external: false }, parentLabel: 'Système' },
    { item: { label: 'Gestion des Cursus', route: '/curricula', icon_name: 'LayoutList', description: "Gérez les cursus d'études", is_external: false }, parentLabel: 'Système' },
    { item: { label: 'Gestion des Classes', route: '/classes', icon_name: 'Users', description: "Gérez les classes et leurs élèves", is_external: false }, parentLabel: 'Système' },
    { item: { label: 'Gestion Pédagogique', route: '/pedagogical-management', icon_name: 'GraduationCap', description: "Gérez les affectations élèves-classes", is_external: false }, parentLabel: 'Système' },
    { item: { label: 'Gestion des Affectations Professeurs-Matières', route: '/professor-assignments', icon_name: 'UserCheck', description: "Affectez les professeurs aux matières", is_external: false }, parentLabel: 'Système' },
    { item: { label: 'Gestion des Années Scolaires', route: '/school-years', icon_name: 'CalendarDays', description: "Gérez les années scolaires", is_external: false }, parentLabel: 'Système' },
  ],
  student: [
    { item: { label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de l'application", is_external: false } },
    { item: { label: 'Mes cours', route: '/courses', icon_name: 'BookOpen', description: "Accédez à vos cours", is_external: false } },
    { item: { label: 'Mes notes', route: '/all-notes', icon_name: 'NotebookText', description: "Retrouvez toutes vos notes", is_external: false } },
    { item: { label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec les autres utilisateurs", is_external: false } },
    { item: { label: 'Mon profil', route: '/profile', icon_name: 'User', description: "Gérez votre profil utilisateur", is_external: false } },
    { item: { label: 'Analytiques', route: '/analytics?view=personal', icon_name: 'LineChart', description: "Consultez vos statistiques personnelles", is_external: false } },
    { item: { label: 'AiA Bot', route: null, icon_name: 'BotMessageSquare', description: "Votre tuteur IA personnel", is_external: false } }, // Trigger for chat
    { item: { label: 'Paramètres', route: '/settings', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false } },
  ],
  professeur: [
    { item: { label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de l'application", is_external: false } },
    { item: { label: 'Mes cours', route: '/courses', icon_name: 'BookOpen', description: "Accédez à vos cours", is_external: false } },
    { item: { label: 'Créer un cours', route: '/create-course', icon_name: 'PlusSquare', description: "Créez un nouveau cours", is_external: false } },
    { item: { label: 'Gestion des classes', route: '/classes', icon_name: 'Users', description: "Gérez les classes et leurs élèves", is_external: false } },
    { item: { label: 'Gestion des affectations professeurs-matières', route: '/professor-assignments', icon_name: 'UserCheck', description: "Affectez les professeurs aux matières", is_external: false } },
    { item: { label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec les autres utilisateurs", is_external: false } },
    { item: { label: 'Mon profil', route: '/profile', icon_name: 'User', description: "Gérez votre profil utilisateur", is_external: false } },
    { item: { label: 'Analytiques', route: '/analytics?view=overview', icon_name: 'BarChart2', description: "Consultez les statistiques de vos cours", is_external: false } },
    { item: { label: 'AiA Bot', route: null, icon_name: 'BotMessageSquare', description: "Votre tuteur IA personnel", is_external: false } },
    { item: { label: 'Paramètres', route: '/settings', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false } },
  ],
  tutor: [
    { item: { label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de l'application", is_external: false } },
    { item: { label: 'Mes élèves', route: '/pedagogical-management', icon_name: 'GraduationCap', description: "Gérez les affectations élèves-classes", is_external: false } },
    { item: { label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec les autres utilisateurs", is_external: false } },
    { item: { label: 'Mon profil', route: '/profile', icon_name: 'User', description: "Gérez votre profil utilisateur", is_external: false } },
    { item: { label: 'Analytiques', route: '/analytics?view=student-monitoring', icon_name: 'LineChart', description: "Consultez les statistiques de vos élèves", is_external: false } },
    { item: { label: 'AiA Bot', route: null, icon_name: 'BotMessageSquare', description: "Votre tuteur IA personnel", is_external: false } },
    { item: { label: 'Paramètres', route: '/settings', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false } },
  ],
  director: [
    { item: { label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de l'application", is_external: false } },
    { item: { label: 'Gestion des Utilisateurs', route: '/admin-users', icon_name: 'Users', description: "Gérez les comptes utilisateurs", is_external: false } },
    { item: { label: 'Gestion des Établissements', route: '/establishments', icon_name: 'Building2', description: "Gérez les établissements scolaires", is_external: false } },
    { item: { label: 'Gestion des Matières', route: '/subjects', icon_name: 'BookText', description: "Gérez les matières scolaires", is_external: false } },
    { item: { label: 'Gestion des Cursus', route: '/curricula', icon_name: 'LayoutList', description: "Gérez les cursus d'études", is_external: false } },
    { item: { label: 'Gestion des Classes', route: '/classes', icon_name: 'Users', description: "Gérez les classes et leurs élèves", is_external: false } },
    { item: { label: 'Gestion Pédagogique', route: '/pedagogical-management', icon_name: 'GraduationCap', description: "Gérez les affectations élèves-classes", is_external: false } },
    { item: { label: 'Gestion des Affectations Professeurs-Matières', route: '/professor-assignments', icon_name: 'UserCheck', description: "Affectez les professeurs aux matières", is_external: false } },
    { item: { label: 'Gestion des Années Scolaires', icon_name: 'CalendarDays', description: "Gérez les années scolaires", is_external: false } },
    { item: { label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec les autres utilisateurs", is_external: false } },
    { item: { label: 'Mon profil', route: '/profile', icon_name: 'User', description: "Gérez votre profil utilisateur", is_external: false } },
    { item: { label: 'Analytiques', route: '/analytics?view=establishment-admin', icon_name: 'BarChart2', description: "Consultez les statistiques de votre établissement", is_external: false } },
    { item: { label: 'AiA Bot', route: null, icon_name: 'BotMessageSquare', description: "Votre tuteur IA personnel", is_external: false } },
    { item: { label: 'Paramètres', route: '/settings', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false } },
  ],
  deputy_director: [
    { item: { label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de l'application", is_external: false } },
    { item: { label: 'Gestion des Utilisateurs', route: '/admin-users', icon_name: 'Users', description: "Gérez les comptes utilisateurs", is_external: false } },
    { item: { label: 'Gestion des Établissements', route: '/establishments', icon_name: 'Building2', description: "Gérez les établissements scolaires", is_external: false } },
    { item: { label: 'Gestion des Matières', route: '/subjects', icon_name: 'BookText', description: "Gérez les matières scolaires", is_external: false } },
    { item: { label: 'Gestion des Cursus', route: '/curricula', icon_name: 'LayoutList', description: "Gérez les cursus d'études", is_external: false } },
    { item: { label: 'Gestion des Classes', route: '/classes', icon_name: 'Users', description: "Gérez les classes et leurs élèves", is_external: false } },
    { item: { label: 'Gestion Pédagogique', route: '/pedagogical-management', icon_name: 'GraduationCap', description: "Gérez les affectations élèves-classes", is_external: false } },
    { item: { label: 'Gestion des Affectations Professeurs-Matières', route: '/professor-assignments', icon_name: 'UserCheck', description: "Affectez les professeurs aux matières", is_external: false } },
    { item: { label: 'Gestion des Années Scolaires', icon_name: 'CalendarDays', description: "Gérez les années scolaires", is_external: false } },
    { item: { label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec les autres utilisateurs", is_external: false } },
    { item: { label: 'Mon profil', route: '/profile', icon_name: 'User', description: "Gérez votre profil utilisateur", is_external: false } },
    { item: { label: 'Analytiques', route: '/analytics?view=establishment-admin', icon_name: 'BarChart2', description: "Consultez les statistiques de votre établissement", is_external: false } },
    { item: { label: 'AiA Bot', route: null, icon_name: 'BotMessageSquare', description: "Votre tuteur IA personnel", is_external: false } },
    { item: { label: 'Paramètres', route: '/settings', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false } },
  ],
};

/**
 * Insère les éléments de navigation et les configurations de rôle par défaut pour un administrateur.
 * Cette fonction est appelée si aucune configuration n'est trouvée pour le rôle 'administrator'.
 * @returns Un tableau des configurations de rôle nouvellement insérées.
 */
const insertDefaultAdminNavItems = async (): Promise<RoleNavItemConfig[]> => {
  console.warn("[insertDefaultAdminNavItems] Inserting default items for administrator.");

  // First, reset existing admin configs to ensure a clean slate
  await resetRoleNavConfigsForRole('administrator');

  const defaultNavItemsData = DEFAULT_NAV_ITEMS_BY_ROLE['administrator'];

  const navItemMap = new Map<string, string>(); // Map label to nav_item_id
  const parentIdMap = new Map<string, string>(); // Map parent label to nav_item_id

  // Ensure all generic nav_items exist and get their IDs
  for (const { item: itemData } of defaultNavItemsData) {
    const { data: existingItem, error: fetchError } = await supabase
      .from('nav_items')
      .select('id')
      .eq('label', itemData.label)
      .maybeSingle();

    if (fetchError) {
      console.error(`Error checking for existing nav item '${itemData.label}':`, fetchError);
      throw fetchError;
    }

    if (existingItem) {
      navItemMap.set(itemData.label, existingItem.id);
    } else {
      const { data: newItem, error: insertItemError } = await supabase
        .from('nav_items')
        .insert(itemData)
        .select('id')
        .single();
      if (insertItemError) {
        console.error(`Error inserting nav item '${itemData.label}':`, insertItemError);
        throw insertItemError;
      }
      navItemMap.set(itemData.label, newItem.id);
    }
  }

  const defaultRoleConfigs: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'>[] = [];
  let orderIndexCounter = 0;

  for (const { item: itemData, parentLabel } of defaultNavItemsData) {
    const navItemId = navItemMap.get(itemData.label);
    if (!navItemId) {
      console.error(`[insertDefaultAdminNavItems] Nav item ID not found for label: ${itemData.label}`);
      continue;
    }

    let parent_nav_item_id: string | null = null;
    if (parentLabel) {
      parent_nav_item_id = parentIdMap.get(parentLabel) || navItemMap.get(parentLabel) || null;
      if (!parent_nav_item_id) {
        console.warn(`[insertDefaultAdminNavItems] Parent nav item ID not found for label: ${parentLabel}. Item '${itemData.label}' will be a root item.`);
      }
    }

    defaultRoleConfigs.push({
      nav_item_id: navItemId,
      role: 'administrator',
      parent_nav_item_id: parent_nav_item_id,
      order_index: orderIndexCounter,
      establishment_id: null, // Admin configs are global
    });
    orderIndexCounter++;
    if (!parentLabel) { // If it's a root item, also add to parentIdMap for potential children
      parentIdMap.set(itemData.label, navItemId);
    }
  }

  const { data: configsInsertResult, error: configsInsertError } = await supabase
    .from('role_nav_configs')
    .insert(defaultRoleConfigs)
    .select();

  if (configsInsertError) {
    console.error("Error inserting default role nav configs:", configsInsertError);
    throw configsInsertError;
  }
  return configsInsertResult as RoleNavItemConfig[];
};

// New function to ensure default nav items and configs for a given role
export const ensureDefaultNavItemsForRole = async (role: Profile['role'], establishmentId: string | null = null): Promise<void> => {
  console.log(`[ensureDefaultNavItemsForRole] Ensuring default nav items for role: ${role}, establishment: ${establishmentId}`);

  const defaultItemsForRole = DEFAULT_NAV_ITEMS_BY_ROLE[role];
  if (!defaultItemsForRole || defaultItemsForRole.length === 0) {
    console.warn(`[ensureDefaultNavItemsForRole] No default items defined for role: ${role}`);
    return;
  }

  const navItemMap = new Map<string, string>(); // Map label to nav_item_id
  const parentIdMap = new Map<string, string>(); // Map parent label to nav_item_id

  // Step 1: Ensure all generic nav_items exist and get their IDs
  for (const { item: itemData } of defaultItemsForRole) {
    const { data: existingItem, error: fetchError } = await supabase
      .from('nav_items')
      .select('id')
      .eq('label', itemData.label)
      .maybeSingle();

    if (fetchError) {
      console.error(`[ensureDefaultNavItemsForRole] Error checking for existing nav item '${itemData.label}':`, fetchError);
      throw fetchError;
    }

    if (existingItem) {
      navItemMap.set(itemData.label, existingItem.id);
    } else {
      console.log(`[ensureDefaultNavItemsForRole] Inserting new generic nav_item: ${itemData.label}`);
      const { data: newItem, error: insertItemError } = await supabase
        .from('nav_items')
        .insert(itemData)
        .select('id')
        .single();
      if (insertItemError) {
        console.error(`[ensureDefaultNavItemsForRole] Error inserting nav item '${itemData.label}':`, insertItemError);
        throw insertItemError;
      }
      navItemMap.set(itemData.label, newItem.id);
    }
  }

  // Step 2: Create/Update role_nav_configs
  const existingRoleConfigs = await getRoleNavItemConfigsByRole(role, establishmentId || undefined);
  const existingConfigMap = new Map<string, RoleNavItemConfig>(); // Key: nav_item_id
  existingRoleConfigs.forEach(config => existingConfigMap.set(config.nav_item_id, config));

  const configsToInsert: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'>[] = [];
  const configsToUpdate: Omit<RoleNavItemConfig, 'created_at' | 'updated_at'>[] = [];

  let orderIndexCounter = 0; // For root items

  for (const { item: itemData, parentLabel } of defaultItemsForRole) {
    const navItemId = navItemMap.get(itemData.label);
    if (!navItemId) {
      console.error(`[ensureDefaultNavItemsForRole] Nav item ID not found for label: ${itemData.label}`);
      continue;
    }

    let parent_nav_item_id: string | null = null;
    if (parentLabel) {
      parent_nav_item_id = parentIdMap.get(parentLabel) || navItemMap.get(parentLabel) || null;
      if (!parent_nav_item_id) {
        console.warn(`[ensureDefaultNavItemsForRole] Parent nav item ID not found for label: ${parentLabel}. Item '${itemData.label}' will be a root item.`);
      }
    }

    const existingConfig = existingConfigMap.get(navItemId);

    if (existingConfig) {
      // Update existing config if properties differ
      if (existingConfig.parent_nav_item_id !== parent_nav_item_id ||
          existingConfig.establishment_id !== establishmentId ||
          existingConfig.order_index !== orderIndexCounter) // Only update order if it's a root item for now
      {
        console.log(`[ensureDefaultNavItemsForRole] Updating existing config for ${itemData.label}`);
        configsToUpdate.push({
          id: existingConfig.id,
          nav_item_id: navItemId,
          role: role,
          parent_nav_item_id: parent_nav_item_id,
          order_index: orderIndexCounter,
          establishment_id: establishmentId,
        });
      }
    } else {
      // Insert new config
      console.log(`[ensureDefaultNavItemsForRole] Inserting new config for ${itemData.label}`);
      configsToInsert.push({
        nav_item_id: navItemId,
        role: role,
        parent_nav_item_id: parent_nav_item_id,
        order_index: orderIndexCounter,
        establishment_id: establishmentId,
      });
    }
    orderIndexCounter++; // Increment order for next item
    if (!parentLabel) { // If it's a root item, also add to parentIdMap for potential children
      parentIdMap.set(itemData.label, navItemId);
    }
  }

  if (configsToInsert.length > 0) {
    const { error: insertError } = await supabase.from('role_nav_configs').insert(configsToInsert);
    if (insertError) {
      console.error(`[ensureDefaultNavItemsForRole] Error inserting role nav configs for role ${role}:`, insertError);
      throw insertError;
    }
    console.log(`[ensureDefaultNavItemsForRole] Inserted ${configsToInsert.length} new role nav configs for role ${role}.`);
  }

  if (configsToUpdate.length > 0) {
    for (const config of configsToUpdate) {
      const { error: updateError } = await supabase.from('role_nav_configs').update(config).eq('id', config.id);
      if (updateError) {
        console.error(`[ensureDefaultNavItemsForRole] Error updating role nav config ${config.id} for role ${role}:`, updateError);
        throw updateError;
      }
    }
    console.log(`[ensureDefaultNavItemsForRole] Updated ${configsToUpdate.length} role nav configs for role ${role}.`);
  }
  console.log(`[ensureDefaultNavItemsForRole] Finished ensuring default nav items for role: ${role}.`);
};

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

  // Determine the target establishment_id for the query
  const targetEstablishmentId = userRole === 'administrator' ? null : (userEstablishmentId || null);

  // Step 1: Load role-specific configurations
  let query = supabase
    .from('role_nav_configs')
    .select(`
      id,
      nav_item_id,
      role,
      parent_nav_item_id,
      order_index,
      establishment_id,
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

  if (userRole !== 'administrator') {
    // For non-admins, fetch global configs OR configs specific to their establishment
    query = query.or(`establishment_id.is.null,establishment_id.eq.${userEstablishmentId}`);
    console.log(`[loadNavItems] Supabase query OR conditions for non-admin (role: ${userRole}, establishment: ${userEstablishmentId}): establishment_id.is.null,establishment_id.eq.${userEstablishmentId}`);
  } else {
    // For admin, fetch only global configs (as admin manages global menu)
    query = query.is('establishment_id', null);
    console.log("[loadNavItems] User is administrator, fetching only global configs.");
  }

  let configs: RoleNavItemConfig[] = [];
  const { data: fetchedConfigs, error: configsError } = await query;

  if (configsError) {
    console.error("[loadNavItems] Error loading role nav configs:", configsError);
    // Attempt to ensure defaults if there's an error fetching
    try {
      await ensureDefaultNavItemsForRole(userRole, targetEstablishmentId);
      // Re-fetch after ensuring defaults
      const { data: reFetchedConfigs, error: reFetchError } = await query;
      if (reFetchError) {
        console.error("[loadNavItems] Error re-fetching configs after ensuring defaults:", reFetchError);
        return [];
      }
      configs = reFetchedConfigs as RoleNavItemConfig[];
      console.log("[loadNavItems] Re-fetched configs after ensuring defaults (count):", configs.length);
    } catch (e) {
      console.error("[loadNavItems] Failed to ensure default nav items after initial fetch error:", e);
      return [];
    }
  } else {
    configs = fetchedConfigs as RoleNavItemConfig[];
    console.log("[loadNavItems] Fetched configs (initial count):", configs.length);

    // If no configs found for this role/establishment, ensure defaults
    if (configs.length === 0) {
      console.warn(`[loadNavItems] No configs found for role ${userRole} and establishment ${userEstablishmentId}. Attempting to ensure defaults.`);
      try {
        await ensureDefaultNavItemsForRole(userRole, targetEstablishmentId);
        // Re-fetch after ensuring defaults
        const { data: reFetchedConfigs, error: reFetchError } = await query;
        if (reFetchError) {
          console.error("[loadNavItems] Error re-fetching configs after ensuring defaults (empty initial):", reFetchError);
          return [];
        }
        configs = reFetchedConfigs as RoleNavItemConfig[];
        console.log("[loadNavItems] Re-fetched configs after ensuring defaults (empty initial, count):", configs.length);
      } catch (e) {
        console.error("[loadNavItems] Failed to ensure default nav items when initial fetch was empty:", e);
        return [];
      }
    }
  }

  const navItemNodes = new Map<string, NavItem>(); // Map nav_item.id to NavItem object

  configs.forEach((config: any) => {
    if (config.nav_item) {
      const navItem: NavItem = {
        id: config.nav_item.id,
        label: config.nav_item.label,
        route: config.nav_item.route || undefined,
        icon_name: config.nav_item.icon_name || undefined,
        description: config.nav_item.description || undefined,
        is_external: config.nav_item.is_external,
        children: [], // Initialize empty children array
        parent_nav_item_id: config.parent_nav_item_id || undefined,
        order_index: config.order_index,
        configId: config.id,
        establishment_id: config.establishment_id || undefined,
        is_global: config.establishment_id === null,
      };
      navItemNodes.set(navItem.id, navItem);
    } else {
      console.warn(`[loadNavItems] Config with ID ${config.id} has no associated nav_item. Skipping.`);
    }
  });
  console.log("[loadNavItems] Populated navItemNodes (count):", navItemNodes.size);

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

  console.log("[loadNavItems] Final structured nav items (root items count):", rootItems.length, "items:", rootItems);

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

// New helper function to delete role_nav_configs for a specific role
export const resetRoleNavConfigsForRole = async (role: Profile['role']): Promise<void> => {
  console.warn(`[resetRoleNavConfigsForRole] Deleting all role_nav_configs for role: ${role}`);
  const { error } = await supabase.from('role_nav_configs').delete().eq('role', role);
  if (error) {
    console.error(`Error resetting role nav configs for role ${role}:`, error);
    throw error;
  }
};

// Call this function to recreate default admin navigation
ensureDefaultNavItemsForRole('administrator', null)
  .then(() => console.log("Default administrator navigation ensured."))
  .catch(error => console.error("Failed to ensure default administrator navigation:", error));