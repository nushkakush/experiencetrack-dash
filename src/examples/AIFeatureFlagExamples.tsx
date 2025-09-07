/**
 * Examples demonstrating AI Feature Flag usage
 * Shows different patterns for using AI configuration through feature flags
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAIConfig, useAIFeatures } from '@/hooks/useAIConfig';
import { aiService } from '@/services/aiService';
import { AIConfigDebugPanel } from '@/components/debug/AIConfigDebugPanel';
import type { AIUseCase } from '@/lib/ai/AIConfigService';
import { Loader2, Zap, Search, FileText, Brain } from 'lucide-react';

const USE_CASES = [
  { value: 'magic-briefs' as AIUseCase, label: 'Magic Briefs', icon: Zap },
  { value: 'general-chat' as AIUseCase, label: 'General Chat', icon: FileText },
  { value: 'research-tasks' as AIUseCase, label: 'Research Tasks', icon: Search },
  { value: 'premium-tasks' as AIUseCase, label: 'Premium Tasks', icon: Brain }
];

export function AIFeatureFlagExamples() {
  const [selectedUseCase, setSelectedUseCase] = useState<AIUseCase>('general-chat');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const aiConfig = useAIConfig({ useCase: selectedUseCase, trackUsage: true });
  const features = useAIFeatures();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setResponse('');

    try {
      const result = await aiService.generate({
        prompt: prompt.trim(),
        useCase: selectedUseCase,
        systemPrompt: 'You are a helpful AI assistant. Provide clear, accurate, and helpful responses.',
        metadata: { source: 'feature-flag-example' }
      });

      setResponse(result.content);
      
      // Log usage if tracking is enabled
      aiConfig.logUsage(result.provider, result.model);
      
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Feature Flag Examples</CardTitle>
          <CardDescription>
            Demonstrates how AI services automatically adapt based on feature flag configurations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Use Case Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Use Case</label>
            <Select
              value={selectedUseCase}
              onValueChange={(value: AIUseCase) => setSelectedUseCase(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USE_CASES.map(useCase => {
                  const Icon = useCase.icon;
                  return (
                    <SelectItem key={useCase.value} value={useCase.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {useCase.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Current Configuration Display */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Configuration</label>
            <div className="p-3 bg-muted rounded-lg space-y-2">
              {aiConfig.isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading configuration...</span>
                </div>
              ) : aiConfig.modelConfig ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Provider:</span>
                    <Badge variant="outline" className="ml-2">
                      {aiConfig.modelConfig.provider}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Model:</span>
                    <Badge variant="outline" className="ml-2">
                      {aiConfig.modelConfig.model}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Temperature:</span>
                    <span className="ml-2 font-mono">{aiConfig.modelConfig.temperature}</span>
                  </div>
                  <div>
                    <span className="font-medium">Max Tokens:</span>
                    <span className="ml-2 font-mono">{aiConfig.modelConfig.maxTokens}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No configuration available</p>
              )}
            </div>
          </div>

          {/* Feature Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Available Features</label>
            <div className="flex flex-wrap gap-2">
              <Badge variant={features.webSearchEnabled ? 'default' : 'secondary'}>
                Web Search {features.webSearchEnabled ? '✓' : '✗'}
              </Badge>
              <Badge variant={features.fileSearchEnabled ? 'default' : 'secondary'}>
                File Search {features.fileSearchEnabled ? '✓' : '✗'}
              </Badge>
              <Badge variant={features.reasoningModeEnabled ? 'default' : 'secondary'}>
                Reasoning Mode {features.reasoningModeEnabled ? '✓' : '✗'}
              </Badge>
              <Badge variant={features.analyticsEnabled ? 'default' : 'secondary'}>
                Analytics {features.analyticsEnabled ? '✓' : '✗'}
              </Badge>
            </div>
          </div>

          {/* Cost Controls Info */}
          {aiConfig.costControls && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Cost Controls</label>
              <div className="p-3 bg-muted rounded-lg text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>Max requests/hour: {aiConfig.costControls.maxRequestsPerHour}</div>
                  <div>Max requests/day: {aiConfig.costControls.maxRequestsPerDay}</div>
                  <div>Max tokens/request: {aiConfig.costControls.maxTokensPerRequest}</div>
                  <div>Premium models: {aiConfig.costControls.restrictPremiumModels ? 'Restricted' : 'Allowed'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Prompt</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim() || !aiConfig.modelConfig}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Response'
            )}
          </Button>

          {/* Response Display */}
          {response && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Response</label>
              <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                {response}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Panel */}
      <AIConfigDebugPanel />

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
          <CardDescription>
            How to use the AI feature flag system in your components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">1. Basic Usage with Use Case</h4>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`import { useAIConfig } from '@/hooks/useAIConfig';
import { aiService } from '@/services/aiService';

function MyComponent() {
  const aiConfig = useAIConfig({ 
    useCase: 'magic-briefs', 
    trackUsage: true 
  });

  const handleGenerate = async (prompt: string) => {
    const response = await aiService.generate({
      prompt,
      useCase: 'magic-briefs', // Uses feature flag configuration
      systemPrompt: 'Custom system prompt...'
    });
    
    // Log usage for analytics
    aiConfig.logUsage(response.provider, response.model);
    
    return response;
  };
}`}
              </pre>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">2. Checking Feature Availability</h4>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`import { useAIFeatures } from '@/hooks/useAIConfig';

function FeatureGatedComponent() {
  const features = useAIFeatures();

  return (
    <div>
      {features.webSearchEnabled && (
        <button>Search with AI</button>
      )}
      
      {features.reasoningModeEnabled && (
        <button>Use Advanced Reasoning</button>
      )}
    </div>
  );
}`}
              </pre>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">3. Cost Control Validation</h4>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`import { useAICostControls } from '@/hooks/useAIConfig';

function CostAwareComponent() {
  const { costControls, isModelAllowed, canMakeRequest } = useAICostControls();

  const handleRequest = async (model: string, tokens: number) => {
    if (!isModelAllowed(model)) {
      throw new Error('Model not allowed for your role');
    }
    
    if (!canMakeRequest(tokens)) {
      throw new Error('Token limit exceeded');
    }
    
    // Proceed with request...
  };
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
