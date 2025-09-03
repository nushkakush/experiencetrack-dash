// Core experience types
export type ExperienceType = 'CBL' | 'Mock Challenge' | 'Masterclass' | 'Workshop' | 'GAP';

export interface Experience {
  id: string;
  title: string;
  learning_outcomes: string[];
  type: ExperienceType;
  epic_id: string; // Reference to the epic this experience belongs to
  
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
  challenge?: string;
  deliverables?: Deliverable[];
  grading_rubric?: RubricSection[];
  pass_conditions?: ConditionTree;
  distinction_conditions?: ConditionTree;
  lecture_sessions?: LectureModule[];
  sample_brand_profiles?: SampleProfile[];
  sample_mentor_profiles?: SampleProfile[];
  sample_judge_profiles?: SampleProfile[];
}

export interface UpdateExperienceRequest extends Partial<CreateExperienceRequest> {
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
  canva_deck_links: string[];
  canva_notes_links: string[];
  resources: Resource[];
  connected_deliverables?: string[]; // Array of deliverable IDs that this lecture supports
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
  { value: '!=', label: 'not equal to', symbol: '≠' }
];

export const EXPERIENCE_TYPES: { value: ExperienceType; label: string; description: string }[] = [
  {
    value: 'CBL',
    label: 'Challenge-Based Learning',
    description: 'Project-based learning with real-world challenges'
  },
  {
    value: 'Mock Challenge',
    label: 'Mock Challenge',
    description: 'Simulated challenge scenarios for practice'
  },
  {
    value: 'Masterclass',
    label: 'Masterclass',
    description: 'Expert-led deep-dive sessions'
  },
  {
    value: 'Workshop',
    label: 'Workshop',
    description: 'Interactive hands-on learning sessions'
  },
  {
    value: 'GAP',
    label: 'GAP',
    description: 'Gap analysis and improvement activities'
  }
];
