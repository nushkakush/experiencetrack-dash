/**
 * Startup stages configuration for magic brief generation
 * Each stage represents a different phase of startup development
 */

export interface StartupStage {
  stage: string;
  description: string;
  funding_range: string;
  team_size: string;
  focus: string;
}

export const STARTUP_STAGES: StartupStage[] = [
  {
    stage: 'Pre-Seed',
    description: 'Idea stage with minimal funding, building MVP',
    funding_range: '$0 - $500K',
    team_size: '1-5 people',
    focus: 'Product-market fit, initial user validation'
  },
  {
    stage: 'Seed',
    description: 'Early stage with initial funding, building core product',
    funding_range: '$500K - $2M',
    team_size: '5-15 people',
    focus: 'User acquisition, product development, market validation'
  },
  {
    stage: 'Series A',
    description: 'Growth stage with significant funding, scaling operations',
    funding_range: '$2M - $15M',
    team_size: '15-50 people',
    focus: 'Market expansion, team building, revenue growth'
  },
  {
    stage: 'Series B',
    description: 'Expansion stage with substantial funding, scaling globally',
    funding_range: '$15M - $50M',
    team_size: '50-200 people',
    focus: 'International expansion, advanced product features, market leadership'
  },
  {
    stage: 'Series C+',
    description: 'Late stage with major funding, preparing for IPO or acquisition',
    funding_range: '$50M - $500M',
    team_size: '200-1000+ people',
    focus: 'Market dominance, strategic partnerships, exit preparation'
  },
  {
    stage: 'Unicorn',
    description: 'Valuation over $1B, major market player',
    funding_range: '$500M+',
    team_size: '1000+ people',
    focus: 'Global expansion, market leadership, strategic acquisitions'
  },
  {
    stage: 'Scale-up',
    description: 'Rapidly growing startup with proven business model',
    funding_range: '$10M - $100M',
    team_size: '50-500 people',
    focus: 'Rapid scaling, market penetration, operational efficiency'
  },
  {
    stage: 'Growth-stage',
    description: 'Mature startup with strong traction, seeking expansion',
    funding_range: '$5M - $50M',
    team_size: '25-200 people',
    focus: 'Market expansion, product diversification, competitive positioning'
  }
];

/**
 * Get a random startup stage for magic brief generation
 */
export function getRandomStartupStage(): StartupStage {
  const randomIndex = Math.floor(Math.random() * STARTUP_STAGES.length);
  return STARTUP_STAGES[randomIndex];
}
