import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // 1. Get the role of the user invoking this function using the RPC function
    const { data: { user: invokingUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !invokingUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Could not get invoking user.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { data: invokingUserRoleData, error: rpcError } = await supabaseClient.rpc('get_user_role', { user_id: invokingUser.id });

    if (rpcError || !invokingUserRoleData) {
      console.error("Error fetching invoking user role via RPC:", rpcError);
      return new Response(JSON.stringify({ error: 'Unauthorized: Could not get invoking user role.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const invokingUserRole = invokingUserRoleData; // rpc returns the role directly
    const { email, password, first_name, last_name, username, role: newUserRole } = await req.json();

    // 2. Role validation logic: Restrict newUserRole based on invokingUserRole
    if (invokingUserRole === 'administrator') {
      // Admins can create any role (student, creator, tutor, administrator)
      if (!['student', 'creator', 'tutor', 'administrator'].includes(newUserRole)) {
        return new Response(JSON.stringify({ error: 'Administrators can only create student, creator, tutor, or administrator roles.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        });
      }
    } else if (invokingUserRole === 'creator') {
      // Creators can only create student roles
      if (newUserRole !== 'student') {
        return new Response(JSON.stringify({ error: 'Creators can only create student roles.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        });
      }
    } else {
      // Other roles (like student, tutor) cannot create users via this function
      return new Response(JSON.stringify({ error: 'Forbidden: Your role does not permit user creation.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // Use the service role key for signup to bypass RLS and email confirmation
    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: newUserData, error: signUpError } = await supabaseAdminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Set to true to avoid email confirmation for admin-created users
      user_metadata: {
        first_name,
        last_name,
        username,
        role: newUserRole,
      },
    });

    if (signUpError) {
      console.error("Error creating user with admin client:", signUpError);
      return new Response(JSON.stringify({ error: signUpError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ message: 'User created successfully', userId: newUserData.user?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in create-user-with-role Edge Function:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});