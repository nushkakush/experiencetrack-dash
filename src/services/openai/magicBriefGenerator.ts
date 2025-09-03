import { openaiService } from '@/services/openai.service';
import { MagicBriefsService } from '@/services/magicBriefs.service';
import type { 
  MagicBriefGenerationRequest, 
  MagicBriefExpansionRequest, 
  GeneratedMagicBrief 
} from '@/types/magicBrief';
import type { CreateExperienceRequest } from '@/types/experience';
import { MAGIC_BRIEF_GENERATION_PROMPT, MAGIC_BRIEF_EXPANSION_PROMPT } from './magicBriefPrompts';

/**
 * Service for generating magic briefs using OpenAI
 * Focused only on AI generation logic
 */
export class MagicBriefGenerator {
  /**
   * Generate magic briefs using GPT-4o
   */
  static async generateMagicBriefs(
    request: MagicBriefGenerationRequest
  ): Promise<GeneratedMagicBrief[]> {
    const challengeCount = request.challenge_count || 5;
    
    // Get all existing brands to avoid duplication
    const existingBrands = await MagicBriefsService.getAllExistingBrands();
    
    const context = openaiService.createContextBuilder()
      .addStructured({
        epic_id: request.epic_id,
        epic_name: request.epic_name,
        epic_description: request.epic_description,
        epic_outcomes: request.epic_outcomes,
        brand_names: request.brand_names,
        challenge_count: challengeCount,
        existing_brands: existingBrands
      }, 'Epic Context')
      .build();

    const existingBrandsText = existingBrands.length > 0 
      ? `\n\nCRITICAL: DO NOT use any of these existing brands (already used in the database): ${existingBrands.join(', ')}. You must choose completely different brands.`
      : '';

    const brandInstruction = request.brand_names?.length 
      ? `. CRITICAL: You MUST use ALL of these brands first: ${request.brand_names.join(', ')}. Each brand should get at least one challenge. Only if you need more brands to reach ${challengeCount} total challenges, then choose additional relevant brands, prioritizing Indian companies and brands relevant to the Indian market context.${existingBrandsText}`
      : `. Generate ${challengeCount} challenges using relevant brands, prioritizing Indian companies and brands that are relevant to the Indian market context.${existingBrandsText}`;

    const response = await openaiService.generateWithWebSearch(
      `Generate ${challengeCount} magic briefs for the epic: ${request.epic_name}${brandInstruction}`,
      MAGIC_BRIEF_GENERATION_PROMPT + '\n\nCRITICAL: Use web search to find ONLY VERIFIED, DOCUMENTED facts about the brands. NO creativity or speculation. Only use information from credible sources like news articles, financial reports, SEC filings, and official company statements. Every claim must be verifiable and sourced.\n\nRESEARCH REQUIREMENT: Think like a PhD-level researcher. Conduct deep analysis of each brand\'s documented challenges, market position, financial performance, and strategic initiatives. Apply rigorous academic standards to fact-checking and source verification. Use advanced reasoning to identify the most educationally valuable and factually grounded challenges.',
      'gpt-4o', // Use GPT-4o with PhD-level research approach
      { maxResults: 15 },
      {
      context,
        temperature: 0.1, // Very low temperature for maximum factual accuracy
        maxTokens: 6000,
        // reasoningEffort: 'high' // Note: Only available with o1 models in Responses API
      }
    );

    // Parse and validate JSON response
    try {
      console.log('Raw OpenAI response:', response);
      console.log('Response data:', response.data);
      console.log('Response content:', response.data?.content);
      console.log('Response content type:', typeof response.data?.content);
      
      if (!response.data?.content) {
        throw new Error('No content in OpenAI response');
      }
      
      // Extract content from Responses API format
      let contentText = '';
      if (Array.isArray(response.data.content)) {
        // Responses API returns array of content objects
        console.log('Content array items:', response.data.content.map(item => ({ 
          type: item.type, 
          hasText: !!item.text,
          hasContent: !!item.content,
          contentLength: item.content?.length || 0,
          textLength: item.text?.length || 0,
          textPreview: item.text?.substring(0, 100) || 'no text'
        })));
        
        // First try to find output_text items
        contentText = response.data.content
          .filter(item => item.type === 'output_text')
          .map(item => item.text)
          .join('');
          
        // If no output_text found, look for message items with nested content
        if (!contentText) {
          console.log('No output_text found, looking for message items with nested content...');
          for (const item of response.data.content) {
            if (item.type === 'message' && item.content && Array.isArray(item.content)) {
              console.log('Found message item with nested content:', item.content.map(nested => ({
                type: nested.type,
                hasText: !!nested.text,
                textLength: nested.text?.length || 0
              })));
              
              // Extract text from nested content
              const nestedText = item.content
                .filter(nested => nested.type === 'output_text')
                .map(nested => nested.text)
                .join('');
                
              if (nestedText) {
                contentText = nestedText;
                break;
              }
            }
          }
        }
        
        // If still no content, try to get any text content from anywhere
        if (!contentText) {
          console.log('Still no content found, trying all possible text sources...');
          contentText = response.data.content
            .filter(item => item.text)
            .map(item => item.text)
            .join('');
        }
      } else if (typeof response.data.content === 'string') {
        // Fallback for string content
        contentText = response.data.content;
      } else {
        console.log('Unexpected content format:', response.data.content);
        throw new Error('Unexpected content format in response');
      }
      
      console.log('Extracted content text length:', contentText.length);
      console.log('First 200 chars of content:', contentText.substring(0, 200));

      // Clean the response content - extract JSON from the response
      let cleanContent = contentText.trim();
      
      // Look for JSON array starting with [
      const jsonStart = cleanContent.indexOf('[');
      if (jsonStart !== -1) {
        // Find the matching closing bracket
        let bracketCount = 0;
        let jsonEnd = -1;
        for (let i = jsonStart; i < cleanContent.length; i++) {
          if (cleanContent[i] === '[') bracketCount++;
          if (cleanContent[i] === ']') bracketCount--;
          if (bracketCount === 0) {
            jsonEnd = i;
            break;
          }
        }
        
        if (jsonEnd !== -1) {
          cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
        }
      }
      
      // Remove markdown code blocks if still present
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('Cleaned content:', cleanContent);
      
      if (!cleanContent) {
        throw new Error('No content extracted from response');
      }
      
      const briefs = JSON.parse(cleanContent);
      
      if (!Array.isArray(briefs)) {
        throw new Error('Response is not an array');
      }
      
      if (briefs.length !== challengeCount) {
        throw new Error(`Expected ${challengeCount} briefs, got ${briefs.length}`);
      }

      // Validate each brief has required fields
      briefs.forEach((brief, index) => {
        if (!brief.title || !brief.brand_name || !brief.challenge_statement || 
            !brief.connected_learning_outcomes || !brief.skill_focus || 
            !brief.challenge_order || !brief.prerequisite_skills || !brief.skill_compounding) {
          throw new Error(`Brief ${index + 1} is missing required fields`);
        }
      });

      return briefs;
    } catch (error) {
      console.error('Magic briefs parsing error:', error);
      console.error('Raw response that failed to parse:', response);
      throw new Error(`Failed to parse magic briefs response: ${error.message}`);
    }
  }

