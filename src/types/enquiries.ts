export interface Enquiry {
  id: string;
  full_name: string;
  email: string;
  date_of_birth: string | null;
  age?: number; // Age field from Webflow forms
  phone: string;
  gender?: 'Male' | 'Female' | 'Other';
  location?: string;
  professional_status: 'student' | 'A Working Professional' | 'In Between Jobs';
  relocation_possible: 'Yes' | 'No' | 'Maybe';
  investment_willing: 'Yes' | 'No' | 'Maybe';
  career_goals?: string;
  course_of_interest?: string; // New field from Webflow forms
  // UTM parameters for marketing campaign tracking
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  status: 'active';
  form_name?: string;
  created_at: string;
  wf_created_at?: string; // Original submission timestamp from Webflow
  updated_at: string;
  deleted_at?: string | null; // Soft delete timestamp
}

export interface CreateEnquiryData {
  full_name: string;
  email: string;
  date_of_birth: string | null;
  age?: number; // Age field from Webflow forms
  phone: string;
  gender?: 'Male' | 'Female' | 'Other';
  location?: string;
  professional_status: 'student' | 'A Working Professional' | 'In Between Jobs';
  relocation_possible: 'Yes' | 'No' | 'Maybe';
  investment_willing: 'Yes' | 'No' | 'Maybe';
  career_goals?: string;
  course_of_interest?: string; // New field from Webflow forms
  status?: 'active'; // Status field for database constraint
  // UTM parameters for marketing campaign tracking
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  form_name?: string;
  wf_created_at?: string; // Original submission timestamp from Webflow
  deleted_at?: string | null; // Soft delete timestamp
}

export interface UpdateEnquiryData {
  status?: 'active';
  full_name?: string;
  email?: string;
  date_of_birth?: string;
  phone?: string;
  gender?: 'Male' | 'Female' | 'Other';
  location?: string;
  professional_status?:
    | 'student'
    | 'A Working Professional'
    | 'In Between Jobs';
  relocation_possible?: 'Yes' | 'No' | 'Maybe';
  investment_willing?: 'Yes' | 'No' | 'Maybe';
  career_goals?: string;
  course_of_interest?: string;
  // UTM parameters for marketing campaign tracking
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  form_name?: string;
  deleted_at?: string | null; // Soft delete timestamp
}

export interface EnquiryFilters {
  professional_status?: string;
  relocation_possible?: string;
  investment_willing?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  form_name?: string;
  lead_source?: 'paid' | 'non_paid' | 'all';
  show_deleted?: boolean; // Show soft-deleted enquiries
  // Pagination parameters
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface EnquiryStats {
  total: number;
  last_24_hours: number;
  paid_leads: number;
  paid_leads_24h: number;
  non_paid_leads: number;
  non_paid_leads_24h: number;
}

export interface PaginatedEnquiryResponse {
  data: Enquiry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
