/**
 * Optimized OpenAI prompts for magic brief generation and expansion
 * Now uses centralized core prompts to eliminate redundancy
 */

import { 
  buildMagicBriefPrompt, 
  buildMagicBriefExpansionPrompt 
} from './promptBuilder';

// ============================================================================
// MAGIC BRIEF GENERATION PROMPT
// ============================================================================

export const MAGIC_BRIEF_GENERATION_PROMPT = buildMagicBriefPrompt;

// ============================================================================
// MAGIC BRIEF EXPANSION PROMPT
// ============================================================================

export const MAGIC_BRIEF_EXPANSION_PROMPT = buildMagicBriefExpansionPrompt;