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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // 1. Get the role of the user invoking this function from their JWT
    const { data: { user: invokingUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !invokingUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Could not get invoking user.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const invokingUserRole = invokingUser.user_metadata.role as string; // Get role directly from JWT

    const { email, password, first_name, last_name, username, role: newUserRole, establishment_id, enrollment_start_date, enrollment_end_date } = await req.json(); // Added enrollment dates

    // 2. Role validation logic: Restrict newUserRole based on invokingUserRole
    let isAllowed = false;
    switch (invokingUserRole) {
      case 'administrator':
        // Administrator can create any role
        isAllowed = ['student', 'professeur', 'tutor', 'director', 'deputy_director', 'administrator'].includes(newUserRole);
        break;
      case 'director':
      case 'deputy_director':
        // Directors and Deputy Directors can create professeurs and tutors
        isAllowed = ['professeur', 'tutor'].includes(newUserRole);
        break;
      case 'professeur':
        // Professors can only create student roles
        isAllowed = newUserRole === 'student';
        break;
      default:
        // Other roles (like student, tutor) cannot create users via this function
        isAllowed = false;
    }

    if (!isAllowed) {
      return new Response(JSON.stringify({ error: `Forbidden: Your role (${invokingUserRole}) does not permit creating users with role '${newUserRole}'.` }), {
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
        role: newUserRole, // Pass the role name to user_metadata for handle_new_user trigger
        establishment_id: establishment_id, // Pass establishment_id to user_metadata
        enrollment_start_date: enrollment_start_date, // Pass enrollment_start_date
        enrollment_end_date: enrollment_end_date, // Pass enrollment_end_date
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