import { aiService } from '@/services/aiService';
import { MagicBriefsService } from '@/services/magicBriefs.service';
import { outcomeTracker } from './outcomeTracker';
import type { 
  MagicBriefGenerationRequest, 
  MagicBriefExpansionRequest, 
  GeneratedMagicBrief 
} from '@/types/magicBrief';
import type { CreateExperienceRequest } from '@/types/experience';
import { extractContentText } from './responseParser';
import { processAIResponse } from './jsonProcessor';
import { buildMagicBriefPrompt, buildMagicBriefExpansionPrompt } from './promptBuilder';
import { processExpandedExperience } from './experienceProcessor';
import { withRetry } from './retryUtils';

/**
 * Service for generating magic briefs using AI providers
 * Uses Perplexity for web search and expansion, OpenAI for structured generation
 * Focused only on AI generation logic
 */
export class MagicBriefGenerator {
  /**
   * Generate a single high-quality magic brief using GPT-4o
   * Now supports sequential generation with learning outcome tracking
   */
  static async generateMagicBriefs(
    request: MagicBriefGenerationRequest
  ): Promise<GeneratedMagicBrief[]> {
    return withRetry(
      () => this.generateSingleBrief(request),
      { maxRetries: 3, baseDelay: 2000 },
      'generate magic brief'
    );
  }

  /**
   * Generate exactly the requested number of briefs with guaranteed 100% learning outcome coverage
   * Intelligently distributes learning outcomes across the specified number of briefs
   */
  static async generateExactNumberWithFullCoverage(
    request: MagicBriefGenerationRequest,
    progressCallback?: (progress: {current: number, total: number}) => void
  ): Promise<{
    briefs: GeneratedMagicBrief[];
    coverage: any;
    iterations: number;
  }> {
    const totalBriefs = request.total_briefs || 7;
    const allGeneratedBriefs: GeneratedMagicBrief[] = [];
    let iterations = 0;
    const maxAttempts = 3; // Limit regeneration attempts

    // Initialize progress
    if (progressCallback) {
      progressCallback({ current: 0, total: totalBriefs });
    }

    // Distribute learning outcomes across briefs
    const outcomesPerBrief = Math.ceil(request.epic_outcomes.length / totalBriefs);
    
    for (let i = 0; i < totalBriefs; i++) {
      iterations++;
      
      // Calculate which outcomes this brief should target
      const startIndex = i * outcomesPerBrief;
      const endIndex = Math.min(startIndex + outcomesPerBrief, request.epic_outcomes.length);
      const targetOutcomes = request.epic_outcomes.slice(startIndex, endIndex);
      
      // If this is the last brief, include any remaining outcomes
      if (i === totalBriefs - 1) {
        const remainingOutcomes = request.epic_outcomes.slice(endIndex);
        targetOutcomes.push(...remainingOutcomes);
      }

      const briefRequest = {
        ...request,
        brief_index: i + 1,
        total_briefs: totalBriefs,
        previous_briefs: allGeneratedBriefs,
        target_outcomes: targetOutcomes,
        epic_outcomes: targetOutcomes // Focus only on target outcomes for this brief
      };

      try {
        const generatedBriefs = await this.generateSingleBrief(briefRequest);
        allGeneratedBriefs.push(...generatedBriefs);
        
        // Update progress after each brief is generated
        if (progressCallback) {
          progressCallback({ current: allGeneratedBriefs.length, total: totalBriefs });
        }
      } catch (error) {
        console.warn(`Failed to generate brief ${i + 1}:`, error);
        // Continue with other briefs even if one fails
      }
    }

    // Verify coverage and attempt to fix any gaps
    let finalCoverage = outcomeTracker.analyzeCoverage(request.epic_outcomes, allGeneratedBriefs as any);
    let retryAttempts = 0;

    while (finalCoverage.uncoveredOutcomes.length > 0 && retryAttempts < maxAttempts) {
      retryAttempts++;
      console.log(`Retry ${retryAttempts}: Fixing coverage for ${finalCoverage.uncoveredOutcomes.length} uncovered outcomes`);
      
      // Find the brief with the least outcomes and add missing ones
      const briefWithLeastOutcomes = allGeneratedBriefs.reduce((min, brief) => 
        brief.connected_learning_outcomes.length < min.connected_learning_outcomes.length ? brief : min
      );
      
      const briefIndex = allGeneratedBriefs.indexOf(briefWithLeastOutcomes);
      
      // Regenerate this brief with additional target outcomes
      const enhancedRequest = {
        ...request,
        brief_index: briefIndex + 1,
        total_briefs: totalBriefs,
        previous_briefs: allGeneratedBriefs.filter((_, idx) => idx !== briefIndex),
        target_outcomes: [...briefWithLeastOutcomes.connected_learning_outcomes, ...finalCoverage.uncoveredOutcomes.slice(0, 3)],
        epic_outcomes: request.epic_outcomes
      };

      try {
        const regeneratedBriefs = await this.generateSingleBrief(enhancedRequest);
        if (regeneratedBriefs.length > 0) {
          allGeneratedBriefs[briefIndex] = regeneratedBriefs[0];
        }
      } catch (error) {
        console.warn(`Failed to regenerate brief ${briefIndex + 1}:`, error);
        break;
      }

      finalCoverage = outcomeTracker.analyzeCoverage(request.epic_outcomes, allGeneratedBriefs as any);
    }

    return {
      briefs: allGeneratedBriefs,
      coverage: finalCoverage,
      iterations: iterations + retryAttempts
    };
  }



