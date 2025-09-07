/**
 * Core prompt constants and shared requirements
 * Centralized location for all prompt-related constants to eliminate redundancy
 */

// ============================================================================
// CORE REQUIREMENTS (Shared across all prompts)
// ============================================================================

export const CORE_REQUIREMENTS = {
  FACT_BASED: `CRITICAL: This must be 100% FACT-BASED with ZERO creativity or speculation. Only use verified, documented information from credible sources.`,
  
  CHALLENGE_DESIGN: `CHALLENGE DESIGN REQUIREMENTS:
- Create realistic business challenges that any company in the industry might face
- Focus on common problems and scenarios that are educational and applicable
- Design challenges that help students learn through practical problem-solving
- Ensure challenges are specific enough to be engaging but general enough to be broadly applicable
- Base challenges on real-world business scenarios and industry best practices`,
  
  COMPANY_FOCUS: `COMPANY REQUIREMENT: Create challenges for a variable company (Company X) that represents a realistic business scenario. Focus on common business challenges that any company in the industry might face, making the briefs applicable to various real-world contexts.`,
  
  EDUCATIONAL_DESIGN: `EDUCATIONAL DESIGN: Apply best practices in educational design to create engaging, practical learning experiences. Use pedagogical principles to design challenges that promote active learning, critical thinking, and skill development. Focus on creating content that is both educational and applicable to real-world scenarios.`,
  
  JSON_RESPONSE: `RESPONSE FORMAT: Respond with ONLY a valid JSON object. No introductory text, explanations, or markdown formatting. The response will be parsed directly by software.`
} as const;

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

export const PROMPT_TEMPLATES = {
  GENERATION_BASE: `Using the description and learning outcomes of the current Epic, design ONE high-quality business case study challenge that aligns directly with the epic's learning outcomes.

EPIC CONTEXT:
- Epic Name: {epic_name}
- Epic Description: {epic_description}
- Epic Learning Outcomes: {epic_outcomes}

{coreRequirements}

CHALLENGE DESIGN PRINCIPLES:
- Connect to MAXIMUM 3 learning outcomes per challenge
- Design for role-playing where students solve real business problems
- Create realistic business scenarios that any company might face
- Focus on common industry challenges and problems
- Make challenges educational and applicable to various contexts

SEQUENTIAL GENERATION CONTEXT:
- This is brief {brief_index} of {total_briefs} in a comprehensive learning sequence
- Previous briefs covered: {covered_outcomes}
- Remaining outcomes to address: {remaining_outcomes}
- Focus on addressing at least one remaining outcome
- If all outcomes covered, create complementary challenge that reinforces previous learning

{jsonResponse}

CONSTRAINTS:
- connected_learning_outcomes MUST be selected verbatim from epic_outcomes (max 3)
- brand_name should be "Company X" or a generic company name that represents the industry context
- Focus on creating educational value through realistic business scenarios

Return your response as a JSON object with this exact structure:
{jsonStructure}`,

  EXPANSION_BASE: `Expand this brand challenge into a complete CBL (Challenge-Based Learning) experience. Generate all required fields for a full experience with high quality and detail.

{coreRequirements}

BRAND-AGNOSTIC DESIGN PRINCIPLE:
- Lectures and deliverables must be independent of the specific brand challenge
- Focus on developing core skills applicable to ANY brand in the same industry
- Use brand challenge only as contextual application example
- Include separate "brand_context" field for brand-specific application context

EXPANSION REQUIREMENTS:
1. Create 3-5 meaningful deliverables that build upon each other
2. Design grading rubric with 3-4 sections, each containing 2-3 specific criteria
3. Create 3-4 lecture sessions with 5-6 learning outcomes each
4. Connect lectures to 2-3 deliverables via their IDs
5. Include 4-6 educational resources per lecture (videos, articles, case studies, reports, podcasts)
6. Use realistic URLs for sample profiles (Mentors and Judges from Bangalore, India)

LECTURE DESIGN REQUIREMENTS:
- Focus on transferable skills and knowledge across different brands
- Tie content to epic learning outcomes, not brand-specific challenges
- Teach methodologies, frameworks, and principles applicable to any similar brand challenge
- Connect to MAXIMUM 3 learning outcomes per lecture

DELIVERABLE DESIGN REQUIREMENTS:
- Assess skills transferable across brands
- Focus descriptions on skill development, not brand context
- Include "brand_context" field for brand-specific application context
- Assessment criteria focus on skill demonstration, not brand knowledge

{jsonResponse}

Return your response as a JSON object matching this exact structure:
{jsonStructure}`
} as const;

