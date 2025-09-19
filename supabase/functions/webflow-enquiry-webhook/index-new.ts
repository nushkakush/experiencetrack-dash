import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

import { PayloadParser } from './lib/payload-parser.ts';
import { WebflowClient } from './lib/webflow-client.ts';
import { FormTransformer } from './lib/form-transformer.ts';
import { DuplicateChecker } from './lib/duplicate-checker.ts';
import { MeritoSync } from './lib/merito-sync.ts';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      console.log('❌ Non-POST request received:', req.method);
      return createErrorResponse('Method not allowed', 405);
    }

    // Get Supabase configuration
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return createErrorResponse('Server configuration error', 500);
    }

    // Initialize services
    const webflowClient = WebflowClient.fromEnvironment();
    const duplicateChecker = new DuplicateChecker(
      supabaseUrl,
      supabaseServiceKey
    );
    const meritoSync = new MeritoSync(supabaseUrl, supabaseServiceKey);

    // Parse webhook payload
    console.log('📦 Parsing Webflow webhook payload...');
    const parseResult = await PayloadParser.parseWebhookRequest(req);

    if (!parseResult.success) {
      console.error('❌ Failed to parse webhook payload:', parseResult.error);
      return createErrorResponse('Failed to parse payload', 400, {
        details: parseResult.error,
        rawPayload: parseResult.rawPayload,
      });
    }

    const submissionData = parseResult.data!;

    // Transform submission to enquiry format
    console.log('🔄 Transforming submission data...');
    const enquiryData = await FormTransformer.transformSubmissionToEnquiry(
      submissionData,
      webflowClient
    );

    if (!enquiryData) {
      console.warn(
        '⚠️ Invalid form submission data, skipping:',
        parseResult.rawPayload
      );
      return createErrorResponse('Invalid form data', 400, {
        submissionDataKeys: Object.keys(submissionData || {}),
      });
    }

    // Check for duplicates
    console.log('🔍 Checking for duplicate enquiries...');
    const isDuplicate = await duplicateChecker.checkExistingEnquiry(
      enquiryData.email,
      submissionData.dateSubmitted
    );

    if (isDuplicate) {
      console.log(
        'Enquiry already exists in Supabase, skipping database insert:',
        enquiryData.email
      );

      // Still sync to Meritto for lead updates
      try {
        await meritoSync.syncEnquiryToMerito(enquiryData);
        console.log(
          '✅ Duplicate enquiry synced to Meritto CRM for lead update'
        );
      } catch (meritoError) {
        console.error(
          '❌ Failed to sync duplicate enquiry to Meritto:',
          meritoError
        );
      }

      return createSuccessResponse({
        message: 'Enquiry already exists, but synced to Meritto',
      });
    }

    // Create enquiry in database
    console.log('💾 Creating enquiry in database...');
    const { data: createdEnquiry, error } =
      await duplicateChecker.createEnquiry(enquiryData);

    if (error) {
      console.error('Error creating enquiry:', error);
      return createErrorResponse('Failed to create enquiry', 500);
    }

    console.log('Successfully created enquiry:', createdEnquiry.id);

    // Sync to Meritto CRM
    try {
      console.log('📤 Syncing to Meritto CRM...');
      await meritoSync.syncEnquiryToMerito(createdEnquiry);
      console.log('✅ Enquiry synced to Meritto CRM');
    } catch (meritoError) {
      console.error('❌ Failed to sync enquiry to Meritto:', meritoError);
      // Don't fail the webhook if Meritto sync fails
    }

    return createSuccessResponse({
      message: 'Enquiry created successfully',
      enquiryId: createdEnquiry.id,
    });
  } catch (error) {
    console.error('Webflow webhook error:', error);
    return createErrorResponse('Internal server error', 500, {
      details: error.message,
    });
  }
});

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
function createSuccessResponse(data: Record<string, any>): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
