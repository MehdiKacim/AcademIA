import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const githubRepo = 'MehdiKacim/AcademIA';
    const githubApiUrl = `https://api.github.com/repos/${githubRepo}/releases/latest`;

    const response = await fetch(githubApiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AcademIA-App', // GitHub requires a User-Agent header
      },
    });

    if (!response.ok) {
      console.error(`GitHub API error: ${response.status} ${response.statusText}`);
      return new Response(JSON.stringify({ error: `Failed to fetch latest release from GitHub: ${response.statusText}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status,
      });
    }

    const data = await response.json();
    const tagName = data.tag_name; // e.g., v1.0.4
    const apkAsset = data.assets.find((asset: any) => asset.name.endsWith('.apk'));

    if (!apkAsset) {
      return new Response(JSON.stringify({ error: 'No APK asset found in the latest release.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const apkUrl = apkAsset.browser_download_url;

    return new Response(JSON.stringify({ version: tagName, apkUrl: apkUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in Edge Function:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});