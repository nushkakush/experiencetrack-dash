import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// Perplexity API Configuration
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// Supported models with their configurations
const SUPPORTED_MODELS = {
  'sonar': {
    maxTokens: 128000,
    inputCostPer1kTokens: 1.0,
    outputCostPer1kTokens: 1.0,
    requestCost: {
      low: 5.0,
      medium: 8.0,
      high: 12.0
    },
    contextLength: 128000,
    description: 'Sonar - Lightweight model for straightforward queries with web search'
  },
  'sonar-pro': {
    maxTokens: 200000,
    inputCostPer1kTokens: 3.0,
    outputCostPer1kTokens: 15.0,
    requestCost: {
      low: 5.0,
      medium: 5.0,
      high: 5.0
    },
    contextLength: 200000,
    description: 'Sonar Pro - Advanced model for complex queries and follow-ups with web search'
  },
  'sonar-deep-research': {
    maxTokens: 200000,
    inputCostPer1kTokens: 2.0,
    outputCostPer1kTokens: 8.0,
    requestCost: {
      low: 5.0,
      medium: 10.0,
      high: 20.0
    },
    contextLength: 200000,
    description: 'Sonar Deep Research - Exhaustive research and detailed report generation with native citation support'
  }
} as const;

// Request interfaces
interface PerplexitySearchConfig {
  focus?: 'internet' | 'academic' | 'writing' | 'wolfram' | 'youtube' | 'reddit';
  maxCitations?: number;
  includeSnippets?: boolean;
  filterDomains?: string[];
  excludeDomains?: string[];
}

interface PerplexityRequest {
  model: keyof typeof SUPPORTED_MODELS;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  searchConfig?: PerplexitySearchConfig;
  metadata?: Record<string, any>;
}

interface PerplexityCitation {
  index: number;
  title: string;
  url: string;
  snippet?: string;
  publishedDate?: string;
  domain?: string;
}

interface PerplexityResponse {
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
    citations: PerplexityCitation[];
    searchQueries?: string[];
  };
  error?: string;
  errorType?: string;
  metadata?: Record<string, any>;
}

// Citation extraction utility
class CitationExtractor {
  static extractCitations(content: string): { cleanContent: string; citations: PerplexityCitation[] } {
    const citations: PerplexityCitation[] = [];
    let cleanContent = content;
    
    // Pattern to match Perplexity-style citations: [1](url), [2](url), etc.
    const citationPattern = /\[(\d+)\]\((https?:\/\/[^\s)]+)\)/g;
    let match;
    let citationIndex = 0;
    
    while ((match = citationPattern.exec(content)) !== null) {
      const [fullMatch, number, url] = match;
      citationIndex++;
      
      // Extract domain from URL
      let domain = '';
      try {
        domain = new URL(url).hostname;
      } catch (error) {
        console.warn('Failed to parse URL:', url);
      }
      
      citations.push({
        index: citationIndex,
        title: `Source ${number}`,
        url: url,
        domain: domain
      });
      
      // Replace the citation in content with a cleaner format
      cleanContent = cleanContent.replace(fullMatch, `[${number}]`);
    }
    
    return { cleanContent, citations };
  }
  
  static enhanceCitations(citations: PerplexityCitation[], responseData: any): PerplexityCitation[] {
    // If Perplexity provides additional citation metadata, enhance our citations
    if (responseData.citations && Array.isArray(responseData.citations)) {
      return responseData.citations.map((citation: any, index: number) => ({
        index: index + 1,
        title: citation.title || `Source ${index + 1}`,
        url: citation.url || '',
        snippet: citation.snippet || citation.text || '',
        publishedDate: citation.published_date || citation.date,
        domain: citation.domain || (citation.url ? new URL(citation.url).hostname : '')
      }));
    }
    
    return citations;
  }
}

// Perplexity API client
class PerplexityClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(request: PerplexityRequest): Promise<PerplexityResponse> {
    const startTime = Date.now();
    
