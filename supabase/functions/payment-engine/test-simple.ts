import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

// Simple test handler
const handleRequest = async (request: any) => {
  console.log('🚀 Simple test function called with:', request);

  return {
    success: true,
    message: 'Simple test function working',
    receivedData: request,
    timestamp: new Date().toISOString(),
  };
};

// Main serve function
serve(async req => {
  console.log('📡 Simple test function received request:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const request = await req.json();
    console.log('📦 Parsed request body:', request);

    const response = await handleRequest(request);
    console.log('✅ Generated response:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('❌ Simple test function error:', error);
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
