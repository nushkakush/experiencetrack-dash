import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface WebflowApiRequest {
  action: 'getForms' | 'getFormSubmissions' | 'getAllFormSubmissions';
  formId?: string;
  limit?: number;
  offset?: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const {
      action,
      formId,
      limit = 100,
      offset = 0,
    }: WebflowApiRequest = await req.json();

    // Get Webflow credentials from Supabase Secrets
    const tokenData = Deno.env.get('WEBFLOW_API_TOKEN');
    const siteIdData = Deno.env.get('WEBFLOW_SITE_ID');

    if (!tokenData || !siteIdData) {
      return new Response(
        JSON.stringify({ error: 'Webflow API credentials not found in environment variables' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Make Webflow API call
    let result;
    const baseUrl = 'https://api.webflow.com/v2';
    const headers = {
      Authorization: `Bearer ${tokenData}`,
      'accept-version': '1.0.0',
      'Content-Type': 'application/json',
    };

    switch (action) {
      case 'getForms': {
        const formsResponse = await fetch(
          `${baseUrl}/sites/${siteIdData}/forms`,
          {
            method: 'GET',
            headers,
          }
        );

        if (!formsResponse.ok) {
          throw new Error(
            `Webflow API error: ${formsResponse.status} ${formsResponse.statusText}`
          );
        }

        const formsData = await formsResponse.json();
        result = { forms: formsData.forms || [] };
        break;
      }

      case 'getFormSubmissions': {
        if (!formId) {
          return new Response(
            JSON.stringify({
              error: 'formId is required for getFormSubmissions',
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const submissionsResponse = await fetch(
          `${baseUrl}/forms/${formId}/submissions?limit=${limit}&offset=${offset}`,
          {
            method: 'GET',
            headers,
          }
        );

        if (!submissionsResponse.ok) {
          throw new Error(
            `Webflow API error: ${submissionsResponse.status} ${submissionsResponse.statusText}`
          );
        }

        const submissionsData = await submissionsResponse.json();
        result = { submissions: submissionsData.formSubmissions || [] };
        break;
      }

      case 'getAllFormSubmissions': {
        // First get all forms
        const allFormsResponse = await fetch(
          `${baseUrl}/sites/${siteIdData}/forms`,
          {
            method: 'GET',
            headers,
          }
        );

        if (!allFormsResponse.ok) {
          throw new Error(
            `Webflow API error: ${allFormsResponse.status} ${allFormsResponse.statusText}`
          );
        }

        const allFormsData = await allFormsResponse.json();
        const forms = allFormsData.forms || [];

        // Then get submissions from each form
        const allSubmissions = [];
        for (const form of forms) {
          const formSubmissionsResponse = await fetch(
            `${baseUrl}/forms/${form.id}/submissions?limit=${limit}&offset=${offset}`,
            {
              method: 'GET',
              headers,
            }
          );

          if (formSubmissionsResponse.ok) {
            const formSubmissionsData = await formSubmissionsResponse.json();
            const submissions = formSubmissionsData.formSubmissions || [];
            // Add form name to each submission
            const submissionsWithFormName = submissions.map(submission => ({
              ...submission,
              formName: form.displayName || form.name || `Form ${form.id}`,
              formId: form.id, // Ensure formId is included
            }));
            allSubmissions.push(...submissionsWithFormName);
          }
        }

        // Sort by submission date (newest first)
        allSubmissions.sort(
          (a, b) =>
            new Date(b.dateSubmitted).getTime() -
            new Date(a.dateSubmitted).getTime()
        );

        result = { submissions: allSubmissions };
        break;
      }

      default: {
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webflow API Edge Function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
