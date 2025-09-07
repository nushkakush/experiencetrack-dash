/**
 * Perplexity API Types
 * Type definitions for Perplexity Sonar API integration
 */

// Supported Perplexity Sonar models
export type PerplexityModel = 'sonar' | 'sonar-pro' | 'sonar-deep-research';

// Search focus options for Perplexity
export type SearchFocus = 'internet' | 'academic' | 'writing' | 'wolfram' | 'youtube' | 'reddit';

// Citation information from Perplexity
export interface PerplexityCitation {
  index: number;
  title: string;
  url: string;
  snippet?: string;
  publishedDate?: string;
  domain?: string;
}

// Search configuration for Perplexity requests
export interface PerplexitySearchConfig {
  focus?: SearchFocus;
  maxCitations?: number;
  includeSnippets?: boolean;
  filterDomains?: string[];
  excludeDomains?: string[];
}

// Main Perplexity request interface
export interface PerplexityRequest {
  model: PerplexityModel;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  searchConfig?: PerplexitySearchConfig;
  metadata?: Record<string, any>;
}

// Token usage for Perplexity
export interface PerplexityTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Perplexity response data
export interface PerplexityResponseData {
  content: string;
  model: string;
  usage: PerplexityTokenUsage;
  finishReason: string;
  responseTime: number;
  cost: number;
  citations: PerplexityCitation[];
  searchQueries?: string[];
}

// Main Perplexity response interface
export interface PerplexityResponse {
  success: boolean;
  data?: PerplexityResponseData;
  error?: string;
  errorType?: PerplexityErrorType;
  metadata?: Record<string, any>;
}

// Error types for Perplexity API
export type PerplexityErrorType = 
  | 'quota_exceeded'
  | 'rate_limit'
  | 'auth_error'
  | 'model_error'
  | 'content_length_error'
  | 'search_error'
  | 'unknown';

// Model configuration for Perplexity
export interface PerplexityModelConfig {
  maxTokens: number;
  inputCostPer1kTokens: number;
  outputCostPer1kTokens: number;
  requestCost: {
    low: number;
    medium: number;
    high: number;
  };
  description: string;
  contextLength: number;
  // Additional token types for Sonar Deep Research
  citationCostPer1kTokens?: number;
  searchQueriesCostPer1k?: number;
  reasoningCostPer1kTokens?: number;
}

// Available Perplexity models configuration
export interface SupportedPerplexityModels {
  [key: string]: PerplexityModelConfig;
}

// Service configuration for Perplexity
export interface PerplexityServiceConfig {
  defaultModel: PerplexityModel;
  defaultTemperature: number;
  defaultMaxTokens: number;
  enableLogging: boolean;
  retryAttempts: number;
  retryDelay: number;
  defaultSearchFocus: SearchFocus;
  defaultMaxCitations: number;
  includeSnippets: boolean;
}

// Error class for Perplexity API
export class PerplexityError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'PerplexityError';
  }
}

// Batch request interface for Perplexity
export interface BatchPerplexityRequest {
  requests: PerplexityRequest[];
  concurrency?: number;
  onProgress?: (completed: number, total: number) => void;
}

// Batch response interface for Perplexity
export interface BatchPerplexityResponse {
  responses: PerplexityResponse[];
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalCost: number;
  totalTokens: number;
  averageResponseTime: number;
}

// Request logging interface for Perplexity
export interface PerplexityRequestLog {
  id?: string;
  userId?: string;
  model: PerplexityModel;
  messages: Array<{ role: string; content: string }>;
  searchConfig?: PerplexitySearchConfig;
  temperature?: number;
  maxTokens?: number;
  success: boolean;
  responseContent?: string;
  citationsCount?: number;
  usageTokens?: number;
  cost?: number;
  responseTime?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
}

// Analytics interface for Perplexity
export interface PerplexityAnalytics {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  successRate: number;
  modelUsage: Record<PerplexityModel, number>;
  searchFocusUsage: Record<SearchFocus, number>;
  averageCitations: number;
  errorRate: number;
  topErrors: Array<{ error: string; count: number }>;
}
