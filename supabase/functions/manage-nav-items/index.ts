import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define default nav item structures for each role
const DEFAULT_NAV_ITEMS_BY_ROLE = {
  administrator: [
    { item: { label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de l'application", is_external: false, type: 'route' } },
    { item: { label: 'Gestion des Menus', route: null, icon_name: 'LayoutList', description: "Configurez les menus de navigation", is_external: false, type: 'category_or_action' } },
    { item: { label: 'Éléments de navigation', route: '/admin-menu-management/generic-items', icon_name: 'LayoutList', description: "Gérez les définitions de base des éléments de navigation", is_external: false, type: 'route' }, parentLabel: 'Gestion des Menus' },
    { item: { label: 'Configuration par rôle', route: '/admin-menu-management/role-configs', icon_name: 'UserRoundCog', description: "Configurez les menus pour chaque rôle utilisateur", is_external: false, type: 'route' }, parentLabel: 'Gestion des Menus' },
    { item: { label: 'Gestion des Utilisateurs', route: '/admin-users', icon_name: 'UsersRound', description: "Gérez les profils et les rôles des utilisateurs", is_external: false, type: 'route' } },
    { item: { label: 'Gestion des Matières', route: '/subjects', icon_name: 'BookText', description: "Créez et gérez les matières scolaires", is_external: false, type: 'route' } },
    { item: { label: 'Gestion des Années Scolaires', route: '/school-years', icon_name: 'CalendarDays', description: "Créez et gérez les années scolaires", is_external: false, type: 'route' } },
    { item: { label: 'Gestion des Affectations Professeurs-Matières', route: '/professor-assignments', icon_name: 'UserCheck', description: "Affectez les professeurs aux matières et classes", is_external: false, type: 'route' } },
    { item: { label: 'Gestion des Cursus', route: '/curricula', icon_name: 'LayoutList', description: "Créez et gérez les cursus scolaires", is_external: false, type: 'route' } },
    { item: { label: 'Gestion des Classes', route: '/classes', icon_name: 'Users', description: "Créez et gérez les classes", is_external: false, type: 'route' } },
    { item: { label: 'Gestion Pédagogique', route: '/pedagogical-management', icon_name: 'GraduationCap', description: "Gérez les affectations des élèves aux classes", is_external: false, type: 'route' } },
    { item: { label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec les autres utilisateurs", is_external: false, type: 'route' } },
    { item: { label: 'Mon Profil', route: '/profile', icon_name: 'User', description: "Affichez et modifiez votre profil", is_external: false, type: 'route' } },
    { item: { label: 'Paramètres', route: '/settings', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false, type: 'route' } },
    { item: { label: 'Analytiques', route: '/analytics', icon_name: 'LineChart', description: "Consultez les statistiques de l'application", is_external: false, type: 'route' } },
  ],
  student: [
    { item: { label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de votre progression", is_external: false, type: 'route' } },
    { item: { label: 'Mes Cours', route: '/courses', icon_name: 'BookOpen', description: "Accédez à vos cours et suivez votre progression", is_external: false, type: 'route' } },
    { item: { label: 'Toutes mes notes', route: '/all-notes', icon_name: 'NotebookText', description: "Retrouvez toutes vos notes", is_external: false, type: 'route' } },
    { item: { label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec vos professeurs et tuteurs", is_external: false, type: 'route' } },
    { item: { label: 'Mon Profil', route: '/profile', icon_name: 'User', description: "Affichez et modifiez votre profil", is_external: false, type: 'route' } },
    { item: { label: 'Paramètres', route: '/settings', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false, type: 'route' } },
    { item: { label: 'Analytiques', route: '/analytics', icon_name: 'LineChart', description: "Consultez vos statistiques d'apprentissage", is_external: false, type: 'route' } },
  ],
  professeur: [
    { item: { label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de vos cours et élèves", is_external: false, type: 'route' } },
    { item: { label: 'Gestion des Cours', route: '/courses', icon_name: 'BookOpen', description: "Gérez les cours que vous avez créés", is_external: false, type: 'route' } },
    { item: { label: 'Créer un cours', route: '/create-course', icon_name: 'PlusSquare', description: "Créez un nouveau cours", is_external: false, type: 'route' } },
    { item: { label: 'Gestion des Classes', route: '/classes', icon_name: 'Users', description: "Gérez les classes que vous supervisez", is_external: false, type: 'route' } },
    { item: { label: 'Gestion Pédagogique', route: '/pedagogical-management', icon_name: 'GraduationCap', description: "Gérez les affectations des élèves aux classes", is_external: false, type: 'route' } },
    { item: { label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec vos élèves et collègues", is_external: false, type: 'route' } },
    { item: { label: 'Mon Profil', route: '/profile', icon_name: 'User', description: "Affichez et modifiez votre profil", is_external: false, type: 'route' } },
    { item: { label: 'Paramètres', route: '/settings', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false, type: 'route' } },
    { item: { label: 'Analytiques', route: '/analytics', icon_name: 'LineChart', description: "Consultez les statistiques de vos cours et élèves", is_external: false, type: 'route' } },
  ],
  tutor: [
    { item: { label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de vos élèves", is_external: false, type: 'route' } },
    { item: { label: 'Gestion Pédagogique', route: '/pedagogical-management', icon_name: 'GraduationCap', description: "Gérez les affectations des élèves aux classes", is_external: false, type: 'route' } },
    { item: { label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec vos élèves et collègues", is_external: false, type: 'route' } },
    { item: { label: 'Mon Profil', route: '/profile', icon_name: 'User', description: "Affichez et modifiez votre profil", is_external: false, type: 'route' } },
    { item: { label: 'Paramètres', route: '/settings', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false, type: 'route' } },
    { item: { label: 'Analytiques', route: '/analytics', icon_name: 'LineChart', description: "Consultez les statistiques de vos élèves", is_external: false, type: 'route' } },
  ],
  director: [
    { item: { label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de votre établissement", is_external: false, type: 'route' } },
    { item: { label: 'Gestion des Utilisateurs', route: '/admin-users', icon_name: 'UsersRound', description: "Gérez les profils et les rôles des utilisateurs", is_external: false, type: 'route' } },
    { item: { label: 'Gestion des Matières', route: '/subjects', icon_name: 'BookText', description: "Créez et gérez les matières scolaires", is_external: false, type: 'route' } },
    { item: { label: 'Gestion des Années Scolaires', route: '/school-years', icon_name: 'CalendarDays', description: "Créez et gérez les années scolaires", is_external: false, type: 'route' } },
    { item: { label: 'Gestion des Affectations Professeurs-Matières', route: '/professor-assignments', icon_name: 'UserCheck', description: "Affectez les professeurs aux matières et classes", is_external: false, type: 'route' } },
    { item: { label: 'Gestion des Cursus', route: '/curricula', icon_name: 'LayoutList', description: "Créez et gérez les cursus scolaires", is_external: false, type: 'route' } },
    { item: { label: 'Gestion des Classes', route: '/classes', icon_name: 'Users', description: "Créez et gérez les classes", is_external: false, type: 'route' } },
    { item: { label: 'Gestion Pédagogique', route: '/pedagogical-management', icon_name: 'GraduationCap', description: "Gérez les affectations des élèves aux classes", is_external: false, type: 'route' } },
    { item: { label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec les autres utilisateurs", is_external: false, type: 'route' } },
    { item: { label: 'Mon Profil', route: '/profile', icon_name: 'User', description: "Affichez et modifiez votre profil", is_external: false, type: 'route' } },
    { item: { label: 'Paramètres', route: '/settings', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false, type: 'route' } },
    { item: { label: 'Analytiques', route: '/analytics', icon_name: 'LineChart', description: "Consultez les statistiques de votre établissement", is_external: false, type: 'route' } },
  ],
  deputy_director: [
    { item: { label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', description: "Vue d'overview de votre établissement", is_external: false, type: 'route' } },
    { item: { label: 'Gestion des Utilisateurs', route: '/admin-users', icon_name: 'UsersRound', description: "Gérez les profils et les rôles des utilisateurs", is_external: false, type: 'route' } },
    { item: { label: 'Gestion des Matières', route: '/subjects', icon_name: 'BookText', description: "Créez et gérez les matières scolaires", is_external: false, type: 'route' } },
    { item: { label: 'Gestion des Années Scolaires', route: '/school-years', icon_name: 'CalendarDays', description: "Créez et gérez les années scolaires", is_external: false, type: 'route' } },
    { item: { label: 'Gestion des Affectations Professeurs-Matières', route: '/professor-assignments', icon_name: 'UserCheck', description: "Affectez les professeurs aux matières et classes", is_external: false, type: 'route' } },
    { item: { label: 'Gestion des Cursus', route: '/curricula', icon_name: 'LayoutList', description: "Créez et gérez les cursus scolaires", is_external: false, type: 'route' } },
    { item: { label: 'Gestion des Classes', route: '/classes', icon_name: 'Users', description: "Créez et gérez les classes", is_external: false, type: 'route' } },
    { item: { label: 'Gestion Pédagogique', route: '/pedagogical-management', icon_name: 'GraduationCap', description: "Gérez les affectations des élèves aux classes", is_external: false, type: 'route' } },
    { item: { label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', description: "Communiquez avec les autres utilisateurs", is_external: false, type: 'route' } },
    { item: { label: 'Mon Profil', route: '/profile', icon_name: 'User', description: "Affichez et modifiez votre profil", is_external: false, type: 'route' } },
    { item: { label: 'Paramètres', route: '/settings', icon_name: 'Settings', description: "Gérez les préférences de l'application", is_external: false, type: 'route' } },
    { item: { label: 'Analytiques', route: '/analytics', icon_name: 'LineChart', description: "Consultez les statistiques de votre établissement", is_external: false, type: 'route' } },
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

        const navItemMap = new Map(); // Map label to nav_item_id

        // Step 2: Ensure all generic nav_items exist and get their IDs
        for (const { item: itemData } of defaultItemsForRole) {
          const { data: existingItem, error: fetchError } = await supabaseAdminClient
            .from('nav_items')
            .select('id')
            .eq('label', itemData.label)
            .maybeSingle();

          if (fetchError) {
            console.error(`[Edge Function] Error checking for existing nav item '${itemData.label}':`, fetchError);
            throw fetchError;
          }

          if (existingItem) {
            navItemMap.set(itemData.label, existingItem.id);
          } else {
            console.log(`[Edge Function] Inserting new generic nav_item: ${itemData.label}`);
            const { data: newItem, error: insertItemError } = await supabaseAdminClient
              .from('nav_items')
              .insert(itemData)
              .select('id')
              .single();
            if (insertItemError) {
              console.error(`[Edge Function] Error inserting nav item '${itemData.label}':`, insertItemError);
              throw insertItemError;
            }
            navItemMap.set(itemData.label, newItem.id);
          }
        }
        console.log("[Edge Function] navItemMap after generic item processing:", navItemMap);

        // Step 3: Build the hierarchical structure for default configs and assign order_index
        const structuredDefaultItems = [];
        const tempItemMap = new Map(); // Map nav_item.id to NavItem with children array

        // First pass: create all NavItem objects with their generic IDs
        defaultItemsForRole.forEach(({ item: itemData }) => {
          const navItemId = navItemMap.get(itemData.label);
          if (navItemId) {
            tempItemMap.set(navItemId, {
              id: navItemId,
              label: itemData.label,
              route: itemData.route || undefined,
              icon_name: itemData.icon_name || undefined,
              description: itemData.description || undefined,
              is_external: itemData.is_external,
              type: itemData.type, // Set the type here
              children: [], // Initialize children
              order_index: 0, // Will be set later
              parent_nav_item_id: undefined, // Will be set later
            });
          }
        });

        // Second pass: assign parent_nav_item_id and build the tree structure
        defaultItemsForRole.forEach(({ item: itemData, parentLabel }) => {
          const navItemId = navItemMap.get(itemData.label);
          if (navItemId) {
            const currentItem = tempItemMap.get(navItemId);
            if (currentItem) {
              if (parentLabel) {
                const parentNavItemId = navItemMap.get(parentLabel);
                if (parentNavItemId) {
                  const parentItem = tempItemMap.get(parentNavItemId);
                  if (parentItem) {
                    currentItem.parent_nav_item_id = parentNavItemId;
                    parentItem.children?.push(currentItem);
                  }
                } else {
                  console.warn(`[Edge Function] Parent label '${parentLabel}' not found in navItemMap for item '${itemData.label}'. It will be treated as a root item.`);
                  structuredDefaultItems.push(currentItem); // Treat as root if parent not found
                }
              } else {
                structuredDefaultItems.push(currentItem); // Root item
              }
            }
          }
        });
        console.log("[Edge Function] Structured default items (before order assignment):", structuredDefaultItems);

        // Third pass: assign order_index based on the structured tree
        const assignOrderIndices = (items, parentId) => {
          items.sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically for consistent default order
          items.forEach((item, index) => {
            item.order_index = index;
            item.parent_nav_item_id = parentId === null ? undefined : parentId; // Ensure parent_nav_item_id is undefined for root items
            if (item.children && item.children.length > 0) {
              assignOrderIndices(item.children, item.id);
            }
          });
        };

        assignOrderIndices(structuredDefaultItems, null);
        console.log("[Edge Function] Structured default items (after order assignment):", structuredDefaultItems);

        // Flatten the structuredDefaultItems back into a list for DB insertion
        const flattenedConfigsForDb = [];
        const flattenTree = (items) => {
          items.forEach(item => {
            flattenedConfigsForDb.push({
              nav_item_id: item.id,
              role: bootstrapRole,
              parent_nav_item_id: item.parent_nav_item_id || null, // Ensure null for root items
              order_index: item.order_index,
            });
            if (item.children) {
              flattenTree(item.children);
            }
          });
        };
        flattenTree(structuredDefaultItems);
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