    try {
      // Validate model
      if (!SUPPORTED_MODELS[request.model]) {
        throw new Error(`Unsupported model: ${request.model}`);
      }

      // Build request payload for Perplexity API
      const payload: any = {
        model: request.model,
        messages: request.messages
      };

      // Add optional parameters
      if (request.temperature !== undefined) payload.temperature = request.temperature;
      if (request.maxTokens !== undefined) payload.max_tokens = request.maxTokens;
      if (request.topP !== undefined) payload.top_p = request.topP;
      if (request.stream !== undefined) payload.stream = request.stream;

      // Add search configuration if provided
      if (request.searchConfig) {
        // Note: These parameters may need to be adjusted based on actual Perplexity API
        if (request.searchConfig.focus) {
          // Some models may support search focus as a parameter
          payload.search_focus = request.searchConfig.focus;
        }
      }

      // Make API call
      const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        let userFriendlyMessage = `Perplexity API error: ${response.status}`;
        let errorType = 'unknown';
        
        try {
          const errorJson = JSON.parse(errorData);
          const perplexityError = errorJson.error;
          
          if (perplexityError) {
            switch (perplexityError.code) {
              case 'insufficient_quota':
                userFriendlyMessage = 'Perplexity API quota exceeded. Please check your Perplexity account billing.';
                errorType = 'quota_exceeded';
                break;
              case 'invalid_api_key':
                userFriendlyMessage = 'Invalid Perplexity API key. Please check the API key configuration.';
                errorType = 'auth_error';
                break;
              case 'model_not_found':
                userFriendlyMessage = `The requested Perplexity model (${request.model}) is not available.`;
                errorType = 'model_error';
                break;
              case 'context_length_exceeded':
                userFriendlyMessage = 'The request is too long for the Perplexity model. Please reduce the content length.';
                errorType = 'content_length_error';
                break;
              case 'rate_limit_exceeded':
                userFriendlyMessage = 'Perplexity API rate limit exceeded. Please wait a moment and try again.';
                errorType = 'rate_limit';
                break;
              default:
                userFriendlyMessage = perplexityError.message || `Perplexity API error: ${response.status}`;
            }
          }
        } catch (parseError) {
          userFriendlyMessage = `Perplexity API error: ${response.status} - ${errorData}`;
        }
        
        return {
          success: false,
          error: userFriendlyMessage,
          errorType,
          metadata: { 
            ...request.metadata, 
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString()
          }
        };
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      // Extract content and citations
      const content = data.choices?.[0]?.message?.content || '';
      
      // Perplexity provides structured citations, so use those instead of extracting from content
      let enhancedCitations: PerplexityCitation[] = [];
      
      if (data.citations && data.search_results && Array.isArray(data.citations) && Array.isArray(data.search_results)) {
        // Map structured citations to our format
        enhancedCitations = data.citations.map((url: string, index: number) => {
          const searchResult = data.search_results[index];
          return {
            index: index + 1,
            title: searchResult?.title || `Source ${index + 1}`,
            url: url,
            snippet: searchResult?.snippet || '',
            publishedDate: searchResult?.date || searchResult?.last_updated,
            domain: url ? new URL(url).hostname : ''
          };
        });
      } else {
        // Fallback to content extraction if structured citations aren't available
        const { cleanContent, citations: extractedCitations } = CitationExtractor.extractCitations(content);
        enhancedCitations = CitationExtractor.enhanceCitations(extractedCitations, data);
      }

      // Calculate cost
      const modelConfig = SUPPORTED_MODELS[request.model];
      const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      const tokenCost = (usage.prompt_tokens / 1000) * modelConfig.inputCostPer1kTokens + 
                        (usage.completion_tokens / 1000) * modelConfig.outputCostPer1kTokens;
      
      // Estimate request complexity based on citations and content length
      const complexity = enhancedCitations.length > 8 ? 'high' : 
                        enhancedCitations.length > 4 ? 'medium' : 'low';
      const requestCost = modelConfig.requestCost[complexity] / 1000;
      const totalCost = tokenCost + requestCost;

      return {
        success: true,
        data: {
          content: content, // Use original content, not cleaned
          model: data.model || request.model,
          usage: {
            promptTokens: usage.prompt_tokens || 0,
            completionTokens: usage.completion_tokens || 0,
            totalTokens: usage.total_tokens || 0,
          },
          finishReason: data.choices?.[0]?.finish_reason || 'completed',
          responseTime,
          cost: totalCost,
          citations: enhancedCitations,
          searchQueries: data.search_queries || []
        },
        metadata: request.metadata
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Perplexity API Error:', error);
      
      let errorMessage = 'An unexpected error occurred while processing your search request.';
      let errorType = 'unknown';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Categorize error types
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
        } else if (error.message.includes('search')) {
          errorType = 'search_error';
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

  async logRequest(request: PerplexityRequest, response: PerplexityResponse, userId?: string) {
    try {
      await this.supabase.from('perplexity_request_logs').insert({
        user_id: userId,
        model: request.model,
        messages: request.messages,
        search_config: request.searchConfig,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        success: response.success,
        response_content: response.data?.content,
        citations_count: response.data?.citations.length || 0,
        search_queries: response.data?.searchQueries || [],
        usage_tokens: response.data?.usage.totalTokens,
        cost: response.data?.cost,
        response_time: response.data?.responseTime,
        error_message: response.error,
        error_type: response.errorType,
        metadata: request.metadata
      });
    } catch (error) {
      console.error('Failed to log Perplexity request:', error);
      // Don't fail the request if logging fails
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Perplexity API key from environment
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      throw new Error('Perplexity API key not configured');
    }

    // Create Supabase client for logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const requestData: PerplexityRequest = await req.json();

    // Validate required fields
    if (!requestData.model || !requestData.messages || requestData.messages.length === 0) {
      throw new Error('Missing required fields: model, messages');
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

    // Initialize Perplexity client
    const perplexityClient = new PerplexityClient(perplexityApiKey);
    const loggingService = new LoggingService(supabase);

    // Make Perplexity request
    const response = await perplexityClient.search(requestData);

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
    console.error('Perplexity Edge Function Error:', error);
    
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
