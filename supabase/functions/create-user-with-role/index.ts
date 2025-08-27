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

    const invokingUserRole = invokingUser.user_metadata.role as string;
    const invokingUserEstablishmentId = invokingUser.user_metadata.establishment_id as string | undefined;

    const { email, password, first_name, last_name, username, role: newUserRole, establishment_id, enrollment_start_date, enrollment_end_date } = await req.json();

    // 2. Role validation logic: Restrict newUserRole based on invokingUserRole
    let isAllowed = false;
    let finalEstablishmentId = establishment_id; // Default to provided establishment_id

    switch (invokingUserRole) {
      case 'administrator':
        isAllowed = ['student', 'professeur', 'tutor', 'director', 'deputy_director', 'administrator'].includes(newUserRole);
        // For admin, no establishment restriction on creation, they can assign to any
        break;
      case 'director':
      case 'deputy_director':
        // Directors and Deputy Directors can create professeurs, tutors, and students
        isAllowed = ['professeur', 'tutor', 'student'].includes(newUserRole);
        // They can only create users for their own establishment
        if (!invokingUserEstablishmentId) {
          return new Response(JSON.stringify({ error: `Forbidden: Your role requires an establishment to create users.` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          });
        }
        // If an establishment_id is provided in the request, it must match the invoking user's establishment
        if (establishment_id && establishment_id !== invokingUserEstablishmentId) {
          return new Response(JSON.stringify({ error: `Forbidden: You can only create users for your own establishment.` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          });
        }
        // Force the new user's establishment_id to be the invoking user's establishment_id
        finalEstablishmentId = invokingUserEstablishmentId;
        break;
      case 'professeur':
        isAllowed = newUserRole === 'student';
        // Professors can only create students for their own establishment
        if (!invokingUserEstablishmentId) {
          return new Response(JSON.stringify({ error: `Forbidden: Your role requires an establishment to create students.` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          });
        }
        if (establishment_id && establishment_id !== invokingUserEstablishmentId) {
          return new Response(JSON.stringify({ error: `Forbidden: You can only create students for your own establishment.` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          });
        }
        finalEstablishmentId = invokingUserEstablishmentId;
        break;
      case 'tutor': // Tutors can also create students for their own establishment
        isAllowed = newUserRole === 'student';
        if (!invokingUserEstablishmentId) {
          return new Response(JSON.stringify({ error: `Forbidden: Your role requires an establishment to create students.` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          });
        }
        if (establishment_id && establishment_id !== invokingUserEstablishmentId) {
          return new Response(JSON.stringify({ error: `Forbidden: You can only create students for your own establishment.` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          });
        }
        finalEstablishmentId = invokingUserEstablishmentId;
        break;
      default:
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
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        username,
        role: newUserRole,
        establishment_id: finalEstablishmentId || null, // Use finalEstablishmentId
        enrollment_start_date: enrollment_start_date || null, // Pass null if undefined
        enrollment_end_date: enrollment_end_date || null, // Pass null if undefined
      },
    });

    if (signUpError) {
      // console.error("Error creating user with admin client:", signUpError);
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
    // console.error('Error in create-user-with-role Edge Function:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});