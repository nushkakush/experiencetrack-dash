/**
 * AI Configuration Service
 * Centralized service for managing AI configurations through feature flags
 */

import { featureFlagService } from '@/lib/feature-flags/FeatureFlagService';
import { Logger } from '@/lib/logging/Logger';
import type { OpenAIModel } from '@/types/openai';
import type { PerplexityModel } from '@/types/perplexity';

export type AIProvider = 'openai' | 'perplexity';
export type AIUseCase = 'magic-briefs' | 'general-chat' | 'research-tasks' | 'premium-tasks';

export interface AIModelConfig {
  provider: AIProvider;
  model: string;
  temperature: number;
  maxTokens: number;
  enableWebSearch?: boolean;
  maxCitations?: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
}

export interface AICostControls {
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
  maxTokensPerRequest: number;
  allowedModels: string[];
  restrictPremiumModels: boolean;
}

export interface AIFeatureConfig {
  webSearchEnabled: boolean;
  fileSearchEnabled: boolean;
  reasoningModeEnabled: boolean;
  maxSearchResults: number;
  enableSnippets: boolean;
  enableCitations: boolean;
}

export interface AIFallbackConfig {
  enabled: boolean;
  maxRetries: number;
  fallbackDelay: number;
  fallbackOrder: AIProvider[];
  enableFallbackLogging: boolean;
}

export interface AIAnalyticsConfig {
  trackUsage: boolean;
  trackCosts: boolean;
  trackPerformance: boolean;
  trackErrors: boolean;
  retentionDays: number;
}

export interface AIDebugConfig {
  enabled: boolean;
  logRequests: boolean;
  logResponses: boolean;
  logTokenUsage: boolean;
  logPerformance: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Main AI Configuration Service
 */
export class AIConfigService {
  private static instance: AIConfigService;
  private logger: Logger;

  private constructor() {
    this.logger = Logger.getInstance();
  }

  public static getInstance(): AIConfigService {
    if (!AIConfigService.instance) {
      AIConfigService.instance = new AIConfigService();
    }
    return AIConfigService.instance;
  }

  /**
   * Check if AI provider is enabled
   */
  isProviderEnabled(provider: AIProvider): boolean {
    const flagId = `ai.${provider}.enabled`;
    return featureFlagService.isEnabled(flagId);
  }

  /**
   * Get available AI providers in priority order
   */
  getAvailableProviders(): AIProvider[] {
    const providers: { provider: AIProvider; priority: number }[] = [];

    if (this.isProviderEnabled('openai')) {
      const metadata = featureFlagService.getMetadata('ai.openai.enabled');
      providers.push({ 
        provider: 'openai', 
        priority: (metadata?.priority as number) || 1 
      });
    }

    if (this.isProviderEnabled('perplexity')) {
      const metadata = featureFlagService.getMetadata('ai.perplexity.enabled');
      providers.push({ 
        provider: 'perplexity', 
        priority: (metadata?.priority as number) || 2 
      });
    }

    return providers
      .sort((a, b) => a.priority - b.priority)
      .map(p => p.provider);
  }

  /**
   * Get AI model configuration for a specific use case
   */
  getModelConfig(useCase: AIUseCase): AIModelConfig | null {
    const flagId = `ai.model.${useCase}`;
    
    if (!featureFlagService.isEnabled(flagId)) {
      this.logger.warn(`AI model configuration disabled for use case: ${useCase}`);
      return null;
    }

    const metadata = featureFlagService.getMetadata(flagId);
    if (!metadata) {
      this.logger.error(`No metadata found for AI model flag: ${flagId}`);
      return null;
    }

    const preferredProvider = metadata.preferredProvider as AIProvider;
    
    // Check if preferred provider is available
    if (!this.isProviderEnabled(preferredProvider)) {
      const availableProviders = this.getAvailableProviders();
      if (availableProviders.length === 0) {
        this.logger.error('No AI providers are available');
        return null;
      }
      
      this.logger.warn(`Preferred provider ${preferredProvider} not available, using ${availableProviders[0]}`);
      const fallbackProvider = availableProviders[0];
      
      return {
        provider: fallbackProvider,
        model: this.getModelForProvider(metadata, fallbackProvider),
        temperature: metadata.temperature as number,
        maxTokens: metadata.maxTokens as number,
        enableWebSearch: metadata.enableWebSearch as boolean,
        maxCitations: metadata.maxCitations as number,
        reasoningEffort: metadata.reasoningEffort as 'low' | 'medium' | 'high'
      };
    }

    return {
      provider: preferredProvider,
      model: this.getModelForProvider(metadata, preferredProvider),
      temperature: metadata.temperature as number,
      maxTokens: metadata.maxTokens as number,
      enableWebSearch: metadata.enableWebSearch as boolean,
      maxCitations: metadata.maxCitations as number,
      reasoningEffort: metadata.reasoningEffort as 'low' | 'medium' | 'high'
    };
  }

