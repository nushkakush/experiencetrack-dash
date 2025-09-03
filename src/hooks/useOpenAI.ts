/**
 * React Hook for OpenAI Integration
 * Provides easy-to-use hooks for OpenAI functionality
 */

import { useState, useCallback, useRef } from 'react';
import { openaiService } from '@/services/openai.service';
import { 
  OpenAIChatRequest, 
  OpenAIChatResponse,
  OpenAIModel,
  ContextData,
  ToolConfig,
  BackgroundTaskStatus
} from '@/types/openai';
import { Logger } from '@/lib/logging/Logger';

// Hook state interface
interface UseOpenAIState {
  isLoading: boolean;
  error: string | null;
  response: OpenAIChatResponse | null;
  isStreaming: boolean;
}

// Hook return interface
interface UseOpenAI {
  state: UseOpenAIState;
  chatCompletion: (request: OpenAIChatRequest) => Promise<OpenAIChatResponse>;
  generateText: (prompt: string, systemPrompt?: string, model?: OpenAIModel) => Promise<string>;
  generateJson: <T = any>(prompt: string, systemPrompt?: string, model?: OpenAIModel) => Promise<T>;
  // New Responses API methods
  generateWithWebSearch: (prompt: string, systemPrompt?: string, model?: OpenAIModel, searchConfig?: any) => Promise<OpenAIChatResponse>;
  generateWithFileSearch: (prompt: string, systemPrompt?: string, model?: OpenAIModel, fileConfig?: any) => Promise<OpenAIChatResponse>;
  generateWithComputerUse: (prompt: string, systemPrompt?: string, model?: OpenAIModel, computerConfig?: any) => Promise<OpenAIChatResponse>;
  generateWithReasoning: (prompt: string, systemPrompt?: string, model?: OpenAIModel) => Promise<OpenAIChatResponse>;
  generateInBackground: (prompt: string, systemPrompt?: string, model?: OpenAIModel, timeout?: number) => Promise<OpenAIChatResponse>;
  getBackgroundTaskStatus: (taskId: string) => Promise<BackgroundTaskStatus>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Main OpenAI hook
 */
export function useOpenAI(): UseOpenAI {
  const [state, setState] = useState<UseOpenAIState>({
    isLoading: false,
    error: null,
    response: null,
    isStreaming: false
  });

  const logger = Logger.getInstance();
  const abortControllerRef = useRef<AbortController | null>(null);

  const chatCompletion = useCallback(async (request: OpenAIChatRequest): Promise<OpenAIChatResponse> => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      isStreaming: request.stream || false
    }));

    try {
      logger.info('Starting OpenAI chat completion', { 
        model: request.model,
        hasContext: !!request.context?.length 
      });

      const response = await openaiService.chatCompletion(request);

      setState(prev => ({
        ...prev,
        isLoading: false,
        response,
        isStreaming: false
      }));

      logger.info('OpenAI chat completion completed', { 
        success: response.success,
        tokens: response.data?.usage.totalTokens,
        cost: response.data?.cost
      });

      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isStreaming: false
      }));

      logger.error('OpenAI chat completion failed', { 
        error: errorMessage,
        model: request.model
      });

      throw error;
    }
  }, [logger]);

  const generateText = useCallback(async (
    prompt: string, 
    systemPrompt?: string, 
    model: OpenAIModel = 'gpt-4o-mini'
  ): Promise<string> => {
    const response = await chatCompletion({
      model,
      systemPrompt: systemPrompt || 'You are a helpful assistant.',
      userPrompt: prompt
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to generate text');
    }

    return response.data.content;
  }, [chatCompletion]);

  const generateJson = useCallback(async <T = any>(
    prompt: string, 
    systemPrompt?: string, 
    model: OpenAIModel = 'gpt-4o-mini'
  ): Promise<T> => {
    const response = await chatCompletion({
      model,
      systemPrompt: systemPrompt || 'You are a helpful assistant that responds with valid JSON.',
      userPrompt: prompt,
      responseFormat: 'json_object'
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to generate JSON');
    }

    try {
      return JSON.parse(response.data.content) as T;
    } catch (error) {
      throw new Error('Failed to parse JSON response');
    }
  }, [chatCompletion]);

  // New Responses API methods
  const generateWithWebSearch = useCallback(async (
    prompt: string,
    systemPrompt?: string,
    model: OpenAIModel = 'gpt-4o-mini',
    searchConfig?: any
  ): Promise<OpenAIChatResponse> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await openaiService.generateWithWebSearch(
        prompt,
        systemPrompt,
        model,
        searchConfig
      );
      
      setState(prev => ({ ...prev, isLoading: false, response }));
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const generateWithFileSearch = useCallback(async (
    prompt: string,
    systemPrompt?: string,
    model: OpenAIModel = 'gpt-4o-mini',
    fileConfig?: any
  ): Promise<OpenAIChatResponse> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await openaiService.generateWithFileSearch(
        prompt,
        systemPrompt,
        model,
        fileConfig
      );
      
      setState(prev => ({ ...prev, isLoading: false, response }));
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const generateWithComputerUse = useCallback(async (
    prompt: string,
    systemPrompt?: string,
    model: OpenAIModel = 'gpt-4o-mini',
    computerConfig?: any
  ): Promise<OpenAIChatResponse> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await openaiService.generateWithComputerUse(
        prompt,
        systemPrompt,
        model,
        computerConfig
      );
      
      setState(prev => ({ ...prev, isLoading: false, response }));
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const generateWithReasoning = useCallback(async (
    prompt: string,
    systemPrompt?: string,
    model: OpenAIModel = 'gpt-4o-mini'
  ): Promise<OpenAIChatResponse> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await openaiService.generateWithReasoning(
        prompt,
        systemPrompt,
        model
      );
      
      setState(prev => ({ ...prev, isLoading: false, response }));
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const generateInBackground = useCallback(async (
    prompt: string,
    systemPrompt?: string,
    model: OpenAIModel = 'gpt-4o-mini',
    timeout?: number
  ): Promise<OpenAIChatResponse> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await openaiService.generateInBackground(
        prompt,
        systemPrompt,
        model,
        timeout
      );
      
      setState(prev => ({ ...prev, isLoading: false, response }));
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const getBackgroundTaskStatus = useCallback(async (taskId: string): Promise<BackgroundTaskStatus> => {
    try {
      return await openaiService.getBackgroundTaskStatus(taskId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({
      isLoading: false,
      error: null,
      response: null,
      isStreaming: false
    });
  }, []);

  return {
    state,
    chatCompletion,
    generateText,
    generateJson,
    generateWithWebSearch,
    generateWithFileSearch,
    generateWithComputerUse,
    generateWithReasoning,
    generateInBackground,
    getBackgroundTaskStatus,
    clearError,
    reset
  };
}

// Specialized hooks for common use cases

/**
 * Hook for student-related AI operations
 */
export function useStudentAI() {
  const { state, chatCompletion, generateText, generateJson, clearError, reset } = useOpenAI();

  const analyzeStudentPerformance = useCallback(async (
    studentData: any,
    prompt: string
  ): Promise<string> => {
    const context = openaiService.buildStudentContext(studentData);
    
    return generateText(
      prompt,
      `You are an educational AI assistant specializing in student performance analysis. 
       You have access to comprehensive student data including attendance, payments, and performance metrics.
       Provide insightful, actionable analysis based on the data provided.`,
      'gpt-4o-mini'
    );
  }, [generateText]);

  const generateStudentReport = useCallback(async (
    studentData: any,
    reportType: 'performance' | 'attendance' | 'payment' | 'comprehensive'
  ): Promise<any> => {
    const context = openaiService.buildStudentContext(studentData);
    
    const systemPrompt = `You are an educational AI assistant that generates detailed student reports.
       Generate a comprehensive ${reportType} report in JSON format with the following structure:
       {
         "summary": "Brief overview",
         "keyMetrics": {},
         "recommendations": [],
         "trends": [],
         "actionItems": []
       }`;

    return generateJson(systemPrompt, `Generate a ${reportType} report for this student.`);
  }, [generateJson]);

  return {
    state,
    analyzeStudentPerformance,
    generateStudentReport,
    clearError,
    reset
  };
}

/**
 * Hook for cohort-related AI operations
 */
export function useCohortAI() {
  const { state, generateText, generateJson, clearError, reset } = useOpenAI();

  const analyzeCohortPerformance = useCallback(async (
    cohortData: any,
    prompt: string
  ): Promise<string> => {
    return generateText(
      prompt,
      `You are an educational AI assistant specializing in cohort performance analysis.
       Analyze cohort data including student performance, attendance patterns, and engagement metrics.
       Provide insights and recommendations for cohort improvement.`,
      'gpt-4o-mini'
    );
  }, [generateText]);

  const generateCohortInsights = useCallback(async (
    cohortData: any
  ): Promise<any> => {
    const systemPrompt = `You are an educational AI assistant that generates cohort insights.
       Generate insights in JSON format with the following structure:
       {
         "overallPerformance": "summary",
         "topPerformers": [],
         "atRiskStudents": [],
         "recommendations": [],
         "engagementMetrics": {},
         "trends": []
       }`;

    return generateJson(
      `Analyze this cohort data and generate comprehensive insights.`,
      systemPrompt
    );
  }, [generateJson]);

  return {
    state,
    analyzeCohortPerformance,
    generateCohortInsights,
    clearError,
    reset
  };
}

/**
 * Hook for payment-related AI operations
 */
export function usePaymentAI() {
  const { state, generateText, generateJson, clearError, reset } = useOpenAI();

  const analyzePaymentPatterns = useCallback(async (
    paymentData: any,
    prompt: string
  ): Promise<string> => {
    return generateText(
      prompt,
      `You are a financial AI assistant specializing in educational payment analysis.
       Analyze payment patterns, identify trends, and provide insights for better payment management.
       Focus on payment timeliness, outstanding amounts, and collection strategies.`,
      'gpt-4o-mini'
    );
  }, [generateText]);

  const generatePaymentRecommendations = useCallback(async (
    paymentData: any
  ): Promise<any> => {
    const systemPrompt = `You are a financial AI assistant that generates payment recommendations.
       Generate recommendations in JSON format with the following structure:
       {
         "collectionStrategy": "recommended approach",
         "atRiskAccounts": [],
         "paymentTrends": {},
         "recommendations": [],
         "forecasting": {}
       }`;

    return generateJson(
      `Analyze this payment data and generate recommendations for better collection.`,
      systemPrompt
    );
  }, [generateJson]);

  return {
    state,
    analyzePaymentPatterns,
    generatePaymentRecommendations,
    clearError,
    reset
  };
}

/**
 * Hook for session-related AI operations
 */
export function useSessionAI() {
  const { state, generateText, generateJson, clearError, reset } = useOpenAI();

  const analyzeSessionEffectiveness = useCallback(async (
    sessionData: any,
    prompt: string
  ): Promise<string> => {
    return generateText(
      prompt,
      `You are an educational AI assistant specializing in session analysis.
       Analyze session data including attendance, engagement, and content effectiveness.
       Provide insights for improving session quality and student engagement.`,
      'gpt-4o-mini'
    );
  }, [generateText]);

  const generateSessionInsights = useCallback(async (
    sessionData: any
  ): Promise<any> => {
    const systemPrompt = `You are an educational AI assistant that generates session insights.
       Generate insights in JSON format with the following structure:
       {
         "attendanceAnalysis": "summary",
         "engagementMetrics": {},
         "contentEffectiveness": "assessment",
         "improvementAreas": [],
         "recommendations": []
       }`;

    return generateJson(
      `Analyze this session data and generate insights for improvement.`,
      systemPrompt
    );
  }, [generateJson]);

  return {
    state,
    analyzeSessionEffectiveness,
    generateSessionInsights,
    clearError,
    reset
  };
}

/**
 * Hook for web search-enabled AI operations
 */
export function useWebSearchAI() {
  const { 
    state, 
    generateWithWebSearch, 
    generateWithReasoning, 
    clearError, 
    reset 
  } = useOpenAI();

  const searchAndAnalyze = useCallback(async (
    query: string,
    analysisPrompt?: string,
    model: OpenAIModel = 'gpt-4o-mini'
  ): Promise<OpenAIChatResponse> => {
    const systemPrompt = `You are a research AI assistant with access to web search.
       Search for current information about the topic and provide a comprehensive analysis.
       Always cite your sources and provide up-to-date information.`;

    const userPrompt = analysisPrompt 
      ? `${query}\n\nPlease analyze this topic and provide insights: ${analysisPrompt}`
      : `Research and analyze: ${query}`;

    return generateWithWebSearch(userPrompt, systemPrompt, model, {
      maxResults: 10,
      includeImages: false
    });
  }, [generateWithWebSearch]);

  const getCurrentInformation = useCallback(async (
    topic: string,
    model: OpenAIModel = 'gpt-4o-mini'
  ): Promise<OpenAIChatResponse> => {
    const systemPrompt = `You are an AI assistant that provides current, factual information.
       Use web search to find the most up-to-date information about the topic.
       Focus on recent developments, current status, and latest news.`;

    return generateWithWebSearch(
      `Get the latest information about: ${topic}`,
      systemPrompt,
      model,
      { maxResults: 5 }
    );
  }, [generateWithWebSearch]);

  const researchWithReasoning = useCallback(async (
    researchQuestion: string,
    model: OpenAIModel = 'gpt-4o-mini'
  ): Promise<OpenAIChatResponse> => {
    const systemPrompt = `You are a research AI assistant that thinks through complex questions step by step.
       Use web search to gather information and then reason through the problem systematically.
       Show your thinking process and provide well-reasoned conclusions.`;

    return generateWithReasoning(
      `Research and analyze: ${researchQuestion}`,
      systemPrompt,
      model
    );
  }, [generateWithReasoning]);

  return {
    state,
    searchAndAnalyze,
    getCurrentInformation,
    researchWithReasoning,
    clearError,
    reset
  };
}
