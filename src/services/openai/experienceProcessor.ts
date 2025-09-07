/**
 * Utility for processing and normalizing expanded experiences
 */

import type { CreateExperienceRequest } from '@/types/experience';

/**
 * Process and normalize expanded experience data
 */
export function processExpandedExperience(experience: any, epicId: string): CreateExperienceRequest {
  // Validate required fields
  const requiredFields = ['title', 'learning_outcomes', 'type', 'challenge', 'deliverables', 'grading_rubric'];
  for (const field of requiredFields) {
    if (!experience[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Normalize rubric criteria names (map title -> name if needed)
  normalizeGradingRubric(experience);

  // Ensure lectures have proper learning outcomes and deliverable connections
  normalizeLectureSessions(experience);

  // Ensure deliverables have brand_context field for brand-agnostic design
  normalizeBrandContext(experience);

  // Strengthen pass conditions
  normalizePassConditions(experience);

  // Ensure epic_id is set
  experience.epic_id = epicId;

  return experience as CreateExperienceRequest;
}

/**
 * Normalize grading rubric criteria names
 */
function normalizeGradingRubric(experience: any): void {
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
}

/**
 * Normalize lecture sessions learning outcomes and deliverable connections
 */
function normalizeLectureSessions(experience: any): void {
  const deliverableIds: string[] = Array.isArray(experience.deliverables)
    ? experience.deliverables.map((d: any) => d.id).filter(Boolean)
    : [];
    
  if (Array.isArray(experience.lecture_sessions)) {
    experience.lecture_sessions.forEach((lec: any) => {
      // Ensure all required arrays are initialized
      lec.learning_outcomes = lec.learning_outcomes || [];
      lec.canva_deck_links = lec.canva_deck_links || [];
      lec.canva_notes_links = lec.canva_notes_links || [];
      lec.resources = lec.resources || [];
      lec.connected_deliverables = lec.connected_deliverables || [];
      
      // Limit learning outcomes to 6 maximum
      if (Array.isArray(lec.learning_outcomes)) {
        if (lec.learning_outcomes.length > 6) {
          lec.learning_outcomes = lec.learning_outcomes.slice(0, 6);
        }
      }
      
      // Ensure proper deliverable connections (2-3 per lecture)
      if (Array.isArray(lec.connected_deliverables)) {
        const unique = Array.from(new Set(lec.connected_deliverables))
          .filter((id: string) => deliverableIds.includes(id));
          
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
}

/**
 * Ensure deliverables have brand_context field
 */
function normalizeBrandContext(experience: any): void {
  if (Array.isArray(experience.deliverables)) {
    experience.deliverables.forEach((deliverable: any) => {
      // Ensure brand_context field exists, even if empty
      if (!deliverable.brand_context) {
        deliverable.brand_context = "Brand-specific application context and examples for this deliverable";
      }
    });
  }
}

/**
 * Normalize pass conditions to ensure minimum 50% threshold
 */
function normalizePassConditions(experience: any): void {
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
}
