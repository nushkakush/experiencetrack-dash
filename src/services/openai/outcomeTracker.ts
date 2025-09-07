/**
 * Advanced Learning Outcome Coverage Tracking System
 * Ensures 100% coverage of learning outcomes across magic briefs
 */

import type { MagicBrief } from '@/types/magicBrief';

export interface OutcomeCoverage {
  outcomeId: string;
  outcomeText: string;
  isCovered: boolean;
  coveredBy: string[]; // Brief IDs that cover this outcome
  coverageScore: number; // 0-1, how well it's covered
  keywords: string[]; // Key terms that indicate coverage
}

export interface CoverageAnalysis {
  totalOutcomes: number;
  coveredOutcomes: number;
  uncoveredOutcomes: string[];
  coveragePercentage: number;
  recommendations: string[];
}

export class OutcomeTracker {
  private static instance: OutcomeTracker;
  private outcomeKeywords: Map<string, string[]> = new Map();

  private constructor() {
    this.initializeOutcomeKeywords();
  }

  static getInstance(): OutcomeTracker {
    if (!OutcomeTracker.instance) {
      OutcomeTracker.instance = new OutcomeTracker();
    }
    return OutcomeTracker.instance;
  }

  /**
   * Initialize keyword mappings for each learning outcome type
   */
  private initializeOutcomeKeywords(): void {
    this.outcomeKeywords.set('positioning', [
      'positioning statement', 'icp', 'ideal customer profile', 'category', 'differentiator', 
      'reason to believe', 'unique value proposition', 'target market', 'competitive advantage'
    ]);
    
    this.outcomeKeywords.set('messaging', [
      'messaging hierarchy', 'headline', 'key claims', 'proof', 'cta', 'call to action',
      'funnel stages', 'customer journey', 'messaging framework'
    ]);
    
    this.outcomeKeywords.set('voice', [
      'voice and tone', 'brand voice', 'tone guidelines', 'writing style', 'brand personality',
      'communication style', 'dos and don\'ts', 'sample rewrites'
    ]);
    
    this.outcomeKeywords.set('story', [
      'story spine', 'narrative', 'storytelling', 'problem tension', 'insight resolution',
      'story framework', 'narrative structure', 'story arc'
    ]);
    
    this.outcomeKeywords.set('proof', [
      'proof and evidence', 'case studies', 'testimonials', 'data points', 'demos',
      'permission to believe', 'credibility', 'social proof', 'evidence architecture'
    ]);
    
    this.outcomeKeywords.set('angle', [
      'angle labs', 'hooks', 'frames', 'resonance', 'credibility', 'distinctiveness',
      'alternative angles', 'creative angles', 'messaging angles'
    ]);
    
    this.outcomeKeywords.set('naming', [
      'names', 'taglines', 'naming', 'brand names', 'semantic territories', 'shortlists',
      'legal compliance', 'user reads', 'name validation'
    ]);
    
    this.outcomeKeywords.set('icp', [
      'icp sheets', 'ideal customer profile', 'triggers', 'anxieties', 'desired outcomes',
      'objection handling', 'customer research', 'persona development'
    ]);
    
    this.outcomeKeywords.set('offer', [
      'offer architecture', 'value props', 'feature bundles', 'guarantees', 'bonuses',
      'pricing narrative', 'jtbd', 'jobs to be done', 'value proposition'
    ]);
    
    this.outcomeKeywords.set('channel', [
      'channel messaging', 'landing pages', 'sales decks', 'ads', 'emails', 'creator briefs',
      'channel adaptation', 'native packaging', 'multi-channel'
    ]);
    
    this.outcomeKeywords.set('brief', [
      'creative brief', 'brief template', 'mandatories', 'guardrails', 'success metrics',
      'strategy alignment', 'asset requirements'
    ]);
    
    this.outcomeKeywords.set('risk', [
      'claim register', 'risk register', 'substantiation', 'policy safe', 'disclaimers',
      'approval path', 'compliance', 'legal review'
    ]);
    
    this.outcomeKeywords.set('validation', [
      'validation', 'smoke tests', 'intercepts', 'comprehension checks', 'user testing',
      'message testing', 'lightweight validation'
    ]);
    
    this.outcomeKeywords.set('brandkit', [
      'brand kit', 'portable brand kit', 'positioning', 'hierarchy', 'voice', 'proof library',
      'templates', 'handoff', 'brand guidelines'
    ]);
  }

  /**
   * Analyze coverage of learning outcomes across generated briefs
   */
  analyzeCoverage(
    epicOutcomes: string[], 
    generatedBriefs: any[] // Accept both MagicBrief and GeneratedMagicBrief
  ): CoverageAnalysis {
    const outcomeCoverage: OutcomeCoverage[] = epicOutcomes.map(outcome => {
      const coverage = this.analyzeOutcomeCoverage(outcome, generatedBriefs);
      return {
        outcomeId: this.generateOutcomeId(outcome),
        outcomeText: outcome,
        isCovered: coverage.isCovered,
        coveredBy: coverage.coveredBy,
        coverageScore: coverage.coverageScore,
        keywords: coverage.keywords
      };
    });

    const coveredOutcomes = outcomeCoverage.filter(oc => oc.isCovered).length;
    const uncoveredOutcomes = outcomeCoverage
      .filter(oc => !oc.isCovered)
      .map(oc => oc.outcomeText);

    const coveragePercentage = (coveredOutcomes / epicOutcomes.length) * 100;

    const recommendations = this.generateRecommendations(outcomeCoverage, uncoveredOutcomes);

    return {
      totalOutcomes: epicOutcomes.length,
      coveredOutcomes,
      uncoveredOutcomes,
      coveragePercentage,
      recommendations
    };
  }

