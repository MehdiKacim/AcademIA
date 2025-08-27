import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define default generic navigation items with a unique 'key' for internal linking
const DEFAULT_NAV_ITEMS_WITH_KEYS = [
  { key: 'nav-dashboard', label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', is_external: false, type: 'route' },
  { key: 'nav-courses', label: 'Mes Cours', route: '/courses', icon_name: 'BookOpen', is_external: false, type: 'route' },
  { key: 'nav-create-course', label: 'Créer un cours', route: '/create-course', icon_name: 'PlusSquare', is_external: false, type: 'route' },
  { key: 'nav-analytics', label: 'Analytiques', route: '/analytics?view=overview', icon_name: 'BarChart2', is_external: false, type: 'route' },
  { key: 'nav-all-notes', label: 'Toutes mes notes', route: '/all-notes', icon_name: 'NotebookText', is_external: false, type: 'route' },
  { key: 'nav-messages', label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', is_external: false, type: 'route' },
  // Removed nav-notifications
  { key: 'nav-profile', label: 'Mon Profil', route: '/profile', icon_name: 'User', is_external: false, type: 'route' },
  { key: 'nav-settings', label: 'Paramètres', route: '/settings', icon_name: 'Settings', is_external: false, type: 'route' },
  { key: 'nav-admin-users', label: 'Gestion des Utilisateurs', route: '/admin-users', icon_name: 'UserRoundCog', is_external: false, type: 'route' },
  { key: 'nav-subjects', label: 'Gestion des Matières', route: '/subjects', icon_name: 'BookText', is_external: false, type: 'route' },
  { key: 'nav-school-years', label: 'Gestion des Années Scolaires', route: '/school-years', icon_name: 'CalendarDays', is_external: false, type: 'route' },
  { key: 'nav-professor-assignments', label: 'Affectations Professeurs', route: '/professor-assignments', icon_name: 'UserCheck', is_external: false, type: 'route' },
  { key: 'nav-curricula', label: 'Gestion des Cursus', route: '/curricula', icon_name: 'LayoutList', is_external: false, type: 'route' },
  { key: 'nav-classes', label: 'Gestion des Classes', route: '/classes', icon_name: 'Users', is_external: false, type: 'route' },
  { key: 'nav-students', label: 'Gestion des Élèves', route: '/students', icon_name: 'GraduationCap', is_external: false, type: 'route' },
  { key: 'nav-pedagogical-management', label: 'Gestion Pédagogique', route: '/pedagogical-management', icon_name: 'ClipboardCheck', is_external: false, type: 'route' },
  { key: 'nav-admin-menu-management', label: 'Gestion des Menus', route: null, icon_name: 'LayoutList', is_external: false, type: 'category_or_action' },
  { key: 'nav-admin-generic-items', label: 'Éléments de navigation', route: '/admin-menu-management/generic-items', icon_name: 'LayoutList', is_external: false, type: 'route' },
  { key: 'nav-admin-role-configs', label: 'Configurations par rôle', route: '/admin-menu-management/role-configs', icon_name: 'UserRoundCog', is_external: false, type: 'route' },
  { key: 'nav-data-model', label: 'Modèle de données', route: '/data-model', icon_name: 'Code', is_external: false, type: 'route' },
  { key: 'nav-global-search', label: 'Recherche', icon_name: 'Search', is_external: false, type: 'category_or_action' }, // Action to open search overlay
  { key: 'nav-about', label: 'À propos', icon_name: 'Info', is_external: false, type: 'category_or_action' }, // Action to open about modal
  { key: 'nav-aia-chat', label: 'AiA Chat', icon_name: 'BotMessageSquare', is_external: false, type: 'category_or_action' }, // Action to open AiA chat

  // Add categories as generic nav items
  { key: 'cat-my-content', label: 'Mon Contenu', route: null, icon_name: 'BookOpen', is_external: false, type: 'category_or_action' },
  { key: 'cat-pedagogy', label: 'Pédagogie', route: null, icon_name: 'Users', is_external: false, type: 'category_or_action' },
  { key: 'cat-student-monitoring', label: 'Suivi Élèves', route: null, icon_name: 'UsersRound', is_external: false, type: 'category_or_action' },
];

// Define default role navigation configurations, referencing by 'key'
const DEFAULT_ROLE_NAV_CONFIGS_WITH_KEYS = {
  administrator: [
    { nav_item_key: 'nav-dashboard', parent_nav_item_key: null, order_index: 0 },
    { nav_item_key: 'nav-admin-users', parent_nav_item_key: null, order_index: 1 },
    { nav_item_key: 'nav-subjects', parent_nav_item_key: null, order_index: 2 },
    { nav_item_key: 'nav-school-years', parent_nav_item_key: null, order_index: 3 },
    { nav_item_key: 'nav-professor-assignments', parent_nav_item_key: null, order_index: 4 },
    { nav_item_key: 'nav-curricula', parent_nav_item_key: null, order_index: 5 },
    { nav_item_key: 'nav-classes', parent_nav_item_key: null, order_index: 6 },
    { nav_item_key: 'nav-students', parent_nav_item_key: null, order_index: 7 },
    { nav_item_key: 'nav-pedagogical-management', parent_nav_item_key: null, order_index: 8 },
    { nav_item_key: 'nav-analytics', parent_nav_item_key: null, order_index: 9 },
    { nav_item_key: 'nav-messages', parent_nav_item_key: null, order_index: 10 },
    // Removed nav-notifications
    { nav_item_key: 'nav-profile', parent_nav_item_key: null, order_index: 12 },
    { nav_item_key: 'nav-settings', parent_nav_item_key: null, order_index: 13 },
    { nav_item_key: 'nav-admin-menu-management', parent_nav_item_key: null, order_index: 14 },
    { nav_item_key: 'nav-admin-generic-items', parent_nav_item_key: 'nav-admin-menu-management', order_index: 0 },
    { nav_item_key: 'nav-admin-role-configs', parent_nav_item_key: 'nav-admin-menu-management', order_index: 1 },
    { nav_item_key: 'nav-data-model', parent_nav_item_key: null, order_index: 15 },
    { nav_item_key: 'nav-global-search', parent_nav_item_key: null, order_index: 16 },
    { nav_item_key: 'nav-about', parent_nav_item_key: null, order_index: 17 },
    { nav_item_key: 'nav-aia-chat', parent_nav_item_key: null, order_index: 18 },
  ],
  director: [
    { nav_item_key: 'nav-dashboard', parent_nav_item_key: null, order_index: 0 },
    { nav_item_key: 'nav-admin-users', parent_nav_item_key: null, order_index: 1 },
    { nav_item_key: 'nav-subjects', parent_nav_item_key: null, order_index: 2 },
    { nav_item_key: 'nav-school-years', parent_nav_item_key: null, order_index: 3 },
    { nav_item_key: 'nav-professor-assignments', parent_nav_item_key: null, order_index: 4 },
    { nav_item_key: 'nav-curricula', parent_nav_item_key: null, order_index: 5 },
    { nav_item_key: 'nav-classes', parent_nav_item_key: null, order_index: 6 },
    { nav_item_key: 'nav-students', parent_nav_item_key: null, order_index: 7 },
    { nav_item_key: 'nav-pedagogical-management', parent_nav_item_key: null, order_index: 8 },
    { nav_item_key: 'nav-analytics', parent_nav_item_key: null, order_index: 9 },
    { nav_item_key: 'nav-messages', parent_nav_item_key: null, order_index: 10 },
    // Removed nav-notifications
    { nav_item_key: 'nav-profile', parent_nav_item_key: null, order_index: 12 },
    { nav_item_key: 'nav-settings', parent_nav_item_key: null, order_index: 13 },
    { nav_item_key: 'nav-global-search', parent_nav_item_key: null, order_index: 14 },
    { nav_item_key: 'nav-about', parent_nav_item_key: null, order_index: 15 },
    { nav_item_key: 'nav-aia-chat', parent_nav_item_key: null, order_index: 16 },
  ],
  deputy_director: [
    { nav_item_key: 'nav-dashboard', parent_nav_item_key: null, order_index: 0 },
    { nav_item_key: 'nav-admin-users', parent_nav_item_key: null, order_index: 1 },
    { nav_item_key: 'nav-subjects', parent_nav_item_key: null, order_index: 2 },
    { nav_item_key: 'nav-school-years', parent_nav_item_key: null, order_index: 3 },
    { nav_item_key: 'nav-professor-assignments', parent_nav_item_key: null, order_index: 4 },
    { nav_item_key: 'nav-curricula', parent_nav_item_key: null, order_index: 5 },
    { nav_item_key: 'nav-classes', parent_nav_item_key: null, order_index: 6 },
    { nav_item_key: 'nav-students', parent_nav_item_key: null, order_index: 7 },
    { nav_item_key: 'nav-pedagogical-management', parent_nav_item_key: null, order_index: 8 },
    { nav_item_key: 'nav-analytics', parent_nav_item_key: null, order_index: 9 },
    { nav_item_key: 'nav-messages', parent_nav_item_key: null, order_index: 10 },
    // Removed nav-notifications
    { nav_item_key: 'nav-profile', parent_nav_item_key: null, order_index: 12 },
    { nav_item_key: 'nav-settings', parent_nav_item_key: null, order_index: 13 },
    { nav_item_key: 'nav-global-search', parent_nav_item_key: null, order_index: 14 },
    { nav_item_key: 'nav-about', parent_nav_item_key: null, order_index: 15 },
    { nav_item_key: 'nav-aia-chat', parent_nav_item_key: null, order_index: 16 },
  ],
  professeur: [
    { nav_item_key: 'nav-dashboard', parent_nav_item_key: null, order_index: 0 },
    { nav_item_key: 'cat-my-content', parent_nav_item_key: null, order_index: 1 },
    { nav_item_key: 'nav-courses', parent_nav_item_key: 'cat-my-content', order_index: 0 },
    { nav_item_key: 'nav-create-course', parent_nav_item_key: 'cat-my-content', order_index: 1 },
    { nav_item_key: 'cat-pedagogy', parent_nav_item_key: null, order_index: 2 },
    { nav_item_key: 'nav-classes', parent_nav_item_key: 'cat-pedagogy', order_index: 0 },
    { nav_item_key: 'nav-students', parent_nav_item_key: 'cat-pedagogy', order_index: 1 },
    { nav_item_key: 'nav-pedagogical-management', parent_nav_item_key: 'cat-pedagogy', order_index: 2 },
    { nav_item_key: 'nav-analytics', parent_nav_item_key: null, order_index: 3 },
    { nav_item_key: 'nav-messages', parent_nav_item_key: null, order_index: 4 },
    // Removed nav-notifications
    { nav_item_key: 'nav-profile', parent_nav_item_key: null, order_index: 6 },
    { nav_item_key: 'nav-settings', parent_nav_item_key: null, order_index: 7 },
    { nav_item_key: 'nav-global-search', parent_nav_item_key: null, order_index: 8 },
    { nav_item_key: 'nav-about', parent_nav_item_key: null, order_index: 9 },
    { nav_item_key: 'nav-aia-chat', parent_nav_item_key: null, order_index: 10 },
  ],
  tutor: [
    { nav_item_key: 'nav-dashboard', parent_nav_item_key: null, order_index: 0 },
    { nav_item_key: 'cat-student-monitoring', parent_nav_item_key: null, order_index: 1 },
    { nav_item_key: 'nav-pedagogical-management', parent_nav_item_key: 'cat-student-monitoring', order_index: 0 },
    { nav_item_key: 'nav-students', parent_nav_item_key: 'cat-student-monitoring', order_index: 1 },
    { nav_item_key: 'nav-analytics', parent_nav_item_key: null, order_index: 2 },
    { nav_item_key: 'nav-messages', parent_nav_item_key: null, order_index: 3 },
    // Removed nav-notifications
    { nav_item_key: 'nav-profile', parent_nav_item_key: null, order_index: 5 },
    { nav_item_key: 'nav-settings', parent_nav_item_key: null, order_index: 6 },
    { nav_item_key: 'nav-global-search', parent_nav_item_key: null, order_index: 7 },
    { nav_item_key: 'nav-about', parent_nav_item_key: null, order_index: 8 },
    { nav_item_key: 'nav-aia-chat', parent_nav_item_key: null, order_index: 9 },
  ],
  student: [
    { nav_item_key: 'nav-dashboard', parent_nav_item_key: null, order_index: 0 },
    { nav_item_key: 'nav-courses', parent_nav_item_key: null, order_index: 1 },
    { nav_item_key: 'nav-all-notes', parent_nav_item_key: null, order_index: 2 },
    { nav_item_key: 'nav-analytics', parent_nav_item_key: null, order_index: 3 },
    { nav_item_key: 'nav-messages', parent_nav_item_key: null, order_index: 4 },
    // Removed nav-notifications
    { nav_item_key: 'nav-profile', parent_nav_item_key: null, order_index: 6 },
    { nav_item_key: 'nav-settings', parent_nav_item_key: null, order_index: 7 },
    { nav_item_key: 'nav-global-search', parent_nav_item_key: null, order_index: 8 },
    { nav_item_key: 'nav-about', parent_nav_item_key: null, order_index: 9 },
    { nav_item_key: 'nav-aia-chat', parent_nav_item_key: null, order_index: 10 },
  ],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

    // Only administrators can trigger this bootstrap function
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: User not authenticated.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    } else {
      const userRole = user.user_metadata.role as string;
      if (userRole !== 'administrator') {
        return new Response(JSON.stringify({ error: 'Forbidden: Only administrators can bootstrap navigation items.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        });
      }
    }

    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Clear existing nav_items and role_nav_configs
    await supabaseAdminClient.from('role_nav_configs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdminClient.from('nav_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Insert default generic nav items, letting DB generate UUIDs
    const { data: insertedNavItems, error: navItemsError } = await supabaseAdminClient
      .from('nav_items')
      .insert(DEFAULT_NAV_ITEMS_WITH_KEYS.map(item => ({
        // DO NOT provide 'id' here, let DB generate it
        label: item.label,
        route: item.route,
        icon_name: item.icon_name,
        description: item.description,
        is_external: item.is_external,
        type: item.type,
      })))
      .select('id, label'); // Select generated id and label for mapping

    if (navItemsError) {
      // console.error("Error inserting default nav_items:", navItemsError);
      return new Response(JSON.stringify({ error: navItemsError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Create a map from original item label to generated UUID
    const navItemLabelToIdMap = new Map<string, string>();
    insertedNavItems.forEach(item => {
      navItemLabelToIdMap.set(item.label, item.id);
    });

    // 3. Insert default role navigation configurations, using mapped UUIDs
    const allRoleConfigsToInsert: any[] = [];
    for (const role in DEFAULT_ROLE_NAV_CONFIGS_WITH_KEYS) {
      const configsForRole = (DEFAULT_ROLE_NAV_CONFIGS_WITH_KEYS as any)[role];
      for (const config of configsForRole) {
        const originalNavItem = DEFAULT_NAV_ITEMS_WITH_KEYS.find(item => item.key === config.nav_item_key);
        if (!originalNavItem) {
          // console.warn(`Missing original nav item for key: ${config.nav_item_key} for role ${role}. Skipping config.`);
          continue;
        }
        const navItemId = navItemLabelToIdMap.get(originalNavItem.label);
        
        let parentNavItemId = null;
        if (config.parent_nav_item_key) {
          const originalParentItem = DEFAULT_NAV_ITEMS_WITH_KEYS.find(item => item.key === config.parent_nav_item_key);
          if (originalParentItem) {
            parentNavItemId = navItemLabelToIdMap.get(originalParentItem.label);
          } else {
            // console.warn(`Missing original parent nav item for key: ${config.parent_nav_item_key} for role ${role}. Parent will be null.`);
          }
        }

        if (!navItemId) {
          // console.warn(`Missing generated nav_item_id for label: ${originalNavItem.label} for role ${role}. Skipping config.`);
          continue;
        }

        allRoleConfigsToInsert.push({
          nav_item_id: navItemId,
          role: role,
          parent_nav_item_id: parentNavItemId,
          order_index: config.order_index,
        });
      }
    }

    const { error: roleConfigsError } = await supabaseAdminClient
      .from('role_nav_configs')
      .insert(allRoleConfigsToInsert);

    if (roleConfigsError) {
      // console.error("Error inserting default role_nav_configs:", roleConfigsError);
      return new Response(JSON.stringify({ error: roleConfigsError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'Default navigation items and role configurations bootstrapped successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    // console.error('Error in bootstrap-nav Edge Function:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});