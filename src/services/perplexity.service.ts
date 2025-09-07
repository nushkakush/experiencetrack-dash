/**
 * Perplexity Service
 * Client-side service for interacting with Perplexity Sonar API
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  PerplexityRequest,
  PerplexityResponse,
  PerplexityModel,
  PerplexityServiceConfig,
  PerplexityError,
  BatchPerplexityRequest,
  BatchPerplexityResponse,
  SearchFocus,
  PerplexitySearchConfig,
  SupportedPerplexityModels,
  PerplexityModelConfig
} from '@/types/perplexity';
import { Logger } from '@/lib/logging/Logger';

// Supported Perplexity models with their configurations
const SUPPORTED_MODELS: SupportedPerplexityModels = {
  'sonar': {
    maxTokens: 128000,
    inputCostPer1kTokens: 1.0,
    outputCostPer1kTokens: 1.0,
    requestCost: {
      low: 5.0,
      medium: 8.0,
      high: 12.0
    },
    contextLength: 128000,
    description: 'Sonar - Lightweight model for straightforward queries with web search'
  },
  'sonar-pro': {
    maxTokens: 200000,
    inputCostPer1kTokens: 3.0,
    outputCostPer1kTokens: 15.0,
    requestCost: {
      low: 5.0,
      medium: 5.0,
      high: 5.0
    },
    contextLength: 200000,
    description: 'Sonar Pro - Advanced model for complex queries and follow-ups with web search'
  },
  'sonar-deep-research': {
    maxTokens: 200000,
    inputCostPer1kTokens: 2.0,
    outputCostPer1kTokens: 8.0,
    requestCost: {
      low: 5.0,
      medium: 10.0,
      high: 20.0
    },
    contextLength: 200000,
    description: 'Sonar Deep Research - Exhaustive research and detailed report generation with native citation support',
    citationCostPer1kTokens: 2.0,
    searchQueriesCostPer1k: 5.0,
    reasoningCostPer1kTokens: 3.0
  }
};

// Default configuration
const DEFAULT_CONFIG: PerplexityServiceConfig = {
  defaultModel: 'sonar',
  defaultTemperature: 0.2,
  defaultMaxTokens: 4000,
  enableLogging: true,
  retryAttempts: 3,
  retryDelay: 1000,
  defaultSearchFocus: 'internet',
  defaultMaxCitations: 10,
  includeSnippets: true
};

// Main Perplexity Service Class
export class PerplexityService {
  private config: PerplexityServiceConfig;
  private logger: Logger;

  constructor(config: Partial<PerplexityServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = Logger.getInstance();
  }

  /**
   * Make a Perplexity search request
   */
  async search(request: PerplexityRequest): Promise<PerplexityResponse> {
    const startTime = Date.now();
    
    try {
      // Validate request
      this.validateRequest(request);

      // Add default values
      const fullRequest: PerplexityRequest = {
        ...request,
        temperature: request.temperature ?? this.config.defaultTemperature,
        maxTokens: request.maxTokens ?? this.config.defaultMaxTokens,
        model: request.model ?? this.config.defaultModel,
        searchConfig: {
          focus: this.config.defaultSearchFocus,
          maxCitations: this.config.defaultMaxCitations,
          includeSnippets: this.config.includeSnippets,
          ...request.searchConfig
        }
      };

      this.logger.info('Making Perplexity request', { 
        model: fullRequest.model,
        messageCount: fullRequest.messages.length,
        searchFocus: fullRequest.searchConfig?.focus,
        maxCitations: fullRequest.searchConfig?.maxCitations
      });

      // Make request to Perplexity Edge Function
      const { data, error } = await supabase.functions.invoke('perplexity-search', {
        body: fullRequest
      });

      if (error) {
        throw new PerplexityError(
          `Edge Function error: ${error.message}`,
          'EDGE_FUNCTION_ERROR',
          500,
          error
        );
      }

      const response = data as PerplexityResponse;
      
      if (!response.success) {
        // Provide user-friendly error messages based on error type
        let errorCode = 'PERPLEXITY_ERROR';
        let statusCode = 400;
        
        if (response.errorType) {
          switch (response.errorType) {
            case 'quota_exceeded':
              errorCode = 'QUOTA_EXCEEDED';
              statusCode = 429;
              break;
            case 'rate_limit':
              errorCode = 'RATE_LIMIT_EXCEEDED';
              statusCode = 429;
              break;
            case 'auth_error':
              errorCode = 'AUTHENTICATION_ERROR';
              statusCode = 401;
              break;
            case 'model_error':
              errorCode = 'MODEL_ERROR';
              statusCode = 400;
              break;
            case 'content_length_error':
              errorCode = 'CONTENT_TOO_LONG';
              statusCode = 400;
              break;
            case 'search_error':
              errorCode = 'SEARCH_ERROR';
              statusCode = 400;
              break;
          }
        }
        
        throw new PerplexityError(
          response.error || 'Unknown error occurred',
          errorCode,
          statusCode,
          response
        );
      }

      const responseTime = Date.now() - startTime;
      this.logger.info('Perplexity request completed', { 
        responseTime,
        tokens: response.data?.usage.totalTokens,
        cost: response.data?.cost,
        citations: response.data?.citations.length || 0
      });

      return response;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Perplexity request failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        request: {
          model: request.model,
          messageCount: request.messages.length
        }
      });

      if (error instanceof PerplexityError) {
        throw error;
      }

      throw new PerplexityError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'SERVICE_ERROR',
        500,
        error
      );
    }
  }

  /**
   * Make multiple requests in batch
   */
  async batchSearch(batchRequest: BatchPerplexityRequest): Promise<BatchPerplexityResponse> {
    const { requests, concurrency = 3, onProgress } = batchRequest;
    const responses: PerplexityResponse[] = [];
    let completed = 0;

    this.logger.info('Starting batch Perplexity requests', { 
      totalRequests: requests.length,
      concurrency 
    });

    // Process requests in batches
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (request) => {
        try {
          const response = await this.search(request);
          completed++;
          onProgress?.(completed, requests.length);
          return response;
        } catch (error) {
          completed++;
          onProgress?.(completed, requests.length);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          } as PerplexityResponse;
        }
      });

      const batchResponses = await Promise.all(batchPromises);
      responses.push(...batchResponses);
    }

    // Calculate summary statistics
    const successfulRequests = responses.filter(r => r.success).length;
    const failedRequests = responses.length - successfulRequests;
    const totalCost = responses.reduce((sum, r) => sum + (r.data?.cost || 0), 0);
    const totalTokens = responses.reduce((sum, r) => sum + (r.data?.usage.totalTokens || 0), 0);
    const averageResponseTime = responses.reduce((sum, r) => sum + (r.data?.responseTime || 0), 0) / responses.length;

    this.logger.info('Batch Perplexity requests completed', {
      totalRequests: requests.length,
      successfulRequests,
      failedRequests,
      totalCost,
      totalTokens,
      averageResponseTime
    });

    return {
      responses,
      totalRequests: requests.length,
      successfulRequests,
      failedRequests,
      totalCost,
      totalTokens,
      averageResponseTime
    };
  }

  /**
   * Convenience method for simple search queries
   */
  async simpleSearch(
    query: string,
    model: PerplexityModel = this.config.defaultModel,
    searchConfig?: PerplexitySearchConfig,
    options?: Partial<PerplexityRequest>
  ): Promise<PerplexityResponse> {
    return this.search({
      model,
      messages: [
        {
          role: 'user',
          content: query
        }
      ],
      searchConfig,
      ...options
    });
  }

  /**
   * Search with system prompt for specific context
   */
  async searchWithContext(
    systemPrompt: string,
    userQuery: string,
    model: PerplexityModel = this.config.defaultModel,
    searchConfig?: PerplexitySearchConfig,
    options?: Partial<PerplexityRequest>
  ): Promise<PerplexityResponse> {
    return this.search({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userQuery
        }
      ],
      searchConfig,
      ...options
    });
  }

  /**
   * Academic search with academic focus
   */
  async academicSearch(
    query: string,
    model: PerplexityModel = 'sonar-pro',
    options?: Partial<PerplexityRequest>
  ): Promise<PerplexityResponse> {
    return this.search({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a research assistant. Provide comprehensive, well-cited academic information with reliable sources.'
        },
        {
          role: 'user',
          content: query
        }
      ],
      searchConfig: {
        focus: 'academic',
        maxCitations: 15,
        includeSnippets: true
      },
      ...options
    });
  }

  /**
   * News search for current events
   */
  async newsSearch(
    query: string,
    model: PerplexityModel = this.config.defaultModel,
    options?: Partial<PerplexityRequest>
  ): Promise<PerplexityResponse> {
    return this.search({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a news analyst. Provide current, accurate information about recent events with reliable news sources.'
        },
        {
          role: 'user',
          content: query
        }
      ],
      searchConfig: {
        focus: 'internet',
        maxCitations: 12,
        includeSnippets: true
      },
      ...options
    });
  }

  /**
   * Get model information
   */
  getModelConfig(model: PerplexityModel): PerplexityModelConfig | null {
    return SUPPORTED_MODELS[model] || null;
  }

  /**
   * Get all supported models
   */
  getSupportedModels(): SupportedPerplexityModels {
    return { ...SUPPORTED_MODELS };
  }

  /**
   * Calculate estimated cost for a request
   */
  estimateCost(
    model: PerplexityModel,
    inputTokens: number,
    outputTokens: number,
    complexity: 'low' | 'medium' | 'high' = 'medium'
  ): number {
    const modelConfig = SUPPORTED_MODELS[model];
    if (!modelConfig) return 0;

    const tokenCost = (inputTokens / 1000) * modelConfig.inputCostPer1kTokens + 
                      (outputTokens / 1000) * modelConfig.outputCostPer1kTokens;
    const requestCost = modelConfig.requestCost[complexity] / 1000; // Convert to per-request cost

    return tokenCost + requestCost;
  }

  /**
   * Validate request parameters
   */
  private validateRequest(request: PerplexityRequest): void {
    if (!request.model) {
      throw new PerplexityError('Model is required', 'VALIDATION_ERROR', 400);
    }

    if (!SUPPORTED_MODELS[request.model]) {
      throw new PerplexityError(`Unsupported model: ${request.model}`, 'VALIDATION_ERROR', 400);
    }

    if (!request.messages || request.messages.length === 0) {
      throw new PerplexityError('Messages array is required and cannot be empty', 'VALIDATION_ERROR', 400);
    }

    if (request.temperature !== undefined && (request.temperature < 0 || request.temperature > 2)) {
      throw new PerplexityError('Temperature must be between 0 and 2', 'VALIDATION_ERROR', 400);
    }

    if (request.maxTokens !== undefined && request.maxTokens < 1) {
      throw new PerplexityError('Max tokens must be greater than 0', 'VALIDATION_ERROR', 400);
    }

    // Validate messages format
    for (const message of request.messages) {
      if (!message.role || !message.content) {
        throw new PerplexityError('Each message must have role and content', 'VALIDATION_ERROR', 400);
      }
      
      if (!['system', 'user', 'assistant'].includes(message.role)) {
        throw new PerplexityError('Message role must be system, user, or assistant', 'VALIDATION_ERROR', 400);
      }
    }
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<PerplexityServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): PerplexityServiceConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const perplexityService = new PerplexityService();

// Export class and types
export { SUPPORTED_MODELS };
