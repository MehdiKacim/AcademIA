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
        is_root,
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

  const navItemsMap = new Map<string, NavItem>();
  const allItems: NavItem[] = [];

  configs.forEach((config: any) => {
    if (config.nav_item) {
      const navItem: NavItem = {
        id: config.nav_item.id,
        label: config.nav_item.label,
        route: config.nav_item.route || undefined,
        icon_name: config.nav_item.icon_name || undefined,
        is_root: config.nav_item.is_root,
        description: config.nav_item.description || undefined,
        is_external: config.nav_item.is_external,
        children: [],
        parent_nav_item_id: config.parent_nav_item_id || undefined,
        order_index: config.order_index,
        configId: config.id,
        establishment_id: config.establishment_id || undefined,
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