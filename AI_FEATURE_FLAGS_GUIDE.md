# AI Feature Flags System

This document explains the comprehensive AI feature flag system implemented to manage AI services, models, and configurations through centralized feature flags.

## Overview

The AI feature flag system allows you to:
- **Control AI provider availability** (OpenAI vs Perplexity)
- **Configure AI models per use case** (magic briefs, chat, research, premium tasks)
- **Manage cost controls** by user role (students vs admins)
- **Toggle AI features** (web search, file search, reasoning mode)
- **Enable fallback mechanisms** between providers
- **Track usage and analytics**

## Architecture

### Core Components

1. **AIConfigService** (`src/lib/ai/AIConfigService.ts`)
   - Centralized service for AI configuration management
   - Reads feature flags and provides typed configuration objects
   - Handles provider selection, model configuration, and cost controls

2. **Enhanced AIService** (`src/services/aiService.ts`)
   - Updated to use feature flag configurations
   - Automatic fallback between providers
   - Use case-based model selection

3. **React Hooks** (`src/hooks/useAIConfig.ts`)
   - `useAIConfig()` - Main hook for AI configuration
   - `useAIFeatures()` - Check feature availability
   - `useAICostControls()` - Access cost control settings

4. **Debug Panel** (`src/components/debug/AIConfigDebugPanel.tsx`)
   - Visual interface for super admins to manage AI settings
   - Real-time feature flag toggling
   - Configuration monitoring

## Feature Flags Structure

### Provider Control
```typescript
'ai.openai.enabled'      // Enable/disable OpenAI service
'ai.perplexity.enabled'  // Enable/disable Perplexity service
```

### Model Configuration by Use Case
```typescript
'ai.model.magic-briefs'    // Magic brief generation settings
'ai.model.general-chat'    // General chat interactions
'ai.model.research-tasks'  // Research and analysis tasks
'ai.model.premium-tasks'   // High-end reasoning tasks
```

Each model flag includes metadata:
```typescript
{
  openaiModel: 'gpt-4o-mini',
  perplexityModel: 'sonar-pro',
  preferredProvider: 'openai',
  temperature: 0.7,
  maxTokens: 4000,
  enableWebSearch: true
}
```

### Cost Controls
```typescript
'ai.cost-controls.student'  // Limits for students
'ai.cost-controls.admin'    // Limits for admins/super admins
```

Cost control metadata:
```typescript
{
  maxRequestsPerHour: 10,
  maxRequestsPerDay: 50,
  maxTokensPerRequest: 2000,
  allowedModels: ['gpt-4o-mini', 'gpt-3.5-turbo', 'sonar'],
  restrictPremiumModels: true
}
```

### Feature Toggles
```typescript
'ai.features.web-search'     // Enable web search capabilities
'ai.features.file-search'    // Enable file search
'ai.features.reasoning-mode' // Enable advanced reasoning
'ai.fallback.enabled'        // Enable provider fallback
'ai.analytics.enabled'       // Enable usage tracking
'ai.debug.enabled'           // Enable debug mode
```

## Usage Examples

### Basic Usage with Use Case
```typescript
import { useAIConfig } from '@/hooks/useAIConfig';
import { aiService } from '@/services/aiService';

function MagicBriefGenerator() {
  const aiConfig = useAIConfig({ 
    useCase: 'magic-briefs', 
    trackUsage: true 
  });

  const generateBrief = async (prompt: string) => {
    const response = await aiService.generate({
      prompt,
      useCase: 'magic-briefs', // Automatically uses feature flag config
      systemPrompt: 'Generate a magic brief...'
    });
    
    // Log usage for analytics
    aiConfig.logUsage(response.provider, response.model);
    
    return response;
  };
}
```

### Feature-Gated Components
```typescript
import { useAIFeatures } from '@/hooks/useAIConfig';

function AIToolbar() {
  const features = useAIFeatures();

  return (
    <div>
      {features.webSearchEnabled && (
        <Button onClick={handleWebSearch}>
          Search with AI
        </Button>
      )}
      
      {features.reasoningModeEnabled && (
        <Button onClick={handleReasoning}>
          Advanced Reasoning
        </Button>
      )}
    </div>
  );
}
```

### Cost Control Validation
```typescript
import { useAICostControls } from '@/hooks/useAIConfig';

function AIRequestHandler() {
  const { isModelAllowed, canMakeRequest } = useAICostControls();

  const makeRequest = async (model: string, tokens: number) => {
    if (!isModelAllowed(model)) {
      throw new Error('Model not allowed for your role');
    }
    
    if (!canMakeRequest(tokens)) {
      throw new Error('Token limit exceeded');
    }
    
    // Proceed with request...
  };
}
```

## Configuration Management

### Automatic Configuration
The system automatically:
- Selects the best available provider based on priority
- Applies model configurations from feature flags
- Enforces cost controls based on user role
- Handles fallback between providers
- Tracks usage when analytics is enabled

### Manual Override
You can still override configurations:
```typescript
// This will use feature flag config for magic-briefs use case
const response1 = await aiService.generate({
  prompt: 'Generate a brief',
  useCase: 'magic-briefs'
});

// This will use manual configuration
const response2 = await aiService.generate({
  prompt: 'Custom request',
  model: 'gpt-4o',
  temperature: 0.9,
  maxTokens: 1000
});
```

## Benefits

### 1. Centralized Control
- All AI configurations managed through feature flags
- Easy to change models/providers without code deployment
- Role-based access control

### 2. Cost Management
- Automatic enforcement of usage limits
- Model restrictions by user role
- Token and request rate limiting

### 3. Reliability
- Automatic fallback between providers
- Graceful degradation when services are unavailable
- Retry mechanisms with configurable delays

### 4. Observability
- Usage tracking and analytics
- Performance monitoring
- Debug mode for troubleshooting

### 5. Flexibility
- Easy A/B testing of different models
- Gradual rollout of new features
- Environment-specific configurations

## Admin Interface

The debug panel (`AIConfigDebugPanel`) provides:
- Real-time feature flag toggling
- Configuration monitoring
- Provider status checking
- Cost control visualization
- Analytics overview (placeholder)

Access the debug panel at `/examples/ai-feature-flags` or integrate it into your admin interface.

## Migration Guide

### Existing Code
```typescript
// Old way - hardcoded configuration
const response = await aiService.generate({
  prompt: 'Generate content',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 4000
});
```

### New Way
```typescript
// New way - feature flag driven
const response = await aiService.generate({
  prompt: 'Generate content',
  useCase: 'general-chat' // Uses feature flag configuration
});
```

## Best Practices

1. **Always specify a use case** when possible for optimal configuration
2. **Use the React hooks** in components for reactive updates
3. **Implement cost control checks** for user-facing AI features
4. **Enable analytics** to monitor usage patterns
5. **Test fallback scenarios** to ensure reliability
6. **Use debug mode** during development and troubleshooting

## Troubleshooting

### No AI Providers Available
- Check that at least one provider flag is enabled
- Verify user has appropriate role permissions
- Check feature flag service is properly initialized

### Model Not Allowed
- Review cost control settings for user role
- Check if model is in allowed models list
- Verify premium model restrictions

### Configuration Not Loading
- Ensure feature flags are properly defined
- Check metadata is correctly structured
- Verify AIConfigService is properly imported

### Fallback Not Working
- Check fallback configuration is enabled
- Verify multiple providers are available
- Review fallback order and retry settings