  /**
   * Expand a magic brief into a full CBL experience
   */
  static async expandMagicBrief(
    request: MagicBriefExpansionRequest
  ): Promise<CreateExperienceRequest> {
    const context = openaiService.createContextBuilder()
      .addStructured({
        brief_title: request.brief_title,
        brand_name: request.brand_name,
        challenge_statement: request.challenge_statement,
        epic_id: request.epic_id,
        epic_name: request.epic_name,
        epic_description: request.epic_description,
        epic_outcomes: request.epic_outcomes
      }, 'Brief and Epic Context')
      .build();

    const response = await openaiService.generateWithWebSearch(
      `Expand the brief "${request.brief_title}" for ${request.brand_name} into a complete CBL experience`,
      MAGIC_BRIEF_EXPANSION_PROMPT + '\n\nCRITICAL: Use web search to find ONLY VERIFIED, DOCUMENTED facts about the brand and industry best practices. NO creativity or speculation. Only use information from credible sources like academic papers, industry reports, official methodologies, and documented case studies. Every claim must be verifiable and sourced.\n\nIMPORTANT: For each lecture, find 4-6 internet-curated resources including YouTube videos, blog posts, LinkedIn posts, case studies, industry reports, and podcasts that complement the lecture material. All resources must be current, relevant, and directly support the learning objectives.\n\nBRAND-AGNOSTIC REQUIREMENT: Create lectures and deliverables that focus on transferable skills and methodologies. The brand challenge should serve only as a contextual example, not as the foundation of the learning content. Each deliverable must include a separate "brand_context" field for brand-specific application context while keeping the core description focused on skill development.\n\nRESEARCH REQUIREMENT: Think like a PhD-level researcher. Apply rigorous academic methodology to curriculum design, learning outcome alignment, and resource curation. Conduct deep analysis of pedagogical best practices, industry standards, and educational research. Use advanced reasoning to create the most comprehensive, fact-based, and educationally effective CBL experience possible.',
      'gpt-4o', // Use GPT-4o with PhD-level research approach
      { maxResults: 20 },
      {
      context,
        temperature: 0.1, // Very low temperature for maximum factual accuracy
        maxTokens: 15000,
        // reasoningEffort: 'high' // Note: Only available with o1 models in Responses API
      }
    );

    // Parse and validate JSON response
    try {
      console.log('Raw OpenAI expansion response:', response);
      console.log('Expansion response data:', response.data);
      console.log('Expansion response content:', response.data?.content);
      console.log('Expansion response content type:', typeof response.data?.content);
      
      if (!response.data?.content) {
        throw new Error('No content in OpenAI expansion response');
      }
      
      // Extract content from Responses API format
      let contentText = '';
      if (Array.isArray(response.data.content)) {
        // Responses API returns array of content objects
        console.log('Expansion content array items:', response.data.content.map(item => ({ 
          type: item.type, 
          hasText: !!item.text,
          hasContent: !!item.content,
          contentLength: item.content?.length || 0,
          textLength: item.text?.length || 0,
          textPreview: item.text?.substring(0, 100) || 'no text'
        })));
        
        // First try to find output_text items
        contentText = response.data.content
          .filter(item => item.type === 'output_text')
          .map(item => item.text)
          .join('');
          
        // If no output_text found, look for message items with nested content
        if (!contentText) {
          console.log('No output_text found in expansion, looking for message items with nested content...');
          for (const item of response.data.content) {
            if (item.type === 'message' && item.content && Array.isArray(item.content)) {
              console.log('Found expansion message item with nested content:', item.content.map(nested => ({
                type: nested.type,
                hasText: !!nested.text,
                textLength: nested.text?.length || 0
              })));
              
              // Extract text from nested content
              const nestedText = item.content
                .filter(nested => nested.type === 'output_text')
                .map(nested => nested.text)
                .join('');
                
              if (nestedText) {
                contentText = nestedText;
                break;
              }
            }
          }
        }
        
        // If still no content, try to get any text content from anywhere
        if (!contentText) {
          console.log('Still no content found in expansion, trying all possible text sources...');
          contentText = response.data.content
            .filter(item => item.text)
            .map(item => item.text)
            .join('');
        }
      } else if (typeof response.data.content === 'string') {
        // Fallback for string content
        contentText = response.data.content;
      } else {
        console.log('Unexpected expansion content format:', response.data.content);
        throw new Error('Unexpected content format in expansion response');
      }
      
      console.log('Extracted expansion content text length:', contentText.length);
      console.log('First 200 chars of expansion content:', contentText.substring(0, 200));

      // Clean the response content - extract JSON from the response
      let cleanContent = contentText.trim();
      
      // Look for JSON object starting with {
      const jsonStart = cleanContent.indexOf('{');
      if (jsonStart !== -1) {
        // Find the matching closing brace
        let braceCount = 0;
        let jsonEnd = -1;
        for (let i = jsonStart; i < cleanContent.length; i++) {
          if (cleanContent[i] === '{') braceCount++;
          if (cleanContent[i] === '}') braceCount--;
          if (braceCount === 0) {
            jsonEnd = i;
            break;
          }
        }
        
        if (jsonEnd !== -1) {
          cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
        }
      }
      
      // Remove markdown code blocks if still present
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('Cleaned expansion content:', cleanContent);
      
      if (!cleanContent) {
        throw new Error('No content extracted from expansion response');
      }
      
      const experience = JSON.parse(cleanContent);
      
      // Validate required fields
      const requiredFields = ['title', 'learning_outcomes', 'type', 'challenge', 'deliverables', 'grading_rubric'];
      for (const field of requiredFields) {
        if (!experience[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Normalize rubric criteria names (map title -> name if needed)
      if (Array.isArray(experience.grading_rubric)) {
        experience.grading_rubric.forEach((section: any) => {
          if (Array.isArray(section.criteria)) {
            section.criteria = section.criteria.map((c: any) => ({
              ...c,
              name: c?.name ?? c?.title ?? 'Criteria',
            }));
          }
        });
      }

      // Ensure lectures have 5-6 learning outcomes and 2-3 connected deliverables
      const deliverableIds: string[] = Array.isArray(experience.deliverables)
        ? experience.deliverables.map((d: any) => d.id).filter(Boolean)
        : [];
      if (Array.isArray(experience.lecture_sessions)) {
        experience.lecture_sessions.forEach((lec: any) => {
          if (Array.isArray(lec.learning_outcomes)) {
            if (lec.learning_outcomes.length > 6) {
              lec.learning_outcomes = lec.learning_outcomes.slice(0, 6);
            }
          }
          if (Array.isArray(lec.connected_deliverables)) {
            const unique = Array.from(new Set(lec.connected_deliverables)).filter((id: string) => deliverableIds.includes(id));
            // Backfill if less than 2
            if (unique.length < 2 && deliverableIds.length > 0) {
              for (const id of deliverableIds) {
                if (!unique.includes(id)) unique.push(id);
                if (unique.length >= 2) break;
              }
            }
            lec.connected_deliverables = unique.slice(0, 3);
          }
        });
      }

      // Ensure deliverables have brand_context field for brand-agnostic design
      if (Array.isArray(experience.deliverables)) {
        experience.deliverables.forEach((deliverable: any) => {
          // Ensure brand_context field exists, even if empty
          if (!deliverable.brand_context) {
            deliverable.brand_context = "Brand-specific application context and examples for this deliverable";
          }
        });
      }

      // Strengthen pass conditions default to >= 50 if present and lower
      const normalizePass = (tree: any) => tree;
      if (experience.pass_conditions?.type) {
        // If single overall_score condition exists with value < 50, bump to 50
        const bumpOverallScore = (node: any) => {
          if (!node) return;
          if (node.type === 'condition' && node.field_type === 'overall_score' && typeof node.value === 'number') {
            if (node.comparison_operator === '>=' && node.value < 50) node.value = 50;
          } else if (node.type === 'group' && Array.isArray(node.conditions)) {
            node.conditions.forEach(bumpOverallScore);
          }
        };
        bumpOverallScore(experience.pass_conditions);
      }

      // Ensure epic_id is set
      experience.epic_id = request.epic_id;

      return experience as CreateExperienceRequest;
    } catch (error) {
      console.error('Magic brief expansion parsing error:', error);
      console.error('Raw expansion response that failed to parse:', response);
      throw new Error(`Failed to parse expanded experience response: ${error.message}`);
    }
  }
}
