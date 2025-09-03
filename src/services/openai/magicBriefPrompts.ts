/**
 * OpenAI prompts for magic brief generation and expansion
 * Separated into its own file for maintainability
 */

export const MAGIC_BRIEF_GENERATION_PROMPT = `
Using the description and learning outcomes of the current Epic, design real brand case study challenges that align directly with those outcomes of the epic. These challenges will later be expanded into full briefs if selected.

CRITICAL REQUIREMENT: This must be 100% FACT-BASED with ZERO creativity or speculation. Only use verified, documented information from credible sources.

RESEARCH METHODOLOGY: Think like a PhD-level researcher. Apply rigorous academic standards to fact-checking, source verification, and educational design. Conduct deep analysis of each brand's documented challenges, market position, financial performance, and strategic initiatives. Use advanced reasoning to identify the most educationally valuable and factually grounded challenges.

The guiding principle is: if a student successfully completes all challenges—supported by lectures and one-on-one mentorship—they should demonstrate mastery of the Epic's rubric. In other words, the sequence of challenges must comprehensively cover every critical skill, knowledge area, and applied competency required to become a Research Ranger in the context of full-stack marketing.

STRICT FACT-BASED REQUIREMENTS:
1. Each challenge must explicitly connect to specific epic learning outcomes
2. Challenges must be ordered to create skill compounding (each builds on previous ones)
3. The sequence should progress from foundational to advanced skills
4. Each challenge should clearly state which learning outcomes it addresses
5. If specific brand names are provided, you MUST use ALL of them first before choosing any additional brands. Each provided brand should get at least one challenge.
6. Ensure each challenge uses a different brand to provide variety - NO brand should be used more than once
7. Brand distribution priority: Use ALL provided brands first, then add additional relevant brands only if needed to reach the target count
8. When choosing additional brands, prioritize Indian companies and brands that are relevant to the Indian market context
9. CRITICAL: DO NOT use any brands that already exist in the magic briefs database (provided in context as existing_brands). You must choose completely different, unused brands
10. ONLY use documented, verified facts from credible sources (news articles, financial reports, official statements, SEC filings, earnings reports)
11. NO speculation, assumptions, or creative interpretation of data
12. Every business problem must be documented in recent news or official company communications
13. All financial data, metrics, and statistics must be sourced from official reports or credible financial news
14. All challenges must be based on publicly available, verifiable information

Return your response as a JSON array with the specified number of objects. Each object must have this exact structure:

{
  "title": "Challenge Title (e.g., 'Nike Digital Marketing Strategy Overhaul')",
  "brand_name": "Real Brand Name (e.g., 'Nike')",
  "challenge_statement": "Detailed challenge description (2-3 paragraphs explaining the VERIFIED business problem with specific facts, metrics, and documented context. Must include source citations for all claims)",
  "connected_learning_outcomes": ["Specific learning outcome 1", "Specific learning outcome 2"],
  "skill_focus": "Primary skill area this challenge develops",
  "challenge_order": 1,
  "prerequisite_skills": "Skills students should have from previous challenges",
  "skill_compounding": "How this challenge builds on previous ones and prepares for next"
}

Example JSON response:
[
  {
    "title": "Nike Digital Marketing Strategy Overhaul",
    "brand_name": "Nike",
    "challenge_statement": "Nike is facing declining engagement in their digital marketing campaigns, particularly among Gen Z audiences. The brand has noticed a 15% drop in social media engagement and a 20% decrease in online conversion rates over the past year. Students must develop a comprehensive digital marketing strategy that addresses audience segmentation, content creation, platform optimization, and ROI measurement. The solution should include specific tactics for TikTok, Instagram, and emerging platforms while maintaining Nike's brand voice and values.",
    "connected_learning_outcomes": [
      "Develop comprehensive digital marketing strategies for real-world brands",
      "Analyze market data and consumer behavior to inform marketing decisions"
    ],
    "skill_focus": "Digital Marketing Strategy & Consumer Analysis",
    "challenge_order": 1,
    "prerequisite_skills": "Basic understanding of marketing principles and brand positioning",
    "skill_compounding": "Establishes foundation in digital marketing and consumer analysis that will be essential for all subsequent challenges. Builds strategic thinking skills needed for market expansion and brand communication challenges."
  },
  {
    "title": "Spotify User Retention Crisis",
    "brand_name": "Spotify",
    "challenge_statement": "Spotify is experiencing high churn rates among premium subscribers, with 30% of users canceling within the first 3 months. The challenge requires students to analyze user behavior data, identify key churn indicators, and develop a multi-channel retention strategy. Solutions must include personalized onboarding experiences, targeted re-engagement campaigns, and loyalty program enhancements that reduce churn while increasing lifetime value.",
    "connected_learning_outcomes": [
      "Create multi-channel marketing campaigns with measurable ROI",
      "Design audience segmentation strategies for different demographics"
    ],
    "skill_focus": "Customer Retention & Data-Driven Marketing",
    "challenge_order": 2,
    "prerequisite_skills": "Digital marketing strategy, consumer behavior analysis, data interpretation",
    "skill_compounding": "Builds on digital marketing foundation to focus on retention and data analysis. Develops advanced segmentation and personalization skills needed for market expansion and brand communication challenges."
  },
  {
    "title": "Tesla Market Expansion Strategy",
    "brand_name": "Tesla",
    "challenge_statement": "Tesla needs to expand into emerging markets where electric vehicle adoption is still low. Students must research market conditions, cultural factors, and competitive landscape in target countries like India, Brazil, or Indonesia. The strategy should address infrastructure challenges, pricing models, local partnerships, and marketing approaches that build trust and drive adoption in these new markets.",
    "connected_learning_outcomes": [
      "Implement brand voice and messaging across digital platforms",
      "Create multi-channel marketing campaigns with measurable ROI"
    ],
    "skill_focus": "Market Research & International Expansion Strategy",
    "challenge_order": 3,
    "prerequisite_skills": "Digital marketing strategy, customer retention analysis, data-driven decision making",
    "skill_compounding": "Applies previous marketing and analysis skills to complex international expansion. Develops market research and cultural adaptation skills essential for the final brand communication challenge."
  },
  {
    "title": "Airbnb Post-Pandemic Recovery",
    "brand_name": "Airbnb",
    "challenge_statement": "Airbnb is struggling to regain pre-pandemic booking levels, particularly in urban markets where business travel has decreased. Students must develop a recovery strategy that addresses changing travel patterns, new customer segments, and competitive threats from hotels. The solution should include market repositioning, new service offerings, and marketing campaigns that appeal to remote workers, local staycationers, and emerging travel trends.",
    "connected_learning_outcomes": [
      "Design audience segmentation strategies for different demographics",
      "Implement brand voice and messaging across digital platforms"
    ],
    "skill_focus": "Market Repositioning & Brand Adaptation",
    "challenge_order": 4,
    "prerequisite_skills": "Digital marketing, customer retention, market research, international strategy",
    "skill_compounding": "Synthesizes all previous skills to handle market disruption and repositioning. Develops advanced brand adaptation and crisis communication skills needed for the final sustainability communication challenge."
  },
  {
    "title": "Patagonia Sustainability Communication",
    "brand_name": "Patagonia",
    "challenge_statement": "Patagonia wants to strengthen their position as a sustainability leader while driving sales growth. Students must create a communication strategy that educates consumers about environmental impact without appearing preachy or sacrificing brand appeal. The challenge includes developing content that balances activism with product marketing, creating partnerships with environmental organizations, and designing campaigns that convert awareness into action and purchases.",
    "connected_learning_outcomes": [
      "Implement brand voice and messaging across digital platforms",
      "Create multi-channel marketing campaigns with measurable ROI"
    ],
    "skill_focus": "Brand Communication & Purpose-Driven Marketing",
    "challenge_order": 5,
    "prerequisite_skills": "All previous skills: digital marketing, customer retention, market research, brand adaptation",
    "skill_compounding": "Culminates all previous learning in the most complex challenge: balancing brand purpose with business objectives. Requires mastery of all skills to create authentic, effective communication that drives both awareness and sales."
  }
]

CRITICAL FACT-BASED REQUIREMENTS:
- Ensure each challenge is unique, uses a different real brand, and directly addresses the epic's learning outcomes
- ONLY use documented, verified facts from credible sources (news articles, financial reports, SEC filings, earnings reports)
- NO speculation, assumptions, or creative interpretation
- Every business problem must be documented in recent news or official company communications
- All financial data, metrics, and statistics must be sourced from official reports or credible financial news
- Use web search to find the most current VERIFIED information about each brand's challenges, market position, and recent business developments
- Include specific source citations for all factual claims
- Base challenges ONLY on publicly available, verifiable information`;

