/**
 * OpenAI Integration Types
 * Comprehensive type definitions for OpenAI Responses API integration
 */

// Supported OpenAI models (including Responses API models)
export type OpenAIModel = 
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'gpt-4'
  | 'gpt-3.5-turbo'
  | 'gpt-3.5-turbo-16k'
  | 'o1-preview'
  | 'o1-mini';

// Context data types
export type ContextDataType = 'text' | 'json' | 'csv' | 'table' | 'structured';

// Response formats
export type ResponseFormat = 'text' | 'json_object';

// Built-in tools for Responses API
export type BuiltInTool = 'web_search' | 'file_search' | 'computer_use';

// Tool configuration
export interface ToolConfig {
  type: BuiltInTool;
  enabled?: boolean;
  config?: Record<string, any>;
}

// Background mode configuration
export interface BackgroundMode {
  enabled: boolean;
  timeout?: number; // in seconds
}

// Context data structure
export interface ContextData {
  type: ContextDataType;
  content: string;
  description?: string;
  metadata?: Record<string, any>;
}

// Main request interface (updated for Responses API)
export interface OpenAIChatRequest {
  model: OpenAIModel;
  systemPrompt: string;
  userPrompt: string;
  context?: ContextData[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
  responseFormat?: ResponseFormat;
  metadata?: Record<string, any>;
  // New Responses API features
  tools?: ToolConfig[];
  backgroundMode?: BackgroundMode;
  enableReasoningSummary?: boolean;
  reasoningEffort?: 'low' | 'medium' | 'high';
}

// Usage statistics
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Tool usage information
export interface ToolUsage {
  tool: BuiltInTool;
  input?: string;
  output?: string;
  success: boolean;
  error?: string;
}

// Reasoning summary
export interface ReasoningSummary {
  summary: string;
  keySteps: string[];
  confidence: number;
}

// Response data (updated for Responses API)
export interface OpenAIChatResponseData {
  content: string;
  model: string;
  usage: TokenUsage;
  finishReason: string;
  responseTime: number;
  cost: number;
  // New Responses API features
  toolsUsed?: ToolUsage[];
  reasoningSummary?: ReasoningSummary;
  backgroundTaskId?: string;
  isBackgroundTask?: boolean;
}

// Error types for better client-side handling
export type OpenAIErrorType = 
  | 'quota_exceeded'
  | 'rate_limit'
  | 'auth_error'
  | 'model_error'
  | 'content_length_error'
  | 'unknown';

// Main response interface
export interface OpenAIChatResponse {
  success: boolean;
  data?: OpenAIChatResponseData;
  error?: string;
  errorType?: OpenAIErrorType;
  metadata?: Record<string, any>;
}

// Model configuration
export interface ModelConfig {
  maxTokens: number;
  costPer1kTokens: number;
  description: string;
}

// Available models configuration
export interface SupportedModels {
  [key: string]: ModelConfig;
}

// Context builder interface for systematic context management
export interface ContextBuilder {
  addText(content: string, description?: string, metadata?: Record<string, any>): ContextBuilder;
  addJson(data: any, description?: string, metadata?: Record<string, any>): ContextBuilder;
  addCsv(content: string, description?: string, metadata?: Record<string, any>): ContextBuilder;
  addTable(content: string, description?: string, metadata?: Record<string, any>): ContextBuilder;
  addStructured(data: any, description?: string, metadata?: Record<string, any>): ContextBuilder;
  build(): ContextData[];
  clear(): ContextBuilder;
}

// Predefined context types for common use cases
export interface StudentContext {
  studentId: string;
  name: string;
  email: string;
  cohort: string;
  program: string;
  attendance?: any;
  payments?: any;
  performance?: any;
}

export interface CohortContext {
  cohortId: string;
  name: string;
  program: string;
  students: any[];
  sessions: any[];
  schedule: any;
}

export interface PaymentContext {
  studentId: string;
  paymentPlan: any;
  transactions: any[];
  outstanding: number;
  dueDates: any[];
}

export interface SessionContext {
  sessionId: string;
  title: string;
  date: string;
  cohort: string;
  attendance: any[];
  content: any;
}

// Service configuration (updated for Responses API)
export interface OpenAIServiceConfig {
  defaultModel: OpenAIModel;
  defaultTemperature: number;
  defaultMaxTokens: number;
  enableLogging: boolean;
  retryAttempts: number;
  retryDelay: number;
  // New Responses API defaults
  defaultTools?: ToolConfig[];
  enableWebSearch?: boolean;
  enableFileSearch?: boolean;
  enableComputerUse?: boolean;
  defaultBackgroundMode?: boolean;
  defaultReasoningSummary?: boolean;
}

// Error types
export class OpenAIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'OpenAIError';
  }
}

// Request logging interface
export interface RequestLog {
  id?: string;
  userId?: string;
  model: OpenAIModel;
  systemPrompt: string;
  userPrompt: string;
  contextCount: number;
  contextTypes: ContextDataType[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: ResponseFormat;
  success: boolean;
  responseContent?: string;
  usageTokens?: number;
  cost?: number;
  responseTime?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
}

// Analytics interface
export interface OpenAIAnalytics {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  successRate: number;
  modelUsage: Record<OpenAIModel, number>;
  contextTypeUsage: Record<ContextDataType, number>;
  errorRate: number;
  topErrors: Array<{ error: string; count: number }>;
}

// Batch request interface
export interface BatchOpenAIRequest {
  requests: OpenAIChatRequest[];
  concurrency?: number;
  onProgress?: (completed: number, total: number) => void;
}

export interface BatchOpenAIResponse {
  responses: OpenAIChatResponse[];
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalCost: number;
  totalTokens: number;
  averageResponseTime: number;
}

// Convenience types for Responses API
export interface WebSearchRequest extends Omit<OpenAIChatRequest, 'tools'> {
  enableWebSearch: true;
  searchConfig?: {
    maxResults?: number;
    includeImages?: boolean;
    searchRegion?: string;
  };
}

export interface FileSearchRequest extends Omit<OpenAIChatRequest, 'tools'> {
  enableFileSearch: true;
  fileConfig?: {
    maxFiles?: number;
    fileTypes?: string[];
    searchScope?: string;
  };
}

export interface ComputerUseRequest extends Omit<OpenAIChatRequest, 'tools'> {
  enableComputerUse: true;
  computerConfig?: {
    allowScreenshots?: boolean;
    allowFileOperations?: boolean;
    allowWebBrowsing?: boolean;
  };
}

// Background task management
export interface BackgroundTaskStatus {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  result?: OpenAIChatResponse;
  error?: string;
  createdAt: string;
  completedAt?: string;
}
