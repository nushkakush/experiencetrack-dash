import React, { useState } from 'react';
import { useOpenAI, useWebSearchAI } from '@/hooks/useOpenAI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Brain, Clock, FileText, Monitor } from 'lucide-react';

/**
 * Test component for OpenAI Responses API features
 */
export function OpenAIResponsesTestComponent() {
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Basic OpenAI hook
  const {
    state: basicState,
    generateText,
    generateWithWebSearch,
    generateWithFileSearch,
    generateWithComputerUse,
    generateWithReasoning,
    generateInBackground,
    clearError,
    reset,
  } = useOpenAI();

  // Web search specialized hook
  const {
    state: webSearchState,
    searchAndAnalyze,
    getCurrentInformation,
    researchWithReasoning,
    clearError: clearWebSearchError,
    reset: resetWebSearch,
  } = useWebSearchAI();

  const handleBasicGeneration = async () => {
    try {
      await generateText(prompt, systemPrompt);
    } catch (error) {
      console.error('Basic generation failed:', error);
    }
  };

  const handleWebSearch = async () => {
    try {
      await generateWithWebSearch(
        prompt,
        systemPrompt || 'You are a helpful assistant with web search access.',
        'gpt-4o-mini',
        { maxResults: 5 }
      );
    } catch (error) {
      console.error('Web search failed:', error);
    }
  };

  const handleFileSearch = async () => {
    try {
      await generateWithFileSearch(
        prompt,
        systemPrompt || 'You are a helpful assistant with file search access.',
        'gpt-4o-mini',
        { maxFiles: 10 }
      );
    } catch (error) {
      console.error('File search failed:', error);
    }
  };

  const handleComputerUse = async () => {
    try {
      await generateWithComputerUse(
        prompt,
        systemPrompt || 'You are a helpful assistant with computer access.',
        'gpt-4o-mini',
        { allowScreenshots: true, allowFileOperations: true }
      );
    } catch (error) {
      console.error('Computer use failed:', error);
    }
  };

  const handleReasoning = async () => {
    try {
      await generateWithReasoning(
        prompt,
        systemPrompt || 'You are a helpful assistant that thinks step by step.'
      );
    } catch (error) {
      console.error('Reasoning failed:', error);
    }
  };

  const handleBackground = async () => {
    try {
      await generateInBackground(
        prompt,
        systemPrompt || 'You are a helpful assistant.',
        'gpt-4o-mini',
        300 // 5 minutes
      );
    } catch (error) {
      console.error('Background generation failed:', error);
    }
  };

  const handleWebSearchQuery = async () => {
    try {
      await searchAndAnalyze(
        searchQuery,
        'Provide a comprehensive analysis with current information.'
      );
    } catch (error) {
      console.error('Web search query failed:', error);
    }
  };

  const handleCurrentInfo = async () => {
    try {
      await getCurrentInformation(searchQuery);
    } catch (error) {
      console.error('Current info failed:', error);
    }
  };

  const handleResearchWithReasoning = async () => {
    try {
      await researchWithReasoning(searchQuery);
    } catch (error) {
      console.error('Research with reasoning failed:', error);
    }
  };

  const renderResponse = (state: any, title: string) => (
    <Card className='mt-4'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          {title}
          {state.isLoading && <Loader2 className='h-4 w-4 animate-spin' />}
        </CardTitle>
        {state.error && (
          <Badge variant='destructive' className='w-fit'>
            Error: {state.error}
          </Badge>
        )}
      </CardHeader>
      {state.response && (
        <CardContent>
          <div className='space-y-4'>
            <div>
              <h4 className='font-semibold'>Response:</h4>
              <p className='text-sm text-muted-foreground whitespace-pre-wrap'>
                {state.response.data?.content}
              </p>
            </div>

            {state.response.data?.toolsUsed &&
              state.response.data.toolsUsed.length > 0 && (
                <div>
                  <h4 className='font-semibold'>Tools Used:</h4>
                  <div className='flex flex-wrap gap-2'>
                    {state.response.data.toolsUsed.map(
                      (tool: any, index: number) => (
                        <Badge
                          key={index}
                          variant={tool.success ? 'default' : 'destructive'}
                        >
                          {tool.tool} {tool.success ? '✓' : '✗'}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}

            {state.response.data?.reasoningSummary && (
              <div>
                <h4 className='font-semibold'>Reasoning Summary:</h4>
                <p className='text-sm text-muted-foreground'>
                  {state.response.data.reasoningSummary.summary}
                </p>
                <div className='mt-2'>
                  <h5 className='font-medium'>Key Steps:</h5>
                  <ul className='text-sm text-muted-foreground list-disc list-inside'>
                    {state.response.data.reasoningSummary.keySteps.map(
                      (step: string, index: number) => (
                        <li key={index}>{step}</li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            )}

            {state.response.data?.backgroundTaskId && (
              <div>
                <h4 className='font-semibold'>Background Task:</h4>
                <Badge variant='outline'>
                  Task ID: {state.response.data.backgroundTaskId}
                </Badge>
              </div>
            )}

            <div className='text-xs text-muted-foreground'>
              <p>Model: {state.response.data?.model}</p>
              <p>Tokens: {state.response.data?.usage?.totalTokens}</p>
              <p>Cost: ₹{state.response.data?.cost?.toFixed(4)}</p>
              <p>Response Time: {state.response.data?.responseTime}ms</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );

  return (
    <div className='container mx-auto p-6 max-w-6xl'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold mb-2'>OpenAI Responses API Test</h1>
        <p className='text-muted-foreground'>
          Test the new OpenAI Responses API with built-in tools and advanced
          features.
        </p>
      </div>

      <Tabs defaultValue='basic' className='w-full'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='basic'>Basic Features</TabsTrigger>
          <TabsTrigger value='tools'>Built-in Tools</TabsTrigger>
          <TabsTrigger value='web-search'>Web Search</TabsTrigger>
        </TabsList>

        <TabsContent value='basic' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Basic Generation</CardTitle>
              <CardDescription>
                Test basic text generation with the Responses API
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <label className='text-sm font-medium'>
                  System Prompt (optional)
                </label>
                <Textarea
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  placeholder='You are a helpful assistant...'
                  className='mt-1'
                />
              </div>
              <div>
                <label className='text-sm font-medium'>User Prompt</label>
                <Textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder='What would you like to generate?'
                  className='mt-1'
                />
              </div>
              <div className='flex gap-2'>
                <Button
                  onClick={handleBasicGeneration}
                  disabled={basicState.isLoading || !prompt}
                >
                  {basicState.isLoading && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  Generate Text
                </Button>
                <Button
                  onClick={handleReasoning}
                  disabled={basicState.isLoading || !prompt}
                  variant='outline'
                >
                  <Brain className='mr-2 h-4 w-4' />
                  With Reasoning
                </Button>
                <Button
                  onClick={handleBackground}
                  disabled={basicState.isLoading || !prompt}
                  variant='outline'
                >
                  <Clock className='mr-2 h-4 w-4' />
                  Background Mode
                </Button>
                <Button onClick={clearError} variant='ghost' size='sm'>
                  Clear Error
                </Button>
              </div>
            </CardContent>
          </Card>

          {renderResponse(basicState, 'Basic Generation Response')}
        </TabsContent>

        <TabsContent value='tools' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Built-in Tools</CardTitle>
              <CardDescription>
                Test the built-in tools: Web Search, File Search, and Computer
                Use
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <label className='text-sm font-medium'>
                  System Prompt (optional)
                </label>
                <Textarea
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  placeholder='You are a helpful assistant with tool access...'
                  className='mt-1'
                />
              </div>
              <div>
                <label className='text-sm font-medium'>User Prompt</label>
                <Textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder='What would you like to do with the tools?'
                  className='mt-1'
                />
              </div>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
                <Button
                  onClick={handleWebSearch}
                  disabled={basicState.isLoading || !prompt}
                >
                  <Search className='mr-2 h-4 w-4' />
                  Web Search
                </Button>
                <Button
                  onClick={handleFileSearch}
                  disabled={basicState.isLoading || !prompt}
                  variant='outline'
                >
                  <FileText className='mr-2 h-4 w-4' />
                  File Search
                </Button>
                <Button
                  onClick={handleComputerUse}
                  disabled={basicState.isLoading || !prompt}
                  variant='outline'
                >
                  <Monitor className='mr-2 h-4 w-4' />
                  Computer Use
                </Button>
              </div>
            </CardContent>
          </Card>

          {renderResponse(basicState, 'Tools Response')}
        </TabsContent>

        <TabsContent value='web-search' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Web Search Specialized</CardTitle>
              <CardDescription>
                Test specialized web search functionality with research
                capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <label className='text-sm font-medium'>Search Query</label>
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder='What would you like to research?'
                  className='mt-1'
                />
              </div>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
                <Button
                  onClick={handleWebSearchQuery}
                  disabled={webSearchState.isLoading || !searchQuery}
                >
                  <Search className='mr-2 h-4 w-4' />
                  Search & Analyze
                </Button>
                <Button
                  onClick={handleCurrentInfo}
                  disabled={webSearchState.isLoading || !searchQuery}
                  variant='outline'
                >
                  Get Current Info
                </Button>
                <Button
                  onClick={handleResearchWithReasoning}
                  disabled={webSearchState.isLoading || !searchQuery}
                  variant='outline'
                >
                  <Brain className='mr-2 h-4 w-4' />
                  Research + Reasoning
                </Button>
              </div>
            </CardContent>
          </Card>

          {renderResponse(webSearchState, 'Web Search Response')}
        </TabsContent>
      </Tabs>

      <div className='mt-8 p-4 bg-muted rounded-lg'>
        <h3 className='font-semibold mb-2'>New Features Available:</h3>
        <ul className='text-sm text-muted-foreground space-y-1'>
          <li>
            • <strong>Web Search:</strong> Access to real-time web information
          </li>
          <li>
            • <strong>File Search:</strong> Search and analyze documents
          </li>
          <li>
            • <strong>Computer Use:</strong> Interact with applications and
            perform tasks
          </li>
          <li>
            • <strong>Reasoning Summary:</strong> Get insights into AI's
            thinking process
          </li>
          <li>
            • <strong>Background Mode:</strong> Handle long-running tasks
            asynchronously
          </li>
          <li>
            • <strong>Stateful Interactions:</strong> Maintain conversation
            context
          </li>
        </ul>
      </div>
    </div>
  );
}
