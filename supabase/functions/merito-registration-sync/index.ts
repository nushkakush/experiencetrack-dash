import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface MeritoLeadData {
  email: string;
  mobile?: string;
  search_criteria: string;
  name: string;
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
    const { profileId, applicationId, syncType = 'registration' } = await req.json();
    console.log(`📋 Request params:`, { profileId, applicationId, syncType });

    if (!profileId || !applicationId) {
      console.log('❌ Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'profileId and applicationId are required' }),
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
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch application data
    const { data: application, error: applicationError } = await supabase
      .from('student_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (applicationError || !application) {
      console.error('Application not found:', applicationError);
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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
    const cleanMobile = (phone: string | null | undefined): string | undefined => {
      if (!phone) return undefined;
      // Remove all non-digit characters
      const digits = phone.replace(/\D/g, '');
      // Remove leading country code if present (91 for India)
      const cleaned = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
      return cleaned.length >= 10 ? cleaned : undefined;
    };

    // Clean alphanumeric text (remove special characters)
    const cleanAlphanumeric = (text: string | null | undefined): string | undefined => {
      if (!text) return undefined;
      // Remove special characters, keep only alphanumeric and spaces
      const cleaned = text.replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
      return cleaned || undefined;
    };

    // Clean address specifically for Meritto API
    const cleanAddress = (text: string | null | undefined): string | undefined => {
      if (!text) return undefined;
      // Remove all special characters except spaces, keep only alphanumeric and spaces
      const cleaned = text.replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
      return cleaned || undefined;
    };

    // Clean email (basic validation)
    const cleanEmail = (email: string | null | undefined): string | undefined => {
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
        case 'male': return 'Male';
        case 'female': return 'Female';
        case 'other': return 'Other';
        default: return undefined;
      }
    };

    const mapMonth = (month: string | number): string | undefined => {
      if (!month) return undefined;
      const monthMap: { [key: string]: string } = {
        '1': 'January', 'january': 'January', 'jan': 'January',
        '2': 'February', 'february': 'February', 'feb': 'February',
        '3': 'March', 'march': 'March', 'mar': 'March',
        '4': 'April', 'april': 'April', 'apr': 'April',
        '5': 'May', 'may': 'May',
        '6': 'June', 'june': 'June', 'jun': 'June',
        '7': 'July', 'july': 'July', 'jul': 'July',
        '8': 'August', 'august': 'August', 'aug': 'August',
        '9': 'September', 'september': 'September', 'sep': 'September',
        '10': 'October', 'october': 'October', 'oct': 'October',
        '11': 'November', 'november': 'November', 'nov': 'November',
        '12': 'December', 'december': 'December', 'dec': 'December',
      };
      return monthMap[month.toString().toLowerCase()] || undefined;
    };

    // Determine lead quality based on data completeness
    const determineLeadQuality = (): string => {
      if (!extendedProfile) return 'Medium';
      
      let score = 0;
      if (extendedProfile.current_address) score += 1;
      if (extendedProfile.institution_name) score += 1;
      if (extendedProfile.linkedin_profile) score += 1;
      if (extendedProfile.has_work_experience && extendedProfile.company_name) score += 2;
      if (extendedProfile.father_first_name || extendedProfile.mother_first_name) score += 1;
      
      if (score >= 4) return 'High';
      if (score >= 2) return 'Medium';
      return 'Low';
    };

    // Determine conversion stage
    const determineConversionStage = (): string => {
      if (syncType === 'extended' || extendedProfile) return 'consideration';
      if (application.status === 'registration_complete') return 'consideration';
      return 'enquiry';
    };

    // Helper function to add field only if it has a value
    const addFieldIfExists = (obj: any, key: string, value: any) => {
      if (value !== null && value !== undefined && value !== '') {
        obj[key] = value;
      }
    };

    // Map application data to Merito lead format
    const leadData: MeritoLeadData = {
      // Core required fields
      email: profile.email,
      mobile: cleanMobile(profile.phone),
      search_criteria: 'email',
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.replace(/[^a-zA-Z\s]/g, '').trim() || 'Unknown User',
    };

    // Add extended profile fields only if they exist and have values
    if (extendedProfile) {
      // Basic profile fields (always include these)
      // Temporarily disabled due to MERITTO API validation error
      // addFieldIfExists(leadData, 'cf_date_of_birth', formatDateOfBirth(profile.date_of_birth));
      addFieldIfExists(leadData, 'cf_specify_your_gender', mapGender(extendedProfile.gender || profile.gender));
      addFieldIfExists(leadData, 'cf_where_do_you_live', cleanAlphanumeric(extendedProfile.current_city || profile.location));
      addFieldIfExists(leadData, 'cf_state', cleanAlphanumeric(extendedProfile.state || profile.state));
      addFieldIfExists(leadData, 'cf_city', cleanAlphanumeric(extendedProfile.city || profile.city));
      addFieldIfExists(leadData, 'cf_current_address', cleanAddress(extendedProfile.current_address || profile.address));
      addFieldIfExists(leadData, 'cf_postal_zip_code', extendedProfile.postal_zip_code || profile.pincode);
      
      // Education info
      addFieldIfExists(leadData, 'cf_highest_education_level', extendedProfile.qualification);
      addFieldIfExists(leadData, 'cf_field_of_study', extendedProfile.field_of_study);
      addFieldIfExists(leadData, 'cf_institution_name', extendedProfile.institution_name);
      addFieldIfExists(leadData, 'cf_graduation_year', extendedProfile.graduation_year?.toString());
      addFieldIfExists(leadData, 'cf_graduation_month', mapMonth(extendedProfile.graduation_month));
      
      // Work experience
      addFieldIfExists(leadData, 'cf_do_you_have_work_experience', extendedProfile.has_work_experience ? 'Yes' : 'No');
      addFieldIfExists(leadData, 'cf_work_experience_type', extendedProfile.work_experience_type);
      addFieldIfExists(leadData, 'cf_company_name', extendedProfile.company_name);
      addFieldIfExists(leadData, 'cf_job_description', extendedProfile.job_description);
      
      // Family information
      addFieldIfExists(leadData, 'cf_fathers_first_name', extendedProfile.father_first_name);
      addFieldIfExists(leadData, 'cf_fathers_last_name', extendedProfile.father_last_name);
      addFieldIfExists(leadData, 'cf_fathers_contact_number', cleanMobile(extendedProfile.father_contact_no));
      addFieldIfExists(leadData, 'cf_fathers_occupation', extendedProfile.father_occupation);
      
      addFieldIfExists(leadData, 'cf_mothers_first_name', extendedProfile.mother_first_name);
      addFieldIfExists(leadData, 'cf_mothers_last_name', extendedProfile.mother_last_name);
      addFieldIfExists(leadData, 'cf_mothers_contact_number', cleanMobile(extendedProfile.mother_contact_no));
      addFieldIfExists(leadData, 'cf_mothers_occupation', extendedProfile.mother_occupation);
      
      // Social profiles
      addFieldIfExists(leadData, 'cf_linkedin_profile', extendedProfile.linkedin_profile);
      addFieldIfExists(leadData, 'cf_instagram_id', extendedProfile.instagram_id);
      
      // Financial aid information
      addFieldIfExists(leadData, 'cf_have_you_applied_for_financial_aid', extendedProfile.applied_financial_aid ? 'Yes' : 'No');
      addFieldIfExists(leadData, 'cf_who_applied_for_this_loan', extendedProfile.loan_applicant);
      addFieldIfExists(leadData, 'cf_type_of_loan', extendedProfile.loan_type);
      addFieldIfExists(leadData, 'cf_loan_amount', extendedProfile.loan_amount);
      addFieldIfExists(leadData, 'cf_cibil_score', extendedProfile.cibil_score);
      addFieldIfExists(leadData, 'cf_family_income', cleanAlphanumeric(extendedProfile.family_income));
      
      // Professional info - map from profile if not in extended profile
      const professionalStatus = extendedProfile.professional_status || profile.professional_status;
      if (professionalStatus) {
        const mappedStatus = professionalStatus === 'student' ? 'A Student' : 'Working Professional';
        addFieldIfExists(leadData, 'cf_i_am', mappedStatus);
      }
      addFieldIfExists(leadData, 'cf_can_you_relocate_to_bangalore_for_this_program', extendedProfile.relocation_possible ? 'Yes' : 'No');
      addFieldIfExists(leadData, 'cf_do_you_have_1_or_2_years_of_your_time_for_your_future', extendedProfile.investment_willing ? 'Yes' : 'No');
      
      // Emergency contact - temporarily disabled due to field mapping issues
      // addFieldIfExists(leadData, 'cf_emergency_contact_first_name', extendedProfile.emergency_first_name);
      // addFieldIfExists(leadData, 'cf_emergency_contact_last_name', extendedProfile.emergency_last_name);
      // addFieldIfExists(leadData, 'cf_emergency_contact_number', cleanMobile(extendedProfile.emergency_contact_no));
      // addFieldIfExists(leadData, 'cf_relationship', extendedProfile.emergency_relationship);
    }

    // Add UTM tracking (if available)
    addFieldIfExists(leadData, 'source', application.utm_source);
    addFieldIfExists(leadData, 'medium', application.utm_medium);
    addFieldIfExists(leadData, 'campaign', application.utm_campaign);
    
    // Add application status and metadata
    addFieldIfExists(leadData, 'application_status', syncType === 'extended' ? 'registration_completed' : application.status);
    addFieldIfExists(leadData, 'notes', `${syncType === 'extended' ? 'Extended ' : ''}Registration for cohort ${application.cohort_id} - Status: ${application.status}`);
    addFieldIfExists(leadData, 'phone', profile.phone);
    
    // Add lead quality and conversion stage
    leadData.lead_quality = determineLeadQuality();
    leadData.conversion_stage = determineConversionStage();

    console.log(`🚀 Syncing to Merito (${syncType}):`, {
      email: leadData.email,
      name: leadData.name,
      mobile: leadData.mobile,
      status: application.status,
      hasExtendedProfile: !!extendedProfile,
      leadQuality: leadData.lead_quality,
      conversionStage: leadData.conversion_stage
    });
    
    console.log('📋 Full leadData payload:', JSON.stringify(leadData, null, 2));
    console.log(`🔍 Sync type: ${syncType}, Application status: ${application.status}, Profile data:`, {
      profileId: profile.id,
      email: profile.email,
      extendedProfileExists: !!extendedProfile,
      applicationId: application.id
    });
    
    // Debug: Log the cleaned address specifically
    console.log('🏠 Address cleaning debug:', {
      original: extendedProfile?.current_address,
      cleaned: cleanAddress(extendedProfile?.current_address),
      profileAddress: profile?.address
    });

    // Remove duplicate phone field - mobile is already set
    if (leadData.phone && leadData.mobile && leadData.phone === leadData.mobile) {
      delete leadData.phone;
    }

    // Make API call to Merito
    const response = await fetch('https://api.nopaperforms.io/lead/v1/createOrUpdate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'secret-key': secretKey,
        'access-key': accessKey,
      },
      body: JSON.stringify(leadData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Merito API error response (${response.status}):`, errorText);
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }

    const result: MeritoResponse = await response.json();
    
    if (!result.status) {
      throw new Error(`Merito API error: ${result.message}`);
    }

    console.log(`✅ Registration synced to Merito CRM. Lead ID: ${result.data.lead_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        leadId: result.data.lead_id,
        message: 'Registration synced to Merito successfully'
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
      name: error.name
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to sync to Merito',
        details: error.message,
        type: error.name
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
