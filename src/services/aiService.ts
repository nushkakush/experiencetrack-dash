/**
 * AI Service - Unified interface for OpenAI and Perplexity
 * Provides intelligent routing between different AI providers based on task requirements
 */

import { openaiService } from './openai.service';
import { perplexityService } from './perplexity.service';
import { Logger } from '@/lib/logging/Logger';
import { aiConfigService } from '@/lib/ai/AIConfigService';
import type { OpenAIChatRequest, OpenAIChatResponse } from '@/types/openai';
import type { PerplexityRequest, PerplexityResponse } from '@/types/perplexity';
import type { Citation } from '@/types/citations';
import type { AIProvider, AIUseCase } from '@/lib/ai/AIConfigService';

export interface AIServiceConfig {
  preferredProvider: AIProvider;
  usePerplexityForWebSearch: boolean;
  fallbackProvider?: AIProvider;
  enableLogging: boolean;
}

export interface UnifiedAIRequest {
  prompt: string;
  systemPrompt?: string;
  useCase?: AIUseCase;
  requiresWebSearch?: boolean;
  requiresRealtimeData?: boolean;
  requiresCitations?: boolean;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  responseFormat?: 'text' | 'json_object';
  context?: any[];
  metadata?: Record<string, any>;
}

export interface UnifiedAIResponse {
  success: boolean;
  content: string;
  citations?: Citation[];
  provider: AIProvider;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  responseTime: number;
  error?: string;
  metadata?: Record<string, any>;
}

const DEFAULT_CONFIG: AIServiceConfig = {
  preferredProvider: 'openai',
  usePerplexityForWebSearch: true,
  fallbackProvider: 'perplexity',
  enableLogging: true
};

export class AIService {
  private config: AIServiceConfig;
  private logger: Logger;

  constructor(config: Partial<AIServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = Logger.getInstance();
  }

