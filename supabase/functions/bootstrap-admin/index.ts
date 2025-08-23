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
      -- Drop existing trigger and function first to avoid conflicts
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      DROP FUNCTION IF EXISTS public.handle_new_user();
      DROP FUNCTION IF EXISTS public.get_user_role(UUID); -- Ensure this is dropped if it still exists

      -- Drop existing policies on public.profiles
      DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Administrators can view all profiles" ON public.profiles;
      DROP POLICY IF EXISTS "Administrators can insert profiles" ON public.profiles;
      DROP POLICY IF EXISTS "Administrators can update all profiles" ON public.profiles;
      DROP POLICY IF EXISTS "Administrators can delete profiles" ON public.profiles;
      DROP POLICY IF EXISTS "Creators and Tutors can view student profiles" ON public.profiles;

      -- Disable RLS temporarily on profiles to allow schema changes
      ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

      -- Drop the user_role enum if it exists, as we're moving to a table
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
          DROP TYPE public.user_role CASCADE; -- CASCADE will drop dependent objects like the column in profiles
        END IF;
      END $$;

      -- Create public.roles table
      CREATE TABLE IF NOT EXISTS public.roles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
      );

      -- Insert default roles if they don't exist
      INSERT INTO public.roles (name) VALUES
      ('student'),
      ('creator'),
      ('tutor'),
      ('administrator')
      ON CONFLICT (name) DO NOTHING;

      -- Modify public.profiles table
      -- First, drop the old 'role' column if it exists
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
          ALTER TABLE public.profiles DROP COLUMN role;
        END IF;
      END $$;

      -- Add new 'role_id' column referencing public.roles
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role_id') THEN
          ALTER TABLE public.profiles ADD COLUMN role_id UUID REFERENCES public.roles(id) ON DELETE RESTRICT;
        END IF;
      END $$;

      -- Set default role_id for existing profiles (if any) to 'student'
      UPDATE public.profiles
      SET role_id = (SELECT id FROM public.roles WHERE name = 'student')
      WHERE role_id IS NULL;

      -- Make role_id NOT NULL after setting default for existing rows
      ALTER TABLE public.profiles ALTER COLUMN role_id SET NOT NULL;

      -- Add unique constraint for username if it doesn't exist
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key') THEN
          ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
        END IF;
      END $$;

      -- Add unique constraint for email if it doesn't exist
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_email_key') THEN
          ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
        END IF;
      END $$;

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


      -- Re-enable RLS
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

      -- Re-add RLS policies using auth.uid() and auth.jwt() -> 'user_metadata' ->> 'role'
      -- And for target row role check, join with public.roles
      CREATE POLICY "Users can view their own profile" ON public.profiles
      FOR SELECT TO authenticated USING (auth.uid() = id);

      CREATE POLICY "Users can insert their own profile" ON public.profiles
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

      CREATE POLICY "Users can update their own profile" ON public.profiles
      FOR UPDATE TO authenticated USING (auth.uid() = id);

      CREATE POLICY "Administrators can view all profiles" ON public.profiles
      FOR SELECT USING (((auth.jwt() -> 'user_metadata' ->> 'role')::TEXT) = 'administrator');

      CREATE POLICY "Administrators can insert profiles" ON public.profiles
      FOR INSERT WITH CHECK (((auth.jwt() -> 'user_metadata' ->> 'role')::TEXT) = 'administrator');

      CREATE POLICY "Administrators can update all profiles" ON public.profiles
      FOR UPDATE USING (((auth.jwt() -> 'user_metadata' ->> 'role')::TEXT) = 'administrator');

      CREATE POLICY "Administrators can delete profiles" ON public.profiles
      FOR DELETE USING (((auth.jwt() -> 'user_metadata' ->> 'role')::TEXT) = 'administrator');

      CREATE POLICY "Creators and Tutors can view student profiles" ON public.profiles
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.roles WHERE public.roles.id = profiles.role_id AND public.roles.name = 'student')
        AND
        (((auth.jwt() -> 'user_metadata' ->> 'role')::TEXT) = ANY (ARRAY['creator', 'tutor', 'administrator']))
      );

      -- Create or replace handle_new_user function
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE PLPGSQL
      SECURITY DEFINER SET search_path = ''
      AS $$
      DECLARE
        new_user_role_id UUID;
        user_role_text TEXT;
      BEGIN
        -- Determine the role text from user_metadata, default to 'student'
        user_role_text := COALESCE(new.raw_user_meta_data ->> 'role', 'student');

        -- Get the corresponding role_id from the public.roles table
        SELECT id INTO new_user_role_id FROM public.roles WHERE name = user_role_text;

        INSERT INTO public.profiles (id, first_name, last_name, username, email, role_id)
        VALUES (
          new.id,
          new.raw_user_meta_data ->> 'first_name',
          new.raw_user_meta_data ->> 'last_name',
          new.raw_user_meta_data ->> 'username',
          new.email,
          new_user_role_id
        );
        RETURN new;
      END;
      $$;

      -- Drop and recreate trigger to ensure it's always up-to-date
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