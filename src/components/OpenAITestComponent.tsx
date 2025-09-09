/**
 * OpenAI Test Component
 * Simple component to test the OpenAI integration
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useOpenAI } from '@/hooks/useOpenAI';
import { OpenAIResponsesTestComponent } from './OpenAIResponsesTestComponent';

export function OpenAITestComponent() {
  const [prompt, setPrompt] = useState('Hello, how are you?');
  const [result, setResult] = useState('');
  const [showResponsesAPI, setShowResponsesAPI] = useState(false);
  const { state, generateText, clearError } = useOpenAI();

  const handleTest = async () => {
    try {
      setResult('');
      const response = await generateText(
        prompt,
        'You are a helpful assistant. Keep your responses concise and friendly.'
      );
      setResult(response);
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  if (showResponsesAPI) {
    return (
      <div>
        <Button
          onClick={() => setShowResponsesAPI(false)}
          variant='outline'
          className='mb-4'
        >
          ← Back to Basic Test
        </Button>
        <OpenAIResponsesTestComponent />
      </div>
    );
  }

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle>OpenAI Integration Test</CardTitle>
        <CardDescription>
          Test the OpenAI integration with a simple prompt
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div>
          <label className='text-sm font-medium mb-2 block'>Test Prompt</label>
          <Textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder='Enter your test prompt...'
            rows={3}
          />
        </div>

        <div className='flex gap-2'>
          <Button
            onClick={handleTest}
            disabled={state.isLoading}
            className='flex-1'
          >
            {state.isLoading ? 'Testing...' : 'Test OpenAI Integration'}
          </Button>
          <Button
            onClick={() => setShowResponsesAPI(true)}
            variant='outline'
            disabled={state.isLoading}
          >
            Test Responses API
          </Button>
        </div>

        {state.error && (
          <Alert variant='destructive'>
            <AlertDescription>
              {state.error}
              <Button
                variant='outline'
                size='sm'
                onClick={clearError}
                className='ml-2'
              >
                Clear
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <div>
            <label className='text-sm font-medium mb-2 block'>
              AI Response
            </label>
            <div className='p-3 bg-gray-50 rounded-md border'>
              <p className='text-sm whitespace-pre-wrap'>{result}</p>
            </div>
          </div>
        )}

        {state.response?.data && (
          <div className='flex gap-2 flex-wrap'>
            <Badge variant='outline'>Model: {state.response.data.model}</Badge>
            <Badge variant='outline'>
              Tokens: {state.response.data.usage.totalTokens}
            </Badge>
            <Badge variant='outline'>
              Cost: ₹{state.response.data.cost.toFixed(4)}
            </Badge>
            <Badge variant='outline'>
              Time: {state.response.data.responseTime}ms
            </Badge>
          </div>
        )}

        {state.isLoading && (
          <div className='text-center py-4'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
            <p className='text-sm text-gray-600 mt-2'>Generating response...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
