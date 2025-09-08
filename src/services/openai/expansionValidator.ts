/**
 * Validation utilities for magic brief expansion
 * Ensures no overlap and real-world applicability
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface LectureValidation {
  title: string;
  learning_outcomes: string[];
  description?: string;
  type?: 'conceptual' | 'tool';
  tools_taught?: Array<{
    name: string;
    category: string;
    job_roles: string[];
    learning_objective: string;
    necessity_reason: string;
  }>;
}

export interface DeliverableValidation {
  title: string;
  type: string;
  description?: string;
}

export interface ExistingContent {
  lectures: Array<{
    id: string;
    title: string;
    learning_outcomes: string[];
    brief_title: string;
  }>;
  deliverables: Array<{
    id: string;
    title: string;
    type: string;
    brief_title: string;
  }>;
}

/**
 * Validate that new lectures don't overlap with existing ones
 */
export function validateLectureOverlap(
  newLectures: LectureValidation[],
  existingContent: ExistingContent
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  newLectures.forEach((lecture, index) => {
    // Check for exact title matches
    const titleMatch = existingContent.lectures.find(
      existing => existing.title.toLowerCase() === lecture.title.toLowerCase()
    );

    if (titleMatch) {
      errors.push(
        `Lecture ${index + 1}: Title "${lecture.title}" already exists in "${titleMatch.brief_title}"`
      );
    }

    // Check for similar titles (fuzzy matching)
    const similarTitle = existingContent.lectures.find(existing => {
      const similarity = calculateStringSimilarity(
        lecture.title.toLowerCase(),
        existing.title.toLowerCase()
      );
      return similarity > 0.8; // 80% similarity threshold
    });

    if (similarTitle) {
      warnings.push(
        `Lecture ${index + 1}: Title "${lecture.title}" is very similar to "${similarTitle.title}" in "${similarTitle.brief_title}"`
      );
    }

    // Check for learning outcome overlap
    const outcomeOverlap = lecture.learning_outcomes.filter(outcome =>
      existingContent.lectures.some(existing =>
        existing.learning_outcomes.some(
          existingOutcome =>
            existingOutcome.toLowerCase().includes(outcome.toLowerCase()) ||
            outcome.toLowerCase().includes(existingOutcome.toLowerCase())
        )
      )
    );

    if (outcomeOverlap.length > 0) {
      warnings.push(
        `Lecture ${index + 1}: Learning outcomes overlap with existing lectures: ${outcomeOverlap.join(', ')}`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate that new deliverables don't overlap with existing ones
 */
export function validateDeliverableOverlap(
  newDeliverables: DeliverableValidation[],
  existingContent: ExistingContent
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  newDeliverables.forEach((deliverable, index) => {
    // Check for exact title matches
    const titleMatch = existingContent.deliverables.find(
      existing =>
        existing.title.toLowerCase() === deliverable.title.toLowerCase()
    );

    if (titleMatch) {
      errors.push(
        `Deliverable ${index + 1}: Title "${deliverable.title}" already exists in "${titleMatch.brief_title}"`
      );
    }

    // Check for similar titles
    const similarTitle = existingContent.deliverables.find(existing => {
      const similarity = calculateStringSimilarity(
        deliverable.title.toLowerCase(),
        existing.title.toLowerCase()
      );
      return similarity > 0.8;
    });

    if (similarTitle) {
      warnings.push(
        `Deliverable ${index + 1}: Title "${deliverable.title}" is very similar to "${similarTitle.title}" in "${similarTitle.brief_title}"`
      );
    }

    // Check for type + description overlap
    const typeMatch = existingContent.deliverables.find(
      existing => existing.type === deliverable.type
    );

    if (typeMatch && deliverable.description) {
      const descriptionSimilarity = calculateStringSimilarity(
        deliverable.description.toLowerCase(),
        typeMatch.description?.toLowerCase() || ''
      );

      if (descriptionSimilarity > 0.7) {
        warnings.push(
          `Deliverable ${index + 1}: Description is very similar to existing ${deliverable.type} deliverable in "${typeMatch.brief_title}"`
        );
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate real-world applicability of lectures
 */
export function validateRealWorldApplicability(
  lectures: LectureValidation[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Keywords that indicate academic-only content
  const academicKeywords = [
    'theoretical framework',
    'conceptual model',
    'academic research',
    'scholarly approach',
    'pedagogical theory',
    'educational methodology',
    'learning theory',
    'cognitive science',
    'behavioral psychology',
    'sociological perspective',
  ];

  // Keywords that indicate real-world application
  const practicalKeywords = [
    'job role',
    'workplace',
    'industry',
    'employer',
    'career',
    'professional',
    'business',
    'practical',
    'hands-on',
    'real-world',
    'actual',
    'implementation',
    'deployment',
    'production',
    'client',
    'customer',
    'stakeholder',
    'team',
    'project',
    'deliverable',
  ];

  lectures.forEach((lecture, index) => {
    const content =
      `${lecture.title} ${lecture.description || ''} ${lecture.learning_outcomes.join(' ')}`.toLowerCase();

    // Check for academic-only content
    const academicMatches = academicKeywords.filter(keyword =>
      content.includes(keyword.toLowerCase())
    );

    if (
      academicMatches.length > 0 &&
      !practicalKeywords.some(keyword => content.includes(keyword))
    ) {
      errors.push(
        `Lecture ${index + 1}: "${lecture.title}" appears to be academic-only without real-world application. Found academic terms: ${academicMatches.join(', ')}`
      );
    }

    // Check for practical application
    const practicalMatches = practicalKeywords.filter(keyword =>
      content.includes(keyword.toLowerCase())
    );

    if (practicalMatches.length === 0) {
      warnings.push(
        `Lecture ${index + 1}: "${lecture.title}" may lack clear real-world application. Consider adding job roles, industries, or practical use cases.`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate real-world applicability of deliverables
 */
export function validateDeliverableApplicability(
  deliverables: DeliverableValidation[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Academic-only deliverable types
  const academicTypes = [
    'essay',
    'research paper',
    'theoretical analysis',
    'conceptual framework',
    'literature review',
    'academic presentation',
  ];

  // Practical deliverable types
  const practicalTypes = [
    'project',
    'prototype',
    'presentation',
    'report',
    'analysis',
    'strategy',
    'plan',
    'proposal',
    'dashboard',
    'model',
    'framework',
    'tool',
    'system',
    'solution',
  ];

  deliverables.forEach((deliverable, index) => {
    const content =
      `${deliverable.title} ${deliverable.description || ''}`.toLowerCase();

    // Check if deliverable type is academic-only
    if (
      academicTypes.some(type => deliverable.type.toLowerCase().includes(type))
    ) {
      errors.push(
        `Deliverable ${index + 1}: Type "${deliverable.type}" is academic-only. Use practical types like: ${practicalTypes.slice(0, 5).join(', ')}`
      );
    }

    // Check for practical application keywords
    const practicalKeywords = [
      'job role',
      'workplace',
      'industry',
      'employer',
      'career',
      'professional',
      'business',
      'practical',
      'hands-on',
      'real-world',
      'actual',
      'implementation',
      'deployment',
      'production',
      'client',
      'customer',
      'stakeholder',
      'team',
      'project',
    ];

    const practicalMatches = practicalKeywords.filter(keyword =>
      content.includes(keyword.toLowerCase())
    );

    if (practicalMatches.length === 0) {
      warnings.push(
        `Deliverable ${index + 1}: "${deliverable.title}" may lack clear real-world application. Consider adding job roles, industries, or practical use cases.`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Validate tool necessity in lectures
 */
export function validateToolNecessity(
  lectures: LectureValidation[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  lectures.forEach((lecture, index) => {
    // Check if tool lecture has tools_taught
    if (
      lecture.type === 'tool' &&
      (!lecture.tools_taught || lecture.tools_taught.length === 0)
    ) {
      errors.push(
        `Lecture ${index + 1}: Tool lecture "${lecture.title}" must include tools_taught array`
      );
    }

    // Check if conceptual lecture has unnecessary tools
    if (
      lecture.type === 'conceptual' &&
      lecture.tools_taught &&
      lecture.tools_taught.length > 0
    ) {
      errors.push(
        `Lecture ${index + 1}: Conceptual lecture "${lecture.title}" should not include tools_taught`
      );
    }

    // Validate tool necessity for tool lectures
    if (lecture.type === 'tool' && lecture.tools_taught) {
      // Check if too many tools
      if (lecture.tools_taught.length > 2) {
        warnings.push(
          `Lecture ${index + 1}: Tool lecture "${lecture.title}" has ${lecture.tools_taught.length} tools. Consider if all are absolutely necessary.`
        );
      }

      // Check necessity reasons
      lecture.tools_taught.forEach((tool, toolIndex) => {
        if (
          !tool.necessity_reason ||
          tool.necessity_reason.trim().length < 20
        ) {
          errors.push(
            `Lecture ${index + 1}, Tool ${toolIndex + 1}: Tool "${tool.name}" must have detailed necessity_reason explaining why it's absolutely required`
          );
        }

        // Check if tool is actually necessary for learning outcomes
        const learningOutcomes = lecture.learning_outcomes
          .join(' ')
          .toLowerCase();
        const toolKeywords = [
          'software',
          'tool',
          'platform',
          'application',
          'system',
          'program',
          'excel',
          'powerpoint',
          'word',
          'google',
          'microsoft',
          'adobe',
          'data analysis',
          'visualization',
          'presentation',
          'documentation',
        ];

        const hasToolKeywords = toolKeywords.some(keyword =>
          learningOutcomes.includes(keyword.toLowerCase())
        );

        if (
          !hasToolKeywords &&
          !tool.necessity_reason.toLowerCase().includes('required')
        ) {
          warnings.push(
            `Lecture ${index + 1}, Tool ${toolIndex + 1}: Tool "${tool.name}" may not be necessary for learning outcomes: ${lecture.learning_outcomes.join(', ')}`
          );
        }
      });
    }

    // Check if conceptual lecture could be tool lecture
    if (lecture.type === 'conceptual') {
      const content =
        `${lecture.title} ${lecture.description || ''} ${lecture.learning_outcomes.join(' ')}`.toLowerCase();
      const toolKeywords = [
        'excel',
        'powerpoint',
        'word',
        'google sheets',
        'data visualization',
        'software',
        'platform',
        'application',
        'tool',
        'program',
      ];

      const hasToolKeywords = toolKeywords.some(keyword =>
        content.includes(keyword)
      );
      if (hasToolKeywords) {
        warnings.push(
          `Lecture ${index + 1}: Conceptual lecture "${lecture.title}" mentions tools but is not marked as tool lecture. Consider if tools are needed.`
        );
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Comprehensive validation for expansion content
 */
export function validateExpansionContent(
  lectures: LectureValidation[],
  deliverables: DeliverableValidation[],
  existingContent: ExistingContent
): ValidationResult {
  const lectureOverlap = validateLectureOverlap(lectures, existingContent);
  const deliverableOverlap = validateDeliverableOverlap(
    deliverables,
    existingContent
  );
  const lectureApplicability = validateRealWorldApplicability(lectures);
  const deliverableApplicability =
    validateDeliverableApplicability(deliverables);
  const toolNecessity = validateToolNecessity(lectures);

  const allErrors = [
    ...lectureOverlap.errors,
    ...deliverableOverlap.errors,
    ...lectureApplicability.errors,
    ...deliverableApplicability.errors,
    ...toolNecessity.errors,
  ];

  const allWarnings = [
    ...lectureOverlap.warnings,
    ...deliverableOverlap.warnings,
    ...lectureApplicability.warnings,
    ...deliverableApplicability.warnings,
    ...toolNecessity.warnings,
  ];

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}
