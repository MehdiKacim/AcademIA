import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define default generic navigation items
const DEFAULT_NAV_ITEMS = [
  { id: 'nav-dashboard', label: 'Tableau de bord', route: '/dashboard', icon_name: 'LayoutDashboard', is_external: false, type: 'route' },
  { id: 'nav-courses', label: 'Mes Cours', route: '/courses', icon_name: 'BookOpen', is_external: false, type: 'route' },
  { id: 'nav-create-course', label: 'Créer un cours', route: '/create-course', icon_name: 'PlusSquare', is_external: false, type: 'route' },
  { id: 'nav-analytics', label: 'Analytiques', route: '/analytics?view=overview', icon_name: 'BarChart2', is_external: false, type: 'route' },
  { id: 'nav-all-notes', label: 'Toutes mes notes', route: '/all-notes', icon_name: 'NotebookText', is_external: false, type: 'route' },
  { id: 'nav-messages', label: 'Messagerie', route: '/messages', icon_name: 'MessageSquare', is_external: false, type: 'route' },
  { id: 'nav-profile', label: 'Mon Profil', route: '/profile', icon_name: 'User', is_external: false, type: 'route' },
  { id: 'nav-settings', label: 'Paramètres', route: '/settings', icon_name: 'Settings', is_external: false, type: 'route' },
  { id: 'nav-admin-users', label: 'Gestion des Utilisateurs', route: '/admin-users', icon_name: 'UserRoundCog', is_external: false, type: 'route' },
  { id: 'nav-subjects', label: 'Gestion des Matières', route: '/subjects', icon_name: 'BookText', is_external: false, type: 'route' },
  { id: 'nav-school-years', label: 'Gestion des Années Scolaires', route: '/school-years', icon_name: 'CalendarDays', is_external: false, type: 'route' },
  { id: 'nav-professor-assignments', label: 'Affectations Professeurs', route: '/professor-assignments', icon_name: 'UserCheck', is_external: false, type: 'route' },
  { id: 'nav-curricula', label: 'Gestion des Cursus', route: '/curricula', icon_name: 'LayoutList', is_external: false, type: 'route' },
  { id: 'nav-classes', label: 'Gestion des Classes', route: '/classes', icon_name: 'Users', is_external: false, type: 'route' },
  { id: 'nav-students', label: 'Gestion des Élèves', route: '/students', icon_name: 'GraduationCap', is_external: false, type: 'route' },
  { id: 'nav-pedagogical-management', label: 'Gestion Pédagogique', route: '/pedagogical-management', icon_name: 'ClipboardCheck', is_external: false, type: 'route' },
  { id: 'nav-admin-menu-management', label: 'Gestion des Menus', route: '/admin-menu-management', icon_name: 'LayoutList', is_external: false, type: 'category_or_action' },
  { id: 'nav-admin-generic-items', label: 'Éléments de navigation', route: '/admin-menu-management/generic-items', icon_name: 'LayoutList', is_external: false, type: 'route' },
  { id: 'nav-admin-role-configs', label: 'Configurations par rôle', route: '/admin-menu-management/role-configs', icon_name: 'UserRoundCog', is_external: false, type: 'route' },
  { id: 'nav-data-model', label: 'Modèle de données', route: '/data-model', icon_name: 'Code', is_external: false, type: 'route' },
  { id: 'nav-global-search', label: 'Recherche', icon_name: 'Search', is_external: false, type: 'category_or_action' }, // Action to open search overlay
  { id: 'nav-about', label: 'À propos', icon_name: 'Info', is_external: false, type: 'category_or_action' }, // Action to open about modal
  { id: 'nav-aia-chat', label: 'AiA Chat', icon_name: 'BotMessageSquare', is_external: false, type: 'category_or_action' }, // Action to open AiA chat
];

