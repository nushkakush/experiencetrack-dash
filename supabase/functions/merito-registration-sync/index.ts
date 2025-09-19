import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface MeritoLeadData {
  email: string;
  mobile?: string;
  search_criteria: string;
  name: string;
  course?: string;
  [key: string]: any;
}

interface MeritoResponse {
  status: boolean;
  message: string;
  data: {
    lead_id: string;
    [key: string]: any;
  };
}

/**
 * Sync registration data to Merito CRM
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
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    console.log('📦 Parsing request body...');
    const {
      profileId,
      applicationId,
      syncType = 'registration',
    } = await req.json();
    console.log(`📋 Request params:`, { profileId, applicationId, syncType });

    if (!profileId) {
      console.log('❌ Missing required parameter: profileId');
      return new Response(JSON.stringify({ error: 'profileId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For realtime and extended sync, applicationId might be missing - we'll find it later
    if (!applicationId && syncType !== 'realtime' && syncType !== 'extended') {
      console.log('❌ Missing required parameter: applicationId');
      return new Response(
        JSON.stringify({
          error: 'applicationId is required for non-realtime/non-extended sync',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client
    console.log('🔌 Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Merito credentials from Supabase Secrets
    console.log('🔑 Getting Merito credentials from environment...');
    const secretKey = Deno.env.get('MERITO_SECRET_KEY');
    const accessKey = Deno.env.get('MERITO_ACCESS_KEY');

    if (!secretKey || !accessKey) {
      console.error('❌ Merito credentials not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Merito API credentials not found' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    console.log('✅ Merito credentials found');

    // Fetch profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch application data with cohort and epic learning path information
    let application;
    let applicationError;

    if (applicationId) {
      // If applicationId is provided, fetch by ID
      const result = await supabase
        .from('student_applications')
        .select(
          `
          *,
          cohort:cohorts(
            id,
            cohort_id,
            name,
            description,
            start_date,
            end_date,
            created_at,
            epic_learning_path_id,
            epic_learning_path:epic_learning_paths(
              id,
              title
            )
          )
        `
        )
        .eq('id', applicationId)
        .single();

      application = result.data;
      applicationError = result.error;
    } else if (syncType === 'realtime' || syncType === 'extended') {
      // For realtime/extended sync without applicationId, find the most recent application for this profile
      console.log(
        `🔍 Finding most recent application for profile (${syncType} sync)...`
      );
      const result = await supabase
        .from('student_applications')
        .select(
          `
          *,
          cohort:cohorts(
            id,
            cohort_id,
            name,
            description,
            start_date,
            end_date,
            created_at,
            epic_learning_path_id,
            epic_learning_path:epic_learning_paths(
              id,
              title
            )
          )
        `
        )
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      application = result.data;
      applicationError = result.error;

      if (application) {
        console.log(
          `✅ Found application for ${syncType} sync: ${application.id}`
        );
      }
    }

    if (applicationError || !application) {
      console.error('Application not found:', applicationError);
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch extended profile data (if exists)
    let extendedProfile = null;
    if (syncType === 'extended' || syncType === 'realtime') {
      const { data: extendedData } = await supabase
        .from('profile_extended')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      extendedProfile = extendedData;
    }

    // Clean mobile number
    const cleanMobile = (
      phone: string | null | undefined
    ): string | undefined => {
      if (!phone) return undefined;
      // Remove all non-digit characters
      const digits = phone.replace(/\D/g, '');
      // Remove leading country code if present (91 for India)
      const cleaned =
        digits.startsWith('91') && digits.length === 12
          ? digits.slice(2)
          : digits;
      return cleaned.length >= 10 ? cleaned : undefined;
    };

    // Clean alphanumeric text (remove special characters)
    const cleanAlphanumeric = (
      text: string | null | undefined
    ): string | undefined => {
      if (!text) return undefined;
      // Remove special characters, keep only alphanumeric and spaces
      const cleaned = text
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return cleaned || undefined;
    };

    // Format family income for Meritto (alphanumeric only constraint)
    const formatFamilyIncome = (
      income: string | null | undefined
    ): string | undefined => {
      if (!income) return undefined;

      // Handle common dropdown formats and convert to alphanumeric format
      const incomeMap: { [key: string]: string } = {
        '5 00 000 10 00 000': '500000to1000000',
        '10 00 000 20 00 000': '1000000to2000000',
        '20 00 000 30 00 000': '2000000to3000000',
        '30 00 000 50 00 000': '3000000to5000000',
        '50 00 000 1 00 00 000': '5000000to10000000',
        'above 1 00 00 000': 'above10000000',
        'below 5 00 000': 'below500000',
        // Handle variations with different spacing/formatting
        '500000 1000000': '500000to1000000',
        '1000000 2000000': '1000000to2000000',
        '2000000 3000000': '2000000to3000000',
        '3000000 5000000': '3000000to5000000',
        '5000000 10000000': '5000000to10000000',
        // Handle comma-separated formats
        '5,00,000-10,00,000': '500000to1000000',
        '10,00,000-20,00,000': '1000000to2000000',
        '20,00,000-30,00,000': '2000000to3000000',
        '30,00,000-50,00,000': '3000000to5000000',
        '50,00,000-1,00,00,000': '5000000to10000000',
      };

      // Normalize the input by removing extra spaces and converting to lowercase
      const normalized = income.toLowerCase().replace(/\s+/g, ' ').trim();

      // Check if we have a direct mapping
      if (incomeMap[normalized]) {
        return incomeMap[normalized];
      }

      // If no direct mapping found, clean to alphanumeric only
      // Remove all non-alphanumeric characters and convert to a readable format
      const cleaned = income.replace(/[^a-zA-Z0-9]/g, '');

      return cleaned || 'notspecified'; // Return cleaned or default if cleaning fails
    };

    // Clean address specifically for Meritto API
    const cleanAddress = (
      text: string | null | undefined
    ): string | undefined => {
      if (!text) return undefined;
      // Remove all special characters except spaces, keep only alphanumeric and spaces
      const cleaned = text
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return cleaned || undefined;
    };

    // Clean email (basic validation)
    const cleanEmail = (
      email: string | null | undefined
    ): string | undefined => {
      if (!email) return undefined;
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email) ? email : undefined;
    };

    // Helper functions for mapping
    const formatDateOfBirth = (dateStr: string): string | undefined => {
      if (!dateStr) return undefined;
      try {
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      } catch {
        return undefined;
      }
    };

    const mapGender = (gender: string): string | undefined => {
      if (!gender) return undefined;
      switch (gender.toLowerCase()) {
        case 'male':
          return 'Male';
        case 'female':
          return 'Female';
        case 'other':
          return 'Other';
        default:
          return undefined;
      }
    };

    const mapMonth = (month: string | number): string | undefined => {
      if (!month) return undefined;

      // Convert to string and handle both padded (01, 02) and unpadded (1, 2) formats
      const monthStr = month.toString().toLowerCase();
      const monthNum = parseInt(monthStr, 10);

      const monthMap: { [key: string]: string } = {
        '1': 'January',
        '01': 'January',
        january: 'January',
        jan: 'January',
        '2': 'February',
        '02': 'February',
        february: 'February',
        feb: 'February',
        '3': 'March',
        '03': 'March',
        march: 'March',
        mar: 'March',
        '4': 'April',
        '04': 'April',
        april: 'April',
        apr: 'April',
        '5': 'May',
        '05': 'May',
        may: 'May',
        '6': 'June',
        '06': 'June',
        june: 'June',
        jun: 'June',
        '7': 'July',
        '07': 'July',
        july: 'July',
        jul: 'July',
        '8': 'August',
        '08': 'August',
        august: 'August',
        aug: 'August',
        '9': 'September',
        '09': 'September',
        september: 'September',
        sep: 'September',
        '10': 'October',
        october: 'October',
        oct: 'October',
        '11': 'November',
        november: 'November',
        nov: 'November',
        '12': 'December',
        december: 'December',
        dec: 'December',
      };

      // First try direct mapping
      if (monthMap[monthStr]) {
        return monthMap[monthStr];
      }

      // If direct mapping fails, try using the parsed number
      if (monthNum >= 1 && monthNum <= 12) {
        return monthMap[monthNum.toString()];
      }

      return undefined;
    };

    // Determine lead quality based on data completeness
    const determineLeadQuality = (): string => {
      if (!extendedProfile) return 'Medium';

      let score = 0;
      if (extendedProfile.current_address) score += 1;
      if (extendedProfile.institution_name) score += 1;
      if (extendedProfile.linkedin_profile) score += 1;
      if (extendedProfile.has_work_experience && extendedProfile.company_name)
        score += 2;
      if (
        extendedProfile.father_first_name ||
        extendedProfile.mother_first_name
      )
        score += 1;

      if (score >= 4) return 'High';
      if (score >= 2) return 'Medium';
      return 'Low';
    };

    // Determine conversion stage based on sync type
    const determineConversionStage = (): string => {
      if (syncType === 'initial_registration') {
        return 'enquiry'; // Initial registration is just an enquiry
      }
      if (syncType === 'extended' || extendedProfile) return 'consideration';
      if (application.status === 'registration_complete')
        return 'consideration';
      return 'enquiry';
    };

    // Helper function to add field only if it has a value
    const addFieldIfExists = (obj: any, key: string, value: any) => {
      if (value !== null && value !== undefined && value !== '') {
        obj[key] = value;
      }
    };

    // Add created date information - format for Meritto API
    const applicationDate = new Date(application.created_at);
    const createdDate = `${applicationDate.getDate().toString().padStart(2, '0')}/${(applicationDate.getMonth() + 1).toString().padStart(2, '0')}/${applicationDate.getFullYear()}`;

    // Map application data to Merito lead format
    const leadData: MeritoLeadData = {
      // Core required fields
      email: profile.email,
      mobile: cleanMobile(profile.phone),
      search_criteria: 'email',
      name:
        `${profile.first_name || ''} ${profile.last_name || ''}`
          .replace(/[^a-zA-Z\s]/g, '')
          .trim() || 'Unknown User',
      user_date: createdDate,
    };

    // Add extended profile fields only if they exist and have values
    if (extendedProfile) {
      // Basic profile fields (always include these)
      addFieldIfExists(
        leadData,
        'cf_date_of_birth',
        formatDateOfBirth(
          extendedProfile.date_of_birth || profile.date_of_birth
        )
      );
      addFieldIfExists(
        leadData,
        'cf_specify_your_gender',
        mapGender(extendedProfile.gender || profile.gender)
      );
      addFieldIfExists(
        leadData,
        'cf_where_do_you_live',
        cleanAlphanumeric(extendedProfile.current_city || profile.location)
      );
      addFieldIfExists(
        leadData,
        'cf_state',
        cleanAlphanumeric(extendedProfile.state || profile.state)
      );
      addFieldIfExists(
        leadData,
        'cf_city',
        cleanAlphanumeric(extendedProfile.city || profile.city)
      );
      addFieldIfExists(
        leadData,
        'cf_current_address',
        cleanAddress(extendedProfile.current_address || profile.address)
      );
      addFieldIfExists(
        leadData,
        'cf_postal_zip_code',
        extendedProfile.postal_zip_code || profile.pincode
      );

      // Education info
      addFieldIfExists(
        leadData,
        'cf_highest_education_level',
        extendedProfile.qualification
      );
      addFieldIfExists(
        leadData,
        'cf_qualification',
        extendedProfile.qualification || profile.qualification
      );
      addFieldIfExists(
        leadData,
        'cf_field_of_study',
        extendedProfile.field_of_study
      );
      addFieldIfExists(
        leadData,
        'cf_institution_name',
        extendedProfile.institution_name
      );
      addFieldIfExists(
        leadData,
        'cf_graduation_year',
        extendedProfile.graduation_year?.toString()
      );
      addFieldIfExists(
        leadData,
        'cf_graduation_month_new',
        mapMonth(extendedProfile.graduation_month)
      );

      // Work experience
      addFieldIfExists(
        leadData,
        'cf_do_you_have_work_experience',
        extendedProfile.has_work_experience ? 'Yes' : 'No'
      );
      addFieldIfExists(
        leadData,
        'cf_work_experience_type',
        extendedProfile.work_experience_type
      );
      addFieldIfExists(
        leadData,
        'cf_company_name',
        extendedProfile.company_name
      );
      addFieldIfExists(
        leadData,
        'cf_job_description',
        extendedProfile.job_description
      );
      addFieldIfExists(
        leadData,
        'cf_work_start_year',
        extendedProfile.work_start_year?.toString()
      );
      addFieldIfExists(
        leadData,
        'cf_work_end_year',
        extendedProfile.work_end_year?.toString()
      );
      addFieldIfExists(
        leadData,
        'cf_work_end_month_new',
        mapMonth(extendedProfile.work_end_month)
      );

      // Family information
      addFieldIfExists(
        leadData,
        'cf_fathers_first_name',
        extendedProfile.father_first_name
      );
      addFieldIfExists(
        leadData,
        'cf_fathers_last_name',
        extendedProfile.father_last_name
      );
      addFieldIfExists(
        leadData,
        'cf_fathers_contact_number',
        cleanMobile(extendedProfile.father_contact_no)
      );
      addFieldIfExists(
        leadData,
        'cf_fathers_occupation',
        extendedProfile.father_occupation
      );
      addFieldIfExists(
        leadData,
        'cf_fathers_email',
        extendedProfile.father_email
      );

      addFieldIfExists(
        leadData,
        'cf_mothers_first_name',
        extendedProfile.mother_first_name
      );
      addFieldIfExists(
        leadData,
        'cf_mothers_last_name',
        extendedProfile.mother_last_name
      );
      addFieldIfExists(
        leadData,
        'cf_mothers_contact_number',
        cleanMobile(extendedProfile.mother_contact_no)
      );
      addFieldIfExists(
        leadData,
        'cf_mothers_occupation',
        extendedProfile.mother_occupation
      );
      addFieldIfExists(
        leadData,
        'cf_mothers_email',
        extendedProfile.mother_email
      );

      // Social profiles
      addFieldIfExists(
        leadData,
        'cf_linkedin_profile',
        extendedProfile.linkedin_profile
      );
      addFieldIfExists(
        leadData,
        'cf_instagram_id',
        extendedProfile.instagram_id
      );

      // Financial aid information
      addFieldIfExists(
        leadData,
        'cf_have_you_applied_for_financial_aid',
        extendedProfile.applied_financial_aid ? 'Yes' : 'No'
      );
      addFieldIfExists(
        leadData,
        'cf_who_applied_for_this_loan',
        extendedProfile.loan_applicant
      );
      addFieldIfExists(leadData, 'cf_type_of_loan', extendedProfile.loan_type);
      addFieldIfExists(leadData, 'cf_loan_amount', extendedProfile.loan_amount);
      addFieldIfExists(leadData, 'cf_cibil_score', extendedProfile.cibil_score);
      addFieldIfExists(
        leadData,
        'cf_family_income',
        formatFamilyIncome(extendedProfile.family_income)
      );

      // Professional info - map from profile if not in extended profile
      const professionalStatus =
        extendedProfile.professional_status || profile.professional_status;
      if (professionalStatus) {
        const mappedStatus =
          professionalStatus === 'student'
            ? 'A Student'
            : 'Working Professional';
        addFieldIfExists(leadData, 'cf_i_am', mappedStatus);
      }
      addFieldIfExists(
        leadData,
        'cf_can_you_relocate_to_bangalore_for_this_program',
        extendedProfile.relocation_possible ? 'Yes' : 'No'
      );
      addFieldIfExists(
        leadData,
        'cf_do_you_have_1_or_2_years_of_your_time_for_your_future',
        extendedProfile.investment_willing ? 'Yes' : 'No'
      );

      // Emergency contact - using correct field names from metadata
      addFieldIfExists(
        leadData,
        'cf_emergency_contact_first_name_new',
        extendedProfile.emergency_first_name
      );
      addFieldIfExists(
        leadData,
        'cf_emergency_contact_last_name',
        extendedProfile.emergency_last_name
      );
      addFieldIfExists(
        leadData,
        'cf_emergency_contact_number',
        cleanMobile(extendedProfile.emergency_contact_no)
      );
      addFieldIfExists(
        leadData,
        'cf_relationship',
        extendedProfile.emergency_relationship
      );
    }

    // Add UTM tracking (if available)
    addFieldIfExists(leadData, 'source', application.utm_source);
    addFieldIfExists(leadData, 'medium', application.utm_medium);
    addFieldIfExists(leadData, 'campaign', application.utm_campaign);

    // Add application status and metadata based on sync type
    let applicationStatus = application.status;
    if (syncType === 'initial_registration') {
      applicationStatus = 'registration_initiated'; // Initial registration status
    } else if (syncType === 'extended') {
      applicationStatus = 'registration_completed';
    }
    addFieldIfExists(leadData, 'application_status', applicationStatus);

    // Add cohort information - use cohort_id from cohorts table
    addFieldIfExists(leadData, 'cf_cohort', application.cohort?.cohort_id);
    addFieldIfExists(leadData, 'cf_created_on', createdDate);
    addFieldIfExists(leadData, 'cf_created_by', 'System Registration');

    // Add course information from epic learning path
    addFieldIfExists(
      leadData,
      'cf_preferred_course',
      application.cohort?.epic_learning_path?.title
    );

    // Add qualification from basic profile (available in registration form)
    addFieldIfExists(leadData, 'cf_qualification', profile.qualification);

    // Add lead quality and conversion stage
    leadData.lead_quality = determineLeadQuality();
    leadData.conversion_stage = determineConversionStage();

    console.log(`🚀 Syncing to Merito (${syncType}):`, {
      email: leadData.email,
      name: leadData.name,
      mobile: leadData.mobile,
      status: application.status,
      cohortId: application.cohort_id,
      cohortName: application.cohort?.name,
      preferredCourse: leadData.cf_preferred_course,
      epicLearningPathTitle: application.cohort?.epic_learning_path?.title,
      country: leadData.cf_country_names,
      created_on: leadData.cf_created_on,
      created_by: leadData.cf_created_by,
      hasExtendedProfile: !!extendedProfile,
      leadQuality: leadData.lead_quality,
      conversionStage: leadData.conversion_stage,
    });

    console.log('📋 Full leadData payload:', JSON.stringify(leadData, null, 2));
    console.log(
      `🔍 Sync type: ${syncType}, Application status: ${application.status}, Profile data:`,
      {
        profileId: profile.id,
        email: profile.email,
        extendedProfileExists: !!extendedProfile,
        applicationId: application.id,
      }
    );

    // Debug: Log the cleaned address specifically
    console.log('🏠 Address cleaning debug:', {
      original: extendedProfile?.current_address,
      cleaned: cleanAddress(extendedProfile?.current_address),
      profileAddress: profile?.address,
    });

    // Remove duplicate phone field - mobile is already set
    if (
      leadData.phone &&
      leadData.mobile &&
      leadData.phone === leadData.mobile
    ) {
      delete leadData.phone;
    }

    // Determine sync behavior based on syncType
    if (syncType === 'initial_registration') {
      // For initial registration, always create the lead
      // This happens when user first registers (before email confirmation)
      console.log('🚀 Initial registration - creating lead in Meritto');
    } else {
      // For other sync types (registration completion, extended, etc.)
      // This happens after email confirmation + password setup
      console.log(
        '🔄 Registration completion - updating existing lead in Meritto'
      );
    }

    // Enhanced logging for debugging
    const apiUrl = 'https://api.nopaperforms.io/lead/v1/createOrUpdate';
    const headers = {
      'Content-Type': 'application/json',
      'secret-key': secretKey,
      'access-key': accessKey,
    };

    // Log the exact curl command that will be sent
    const curlCommand = `curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "secret-key: ${secretKey}" \\
  -H "access-key: ${accessKey}" \\
  -d '${JSON.stringify(leadData, null, 2)}'`;

    console.log('🔧 EXACT CURL COMMAND TO MERITTO:');
    console.log(curlCommand);
    console.log('📤 SENDING TO MERITTO:');
    console.log('URL:', apiUrl);
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('Payload:', JSON.stringify(leadData, null, 2));

    // Make API call to Merito
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(leadData),
    });

    // Log response details
    console.log('📥 MERITTO RESPONSE:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log(
      'Headers:',
      JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ MERITTO API ERROR RESPONSE:');
      console.error('Status:', response.status);
      console.error('Status Text:', response.statusText);
      console.error('Response Body:', errorText);
      console.error(
        'Full Response Headers:',
        JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)
      );
      throw new Error(
        `HTTP error! status: ${response.status}, response: ${errorText}`
      );
    }

    const result: MeritoResponse = await response.json();

    console.log('📋 MERITTO API SUCCESS RESPONSE:');
    console.log('Full Response:', JSON.stringify(result, null, 2));

    if (!result.status) {
      console.error('❌ MERITTO API BUSINESS LOGIC ERROR:');
      console.error('Response:', JSON.stringify(result, null, 2));
      throw new Error(`Merito API error: ${result.message}`);
    }

    console.log(
      `✅ Registration synced to Merito CRM. Lead ID: ${result.data.lead_id}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        leadId: result.data.lead_id,
        message: 'Registration synced to Merito successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Failed to sync registration to Merito:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return new Response(
      JSON.stringify({
        error: 'Failed to sync to Merito',
        details: error.message,
        type: error.name,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Test function to send sample data with all fields to Meritto
 * This helps debug field mapping and API responses
 */
