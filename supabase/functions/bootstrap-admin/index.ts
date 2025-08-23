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
    const { email, password, first_name, last_name, username } = await req.json();

    // Use the service role key for signup to bypass RLS and email confirmation
    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if an administrator already exists
    const { data: existingAdmins, error: checkError } = await supabaseAdminClient
      .from('profiles')
      .select('id')
      .eq('role', 'administrator');

    if (checkError) {
      console.error("Error checking for existing administrators:", checkError);
      return new Response(JSON.stringify({ error: 'Internal Server Error: Could not check for existing administrators.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(JSON.stringify({ error: 'An administrator already exists. Cannot create initial administrator.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const { data: newUserData, error: signUpError } = await supabaseAdminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Set to true to avoid email confirmation for admin-created users
      user_metadata: {
        first_name,
        last_name,
        username,
        role: 'administrator', // Always create as administrator
      },
    });

    if (signUpError) {
      console.error("Error creating user with admin client:", signUpError);
      return new Response(JSON.stringify({ error: signUpError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ message: 'Initial administrator created successfully', userId: newUserData.user?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in bootstrap-admin Edge Function:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});