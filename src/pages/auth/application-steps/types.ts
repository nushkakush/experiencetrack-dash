export interface FormData {
  // Personal Information
  full_name: string;
  email: string;
  contact_no: string;
  contact_no_verified: boolean;
  date_of_birth: {
    day: string;
    month: string;
    year: string;
  };
  linkedin_profile: string;
  instagram_id: string;
  gender: string;
  current_address: string;
  city: string;
  state: string;
  postal_zip_code: string;

  // Education Information
  highest_education_level: string;
  field_of_study: string;
  institution_name: string;
  graduation_month: string;
  graduation_year: number | undefined;
  has_work_experience: boolean;
  work_experience_type: string;
  job_description: string;
  company_name: string;
  work_start_month: string;
  work_start_year: number | undefined;
  work_end_month: string;
  work_end_year: number | undefined;

  // Parental Information
  father_first_name: string;
  father_last_name: string;
  father_contact_no: string;
  father_occupation: string;
  father_email: string;
  mother_first_name: string;
  mother_last_name: string;
  mother_contact_no: string;
  mother_occupation: string;
  mother_email: string;
  applied_financial_aid: boolean;

  // Financial Aid Details
  loan_applicant: string;
  loan_type: string;
  loan_amount: string;
  cibil_score: string;
  family_income: string;

  // Emergency Contact Details
  emergency_first_name: string;
  emergency_last_name: string;
  emergency_contact_no: string;
  emergency_relationship: string;
}

export interface SectionProps {
  formData: FormData;
  errors: Record<string, string>;
  onInputChange: (field: string, value: any) => void;
  onInputBlur: (field: string) => void;
  onDateOfBirthChange: (field: 'day' | 'month' | 'year', value: string) => void;
  onVerifyContact: () => void;
  isVerifying: boolean;
  getError: (field: string) => string;
}

export interface ApplicationStepProps {
  data: any; // ApplicationData from parent
  profileId: string;
  onComplete: (data: any) => void;
  onSave: (data: any) => void;
  saving: boolean;
  onPaymentInitiated?: () => void;
  onPaymentCompleted?: () => void;
}

// Constants
export const qualifications = [
  'High School',
  'Associate Degree',
  "Bachelor's Degree",
  "Master's Degree",
  'Doctorate',
  'Professional Certificate',
  'Other',
];

export const months = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export const days = Array.from({ length: 31 }, (_, i) => i + 1);
export const currentYear = new Date().getFullYear();
export const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
