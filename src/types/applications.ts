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

export enum ApplicationStatus {
  // Registration flow
  REGISTRATION_INITIATED = 'registration_initiated',
  REGISTRATION_COMPLETE = 'registration_complete',
  REGISTRATION_COMPLETED = 'registration_completed',
  APPLICATION_FEE_PAID = 'application_fee_paid',

  // Application flow
  APPLICATION_INITIATED = 'application_initiated',
  APPLICATION_ACCEPTED = 'application_accepted',
  APPLICATION_REJECTED = 'application_rejected',
  APPLICATION_ON_HOLD = 'application_on_hold',

  // Interview flow
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEW_SELECTED = 'interview_selected',
  INTERVIEW_REJECTED = 'interview_rejected',

  // Final enrollment
  ENROLLED = 'enrolled',
}

export type ApplicationStatusType =
  // Registration flow
  | 'registration_initiated'
  | 'registration_complete'
  | 'registration_completed'
  | 'application_fee_paid'

  // Application flow
  | 'application_initiated'
  | 'application_accepted'
  | 'application_rejected'
  | 'application_on_hold'

  // Interview flow
  | 'interview_scheduled'
  | 'interview_selected'
  | 'interview_rejected'

  // Final enrollment
  | 'enrolled';

// Status configuration for UI display
export const APPLICATION_STATUS_CONFIG = {
  // Registration flow
  [ApplicationStatus.REGISTRATION_INITIATED]: {
    label: 'Registration Initiated',
    description: 'User registered, awaiting password setup',
    color: 'blue',
    priority: 1,
  },
  [ApplicationStatus.REGISTRATION_COMPLETE]: {
    label: 'Registration Complete',
    description: 'Password set up and logged in',
    color: 'blue',
    priority: 2,
  },
  [ApplicationStatus.REGISTRATION_COMPLETED]: {
    label: 'Registration Completed',
    description: 'Registration form filled and completed',
    color: 'blue',
    priority: 3,
  },
  [ApplicationStatus.APPLICATION_FEE_PAID]: {
    label: 'Application Fee Paid',
    description: 'Application fee has been paid successfully',
    color: 'green',
    priority: 4,
  },

  // Application flow
  [ApplicationStatus.APPLICATION_INITIATED]: {
    label: 'Application Initiated',
    description: 'Application form filled and submitted',
    color: 'purple',
    priority: 5,
  },
  [ApplicationStatus.APPLICATION_ACCEPTED]: {
    label: 'Application Accepted',
    description: 'Application has been accepted',
    color: 'green',
    priority: 5,
  },
  [ApplicationStatus.APPLICATION_REJECTED]: {
    label: 'Application Rejected',
    description: 'Application has been rejected',
    color: 'red',
    priority: 6,
  },
  [ApplicationStatus.APPLICATION_ON_HOLD]: {
    label: 'Application On Hold',
    description: 'Application is on hold for review',
    color: 'yellow',
    priority: 7,
  },

  // Interview flow
  [ApplicationStatus.INTERVIEW_SCHEDULED]: {
    label: 'Interview Scheduled',
    description: 'Interview has been scheduled',
    color: 'orange',
    priority: 8,
  },
  [ApplicationStatus.INTERVIEW_SELECTED]: {
    label: 'Interview Selected',
    description: 'Selected after interview',
    color: 'green',
    priority: 9,
  },
  [ApplicationStatus.INTERVIEW_REJECTED]: {
    label: 'Interview Rejected',
    description: 'Rejected after interview',
    color: 'red',
    priority: 10,
  },

  // Final enrollment
  [ApplicationStatus.ENROLLED]: {
    label: 'Enrolled',
    description: 'Student has enrolled and paid admission fee',
    color: 'green',
    priority: 11,
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
