// Core experience types
export type ExperienceType =
  | 'CBL'
  | 'Mock Challenge'
  | 'Masterclass'
  | 'Workshop'
  | 'GAP';

// GAP-specific types (now identical to Workshop)

// Masterclass-specific types

// Workshop-specific types

// Material interface for workshops and GAP activities
export interface Material {
  id: string;
  name: string;
  quantity: string;
  description: string;
  where_to_get: string;
  cost_estimate?: string;
  required: boolean;
}

// SOP Step interface for workshops
export interface SOPStep {
  id: string;
  title: string;
  description: string;
  estimated_time?: number; // in minutes
}

// Session details interface for masterclasses

export interface Experience {
  id: string;
  title: string;
  learning_outcomes: string[];
  type: ExperienceType;
  epic_id: string; // Reference to the epic this experience belongs to
  is_custom: boolean; // Whether this is a custom experience created by program manager

  // CBL-specific fields
  challenge?: string; // WYSIWYG HTML content
  deliverables?: Deliverable[];
  grading_rubric?: RubricSection[];
  pass_conditions?: ConditionTree;
  distinction_conditions?: ConditionTree;
  lecture_sessions?: LectureModule[];
  sample_brand_profiles?: SampleProfile[];
  sample_mentor_profiles?: SampleProfile[];
  sample_judge_profiles?: SampleProfile[];

  // Mock Challenge specific fields (reuses CBL fields but no lectures)
  // Uses: challenge, deliverables, grading_rubric, pass_conditions, distinction_conditions, sample_judge_profiles

  // Masterclass specific fields
  expert_profile?: SampleProfile[];

  // Workshop and GAP specific fields (identical structure)
  activity_description?: string;
  materials_required?: Material[];
  sop_steps?: SOPStep[]; // Step-by-step SOP instructions
  loom_video_url?: string; // Loom video URL for instructions
  max_participants?: number; // Maximum number of participants for the experience

  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SampleProfile {
  id: string;
  name: string;
  url: string;
}

export interface CreateExperienceRequest {
  title: string;
  learning_outcomes: string[];
  type: ExperienceType;
  epic_id: string; // Reference to the epic this experience belongs to
  is_custom?: boolean; // Whether this is a custom experience created by program manager

  // CBL-specific fields
  challenge?: string;
  deliverables?: Deliverable[];
  grading_rubric?: RubricSection[];
  pass_conditions?: ConditionTree;
  distinction_conditions?: ConditionTree;
  lecture_sessions?: LectureModule[];
  sample_brand_profiles?: SampleProfile[];
  sample_mentor_profiles?: SampleProfile[];
  sample_judge_profiles?: SampleProfile[];

  // Mock Challenge specific fields (reuses CBL fields but no lectures)
  // Uses: challenge, deliverables, grading_rubric, pass_conditions, distinction_conditions, sample_judge_profiles

  // Masterclass specific fields
  expert_profile?: SampleProfile[];

  // Workshop specific fields
  activity_description?: string;
  materials_required?: Material[];
  sop_steps?: SOPStep[]; // Step-by-step SOP instructions
  loom_video_url?: string; // Loom video URL for instructions
  max_participants?: number; // Maximum number of participants for the experience

  // GAP specific fields
  activity_type?: GAPActivityType;
  activity_category?: GAPActivityCategory;
  practical_skills?: string[];
  materials_needed?: Material[];
  safety_requirements?: string[];
  activity_duration?: number;
  instructor_requirements?: string;
  venue_requirements?: string;
  fun_factor?: string;
  real_world_application?: string;
}

export interface UpdateExperienceRequest
  extends Partial<CreateExperienceRequest> {
  id: string;
}

// Deliverable types
export type DeliverableType = 'file_upload' | 'url' | 'text_submission';

export interface Deliverable {
  id: string;
  type: DeliverableType;
  title: string;
  description: string;
  brand_context?: string; // Brand-specific application context, separate from core skill description
  file_url?: string;
  url?: string;
  required: boolean;
}

// Grading rubric types
export interface RubricSection {
  id: string;
  title: string;
  weight_percentage: number;
  criteria: RubricCriteria[];
}

export interface RubricCriteria {
  id: string;
  name: string;
  weight_percentage: number;
  description: string;
}

// Lecture module types
export interface LectureModule {
  id: string;
  order: number;
  title: string;
  description: string;
  learning_outcomes: string[];
  type: 'conceptual' | 'tool'; // NEW: conceptual (default) or tool (only when absolutely needed)
  tools_taught?: ToolTaught[]; // NEW: only included when tools are absolutely necessary
  canva_deck_links: string[];
  canva_notes_links: string[];
  resources: Resource[];
  connected_deliverables?: string[]; // Array of deliverable IDs that this lecture supports
}

// Tool teaching interface - only used when tools are absolutely required
export interface ToolTaught {
  name: string;
  category: 'software' | 'platform' | 'framework' | 'tool';
  version?: string;
  job_roles: string[];
  learning_objective: string;
  necessity_reason: string; // Why this tool is absolutely required for the learning outcome
}

export interface Resource {
  id: string;
  type: 'url' | 'file_upload';
  title: string;
  url?: string;
  file_url?: string;
}

// Condition system types
export interface ConditionTree {
  id: string;
  type: 'group' | 'condition';
  operator?: 'AND' | 'OR'; // For groups
  conditions?: ConditionTree[]; // Child conditions/groups

  // For individual conditions
  field_type?: 'overall_score' | 'rubric_section' | 'rubric_criteria';
  field_reference?: string; // ID of rubric section/criteria
  comparison_operator?: '>=' | '<=' | '>' | '<' | '=' | '!=';
  value?: number;
  description?: string; // Human readable description

  // For "no" conditions (e.g., "no rubric group score < 70")
  is_negative?: boolean; // If true, this is a "no" condition
}

export interface ConditionOption {
  value: string;
  label: string;
  type: 'overall_score' | 'rubric_section' | 'rubric_criteria';
  reference?: string;
}

// Helper types for UI
export interface ComparisonOperator {
  value: '>=' | '<=' | '>' | '<' | '=' | '!=';
  label: string;
  symbol: string;
}

export const COMPARISON_OPERATORS: ComparisonOperator[] = [
  { value: '>=', label: 'greater than or equal to', symbol: '≥' },
  { value: '<=', label: 'less than or equal to', symbol: '≤' },
  { value: '>', label: 'greater than', symbol: '>' },
  { value: '<', label: 'less than', symbol: '<' },
  { value: '=', label: 'equal to', symbol: '=' },
  { value: '!=', label: 'not equal to', symbol: '≠' },
];

export const EXPERIENCE_TYPES: {
  value: ExperienceType;
  label: string;
  description: string;
}[] = [
  {
    value: 'CBL',
    label: 'Challenge-Based Learning',
    description:
      'Project-based learning with real-world challenges and lectures',
  },
  {
    value: 'Mock Challenge',
    label: 'Mock Challenge',
    description:
      'Practice challenges without lectures - same as CBL but focused on skill reinforcement',
  },
  {
    value: 'Masterclass',
    label: 'Masterclass',
    description: 'Expert-led deep-dive sessions outside the curriculum',
  },
  {
    value: 'Workshop',
    label: 'Workshop',
    description:
      'Hands-on activities with materials and standard operating procedures',
  },
  {
    value: 'GAP',
    label: 'GAP',
    description:
      'Fun out-of-curriculum sessions with hands-on activities, materials, and step-by-step instructions',
  },
];
