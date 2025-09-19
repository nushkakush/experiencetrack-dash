import { corsHeaders } from '../_shared/cors.ts';
import type { SyncRequest, SyncResponse } from './lib/types.ts';
import { DataFetcher } from './lib/data-fetcher.ts';
import { DataTransformer } from './lib/data-transformer.ts';
import { MeritoClient } from './lib/merito-client.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/**
 * Sync registration data to Meritto CRM
 * This Edge Function handles the CORS issue by making the API call server-side
 */
Deno.serve(async (req: Request) => {
  console.log(`🔍 Edge Function called with method: ${req.method}`);

  // Handle test endpoint for debugging all fields
  if (
    req.method === 'GET' &&
    new URL(req.url).pathname.includes('/test-all-fields')
  ) {
    return handleTestAllFields();
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      console.log(`❌ Invalid method: ${req.method}`);
      return createErrorResponse('Method not allowed', 405);
    }

    // Parse and validate request
    const requestData = await parseAndValidateRequest(req);
    if (!requestData.success) {
      return createErrorResponse(requestData.error!, 400);
    }

    const { profileId, applicationId, syncType } = requestData.data!;

    // Get Meritto credentials
    const credentials = getMeritoCredentials();
    if (!credentials.success) {
      return createErrorResponse(credentials.error!, 500);
    }

    // Initialize services
    const dataFetcher = new DataFetcher(supabaseUrl, supabaseServiceKey);
    const meritoClient = new MeritoClient(
      credentials.secretKey!,
      credentials.accessKey!
    );

    // Fetch required data
    console.log('📦 Fetching profile and application data...');
    const profile = await dataFetcher.fetchProfile(profileId);
    const application = await dataFetcher.fetchApplication(
      applicationId,
      profileId,
      syncType
    );

    // Fetch extended profile data if needed
    let extendedProfile = null;
    if (syncType === 'extended' || syncType === 'realtime') {
      extendedProfile = await dataFetcher.fetchExtendedProfile(profileId);
    }

    // Transform data to Meritto format
    console.log('🔄 Transforming data for Meritto...');
    const leadData = DataTransformer.transformToMeritoLead(
      profile,
      application,
      extendedProfile,
      syncType
    );

    // Log sync information
    console.log(`🚀 Syncing to Meritto (${syncType}):`, {
      email: leadData.email,
      name: leadData.name,
      mobile: leadData.mobile,
      status: application.status,
      cohortId: application.cohort_id,
      cohortName: application.cohort?.name,
      preferredCourse: leadData.cf_preferred_course,
      epicLearningPathTitle: application.cohort?.epic_learning_path?.title,
      hasExtendedProfile: !!extendedProfile,
      leadQuality: leadData.lead_quality,
      conversionStage: leadData.conversion_stage,
    });

    // Sync to Meritto
    console.log('📤 Syncing to Meritto CRM...');
    const result = await meritoClient.createOrUpdateLead(leadData);

    console.log(
      `✅ Registration synced to Meritto CRM. Lead ID: ${result.data.lead_id}`
    );

    return createSuccessResponse({
      success: true,
      leadId: result.data.lead_id,
      message: 'Registration synced to Meritto successfully',
    });
  } catch (error) {
    console.error('❌ Failed to sync registration to Meritto:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return createErrorResponse('Failed to sync to Meritto', 500, {
      details: error.message,
      type: error.name,
    });
  }
});

/**
 * Parse and validate request data
 */
async function parseAndValidateRequest(req: Request): Promise<{
  success: boolean;
  data?: SyncRequest;
  error?: string;
}> {
  try {
    const {
      profileId,
      applicationId,
      syncType = 'registration',
    } = await req.json();
    console.log(`📋 Request params:`, { profileId, applicationId, syncType });

    if (!profileId) {
      return { success: false, error: 'profileId is required' };
    }

    // For realtime and extended sync, applicationId might be missing - we'll find it later
    if (!applicationId && syncType !== 'realtime' && syncType !== 'extended') {
      return {
        success: false,
        error: 'applicationId is required for non-realtime/non-extended sync',
      };
    }

    return {
      success: true,
      data: { profileId, applicationId, syncType },
    };
  } catch (error) {
    return { success: false, error: 'Invalid JSON in request body' };
  }
}

/**
 * Get Meritto API credentials from environment
 */
function getMeritoCredentials(): {
  success: boolean;
  secretKey?: string;
  accessKey?: string;
  error?: string;
} {
  console.log('🔑 Getting Meritto credentials from environment...');
  const secretKey = Deno.env.get('MERITO_SECRET_KEY');
  const accessKey = Deno.env.get('MERITO_ACCESS_KEY');

  if (!secretKey || !accessKey) {
    console.error('❌ Meritto credentials not found in environment variables');
    return {
      success: false,
      error: 'Meritto API credentials not found',
    };
  }

  console.log('✅ Meritto credentials found');
  return { success: true, secretKey, accessKey };
}

/**
 * Create error response
 */
function createErrorResponse(
  error: string,
  status: number,
  additional?: Record<string, any>
): Response {
  return new Response(JSON.stringify({ error, ...additional }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Create success response
 */
function createSuccessResponse(data: SyncResponse): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Handle test endpoint for debugging all fields
 */
async function handleTestAllFields(): Promise<Response> {
  try {
    console.log(
      '🧪 TESTING ALL FIELDS - Creating sample data with all the fixed fields'
    );

    // Get Meritto credentials
    const credentials = getMeritoCredentials();
    if (!credentials.success) {
      throw new Error(credentials.error);
    }

    // Initialize Meritto client
    const meritoClient = new MeritoClient(
      credentials.secretKey!,
      credentials.accessKey!
    );

    // Create test lead
    const result = await meritoClient.createTestLead();

    return new Response(
      JSON.stringify({
        success: true,
        status: 200,
        response: result,
        message: 'Test completed successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Test failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Test failed',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