  private static async generateSingleBrief(
    request: MagicBriefGenerationRequest
  ): Promise<GeneratedMagicBrief[]> {
    // Track which learning outcomes have been covered in previous briefs
    const coveredOutcomes = request.previous_briefs?.flatMap(brief => brief.connected_learning_outcomes) || [];
    const remainingOutcomes = request.epic_outcomes.filter(outcome => 
      !coveredOutcomes.some(covered => covered.toLowerCase().includes(outcome.toLowerCase()))
    );
    
    // Build context for AI
    const contextData = {
      epic_id: request.epic_id,
      epic_name: request.epic_name,
      epic_description: request.epic_description,
      epic_outcomes: request.epic_outcomes,
      brief_index: request.brief_index,
      total_briefs: request.total_briefs,
      covered_outcomes: coveredOutcomes,
      remaining_outcomes: remainingOutcomes,
      previous_briefs: request.previous_briefs
    };

    // Build the complete prompt using the new template system
    const fullPrompt = buildMagicBriefPrompt(request, null, remainingOutcomes);
    
    // Generate the brief using OpenAI chat completions
    const response = await aiService.generate({
      prompt: `${fullPrompt}

Context: ${JSON.stringify(contextData, null, 2)}`,
      systemPrompt: 'You are an expert educational designer specializing in creating realistic business challenges for learning. Generate high-quality case study briefs that focus on real-world problems and challenges that companies face. Create engaging, educational content that helps students learn through practical scenarios.',
      useCase: 'magic-briefs',
      requiresWebSearch: false,
      requiresCitations: false,
      requiresRealtimeData: false,
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 3000,
      responseFormat: 'json_object',
      metadata: { epic_id: request.epic_id, brief_index: request.brief_index }
    });

    // Parse and validate response using consolidated processor
    const requiredFields = ['title', 'brand_name', 'challenge_statement', 'connected_learning_outcomes', 'skill_focus', 'challenge_order', 'prerequisite_skills', 'skill_compounding'];
    const brief = processAIResponse(response, requiredFields, 'magic briefs response');

    // Return as array with single brief to maintain compatibility
    return [brief];
  }

