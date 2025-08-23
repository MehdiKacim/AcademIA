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
    // Use the service role key for schema modifications
    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

      -- Enable RLS (REQUIRED for security) if not already enabled
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

      -- Create secure policies for each operation if they don't exist
      CREATE POLICY IF NOT EXISTS "profiles_select_policy" ON public.profiles 
      FOR SELECT TO authenticated USING (auth.uid() = id);

      CREATE POLICY IF NOT EXISTS "profiles_insert_policy" ON public.profiles 
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

      CREATE POLICY IF NOT EXISTS "profiles_update_policy" ON public.profiles 
      FOR UPDATE TO authenticated USING (auth.uid() = id);

      CREATE POLICY IF NOT EXISTS "profiles_delete_policy" ON public.profiles 
      FOR DELETE TO authenticated USING (auth.uid() = id);

      CREATE POLICY IF NOT EXISTS "Administrators can view all profiles" ON public.profiles 
      FOR SELECT USING (EXISTS ( SELECT 1 FROM profiles profiles_1 WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'administrator'::user_role))));

      CREATE POLICY IF NOT EXISTS "Administrators can insert profiles" ON public.profiles 
      FOR INSERT USING (EXISTS ( SELECT 1 FROM profiles profiles_1 WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'administrator'::user_role))));

      CREATE POLICY IF NOT EXISTS "Administrators can update all profiles" ON public.profiles 
      FOR UPDATE USING (EXISTS ( SELECT 1 FROM profiles profiles_1 WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'administrator'::user_role))));

      CREATE POLICY IF NOT EXISTS "Administrators can delete profiles" ON public.profiles 
      FOR DELETE USING (EXISTS ( SELECT 1 FROM profiles profiles_1 WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'administrator'::user_role))));

      CREATE POLICY IF NOT EXISTS "Creators and Tutors can view student profiles" ON public.profiles 
      FOR SELECT USING (((role = 'student'::user_role) AND (EXISTS ( SELECT 1 FROM profiles profiles_1 WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = ANY (ARRAY['creator'::user_role, 'tutor'::user_role, 'administrator'::user_role]))))));

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

    return new Response(JSON.stringify({ message: 'Database schema recreated successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in execute-schema-setup Edge Function:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});