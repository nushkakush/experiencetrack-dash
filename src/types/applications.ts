export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'checkboxes'
  | 'dropdown'
  | 'linear_scale'
  | 'multiple_choice_grid'
  | 'checkbox_grid'
  | 'date'
  | 'time'
  | 'file_upload';

export type ApplicationStatus =
  | 'registration_initiated' // User registered, awaiting password setup
  | 'registration_completed' // Password set, account created, ready for review
  | 'draft' // Application form draft
  | 'submitted' // Application submitted for review
  | 'under_review' // Admin reviewing application
  | 'approved' // Application approved
  | 'rejected'; // Application rejected

// Status configuration for UI display
export const APPLICATION_STATUS_CONFIG = {
  registration_initiated: {
    label: 'Registration Initiated',
    description: 'User registered, awaiting password setup',
    color: 'blue',
    priority: 1,
  },
  registration_completed: {
    label: 'Registration Completed',
    description: 'Password set, ready for review',
    color: 'green',
    priority: 2,
  },
  draft: {
    label: 'Draft',
    description: 'Application form in progress',
    color: 'gray',
    priority: 3,
  },
  submitted: {
    label: 'Submitted',
    description: 'Application submitted for review',
    color: 'purple',
    priority: 4,
  },
  under_review: {
    label: 'Under Review',
    description: 'Admin reviewing application',
    color: 'yellow',
    priority: 5,
  },
  approved: {
    label: 'Approved',
    description: 'Application approved',
    color: 'green',
    priority: 6,
  },
  rejected: {
    label: 'Rejected',
    description: 'Application rejected',
    color: 'red',
    priority: 7,
  },
} as const;

export interface QuestionOption {
  id: string;
  text: string;
  value: string;
}

export interface ValidationRules {
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  pattern?: string;
  file_types?: string[];
  max_file_size?: number; // in MB
  scale_min?: number; // for linear scale
  scale_max?: number; // for linear scale
  scale_min_label?: string;
  scale_max_label?: string;
}

export interface GridOption {
  id: string;
  text: string;
}

export interface FormQuestion {
  id: string;
  configuration_id: string;
  question_text: string;
  question_type: QuestionType;
  is_required: boolean;
  question_order: number;
  options?: QuestionOption[];
  grid_rows?: GridOption[]; // for grid questions
  grid_columns?: GridOption[]; // for grid questions
  validation_rules?: ValidationRules;
  description?: string; // help text for the question
  created_at: string;
  updated_at: string;
}

export interface ApplicationConfiguration {
  id: string;
  cohort_id: string;
  application_fee: number;
  is_setup_complete: boolean;
  is_registration_open: boolean;
  questions?: FormQuestion[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentApplication {
  id: string;
  cohort_id: string;
  profile_id: string;
  status: ApplicationStatus;
  submitted_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  // Registration-specific columns
  registration_source: string;
  registration_date?: string;
  invitation_token?: string;
  invitation_expires_at?: string;
  registration_completed: boolean;
  created_at: string;
  updated_at: string;
}

// Insert types for database operations
export interface ApplicationConfigurationInsert {
  cohort_id: string;
  application_fee: number;
  is_setup_complete?: boolean;
  is_registration_open?: boolean;
  created_by?: string;
}

export interface FormQuestionInsert {
  configuration_id: string;
  question_text: string;
  question_type: QuestionType;
  is_required?: boolean;
  question_order: number;
  options?: QuestionOption[];
  grid_rows?: GridOption[];
  grid_columns?: GridOption[];
  validation_rules?: ValidationRules;
  description?: string;
}

export interface StudentApplicationInsert {
  cohort_id: string;
  profile_id: string;
  status?: ApplicationStatus;
  submitted_at?: string;
  registration_source?: string;
  registration_date?: string;
  invitation_token?: string;
  invitation_expires_at?: string;
  registration_completed?: boolean;
}

// Update types
export interface ApplicationConfigurationUpdate {
  application_fee?: number;
  is_setup_complete?: boolean;
  is_registration_open?: boolean;
}

export interface FormQuestionUpdate {
  question_text?: string;
  question_type?: QuestionType;
  is_required?: boolean;
  question_order?: number;
  options?: QuestionOption[];
  grid_rows?: GridOption[];
  grid_columns?: GridOption[];
  validation_rules?: ValidationRules;
  description?: string;
}

export interface StudentApplicationUpdate {
  status?: ApplicationStatus;
  submitted_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  registration_source?: string;
  registration_date?: string;
  invitation_token?: string;
  invitation_expires_at?: string;
  registration_completed?: boolean;
}

// UI specific types
export interface QuestionTemplate {
  type: QuestionType;
  name: string;
  description: string;
  icon: string;
  defaultQuestion: Partial<FormQuestion>;
}

export interface FormBuilderState {
  questions: FormQuestion[];
  selectedQuestionId?: string;
  draggedQuestionId?: string;
  previewMode: boolean;
}

export interface ApplicationFormResponse {
  question_id: string;
  question_type: QuestionType;
  answer: any; // flexible answer type based on question type
  is_valid: boolean;
  validation_error?: string;
}
