/**
 * OpenAI Service
 * Client-side service for interacting with OpenAI Edge Function
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  OpenAIChatRequest, 
  OpenAIChatResponse, 
  ContextData, 
  ContextBuilder,
  OpenAIModel,
  ResponseFormat,
  OpenAIError,
  BatchOpenAIRequest,
  BatchOpenAIResponse,
  OpenAIServiceConfig,
  StudentContext,
  CohortContext,
  PaymentContext,
  SessionContext,
  ToolConfig,
  BuiltInTool,
  BackgroundMode,
  WebSearchRequest,
  FileSearchRequest,
  ComputerUseRequest,
  BackgroundTaskStatus
} from '@/types/openai';
import { Logger } from '@/lib/logging/Logger';

// Default configuration
const DEFAULT_CONFIG: OpenAIServiceConfig = {
  defaultModel: 'gpt-4o-mini',
  defaultTemperature: 0.7,
  defaultMaxTokens: 4000,
  enableLogging: true,
  retryAttempts: 3,
  retryDelay: 1000,
  // New Responses API defaults
  defaultTools: [
    { type: 'web_search', enabled: true },
    { type: 'file_search', enabled: false },
    { type: 'computer_use', enabled: false }
  ],
  enableWebSearch: true,
  enableFileSearch: false,
  enableComputerUse: false,
  defaultBackgroundMode: false,
  defaultReasoningSummary: false
};

// Context Builder Implementation
class ContextBuilderImpl implements ContextBuilder {
  private contexts: ContextData[] = [];

  addText(content: string, description?: string, metadata?: Record<string, any>): ContextBuilder {
    this.contexts.push({
      type: 'text',
      content,
      description,
      metadata
    });
    return this;
  }

  addJson(data: any, description?: string, metadata?: Record<string, any>): ContextBuilder {
    this.contexts.push({
      type: 'json',
      content: JSON.stringify(data, null, 2),
      description,
      metadata
    });
    return this;
  }

  addCsv(content: string, description?: string, metadata?: Record<string, any>): ContextBuilder {
    this.contexts.push({
      type: 'csv',
      content,
      description,
      metadata
    });
    return this;
  }

  addTable(content: string, description?: string, metadata?: Record<string, any>): ContextBuilder {
    this.contexts.push({
      type: 'table',
      content,
      description,
      metadata
    });
    return this;
  }

  addStructured(data: any, description?: string, metadata?: Record<string, any>): ContextBuilder {
    this.contexts.push({
      type: 'structured',
      content: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      description,
      metadata
    });
    return this;
  }

  build(): ContextData[] {
    return [...this.contexts];
  }

  clear(): ContextBuilder {
    this.contexts = [];
    return this;
  }
}

// Main OpenAI Service Class
export class OpenAIService {
  private config: OpenAIServiceConfig;
  private logger: Logger;

  constructor(config: Partial<OpenAIServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = Logger.getInstance();
  }

  /**
   * Create a new context builder
   */
  createContextBuilder(): ContextBuilder {
    return new ContextBuilderImpl();
  }

  /**
   * Make a single OpenAI chat completion request
   */
  async chatCompletion(request: OpenAIChatRequest): Promise<OpenAIChatResponse> {
    const startTime = Date.now();
    
    try {
      // Validate request
      this.validateRequest(request);

      // Add default values
      const fullRequest: OpenAIChatRequest = {
        ...request,
        temperature: request.temperature ?? this.config.defaultTemperature,
        maxTokens: request.maxTokens ?? this.config.defaultMaxTokens,
        model: request.model ?? this.config.defaultModel
      };

      this.logger.info('Making OpenAI request', { 
        model: fullRequest.model,
        contextCount: fullRequest.context?.length || 0,
        hasSystemPrompt: !!fullRequest.systemPrompt,
        hasUserPrompt: !!fullRequest.userPrompt
      });

      // Make request to Responses API Edge Function
      const { data, error } = await supabase.functions.invoke('openai-responses', {
        body: fullRequest
      });

      if (error) {
        throw new OpenAIError(
          `Edge Function error: ${error.message}`,
          'EDGE_FUNCTION_ERROR',
          500,
          error
        );
      }

      const response = data as OpenAIChatResponse;
      
      if (!response.success) {
        // Provide user-friendly error messages based on error type
        let errorCode = 'OPENAI_ERROR';
        let statusCode = 400;
        
        if (response.errorType) {
          switch (response.errorType) {
            case 'quota_exceeded':
              errorCode = 'QUOTA_EXCEEDED';
              statusCode = 429;
              break;
            case 'rate_limit':
              errorCode = 'RATE_LIMIT_EXCEEDED';
              statusCode = 429;
              break;
            case 'auth_error':
              errorCode = 'AUTHENTICATION_ERROR';
              statusCode = 401;
              break;
            case 'model_error':
              errorCode = 'MODEL_ERROR';
              statusCode = 400;
              break;
            case 'content_length_error':
              errorCode = 'CONTENT_TOO_LONG';
              statusCode = 400;
              break;
          }
        }
        
        throw new OpenAIError(
          response.error || 'Unknown error occurred',
          errorCode,
          statusCode,
          response
        );
      }

      const responseTime = Date.now() - startTime;
      this.logger.info('OpenAI request completed', { 
        responseTime,
        tokens: response.data?.usage.totalTokens,
        cost: response.data?.cost
      });

      return response;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('OpenAI request failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        request: {
          model: request.model,
          contextCount: request.context?.length || 0
        }
      });

      if (error instanceof OpenAIError) {
        throw error;
      }

      throw new OpenAIError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'SERVICE_ERROR',
        500,
        error
      );
    }
  }

  /**
   * Make multiple requests in batch
   */
  async batchChatCompletion(batchRequest: BatchOpenAIRequest): Promise<BatchOpenAIResponse> {
    const { requests, concurrency = 3, onProgress } = batchRequest;
    const responses: OpenAIChatResponse[] = [];
    let completed = 0;

    this.logger.info('Starting batch OpenAI requests', { 
      totalRequests: requests.length,
      concurrency 
    });

    // Process requests in batches
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (request) => {
        try {
          const response = await this.chatCompletion(request);
          completed++;
          onProgress?.(completed, requests.length);
          return response;
        } catch (error) {
          completed++;
          onProgress?.(completed, requests.length);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          } as OpenAIChatResponse;
        }
      });

      const batchResponses = await Promise.all(batchPromises);
      responses.push(...batchResponses);
    }

    // Calculate summary statistics
    const successfulRequests = responses.filter(r => r.success).length;
    const failedRequests = responses.length - successfulRequests;
    const totalCost = responses.reduce((sum, r) => sum + (r.data?.cost || 0), 0);
    const totalTokens = responses.reduce((sum, r) => sum + (r.data?.usage.totalTokens || 0), 0);
    const averageResponseTime = responses.reduce((sum, r) => sum + (r.data?.responseTime || 0), 0) / responses.length;

    this.logger.info('Batch OpenAI requests completed', {
      totalRequests: requests.length,
      successfulRequests,
      failedRequests,
      totalCost,
      totalTokens,
      averageResponseTime
    });

    return {
      responses,
      totalRequests: requests.length,
      successfulRequests,
      failedRequests,
      totalCost,
      totalTokens,
      averageResponseTime
    };
  }

  /**
   * Convenience method for simple text generation
   */
  async generateText(
    prompt: string,
    systemPrompt?: string,
    model: OpenAIModel = this.config.defaultModel,
    options?: Partial<OpenAIChatRequest>
  ): Promise<string> {
    const response = await this.chatCompletion({
      model,
      systemPrompt: systemPrompt || 'You are a helpful assistant.',
      userPrompt: prompt,
      ...options
    });

    if (!response.success || !response.data) {
      throw new OpenAIError(response.error || 'Failed to generate text');
    }

    return response.data.content;
  }

  /**
   * Convenience method for JSON generation
   */
  async generateJson<T = any>(
    prompt: string,
    systemPrompt?: string,
    model: OpenAIModel = this.config.defaultModel,
    options?: Partial<OpenAIChatRequest>
  ): Promise<T> {
    const response = await this.chatCompletion({
      model,
      systemPrompt: systemPrompt || 'You are a helpful assistant that responds with valid JSON.',
      userPrompt: prompt,
      responseFormat: 'json_object',
      ...options
    });

    if (!response.success || !response.data) {
      throw new OpenAIError(response.error || 'Failed to generate JSON');
    }

    try {
      return JSON.parse(response.data.content) as T;
    } catch (error) {
      throw new OpenAIError('Failed to parse JSON response', 'JSON_PARSE_ERROR', 400, error);
    }
  }

  /**
   * Generate text with web search capability
   */
  async generateWithWebSearch(
    prompt: string,
    systemPrompt?: string,
    model: OpenAIModel = this.config.defaultModel,
    searchConfig?: WebSearchRequest['searchConfig'],
    options?: Partial<OpenAIChatRequest>
  ): Promise<OpenAIChatResponse> {
    const tools: ToolConfig[] = [
      { type: 'web_search', enabled: true, config: searchConfig }
    ];

    return this.chatCompletion({
      model,
      systemPrompt: systemPrompt || 'You are a helpful assistant with access to web search. Use web search when you need current information or to verify facts.',
      userPrompt: prompt,
      tools,
      ...options
    });
  }

  /**
   * Generate text with file search capability
   */
  async generateWithFileSearch(
    prompt: string,
    systemPrompt?: string,
    model: OpenAIModel = this.config.defaultModel,
    fileConfig?: FileSearchRequest['fileConfig'],
    options?: Partial<OpenAIChatRequest>
  ): Promise<OpenAIChatResponse> {
    const tools: ToolConfig[] = [
      { type: 'file_search', enabled: true, config: fileConfig }
    ];

    return this.chatCompletion({
      model,
      systemPrompt: systemPrompt || 'You are a helpful assistant with access to file search. Use file search to find and analyze relevant documents.',
      userPrompt: prompt,
      tools,
      ...options
    });
  }

  /**
   * Generate text with computer use capability
   */
  async generateWithComputerUse(
    prompt: string,
    systemPrompt?: string,
    model: OpenAIModel = this.config.defaultModel,
    computerConfig?: ComputerUseRequest['computerConfig'],
    options?: Partial<OpenAIChatRequest>
  ): Promise<OpenAIChatResponse> {
    const tools: ToolConfig[] = [
      { type: 'computer_use', enabled: true, config: computerConfig }
    ];

    return this.chatCompletion({
      model,
      systemPrompt: systemPrompt || 'You are a helpful assistant with computer access. Use computer tools when you need to interact with applications, browse the web, or perform file operations.',
      userPrompt: prompt,
      tools,
      ...options
    });
  }

  /**
   * Generate text with reasoning summary
   */
  async generateWithReasoning(
    prompt: string,
    systemPrompt?: string,
    model: OpenAIModel = 'o1-preview', // Use GPT-5 for reasoning
    options?: Partial<OpenAIChatRequest>
  ): Promise<OpenAIChatResponse> {
    return this.chatCompletion({
      model,
      systemPrompt: systemPrompt || 'You are a helpful assistant. Think through problems step by step.',
      userPrompt: prompt,
      enableReasoningSummary: true,
      ...options
    });
  }

  /**
   * Generate text in background mode for long-running tasks
   */
  async generateInBackground(
    prompt: string,
    systemPrompt?: string,
    model: OpenAIModel = this.config.defaultModel,
    timeout?: number,
    options?: Partial<OpenAIChatRequest>
  ): Promise<OpenAIChatResponse> {
    const backgroundMode: BackgroundMode = {
      enabled: true,
      timeout: timeout || 300 // 5 minutes default
    };

    return this.chatCompletion({
      model,
      systemPrompt: systemPrompt || 'You are a helpful assistant.',
      userPrompt: prompt,
      backgroundMode,
      ...options
    });
  }

  /**
   * Check status of a background task
   */
  async getBackgroundTaskStatus(taskId: string): Promise<BackgroundTaskStatus> {
    try {
      const { data, error } = await supabase.functions.invoke('openai-responses', {
        body: { action: 'get_background_task_status', taskId }
      });

      if (error) {
        throw new OpenAIError(`Failed to get background task status: ${error.message}`);
      }

      return data as BackgroundTaskStatus;
    } catch (error) {
      throw new OpenAIError(
        error instanceof Error ? error.message : 'Failed to get background task status',
        'BACKGROUND_TASK_ERROR',
        500,
        error
      );
    }
  }

  /**
   * Helper methods for common context types
   */
  buildStudentContext(student: StudentContext): ContextData[] {
    const builder = this.createContextBuilder();
    
    builder.addStructured({
      id: student.studentId,
      name: student.name,
      email: student.email,
      cohort: student.cohort,
      program: student.program
    }, 'Student Information');

    if (student.attendance) {
      builder.addJson(student.attendance, 'Student Attendance Data');
    }

    if (student.payments) {
      builder.addJson(student.payments, 'Student Payment Information');
    }

    if (student.performance) {
      builder.addJson(student.performance, 'Student Performance Data');
    }

    return builder.build();
  }

  buildCohortContext(cohort: CohortContext): ContextData[] {
    const builder = this.createContextBuilder();
    
    builder.addStructured({
      id: cohort.cohortId,
      name: cohort.name,
      program: cohort.program
    }, 'Cohort Information');

    if (cohort.students && cohort.students.length > 0) {
      builder.addJson(cohort.students, 'Cohort Students');
    }

    if (cohort.sessions && cohort.sessions.length > 0) {
      builder.addJson(cohort.sessions, 'Cohort Sessions');
    }

    if (cohort.schedule) {
      builder.addJson(cohort.schedule, 'Cohort Schedule');
    }

    return builder.build();
  }

  buildPaymentContext(payment: PaymentContext): ContextData[] {
    const builder = this.createContextBuilder();
    
    builder.addStructured({
      studentId: payment.studentId,
      outstanding: payment.outstanding
    }, 'Payment Summary');

    if (payment.paymentPlan) {
      builder.addJson(payment.paymentPlan, 'Payment Plan');
    }

    if (payment.transactions && payment.transactions.length > 0) {
      builder.addJson(payment.transactions, 'Transaction History');
    }

    if (payment.dueDates && payment.dueDates.length > 0) {
      builder.addJson(payment.dueDates, 'Due Dates');
    }

    return builder.build();
  }

  buildSessionContext(session: SessionContext): ContextData[] {
    const builder = this.createContextBuilder();
    
    builder.addStructured({
      id: session.sessionId,
      title: session.title,
      date: session.date,
      cohort: session.cohort
    }, 'Session Information');

    if (session.attendance && session.attendance.length > 0) {
      builder.addJson(session.attendance, 'Session Attendance');
    }

    if (session.content) {
      builder.addJson(session.content, 'Session Content');
    }

    return builder.build();
  }

  /**
   * Validate request parameters
   */
  private validateRequest(request: OpenAIChatRequest): void {
    if (!request.model) {
      throw new OpenAIError('Model is required', 'VALIDATION_ERROR', 400);
    }

    if (!request.systemPrompt) {
      throw new OpenAIError('System prompt is required', 'VALIDATION_ERROR', 400);
    }

    if (!request.userPrompt) {
      throw new OpenAIError('User prompt is required', 'VALIDATION_ERROR', 400);
    }

    if (request.temperature !== undefined && (request.temperature < 0 || request.temperature > 2)) {
      throw new OpenAIError('Temperature must be between 0 and 2', 'VALIDATION_ERROR', 400);
    }

    if (request.maxTokens !== undefined && request.maxTokens < 1) {
      throw new OpenAIError('Max tokens must be greater than 0', 'VALIDATION_ERROR', 400);
    }
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<OpenAIServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): OpenAIServiceConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();

// Export types and classes
export { ContextBuilderImpl };
export type { ContextBuilder };
