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

    const { search_term } = await req.json();
    const searchTermLower = search_term.toLowerCase();

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Could not get user.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const userRole = user.user_metadata.role as string;
    const userEstablishmentId = user.user_metadata.establishment_id as string | undefined;

    let profilesQuery = supabaseClient
      .from('profiles')
      .select('id, first_name, last_name, username, email, establishment_id')
      .or(`first_name.ilike.%${searchTermLower}%,last_name.ilike.%${searchTermLower}%,username.ilike.%${searchTermLower}%,email.ilike.%${searchTermLower}%`);

    let coursesQuery = supabaseClient
      .from('courses')
      .select('id, title, description')
      .or(`title.ilike.%${searchTermLower}%,description.ilike.%${searchTermLower}%`);

    let messagesQuery = supabaseClient
      .from('messages')
      .select(`
        id,
        content,
        sender_id,
        receiver_id,
        course_id,
        sender:profiles!messages_sender_id_fkey(first_name, last_name, username, establishment_id),
        receiver:profiles!messages_receiver_id_fkey(first_name, last_name, username, establishment_id)
      `)
      .or(`content.ilike.%${searchTermLower}%`);

    // Apply establishment filter for non-administrators
    if (userRole !== 'administrator' && userEstablishmentId) {
      profilesQuery = profilesQuery.eq('establishment_id', userEstablishmentId);
      // For courses, we need to check if the course is part of a curriculum linked to the user's establishment
      // This is more complex and might require a join or a separate RPC. For simplicity, we'll filter courses
      // that are directly linked to the establishment (if a course had an establishment_id, which it doesn't directly).
      // A more robust solution would involve checking curricula -> classes -> courses.
      // For now, we'll assume courses are global or filtered by RLS on curricula/classes.
      // messagesQuery = messagesQuery.or(`sender:profiles.establishment_id.eq.${userEstablishmentId},receiver:profiles.establishment_id.eq.${userEstablishmentId}`);
      // RLS on messages table should handle this automatically based on sender/receiver profiles.
    }

    const { data: profiles, error: profilesError } = await profilesQuery;
    const { data: courses, error: coursesError } = await coursesQuery;
    const { data: messages, error: messagesError } = await messagesQuery;

    // For events and documents, assuming they exist or are placeholders
    // For now, we'll return empty arrays as these tables are not defined yet.
    const events: any[] = []; // Placeholder
    const documents: any[] = []; // Placeholder

    const results: any[] = [];

    profiles?.forEach(p => results.push({ type: 'profile', data: p }));
    courses?.forEach(c => results.push({ type: 'course', data: c }));
    messages?.forEach(m => results.push({
      type: 'message',
      data: {
        ...m,
        sender_name: `${m.sender.first_name} ${m.sender.last_name}`,
        receiver_name: `${m.receiver.first_name} ${m.receiver.last_name}`,
      }
    }));
    events?.forEach(e => results.push({ type: 'event', data: e }));
    documents?.forEach(d => results.push({ type: 'document', data: d }));

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in global_search Edge Function:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});