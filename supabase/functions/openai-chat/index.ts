import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// OpenAI API Configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Supported models with their configurations
const SUPPORTED_MODELS = {
  'o1-preview': {
    maxTokens: 128000,
    costPer1kTokens: 0.015,
    description: 'GPT-5 Thinking Model - Advanced reasoning and problem solving'
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

interface OpenAIChatRequest {
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
}

interface OpenAIChatResponse {
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

// OpenAI API client
class OpenAIClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chatCompletion(request: OpenAIChatRequest): Promise<OpenAIChatResponse> {
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
      
      // Build messages
      const messages = [
        {
          role: 'system' as const,
          content: request.systemPrompt
        },
        {
          role: 'user' as const,
          content: request.userPrompt + processedContext
        }
      ];

      // Build request payload
      const payload: any = {
        model: request.model,
        messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? Math.min(4000, SUPPORTED_MODELS[request.model].maxTokens),
        top_p: request.topP ?? 1,
        frequency_penalty: request.frequencyPenalty ?? 0,
        presence_penalty: request.presencePenalty ?? 0,
        stream: request.stream ?? false
      };

      // Add response format if specified
      if (request.responseFormat === 'json_object') {
        payload.response_format = { type: 'json_object' };
      }

      // Make API call
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      // Calculate cost
      const modelConfig = SUPPORTED_MODELS[request.model];
      const cost = (data.usage.total_tokens / 1000) * modelConfig.costPer1kTokens;

      return {
        success: true,
        data: {
          content: data.choices[0].message.content,
          model: data.model,
          usage: {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          },
          finishReason: data.choices[0].finish_reason,
          responseTime,
          cost
        },
        metadata: request.metadata
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('OpenAI API Error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: { ...request.metadata, responseTime }
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

  async logRequest(request: OpenAIChatRequest, response: OpenAIChatResponse, userId?: string) {
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
        success: response.success,
        response_content: response.data?.content,
        usage_tokens: response.data?.usage.totalTokens,
        cost: response.data?.cost,
        response_time: response.data?.responseTime,
        error_message: response.error,
        metadata: request.metadata
      });
    } catch (error) {
      console.error('Failed to log OpenAI request:', error);
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
    const requestData: OpenAIChatRequest = await req.json();

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

    // Initialize OpenAI client
    const openaiClient = new OpenAIClient(openaiApiKey);
    const loggingService = new LoggingService(supabase);

    // Make OpenAI request
    const response = await openaiClient.chatCompletion(requestData);

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
    console.error('OpenAI Edge Function Error:', error);
    
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
