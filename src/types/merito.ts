export interface MeritoLeadData {
  // Core required fields
  email: string;
  mobile?: string;
  search_criteria: 'email' | 'mobile';
  name?: string;

  // Personal details (using correct Merito field keys)
  cf_date_of_birth?: string;
  cf_specify_your_gender?: string;
  cf_where_do_you_live?: string;
  cf_state?: string;
  cf_city?: string;
  cf_current_address?: string;
  cf_postal_zip_code?: string;

  // Professional info (using correct Merito field keys)
  cf_i_am?: string;
  cf_can_you_relocate_to_bangalore_for_this_program?: string;
  cf_do_you_have_1_or_2_years_of_your_time_for_your_future?: string;

  // Education info
  cf_highest_education_level?: string;
  cf_field_of_study?: string;
  cf_institution_name?: string;
  cf_graduation_month_new?: string;
  cf_graduation_year?: number;

  // Work experience
  cf_do_you_have_work_experience?: string;
  cf_work_experience_type?: string;
  cf_job_description?: string;
  cf_company_name?: string;
  cf_work_start_year?: number;
  cf_work_end_month_new?: string;

  // Social profiles
  cf_linkedin_profile?: string;
  cf_instagram_id?: string;

  // Family details
  cf_fathers_first_name?: string;
  cf_fathers_last_name?: string;
  cf_fathers_contact_number?: string;
  cf_fathers_occupation?: string;
  cf_fathers_email?: string;
  cf_mothers_first_name?: string;
  cf_mothers_last_name?: string;
  cf_mothers_contact_number?: string;
  cf_mothers_occupation?: string;
  cf_mothers_email?: string;

  // Financial aid
  cf_have_you_applied_for_financial_aid?: string;
  cf_who_applied_for_this_loan?: string;
  cf_type_of_loan?: string;
  cf_loan_amount?: number;
  cf_cibil_score?: number;
  cf_family_income?: string;

  // Emergency contact
  cf_emergency_contact_first_name?: string;
  cf_emergency_contact_last_name?: string;
  cf_emergency_contact_number?: string;
  cf_relationship?: string;

  // UTM tracking (using correct field keys)
  source?: string;
  medium?: string;
  campaign?: string;

  // Additional fields for internal tracking
  notes?: string;
  phone?: string;
  application_status?: string;
  lead_quality?: 'cold' | 'warm' | 'hot';
  conversion_stage?: 'awareness' | 'consideration' | 'decision' | 'enrolled';

  // Additional custom fields can be added here
  [key: string]: any;
}

export interface MeritoResponse {
  code: number;
  status: boolean;
  message: string;
  data: {
    lead_id: string;
  };
}

export interface MeritoError {
  code: number;
  status: boolean;
  message: string;
  error?: string;
}

export interface MeritoSyncLog {
  id: string;
  entity_type: 'enquiry' | 'application';
  entity_id: string;
  merito_lead_id?: string;
  status: 'success' | 'failed' | 'pending';
  error_message?: string;
  synced_at: string;
  retry_count: number;
  lead_quality?: 'cold' | 'warm' | 'hot';
  conversion_stage?: 'awareness' | 'consideration' | 'decision' | 'enrolled';
}
