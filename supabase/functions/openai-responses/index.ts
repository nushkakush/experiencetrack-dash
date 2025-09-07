import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// OpenAI Chat Completions API Configuration  
const OPENAI_CHAT_COMPLETIONS_API_URL = 'https://api.openai.com/v1/chat/completions';

// Supported models with their configurations
const SUPPORTED_MODELS = {
  'o1-preview': {
    maxTokens: 128000,
    costPer1kTokens: 0.015,
    description: 'GPT-5 Thinking Model - Advanced reasoning and problem solving'
  },
  'o1-mini': {
    maxTokens: 128000,
    costPer1kTokens: 0.003,
    description: 'GPT-5 Thinking Model Mini - Faster and cheaper'
  },
  'gpt-4o': {
    maxTokens: 128000,
    costPer1kTokens: 0.005,
    description: 'GPT-4 Omni - Most capable model'
  },
  'gpt-4o-mini': {
    maxTokens: 128000,
    costPer1kTokens: 0.00015,
    description: 'GPT-4 Omni Mini - Faster and cheaper'
  },
  'gpt-4-turbo': {
    maxTokens: 128000,
    costPer1kTokens: 0.01,
    description: 'GPT-4 Turbo - High performance'
  },
  'gpt-4': {
    maxTokens: 8192,
    costPer1kTokens: 0.03,
    description: 'GPT-4 - Standard model'
  },
  'gpt-3.5-turbo': {
    maxTokens: 16384,
    costPer1kTokens: 0.0015,
    description: 'GPT-3.5 Turbo - Fast and efficient'
  },
  'gpt-3.5-turbo-16k': {
    maxTokens: 16384,
    costPer1kTokens: 0.003,
    description: 'GPT-3.5 Turbo 16K - Extended context'
  }
} as const;

// Request interfaces
interface ContextData {
  type: 'text' | 'json' | 'csv' | 'table' | 'structured';
  content: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface ToolConfig {
  type: 'web_search' | 'file_search' | 'computer_use';
  enabled?: boolean;
  config?: Record<string, any>;
}

interface BackgroundMode {
  enabled: boolean;
  timeout?: number;
}

interface OpenAIResponsesRequest {
  model: keyof typeof SUPPORTED_MODELS;
  systemPrompt: string;
  userPrompt: string;
  context?: ContextData[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
  responseFormat?: 'text' | 'json_object';
  metadata?: Record<string, any>;
  // New Responses API features
  tools?: ToolConfig[];
  backgroundMode?: BackgroundMode;
  enableReasoningSummary?: boolean;
  reasoningEffort?: 'low' | 'medium' | 'high';
}

interface ToolUsage {
  tool: string;
  input?: string;
  output?: string;
  success: boolean;
  error?: string;
}

interface ReasoningSummary {
  summary: string;
  keySteps: string[];
  confidence: number;
}

interface OpenAIResponsesResponse {
  success: boolean;
  data?: {
    content: string;
    model: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    finishReason: string;
    responseTime: number;
    cost: number;
    // New Responses API features
    toolsUsed?: ToolUsage[];
    reasoningSummary?: ReasoningSummary;
    backgroundTaskId?: string;
    isBackgroundTask?: boolean;
  };
  error?: string;
  metadata?: Record<string, any>;
}

// Context processing utilities
class ContextProcessor {
  static processContext(context: ContextData[]): string {
    if (!context || context.length === 0) return '';

    let processedContext = '\n\n## Context Information:\n';
    
    context.forEach((ctx, index) => {
      processedContext += `\n### Context ${index + 1}`;
      if (ctx.description) {
        processedContext += ` - ${ctx.description}`;
      }
      processedContext += `\n`;
      
      switch (ctx.type) {
        case 'text':
          processedContext += ctx.content;
          break;
        case 'json':
          processedContext += '```json\n' + ctx.content + '\n```';
          break;
        case 'csv':
          processedContext += '```csv\n' + ctx.content + '\n```';
          break;
        case 'table':
          processedContext += '```\n' + ctx.content + '\n```';
          break;
        case 'structured':
          processedContext += ctx.content;
          break;
        default:
          processedContext += ctx.content;
      }
      
      if (ctx.metadata) {
        processedContext += `\n*Metadata: ${JSON.stringify(ctx.metadata)}*`;
      }
      processedContext += '\n';
    });

    return processedContext;
  }

