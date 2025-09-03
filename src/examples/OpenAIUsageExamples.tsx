/**
 * OpenAI Integration Usage Examples
 * Comprehensive examples showing how to use the OpenAI service
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  useOpenAI, 
  useStudentAI, 
  useCohortAI, 
  usePaymentAI, 
  useSessionAI 
} from '@/hooks/useOpenAI';
import { openaiService } from '@/services/openai.service';
import { OpenAIModel } from '@/types/openai';

// Example 1: Basic Text Generation
export function BasicTextGenerationExample() {
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [model, setModel] = useState<OpenAIModel>('gpt-4o-mini');
  const [result, setResult] = useState('');
  
  const { state, generateText, clearError } = useOpenAI();

  const handleGenerate = async () => {
    try {
      const response = await generateText(prompt, systemPrompt, model);
      setResult(response);
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Text Generation</CardTitle>
        <CardDescription>Simple text generation with custom system prompt</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Model</label>
          <Select value={model} onValueChange={(value: OpenAIModel) => setModel(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o">GPT-4 Omni</SelectItem>
              <SelectItem value="gpt-4o-mini">GPT-4 Omni Mini</SelectItem>
              <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
              <SelectItem value="gpt-4">GPT-4</SelectItem>
              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">System Prompt</label>
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Enter system prompt..."
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm font-medium">User Prompt</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt..."
            rows={3}
          />
        </div>

        <Button onClick={handleGenerate} disabled={state.isLoading}>
          {state.isLoading ? 'Generating...' : 'Generate Text'}
        </Button>

        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
            <Button variant="outline" size="sm" onClick={clearError} className="mt-2">
              Clear Error
            </Button>
          </Alert>
        )}

        {result && (
          <div>
            <label className="text-sm font-medium">Result</label>
            <div className="p-3 bg-gray-50 rounded-md">
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </div>
          </div>
        )}

        {state.response?.data && (
          <div className="flex gap-2">
            <Badge variant="outline">
              Tokens: {state.response.data.usage.totalTokens}
            </Badge>
            <Badge variant="outline">
              Cost: ${state.response.data.cost.toFixed(4)}
            </Badge>
            <Badge variant="outline">
              Time: {state.response.data.responseTime}ms
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Example 2: JSON Generation
export function JSONGenerationExample() {
  const [prompt, setPrompt] = useState('Generate a student report with performance metrics');
  const [result, setResult] = useState<any>(null);
  
  const { state, generateJson, clearError } = useOpenAI();

  const handleGenerate = async () => {
    try {
      const response = await generateJson(
        prompt,
        'You are an educational AI that generates structured student reports in JSON format.'
      );
      setResult(response);
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>JSON Generation</CardTitle>
        <CardDescription>Generate structured JSON responses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Prompt</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt..."
            rows={3}
          />
        </div>

        <Button onClick={handleGenerate} disabled={state.isLoading}>
          {state.isLoading ? 'Generating...' : 'Generate JSON'}
        </Button>

        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
            <Button variant="outline" size="sm" onClick={clearError} className="mt-2">
              Clear Error
            </Button>
          </Alert>
        )}

        {result && (
          <div>
            <label className="text-sm font-medium">Generated JSON</label>
            <div className="p-3 bg-gray-50 rounded-md">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Example 3: Context-Aware Generation
export function ContextAwareExample() {
  const [prompt, setPrompt] = useState('Analyze this student\'s performance and provide recommendations');
  const [result, setResult] = useState('');
  
  const { state, chatCompletion, clearError } = useOpenAI();

  const handleGenerate = async () => {
    try {
      // Build context with student data
      const context = openaiService.createContextBuilder()
        .addStructured({
          name: 'John Doe',
          email: 'john.doe@example.com',
          cohort: 'LIT OS 2024',
          program: 'Full Stack Development'
        }, 'Student Information')
        .addJson({
          attendance: 85,
          assignments: 12,
          completed: 10,
          averageScore: 78.5
        }, 'Performance Data')
        .addJson({
          totalFees: 50000,
          paid: 30000,
          outstanding: 20000,
          lastPayment: '2024-01-15'
        }, 'Payment Information')
        .build();

      const response = await chatCompletion({
        model: 'gpt-4o-mini',
        systemPrompt: 'You are an educational AI assistant specializing in student performance analysis. Provide detailed insights and actionable recommendations.',
        userPrompt: prompt,
        context,
        temperature: 0.7
      });

      if (response.success && response.data) {
        setResult(response.data.content);
      }
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Context-Aware Generation</CardTitle>
        <CardDescription>Generate responses with structured context data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Analysis Prompt</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your analysis prompt..."
            rows={3}
          />
        </div>

        <Button onClick={handleGenerate} disabled={state.isLoading}>
          {state.isLoading ? 'Analyzing...' : 'Analyze with Context'}
        </Button>

        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
            <Button variant="outline" size="sm" onClick={clearError} className="mt-2">
              Clear Error
            </Button>
          </Alert>
        )}

        {result && (
          <div>
            <label className="text-sm font-medium">Analysis Result</label>
            <div className="p-3 bg-gray-50 rounded-md">
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Example 4: Student AI Analysis
export function StudentAIAnalysisExample() {
  const [analysisPrompt, setAnalysisPrompt] = useState('Analyze this student\'s performance trends and provide improvement recommendations');
  const [result, setResult] = useState('');
  
  const { state, analyzeStudentPerformance, clearError } = useStudentAI();

  const handleAnalyze = async () => {
    try {
      // Mock student data
      const studentData = {
        studentId: 'student-123',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        cohort: 'LIT OS 2024',
        program: 'Data Science',
        attendance: {
          totalSessions: 20,
          attended: 18,
          percentage: 90
        },
        payments: {
          totalFees: 60000,
          paid: 45000,
          outstanding: 15000,
          installments: 3
        },
        performance: {
          averageScore: 85.5,
          assignments: 15,
          completed: 14,
          projects: 3,
          completedProjects: 2
        }
      };

      const response = await analyzeStudentPerformance(studentData, analysisPrompt);
      setResult(response);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student AI Analysis</CardTitle>
        <CardDescription>Specialized student performance analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Analysis Prompt</label>
          <Textarea
            value={analysisPrompt}
            onChange={(e) => setAnalysisPrompt(e.target.value)}
            placeholder="Enter your analysis prompt..."
            rows={3}
          />
        </div>

        <Button onClick={handleAnalyze} disabled={state.isLoading}>
          {state.isLoading ? 'Analyzing...' : 'Analyze Student'}
        </Button>

        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
            <Button variant="outline" size="sm" onClick={clearError} className="mt-2">
              Clear Error
            </Button>
          </Alert>
        )}

        {result && (
          <div>
            <label className="text-sm font-medium">Analysis Result</label>
            <div className="p-3 bg-gray-50 rounded-md">
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Example 5: Batch Processing
export function BatchProcessingExample() {
  const [results, setResults] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { state, chatCompletion, clearError } = useOpenAI();

  const handleBatchProcess = async () => {
    setIsProcessing(true);
    setResults([]);

    try {
      // Create multiple requests
      const requests = [
        {
          model: 'gpt-4o-mini' as OpenAIModel,
          systemPrompt: 'You are a helpful assistant.',
          userPrompt: 'Explain machine learning in simple terms.'
        },
        {
          model: 'gpt-4o-mini' as OpenAIModel,
          systemPrompt: 'You are a helpful assistant.',
          userPrompt: 'What are the benefits of cloud computing?'
        },
        {
          model: 'gpt-4o-mini' as OpenAIModel,
          systemPrompt: 'You are a helpful assistant.',
          userPrompt: 'Describe the importance of data security.'
        }
      ];

      // Process requests sequentially (you could also use batchChatCompletion for parallel processing)
      const responses = [];
      for (const request of requests) {
        const response = await chatCompletion(request);
        responses.push({
          prompt: request.userPrompt,
          result: response.success ? response.data?.content : response.error
        });
      }

      setResults(responses);
    } catch (error) {
      console.error('Batch processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Processing</CardTitle>
        <CardDescription>Process multiple requests sequentially</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleBatchProcess} disabled={isProcessing || state.isLoading}>
          {isProcessing ? 'Processing...' : 'Process Batch'}
        </Button>

        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
            <Button variant="outline" size="sm" onClick={clearError} className="mt-2">
              Clear Error
            </Button>
          </Alert>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <label className="text-sm font-medium">Batch Results</label>
            {results.map((result, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-md">
                <div className="font-medium text-sm mb-2">Prompt {index + 1}:</div>
                <div className="text-sm text-gray-600 mb-2">{result.prompt}</div>
                <div className="text-sm">
                  <strong>Result:</strong>
                  <pre className="whitespace-pre-wrap mt-1">{result.result}</pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main Examples Component
export function OpenAIUsageExamples() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">OpenAI Integration Examples</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive examples showing how to use the OpenAI service in your application
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BasicTextGenerationExample />
        <JSONGenerationExample />
        <ContextAwareExample />
        <StudentAIAnalysisExample />
        <BatchProcessingExample />
      </div>
    </div>
  );
}