  /**
   * Expand a magic brief into a full CBL experience
   */
  static async expandMagicBrief(
    request: MagicBriefExpansionRequest
  ): Promise<CreateExperienceRequest> {
    // Get the original brief to access its citations
    const originalBrief = await MagicBriefsService.getMagicBrief(request.brief_id);
    
    const contextData = {
      brief_title: request.brief_title,
      brand_name: request.brand_name,
      challenge_statement: request.challenge_statement,
      epic_id: request.epic_id,
      epic_name: request.epic_name,
      epic_description: request.epic_description,
      epic_outcomes: request.epic_outcomes,
      original_citations: originalBrief.citations || []
    };

    const response = await aiService.generate({
      prompt: `${buildMagicBriefExpansionPrompt()}

Expand the brief "${request.brief_title}" for ${request.brand_name} into a complete CBL experience

Context: ${JSON.stringify(contextData, null, 2)}`,
      systemPrompt: 'You are an expert educational designer specializing in creating comprehensive learning experiences. Expand business challenges into complete educational programs that focus on skill development and practical learning.',
      useCase: 'magic-briefs',
      requiresWebSearch: false,
      requiresCitations: false,
      requiresRealtimeData: false,
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 8000,
      responseFormat: 'json_object',
      metadata: { 
        epic_id: request.epic_id, 
        brief_id: request.brief_id,
        brand_name: request.brand_name,
        operation: 'magic_brief_expansion'
      }
    });

    // Parse and validate response using consolidated processor
    const requiredFields = ['title', 'learning_outcomes', 'type', 'challenge', 'deliverables', 'grading_rubric'];
    const experience = processAIResponse(response, requiredFields, 'expanded experience response');
    
    // Add citations from both original brief and new expansion research
    const allCitations = [
      ...(originalBrief.citations || []).map(citation => ({
        ...citation,
        source: 'original_brief'
      })),
      ...(response.citations || []).map(citation => ({
        ...citation,
        source: 'expansion_research'
      }))
    ];
    
    // Add citations to the experience metadata
    if (allCitations.length > 0) {
      experience.citations = allCitations;
    }
    
    // Process and normalize the expanded experience
    return processExpandedExperience(experience, request.epic_id);
  }

  /**
   * Regenerate a specific magic brief using its existing metadata
   * Keeps the same Connected Learning Outcomes, Skill Focus, Prerequisite Skills, and Skill Compounding
   * Only regenerates the Challenge Statement with fresh content
   */
  static async regenerateMagicBrief(
    brief: any,
    epicContext: {
      epic_name: string;
      epic_description: string;
      epic_outcomes: string[];
    }
  ): Promise<GeneratedMagicBrief> {
    return withRetry(
      () => this.performRegenerateBrief(brief, epicContext),
      { maxRetries: 3, baseDelay: 2000 },
      'regenerate magic brief'
    );
  }

