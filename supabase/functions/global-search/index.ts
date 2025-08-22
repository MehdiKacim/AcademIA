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

    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, first_name, last_name, username, email')
      .or(`first_name.ilike.%${searchTermLower}%,last_name.ilike.%${searchTermLower}%,username.ilike.%${searchTermLower}%,email.ilike.%${searchTermLower}%`);

    const { data: courses, error: coursesError } = await supabaseClient
      .from('courses')
      .select('id, title, description')
      .or(`title.ilike.%${searchTermLower}%,description.ilike.%${searchTermLower}%`);

    const { data: messages, error: messagesError } = await supabaseClient
      .from('messages')
      .select(`
        id,
        content,
        sender_id,
        receiver_id,
        sender:profiles!messages_sender_id_fkey(first_name, last_name, username),
        receiver:profiles!messages_receiver_id_fkey(first_name, last_name, username)
      `)
      .or(`content.ilike.%${searchTermLower}%`);

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