  /**
   * Get model name for a specific provider from metadata
   */
  private getModelForProvider(metadata: Record<string, unknown>, provider: AIProvider): string {
    if (provider === 'openai') {
      return metadata.openaiModel as string || 'gpt-4o-mini';
    } else {
      return metadata.perplexityModel as string || 'sonar';
    }
  }

  /**
   * Get cost controls for current user role
   */
  getCostControls(): AICostControls | null {
    // Try role-specific cost controls first
    const userRole = featureFlagService.getContext().userRole;
    
    let flagId: string;
    if (userRole === 'student') {
      flagId = 'ai.cost-controls.student';
    } else if (userRole === 'admin' || userRole === 'super_admin') {
      flagId = 'ai.cost-controls.admin';
    } else {
      // Default to student controls for unknown roles
      flagId = 'ai.cost-controls.student';
    }

    if (!featureFlagService.isEnabled(flagId)) {
      this.logger.warn(`Cost controls disabled for role: ${userRole}`);
      return null;
    }

    const metadata = featureFlagService.getMetadata(flagId);
    if (!metadata) {
      this.logger.error(`No metadata found for cost controls flag: ${flagId}`);
      return null;
    }

    return {
      maxRequestsPerHour: metadata.maxRequestsPerHour as number,
      maxRequestsPerDay: metadata.maxRequestsPerDay as number,
      maxTokensPerRequest: metadata.maxTokensPerRequest as number,
      allowedModels: metadata.allowedModels as string[],
      restrictPremiumModels: metadata.restrictPremiumModels as boolean
    };
  }

  /**
   * Get AI feature configuration
   */
  getFeatureConfig(): AIFeatureConfig {
    return {
      webSearchEnabled: featureFlagService.isEnabled('ai.features.web-search'),
      fileSearchEnabled: featureFlagService.isEnabled('ai.features.file-search'),
      reasoningModeEnabled: featureFlagService.isEnabled('ai.features.reasoning-mode'),
      maxSearchResults: this.getFeatureMetadata('ai.features.web-search', 'maxSearchResults', 10),
      enableSnippets: this.getFeatureMetadata('ai.features.web-search', 'enableSnippets', true),
      enableCitations: this.getFeatureMetadata('ai.features.web-search', 'enableCitations', true)
    };
  }

  /**
   * Get fallback configuration
   */
  getFallbackConfig(): AIFallbackConfig {
    if (!featureFlagService.isEnabled('ai.fallback.enabled')) {
      return {
        enabled: false,
        maxRetries: 0,
        fallbackDelay: 0,
        fallbackOrder: [],
        enableFallbackLogging: false
      };
    }

    const metadata = featureFlagService.getMetadata('ai.fallback.enabled');
    return {
      enabled: true,
      maxRetries: metadata?.maxRetries as number || 2,
      fallbackDelay: metadata?.fallbackDelay as number || 1000,
      fallbackOrder: metadata?.fallbackOrder as AIProvider[] || ['openai', 'perplexity'],
      enableFallbackLogging: metadata?.enableFallbackLogging as boolean || true
    };
  }

