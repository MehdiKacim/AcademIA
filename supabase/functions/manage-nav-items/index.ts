import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define default nav item structures for each role
const DEFAULT_NAV_ITEMS_BY_ROLE = {
  administrator: [
    { logical_id: 'dashboard-generic-item-id', label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de l'application", is_external: false, type: 'route' },
    { logical_id: 'menu-management-category-id', label: 'Gestion des Menus', route: null, icon_name: 'LayoutList', description: "Configurez les menus de navigation", is_external: false, type: 'category_or_action' },
    { logical_id: 'generic-items-route-id', label: 'Éléments de navigation', route: '/admin-menu-management/generic-items', icon_name: 'LayoutList', description: "Gérez les définitions de base des éléments de navigation", is_external: false, type: 'route', parentId: 'menu-management-category-id' },
    { logical_id: 'role-configs-route-id', label: 'Configuration par rôle', route: '/admin-menu-management/role-configs', icon_name: 'UserRoundCog', description: "Configurez les menus pour chaque rôle utilisateur", is_external: false, type: 'route', parentId: 'menu-management-category-id' },
    { logical_id: 'user-management-route-id', label: 'Gestion des Utilisateurs', route: '/admin-users', icon_name: 'UsersRound', description: "Gérez les profils et les rôles des utilisateurs", is_external: false, type: 'route' },
    { logical_id: 'subject-management-route-id', label: 'Gestion des Matières', route: '/subjects', icon_name: 'BookText', description: "Créez et gérez les matières scolaires", is_external: false, type: 'route' },
    { logical_id: 'school-year-management-route-id', label: 'Gestion des Années Scolaires', route: '/school-years', icon_name: 'CalendarDays', description: "Créez et gérez les années scolaires", is_external: false, type: 'route' },
    { logical_id: 'professor-assignment-route-id', label: 'Gestion des Affectations Professeurs-Matières', route: '/professor-assignments', icon_name: 'UserCheck', description: "Affectez les professeurs aux matières et classes", is_external: false, type: 'route' },
    { logical_id: 'curriculum-management-route-id', label: 'Gestion des Cursus', route: '/curricula', icon_name: 'LayoutList', description: "Créez et gérez les cursus scolaires", is_external: false, type: 'route' },
    { logical_id: 'class-management-route-id', label: 'Gestion des Classes', route: '/classes', icon_name: 'Users', description: "Créez et gérez les classes", is_external: false, type: 'route' } ,
    { logical_id: 'pedagogical-management-route-id', label: 'Gestion Pédagogique', route: '/pedagogical-management', icon_name: 'GraduationCap', description: "Gérez les affectations des élèves aux classes", is_external: false, type: 'route' },
    { logical_id: 'messages-route-id', label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec les autres utilisateurs", is_external: false, type: 'route' },
    { logical_id: 'profile-route-id', label: 'Mon Profil', route: '/profile', icon_name: 'User', description: "Affichez et modifiez votre profil", is_external: false, type: 'route' },
    { logical_id: 'settings-route-id', label: 'Paramètres', route: '/settings', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false, type: 'route' },
    { logical_id: 'analytics-route-id', label: 'Analytiques', route: '/analytics', icon_name: 'LineChart', description: "Consultez les statistiques de l'application", is_external: false, type: 'route' },
  ],
  student: [
    { logical_id: 'dashboard-generic-item-id', label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de votre progression", is_external: false, type: 'route' } ,
    { logical_id: 'my-courses-route-id', label: 'Mes Cours', route: '/courses', icon_name: 'BookOpen', description: "Accédez à vos cours et suivez votre progression", is_external: false, type: 'route' },
    { logical_id: 'all-notes-route-id', label: 'Toutes mes notes', route: '/all-notes', icon_name: 'NotebookText', description: "Retrouvez toutes vos notes", is_external: false, type: 'route' },
    { logical_id: 'messages-route-id', label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec vos professeurs et tuteurs", is_external: false, type: 'route' },
    { logical_id: 'profile-route-id', label: 'Mon Profil', route: '/profile', icon_name: 'User', description: "Affichez et modifiez votre profil", is_external: false, type: 'route' },
    { logical_id: 'settings-route-id', label: 'Paramètres', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false, type: 'route' },
    { logical_id: 'analytics-route-id', label: 'Analytiques', route: '/analytics', icon_name: 'LineChart', description: "Consultez vos statistiques d'apprentissage", is_external: false, type: 'route' },
  ],
  professeur: [
    { logical_id: 'dashboard-generic-item-id', label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de vos cours et élèves", is_external: false, type: 'route' } ,
    { logical_id: 'course-management-route-id', label: 'Gestion des Cours', route: '/courses', icon_name: 'BookOpen', description: "Gérez les cours que vous avez créés", is_external: false, type: 'route' },
    { logical_id: 'create-course-route-id', label: 'Créer un cours', route: '/create-course', icon_name: 'PlusSquare', description: "Créez un nouveau cours", is_external: false, type: 'route' },
    { logical_id: 'class-management-route-id', label: 'Gestion des Classes', route: '/classes', icon_name: 'Users', description: "Gérez les classes que vous supervisez", is_external: false, type: 'route' },
    { logical_id: 'pedagogical-management-route-id', label: 'Gestion Pédagogique', route: '/pedagogical-management', icon_name: 'GraduationCap', description: "Gérez les affectations des élèves aux classes", is_external: false, type: 'route' },
    { logical_id: 'messages-route-id', label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec vos élèves et collègues", is_external: false, type: 'route' },
    { logical_id: 'profile-route-id', label: 'Mon Profil', route: '/profile', icon_name: 'User', description: "Affichez et modifiez votre profil", is_external: false, type: 'route' },
    { logical_id: 'settings-route-id', label: 'Paramètres', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false, type: 'route' },
    { logical_id: 'analytics-route-id', label: 'Analytiques', icon_name: 'LineChart', description: "Consultez les statistiques de vos cours et élèves", is_external: false, type: 'route' },
  ],
  tutor: [
    { logical_id: 'dashboard-generic-item-id', label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de vos élèves", is_external: false, type: 'route' } ,
    { logical_id: 'pedagogical-management-route-id', label: 'Gestion Pédagogique', route: '/pedagogical-management', icon_name: 'GraduationCap', description: "Gérez les affectations des élèves aux classes", is_external: false, type: 'route' },
    { logical_id: 'messages-route-id', label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec vos élèves et collègues", is_external: false, type: 'route' },
    { logical_id: 'profile-route-id', label: 'Mon Profil', route: '/profile', icon_name: 'User', description: "Affichez et modifiez votre profil", is_external: false, type: 'route' },
    { logical_id: 'settings-route-id', label: 'Paramètres', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false, type: 'route' },
    { logical_id: 'analytics-route-id', label: 'Analytiques', icon_name: 'LineChart', description: "Consultez les statistiques de vos élèves", is_external: false, type: 'route' },
  ],
  director: [
    { logical_id: 'dashboard-generic-item-id', label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de votre établissement", is_external: false, type: 'route' } ,
    { logical_id: 'user-management-route-id', label: 'Gestion des Utilisateurs', route: '/admin-users', icon_name: 'UsersRound', description: "Gérez les profils et les rôles des utilisateurs", is_external: false, type: 'route' },
    { logical_id: 'subject-management-route-id', label: 'Gestion des Matières', route: '/subjects', icon_name: 'BookText', description: "Créez et gérez les matières scolaires", is_external: false, type: 'route' },
    { logical_id: 'school-year-management-route-id', label: 'Gestion des Années Scolaires', route: '/school-years', icon_name: 'CalendarDays', description: "Créez et gérez les années scolaires", is_external: false, type: 'route' },
    { logical_id: 'professor-assignment-route-id', label: 'Gestion des Affectations Professeurs-Matières', route: '/professor-assignments', icon_name: 'UserCheck', description: "Affectez les professeurs aux matières et classes", is_external: false, type: 'route' },
    { logical_id: 'curriculum-management-route-id', label: 'Gestion des Cursus', route: '/curricula', icon_name: 'LayoutList', description: "Créez et gérez les cursus scolaires", is_external: false, type: 'route' },
    { logical_id: 'class-management-route-id', label: 'Gestion des Classes', route: '/classes', icon_name: 'Users', description: "Créez et gérez les classes", is_external: false, type: 'route' },
    { logical_id: 'pedagogical-management-route-id', label: 'Gestion Pédagogique', route: '/pedagogical-management', icon_name: 'GraduationCap', description: "Gérez les affectations des élèves aux classes", is_external: false, type: 'route' } ,
    { logical_id: 'messages-route-id', label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec les autres utilisateurs", is_external: false, type: 'route' },
    { logical_id: 'profile-route-id', label: 'Mon Profil', route: '/profile', icon_name: 'User', description: "Affichez et modifiez votre profil", is_external: false, type: 'route' },
    { logical_id: 'settings-route-id', label: 'Paramètres', route: '/settings', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false, type: 'route' },
    { logical_id: 'analytics-route-id', label: 'Analytiques', icon_name: 'LineChart', description: "Consultez les statistiques de votre établissement", is_external: false, type: 'route' },
  ],
  deputy_director: [
    { logical_id: 'dashboard-generic-item-id', label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de votre établissement", is_external: false, type: 'route' } ,
    { logical_id: 'user-management-route-id', label: 'Gestion des Utilisateurs', route: '/admin-users', icon_name: 'UsersRound', description: "Gérez les profils et les rôles des utilisateurs", is_external: false, type: 'route' },
    { logical_id: 'subject-management-route-id', label: 'Gestion des Matières', route: '/subjects', icon_name: 'BookText', description: "Créez et gérez les matières scolaires", is_external: false, type: 'route' },
    { logical_id: 'school-year-management-route-id', label: 'Gestion des Années Scolaires', route: '/school-years', icon_name: 'CalendarDays', description: "Créez et gérez les années scolaires", is_external: false, type: 'route' },
    { logical_id: 'professor-assignment-route-id', label: 'Gestion des Affectations Professeurs-Matières', route: '/professor-assignments', icon_name: 'UserCheck', description: "Affectez les professeurs aux matières et classes", is_external: false, type: 'route' } ,
    { logical_id: 'curriculum-management-route-id', label: 'Gestion des Cursus', route: '/curricula', icon_name: 'LayoutList', description: "Créez et gérez les cursus scolaires", is_external: false, type: 'route' },
    { logical_id: 'class-management-route-id', label: 'Gestion des Classes', route: '/classes', icon_name: 'Users', description: "Créez et gérez les classes", is_external: false, type: 'route' },
    { logical_id: 'pedagogical-management-route-id', label: 'Gestion Pédagogique', route: '/pedagogical-management', icon_name: 'GraduationCap', description: "Gérez les affectations des élèves aux classes", is_external: false, type: 'route' } ,
    { logical_id: 'messages-route-id', label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec les autres utilisateurs", is_external: false, type: 'route' },
    { logical_id: 'profile-route-id', label: 'Mon Profil', route: '/profile', icon_name: 'User', description: "Affichez et modifiez votre profil", is_external: false, type: 'route' },
    { logical_id: 'settings-route-id', label: 'Paramètres', route: '/settings', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false, type: 'route' },
    { logical_id: 'analytics-route-id', label: 'Analytiques', icon_name: 'LineChart', description: "Consultez les statistiques de votre établissement", is_external: false, type: 'route' },
  ],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Read the request body once at the beginning
  const { action, payload } = await req.json();

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    // Permission check:
    // 1. Allow 'bootstrap_defaults' if no user is authenticated (for initial setup)
    // 2. For all other actions, or if 'bootstrap_defaults' is called with an authenticated user,
    //    require the user to be an 'administrator'.
    if (!user && action === 'bootstrap_defaults') {
      // Proceed with bootstrap_defaults using service role key, no further user check needed here
      // The rest of the function will use supabaseAdminClient
    } else if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: User not authenticated.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    } else {
      const userRole = user.user_metadata.role as string;
      if (userRole !== 'administrator') {
        return new Response(JSON.stringify({ error: 'Forbidden: Only administrators can manage nav items.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        });
      }
    }

    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let data, error;

    switch (action) {
      case 'create':
        // For 'create' action, the payload might contain a logical_id, remove it before insert
        const itemToCreate = { ...payload };
        delete itemToCreate.logical_id; // Ensure logical_id is not inserted into DB 'id' column
        ({ data, error } = await supabaseAdminClient
          .from('nav_items')
          .insert({ ...itemToCreate, type: itemToCreate.type || 'route' }) // Ensure type is set, default to 'route'
          .select()
          .single());
        break;
      case 'read':
        ({ data, error } = await supabaseAdminClient
          .from('nav_items')
          .select('*')
          .order('label', { ascending: true })); // Order by label for consistency
        break;
      case 'update':
        // For 'update' action, ensure logical_id is not passed to DB
        const itemToUpdate = { ...payload };
        delete itemToUpdate.logical_id;
        ({ data, error } = await supabaseAdminClient
          .from('nav_items')
          .update({ ...itemToUpdate, updated_at: new Date().toISOString(), type: itemToUpdate.type || 'route' }) // Ensure type is updated
          .eq('id', itemToUpdate.id)
          .select()
          .single());
        break;
      case 'delete':
        ({ data, error } = await supabaseAdminClient
          .from('nav_items')
          .delete()
          .eq('id', payload.id));
        break;
      case 'bootstrap_defaults':
        const { role: bootstrapRole } = payload;
        console.log(`[Edge Function] Bootstrapping defaults for role: ${bootstrapRole}`);

        const defaultItemsForRole = DEFAULT_NAV_ITEMS_BY_ROLE[bootstrapRole];
        if (!defaultItemsForRole || defaultItemsForRole.length === 0) {
          // If no default items, just delete existing configs and return success
          const { error: deleteConfigsError } = await supabaseAdminClient
            .from('role_nav_configs')
            .delete()
            .eq('role', bootstrapRole);

          if (deleteConfigsError) {
            console.error(`[Edge Function] Error deleting existing role nav configs for ${bootstrapRole}:`, deleteConfigsError);
            throw deleteConfigsError;
          }
          console.log(`[Edge Function] Deleted existing role nav configs for ${bootstrapRole}. No new items to insert.`);
          data = []; // Return empty data
          break; // Exit switch case
        }

        // Step 1: Delete existing configs for this role to ensure a clean slate
        const { error: deleteConfigsError } = await supabaseAdminClient
          .from('role_nav_configs')
          .delete()
          .eq('role', bootstrapRole);

        if (deleteConfigsError) {
          console.error(`[Edge Function] Error deleting existing role nav configs for ${bootstrapRole}:`, deleteConfigsError);
          throw deleteConfigsError;
        }
        console.log(`[Edge Function] Deleted existing role nav configs for ${bootstrapRole}.`);

        // Map to store actual DB IDs of generic nav_items, keyed by their predefined LOGICAL IDs
        const logicalIdToDbIdMap = new Map<string, string>();

        // Step 2: Ensure all generic nav_items exist and get their DB IDs
        for (const itemData of defaultItemsForRole) {
          const navItemPayload = { ...itemData };
          delete navItemPayload.logical_id; // Remove logical_id before checking/inserting into nav_items
          delete navItemPayload.parentId; // Remove parentId as it's for role_nav_configs

          // Try to find an existing nav_item by label and route (or label and null route for categories)
          let existingDbItem = null;
          if (navItemPayload.route) {
            const { data: existingRouteItem, error: fetchRouteError } = await supabaseAdminClient
              .from('nav_items')
              .select('id')
              .eq('label', navItemPayload.label)
              .eq('route', navItemPayload.route)
              .maybeSingle();
            if (fetchRouteError) throw fetchRouteError;
            existingDbItem = existingRouteItem;
          } else { // Category or action without a route
            const { data: existingCategoryItem, error: fetchCategoryError } = await supabaseAdminClient
              .from('nav_items')
              .select('id')
              .eq('label', navItemPayload.label)
              .is('route', null) // Categories typically have null route
              .maybeSingle();
            if (fetchCategoryError) throw fetchCategoryError;
            existingDbItem = existingCategoryItem;
          }

          if (existingDbItem) {
            logicalIdToDbIdMap.set(itemData.logical_id, existingDbItem.id); // Map logical ID to existing DB ID
          } else {
            // Insert new item, letting DB generate UUID for 'id'
            const { data: newItem, error: insertItemError } = await supabaseAdminClient
              .from('nav_items')
              .insert(navItemPayload)
              .select('id')
              .single();
            if (insertItemError) throw insertItemError;
            logicalIdToDbIdMap.set(itemData.logical_id, newItem.id); // Map logical ID to new generated DB ID
          }
        }
        console.log("[Edge Function] logicalIdToDbIdMap after processing generic items:", logicalIdToDbIdMap);

        // Step 3: Build the hierarchical structure for default configs and assign order_index
        const configsToInsert = [];
        const tempTree = new Map<string, any>(); // Map logical ID to temp item object

        // First pass: create temp items and map logical IDs to their DB IDs
        for (const itemData of defaultItemsForRole) {
          const dbId = logicalIdToDbIdMap.get(itemData.logical_id);
          if (!dbId) throw new Error(`DB ID not found for logical ID: ${itemData.logical_id}`);
          tempTree.set(itemData.logical_id, {
            dbId: dbId,
            logicalId: itemData.logical_id,
            parentId: null, // Will be updated
            orderIndex: 0, // Will be updated
            children: []
          });
        }

        // Second pass: build the tree structure using logical IDs
        for (const itemData of defaultItemsForRole) {
          const currentTempItem = tempTree.get(itemData.logical_id);
          if (currentTempItem && itemData.parentId) {
            const parentTempItem = tempTree.get(itemData.parentId);
            if (parentTempItem) {
              currentTempItem.parentId = itemData.parentId;
              parentTempItem.children.push(currentTempItem);
            }
          }
        }

        // Third pass: Flatten the tree and assign order_index
        let currentOrderIndex = 0;
        const flattenAndOrder = (items: any[], parentDbId: string | null) => {
          items.sort((a, b) => a.logicalId.localeCompare(b.logicalId)); // Consistent sorting by logical ID
          for (const item of items) {
            configsToInsert.push({
              nav_item_id: item.dbId,
              role: bootstrapRole,
              parent_nav_item_id: parentDbId,
              order_index: currentOrderIndex++
            });
            if (item.children.length > 0) {
              flattenAndOrder(item.children, item.dbId);
            }
          });
        };

        // Start flattening from root items (those without a parentId in tempTree)
        const rootTempItems = Array.from(tempTree.values()).filter(item => item.parentId === null);
        flattenAndOrder(rootTempItems, null);

        console.log("[Edge Function] Flattened configs for DB (count):", configsToInsert.length, "configs:", configsToInsert);

        // Step 4: Insert new configs
        const { data: configsInsertResult, error: configsInsertError } = await supabaseAdminClient
          .from('role_nav_configs')
          .insert(configsToInsert)
          .select();

        if (configsInsertError) {
          console.error("[Edge Function] Error inserting default role nav configs:", configsInsertError);
          throw configsInsertError;
        }
        data = configsInsertResult;
        console.log(`[Edge Function] Inserted ${configsInsertResult.length} new role nav configs for role ${bootstrapRole}.`);
        break;
      case 'create_config': // New action for creating role_nav_configs
        ({ data, error } = await supabaseAdminClient
          .from('role_nav_configs')
          .insert(payload)
          .select()
          .single());
        break;
      case 'update_config': // New action for updating role_nav_configs
        ({ data, error } = await supabaseAdminClient
          .from('role_nav_configs')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', payload.id)
          .select()
          .single());
        break;
      case 'delete_config': // New action for deleting role_nav_configs
        ({ data, error } = await supabaseAdminClient
          .from('role_nav_configs')
          .delete()
          .eq('id', payload.id));
        break;
      case 'reset_nav_items': // New action for resetting nav_items
        ({ data, error } = await supabaseAdminClient.from('nav_items').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
        break;
      case 'reset_role_nav_configs': // New action for resetting role_nav_configs
        ({ data, error } = await supabaseAdminClient.from('role_nav_configs').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
        break;
      case 'reset_role_nav_configs_for_role': // New action for resetting role_nav_configs for a specific role
        ({ data, error } = await supabaseAdminClient
          .from('role_nav_configs')
          .delete()
          .eq('role', payload.role));
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid action.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
    }

    if (error) {
      console.error(`Error performing action ${action}:`, error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in manage-nav-items Edge Function:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});