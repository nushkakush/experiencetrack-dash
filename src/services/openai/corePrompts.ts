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

  REAL_WORLD_APPLICATION: `REAL-WORLD APPLICATION REQUIREMENTS:
- Every lecture and deliverable MUST have direct application to actual job roles and workplace scenarios
- Focus on skills that employers actively seek and use in real job positions
- Avoid purely academic content that sounds impressive but has no practical workplace value
- Include specific job roles, industries, and use cases where the content applies
- Ensure all content teaches skills that students will actually use in their careers`,

  OVERLAP_PREVENTION: `OVERLAP PREVENTION REQUIREMENTS:
- STRICTLY avoid duplicating any lectures or deliverables that already exist in other briefs
- Review the provided existing_lectures and existing_deliverables lists carefully
- Create completely unique content that doesn't overlap with previously generated material
- If similar topics are needed, approach them from different angles or focus areas
- Ensure all new content is distinct and complementary to existing content`,

  TOOL_LECTURE_REQUIREMENTS: `TOOL LECTURE REQUIREMENTS (DETECT AND CREATE WHEN NEEDED):
- Create tool lectures when learning outcomes involve specific software, platforms, or tools
- KEY INDICATORS for tool lectures:
  * "editing techniques" → Video/photo editing software (Premiere Pro, Photoshop, etc.)
  * "data analysis" → Excel, Python, R, Tableau, Power BI
  * "presentation skills" → PowerPoint, Canva, Prezi
  * "design" → Adobe Creative Suite, Figma, Sketch
  * "coding/programming" → Specific programming languages or IDEs
  * "social media" → Platform-specific tools (Hootsuite, Buffer, etc.)
  * "project management" → Asana, Trello, Jira, Monday.com
  * "content creation" → Canva, Adobe Creative Suite, video editing tools
  * "analytics" → Google Analytics, Facebook Analytics, etc.
  * "email marketing" → Mailchimp, Constant Contact, etc.
- When tools are needed, focus on ONE primary tool maximum, include additional tools ONLY if absolutely essential
- Each tool must have clear justification for why it's necessary to achieve the learning outcome
- Tools must be industry-standard and directly applicable to job roles
- If a lecture title/description mentions specific software, platforms, or technical skills, it should be a tool lecture
- Default to conceptual learning only for pure theory, strategy, and soft skills`,

  JSON_RESPONSE: `RESPONSE FORMAT: Respond with ONLY a valid JSON object. No introductory text, explanations, or markdown formatting. The response will be parsed directly by software.`,
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
- MUST include specific job roles and industries where these skills are used
- Avoid academic-only content; focus on practical workplace applications
- Each lecture must demonstrate real-world value for actual job positions

LECTURE TYPE GUIDELINES:
- ANALYZE each lecture title and description for tool indicators
- Create "tool" lectures (type: "tool") when content involves:
  * Editing techniques → Video/photo editing software
  * Data analysis → Excel, Python, Tableau, Power BI
  * Design work → Adobe Creative Suite, Figma, Canva
  * Coding/programming → Specific languages or IDEs
  * Social media → Platform tools (Hootsuite, Buffer)
  * Analytics → Google Analytics, Facebook Analytics
  * Content creation → Design and editing tools
  * Project management → Asana, Trello, Jira
- Create "conceptual" lectures (type: "conceptual") only for:
  * Pure theory and strategy
  * Soft skills and communication
  * Business concepts and frameworks
  * Research and analysis methods
- Tool lectures should focus on ONE primary tool maximum
- Each tool must have clear necessity_reason explaining why it's required

DELIVERABLE DESIGN REQUIREMENTS:
- Assess skills transferable across brands
- Focus descriptions on skill development, not brand context
- Include "brand_context" field for brand-specific application context
- Assessment criteria focus on skill demonstration, not brand knowledge
- MUST assess skills that employers actually require and use
- Include specific job scenarios where these deliverables would be relevant
- Avoid theoretical assessments; focus on practical skill demonstration

OVERLAP PREVENTION REQUIREMENTS:
- Review existing_lectures list and ensure NO duplication of lecture titles or content
- Review existing_deliverables list and ensure NO duplication of deliverable types or approaches
- Create completely unique content that complements but doesn't repeat existing material
- If similar topics are needed, approach them from different angles or focus areas

{jsonResponse}

