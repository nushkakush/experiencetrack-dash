import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface WebflowWebhookPayload {
  name: string;
  site: string;
  data: {
    id: string;
    formId: string;
    siteId: string;
    formResponse: {
      [key: string]: string | number | boolean | undefined;
    };
    dateSubmitted: string;
  };
  createdOn: string;
  lastUpdated: string;
}

interface CreateEnquiryData {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string | null;
  age?: number;
  professional_status?:
    | 'student'
    | 'A Working Professional'
    | 'In Between Jobs';
  relocation_possible?: 'Yes' | 'No' | 'Maybe';
  investment_willing?: 'Yes' | 'No' | 'Maybe';
  gender?: string;
  location?: string;
  career_goals?: string;
  course_of_interest?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  form_name: string;
  wf_created_at: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      console.log('❌ Non-POST request received:', req.method);
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

    // Parse Webflow webhook payload
    let payload: WebflowWebhookPayload;
    let rawBody: string;

    const contentType = req.headers.get('content-type') || '';
    console.log('📋 Content-Type:', contentType);

    try {
      rawBody = await req.text();
      console.log(
        '📨 Raw webhook payload received (first 1000 chars):',
        rawBody.substring(0, 1000)
      );

      // Check if it's JSON or form data
      if (contentType.includes('application/json')) {
        payload = JSON.parse(rawBody);
        console.log('📋 Parsed as JSON:', JSON.stringify(payload, null, 2));
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        // Parse form data
        const formData = new URLSearchParams(rawBody);
        payload = Object.fromEntries(formData.entries());
        console.log(
          '📋 Parsed as form data:',
          JSON.stringify(payload, null, 2)
        );
      } else {
        // Try JSON first, then form data
        try {
          payload = JSON.parse(rawBody);
          console.log('📋 Successfully parsed as JSON (no content-type)');
        } catch {
          const formData = new URLSearchParams(rawBody);
          payload = Object.fromEntries(formData.entries());
          console.log('📋 Successfully parsed as form data (no content-type)');
        }
      }
    } catch (parseError) {
      console.error('❌ Failed to parse webhook payload:', parseError);
      console.error('❌ Raw body was:', rawBody?.substring(0, 500));
      console.error('❌ Content-Type was:', contentType);
      return new Response(
        JSON.stringify({
          error: 'Failed to parse payload',
          details: parseError.message,
          contentType: contentType,
          receivedData: rawBody?.substring(0, 500),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Webflow webhook received:', {
      name: payload.name,
      site: payload.site,
      formId: payload.data?.formId,
      dateSubmitted: payload.data?.dateSubmitted,
      fullPayloadStructure: Object.keys(payload),
    });

    // Check if this is the expected Webflow structure or a different format
    let submissionData;
    if (payload.triggerType === 'form_submission' && payload.payload) {
      // New Webflow webhook format
      submissionData = {
        formId: payload.payload.formId,
        formResponse: payload.payload.data,
        dateSubmitted: payload.payload.submittedAt,
        siteId: payload.payload.siteId,
      };
      console.log('📋 Using new Webflow webhook format');
    } else if (payload.data && payload.data.formResponse) {
      // Expected Webflow API format
      submissionData = payload.data;
      console.log('📋 Using standard Webflow API format');
    } else if (payload.formResponse || payload.name || payload.email) {
      // Direct form data format
      submissionData = {
        formId: payload.formId || 'unknown',
        formResponse: payload,
        dateSubmitted: payload.dateSubmitted || new Date().toISOString(),
        siteId: payload.siteId || 'unknown',
      };
      console.log('📋 Using direct form data format');
    } else {
      // Try to use the payload as-is and see what happens
      submissionData = {
        formId: 'unknown',
        formResponse: payload,
        dateSubmitted: new Date().toISOString(),
        siteId: 'unknown',
      };
      console.log('📋 Using payload as-is format');
    }

    console.log(
      '📋 Submission data structure:',
      JSON.stringify(submissionData, null, 2)
    );

    // Transform Webflow form submission to enquiry format
    let enquiryData;
    try {
      enquiryData = await transformSubmissionToEnquiry(
        supabase,
        submissionData
      );
    } catch (transformError) {
      console.error('❌ Error transforming submission:', transformError);
      console.error('❌ Full payload:', JSON.stringify(payload, null, 2));
      console.error(
        '❌ Submission data:',
        JSON.stringify(submissionData, null, 2)
      );
      return new Response(
        JSON.stringify({
          error: 'Failed to transform submission data',
          details: transformError.message,
          payloadKeys: Object.keys(payload),
          submissionDataKeys: Object.keys(submissionData || {}),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!enquiryData) {
      console.warn(
        '⚠️ Invalid form submission data, skipping:',
        JSON.stringify(payload, null, 2)
      );
      return new Response(
        JSON.stringify({
          error: 'Invalid form data',
          payloadKeys: Object.keys(payload),
          submissionDataKeys: Object.keys(submissionData || {}),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if enquiry already exists to prevent duplicates
    const existingEnquiry = await checkExistingEnquiry(
      supabase,
      enquiryData.email,
      submissionData.dateSubmitted
    );

    if (existingEnquiry) {
      console.log('Enquiry already exists, skipping:', enquiryData.email);
      return new Response(
        JSON.stringify({ message: 'Enquiry already exists' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create enquiry in database
    const { data: createdEnquiry, error } = await supabase
      .from('enquiries')
      .insert([enquiryData])
      .select()
      .single();

    if (error) {
      console.error('Error creating enquiry:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create enquiry' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Successfully created enquiry:', createdEnquiry.id);

    return new Response(
      JSON.stringify({
        message: 'Enquiry created successfully',
        enquiryId: createdEnquiry.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webflow webhook error:', error);
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

/**
 * Transform Webflow form submission data to our enquiry format
 */
async function transformSubmissionToEnquiry(
  supabase: SupabaseClient,
  submission: WebflowWebhookPayload['data']
): Promise<CreateEnquiryData | null> {
  try {
    const data = submission.formResponse;

    console.log('🔍 Webflow Form Data Debug:', {
      formId: submission.formId,
      rawData: data,
      availableKeys: Object.keys(data),
    });

    // Get form name from the submission (we'll need to map formId to form name)
    const formName = await getFormName(supabase, submission.formId);

    // Check if this is a Program files-Brochure form
    const isProgramBrochureForm = formName === 'Program files-Brochure';

    let enquiryData: CreateEnquiryData;

    if (isProgramBrochureForm) {
      // Special mapping for Program files-Brochure form
      enquiryData = {
        full_name: data['First Name'] || '',
        email: data['Email'] || '',
        phone: data['Phone'] || '',
        // For Program files-Brochure, we don't have date_of_birth, so set to null
        date_of_birth: null, // no date of birth available
        // Age is directly available from Webflow
        age: parseAge(data['Age']),
        // Professional status mapping
        professional_status: mapProfessionalStatus(
          data['You are currently a'] || ''
        ),
        // For Program files-Brochure, set default values for fields not present
        relocation_possible: 'Maybe', // Default since not in form
        investment_willing: 'Maybe', // Default since not in form
        // No gender, location, or career_goals in Program files-Brochure form
        gender: undefined,
        location: undefined,
        career_goals: undefined,
        form_name: formName,
        wf_created_at: submission.dateSubmitted, // Store original Webflow submission date
        status: 'active', // Set default status
      };
    } else if (formName === 'Email Form') {
      // Special mapping for Email Form (only has email)
      enquiryData = {
        full_name: 'Email Lead', // Default name for email-only submissions
        email: data.Email || data.email || '',
        phone: 'Not provided', // Default phone for email-only submissions
        date_of_birth: null, // no date of birth available for email-only submissions
        age: undefined, // No age data available
        professional_status: 'student', // Default status
        relocation_possible: 'Maybe', // Default value
        investment_willing: 'Maybe', // Default value
        gender: undefined,
        location: undefined,
        career_goals: undefined,
        course_of_interest: undefined,
        // UTM parameters for marketing campaign tracking
        utm_source:
          data.utm_source || data.utmSource || data['utm-source'] || undefined,
        utm_medium:
          data.utm_medium || data.utmMedium || data['utm-medium'] || undefined,
        utm_campaign:
          data.utm_campaign ||
          data.utmCampaign ||
          data['utm-campaign'] ||
          undefined,
        utm_content:
          data.utm_content ||
          data.utmContent ||
          data['utm-content'] ||
          undefined,
        utm_term:
          data.utm_term || data.utmTerm || data['utm-term'] || undefined,
        form_name: formName,
        wf_created_at: submission.dateSubmitted, // Store original Webflow submission date
        status: 'active', // Set default status
      };
    } else {
      // Generic mapping for other forms (Contact Form, etc.)
      enquiryData = {
        full_name:
          data['First Name'] ||
          data.name ||
          data['First-Name'] ||
          data['first-name'] ||
          data.firstName ||
          '',
        email: data['Email'] || data.email || '',
        date_of_birth:
          data['DoB'] ||
          data.dob ||
          data.DoB ||
          data['date-of-birth'] ||
          data.dateOfBirth ||
          data.birthday ||
          null, // set to null if missing
        age: parseAge(data.age || data.Age || data['age'] || data['Age']),
        phone:
          data['Phone'] ||
          data.phone ||
          data['phone-number'] ||
          data.phoneNumber ||
          '',
        gender: data['Gender'] || data.gender || undefined,
        location:
          data['Location'] ||
          data.location ||
          data.city ||
          data.address ||
          undefined,
        professional_status: mapProfessionalStatus(
          data['i-am-a'] ||
            data['I am'] ||
            data['You are currently a'] ||
            data.professionalStatus ||
            data.professional_status ||
            data['professional-status'] ||
            data.occupation ||
            data.role ||
            ''
        ),
        relocation_possible: mapRelocationPossible(
          data['relocate-intent'] ||
            data.relocationPossible ||
            data.relocation_possible ||
            data['relocation-possible'] ||
            data.relocation ||
            'Maybe'
        ),
        investment_willing: mapInvestmentWilling(
          data['time-intent'] ||
            data.investmentWilling ||
            data.investment_willing ||
            data['investment-willing'] ||
            data.investment ||
            data.budget ||
            'Maybe'
        ),
        career_goals:
          data['Career Goals'] ||
          data['Career-Goals'] ||
          data.careerGoals ||
          data.career_goals ||
          data['career-goals'] ||
          data.goals ||
          data.objectives ||
          undefined,
        course_of_interest:
          data['Course of Interest'] ||
          data.courseOfInterest ||
          data.course_of_interest ||
          data['course-of-interest'] ||
          data.course ||
          data.program ||
          undefined,
        // UTM parameters for marketing campaign tracking
        utm_source:
          data.utm_source || data.utmSource || data['utm-source'] || undefined,
        utm_medium:
          data.utm_medium || data.utmMedium || data['utm-medium'] || undefined,
        utm_campaign:
          data.utm_campaign ||
          data.utmCampaign ||
          data['utm-campaign'] ||
          undefined,
        utm_content:
          data.utm_content ||
          data.utmContent ||
          data['utm-content'] ||
          undefined,
        utm_term:
          data.utm_term || data.utmTerm || data['utm-term'] || undefined,
        form_name: formName,
        wf_created_at: submission.dateSubmitted, // Store original Webflow submission date
        status: 'active', // Set default status
      };
    }

    console.log('🔍 Mapped Enquiry Data:', {
      form_name: enquiryData.form_name,
      age: enquiryData.age,
      age_type: typeof enquiryData.age,
      isProgramBrochureForm,
      full_data: enquiryData,
    });

    // Validate required fields based on form type
    if (formName === 'Email Form') {
      // Email Form only requires email
      if (!enquiryData.email) {
        console.warn(
          'Invalid Email Form submission - missing email:',
          submission
        );
        return null;
      }
    } else {
      // Other forms require name, email, and phone
      if (!enquiryData.full_name || !enquiryData.email || !enquiryData.phone) {
        console.warn(
          'Invalid submission data - missing required fields:',
          submission
        );
        return null;
      }
    }

    return enquiryData;
  } catch (error) {
    console.error('Error transforming submission to enquiry:', error);
    return null;
  }
}

/**
 * Map form ID to form name by fetching from Webflow API
 */
async function getFormName(
  supabase: SupabaseClient,
  formId: string
): Promise<string> {
  try {
    // Get Webflow credentials from secrets
    const { data: tokenData, error: tokenError } = await supabase.rpc(
      'get_secret',
      { secret_key: 'webflow_api_token' }
    );

    const { data: siteIdData, error: siteIdError } = await supabase.rpc(
      'get_secret',
      { secret_key: 'webflow_site_id' }
    );

    if (tokenError || siteIdError || !tokenData || !siteIdData) {
      console.warn(
        'Webflow API credentials not found, using fallback form name'
      );
      return `Form ${formId}`;
    }

    // Fetch forms from Webflow API
    const baseUrl = 'https://api.webflow.com/v2';
    const headers = {
      Authorization: `Bearer ${tokenData}`,
      'accept-version': '1.0.0',
      'Content-Type': 'application/json',
    };

    const formsResponse = await fetch(`${baseUrl}/sites/${siteIdData}/forms`, {
      method: 'GET',
      headers,
    });

    if (!formsResponse.ok) {
      console.warn(
        'Failed to fetch forms from Webflow, using fallback form name'
      );
      return `Form ${formId}`;
    }

    const formsData = await formsResponse.json();
    const forms = formsData.forms || [];

    // Find the form with matching ID
    const form = forms.find(
      (f: { id: string; displayName?: string; name?: string }) =>
        f.id === formId
    );

    if (form) {
      return form.displayName || form.name || `Form ${formId}`;
    }

    return `Form ${formId}`;
  } catch (error) {
    console.error('Error fetching form name:', error);
    return `Form ${formId}`;
  }
}

/**
 * Map professional status from Webflow to our format
 */
function mapProfessionalStatus(
  webflowValue: string
): CreateEnquiryData['professional_status'] {
  const value = webflowValue.toLowerCase().trim();

  switch (value) {
    case 'student':
    case 'a student':
      return 'student';
    case 'working professional':
    case 'a working professional':
      return 'A Working Professional';
    case 'in between jobs':
      return 'In Between Jobs';
    default:
      // If we can't map it, try to infer from the original value
      if (value.includes('student')) return 'student';
      if (value.includes('working') || value.includes('professional'))
        return 'A Working Professional';
      if (value.includes('between') || value.includes('unemployed'))
        return 'In Between Jobs';
      return 'student'; // final fallback
  }
}

/**
 * Map relocation possibility from Webflow to our format
 */
function mapRelocationPossible(
  webflowValue: string
): CreateEnquiryData['relocation_possible'] {
  const value = webflowValue.toLowerCase().trim();

  switch (value) {
    case 'yes':
      return 'Yes';
    case 'no':
      return 'No';
    case 'maybe':
      return 'Maybe';
    default:
      return 'Maybe'; // fallback
  }
}

/**
 * Map investment willingness from Webflow to our format
 */
function mapInvestmentWilling(
  webflowValue: string
): CreateEnquiryData['investment_willing'] {
  const value = webflowValue.toLowerCase().trim();

  switch (value) {
    case 'yes':
      return 'Yes';
    case 'no':
      return 'No';
    case 'maybe':
      return 'Maybe';
    default:
      return 'Maybe'; // fallback
  }
}

/**
 * Parse age field safely, handling empty strings and invalid values
 */
function parseAge(ageValue: unknown): number | undefined {
  if (!ageValue || ageValue === '') {
    return undefined;
  }

  const parsed = parseInt(ageValue);
  return isNaN(parsed) || parsed <= 0 ? undefined : parsed;
}

/**
 * Check if an enquiry already exists based on email and Webflow submission date
 */
async function checkExistingEnquiry(
  supabase: SupabaseClient,
  email: string,
  submittedAt: string
): Promise<boolean> {
  try {
    // Direct database query to get ALL enquiries for this email (bypasses pagination)
    const { data: enquiries, error } = await supabase
      .from('enquiries')
      .select('email, wf_created_at')
      .eq('email', email);

    if (error) {
      console.error('Error fetching enquiries for duplicate check:', error);
      return false;
    }

    if (!enquiries || enquiries.length === 0) {
      return false;
    }

    const submissionDate = new Date(submittedAt);

    // Check for exact duplicates: same email and same wf_created_at (Webflow submission date)
    const exactDuplicate = enquiries.some(enquiry => {
      if (!enquiry.wf_created_at) return false;
      const enquiryWfDate = new Date(enquiry.wf_created_at);
      const timeDiff = Math.abs(
        submissionDate.getTime() - enquiryWfDate.getTime()
      );
      return timeDiff < 60000; // Within 1 minute (more precise)
    });

    if (exactDuplicate) {
      console.log(`Found exact duplicate for email ${email} at ${submittedAt}`);
      return true;
    }

    // Check for potential duplicates: same email and same day (using wf_created_at)
    const sameDayDuplicate = enquiries.some(enquiry => {
      if (!enquiry.wf_created_at) return false;
      const enquiryWfDate = new Date(enquiry.wf_created_at);
      return enquiryWfDate.toDateString() === submissionDate.toDateString();
    });

    if (sameDayDuplicate) {
      console.log(
        `Found same-day duplicate for email ${email} on ${submissionDate.toDateString()}`
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking existing enquiry:', error);
    return false;
  }
}