  static validateContext(context: ContextData[]): { valid: boolean; error?: string } {
    if (!context) return { valid: true };

    for (const ctx of context) {
      if (!ctx.type || !ctx.content) {
        return { valid: false, error: 'Context must have type and content' };
      }
      
      if (!['text', 'json', 'csv', 'table', 'structured'].includes(ctx.type)) {
        return { valid: false, error: `Invalid context type: ${ctx.type}` };
      }

      // Validate JSON context
      if (ctx.type === 'json') {
        try {
          JSON.parse(ctx.content);
        } catch {
          return { valid: false, error: 'Invalid JSON in context' };
        }
      }
    }

    return { valid: true };
  }
}

// Tool processing utilities
class ToolProcessor {
  static processTools(tools?: ToolConfig[]): any[] {
    if (!tools || tools.length === 0) return [];

    const processedTools: any[] = [];
    
    for (const tool of tools) {
      if (!tool.enabled) continue;

      switch (tool.type) {
        case 'web_search':
          processedTools.push({
            type: 'web_search'
            // Note: maxResults and other config parameters are not supported in Responses API
          });
          break;
        case 'file_search':
          processedTools.push({
            type: 'file_search'
            // Note: config parameters are not supported in Responses API
          });
          break;
        case 'computer_use':
          processedTools.push({
            type: 'computer_use'
            // Note: config parameters are not supported in Responses API
          });
          break;
      }
    }

    return processedTools;
  }
}

// OpenAI Responses API client
class OpenAIResponsesClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createResponse(request: OpenAIResponsesRequest): Promise<OpenAIResponsesResponse> {
    const startTime = Date.now();
    