Return your response as a JSON object matching this exact structure:
{jsonStructure}`,
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
      "type": "conceptual",
      "tools_taught": [
        {
          "name": "Tool Name",
          "category": "software",
          "version": "2021+",
          "job_roles": ["Job Role 1", "Job Role 2"],
          "learning_objective": "What students will learn to do with this tool",
          "necessity_reason": "Why this tool is absolutely required to achieve the learning outcome"
        }
      ],
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
}`,

  MOCK_CHALLENGE: `{
  "title": "Mock Challenge Title",
  "learning_outcomes": ["Specific learning outcome 1", "Specific learning outcome 2", "Specific learning outcome 3"],
  "type": "Mock Challenge",
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
  "sample_judge_profiles": [
    {
      "id": "profile_1",
      "name": "Judge Profile Name",
      "title": "Judge Title",
      "company": "Company Name",
      "bio": "Judge biography",
      "url": "https://example.com/profile"
    }
  ]
}`,

  MASTERCLASS: `{
  "title": "Masterclass Title",
  "learning_outcomes": ["Specific learning outcome 1", "Specific learning outcome 2", "Specific learning outcome 3"],
  "type": "Masterclass",
  "expert_profile": [
    {
      "id": "expert_1",
      "name": "Expert Name",
      "title": "Senior Professional Title",
      "company": "Company Name",
      "bio": "Expert biography and background",
      "linkedin_url": "https://linkedin.com/in/expert",
      "avatar_url": "https://example.com/avatar.jpg"
    }
  ]
}`,

  WORKSHOP: `{
  "title": "Workshop Title",
  "learning_outcomes": ["Specific learning outcome 1", "Specific learning outcome 2", "Specific learning outcome 3"],
  "type": "Workshop",
  "activity_description": "Detailed description of the hands-on workshop activity",
  "materials_required": [
    {
      "id": "material_1",
      "name": "Material Name",
      "quantity": "Quantity needed",
      "description": "Description of the material",
      "where_to_get": "Where to obtain this material",
      "cost_estimate": "Estimated cost",
      "required": true
    }
  ],
  "sop_steps": [
    {
      "id": "step_1",
      "title": "Setup Materials",
      "description": "Gather all required materials and arrange them in the workspace",
      "estimated_time": 5
    },
    {
      "id": "step_2",
      "title": "Begin Activity",
      "description": "Start the main workshop activity following the instructions",
      "estimated_time": 30
    },
    {
      "id": "step_3",
      "title": "Cleanup",
      "description": "Clean up materials and workspace after completion",
      "estimated_time": 5
    }
  ],
  "loom_video_url": "https://loom.com/share/..."
}`,

  GAP: `{
  "title": "GAP Activity Title",
  "learning_outcomes": ["Practical skill 1", "Practical skill 2", "Practical skill 3"],
  "type": "GAP",
  "activity_type": "life_skill",
  "activity_category": "automotive",
  "practical_skills": ["Skill 1", "Skill 2", "Skill 3"],
  "materials_needed": [
    {
      "id": "material_1",
      "name": "Material Name",
      "quantity": "Quantity needed",
      "description": "Description of the material",
      "where_to_get": "Where to obtain this material",
      "cost_estimate": "Estimated cost",
      "required": true
    }
  ],
  "safety_requirements": ["Safety requirement 1", "Safety requirement 2"],
  "activity_duration": 90,
  "instructor_requirements": "Requirements for the instructor/facilitator",
  "venue_requirements": "Indoor/outdoor, special equipment, etc.",
  "fun_factor": "Description of why this activity is engaging and fun",
  "real_world_application": "How this skill applies to real life situations"
}`,
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
- Create engaging, practical learning experiences`,

  MOCK_CHALLENGE: `
- Create practice challenges that reinforce skills without lectures
- Focus on skill application and problem-solving
- Make challenges shorter and more focused than CBL
- Ensure deliverables are clear and achievable
- Include realistic business scenarios for practice
- Emphasize quick skill reinforcement and application
`,

  MASTERCLASS: `
- Design expert-led sessions with industry professionals
- Focus on deep-dive topics and advanced insights
- Include interactive elements and Q&A opportunities
- Create detailed session agendas and learning objectives
- Emphasize real-world experience and industry knowledge
- Make sessions engaging and valuable for participants
`,

  WORKSHOP: `
- Create hands-on, practical activities with clear procedures
- Include detailed materials lists with cost estimates
- Develop comprehensive Standard Operating Procedures (SOPs)
- Focus on skill-building through active participation
- Ensure activities are safe and well-structured
- Include clear instructions for facilitators
`,

  GAP: `
- Design fun, engaging out-of-curriculum activities
- Focus on life skills, sports, hobbies, and practical knowledge
- Make activities accessible and enjoyable for all participants
- Include safety considerations and requirements
- Emphasize real-world application and practical value
- Create activities that build confidence and life skills
- Ensure materials are easily obtainable and cost-effective
`,
} as const;
