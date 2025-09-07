/**
 * React hook for accessing AI configuration through feature flags
 */

import { useState, useEffect, useCallback } from 'react';
import { aiConfigService } from '@/lib/ai/AIConfigService';
import type { 
  AIProvider, 
  AIUseCase, 
  AIModelConfig, 
  AICostControls, 
  AIFeatureConfig 
} from '@/lib/ai/AIConfigService';
import { useFeatureFlag } from '@/lib/feature-flags/useFeatureFlag';

export interface UseAIConfigOptions {
  useCase?: AIUseCase;
  trackUsage?: boolean;
}

export interface AIConfigHookReturn {
  // Provider availability
  availableProviders: AIProvider[];
  isProviderEnabled: (provider: AIProvider) => boolean;
  
  // Model configuration
  modelConfig: AIModelConfig | null;
  isLoading: boolean;
  
  // Cost controls
  costControls: AICostControls | null;
  isModelAllowed: (model: string) => boolean;
  
  // Feature configuration
  features: AIFeatureConfig;
  
  // Analytics
  logUsage: (provider: AIProvider, model: string) => void;
  
  // Refresh configuration
  refresh: () => void;
}

/**
 * Hook to access AI configuration based on feature flags
 */
export function useAIConfig(options: UseAIConfigOptions = {}): AIConfigHookReturn {
  const [availableProviders, setAvailableProviders] = useState<AIProvider[]>([]);
  const [modelConfig, setModelConfig] = useState<AIModelConfig | null>(null);
  const [costControls, setCostControls] = useState<AICostControls | null>(null);
  const [features, setFeatures] = useState<AIFeatureConfig>({
    webSearchEnabled: false,
    fileSearchEnabled: false,
    reasoningModeEnabled: false,
    maxSearchResults: 10,
    enableSnippets: true,
    enableCitations: true
  });
  const [isLoading, setIsLoading] = useState(true);

  // Watch for changes in relevant feature flags
  const { isEnabled: openaiEnabled } = useFeatureFlag('ai.openai.enabled');
  const { isEnabled: perplexityEnabled } = useFeatureFlag('ai.perplexity.enabled');
  const { isEnabled: modelConfigEnabled } = useFeatureFlag(
    options.useCase ? `ai.model.${options.useCase}` : 'ai.model.general-chat'
  );

  const loadConfiguration = useCallback(() => {
    setIsLoading(true);
    
    try {
      // Load available providers
      const providers = aiConfigService.getAvailableProviders();
      setAvailableProviders(providers);

      // Load model configuration for use case
      if (options.useCase) {
        const config = aiConfigService.getBestAvailableModel(options.useCase);
        setModelConfig(config);
      } else {
        const config = aiConfigService.getBestAvailableModel('general-chat');
        setModelConfig(config);
      }

      // Load cost controls
      const controls = aiConfigService.getCostControls();
      setCostControls(controls);

      // Load feature configuration
      const featureConfig = aiConfigService.getFeatureConfig();
      setFeatures(featureConfig);

    } catch (error) {
      console.error('Error loading AI configuration:', error);
    } finally {
      setIsLoading(false);
    }
  }, [options.useCase]);

  // Reload configuration when feature flags change
  useEffect(() => {
    loadConfiguration();
  }, [loadConfiguration, openaiEnabled, perplexityEnabled, modelConfigEnabled]);

  const isProviderEnabled = useCallback((provider: AIProvider): boolean => {
    return aiConfigService.isProviderEnabled(provider);
  }, []);

  const isModelAllowed = useCallback((model: string): boolean => {
    return aiConfigService.isModelAllowed(model);
  }, []);

  const logUsage = useCallback((provider: AIProvider, model: string) => {
    if (options.trackUsage !== false && options.useCase) {
      aiConfigService.logConfigUsage(options.useCase, provider, model);
    }
  }, [options.trackUsage, options.useCase]);

  const refresh = useCallback(() => {
    loadConfiguration();
  }, [loadConfiguration]);

  return {
    availableProviders,
    isProviderEnabled,
    modelConfig,
    isLoading,
    costControls,
    isModelAllowed,
    features,
    logUsage,
    refresh
  };
}

/**
 * Hook to check if specific AI features are enabled
 */
export function useAIFeatures() {
  const { isEnabled: webSearchEnabled } = useFeatureFlag('ai.features.web-search');
  const { isEnabled: fileSearchEnabled } = useFeatureFlag('ai.features.file-search');
  const { isEnabled: reasoningModeEnabled } = useFeatureFlag('ai.features.reasoning-mode');
  const { isEnabled: analyticsEnabled } = useFeatureFlag('ai.analytics.enabled');
  const { isEnabled: debugEnabled } = useFeatureFlag('ai.debug.enabled');

  return {
    webSearchEnabled,
    fileSearchEnabled,
    reasoningModeEnabled,
    analyticsEnabled,
    debugEnabled
  };
}

/**
 * Hook to get AI cost controls for current user
 */
export function useAICostControls() {
  const [costControls, setCostControls] = useState<AICostControls | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCostControls = async () => {
      try {
        const controls = aiConfigService.getCostControls();
        setCostControls(controls);
      } catch (error) {
        console.error('Error loading AI cost controls:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCostControls();
  }, []);

  const isModelAllowed = useCallback((model: string): boolean => {
    return aiConfigService.isModelAllowed(model);
  }, []);

  const canMakeRequest = useCallback((tokensRequested: number): boolean => {
    if (!costControls) return true;
    return tokensRequested <= costControls.maxTokensPerRequest;
  }, [costControls]);

  return {
    costControls,
    isLoading,
    isModelAllowed,
    canMakeRequest
  };
}
