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

    // --- Ensure database schema exists (user_role enum, profiles table, handle_new_user trigger) ---
    // This is crucial if the database has been wiped or is new.
    const schemaSetupSql = `
      -- Create user_role enum if it doesn't exist
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
          CREATE TYPE public.user_role AS ENUM ('student', 'creator', 'tutor', 'administrator');
        END IF;
      END $$;

      -- Create profiles table if it doesn't exist
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        first_name TEXT,
        last_name TEXT,
        username TEXT,
        email TEXT,
        role public.user_role DEFAULT 'student'::public.user_role NOT NULL,
        establishment_id UUID,
        enrollment_start_date DATE,
        enrollment_end_date DATE,
        theme TEXT DEFAULT 'system'::text,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (id)
      );

      -- Add missing columns to profiles table if they don't exist (for robustness against older schemas)
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='first_name') THEN
          ALTER TABLE public.profiles ADD COLUMN first_name TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_name') THEN
          ALTER TABLE public.profiles ADD COLUMN last_name TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='username') THEN
          ALTER TABLE public.profiles ADD COLUMN username TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
          ALTER TABLE public.profiles ADD COLUMN email TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
          ALTER TABLE public.profiles ADD COLUMN role public.user_role DEFAULT 'student'::public.user_role NOT NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='establishment_id') THEN
          ALTER TABLE public.profiles ADD COLUMN establishment_id UUID;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='enrollment_start_date') THEN
          ALTER TABLE public.profiles ADD COLUMN enrollment_start_date DATE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='enrollment_end_date') THEN
          ALTER TABLE public.profiles ADD COLUMN enrollment_end_date DATE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='theme') THEN
          ALTER TABLE public.profiles ADD COLUMN theme TEXT DEFAULT 'system'::text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='created_at') THEN
          ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='updated_at') THEN
          ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
      END $$;

      -- Temporarily DISABLE RLS for diagnostic purposes
      ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

      -- Create or replace get_user_role function (SECURITY DEFINER to bypass RLS for role lookup)
      CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
      RETURNS public.user_role
      LANGUAGE PLPGSQL
      SECURITY DEFINER
      SET search_path = auth, public -- Search auth schema first
      AS $$
      DECLARE
        user_role_text TEXT;
        user_role public.user_role;
      BEGIN
        -- Query auth.users directly to get the role from raw_user_meta_data
        SELECT raw_user_meta_data ->> 'role' INTO user_role_text
        FROM auth.users
        WHERE id = user_id;

        -- Cast the text role to the user_role enum
        user_role := COALESCE(user_role_text::public.user_role, 'student'::public.user_role);
        
        RETURN user_role;
      END;
      $$;

      -- Drop existing policies before recreating them to ensure idempotency
      -- We are disabling RLS, so these policies will not be active, but we keep them for when RLS is re-enabled.
      DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
      DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
      DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
      DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
      DROP POLICY IF EXISTS "Administrators can view all profiles" ON public.profiles;
      DROP POLICY IF EXISTS "Administrators can insert profiles" ON public.profiles;
      DROP POLICY IF EXISTS "Administrators can update all profiles" ON public.profiles;
      DROP POLICY IF EXISTS "Administrators can delete profiles" ON public.profiles;
      DROP POLICY IF EXISTS "Creators and Tutors can view student profiles" ON public.profiles;

      -- Keep only the basic self-select policy for SELECT operations (will not be active with RLS disabled)
      CREATE POLICY "profiles_select_policy" ON public.profiles
      FOR SELECT TO authenticated USING (auth.uid() = id);

      -- Keep INSERT, UPDATE, DELETE policies as they are not causing the SELECT recursion (will not be active with RLS disabled)
      CREATE POLICY "profiles_insert_policy" ON public.profiles
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

      CREATE POLICY "profiles_update_policy" ON public.profiles
      FOR UPDATE TO authenticated USING (auth.uid() = id);

      CREATE POLICY "profiles_delete_policy" ON public.profiles
      FOR DELETE TO authenticated USING (auth.uid() = id);

      CREATE POLICY "Administrators can insert profiles" ON public.profiles
      FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'administrator');

      CREATE POLICY "Administrators can update all profiles" ON public.profiles
      FOR UPDATE USING (public.get_user_role(auth.uid()) = 'administrator');

      CREATE POLICY "Administrators can delete profiles" ON public.profiles
      FOR DELETE USING (public.get_user_role(auth.uid()) = 'administrator');

      CREATE POLICY "Creators and Tutors can view student profiles" ON public.profiles
      FOR SELECT USING (
        (role = 'student'::public.user_role) AND
        (((auth.jwt() -> 'user_metadata' ->> 'role')::public.user_role) = ANY (ARRAY['creator'::public.user_role, 'tutor'::public.user_role, 'administrator'::public.user_role]))
      );

      -- Create or replace handle_new_user function
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE PLPGSQL
      SECURITY DEFINER SET search_path = ''
      AS $$
      BEGIN
        INSERT INTO public.profiles (id, first_name, last_name, username, email, role)
        VALUES (
          new.id, 
          new.raw_user_meta_data ->> 'first_name', 
          new.raw_user_meta_data ->> 'last_name',
          new.raw_user_meta_data ->> 'username',
          new.email,
          COALESCE((new.raw_user_meta_data ->> 'role')::public.user_role, 'student'::public.user_role)
        );
        RETURN new;
      END;
      $$;

      -- Drop and recreate trigger to ensure it's always up-to-date
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;

    const { error: schemaError } = await supabaseAdminClient.rpc('execute_sql', { sql: schemaSetupSql });
    if (schemaError) {
      console.error("Error setting up database schema:", schemaError);
      return new Response(JSON.stringify({ error: 'Internal Server Error: Could not set up database schema.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
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
        role: 'administrator', // Always create an administrator for this bootstrap function
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