// Define default role navigation configurations
const DEFAULT_ROLE_NAV_CONFIGS = {
  administrator: [
    { nav_item_id: 'nav-dashboard', parent_nav_item_id: null, order_index: 0 },
    { nav_item_id: 'nav-admin-users', parent_nav_item_id: null, order_index: 1 },
    { nav_item_id: 'nav-subjects', parent_nav_item_id: null, order_index: 2 },
    { nav_item_id: 'nav-school-years', parent_nav_item_id: null, order_index: 3 },
    { nav_item_id: 'nav-professor-assignments', parent_nav_item_id: null, order_index: 4 },
    { nav_item_id: 'nav-curricula', parent_nav_item_id: null, order_index: 5 },
    { nav_item_id: 'nav-classes', parent_nav_item_id: null, order_index: 6 },
    { nav_item_id: 'nav-students', parent_nav_item_id: null, order_index: 7 },
    { nav_item_id: 'nav-pedagogical-management', parent_nav_item_id: null, order_index: 8 },
    { nav_item_id: 'nav-messages', parent_nav_item_id: null, order_index: 9 },
    { nav_item_id: 'nav-profile', parent_nav_item_id: null, order_index: 10 },
    { nav_item_id: 'nav-settings', parent_nav_item_id: null, order_index: 11 },
    { nav_item_id: 'nav-admin-menu-management', parent_nav_item_id: null, order_index: 12 },
    { nav_item_id: 'nav-admin-generic-items', parent_nav_item_id: 'nav-admin-menu-management', order_index: 0 },
    { nav_item_id: 'nav-admin-role-configs', parent_nav_item_id: 'nav-admin-menu-management', order_index: 1 },
    { nav_item_id: 'nav-data-model', parent_nav_item_id: null, order_index: 13 },
    { nav_item_id: 'nav-global-search', parent_nav_item_id: null, order_index: 14 },
    { nav_item_id: 'nav-about', parent_nav_item_id: null, order_index: 15 },
    { nav_item_id: 'nav-aia-chat', parent_nav_item_id: null, order_index: 16 },
  ],
  director: [
    { nav_item_id: 'nav-dashboard', parent_nav_item_id: null, order_index: 0 },
    { nav_item_id: 'nav-admin-users', parent_nav_item_id: null, order_index: 1 }, // Directors manage users
    { nav_item_id: 'nav-subjects', parent_nav_item_id: null, order_index: 2 },
    { nav_item_id: 'nav-school-years', parent_nav_item_id: null, order_index: 3 },
    { nav_item_id: 'nav-professor-assignments', parent_nav_item_id: null, order_index: 4 },
    { nav_item_id: 'nav-curricula', parent_nav_item_id: null, order_index: 5 },
    { nav_item_id: 'nav-classes', parent_nav_item_id: null, order_index: 6 },
    { nav_item_id: 'nav-students', parent_nav_item_id: null, order_index: 7 },
    { nav_item_id: 'nav-pedagogical-management', parent_nav_item_id: null, order_index: 8 },
    { nav_item_id: 'nav-analytics', parent_nav_item_id: null, order_index: 9 },
    { nav_item_id: 'nav-messages', parent_nav_item_id: null, order_index: 10 },
    { nav_item_id: 'nav-profile', parent_nav_item_id: null, order_index: 11 },
    { nav_item_id: 'nav-settings', parent_nav_item_id: null, order_index: 12 },
    { nav_item_id: 'nav-global-search', parent_nav_item_id: null, order_index: 13 },
    { nav_item_id: 'nav-about', parent_nav_item_id: null, order_index: 14 },
    { nav_item_id: 'nav-aia-chat', parent_nav_item_id: null, order_index: 15 },
  ],
  deputy_director: [
    { nav_item_id: 'nav-dashboard', parent_nav_item_id: null, order_index: 0 },
    { nav_item_id: 'nav-admin-users', parent_nav_item_id: null, order_index: 1 }, // Deputy Directors manage users
    { nav_item_id: 'nav-subjects', parent_nav_item_id: null, order_index: 2 },
    { nav_item_id: 'nav-school-years', parent_nav_item_id: null, order_index: 3 },
    { nav_item_id: 'nav-professor-assignments', parent_nav_item_id: null, order_index: 4 },
    { nav_item_id: 'nav-curricula', parent_nav_item_id: null, order_index: 5 },
    { nav_item_id: 'nav-classes', parent_nav_item_id: null, order_index: 6 },
    { nav_item_id: 'nav-students', parent_nav_item_id: null, order_index: 7 },
    { nav_item_id: 'nav-pedagogical-management', parent_nav_item_id: null, order_index: 8 },
    { nav_item_id: 'nav-analytics', parent_nav_item_id: null, order_index: 9 },
    { nav_item_id: 'nav-messages', parent_nav_item_id: null, order_index: 10 },
    { nav_item_id: 'nav-profile', parent_nav_item_id: null, order_index: 11 },
    { nav_item_id: 'nav-settings', parent_nav_item_id: null, order_index: 12 },
    { nav_item_id: 'nav-global-search', parent_nav_item_id: null, order_index: 13 },
    { nav_item_id: 'nav-about', parent_nav_item_id: null, order_index: 14 },
    { nav_item_id: 'nav-aia-chat', parent_nav_item_id: null, order_index: 15 },
  ],
  professeur: [
    { nav_item_id: 'nav-dashboard', parent_nav_item_id: null, order_index: 0 },
    { id: 'cat-my-content', label: 'Mon Contenu', icon_name: 'BookOpen', is_external: false, type: 'category_or_action', parent_nav_item_id: null, order_index: 1 },
    { nav_item_id: 'nav-courses', parent_nav_item_id: 'cat-my-content', order_index: 0 },
    { nav_item_id: 'nav-create-course', parent_nav_item_id: 'cat-my-content', order_index: 1 },
    { id: 'cat-pedagogy', label: 'Pédagogie', icon_name: 'Users', is_external: false, type: 'category_or_action', parent_nav_item_id: null, order_index: 2 },
    { nav_item_id: 'nav-classes', parent_nav_item_id: 'cat-pedagogy', order_index: 0 },
    { nav_item_id: 'nav-students', parent_nav_item_id: 'cat-pedagogy', order_index: 1 },
    { nav_item_id: 'nav-pedagogical-management', parent_nav_item_id: 'cat-pedagogy', order_index: 2 },
    { nav_item_id: 'nav-analytics', parent_nav_item_id: null, order_index: 3 },
    { nav_item_id: 'nav-messages', parent_nav_item_id: null, order_index: 4 },
    { nav_item_id: 'nav-profile', parent_nav_item_id: null, order_index: 5 },
    { nav_item_id: 'nav-settings', parent_nav_item_id: null, order_index: 6 },
    { nav_item_id: 'nav-global-search', parent_nav_item_id: null, order_index: 7 },
    { nav_item_id: 'nav-about', parent_nav_item_id: null, order_index: 8 },
    { nav_item_id: 'nav-aia-chat', parent_nav_item_id: null, order_index: 9 },
  ],
  tutor: [
    { nav_item_id: 'nav-dashboard', parent_nav_item_id: null, order_index: 0 },
    { id: 'cat-student-monitoring', label: 'Suivi Élèves', icon_name: 'UsersRound', is_external: false, type: 'category_or_action', parent_nav_item_id: null, order_index: 1 },
    { nav_item_id: 'nav-pedagogical-management', parent_nav_item_id: 'cat-student-monitoring', order_index: 0 },
    { nav_item_id: 'nav-students', parent_nav_item_id: 'cat-student-monitoring', order_index: 1 },
    { nav_item_id: 'nav-analytics', parent_nav_item_id: null, order_index: 2 },
    { nav_item_id: 'nav-messages', parent_nav_item_id: null, order_index: 3 },
    { nav_item_id: 'nav-profile', parent_nav_item_id: null, order_index: 4 },
    { nav_item_id: 'nav-settings', parent_nav_item_id: null, order_index: 5 },
    { nav_item_id: 'nav-global-search', parent_nav_item_id: null, order_index: 6 },
    { nav_item_id: 'nav-about', parent_nav_item_id: null, order_index: 7 },
    { nav_item_id: 'nav-aia-chat', parent_nav_item_id: null, order_index: 8 },
  ],
  student: [
    { nav_item_id: 'nav-dashboard', parent_nav_item_id: null, order_index: 0 },
    { nav_item_id: 'nav-courses', parent_nav_item_id: null, order_index: 1 },
    { nav_item_id: 'nav-all-notes', parent_nav_item_id: null, order_index: 2 },
    { nav_item_id: 'nav-analytics', parent_nav_item_id: null, order_index: 3 },
    { nav_item_id: 'nav-messages', parent_nav_item_id: null, order_index: 4 },
    { nav_item_id: 'nav-profile', parent_nav_item_id: null, order_index: 5 },
    { nav_item_id: 'nav-settings', parent_nav_item_id: null, order_index: 6 },
    { nav_item_id: 'nav-global-search', parent_nav_item_id: null, order_index: 7 },
    { nav_item_id: 'nav-about', parent_nav_item_id: null, order_index: 8 },
    { nav_item_id: 'nav-aia-chat', parent_nav_item_id: null, order_index: 9 },
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

    // 2. Insert default generic nav items
    const { data: insertedNavItems, error: navItemsError } = await supabaseAdminClient
      .from('nav_items')
      .insert(DEFAULT_NAV_ITEMS.map(item => ({
        id: item.id,
        label: item.label,
        route: item.route,
        icon_name: item.icon_name,
        description: item.description,
        is_external: item.is_external,
        type: item.type,
      })))
      .select();

    if (navItemsError) {
      console.error("Error inserting default nav_items:", navItemsError);
      return new Response(JSON.stringify({ error: navItemsError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // 3. Insert default role navigation configurations
    const allRoleConfigsToInsert: any[] = [];
    for (const role in DEFAULT_ROLE_NAV_CONFIGS) {
      const configsForRole = (DEFAULT_ROLE_NAV_CONFIGS as any)[role];
      for (const config of configsForRole) {
        // Check if the item is a category defined directly in DEFAULT_ROLE_NAV_CONFIGS
        const isCategoryDefinedInline = DEFAULT_NAV_ITEMS.find(item => item.id === config.id && item.type === 'category_or_action');
        
        if (config.id && isCategoryDefinedInline) { // If it's an inline category definition
          allRoleConfigsToInsert.push({
            nav_item_id: config.id, // Use the ID defined in the config
            role: role,
            parent_nav_item_id: config.parent_nav_item_id,
            order_index: config.order_index,
          });
        } else { // Standard nav_item_id reference
          allRoleConfigsToInsert.push({
            nav_item_id: config.nav_item_id,
            role: role,
            parent_nav_item_id: config.parent_nav_item_id,
            order_index: config.order_index,
          });
        }
      }
    }

    const { error: roleConfigsError } = await supabaseAdminClient
      .from('role_nav_configs')
      .insert(allRoleConfigsToInsert);

    if (roleConfigsError) {
      console.error("Error inserting default role_nav_configs:", roleConfigsError);
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
    console.error('Error in bootstrap-nav Edge Function:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});