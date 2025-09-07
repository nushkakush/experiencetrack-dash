/**
 * Debug panel for AI configuration and feature flags
 * Allows super admins to view and modify AI settings
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Settings, Activity, BarChart3, Bug } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAIConfig, useAIFeatures, useAICostControls } from '@/hooks/useAIConfig';
import { useFeatureFlag } from '@/lib/feature-flags/useFeatureFlag';
import { featureFlagService } from '@/lib/feature-flags/FeatureFlagService';
import type { AIUseCase } from '@/lib/ai/AIConfigService';

interface AIConfigDebugPanelProps {
  className?: string;
}

const USE_CASES: { value: AIUseCase; label: string }[] = [
  { value: 'magic-briefs', label: 'Magic Briefs' },
  { value: 'general-chat', label: 'General Chat' },
  { value: 'research-tasks', label: 'Research Tasks' },
  { value: 'premium-tasks', label: 'Premium Tasks' }
];

export function AIConfigDebugPanel({ className }: AIConfigDebugPanelProps) {
  const [selectedUseCase, setSelectedUseCase] = useState<AIUseCase>('magic-briefs');
  const [refreshKey, setRefreshKey] = useState(0);

  // Check if user has access to debug panel
  const { isEnabled: debugEnabled } = useFeatureFlag('ai.debug.enabled');
  const { isEnabled: superAdminAccess } = useFeatureFlag('equipment.create');

  const aiConfig = useAIConfig({ useCase: selectedUseCase, trackUsage: true });
  const aiFeatures = useAIFeatures();
  const costControls = useAICostControls();

  if (!debugEnabled && !superAdminAccess) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          AI Debug Panel is not enabled for your role.
        </AlertDescription>
      </Alert>
    );
  }

  const handleToggleFlag = async (flagId: string) => {
    try {
      const currentState = featureFlagService.isEnabled(flagId);
      featureFlagService.setFlagState(flagId, !currentState);
      setRefreshKey(prev => prev + 1);
      aiConfig.refresh();
    } catch (error) {
      console.error('Error toggling feature flag:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    aiConfig.refresh();
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            AI Configuration Debug Panel
          </CardTitle>
          <CardDescription>
            Monitor and configure AI services through feature flags
          </CardDescription>
          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              Refresh
            </Button>
            <Select
              value={selectedUseCase}
              onValueChange={(value: AIUseCase) => setSelectedUseCase(value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USE_CASES.map(useCase => (
                  <SelectItem key={useCase.value} value={useCase.value}>
                    {useCase.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="providers" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="providers">Providers</TabsTrigger>
              <TabsTrigger value="models">Models</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="costs">Cost Controls</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="providers" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">OpenAI Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="openai-enabled">Enabled</Label>
                      <Switch
                        id="openai-enabled"
                        checked={aiConfig.isProviderEnabled('openai')}
                        onCheckedChange={() => handleToggleFlag('ai.openai.enabled')}
                      />
                    </div>
                    <div className="mt-2">
                      <Badge variant={aiConfig.isProviderEnabled('openai') ? 'default' : 'secondary'}>
                        {aiConfig.isProviderEnabled('openai') ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Perplexity Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="perplexity-enabled">Enabled</Label>
                      <Switch
                        id="perplexity-enabled"
                        checked={aiConfig.isProviderEnabled('perplexity')}
                        onCheckedChange={() => handleToggleFlag('ai.perplexity.enabled')}
                      />
                    </div>
                    <div className="mt-2">
                      <Badge variant={aiConfig.isProviderEnabled('perplexity') ? 'default' : 'secondary'}>
                        {aiConfig.isProviderEnabled('perplexity') ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Available Providers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {aiConfig.availableProviders.map((provider, index) => (
                      <Badge key={provider} variant={index === 0 ? 'default' : 'secondary'}>
                        {provider} {index === 0 && '(Primary)'}
                      </Badge>
                    ))}
                  </div>
                  {aiConfig.availableProviders.length === 0 && (
                    <p className="text-sm text-muted-foreground">No providers available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="models" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Model Configuration for {selectedUseCase}</CardTitle>
                </CardHeader>
                <CardContent>
                  {aiConfig.isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : aiConfig.modelConfig ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label>Provider</Label>
                          <p className="font-mono">{aiConfig.modelConfig.provider}</p>
                        </div>
                        <div>
                          <Label>Model</Label>
                          <p className="font-mono">{aiConfig.modelConfig.model}</p>
                        </div>
                        <div>
                          <Label>Temperature</Label>
                          <p className="font-mono">{aiConfig.modelConfig.temperature}</p>
                        </div>
                        <div>
                          <Label>Max Tokens</Label>
                          <p className="font-mono">{aiConfig.modelConfig.maxTokens}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        {aiConfig.modelConfig.enableWebSearch && (
                          <Badge variant="outline">Web Search</Badge>
                        )}
                        {aiConfig.modelConfig.maxCitations && (
                          <Badge variant="outline">Citations ({aiConfig.modelConfig.maxCitations})</Badge>
                        )}
                        {aiConfig.modelConfig.reasoningEffort && (
                          <Badge variant="outline">Reasoning ({aiConfig.modelConfig.reasoningEffort})</Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No model configuration available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Web Search</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="web-search">Enabled</Label>
                      <Switch
                        id="web-search"
                        checked={aiFeatures.webSearchEnabled}
                        onCheckedChange={() => handleToggleFlag('ai.features.web-search')}
                      />
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Max Results: {aiConfig.features.maxSearchResults}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">File Search</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="file-search">Enabled</Label>
                      <Switch
                        id="file-search"
                        checked={aiFeatures.fileSearchEnabled}
                        onCheckedChange={() => handleToggleFlag('ai.features.file-search')}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Reasoning Mode</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="reasoning-mode">Enabled</Label>
                      <Switch
                        id="reasoning-mode"
                        checked={aiFeatures.reasoningModeEnabled}
                        onCheckedChange={() => handleToggleFlag('ai.features.reasoning-mode')}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="analytics">Enabled</Label>
                      <Switch
                        id="analytics"
                        checked={aiFeatures.analyticsEnabled}
                        onCheckedChange={() => handleToggleFlag('ai.analytics.enabled')}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="costs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cost Controls</CardTitle>
                </CardHeader>
                <CardContent>
                  {costControls.isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : costControls.costControls ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label>Max Requests/Hour</Label>
                          <p className="font-mono">{costControls.costControls.maxRequestsPerHour}</p>
                        </div>
                        <div>
                          <Label>Max Requests/Day</Label>
                          <p className="font-mono">{costControls.costControls.maxRequestsPerDay}</p>
                        </div>
                        <div>
                          <Label>Max Tokens/Request</Label>
                          <p className="font-mono">{costControls.costControls.maxTokensPerRequest}</p>
                        </div>
                        <div>
                          <Label>Restrict Premium Models</Label>
                          <p className="font-mono">{costControls.costControls.restrictPremiumModels ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                      <div>
                        <Label>Allowed Models</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {costControls.costControls.allowedModels.map(model => (
                            <Badge key={model} variant="outline" className="text-xs">
                              {model}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No cost controls configured</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Alert>
                <BarChart3 className="h-4 w-4" />
                <AlertDescription>
                  Analytics data would be displayed here in a production environment.
                  This includes usage metrics, cost tracking, and performance data.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
