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
      if (!userRole) return [];

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

      // Filter by establishment_id: either matching user's establishment or NULL (global)
      query = query.or(`establishment_id.eq.${userEstablishmentId},establishment_id.is.null`);

      const { data: configs, error: configsError } = await query;

      if (configsError) {
        console.error("Error loading role nav configs:", configsError);
        return [];
      }

      const navItemsMap = new Map<string, NavItem>();
      const allItems: NavItem[] = [];

      configs.forEach((config: any) => {
        if (config.nav_item) { // Changed from config.nav_items to config.nav_item
          const navItem: NavItem = {
            id: config.nav_item.id,
            label: config.nav_item.label,
            route: config.nav_item.route || undefined,
            icon_name: config.nav_item.icon_name || undefined,
            is_root: config.nav_item.is_root, // This is the original is_root from nav_items, not the config's tree position
            description: config.nav_item.description || undefined,
            is_external: config.nav_item.is_external,
            children: [],
            // Properties from role_nav_configs, added for convenience in frontend tree building
            parent_nav_item_id: config.parent_nav_item_id || undefined,
            order_index: config.order_index,
            configId: config.id, // The ID of the role_nav_configs entry
            establishment_id: config.establishment_id || undefined, // New: establishment_id from config
          };
          navItemsMap.set(navItem.id, navItem);
          allItems.push(navItem);
        }
      });

      const rootItems: NavItem[] = [];
      const childrenOf: { [key: string]: NavItem[] } = {};

      // Build the hierarchical structure based on role_nav_configs
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

      // Sort root items based on their order_index in role_nav_configs
      rootItems.sort((a, b) => a.order_index - b.order_index);

      return rootItems;
    };

    /**
     * Récupère tous les éléments de navigation génériques depuis Supabase (table nav_items).
     * Utile pour la gestion administrative où tous les éléments disponibles doivent être visibles.
     * @returns Un tableau plat de tous les éléments de navigation génériques.
     */
    export const loadAllNavItemsRaw = async (): Promise<NavItem[]> => {
      const { data, error } = await supabase
        .from('nav_items')
        .select('*')
        .order('label', { ascending: true }); // Order by label for the unconfigured list

      if (error) {
        console.error("Error loading all raw nav items:", error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        label: item.label,
        route: item.route || undefined,
        icon_name: item.icon_name || undefined,
        is_root: item.is_root, // This is the original is_root from nav_items
        description: item.description || undefined,
        is_external: item.is_external,
        children: [],
        // Default values for properties from role_nav_configs, as they don't exist on raw items
        parent_nav_item_id: undefined,
        order_index: 0,
        configId: undefined,
        establishment_id: undefined,
      }));
    };

    /**
     * Ajoute un nouvel élément de navigation générique à la table nav_items.
     * @param newItem L'objet NavItem à ajouter (sans l'ID, ni les propriétés de configuration de rôle).
     * @returns L'élément de navigation ajouté.
     */
    export const addNavItem = async (newItem: Omit<NavItem, 'id' | 'created_at' | 'updated_at' | 'children' | 'badge' | 'parent_nav_item_id' | 'order_index' | 'configId' | 'establishment_id'>): Promise<NavItem | null> => {
      const { data, error } = await supabase
        .from('nav_items')
        .insert({
          label: newItem.label,
          route: newItem.route || null,
          icon_name: newItem.icon_name || null,
          is_root: newItem.is_root,
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
     * Met à jour un élément de navigation générique existant dans la table nav_items.
     * @param updatedItem L'objet NavItem avec les données mises à jour (sans les propriétés de configuration de rôle).
     * @returns L'élément de navigation mis à jour.
     */
    export const updateNavItem = async (updatedItem: Omit<NavItem, 'created_at' | 'updated_at' | 'children' | 'badge' | 'parent_nav_item_id' | 'order_index' | 'configId' | 'establishment_id'>): Promise<NavItem | null> => {
      const { data, error } = await supabase
        .from('nav_items')
        .update({
          label: updatedItem.label,
          route: updatedItem.route || null,
          icon_name: updatedItem.icon_name || null,
          is_root: updatedItem.is_root,
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
     * Supprime un élément de navigation générique de la table nav_items.
     * Cela devrait cascader la suppression dans role_nav_configs.
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
     * Récupère un seul élément de navigation générique par son ID.
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
     * Ajoute une nouvelle configuration d'élément de navigation pour un rôle spécifique.
     * @param newConfig L'objet RoleNavItemConfig à ajouter (sans l'ID).
     * @returns La configuration ajoutée.
     */
    export const addRoleNavItemConfig = async (newConfig: Omit<RoleNavItemConfig, 'id' | 'created_at' | 'updated_at'>): Promise<RoleNavItemConfig | null> => {
      const { data, error } = await supabase
        .from('role_nav_configs')
        .insert(newConfig)
        .select()
        .single();

      if (error) {
        console.error("Error adding role nav item config:", error);
        throw error;
      }
      return data as RoleNavItemConfig;
    };

    /**
     * Met à jour une configuration d'élément de navigation existante pour un rôle spécifique.
     * @param updatedConfig L'objet RoleNavItemConfig avec les données mises à jour.
     * @returns La configuration mise à jour.
     */
    export const updateRoleNavItemConfig = async (updatedConfig: Omit<RoleNavItemConfig, 'created_at' | 'updated_at'>): Promise<RoleNavItemConfig | null> => {
      const { data, error } = await supabase
        .from('role_nav_configs')
        .update({
          parent_nav_item_id: updatedConfig.parent_nav_item_id || null,
          order_index: updatedConfig.order_index,
          establishment_id: updatedConfig.establishment_id || null, // New: Update establishment_id
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
     * Supprime une configuration d'élément de navigation pour un rôle spécifique.
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
     * Récupère toutes les configurations d'éléments de navigation pour un rôle donné.
     * @param role Le rôle à filtrer.
     * @param establishmentId L'ID de l'établissement à filtrer (optionnel).
     * @returns Un tableau de configurations d'éléments de navigation.
     */
    export const getRoleNavItemConfigsByRole = async (role: Profile['role'], establishmentId?: string): Promise<RoleNavItemConfig[]> => {
      let query = supabase
        .from('role_nav_configs')
        .select('*')
        .eq('role', role)
        .order('order_index', { ascending: true });

      if (establishmentId) {
        query = query.eq('establishment_id', establishmentId);
      } else {
        query = query.is('establishment_id', null); // Get global configs if no establishmentId is provided
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching role nav item configs by role:", error);
        return [];
      }
      return data as RoleNavItemConfig[];
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