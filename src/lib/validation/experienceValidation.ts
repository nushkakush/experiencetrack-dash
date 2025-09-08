import type {
  Experience,
  CreateExperienceRequest,
  GAPActivityType,
  GAPActivityCategory,
  SessionType,
  SkillLevel,
} from '@/types/experience';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate experience data based on its type
 */
export function validateExperience(
  experience: CreateExperienceRequest | Experience
): ValidationResult {
  const errors: string[] = [];

  // Common validation
  if (!experience.title?.trim()) {
    errors.push('Title is required');
  }

  if (!experience.learning_outcomes?.length) {
    errors.push('At least one learning outcome is required');
  }

  if (!experience.type) {
    errors.push('Experience type is required');
  }

  // Type-specific validation
  switch (experience.type) {
    case 'CBL':
      validateCBLExperience(experience, errors);
      break;
    case 'Mock Challenge':
      validateMockChallengeExperience(experience, errors);
      break;
    case 'Masterclass':
      validateMasterclassExperience(experience, errors);
      break;
    case 'Workshop':
      validateWorkshopExperience(experience, errors);
      break;
    case 'GAP':
      validateGAPExperience(experience, errors);
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateCBLExperience(
  experience: CreateExperienceRequest | Experience,
  errors: string[]
): void {
  if (!experience.challenge?.trim()) {
    errors.push('Challenge description is required for CBL experiences');
  }

  if (!experience.deliverables?.length) {
    errors.push('At least one deliverable is required for CBL experiences');
  }

  if (!experience.grading_rubric?.length) {
    errors.push('Grading rubric is required for CBL experiences');
  }

  if (!experience.pass_conditions) {
    errors.push('Pass conditions are required for CBL experiences');
  }

  if (!experience.distinction_conditions) {
    errors.push('Distinction conditions are required for CBL experiences');
  }

  if (!experience.lecture_sessions?.length) {
    errors.push('At least one lecture session is required for CBL experiences');
  }
}

function validateMockChallengeExperience(
  experience: CreateExperienceRequest | Experience,
  errors: string[]
): void {
  // Mock Challenge reuses CBL fields, so validate the same fields as CBL
  if (!experience.challenge?.trim()) {
    errors.push(
      'Challenge description is required for Mock Challenge experiences'
    );
  }

  if (!experience.deliverables?.length) {
    errors.push(
      'At least one deliverable is required for Mock Challenge experiences'
    );
  }

  if (!experience.grading_rubric?.length) {
    errors.push('Grading rubric is required for Mock Challenge experiences');
  }

  if (!experience.pass_conditions) {
    errors.push('Pass conditions are required for Mock Challenge experiences');
  }

  if (!experience.distinction_conditions) {
    errors.push(
      'Distinction conditions are required for Mock Challenge experiences'
    );
  }
}

function validateMasterclassExperience(
  experience: CreateExperienceRequest | Experience,
  errors: string[]
): void {
  if (
    !experience.expert_profile ||
    !Array.isArray(experience.expert_profile) ||
    experience.expert_profile.length === 0
  ) {
    errors.push(
      'At least one expert profile is required for Masterclass experiences'
    );
  } else {
    experience.expert_profile.forEach((profile, index) => {
      if (!profile.name?.trim()) {
        errors.push(
          `Expert ${index + 1} name is required for Masterclass experiences`
        );
      }
      if (!profile.title?.trim()) {
        errors.push(
          `Expert ${index + 1} title is required for Masterclass experiences`
        );
      }
      if (!profile.company?.trim()) {
        errors.push(
          `Expert ${index + 1} company is required for Masterclass experiences`
        );
      }
      if (!profile.bio?.trim()) {
        errors.push(
          `Expert ${index + 1} bio is required for Masterclass experiences`
        );
      }
    });
  }
}

function validateWorkshopExperience(
  experience: CreateExperienceRequest | Experience,
  errors: string[]
): void {
  if (!experience.activity_description?.trim()) {
    errors.push('Activity description is required for Workshop experiences');
  }

  if (!experience.materials_required?.length) {
    errors.push('At least one material is required for Workshop experiences');
  }

  if (!experience.sop_steps?.length) {
    errors.push('At least one SOP step is required for Workshop experiences');
  } else {
    experience.sop_steps.forEach((step, index) => {
      if (!step.title?.trim()) {
        errors.push(
          `SOP Step ${index + 1} title is required for Workshop experiences`
        );
      }
      if (!step.description?.trim()) {
        errors.push(
          `SOP Step ${index + 1} description is required for Workshop experiences`
        );
      }
    });
  }

  if (!experience.loom_video_url?.trim()) {
    errors.push('Loom video URL is required for Workshop experiences');
  }
}

function validateGAPExperience(
  experience: CreateExperienceRequest | Experience,
  errors: string[]
): void {
  // GAP now uses same validation as Workshop
  if (!experience.activity_description?.trim()) {
    errors.push('Activity description is required for GAP experiences');
  }

  if (!experience.materials_required?.length) {
    errors.push('At least one material is required for GAP experiences');
  }

  if (!experience.sop_steps?.length) {
    errors.push('At least one SOP step is required for GAP experiences');
  } else {
    experience.sop_steps.forEach((step, index) => {
      if (!step.title?.trim()) {
        errors.push(
          `SOP Step ${index + 1} title is required for GAP experiences`
        );
      }
      if (!step.description?.trim()) {
        errors.push(
          `SOP Step ${index + 1} description is required for GAP experiences`
        );
      }
    });
  }

  if (!experience.loom_video_url?.trim()) {
    errors.push('Loom video URL is required for GAP experiences');
  }
}

/**
 * Validate GAP activity type and category combination
 */
export function validateGAPActivityTypeAndCategory(
  activityType: GAPActivityType,
  activityCategory: GAPActivityCategory
): ValidationResult {
  const errors: string[] = [];

  const validCombinations: Record<GAPActivityType, GAPActivityCategory[]> = {
    life_skill: [
      'automotive',
      'cooking',
      'financial',
      'health',
      'communication',
    ],
    sport: ['fitness', 'sports', 'outdoor'],
    hobby: ['art', 'music', 'dance', 'crafts', 'technology'],
    social: ['social', 'communication'],
    creative: ['art', 'music', 'dance', 'crafts', 'technology'],
  };

  if (!validCombinations[activityType]?.includes(activityCategory)) {
    errors.push(
      `Activity category "${activityCategory}" is not valid for activity type "${activityType}"`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get validation rules for a specific experience type
 */
export function getValidationRules(type: string): string[] {
  const rules: Record<string, string[]> = {
    CBL: [
      'Challenge description is required',
      'At least one deliverable is required',
      'Grading rubric is required',
      'Pass and distinction conditions are required',
      'At least one lecture session is required',
    ],
    'Mock Challenge': [
      'Challenge description is required',
      'At least one deliverable is required',
      'Grading rubric is required',
      'Pass and distinction conditions are required',
      'No lecture sessions (practice only)',
    ],
    Masterclass: [
      'Session details with agenda and objectives are required',
      'Expert profile with name, title, company, and bio is required',
      'Valid session duration is required',
      'Session type (live/recorded/hybrid) is required',
      'Valid max participants is required',
    ],
    Workshop: [
      'Activity description is required',
      'At least one material is required',
      'SOP document is required',
      'Valid max participants is required',
      'Skill level (beginner/intermediate/advanced) is required',
    ],
    GAP: [
      'Activity type (life_skill/sport/hobby/social/creative) is required',
      'Activity category is required',
      'At least one practical skill is required',
      'At least one material is required',
      'Safety requirements are required',
      'Valid activity duration is required',
      'Instructor requirements are required',
      'Venue requirements are required',
      'Fun factor description is required',
      'Real-world application description is required',
    ],
  };

  return rules[type] || [];
}
