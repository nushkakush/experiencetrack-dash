import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

// Simple handler for testing
const handleRequest = async (request: any) => {
  console.log('🚀 [SIMPLE] Edge function called with:', request);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing environment variables');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Test database connection
  const { data, error } = await supabase
    .from('cohorts')
    .select('id, name')
    .limit(1);

  if (error) {
    console.error('❌ [SIMPLE] Database error:', error);
    throw error;
  }

  return {
    success: true,
    message: 'Simple payment engine working',
    receivedData: request,
    databaseTest: data,
    timestamp: new Date().toISOString(),
  };
};

// Main serve function
serve(async req => {
  console.log('🚀 [SIMPLE] Received request:', {
    method: req.method,
    url: req.url,
  });

  if (req.method === 'OPTIONS') {
    console.log('✅ [SIMPLE] Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📦 [SIMPLE] Parsing request body...');
    const request = await req.json();
    console.log('📦 [SIMPLE] Parsed request:', request);

    console.log('🔄 [SIMPLE] Calling handleRequest...');
    const response = await handleRequest(request);
    console.log('✅ [SIMPLE] Generated response:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('❌ [SIMPLE] Error:', error);
    console.error('❌ [SIMPLE] Error stack:', (error as Error).stack);

    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
