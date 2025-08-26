import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Removed DEFAULT_NAV_ITEMS_BY_ROLE

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
    // For all actions, require the user to be an 'administrator'.
    if (userError || !user) {
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
        // Removed delete itemToCreate.logical_id;
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
        // Removed delete itemToUpdate.logical_id;
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
      // Removed case 'bootstrap_defaults'
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
      // Removed case 'reinitialize_all_menus'
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