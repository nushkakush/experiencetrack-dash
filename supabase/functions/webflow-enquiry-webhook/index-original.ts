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

    // DEBUG: Log all form field names for debugging
    console.log('🔍 DEBUG - Raw form field names:');
    console.log(
      'Available keys:',
      Object.keys(submissionData.formResponse || {})
    );
    console.log(
      'Raw form data:',
      JSON.stringify(submissionData.formResponse, null, 2)
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

    // Check if enquiry already exists to prevent duplicates in Supabase
    const existingEnquiry = await checkExistingEnquiry(
      supabase,
      enquiryData.email,
      submissionData.dateSubmitted
    );

    if (existingEnquiry) {
      console.log(
        'Enquiry already exists in Supabase, skipping database insert:',
        enquiryData.email
      );
      // Still sync to Merito for lead updates
      try {
        await syncEnquiryToMerito(enquiryData);
        console.log(
          '✅ Duplicate enquiry synced to Merito CRM for lead update'
        );
      } catch (meritoError) {
        console.error(
          '❌ Failed to sync duplicate enquiry to Merito:',
          meritoError
        );
      }

      return new Response(
        JSON.stringify({
          message: 'Enquiry already exists, but synced to Merito',
        }),
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

    // Sync to Merito CRM
    try {
      await syncEnquiryToMerito(createdEnquiry);
      console.log('✅ Enquiry synced to Merito CRM');
    } catch (meritoError) {
      console.error('❌ Failed to sync enquiry to Merito:', meritoError);
      // Don't fail the webhook if Merito sync fails
    }

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
    // Check both form name and form ID to handle cases where form name lookup fails
    const isProgramBrochureForm =
      formName === 'Program files-Brochure' ||
      submission.formId === '68b14d9c566b44254d7f1c1c' ||
      formName.includes('Brochure') ||
      formName.includes('brochure');

    let enquiryData: CreateEnquiryData;

    if (isProgramBrochureForm) {
      // Special mapping for Program files-Brochure form
      const dateOfBirth =
        data['Date of Birth'] ||
        data['date-of-birth'] ||
        data['dateOfBirth'] ||
        data['DoB'] ||
        data['dob'] ||
        data['birthday'] ||
        data['birth-date'] ||
        data['birthDate'] ||
        data['Date-of-Birth'] ||
        null;

      enquiryData = {
        full_name: data['First Name'] || '',
        email: data['Email'] || '',
        phone: data['Phone'] || '',
        // For Program files-Brochure, use date of birth field instead of age
        date_of_birth: dateOfBirth,
        // Calculate age from date of birth
        age: calculateAgeFromDateOfBirth(dateOfBirth),
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
          data['Full Name'] ||
          data['First Name'] ||
          data.name ||
          data['First-Name'] ||
          data['first-name'] ||
          data.firstName ||
          '',
        email: data['Email ID'] || data['Email'] || data.email || '',
        date_of_birth:
          data['Date of Birth'] ||
          data['date-of-birth'] ||
          data['dateOfBirth'] ||
          data.dateOfBirth ||
          data['DoB'] ||
          data.dob ||
          data.DoB ||
          data.birthday ||
          data['birth-date'] ||
          data.birthDate ||
          data['Date-of-Birth'] ||
          null, // set to null if missing
        age: parseAge(data.age || data.Age || data['age'] || data['Age']),
        phone:
          data['Phone No.'] ||
          data['Phone'] ||
          data.phone ||
          data['phone-number'] ||
          data.phoneNumber ||
          '',
        gender:
          data['Specify Your Gender'] ||
          data['specify-your-gender'] ||
          data['Gender'] ||
          data.gender ||
          data['sex'] ||
          data.sex ||
          undefined,
        location:
          data['Where Do You Live?'] ||
          data['where-do-you-live'] ||
          data['Location'] ||
          data.location ||
          data.city ||
          data.address ||
          data['current-location'] ||
          data.currentLocation ||
          data['place'] ||
          data.place ||
          undefined,
        professional_status: mapProfessionalStatus(
          data['I am...'] ||
            data['i-am'] ||
            data['i-am-a'] ||
            data['I am'] ||
            data['You are currently a'] ||
            data.professionalStatus ||
            data.professional_status ||
            data['professional-status'] ||
            data.occupation ||
            data.role ||
            data['status'] ||
            data.status ||
            ''
        ),
        relocation_possible: mapRelocationPossible(
          data[
            'Will it be possible for you to relocate to Bangalore for this program?'
          ] ||
            data['relocate-intent'] ||
            data.relocationPossible ||
            data.relocation_possible ||
            data['relocation-possible'] ||
            data.relocation ||
            'Maybe'
        ),
        investment_willing: mapInvestmentWilling(
          data[
            'Are you willing to invest 1-2 years of your time for your future?'
          ] ||
            data['time-intent'] ||
            data.investmentWilling ||
            data.investment_willing ||
            data['investment-willing'] ||
            data.investment ||
            data.budget ||
            'Maybe'
        ),
        career_goals:
          data['What are your career goals?'] ||
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

    // DEBUG: Log specific field mappings
    console.log('🔍 DEBUG - Field Mapping Results:');
    console.log('date_of_birth:', enquiryData.date_of_birth);
    console.log('gender:', enquiryData.gender);
    console.log('location:', enquiryData.location);
    console.log('professional_status:', enquiryData.professional_status);
    console.log('relocation_possible:', enquiryData.relocation_possible);
    console.log('investment_willing:', enquiryData.investment_willing);
    console.log('career_goals:', enquiryData.career_goals);

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
    // Get Webflow credentials from Supabase Secrets
    const tokenData = Deno.env.get('WEBFLOW_API_TOKEN');
    const siteIdData = Deno.env.get('WEBFLOW_SITE_ID');

    if (!tokenData || !siteIdData) {
      console.warn(
        'Webflow API credentials not found in environment variables, using fallback form name'
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

    console.log(`🔍 Looking for form ID: ${formId}`);
    console.log(
      `📋 Available forms:`,
      forms.map((f: any) => ({ id: f.id, displayName: f.displayName }))
    );

    // Find the form with matching ID
    const form = forms.find(
      (f: { id: string; displayName?: string; name?: string }) =>
        f.id === formId
    );

    if (form) {
      const formName = form.displayName || form.name || `Form ${formId}`;
      console.log(`✅ Found form: ${formId} → ${formName}`);
      return formName;
    }

    console.warn(`❌ Form not found for ID: ${formId}`);
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
  if (!webflowValue) return 'student'; // Default fallback

  const value = webflowValue.toLowerCase().trim();

  switch (value) {
    case 'student':
    case 'a student':
      return 'student';
    case 'working professional':
    case 'a working professional':
    case 'working':
    case 'professional':
      return 'A Working Professional';
    case 'in between jobs':
    case 'between jobs':
    case 'unemployed':
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
 * Calculate age from date of birth string
 */
function calculateAgeFromDateOfBirth(
  dateOfBirth: string | null
): number | undefined {
  if (!dateOfBirth) {
    return undefined;
  }

  try {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);

    if (isNaN(birthDate.getTime())) {
      console.warn('Invalid date of birth format:', dateOfBirth);
      return undefined;
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age > 0 ? age : undefined;
  } catch (error) {
    console.error('Error calculating age from date of birth:', error);
    return undefined;
  }
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

/**
 * Sync enquiry to Merito CRM
 */
async function syncEnquiryToMerito(enquiry: any): Promise<void> {
  try {
    // Get Supabase client for secrets
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not found for Merito sync');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if Merito integration is enabled
    const meritoEnabled = Deno.env.get('MERITO_ENABLED');

    if (meritoEnabled !== 'true') {
      console.log('Merito integration is disabled, skipping sync');
      return;
    }

    // Get Merito API credentials from Supabase Secrets
    const secretKey = Deno.env.get('MERITO_SECRET_KEY');
    const accessKey = Deno.env.get('MERITO_ACCESS_KEY');

    if (!secretKey || !accessKey) {
      console.error(
        'Merito API credentials not found in environment variables'
      );
      return;
    }

    // DEBUG: Log the enquiry data from Supabase
    console.log('🔍 DEBUG - Supabase Enquiry Data:');
    console.log('Full enquiry object:', JSON.stringify(enquiry, null, 2));
    console.log('Key fields:');
    console.log('- email:', enquiry.email);
    console.log('- full_name:', enquiry.full_name);
    console.log('- phone:', enquiry.phone);
    console.log('- date_of_birth:', enquiry.date_of_birth);
    console.log('- gender:', enquiry.gender);
    console.log('- location:', enquiry.location);
    console.log('- professional_status:', enquiry.professional_status);
    console.log('- career_goals:', enquiry.career_goals);
    console.log('- course_of_interest:', enquiry.course_of_interest);

    // DEBUG: Log the formatted fields for Merito
    console.log('🔍 DEBUG - Formatted Fields for Merito:');
    console.log(
      '- cf_date_of_birth:',
      formatDateOfBirthForMerito(enquiry.date_of_birth)
    );
    console.log('- cf_career_goals:', enquiry.career_goals);

    // Helper function to clean mobile number
    const cleanMobile = (phone: string | null): string | undefined => {
      if (!phone) return undefined;

      // Remove all non-digits
      const digits = phone.replace(/\D/g, '');

      let mobileNumber = '';

      // Handle different formats
      if (digits.length === 10) {
        mobileNumber = digits;
      } else if (digits.length === 12 && digits.startsWith('91')) {
        // Remove country code if present
        mobileNumber = digits.substring(2);
      } else if (digits.length === 13 && digits.startsWith('91')) {
        // Handle +91 case
        mobileNumber = digits.substring(2);
      } else {
        console.warn('Invalid phone number length:', phone, 'digits:', digits);
        return undefined;
      }

      // Validate Indian mobile number format (should start with 6, 7, 8, or 9)
      if (mobileNumber.length === 10 && /^[6-9]/.test(mobileNumber)) {
        return mobileNumber;
      }

      console.warn(
        'Invalid Indian mobile number format:',
        phone,
        'cleaned:',
        mobileNumber,
        'Must start with 6, 7, 8, or 9'
      );
      return undefined;
    };

    // Clean mobile number
    const cleanedMobile = cleanMobile(enquiry.phone);

    // Map directly from Supabase database fields to Merito using correct field keys
    // Only include fields that are actually available in the enquiry data
    const leadData: any = {
      // Core required fields
      email: enquiry.email,
      search_criteria: 'email',
      name:
        enquiry.full_name && enquiry.full_name.trim()
          ? enquiry.full_name.replace(/[^a-zA-Z\s]/g, '').trim()
          : 'Unknown User',

      // Professional info (only include if available)
      cf_i_am: mapProfessionalStatusToMerito(enquiry.professional_status),
      cf_can_you_relocate_to_bangalore_for_this_program: mapRelocationToMerito(
        enquiry.relocation_possible
      ),
      cf_do_you_have_1_or_2_years_of_your_time_for_your_future:
        mapInvestmentToMerito(enquiry.investment_willing),

      // Additional fields
      notes: `Enquiry from ${enquiry.form_name || 'website'} - ${enquiry.career_goals || 'No specific goals mentioned'}`,
      phone: enquiry.phone,
      application_status: 'enquiry',
      lead_quality: determineLeadQuality(enquiry),
      conversion_stage: 'awareness',
    };

    // Only add fields that exist and have values
    if (enquiry.gender) {
      leadData.cf_specify_your_gender = enquiry.gender;
    }
    if (enquiry.location) {
      leadData.cf_where_do_you_live = enquiry.location;
    }
    if (enquiry.state) {
      leadData.cf_state = enquiry.state;
    }
    if (enquiry.city) {
      leadData.cf_city = enquiry.city;
    }
    if (enquiry.address) {
      leadData.cf_current_address = enquiry.address;
    }
    if (enquiry.pincode) {
      leadData.cf_postal_zip_code = enquiry.pincode;
    }
    if (enquiry.career_goals) {
      leadData.cf_career_goals = enquiry.career_goals;
    }
    if (enquiry.qualification) {
      leadData.cf_highest_education_level = enquiry.qualification;
    }
    if (enquiry.course_of_interest) {
      leadData.cf_field_of_study = enquiry.course_of_interest;
    }
    if (enquiry.institution_name) {
      leadData.cf_institution_name = enquiry.institution_name;
    }
    if (enquiry.graduation_month) {
      leadData.cf_graduation_month_new = enquiry.graduation_month;
    }
    if (enquiry.graduation_year) {
      leadData.cf_graduation_year = enquiry.graduation_year;
    }
    if (enquiry.work_experience) {
      leadData.cf_do_you_have_work_experience = enquiry.work_experience;
    }
    if (enquiry.work_experience_type) {
      leadData.cf_work_experience_type = enquiry.work_experience_type;
    }
    if (enquiry.job_description) {
      leadData.cf_job_description = enquiry.job_description;
    }
    if (enquiry.company) {
      leadData.cf_company_name = enquiry.company;
    }
    if (enquiry.work_start_year) {
      leadData.cf_work_start_year = enquiry.work_start_year;
    }
    if (enquiry.work_end_month) {
      leadData.cf_work_end_month_new = enquiry.work_end_month;
    }
    if (enquiry.utm_source) {
      leadData.source = enquiry.utm_source;
    }
    if (enquiry.utm_medium) {
      leadData.medium = enquiry.utm_medium;
    }
    if (enquiry.utm_campaign) {
      leadData.campaign = enquiry.utm_campaign;
    }
    if (enquiry.date_of_birth) {
      leadData.cf_date_of_birth = formatDateOfBirthForMerito(
        enquiry.date_of_birth
      );
    }

    // Add mobile field only if we have a valid mobile number
    if (cleanedMobile) {
      leadData.mobile = cleanedMobile;
    }

    // Validate required fields
    if (!leadData.email) {
      console.warn('Missing email for Merito sync:', {
        email: leadData.email,
        form_name: enquiry.form_name,
        enquiry_id: enquiry.id,
      });
      return;
    }

    if (!leadData.name || leadData.name.trim() === '') {
      console.warn('Missing or empty name for Merito sync:', {
        name: leadData.name,
        full_name: enquiry.full_name,
        form_name: enquiry.form_name,
        enquiry_id: enquiry.id,
      });
      return;
    }

    // DEBUG: Log the final leadData being sent to Merito
    console.log('🔍 DEBUG - Final Lead Data for Merito API:');
    console.log('- cf_date_of_birth:', leadData.cf_date_of_birth);
    console.log('- cf_career_goals:', leadData.cf_career_goals);
    console.log('Full leadData:', JSON.stringify(leadData, null, 2));

    // Make API call to Merito
    const response = await fetch(
      'https://api.nopaperforms.io/lead/v1/createOrUpdate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'secret-key': secretKey,
          'access-key': accessKey,
        },
        body: JSON.stringify(leadData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Merito API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.status) {
      throw new Error(`Merito API returned error: ${result.message}`);
    }

    console.log(
      `✅ Lead synced to Merito CRM. Lead ID: ${result.data?.lead_id}`
    );
  } catch (error) {
    console.error('Error syncing enquiry to Merito:', error);
    throw error;
  }
}

/**
 * Format date of birth for Merito API (DD/MM/YYYY format)
 */
function formatDateOfBirthForMerito(
  dateOfBirth: string | null
): string | undefined {
  if (!dateOfBirth) {
    return undefined;
  }

  try {
    // Parse the date (assuming it's in ISO format from Supabase: YYYY-MM-DD)
    const date = new Date(dateOfBirth);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date of birth format:', dateOfBirth);
      return undefined;
    }

    // Format as DD/MM/YYYY for Merito
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() returns 0-11
    const year = date.getFullYear().toString();

    const formattedDate = `${day}/${month}/${year}`;
    console.log(
      `📅 Formatted date of birth: ${dateOfBirth} → ${formattedDate}`
    );

    return formattedDate;
  } catch (error) {
    console.error('Error formatting date of birth:', error);
    return undefined;
  }
}

/**
 * Map professional status to Merito dropdown values
 */
function mapProfessionalStatusToMerito(status: string): string {
  switch (status) {
    case 'student':
      return 'A Student';
    case 'A Working Professional':
      return 'Working Professional';
    case 'In Between Jobs':
      return 'In Between Jobs';
    default:
      return 'A Student';
  }
}

/**
 * Map relocation possibility to Merito dropdown values
 */
function mapRelocationToMerito(relocation: string): string {
  switch (relocation) {
    case 'Yes':
      return 'Yes';
    case 'No':
      return 'No';
    case 'Maybe':
      return 'May Be';
    default:
      return 'May Be';
  }
}

/**
 * Map investment willingness to Merito dropdown values
 */
function mapInvestmentToMerito(investment: string): string {
  switch (investment) {
    case 'Yes':
      return 'Yes';
    case 'No':
      return 'No';
    case 'Maybe':
      return 'May Be';
    default:
      return 'May Be';
  }
}

/**
 * Determine lead quality for enquiry based on criteria
 */
function determineLeadQuality(enquiry: any): 'cold' | 'warm' | 'hot' {
  // High-value indicators
  const hasCourseInterest =
    enquiry.course_of_interest && enquiry.course_of_interest !== '';
  const hasProfessionalStatus =
    enquiry.professional_status && enquiry.professional_status !== '';
  const hasCareerGoals = enquiry.career_goals && enquiry.career_goals !== '';
  const isWorkingProfessional =
    enquiry.professional_status === 'A Working Professional';
  const hasInvestmentWilling = enquiry.investment_willing === 'Yes';
  const hasRelocationPossible = enquiry.relocation_possible === 'Yes';

  // Scoring system
  let score = 0;
  if (hasCourseInterest) score += 1;
  if (hasProfessionalStatus) score += 1;
  if (hasCareerGoals) score += 2;
  if (isWorkingProfessional) score += 2;
  if (hasInvestmentWilling) score += 2;
  if (hasRelocationPossible) score += 1;

  if (score >= 5) return 'hot';
  if (score >= 3) return 'warm';
  return 'cold';
}