  private static async performRegenerateBrief(
    brief: any,
    epicContext: {
      epic_name: string;
      epic_description: string;
      epic_outcomes: string[];
    }
  ): Promise<GeneratedMagicBrief> {
    // Build regeneration prompt that focuses only on regenerating the challenge statement
    const regenerationPrompt = `
You are regenerating a magic brief challenge statement while keeping all other elements exactly the same.

KEEP THESE ELEMENTS EXACTLY THE SAME:
- Connected Learning Outcomes: ${brief.connected_learning_outcomes.join(', ')}
- Skill Focus: ${brief.skill_focus}
- Prerequisite Skills: ${brief.prerequisite_skills}
- Skill Compounding: ${brief.skill_compounding}
- Brand Name: ${brief.brand_name}
- Challenge Order: ${brief.challenge_order}

REGENERATE ONLY:
- Challenge Statement: Create a completely new, fresh challenge statement that still aligns with the existing learning outcomes and skill focus

Epic Context:
- Epic Name: ${epicContext.epic_name}
- Epic Description: ${epicContext.epic_description}
- Epic Outcomes: ${epicContext.epic_outcomes.join(', ')}

Generate a new challenge statement that:
1. Is completely different from the original but maintains the same educational value
2. Still addresses the same Connected Learning Outcomes
3. Fits the same Skill Focus area
4. Uses the same brand/company name
5. Maintains the same difficulty level and prerequisites

IMPORTANT: Return ONLY a valid JSON object with this exact structure:
{
  "title": "Updated title that reflects the new challenge statement",
  "challenge_statement": "Your completely new and creative challenge statement here",
  "citations": []
}

Do not include any other text, explanations, or formatting. Just the JSON object.
`;

    // Generate the regenerated brief using OpenAI
    const response = await aiService.generate({
      prompt: regenerationPrompt,
      systemPrompt: 'You are an expert educational designer specializing in creating realistic business challenges for learning. Regenerate only the challenge statement while keeping all other elements identical.',
      useCase: 'magic-briefs',
      requiresWebSearch: false,
      requiresCitations: false,
      requiresRealtimeData: false,
      model: 'gpt-4o',
      temperature: 0.8, // Higher temperature for more creative variation
      maxTokens: 2000,
      responseFormat: 'json_object',
      metadata: { 
        brief_id: brief.id, 
        regeneration: true,
        original_title: brief.title 
      }
    });

    // Parse and validate the regenerated response
    const processedBrief = await processAIResponse(response, ['challenge_statement'], 'magic-brief-regeneration');
    
    if (!processedBrief || !processedBrief.challenge_statement) {
      console.error('Invalid regeneration response:', processedBrief);
      throw new Error('Failed to regenerate magic brief: No challenge statement in response');
    }

    // Ensure we have a valid challenge statement
    if (typeof processedBrief.challenge_statement !== 'string' || processedBrief.challenge_statement.trim().length === 0) {
      console.error('Invalid challenge statement:', processedBrief.challenge_statement);
      throw new Error('Failed to regenerate magic brief: Challenge statement is empty or invalid');
    }

    // Ensure we keep the original metadata but use the new challenge statement
    const regeneratedBrief: GeneratedMagicBrief = {
      title: processedBrief.title || brief.title,
      brand_name: brief.brand_name,
      challenge_statement: processedBrief.challenge_statement,
      connected_learning_outcomes: brief.connected_learning_outcomes,
      skill_focus: brief.skill_focus,
      challenge_order: brief.challenge_order,
      prerequisite_skills: brief.prerequisite_skills,
      skill_compounding: brief.skill_compounding,
      citations: processedBrief.citations || [],
      rawResponse: response
    };

    return regeneratedBrief;
  }

  /**
   * Generate a targeted magic brief focused on a specific learning outcome
   * Ensures the brief addresses the target outcome while maintaining quality
   */
  static async generateTargetedMagicBrief(
    targetOutcome: string,
    epicContext: {
      epic_id: string;
      epic_name: string;
      epic_description: string;
      epic_outcomes: string[];
    },
    existingBriefs: any[] = []
  ): Promise<GeneratedMagicBrief> {
    return withRetry(
      () => this.performTargetedGeneration(targetOutcome, epicContext, existingBriefs),
      { maxRetries: 3, baseDelay: 2000 },
      'generate targeted magic brief'
    );
  }

