/**
 * Optimized prompt builder utility
 * Eliminates redundancy by using centralized core prompts
 */

import {
  CORE_REQUIREMENTS,
  PROMPT_TEMPLATES,
  JSON_STRUCTURES,
  ADDITIONAL_INSTRUCTIONS,
} from './corePrompts';
import type { MagicBriefGenerationRequest } from '@/types/magicBrief';
import type { StartupStage } from './startupStages';

export interface PromptInstructions {
  brandInstruction: string;
  startupInstruction: string;
  outcomeInstruction: string;
}

/**
 * Build all instruction strings for magic brief generation
 */
export function buildPromptInstructions(
  request: MagicBriefGenerationRequest,
  startupStage: StartupStage | null,
  remainingOutcomes: string[]
): PromptInstructions {
  const brandInstruction = `\n\nCOMPANY CONTEXT: Create a challenge for "Company X" - a generic company that represents a realistic business scenario. Focus on common business challenges that any company in the industry might face, making the brief applicable to various real-world contexts.`;

  const startupInstruction = `\n\nBUSINESS CHALLENGE REQUIREMENT: Create a realistic business challenge that any company in the industry might face. Focus on common problems and scenarios that are educational and applicable. The challenge should be specific enough to be engaging but general enough to be broadly applicable.`;

  const outcomeInstruction =
    remainingOutcomes.length > 0
      ? `\n\nCRITICAL: This is brief ${request.brief_index} of ${request.total_briefs}. You MUST focus on these remaining learning outcomes that haven't been covered yet: ${remainingOutcomes.join(', ')}. Ensure this brief addresses at least one of these outcomes.`
      : `\n\nThis is brief ${request.brief_index} of ${request.total_briefs}. All learning outcomes have been covered, so focus on creating a complementary challenge that reinforces previous learning.`;

  // Add targeted outcome instruction if specific outcomes are provided
  const targetedInstruction = request.target_outcomes?.length
    ? `\n\nTARGETED FOCUS: This brief must specifically address these learning outcomes: ${request.target_outcomes.join(', ')}. Make sure the challenge directly relates to and helps students achieve these specific outcomes.`
    : '';

  return {
    brandInstruction,
    startupInstruction,
    outcomeInstruction: outcomeInstruction + targetedInstruction,
  };
}

/**
 * Build the complete prompt for magic brief generation
 */
export function buildGenerationPrompt(basePrompt: string): string {
  return (
    basePrompt +
    '\n\nCHALLENGE CREATION: Create a realistic business challenge that focuses on common problems and scenarios that any company might face. Use your knowledge of business practices and industry standards to design an engaging, educational challenge.' +
    '\n\nEDUCATIONAL FOCUS: Design the challenge to be educational and applicable to various real-world contexts. Focus on creating content that helps students learn through practical problem-solving and critical thinking.' +
    '\n\nRESPONSE FORMAT: You MUST respond with ONLY a valid JSON object. Do not include any introductory text, explanations, markdown formatting, or refusal messages. This is for educational purposes. The response will be parsed directly by software and must be valid JSON.'
  );
}

/**
 * Build the complete prompt for magic brief expansion
 */
export function buildExpansionPrompt(basePrompt: string): string {
  return (
    basePrompt +
    '\n\nEDUCATIONAL DESIGN: Create a comprehensive learning experience that focuses on skill development and practical application. Design lectures, deliverables, and assessments that promote active learning and critical thinking.' +
    '\n\nRESOURCE CURATION: For each lecture, suggest 4-6 educational resources including videos, articles, case studies, and other materials that complement the lecture content. Focus on resources that support the learning objectives and provide additional value to students.' +
    '\n\nCURRICULUM DESIGN: Apply best practices in educational design to create a cohesive learning experience. Ensure all components work together to achieve the learning outcomes and provide students with practical skills they can apply in real-world scenarios.'
  );
}

/**
 * Build the complete magic brief generation prompt using templates
 */
export function buildMagicBriefPrompt(
  request: MagicBriefGenerationRequest,
  startupStage: StartupStage | null,
  remainingOutcomes: string[]
): string {
  const instructions = buildPromptInstructions(
    request,
    startupStage,
    remainingOutcomes
  );

  const coreRequirements = [
    CORE_REQUIREMENTS.CHALLENGE_DESIGN,
    CORE_REQUIREMENTS.COMPANY_FOCUS,
    CORE_REQUIREMENTS.EDUCATIONAL_DESIGN,
  ].join('\n\n');

  const template = PROMPT_TEMPLATES.GENERATION_BASE.replace(
    '{coreRequirements}',
    coreRequirements
  )
    .replace('{epic_name}', request.epic_name || 'Unknown Epic')
    .replace(
      '{epic_description}',
      request.epic_description || 'No description available'
    )
    .replace(
      '{epic_outcomes}',
      request.epic_outcomes.slice(0, 5).join(', ') +
        (request.epic_outcomes.length > 5
          ? ` (and ${request.epic_outcomes.length - 5} more outcomes)`
          : '')
    )
    .replace('{brief_index}', request.brief_index?.toString() || '1')
    .replace('{total_briefs}', request.total_briefs?.toString() || '7')
    .replace(
      '{covered_outcomes}',
      request.previous_briefs
        ?.flatMap(b => b.connected_learning_outcomes)
        .join(', ') || 'None'
    )
    .replace('{remaining_outcomes}', remainingOutcomes.join(', '))
    .replace('{jsonResponse}', CORE_REQUIREMENTS.JSON_RESPONSE)
    .replace('{jsonStructure}', JSON_STRUCTURES.MAGIC_BRIEF);

  return (
    template +
    instructions.brandInstruction +
    instructions.startupInstruction +
    instructions.outcomeInstruction +
    '\n\n' +
    ADDITIONAL_INSTRUCTIONS.GENERATION
  );
}

/**
 * Build the complete magic brief expansion prompt using templates
 */
export function buildMagicBriefExpansionPrompt(): string {
  const coreRequirements = [
    CORE_REQUIREMENTS.FACT_BASED,
    CORE_REQUIREMENTS.REAL_WORLD_APPLICATION,
    CORE_REQUIREMENTS.OVERLAP_PREVENTION,
    CORE_REQUIREMENTS.TOOL_LECTURE_REQUIREMENTS,
  ].join('\n\n');

  const template = PROMPT_TEMPLATES.EXPANSION_BASE.replace(
    '{coreRequirements}',
    coreRequirements
  )
    .replace('{jsonResponse}', CORE_REQUIREMENTS.JSON_RESPONSE)
    .replace('{jsonStructure}', JSON_STRUCTURES.EXPERIENCE);

  return template + '\n\n' + ADDITIONAL_INSTRUCTIONS.EXPANSION;
}