  /**
   * Intelligent routing to the best AI provider based on request requirements
   */
  async generate(request: UnifiedAIRequest): Promise<UnifiedAIResponse> {
    // Get configuration from feature flags
    const modelConfig = request.useCase 
      ? aiConfigService.getBestAvailableModel(request.useCase)
      : null;
    
    const fallbackConfig = aiConfigService.getFallbackConfig();
    const analyticsConfig = aiConfigService.getAnalyticsConfig();
    
    // Use feature flag configuration or fallback to legacy logic
    const provider = modelConfig?.provider || this.selectProvider(request);
    
    // Apply model configuration from feature flags
    const enhancedRequest = this.applyModelConfig(request, modelConfig);
    
    this.logger.info('AI Service routing request', {
      provider,
      useCase: request.useCase,
      model: enhancedRequest.model,
      requiresWebSearch: enhancedRequest.requiresWebSearch,
      requiresCitations: enhancedRequest.requiresCitations,
      requiresRealtimeData: enhancedRequest.requiresRealtimeData,
      configFromFlags: !!modelConfig
    });

    // Log configuration usage for analytics
    if (modelConfig && analyticsConfig.trackUsage) {
      aiConfigService.logConfigUsage(
        request.useCase || 'general-chat',
        provider,
        enhancedRequest.model || 'unknown'
      );
    }

    try {
      let response: UnifiedAIResponse;
      
      if (provider === 'perplexity') {
        response = await this.generateWithPerplexity(enhancedRequest);
      } else {
        response = await this.generateWithOpenAI(enhancedRequest);
      }

      return response;
    } catch (error) {
      this.logger.error(`${provider} generation failed`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        useCase: request.useCase
      });
      
      // Try fallback using feature flag configuration
      if (fallbackConfig.enabled && fallbackConfig.maxRetries > 0) {
        return await this.attemptFallback(enhancedRequest, provider, fallbackConfig);
      }
      
      // Legacy fallback for backwards compatibility
      if (this.config.fallbackProvider && this.config.fallbackProvider !== provider) {
        this.logger.info(`Attempting legacy fallback to ${this.config.fallbackProvider}`);
        
        try {
          if (this.config.fallbackProvider === 'perplexity') {
            return await this.generateWithPerplexity(enhancedRequest);
          } else {
            return await this.generateWithOpenAI(enhancedRequest);
          }
        } catch (fallbackError) {
          this.logger.error(`Legacy fallback to ${this.config.fallbackProvider} also failed`, { 
            error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error' 
          });
          throw fallbackError;
        }
      }
      
      throw error;
    }
  }

  /**
   * Generate using OpenAI (with or without web search)
   */
  private async generateWithOpenAI(request: UnifiedAIRequest): Promise<UnifiedAIResponse> {
    const openaiRequest: OpenAIChatRequest = {
      model: request.model as any || 'gpt-4o',
      systemPrompt: request.systemPrompt || 'You are a helpful assistant.',
      userPrompt: request.prompt,
      context: request.context,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      responseFormat: request.responseFormat,
      metadata: request.metadata
    };

    let response: OpenAIChatResponse;

    if (request.requiresWebSearch) {
      response = await openaiService.generateWithWebSearch(
        request.prompt,
        request.systemPrompt,
        openaiRequest.model,
        { maxResults: 15 },
        openaiRequest
      );
    } else {
      response = await openaiService.chatCompletion(openaiRequest);
    }

    if (!response.success || !response.data) {
      throw new Error(response.error || 'OpenAI generation failed');
    }

    return {
      success: true,
      content: response.data.content,
      citations: [], // OpenAI doesn't provide structured citations
      provider: 'openai',
      model: response.data.model,
      usage: response.data.usage,
      cost: response.data.cost,
      responseTime: response.data.responseTime,
      metadata: response.metadata
    };
  }

  /**
   * Generate using Perplexity Sonar
   */
  private async generateWithPerplexity(request: UnifiedAIRequest): Promise<UnifiedAIResponse> {
    const messages = [];
    
    if (request.systemPrompt) {
      messages.push({
        role: 'system' as const,
        content: request.systemPrompt
      });
    }
    
    messages.push({
      role: 'user' as const,
      content: request.prompt
    });

    const perplexityRequest: PerplexityRequest = {
      model: request.model as any || 'sonar',
      messages,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      searchConfig: {
        focus: request.requiresRealtimeData ? 'internet' : 'internet',
        maxCitations: 15,
        includeSnippets: true
      },
      metadata: request.metadata
    };

    const response = await perplexityService.search(perplexityRequest);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Perplexity generation failed');
    }

    return {
      success: true,
      content: response.data.content,
      citations: response.data.citations,
      provider: 'perplexity',
      model: response.data.model,
      usage: response.data.usage,
      cost: response.data.cost,
      responseTime: response.data.responseTime,
      metadata: response.metadata
    };
  }

  /**
   * Apply model configuration from feature flags to request
   */
  private applyModelConfig(request: UnifiedAIRequest, modelConfig: any): UnifiedAIRequest {
    if (!modelConfig) return request;

    return {
      ...request,
      model: request.model || modelConfig.model,
      temperature: request.temperature ?? modelConfig.temperature,
      maxTokens: request.maxTokens ?? modelConfig.maxTokens,
      requiresWebSearch: request.requiresWebSearch ?? modelConfig.enableWebSearch,
      requiresCitations: request.requiresCitations ?? (modelConfig.maxCitations > 0)
    };
  }

  /**
   * Attempt fallback with feature flag configuration
   */
  private async attemptFallback(
    request: UnifiedAIRequest, 
    failedProvider: AIProvider, 
    fallbackConfig: any
  ): Promise<UnifiedAIResponse> {
    const availableProviders = aiConfigService.getAvailableProviders()
      .filter(p => p !== failedProvider);

    if (availableProviders.length === 0) {
      throw new Error('No fallback providers available');
    }

    for (let i = 0; i < Math.min(fallbackConfig.maxRetries, availableProviders.length); i++) {
      const fallbackProvider = availableProviders[i];
      
      if (fallbackConfig.enableFallbackLogging) {
        this.logger.info(`Attempting fallback to ${fallbackProvider} (attempt ${i + 1})`);
      }

      try {
        // Add delay between fallback attempts
        if (i > 0 && fallbackConfig.fallbackDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, fallbackConfig.fallbackDelay));
        }

        if (fallbackProvider === 'perplexity') {
          return await this.generateWithPerplexity(request);
        } else {
          return await this.generateWithOpenAI(request);
        }
      } catch (error) {
        if (fallbackConfig.enableFallbackLogging) {
          this.logger.error(`Fallback to ${fallbackProvider} failed`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            attempt: i + 1
          });
        }
        
        // If this is the last attempt, throw the error
        if (i === Math.min(fallbackConfig.maxRetries, availableProviders.length) - 1) {
          throw error;
        }
      }
    }

    throw new Error('All fallback attempts failed');
  }

  /**
   * Select the best provider based on request requirements (legacy method)
   */
  private selectProvider(request: UnifiedAIRequest): AIProvider {
    // Check if providers are enabled via feature flags
    const availableProviders = aiConfigService.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      this.logger.warn('No AI providers enabled via feature flags, using legacy configuration');
      return this.config.preferredProvider;
    }

    // Force Perplexity for expansion tasks or when citations/realtime data is needed
    if (request.metadata?.taskType === 'expansion' || request.requiresCitations || request.requiresRealtimeData) {
      if (availableProviders.includes('perplexity')) {
        return 'perplexity';
      }
    }

    // Use Perplexity for web search, real-time data, or citation requirements
    if (request.requiresWebSearch || request.requiresRealtimeData || request.requiresCitations) {
      if (availableProviders.includes('perplexity')) {
        return 'perplexity';
      }
    }

    // Return the first available provider in priority order
    return availableProviders[0];
  }

  /**
   * Convenience method for web search with citations
   */
  async searchWithCitations(
    query: string,
    systemPrompt?: string,
    model?: string
  ): Promise<UnifiedAIResponse> {
    // Modify query to focus on problems and challenges rather than solutions
    const problemFocusedQuery = this.makeQueryProblemFocused(query);
    
    return this.generate({
      prompt: problemFocusedQuery,
      systemPrompt: systemPrompt || 'You are a research assistant focused on finding evidence of real problems and challenges SPECIFIC TO THE CHOSEN COMPANY. PRIORITIZE COMPANY-SPECIFIC CITATIONS (60-80% of citations): Find news articles, reports, official statements specifically about the startup\'s challenges, layoffs, funding problems, regulatory issues, shutdowns, or business struggles. USE MINIMAL GENERAL CITATIONS (maximum 20-40%): Only use general industry context when it directly supports the startup\'s specific problems. CRITICAL: DO NOT cite positioning guides, frameworks, or how-to articles. If you cannot find enough company-specific problem sources that naturally align with learning outcomes, recommend choosing a different startup instead of forcing connections.',
      requiresWebSearch: true,
      requiresCitations: true,
      requiresRealtimeData: true,
      model: model || 'sonar'
    });
  }

  /**
   * Convenience method for academic research
   */
  async academicSearch(
    query: string,
    model?: string
  ): Promise<UnifiedAIResponse> {
    return this.generate({
      prompt: query,
      systemPrompt: 'You are a research assistant. Provide comprehensive, well-cited academic information with reliable sources.',
      requiresWebSearch: true,
      requiresCitations: true,
      model: model || 'sonar-pro'
    });
  }

  /**
   * Convenience method for current events/news
   */
  async newsSearch(
    query: string,
    model?: string
  ): Promise<UnifiedAIResponse> {
    return this.generate({
      prompt: query,
      systemPrompt: 'You are a news analyst. Provide current, accurate information about recent events with reliable news sources.',
      requiresWebSearch: true,
      requiresCitations: true,
      requiresRealtimeData: true,
      model: model || 'sonar'
    });
  }

  /**
   * Convenience method for text generation without web search
   */
  async generateText(
    prompt: string,
    systemPrompt?: string,
    model?: string
  ): Promise<UnifiedAIResponse> {
    return this.generate({
      prompt,
      systemPrompt: systemPrompt || 'You are a helpful assistant.',
      requiresWebSearch: false,
      model: model || 'gpt-4o'
    });
  }

  /**
   * Convenience method for expansion tasks - always uses Perplexity
   */
  async generateExpansion(
    prompt: string,
    systemPrompt?: string,
    model?: string,
    metadata?: Record<string, any>
  ): Promise<UnifiedAIResponse> {
    // Modify prompt to focus on problems and challenges
    const problemFocusedPrompt = this.makeQueryProblemFocused(prompt);
    
    return this.generate({
      prompt: problemFocusedPrompt,
      systemPrompt: systemPrompt || 'You are a comprehensive research assistant focused on finding evidence of real problems and challenges SPECIFIC TO THE CHOSEN COMPANY. PRIORITIZE COMPANY-SPECIFIC CITATIONS (60-80% of citations): Find news articles, reports, official statements specifically about the startup\'s challenges, layoffs, funding problems, regulatory issues, shutdowns, or business struggles. USE MINIMAL GENERAL CITATIONS (maximum 20-40%): Only use general industry context when it directly supports the startup\'s specific problems. CRITICAL: DO NOT cite positioning guides, frameworks, or how-to articles. If you cannot find enough company-specific problem sources that naturally align with learning outcomes, recommend choosing a different startup instead of forcing connections.',
      useCase: 'research-tasks',
      requiresWebSearch: true,
      requiresCitations: true,
      requiresRealtimeData: true,
      model: model || 'sonar-pro',
      temperature: 0.1,
      maxTokens: 15000,
      metadata: { 
        taskType: 'expansion', 
        ...metadata 
      }
    });
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): AIServiceConfig {
    return { ...this.config };
  }

  /**
   * Modify query to focus on company-specific problems and challenges rather than solutions
   */
  private makeQueryProblemFocused(query: string): string {
    // Extract company name from query if possible
    const companyNameMatch = query.match(/(?:for|about|regarding)\s+([A-Z][a-zA-Z\s]+?)(?:\s|$|,|\.)/i);
    const companyName = companyNameMatch ? companyNameMatch[1].trim() : '';
    
    // Add company-specific problem-focused keywords to the query
    const problemKeywords = [
      'problems', 'challenges', 'struggles', 'difficulties', 'issues', 'pain points',
      'company problems', 'business challenges', 'operational issues', 'barriers',
      'obstacles', 'failures', 'crises', 'decline', 'losses', 'competition pressure',
      'specific problems', 'documented challenges', 'real struggles', 'actual issues',
      'regulatory challenges', 'funding struggles', 'market problems'
    ];
    
    // Check if query already contains problem-focused terms
    const hasProblemTerms = problemKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
    
    if (hasProblemTerms) {
      return query;
    }
    
    // If we have a company name, create specific problem-focused queries
    if (companyName) {
      return `"${companyName}" specific problems challenges struggles difficulties business issues news reports layoffs funding problems regulatory issues shutdown closure bankruptcy`;
    }
    
    // Add company-specific problem-focused context to the query
    return `${query} specific problems challenges struggles difficulties company issues business problems regulatory challenges`;
  }
}

// Export singleton instance
export const aiService = new AIService();
