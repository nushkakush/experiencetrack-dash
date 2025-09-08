export interface ProfileExtended {
  id: string;
  profile_id: string;

  // Extended Personal Information (not in basic profiles table)
  contact_no_verified?: boolean;
  currently_a?:
    | 'Student'
    | 'Working Professional'
    | 'Freelancer'
    | 'Entrepreneur'
    | 'Other';
  course_of_interest?: string;
  cohort_id?: string;
  linkedin_profile?: string;
  instagram_id?: string;
  gender?: 'Male' | 'Female' | 'Other';
  current_address?: string;
  city?: string;
  state?: string;
  postal_zip_code?: string;

  // Education Information (not in basic profiles table)
  field_of_study?: string;
  institution_name?: string;
  graduation_month?: string;
  graduation_year?: number;
  has_work_experience?: boolean;
  work_experience_type?:
    | 'Employee'
    | 'Freelancer'
    | 'Intern'
    | 'Contract'
    | 'Other';
  job_description?: string;
  company_name?: string;
  work_start_month?: string;
  work_start_year?: number;
  work_end_month?: string;
  work_end_year?: number;

  // Parental Information
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
  applied_financial_aid?: boolean;

  // Financial Aid Details
  loan_applicant?: string;
  loan_type?: string;
  loan_amount?: string;
  cibil_score?: string;
  family_income?: string;

  // Emergency Contact Details
  emergency_first_name?: string;
  emergency_last_name?: string;
  emergency_contact_no?: string;
  emergency_relationship?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface ProfileExtendedInsert {
  profile_id: string;

  // Extended Personal Information (not in basic profiles table)
  contact_no_verified?: boolean;
  currently_a?:
    | 'Student'
    | 'Working Professional'
    | 'Freelancer'
    | 'Entrepreneur'
    | 'Other';
  course_of_interest?: string;
  cohort_id?: string;
  linkedin_profile?: string;
  instagram_id?: string;
  gender?: 'Male' | 'Female' | 'Other';
  current_address?: string;
  city?: string;
  state?: string;
  postal_zip_code?: string;

  // Education Information (not in basic profiles table)
  field_of_study?: string;
  institution_name?: string;
  graduation_month?: string;
  graduation_year?: number;
  has_work_experience?: boolean;
  work_experience_type?:
    | 'Employee'
    | 'Freelancer'
    | 'Intern'
    | 'Contract'
    | 'Other';
  job_description?: string;
  company_name?: string;
  work_start_month?: string;
  work_start_year?: number;
  work_end_month?: string;
  work_end_year?: number;

  // Parental Information
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
  applied_financial_aid?: boolean;

  // Financial Aid Details
  loan_applicant?: string;
  loan_type?: string;
  loan_amount?: string;
  cibil_score?: string;
  family_income?: string;

  // Emergency Contact Details
  emergency_first_name?: string;
  emergency_last_name?: string;
  emergency_contact_no?: string;
  emergency_relationship?: string;
}

export interface ProfileExtendedUpdate {
  // Extended Personal Information (not in basic profiles table)
  contact_no_verified?: boolean;
  currently_a?:
    | 'Student'
    | 'Working Professional'
    | 'Freelancer'
    | 'Entrepreneur'
    | 'Other';
  course_of_interest?: string;
  cohort_id?: string;
  linkedin_profile?: string;
  instagram_id?: string;
  gender?: 'Male' | 'Female' | 'Other';
  current_address?: string;
  city?: string;
  state?: string;
  postal_zip_code?: string;

  // Education Information (not in basic profiles table)
  field_of_study?: string;
  institution_name?: string;
  graduation_month?: string;
  graduation_year?: number;
  has_work_experience?: boolean;
  work_experience_type?:
    | 'Employee'
    | 'Freelancer'
    | 'Intern'
    | 'Contract'
    | 'Other';
  job_description?: string;
  company_name?: string;
  work_start_month?: string;
  work_start_year?: number;
  work_end_month?: string;
  work_end_year?: number;

  // Parental Information
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
  applied_financial_aid?: boolean;

  // Financial Aid Details
  loan_applicant?: string;
  loan_type?: string;
  loan_amount?: string;
  cibil_score?: string;
  family_income?: string;

  // Emergency Contact Details
  emergency_first_name?: string;
  emergency_last_name?: string;
  emergency_contact_no?: string;
  emergency_relationship?: string;
}