    try {
      // Validate model
      if (!SUPPORTED_MODELS[request.model]) {
        throw new Error(`Unsupported model: ${request.model}`);
      }

      // Validate context
      const contextValidation = ContextProcessor.validateContext(request.context || []);
      if (!contextValidation.valid) {
        throw new Error(contextValidation.error);
      }

      // Process context
      const processedContext = ContextProcessor.processContext(request.context || []);
      
      // Process tools
      const processedTools = ToolProcessor.processTools(request.tools);
      
      // Build messages for Chat Completions API
      const messages: any[] = [
        {
          role: 'system',
          content: request.systemPrompt
        },
        {
          role: 'user', 
          content: `${request.userPrompt}${processedContext}`
        }
      ];

      // Build request payload for Chat Completions API
      const payload: any = {
        model: request.model,
        messages
      };

      // Add optional parameters based on model support
      if (request.model !== 'o1-preview' && request.model !== 'o1-mini') {
        // These parameters are not supported by o1 models
        if (request.temperature !== undefined) payload.temperature = request.temperature;
        if (request.maxTokens !== undefined) payload.max_tokens = request.maxTokens;
        if (request.topP !== undefined) payload.top_p = request.topP;
        if (request.frequencyPenalty !== undefined) payload.frequency_penalty = request.frequencyPenalty;
        if (request.presencePenalty !== undefined) payload.presence_penalty = request.presencePenalty;
        if (request.stream !== undefined) payload.stream = request.stream;
      }

      // Note: Tools are not supported in basic Chat Completions API
      // Advanced features like web_search, file_search, computer_use require function calling setup
      
      // Add response format if specified
      if (request.responseFormat === 'json_object') {
        payload.response_format = { type: 'json_object' };
      }

      // Make API call
      const response = await fetch(OPENAI_CHAT_COMPLETIONS_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        let userFriendlyMessage = `OpenAI API error: ${response.status}`;
        
        try {
          const errorJson = JSON.parse(errorData);
          const openaiError = errorJson.error;
          
          if (openaiError) {
            switch (openaiError.code) {
              case 'insufficient_quota':
                userFriendlyMessage = 'OpenAI API quota exceeded. Please check your OpenAI account billing and add credits to continue using AI features.';
                break;
              case 'invalid_api_key':
                userFriendlyMessage = 'Invalid OpenAI API key. Please check the API key configuration.';
                break;
              case 'model_not_found':
                userFriendlyMessage = `The requested AI model (${request.model}) is not available. Please try a different model.`;
                break;
              case 'context_length_exceeded':
                userFriendlyMessage = 'The request is too long for the AI model. Please reduce the content length and try again.';
                break;
              case 'rate_limit_exceeded':
                userFriendlyMessage = 'OpenAI API rate limit exceeded. Please wait a moment and try again.';
                break;
              default:
                userFriendlyMessage = openaiError.message || `OpenAI API error: ${response.status}`;
            }
          }
        } catch (parseError) {
          // If we can't parse the error, use the raw response
          userFriendlyMessage = `OpenAI Chat Completions API error: ${response.status} - ${errorData}`;
        }
        
        throw new Error(userFriendlyMessage);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      // Calculate cost
      const modelConfig = SUPPORTED_MODELS[request.model];
      const cost = (data.usage?.total_tokens / 1000) * modelConfig.costPer1kTokens;

      return {
        success: true,
        data: {
          content: data.choices?.[0]?.message?.content || '',
          model: data.model,
          usage: {
            promptTokens: data.usage?.prompt_tokens || 0,
            completionTokens: data.usage?.completion_tokens || 0,
            totalTokens: data.usage?.total_tokens || 0,
          },
          finishReason: data.choices?.[0]?.finish_reason || 'completed',
          responseTime,
          cost,
          // These features are not available in basic Chat Completions API
          toolsUsed: undefined,
          reasoningSummary: undefined,
          backgroundTaskId: undefined,
          isBackgroundTask: false
        },
        metadata: request.metadata
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('OpenAI Chat Completions API Error:', error);
      
      let errorMessage = 'An unexpected error occurred while processing your AI request.';
      let errorType = 'unknown';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Categorize error types for better client-side handling
        if (error.message.includes('quota exceeded')) {
          errorType = 'quota_exceeded';
        } else if (error.message.includes('rate limit')) {
          errorType = 'rate_limit';
        } else if (error.message.includes('invalid_api_key')) {
          errorType = 'auth_error';
        } else if (error.message.includes('model') && error.message.includes('not available')) {
          errorType = 'model_error';
        } else if (error.message.includes('too long')) {
          errorType = 'content_length_error';
        }
      }
      
      return {
        success: false,
        error: errorMessage,
        errorType,
        metadata: { 
          ...request.metadata, 
          responseTime,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

// Logging service
class LoggingService {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async logRequest(request: OpenAIResponsesRequest, response: OpenAIResponsesResponse, userId?: string) {
    try {
      await this.supabase.from('openai_request_logs').insert({
        user_id: userId,
        model: request.model,
        system_prompt: request.systemPrompt,
        user_prompt: request.userPrompt,
        context_count: request.context?.length || 0,
        context_types: request.context?.map(c => c.type) || [],
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        response_format: request.responseFormat,
        tools_used: request.tools?.map(t => t.type) || [],
        background_mode: request.backgroundMode?.enabled || false,
        reasoning_summary: request.enableReasoningSummary || false,
        success: response.success,
        response_content: response.data?.content,
        usage_tokens: response.data?.usage.totalTokens,
        cost: response.data?.cost,
        response_time: response.data?.responseTime,
        tools_used_response: response.data?.toolsUsed?.map(t => t.tool) || [],
        reasoning_summary_response: response.data?.reasoningSummary?.summary,
        background_task_id: response.data?.backgroundTaskId,
        error_message: response.error,
        metadata: request.metadata
      });
    } catch (error) {
      console.error('Failed to log OpenAI Responses request:', error);
      // Don't fail the request if logging fails
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create Supabase client for logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const requestData: OpenAIResponsesRequest = await req.json();

    // Validate required fields
    if (!requestData.model || !requestData.systemPrompt || !requestData.userPrompt) {
      throw new Error('Missing required fields: model, systemPrompt, userPrompt');
    }

    // Get user ID from auth header if available
    const authHeader = req.headers.get('authorization');
    let userId: string | undefined;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      } catch (error) {
        console.warn('Could not extract user ID from auth header:', error);
      }
    }

    // Initialize OpenAI Responses client
    const openaiClient = new OpenAIResponsesClient(openaiApiKey);
    const loggingService = new LoggingService(supabase);

    // Make OpenAI Responses request
    const response = await openaiClient.createResponse(requestData);

    // Log the request
    await loggingService.logRequest(requestData, response, userId);

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.success ? 200 : 400,
      }
    );

  } catch (error) {
    console.error('OpenAI Chat Completions Edge Function Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