  /**
   * Analyze coverage for a single learning outcome
   */
  private analyzeOutcomeCoverage(
    outcome: string, 
    briefs: any[] // Accept both MagicBrief and GeneratedMagicBrief
  ): { isCovered: boolean; coveredBy: string[]; coverageScore: number; keywords: string[] } {
    const keywords = this.extractKeywords(outcome);
    const coveredBy: string[] = [];
    let totalScore = 0;

    for (const brief of briefs) {
      const briefText = `${brief.title} ${brief.challenge_statement} ${brief.skill_focus}`.toLowerCase();
      const connectedOutcomes = brief.connected_learning_outcomes || [];
      
      // Check if this outcome is explicitly connected
      const isExplicitlyConnected = connectedOutcomes.some(connected => 
        this.outcomesMatch(outcome, connected)
      );

      if (isExplicitlyConnected) {
        coveredBy.push(brief.id);
        totalScore += 1.0; // Full score for explicit connection
      } else {
        // Check for keyword-based coverage
        const keywordScore = this.calculateKeywordScore(keywords, briefText);
        if (keywordScore > 0.3) { // Threshold for coverage
          coveredBy.push(brief.id);
          totalScore += keywordScore;
        }
      }
    }

    return {
      isCovered: coveredBy.length > 0,
      coveredBy,
      coverageScore: Math.min(totalScore, 1.0),
      keywords
    };
  }

  /**
   * Extract keywords from a learning outcome
   */
  private extractKeywords(outcome: string): string[] {
    const outcomeLower = outcome.toLowerCase();
    const keywords: string[] = [];

    // Check against predefined keyword mappings
    for (const [category, categoryKeywords] of this.outcomeKeywords.entries()) {
      if (categoryKeywords.some(keyword => outcomeLower.includes(keyword))) {
        keywords.push(...categoryKeywords);
      }
    }

    // Extract key terms from the outcome itself
    const words = outcomeLower
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['that', 'with', 'from', 'into', 'this', 'will', 'must', 'should'].includes(word));

    keywords.push(...words);

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Calculate keyword-based coverage score
   */
  private calculateKeywordScore(keywords: string[], text: string): number {
    if (keywords.length === 0) return 0;

    const matches = keywords.filter(keyword => text.includes(keyword.toLowerCase()));
    return matches.length / keywords.length;
  }

  /**
   * Check if two outcomes match (more sophisticated than simple string matching)
   */
  private outcomesMatch(outcome1: string, outcome2: string): boolean {
    const keywords1 = this.extractKeywords(outcome1);
    const keywords2 = this.extractKeywords(outcome2);
    
    // Check for significant keyword overlap
    const overlap = keywords1.filter(k => keywords2.includes(k)).length;
    const minKeywords = Math.min(keywords1.length, keywords2.length);
    
    return overlap / minKeywords > 0.5; // 50% keyword overlap threshold
  }

  /**
   * Generate outcome ID for tracking
   */
  private generateOutcomeId(outcome: string): string {
    return outcome
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  /**
   * Generate recommendations for improving coverage
   */
  private generateRecommendations(
    outcomeCoverage: OutcomeCoverage[], 
    uncoveredOutcomes: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (uncoveredOutcomes.length > 0) {
      recommendations.push(`Generate additional briefs to cover ${uncoveredOutcomes.length} missing outcomes: ${uncoveredOutcomes.slice(0, 3).join(', ')}${uncoveredOutcomes.length > 3 ? '...' : ''}`);
    }

    const lowCoverage = outcomeCoverage.filter(oc => oc.isCovered && oc.coverageScore < 0.7);
    if (lowCoverage.length > 0) {
      recommendations.push(`Improve coverage for ${lowCoverage.length} outcomes with low scores: ${lowCoverage.slice(0, 2).map(oc => oc.outcomeText.substring(0, 50)).join(', ')}`);
    }

    return recommendations;
  }

  /**
   * Get remaining outcomes that need coverage
   */
  getRemainingOutcomes(
    epicOutcomes: string[], 
    generatedBriefs: any[] // Accept both MagicBrief and GeneratedMagicBrief
  ): string[] {
    const analysis = this.analyzeCoverage(epicOutcomes, generatedBriefs);
    return analysis.uncoveredOutcomes;
  }

  /**
   * Validate that a brief covers specific outcomes
   */
  validateBriefCoverage(
    brief: any, // Accept both MagicBrief and GeneratedMagicBrief
    targetOutcomes: string[]
  ): { covered: string[]; missed: string[]; score: number } {
    const covered: string[] = [];
    const missed: string[] = [];

    for (const outcome of targetOutcomes) {
      const coverage = this.analyzeOutcomeCoverage(outcome, [brief]);
      if (coverage.isCovered) {
        covered.push(outcome);
      } else {
        missed.push(outcome);
      }
    }

    const score = covered.length / targetOutcomes.length;

    return { covered, missed, score };
  }
}

export const outcomeTracker = OutcomeTracker.getInstance();
