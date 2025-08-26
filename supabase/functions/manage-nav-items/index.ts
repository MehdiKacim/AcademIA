import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define default nav item structures for each role
const DEFAULT_NAV_ITEMS_BY_ROLE = {
  administrator: [
    { item: { id: 'dashboard-generic-item-id', label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de l'application", is_external: false, type: 'route' } },
    { item: { id: 'menu-management-category-id', label: 'Gestion des Menus', route: null, icon_name: 'LayoutList', description: "Configurez les menus de navigation", is_external: false, type: 'category_or_action' } },
    { item: { id: 'generic-items-route-id', label: 'Éléments de navigation', route: '/admin-menu-management/generic-items', icon_name: 'LayoutList', description: "Gérez les définitions de base des éléments de navigation", is_external: false, type: 'route' }, parentId: 'menu-management-category-id' },
    { item: { id: 'role-configs-route-id', label: 'Configuration par rôle', route: '/admin-menu-management/role-configs', icon_name: 'UserRoundCog', description: "Configurez les menus pour chaque rôle utilisateur", is_external: false, type: 'route' }, parentId: 'menu-management-category-id' },
    { item: { id: 'user-management-route-id', label: 'Gestion des Utilisateurs', route: '/admin-users', icon_name: 'UsersRound', description: "Gérez les profils et les rôles des utilisateurs", is_external: false, type: 'route' } },
    { item: { id: 'subject-management-route-id', label: 'Gestion des Matières', route: '/subjects', icon_name: 'BookText', description: "Créez et gérez les matières scolaires", is_external: false, type: 'route' } },
    { item: { id: 'school-year-management-route-id', label: 'Gestion des Années Scolaires', route: '/school-years', icon_name: 'CalendarDays', description: "Créez et gérez les années scolaires", is_external: false, type: 'route' } },
    { item: { id: 'professor-assignment-route-id', label: 'Gestion des Affectations Professeurs-Matières', route: '/professor-assignments', icon_name: 'UserCheck', description: "Affectez les professeurs aux matières et classes", is_external: false, type: 'route' } },
    { item: { id: 'curriculum-management-route-id', label: 'Gestion des Cursus', route: '/curricula', icon_name: 'LayoutList', description: "Créez et gérez les cursus scolaires", is_external: false, type: 'route' } },
    { item: { id: 'class-management-route-id', label: 'Gestion des Classes', route: '/classes', icon_name: 'Users', description: "Créez et gérez les classes", is_external: false, type: 'route' } },
    { item: { id: 'pedagogical-management-route-id', label: 'Gestion Pédagogique', route: '/pedagogical-management', icon_name: 'GraduationCap', description: "Gérez les affectations des élèves aux classes", is_external: false, type: 'route' } },
    { item: { id: 'messages-route-id', label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec les autres utilisateurs", is_external: false, type: 'route' } },
    { item: { id: 'profile-route-id', label: 'Mon Profil', route: '/profile', icon_name: 'User', description: "Affichez et modifiez votre profil", is_external: false, type: 'route' } },
    { item: { id: 'settings-route-id', label: 'Paramètres', route: '/settings', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false, type: 'route' } },
    { item: { id: 'analytics-route-id', label: 'Analytiques', route: '/analytics', icon_name: 'LineChart', description: "Consultez les statistiques de l'application", is_external: false, type: 'route' } },
  ],
  student: [
    { item: { id: 'dashboard-generic-item-id', label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de votre progression", is_external: false, type: 'route' } },
    { item: { id: 'my-courses-route-id', label: 'Mes Cours', route: '/courses', icon_name: 'BookOpen', description: "Accédez à vos cours et suivez votre progression", is_external: false, type: 'route' } },
    { item: { id: 'all-notes-route-id', label: 'Toutes mes notes', route: '/all-notes', icon_name: 'NotebookText', description: "Retrouvez toutes vos notes", is_external: false, type: 'route' } },
    { item: { id: 'messages-route-id', label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec vos professeurs et tuteurs", is_external: false, type: 'route' } },
    { item: { id: 'profile-route-id', label: 'Mon Profil', route: '/profile', icon_name: 'User', description: "Affichez et modifiez votre profil", is_external: false, type: 'route' } },
    { item: { id: 'settings-route-id', label: 'Paramètres', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false, type: 'route' } },
    { item: { id: 'analytics-route-id', label: 'Analytiques', route: '/analytics', icon_name: 'LineChart', description: "Consultez vos statistiques d'apprentissage", is_external: false, type: 'route' } },
  ],
  professeur: [
    { item: { id: 'dashboard-generic-item-id', label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de vos cours et élèves", is_external: false, type: 'route' } },
    { item: { id: 'course-management-route-id', label: 'Gestion des Cours', route: '/courses', icon_name: 'BookOpen', description: "Gérez les cours que vous avez créés", is_external: false, type: 'route' } },
    { item: { id: 'create-course-route-id', label: 'Créer un cours', route: '/create-course', icon_name: 'PlusSquare', description: "Créez un nouveau cours", is_external: false, type: 'route' } },
    { item: { id: 'class-management-route-id', label: 'Gestion des Classes', route: '/classes', icon_name: 'Users', description: "Gérez les classes que vous supervisez", is_external: false, type: 'route' } },
    { item: { id: 'pedagogical-management-route-id', label: 'Gestion Pédagogique', route: '/pedagogical-management', icon_name: 'GraduationCap', description: "Gérez les affectations des élèves aux classes", is_external: false, type: 'route' } },
    { item: { id: 'messages-route-id', label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec vos élèves et collègues", is_external: false, type: 'route' } },
    { item: { id: 'profile-route-id', label: 'Mon Profil', route: '/profile', icon_name: 'User', description: "Affichez et modifiez votre profil", is_external: false, type: 'route' } },
    { item: { id: 'settings-route-id', label: 'Paramètres', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false, type: 'route' } },
    { item: { id: 'analytics-route-id', label: 'Analytiques', icon_name: 'LineChart', description: "Consultez les statistiques de vos cours et élèves", is_external: false, type: 'route' } },
  ],
  tutor: [
    { item: { id: 'dashboard-generic-item-id', label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de vos élèves", is_external: false, type: 'route' } },
    { item: { id: 'pedagogical-management-route-id', label: 'Gestion Pédagogique', route: '/pedagogical-management', icon_name: 'GraduationCap', description: "Gérez les affectations des élèves aux classes", is_external: false, type: 'route' } },
    { item: { id: 'messages-route-id', label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec vos élèves et collègues", is_external: false, type: 'route' } },
    { item: { id: 'profile-route-id', label: 'Mon Profil', route: '/profile', icon_name: 'User', description: "Affichez et modifiez votre profil", is_external: false, type: 'route' } },
    { item: { id: 'settings-route-id', label: 'Paramètres', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false, type: 'route' } },
    { item: { id: 'analytics-route-id', label: 'Analytiques', icon_name: 'LineChart', description: "Consultez les statistiques de vos élèves", is_external: false, type: 'route' } },
  ],
  director: [
    { item: { id: 'dashboard-generic-item-id', label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de votre établissement", is_external: false, type: 'route' } },
    { item: { id: 'user-management-route-id', label: 'Gestion des Utilisateurs', route: '/admin-users', icon_name: 'UsersRound', description: "Gérez les profils et les rôles des utilisateurs", is_external: false, type: 'route' } },
    { item: { id: 'subject-management-route-id', label: 'Gestion des Matières', route: '/subjects', icon_name: 'BookText', description: "Créez et gérez les matières scolaires", is_external: false, type: 'route' } },
    { item: { id: 'school-year-management-route-id', label: 'Gestion des Années Scolaires', route: '/school-years', icon_name: 'CalendarDays', description: "Créez et gérez les années scolaires", is_external: false, type: 'route' } },
    { item: { id: 'professor-assignment-route-id', label: 'Gestion des Affectations Professeurs-Matières', route: '/professor-assignments', icon_name: 'UserCheck', description: "Affectez les professeurs aux matières et classes", is_external: false, type: 'route' } },
    { item: { id: 'curriculum-management-route-id', label: 'Gestion des Cursus', route: '/curricula', icon_name: 'LayoutList', description: "Créez et gérez les cursus scolaires", is_external: false, type: 'route' } },
    { item: { id: 'class-management-route-id', label: 'Gestion des Classes', route: '/classes', icon_name: 'Users', description: "Créez et gérez les classes", is_external: false, type: 'route' } },
    { item: { id: 'pedagogical-management-route-id', label: 'Gestion Pédagogique', route: '/pedagogical-management', icon_name: 'GraduationCap', description: "Gérez les affectations des élèves aux classes", is_external: false, type: 'route' } }
    ,
    { item: { id: 'messages-route-id', label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec les autres utilisateurs", is_external: false, type: 'route' } },
    { item: { id: 'profile-route-id', label: 'Mon Profil', route: '/profile', icon_name: 'User', description: "Affichez et modifiez votre profil", is_external: false, type: 'route' } },
    { item: { id: 'settings-route-id', label: 'Paramètres', route: '/settings', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false, type: 'route' } },
    { item: { id: 'analytics-route-id', label: 'Analytiques', route: '/analytics', icon_name: 'LineChart', description: "Consultez les statistiques de votre établissement", is_external: false, type: 'route' } },
  ],
  deputy_director: [
    { item: { id: 'dashboard-generic-item-id', label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de votre établissement", is_external: false, type: 'route' } },
    { item: { id: 'user-management-route-id', label: 'Gestion des Utilisateurs', route: '/admin-users', icon_name: 'UsersRound', description: "Gérez les profils et les rôles des utilisateurs", is_external: false, type: 'route' } },
    { item: { id: 'subject-management-route-id', label: 'Gestion des Matières', route: '/subjects', icon_name: 'BookText', description: "Créez et gérez les matières scolaires", is_external: false, type: 'route' } },
    { item: { id: 'school-year-management-route-id', label: 'Gestion des Années Scolaires', route: '/school-years', icon_name: 'CalendarDays', description: "Créez et gérez les années scolaires", is_external: false, type: 'route' } },
    { item: { id: 'professor-assignment-route-id', label: 'Gestion des Affectations Professeurs-Matières', route: '/professor-assignments', icon_name: 'UserCheck', description: "Affectez les professeurs aux matières et classes", is_external: false, type: 'route' } },
    { item: { id: 'curriculum-management-route-id', label: 'Gestion des Cursus', route: '/curricula', icon_name: 'LayoutList', description: "Créez et gérez les cursus scolaires", is_external: false, type: 'route' } },
    { item: { id: 'class-management-route-id', label: 'Gestion des Classes', route: '/classes', icon_name: 'Users', description: "Créez et gérez les classes", is_external: false, type: 'route' } },
    { item: { id: 'pedagogical-management-route-id', label: 'Gestion Pédagogique', route: '/pedagogical-management', icon_name: 'GraduationCap', description: "Gérez les affectations des élèves aux classes", is_external: false, type: 'route' } }
    ,
    { item: { id: 'messages-route-id', label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec les autres utilisateurs", is_external: false, type: 'route' } },
    { item: { id: 'profile-route-id', label: 'Mon Profil', route: '/profile', icon_name: 'User', description: "Affichez et modifiez votre profil", is_external: false, type: 'route' } },
    { item: { id: 'settings-route-id', label: 'Paramètres', route: '/settings', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false, type: 'route' } },
    { item: { id: 'analytics-route-id', label: 'Analytiques', icon_name: 'LineChart', description: "Consultez les statistiques de votre établissement", is_external: false, type: 'route' } },
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
        ({ data, error } = await supabaseAdminClient
          .from('nav_items')
          .insert({ ...payload, type: payload.type || 'route' }) // Ensure type is set, default to 'route'
          .select()
          .single());
        break;
      case 'read':
        ({ data, error } = await supabaseAdminClient
          .from('nav_items')
          .select('*')
          .order('order_index', { ascending: true }));
        break;
      case 'update':
        ({ data, error } = await supabaseAdminClient
          .from('nav_items')
          .update({ ...payload, updated_at: new Date().toISOString(), type: payload.type || 'route' }) // Ensure type is updated
          .eq('id', payload.id)
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

        // Map to store actual DB IDs of generic nav_items, keyed by their predefined IDs
        const genericNavItemDbIds = new Map<string, string>();

        // Step 2: Ensure all generic nav_items exist and get their DB IDs
        for (const { item: itemData } of defaultItemsForRole) {
          const { data: existingItem, error: fetchError } = await supabaseAdminClient
            .from('nav_items')
            .select('id')
            .eq('id', itemData.id) // Use the predefined ID for lookup
            .maybeSingle();

          if (fetchError) {
            console.error(`[Edge Function] Error checking for existing nav item '${itemData.label}' (ID: ${itemData.id}):`, fetchError);
            throw fetchError;
          }

          if (existingItem) {
            genericNavItemDbIds.set(itemData.id, existingItem.id);
          } else {
            console.log(`[Edge Function] Inserting new generic nav_item: ${itemData.label} (ID: ${itemData.id})`);
            const { data: newItem, error: insertItemError } = await supabaseAdminClient
              .from('nav_items')
              .insert(itemData)
              .select('id')
              .single();
            if (insertItemError) {
              console.error(`[Edge Function] Error inserting nav item '${itemData.label}' (ID: ${itemData.id}):`, insertItemError);
              throw insertItemError;
            }
            genericNavItemDbIds.set(itemData.id, newItem.id);
          }
        }
        console.log("[Edge Function] genericNavItemDbIds after processing generic items:", genericNavItemDbIds);

        // Step 3: Build the hierarchical structure for default configs and assign order_index
        // This temporary structure will hold items with their children and order_index
        const tempConfigItems: { [key: string]: any } = {};

        // Initialize all items in tempConfigItems
        defaultItemsForRole.forEach(({ item: itemData }) => {
          tempConfigItems[itemData.id] = {
            nav_item_id: genericNavItemDbIds.get(itemData.id), // Use actual DB ID
            role: bootstrapRole,
            parent_nav_item_id: null, // Default to null, will be updated
            order_index: 0, // Default to 0, will be updated
            _predefinedId: itemData.id, // Keep predefined ID for sorting
            _children: [], // Temporary array for building hierarchy
          };
        });

        // Build the hierarchy
        defaultItemsForRole.forEach(({ item: itemData, parentId }) => {
          const currentItem = tempConfigItems[itemData.id];
          if (parentId && tempConfigItems[parentId]) {
            currentItem.parent_nav_item_id = genericNavItemDbIds.get(parentId); // Use actual DB ID for parent
            tempConfigItems[parentId]._children.push(currentItem);
          }
        });

        // Flatten the tree and assign order_index
        const flattenedConfigsForDb = [];
        let currentOrderIndex = 0;

        const processNode = (nodeList: any[]) => {
          // Sort children by their predefined ID for consistent ordering
          nodeList.sort((a, b) => a._predefinedId.localeCompare(b._predefinedId));
          nodeList.forEach(item => {
            item.order_index = currentOrderIndex++;
            flattenedConfigsForDb.push({
              nav_item_id: item.nav_item_id,
              role: item.role,
              parent_nav_item_id: item.parent_nav_item_id,
              order_index: item.order_index,
            });
            if (item._children.length > 0) {
              processNode(item._children);
            }
          });
        };

        // Start processing from root items (those without a parent in tempConfigItems)
        const rootItems = Object.values(tempConfigItems).filter(item => !item.parent_nav_item_id);
        processNode(rootItems);

        console.log("[Edge Function] Flattened configs for DB (count):", flattenedConfigsForDb.length, "configs:", flattenedConfigsForDb);

        // Step 4: Insert new configs
        const { data: configsInsertResult, error: configsInsertError } = await supabaseAdminClient
          .from('role_nav_configs')
          .insert(flattenedConfigsForDb)
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