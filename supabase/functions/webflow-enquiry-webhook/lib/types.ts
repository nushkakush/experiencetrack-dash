export interface WebflowWebhookPayload {
  name: string;
  site: string;
  triggerType?: string;
  payload?: {
    formId: string;
    siteId: string;
    data: { [key: string]: string | number | boolean | undefined };
    submittedAt: string;
  };
  data?: {
    id: string;
    formId: string;
    siteId: string;
    formResponse: { [key: string]: string | number | boolean | undefined };
    dateSubmitted: string;
  };
  createdOn: string;
  lastUpdated: string;
  // Direct form data format support
  formResponse?: { [key: string]: string | number | boolean | undefined };
  formId?: string;
  siteId?: string;
  dateSubmitted?: string;
  // Additional fields that might come directly
  [key: string]: any;
}

export interface ParsedSubmissionData {
  formId: string;
  formResponse: { [key: string]: string | number | boolean | undefined };
  dateSubmitted: string;
  siteId: string;
}

export interface CreateEnquiryData {
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
  status?: string;
}

export interface WebflowForm {
  id: string;
  displayName?: string;
  name?: string;
}

export interface WebflowFormsResponse {
  forms: WebflowForm[];
}

export interface MeritoLeadData {
  email: string;
  search_criteria: string;
  name: string;
  mobile?: string;
  phone?: string;
  cf_i_am?: string;
  cf_can_you_relocate_to_bangalore_for_this_program?: string;
  cf_do_you_have_1_or_2_years_of_your_time_for_your_future?: string;
  cf_specify_your_gender?: string;
  cf_where_do_you_live?: string;
  cf_state?: string;
  cf_city?: string;
  cf_current_address?: string;
  cf_postal_zip_code?: string;
  cf_career_goals?: string;
  cf_highest_education_level?: string;
  cf_field_of_study?: string;
  cf_institution_name?: string;
  cf_graduation_month_new?: string;
  cf_graduation_year?: string;
  cf_do_you_have_work_experience?: string;
  cf_work_experience_type?: string;
  cf_job_description?: string;
  cf_company_name?: string;
  cf_work_start_year?: string;
  cf_work_end_month_new?: string;
  cf_date_of_birth?: string;
  notes?: string;
  application_status?: string;
  lead_quality?: string;
  conversion_stage?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  [key: string]: any;
}

export type LeadQuality = 'cold' | 'warm' | 'hot';
export type ConversionStage =
  | 'awareness'
  | 'consideration'
  | 'application'
  | 'qualified'
  | 'unqualified'
  | 'converted';
export type ProfessionalStatus =
  | 'student'
  | 'A Working Professional'
  | 'In Between Jobs';
export type YesNoMaybe = 'Yes' | 'No' | 'Maybe';
