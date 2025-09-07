/**
 * Centralized citation types to eliminate redundancy
 * Used across magic briefs, experiences, and AI responses
 */

export interface Citation {
  index: number;
  title: string;
  url: string;
  snippet?: string;
  publishedDate?: string;
  domain?: string;
  source?: 'original_brief' | 'expansion_research' | 'perplexity' | 'openai';
}

// Re-export for backward compatibility
export type MagicBriefCitation = Citation;