export const MAGIC_BRIEF_EXPANSION_PROMPT = `
Expand this brand challenge into a complete CBL (Challenge-Based Learning) experience. Generate all required fields for a full experience with high quality and detail.

CRITICAL REQUIREMENT: This must be 100% FACT-BASED with ZERO creativity or speculation. Only use verified, documented information from credible sources.

RESEARCH METHODOLOGY: Think like a PhD-level researcher. Apply rigorous academic methodology to curriculum design, learning outcome alignment, and resource curation. Conduct deep analysis of pedagogical best practices, industry standards, and educational research. Use advanced reasoning to create the most comprehensive, fact-based, and educationally effective CBL experience possible.

BRAND-AGNOSTIC DESIGN PRINCIPLE: 
The lectures and deliverables must be designed to be independent of the specific brand challenge. They should focus on developing core skills and knowledge that can be applied to ANY brand in the same industry or domain. The brand challenge serves only as a contextual application example, not as the foundation of the learning content.

STRICT FACT-BASED REQUIREMENTS:
1. Create 3-5 meaningful deliverables that build upon each other. Each deliverable must be designed to develop transferable skills that work across different brands.
2. Design a grading rubric with 3-4 sections, each containing 2-3 specific criteria. Use the field name for each criteria as "name" (not title). Make names clear and descriptive.
3. Create 3-4 lecture sessions. Each lecture must have 5-6 learning_outcomes and must connect to 2-3 deliverables via their IDs. Ensure varied connections across lectures.
4. Ensure criteria names are specific and actionable (e.g., "Research Methodology Quality", "Strategic Insight Depth", "Presentation Clarity").
5. Make lecture-deliverable connections logical and varied (some lectures connect to 1-2 deliverables, others to multiple).
6. Use realistic URLs for sample profiles. Mentors and Judges must be professionals from Bangalore, India with valid LinkedIn URLs and relevant expertise in the lecture/challenge we are recommending them for.
7. ONLY use documented, verified industry best practices from credible sources (academic papers, industry reports, official methodologies)
8. Incorporate ONLY real-world examples with verifiable data and current market information from credible sources
9. NO speculation, assumptions, or creative interpretation of data
10. All examples, case studies, and methodologies must be sourced from credible, verifiable sources
11. CRITICAL: Each lecture must include 4-6 internet-curated resources that complement the lecture material:
    - YouTube videos (tutorials, expert talks, case study walkthroughs)
    - Blog posts (industry insights, best practices, how-to guides)
    - LinkedIn posts (professional insights, industry trends, expert opinions)
    - Case studies (real-world applications, success stories, failure analyses)
    - Industry reports (market data, trend analysis, research findings)
    - Podcasts (expert interviews, industry discussions, educational content)
12. All resources must be current, relevant, and directly support the lecture learning objectives
13. Use web search to find the most relevant and up-to-date online resources for each topic

LECTURE DESIGN REQUIREMENTS:
- Each lecture must focus on developing transferable skills and knowledge that apply across different brands
- Lecture content should be tied to epic learning outcomes, not brand-specific challenges
- Use the brand challenge only as a contextual example, not as the core learning content
- Ensure lectures teach methodologies, frameworks, and principles that students can apply to any similar brand challenge
- Learning outcomes should describe skills and knowledge that are brand-agnostic

DELIVERABLE DESIGN REQUIREMENTS:
- Each deliverable must be designed to assess skills that are transferable across brands
- Deliverable descriptions should focus on the skill being developed, not the specific brand context
- Include a separate "brand_context" field that provides brand-specific application context
- The core deliverable should remain viable even if the brand changes
- Assessment criteria should focus on skill demonstration, not brand-specific knowledge

Return your response as a JSON object matching this exact structure. IMPORTANT: Do NOT include canva_deck_links or canva_notes_links in lecture_sessions - leave them as empty arrays.

{
  "title": "Experience Title (same as brief title or slightly expanded)",
  "learning_outcomes": [
    "Specific learning outcome 1",
    "Specific learning outcome 2",
    "Specific learning outcome 3"
  ],
  "type": "CBL",
  "challenge": "HTML formatted challenge description (2-3 paragraphs with proper formatting)",
  "deliverables": [
    {
      "id": "deliverable_1",
      "type": "file_upload",
      "title": "Deliverable Title",
      "description": "Detailed description of what students need to submit (focus on transferable skills, not brand-specific context)",
      "brand_context": "Brand-specific application context and examples for this deliverable",
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
      "learning_outcomes": [
        "What students will learn from this lecture"
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
        },
        {
          "id": "resource_2",
          "type": "blog_post",
          "title": "Blog Post Title",
          "url": "https://example.com/blog-post",
          "description": "Brief description of how this blog post supports the learning objectives"
        },
        {
          "id": "resource_3",
          "type": "linkedin_post",
          "title": "LinkedIn Post Title",
          "url": "https://linkedin.com/posts/example",
          "description": "Brief description of the industry insights from this LinkedIn post"
        },
        {
          "id": "resource_4",
          "type": "case_study",
          "title": "Case Study Title",
          "url": "https://example.com/case-study",
          "description": "Brief description of the real-world application from this case study"
        },
        {
          "id": "resource_5",
          "type": "industry_report",
          "title": "Industry Report Title",
          "url": "https://example.com/industry-report",
          "description": "Brief description of the market data and insights from this report"
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
}

DETAILED REQUIREMENTS:
- All IDs must be unique and descriptive
- Grading rubric percentages must add up to 100% (both section and criteria levels)
- Create 3-5 deliverables that progressively build complexity and develop transferable skills
- Design 3-4 grading rubric sections with 2-3 criteria each
- Criteria names must be specific (e.g., "Market Analysis Depth", "Hypothesis Clarity", "Data Interpretation Quality")
- Create 3-4 lecture sessions with varied deliverable connections and 5-6 learning outcomes each:
  * Some lectures connect to 1-2 specific deliverables
  * Others connect to multiple deliverables
  * Ensure logical flow and progression
- Include realistic URLs for sample profiles (use actual company/LinkedIn URLs). Mentors and Judges should be based in Bangalore, India.
- Make the challenge HTML formatted with proper structure
- Ensure learning outcomes align with the epic's outcomes and focus on transferable skills
- Make deliverables specific, actionable, and professionally relevant while remaining brand-agnostic
- Provide 2-3 sample profiles for each category (brands, mentors, judges)
- Ensure lecture descriptions are detailed and include clear learning objectives focused on skill development
- Use web search to find ONLY VERIFIED industry best practices, documented case studies, and official methodologies
- Incorporate ONLY real-world examples with verifiable data and current market information from credible sources
- NO speculation, assumptions, or creative interpretation of data
- All examples, case studies, and methodologies must be sourced from credible, verifiable sources

BRAND-AGNOSTIC IMPLEMENTATION REQUIREMENTS:
- Lecture titles and descriptions must focus on skill development, not brand-specific content
- Learning outcomes must describe transferable competencies that apply across different brands
- Deliverable descriptions must emphasize the skill being assessed, not the brand context
- Brand context should be provided separately in the "brand_context" field for each deliverable
- Challenge description can include brand-specific details, but lectures and deliverables must remain transferable
- Assessment criteria must focus on skill demonstration and methodology application, not brand knowledge
- Resources and examples should include multiple brands to demonstrate transferability

RESEARCH EXCELLENCE: Apply PhD-level research methodology including:
  * Rigorous literature review of educational best practices
  * Systematic analysis of industry standards and benchmarks
  * Evidence-based curriculum design principles
  * Advanced pedagogical reasoning for learning outcome alignment
  * Comprehensive resource curation with academic standards
  * Deep analytical thinking for challenge complexity and progression
  * Scholarly approach to fact-checking and source verification
  * Focus on creating modular, reusable learning components that transcend specific brand contexts`;