  /**
   * Get analytics configuration
   */
  getAnalyticsConfig(): AIAnalyticsConfig {
    if (!featureFlagService.isEnabled('ai.analytics.enabled')) {
      return {
        trackUsage: false,
        trackCosts: false,
        trackPerformance: false,
        trackErrors: false,
        retentionDays: 0
      };
    }

    const metadata = featureFlagService.getMetadata('ai.analytics.enabled');
    return {
      trackUsage: metadata?.trackUsage as boolean || true,
      trackCosts: metadata?.trackCosts as boolean || true,
      trackPerformance: metadata?.trackPerformance as boolean || true,
      trackErrors: metadata?.trackErrors as boolean || true,
      retentionDays: metadata?.retentionDays as number || 30
    };
  }

  /**
   * Get debug configuration
   */
  getDebugConfig(): AIDebugConfig {
    if (!featureFlagService.isEnabled('ai.debug.enabled')) {
      return {
        enabled: false,
        logRequests: false,
        logResponses: false,
        logTokenUsage: false,
        logPerformance: false,
        logLevel: 'info'
      };
    }

    const metadata = featureFlagService.getMetadata('ai.debug.enabled');
    return {
      enabled: true,
      logRequests: metadata?.logRequests as boolean || true,
      logResponses: metadata?.logResponses as boolean || true,
      logTokenUsage: metadata?.logTokenUsage as boolean || true,
      logPerformance: metadata?.logPerformance as boolean || true,
      logLevel: metadata?.logLevel as 'debug' | 'info' | 'warn' | 'error' || 'debug'
    };
  }

  /**
   * Check if a model is allowed for the current user
   */
  isModelAllowed(model: string): boolean {
    const costControls = this.getCostControls();
    if (!costControls) return true;

    // Check if all models are allowed
    if (costControls.allowedModels.includes('all')) {
      return true;
    }

    // Check if model is in allowed list
    if (costControls.allowedModels.includes(model)) {
      return true;
    }

    // Check if premium models are restricted
    if (costControls.restrictPremiumModels) {
      const premiumModels = ['gpt-4o', 'gpt-4', 'o1-preview', 'o1-mini', 'sonar-pro', 'sonar-deep-research'];
      if (premiumModels.includes(model)) {
        return false;
      }
    }

    return false;
  }

  /**
   * Get the best available model for a use case considering user restrictions
   */
  getBestAvailableModel(useCase: AIUseCase): AIModelConfig | null {
    const config = this.getModelConfig(useCase);
    if (!config) return null;

    // Check if the preferred model is allowed
    if (this.isModelAllowed(config.model)) {
      return config;
    }

    // Try to find an alternative model for the same provider
    const costControls = this.getCostControls();
    if (!costControls) return config;

    const allowedModels = costControls.allowedModels.filter(m => m !== 'all');
    
    // Find the best allowed model for the provider
    let bestModel: string | null = null;
    
    if (config.provider === 'openai') {
      const openaiModels = ['gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4', 'o1-preview'];
      bestModel = openaiModels.find(model => allowedModels.includes(model)) || null;
    } else {
      const perplexityModels = ['sonar', 'sonar-pro', 'sonar-deep-research'];
      bestModel = perplexityModels.find(model => allowedModels.includes(model)) || null;
    }

    if (!bestModel) {
      this.logger.warn(`No allowed models found for provider ${config.provider} and use case ${useCase}`);
      return null;
    }

    return {
      ...config,
      model: bestModel
    };
  }

  /**
   * Helper method to get feature metadata with default fallback
   */
  private getFeatureMetadata<T>(flagId: string, key: string, defaultValue: T): T {
    const metadata = featureFlagService.getMetadata(flagId);
    return (metadata?.[key] as T) ?? defaultValue;
  }

  /**
   * Log AI configuration usage for analytics
   */
  logConfigUsage(useCase: AIUseCase, provider: AIProvider, model: string): void {
    const analyticsConfig = this.getAnalyticsConfig();
    if (!analyticsConfig.trackUsage) return;

    this.logger.info('AI Configuration Usage', {
      useCase,
      provider,
      model,
      timestamp: new Date().toISOString(),
      userId: featureFlagService.getContext().userId,
      userRole: featureFlagService.getContext().userRole
    });
  }
}

// Export singleton instance
export const aiConfigService = AIConfigService.getInstance();