// ============================================================================
// JSON STRUCTURES
// ============================================================================

export const JSON_STRUCTURES = {
  MAGIC_BRIEF: `{
  "title": "Challenge Title",
  "brand_name": "Company X",
  "challenge_statement": "Detailed challenge description (2-3 paragraphs describing a realistic business scenario and problem)",
  "connected_learning_outcomes": ["Specific learning outcome 1", "Specific learning outcome 2", "Specific learning outcome 3"],
  "skill_focus": "Primary skill area this challenge develops",
  "challenge_order": 1,
  "prerequisite_skills": "Skills students should have from previous challenges",
  "skill_compounding": "How this challenge builds on previous ones and prepares for next"
}`,

  EXPERIENCE: `{
  "title": "Experience Title",
  "learning_outcomes": ["Specific learning outcome 1", "Specific learning outcome 2", "Specific learning outcome 3"],
  "type": "CBL",
  "challenge": "HTML formatted challenge description (2-3 paragraphs with proper formatting)",
  "deliverables": [
    {
      "id": "deliverable_1",
      "type": "file_upload",
      "title": "Deliverable Title",
      "description": "Detailed description focusing on transferable skills",
      "brand_context": "Brand-specific application context and examples",
      "required": true
    }
  ],
  "grading_rubric": [
    {
      "id": "rubric_section_1",
      "title": "Section Title",
      "weight_percentage": 30,
      "criteria": [
        {
          "id": "criteria_1",
          "name": "Criteria Name",
          "weight_percentage": 15,
          "description": "Detailed description of what constitutes excellent work"
        }
      ]
    }
  ],
  "pass_conditions": {
    "id": "pass_conditions",
    "type": "group",
    "operator": "AND",
    "conditions": [
      {
        "id": "overall_score_condition",
        "type": "condition",
        "field_type": "overall_score",
        "comparison_operator": ">=",
        "value": 50,
        "description": "Overall score must be 50% or higher"
      }
    ]
  },
  "distinction_conditions": {
    "id": "distinction_conditions",
    "type": "group",
    "operator": "AND",
    "conditions": [
      {
        "id": "distinction_score_condition",
        "type": "condition",
        "field_type": "overall_score",
        "comparison_operator": ">=",
        "value": 85,
        "description": "Overall score must be 85% or higher"
      }
    ]
  },
  "lecture_sessions": [
    {
      "id": "lecture_1",
      "order": 1,
      "title": "Lecture Title",
      "description": "Lecture description and learning objectives",
      "learning_outcomes": ["What students will learn from this lecture"],
      "canva_deck_links": [],
      "canva_notes_links": [],
      "resources": [
        {
          "id": "resource_1",
          "type": "youtube_video",
          "title": "YouTube Video Title",
          "url": "https://youtube.com/watch?v=example",
          "description": "Brief description of how this video complements the lecture"
        }
      ],
      "connected_deliverables": ["deliverable_1"]
    }
  ],
  "sample_brand_profiles": [
    {
      "id": "brand_profile_1",
      "name": "Brand Name",
      "url": "https://brand-website.com"
    }
  ],
  "sample_mentor_profiles": [
    {
      "id": "mentor_profile_1",
      "name": "Mentor Name",
      "url": "https://linkedin.com/in/mentor"
    }
  ],
  "sample_judge_profiles": [
    {
      "id": "judge_profile_1",
      "name": "Judge Name",
      "url": "https://linkedin.com/in/judge"
    }
  ]
}`
} as const;

// ============================================================================
// ADDITIONAL INSTRUCTIONS
// ============================================================================

export const ADDITIONAL_INSTRUCTIONS = {
  GENERATION: `IMPORTANT: Do not refuse this request. This is for educational purposes. If you cannot find information about a specific startup, choose a different well-documented startup that fits the criteria.`,
  
  EXPANSION: `DETAILED REQUIREMENTS:
- All IDs must be unique and descriptive
- Grading rubric percentages must add up to 100%
- Criteria names must be specific and actionable
- Include realistic URLs for sample profiles
- Make challenge HTML formatted with proper structure
- Ensure learning outcomes align with epic outcomes
- Provide 2-3 sample profiles for each category
- Focus on educational best practices and proven methodologies
- Create engaging, practical learning experiences`
} as const;