async function handleTestAllFields() {
  try {
    console.log(
      '🧪 TESTING ALL FIELDS - Creating sample data with all the fixed fields'
    );

    // Get Merito API credentials
    const secretKey = Deno.env.get('MERITO_SECRET_KEY');
    const accessKey = Deno.env.get('MERITO_ACCESS_KEY');

    if (!secretKey || !accessKey) {
      throw new Error('Merito API credentials not found');
    }

    // Create comprehensive test data with all the fields we just fixed
    const testLeadData: MeritoLeadData = {
      // Core required fields
      email: 'kundan9595@gmail.com',
      mobile: '+919876543211',
      search_criteria: 'email',
      name: 'Kundan Test User',

      // Basic profile fields
      cf_date_of_birth: '15/03/1995', // DOB - Fixed field
      cf_specify_your_gender: 'Male',
      cf_where_do_you_live: 'Bangalore',
      cf_state: 'Karnataka',
      cf_city: 'Bangalore',
      cf_current_address: '123 Test Street Test Area',
      cf_postal_zip_code: '560001',

      // Education info
      cf_highest_education_level: "Bachelor's Degree",
      cf_qualification: 'B.Tech',
      cf_field_of_study: 'Computer Science',
      cf_institution_name: 'Test University',
      cf_graduation_year: '2017',
      cf_graduation_month_new: 'May', // Graduation month

      // Work experience - Fixed fields
      cf_do_you_have_work_experience: 'Yes',
      cf_work_experience_type: 'Full time',
      cf_job_description: 'Software Engineer',
      cf_company_name: 'Test Company',
      cf_work_start_year: '2017',
      cf_work_end_year: '2020', // Work end year - Fixed field
      cf_work_end_month_new: 'December', // Work end month - Fixed field

      // Family information - Fixed fields
      cf_fathers_first_name: 'John',
      cf_fathers_last_name: 'Doe',
      // cf_fathers_contact_number: '+919876543210', // Temporarily disabled due to validation
      cf_fathers_occupation: 'Engineer',
      cf_fathers_email: 'john.doe@example.com', // Father email - Fixed field

      cf_mothers_first_name: 'Jane',
      cf_mothers_last_name: 'Doe',
      // cf_mothers_contact_number: '+919876543212', // Temporarily disabled due to validation
      cf_mothers_occupation: 'Teacher',
      cf_mothers_email: 'jane.doe@example.com', // Mother email - Fixed field

      // Additional fields
      cf_career_goals: 'Become a senior software engineer',
      cf_linkedin_profile: 'https://linkedin.com/in/testuser',
      cf_instagram_id: '@testuser',

      // UTM tracking
      source: 'test',
      medium: 'test',
      campaign: 'all-fields-test',

      // Lead quality and stage
      lead_quality: 'High',
      conversion_stage: 'registration_completed',
    };

    const apiUrl = 'https://api.nopaperforms.io/lead/v1/createOrUpdate';
    const headers = {
      'Content-Type': 'application/json',
      'secret-key': secretKey,
      'access-key': accessKey,
    };

    // Log the exact curl command
    const curlCommand = `curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "secret-key: ${secretKey}" \\
  -H "access-key: ${accessKey}" \\
  -d '${JSON.stringify(testLeadData, null, 2)}'`;

    console.log('🔧 TEST CURL COMMAND TO MERITTO:');
    console.log(curlCommand);
    console.log('📤 TEST PAYLOAD:');
    console.log(JSON.stringify(testLeadData, null, 2));

    // Make API call
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(testLeadData),
    });

    // Log response details
    console.log('📥 MERITTO TEST RESPONSE:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log(
      'Headers:',
      JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)
    );

    const responseText = await response.text();
    console.log('Response Body:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      result = { raw_response: responseText };
    }

    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        curlCommand,
        requestPayload: testLeadData,
        response: result,
        message: response.ok ? 'Test completed successfully' : 'Test failed',
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