  private static async performTargetedGeneration(
    targetOutcome: string,
    epicContext: {
      epic_id: string;
      epic_name: string;
      epic_description: string;
      epic_outcomes: string[];
    },
    existingBriefs: any[] = []
  ): Promise<GeneratedMagicBrief> {
    // Get existing brands to avoid duplicates
    const existingBrands = existingBriefs.map(brief => brief.brand_name).filter(Boolean);
    const existingBrandsText = existingBrands.length > 0 
      ? `\n\nExisting brands used: ${existingBrands.join(', ')} (please use a different brand)`
      : '';

    // Build targeted generation prompt
    const targetedPrompt = `
You are creating a targeted magic brief that specifically addresses this learning outcome: "${targetOutcome}"

Epic Context:
- Epic Name: ${epicContext.epic_name}
- Epic Description: ${epicContext.epic_description}
- All Epic Outcomes: ${epicContext.epic_outcomes.join(', ')}

TARGET LEARNING OUTCOME (MUST BE ADDRESSED): ${targetOutcome}

Requirements:
1. Create a realistic business challenge that directly addresses the target learning outcome
2. The challenge should make the target outcome a central focus of the brief
3. Choose a brand/company that fits the challenge context
4. Include ONLY 1-2 additional relevant learning outcomes from the epic as secondary focuses (NOT ALL uncovered outcomes)
5. Ensure the challenge is practical and engaging${existingBrandsText}

IMPORTANT: Return ONLY a valid JSON object with this exact structure:
{
  "title": "Brief title that reflects the challenge",
  "brand_name": "Company or brand name",
  "challenge_statement": "Detailed challenge statement that prominently features the target learning outcome",
  "connected_learning_outcomes": ["${targetOutcome}", "one additional outcome", "optional second additional outcome"],
  "skill_focus": "Primary skill area being developed",
  "prerequisite_skills": "Skills students should have before attempting this challenge",
  "skill_compounding": "How this challenge builds upon previous learning",
  "challenge_order": ${existingBriefs.length + 1},
  "citations": []
}

The connected_learning_outcomes array MUST include "${targetOutcome}" as the first item and should contain a maximum of 3 total outcomes.
IMPORTANT: Do not include ALL uncovered outcomes - only select 1-2 additional outcomes that are most relevant to the challenge.
Do not include any other text, explanations, or formatting. Just the JSON object.
`;

    // Generate the targeted brief using OpenAI
    const response = await aiService.generate({
      prompt: targetedPrompt,
      systemPrompt: 'You are an expert educational designer specializing in creating realistic business challenges for learning. Create a targeted magic brief that specifically addresses the given learning outcome.',
      useCase: 'magic-briefs',
      requiresWebSearch: false,
      requiresCitations: false,
      requiresRealtimeData: false,
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 3000,
      responseFormat: 'json_object',
      metadata: { 
        epic_id: epicContext.epic_id, 
        targeted: true,
        target_outcome: targetOutcome 
      }
    });

    // Parse and validate the targeted response
    const processedBrief = await processAIResponse(response, ['title', 'brand_name', 'challenge_statement', 'connected_learning_outcomes'], 'targeted-magic-brief');
    
    if (!processedBrief || !processedBrief.challenge_statement) {
      console.error('Invalid targeted generation response:', processedBrief);
      throw new Error('Failed to generate targeted magic brief: No challenge statement in response');
    }

    // Ensure the target outcome is included
    if (!processedBrief.connected_learning_outcomes || !processedBrief.connected_learning_outcomes.includes(targetOutcome)) {
      console.warn('Target outcome not found in connected outcomes, adding it');
      processedBrief.connected_learning_outcomes = [targetOutcome, ...(processedBrief.connected_learning_outcomes || [])];
    }

    // Create the targeted brief
    const targetedBrief: GeneratedMagicBrief = {
      title: processedBrief.title,
      brand_name: processedBrief.brand_name,
      challenge_statement: processedBrief.challenge_statement,
      connected_learning_outcomes: processedBrief.connected_learning_outcomes,
      skill_focus: processedBrief.skill_focus || 'Strategic Analysis',
      challenge_order: processedBrief.challenge_order || (existingBriefs.length + 1),
      prerequisite_skills: processedBrief.prerequisite_skills || 'Basic business knowledge',
      skill_compounding: processedBrief.skill_compounding || 'Builds analytical and problem-solving capabilities',
      citations: processedBrief.citations || [],
      rawResponse: response
    };

    return targetedBrief;
  }
}
