export interface MeritoLeadData {
  email: string;
  mobile?: string;
  search_criteria: string;
  name: string;
  course?: string;
  user_date?: string;
  lead_quality?: string;
  conversion_stage?: string;
  application_status?: string;
  notes?: string;
  source?: string;
  medium?: string;
  campaign?: string;

  // Custom fields with cf_ prefix
  cf_date_of_birth?: string;
  cf_specify_your_gender?: string;
  cf_where_do_you_live?: string;
  cf_state?: string;
  cf_city?: string;
  cf_current_address?: string;
  cf_postal_zip_code?: string;
  cf_highest_education_level?: string;
  cf_qualification?: string;
  cf_field_of_study?: string;
  cf_institution_name?: string;
  cf_graduation_year?: string;
  cf_graduation_month_new?: string;
  cf_do_you_have_work_experience?: string;
  cf_work_experience_type?: string;
  cf_company_name?: string;
  cf_job_description?: string;
  cf_work_start_year?: string;
  cf_work_end_year?: string;
  cf_work_end_month_new?: string;
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
  cf_linkedin_profile?: string;
  cf_instagram_id?: string;
  cf_have_you_applied_for_financial_aid?: string;
  cf_who_applied_for_this_loan?: string;
  cf_type_of_loan?: string;
  cf_loan_amount?: string;
  cf_cibil_score?: string;
  cf_family_income?: string;
  cf_i_am?: string;
  cf_can_you_relocate_to_bangalore_for_this_program?: string;
  cf_do_you_have_1_or_2_years_of_your_time_for_your_future?: string;
  cf_emergency_contact_first_name_new?: string;
  cf_emergency_contact_last_name?: string;
  cf_emergency_contact_number?: string;
  cf_relationship?: string;
  cf_cohort?: string;
  cf_created_on?: string;
  cf_created_by?: string;
  cf_preferred_course?: string;
  cf_career_goals?: string;
  cf_country_names?: string;

  [key: string]: any;
}

export interface MeritoResponse {
  status: boolean;
  message: string;
  data: {
    lead_id: string;
    [key: string]: any;
  };
}

export interface ProfileData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  location?: string;
  state?: string;
  city?: string;
  address?: string;
  pincode?: string;
  qualification?: string;
  professional_status?: string;
  [key: string]: any;
}

export interface ExtendedProfileData {
  profile_id: string;
  date_of_birth?: string;
  gender?: string;
  current_city?: string;
  state?: string;
  city?: string;
  current_address?: string;
  postal_zip_code?: string;
  qualification?: string;
  field_of_study?: string;
  institution_name?: string;
  graduation_year?: number;
  graduation_month?: string;
  has_work_experience?: boolean;
  work_experience_type?: string;
  company_name?: string;
  job_description?: string;
  work_start_year?: number;
  work_end_year?: number;
  work_end_month?: string;
  father_first_name?: string;
  father_last_name?: string;
  father_contact_no?: string;
  father_occupation?: string;
  father_email?: string;
  mother_first_name?: string;
  mother_last_name?: string;
  mother_contact_no?: string;
  mother_occupation?: string;
  mother_email?: string;
  linkedin_profile?: string;
  instagram_id?: string;
  applied_financial_aid?: boolean;
  loan_applicant?: string;
  loan_type?: string;
  loan_amount?: string;
  cibil_score?: string;
  family_income?: string;
  professional_status?: string;
  relocation_possible?: boolean;
  investment_willing?: boolean;
  emergency_first_name?: string;
  emergency_last_name?: string;
  emergency_contact_no?: string;
  emergency_relationship?: string;
  [key: string]: any;
}

export interface ApplicationData {
  id: string;
  profile_id: string;
  status: string;
  created_at: string;
  cohort_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  cohort?: {
    id: string;
    cohort_id: string;
    name: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    created_at: string;
    epic_learning_path_id?: string;
    epic_learning_path?: {
      id: string;
      title: string;
    };
  };
  [key: string]: any;
}

export interface SyncRequest {
  profileId: string;
  applicationId?: string;
  syncType?: 'registration' | 'initial_registration' | 'extended' | 'realtime';
}

export interface SyncResponse {
  success: boolean;
  leadId?: string;
  message: string;
  error?: string;
  details?: string;
  type?: string;
}

export type SyncType =
  | 'registration'
  | 'initial_registration'
  | 'extended'
  | 'realtime';

export type LeadQuality = 'Low' | 'Medium' | 'High';

export type ConversionStage =
  | 'enquiry'
  | 'consideration'
  | 'application'
  | 'qualified'
  | 'unqualified'
  | 'converted';
