// Import centralized citation type
import type { Citation } from './citations';

// Re-export for backward compatibility
export type MagicBriefCitation = Citation;

// Magic Brief core types
export interface MagicBrief {
  id: string;
  title: string;
  brand_name: string;
  challenge_statement: string;
  connected_learning_outcomes: string[];
  skill_focus: string;
  challenge_order: number;
  prerequisite_skills: string;
  skill_compounding: string;
  epic_id: string;
  created_by?: string;
  created_at: string;
  expanded?: boolean;
  expanded_experience_id?: string;
  citations?: MagicBriefCitation[];
  rawResponse?: any;
}

// Request types for API calls
export interface MagicBriefGenerationRequest {
  epic_id: string;
  epic_name: string;
  epic_description?: string;
  epic_outcomes: string[];
  brief_index?: number; // Current brief being generated
  total_briefs?: number; // Total number of briefs
  previous_briefs?: GeneratedMagicBrief[]; // Previously generated briefs for context
  target_outcomes?: string[]; // Specific outcomes to focus on for this brief
}

export interface MagicBriefExpansionRequest {
  brief_id: string;
  brief_title: string;
  brand_name: string;
  challenge_statement: string;
  epic_id: string;
  epic_name: string;
  epic_description?: string;
  epic_outcomes: string[];
  experienceType?:
    | 'CBL'
    | 'Mock Challenge'
    | 'Masterclass'
    | 'Workshop'
    | 'GAP';
  // NEW: Add existing content context for overlap prevention
  existing_lectures?: Array<{
    id: string;
    title: string;
    learning_outcomes: string[];
    brief_title: string;
  }>;
  existing_deliverables?: Array<{
    id: string;
    title: string;
    type: string;
    brief_title: string;
  }>;
}

// Response types from AI providers
export interface GeneratedMagicBrief {
  title: string;
  brand_name: string;
  challenge_statement: string;
  connected_learning_outcomes: string[];
  skill_focus: string;
  challenge_order: number;
  prerequisite_skills: string;
  skill_compounding: string;
  citations?: MagicBriefCitation[];
  rawResponse?: any;
}

// Epic context for magic brief generation
export interface EpicContext {
  id: string;
  name: string;
  description?: string;
  outcomes: string[];
}

// UI State types
export interface MagicBriefState {
  isGenerating: boolean;
  isExpanding: boolean;
  error: string | null;
  generatedBriefs: GeneratedMagicBrief[];
  savedBriefs: MagicBrief[];
}
