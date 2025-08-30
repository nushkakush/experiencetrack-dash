import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AttendanceCalculator } from './calculations/attendance-calculator.ts';
import type {
  AttendanceCalculationRequest,
  AttendanceCalculationResponse,
} from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { action, params } =
      (await req.json()) as AttendanceCalculationRequest;

    // Validate request
    if (!action) {
      throw new Error('Action is required');
    }

    if (!params) {
      throw new Error('Parameters are required');
    }

    // Create Supabase client with service role key for database access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract user's JWT token for user context (if provided)
    const authHeader = req.headers.get('authorization');
    let userToken = null;
    if (authHeader) {
      userToken = authHeader.replace('Bearer ', '');
    }

    // Initialize calculator with user context
    const calculator = new AttendanceCalculator(supabase, userToken);

    // Route to appropriate calculation method
    let result;
    switch (action) {
      case 'getSessionStats':
        result = await calculator.getSessionStats(params);
        break;

      case 'getEpicStats':
        result = await calculator.getEpicStats(params);
        break;

      case 'getCalendarData':
        result = await calculator.getCalendarData(params);
        break;

      case 'getLeaderboard':
        result = await calculator.getLeaderboard(params);
        break;

      case 'getStudentStats':
        result = await calculator.getStudentStats(params);
        break;

      case 'getStudentStreaks':
        result = await calculator.getStudentStreaks(params);
        break;

      case 'getPublicLeaderboard':
        result = await calculator.getPublicLeaderboard(params);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Return success response
    const response: AttendanceCalculationResponse = {
      success: true,
      data: result,
      metadata: {
        calculationTime: new Date().toISOString(),
        dataSource: 'attendance-calculations-edge-function',
        filters: params,
        action,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Attendance calculation error:', error);

    // Return error response
    const errorResponse: AttendanceCalculationResponse = {
      success: false,
      data: null,
      error: error.message || 'Unknown error occurred',
      metadata: {
        calculationTime: new Date().toISOString(),
        dataSource: 'attendance-calculations-edge-function',
        error: true,
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
