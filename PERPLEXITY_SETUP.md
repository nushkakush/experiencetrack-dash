# Perplexity API Integration Setup

This guide explains how to set up Perplexity's Sonar API for improved web search and citation quality in your ExperienceTrack application.

## Overview

We've integrated Perplexity's Sonar API to replace ChatGPT's web search functionality, which was producing 404 citations. Perplexity provides:

- **Real-time web search** with current information
- **Reliable citations** that don't lead to 404 pages
- **Better source quality** with academic and authoritative sources
- **Cost-effective pricing** for search operations

## Setup Instructions

### 1. Get Your Perplexity API Key

1. Visit [Perplexity API](https://docs.perplexity.ai/)
2. Sign up for an account
3. Navigate to the API section
4. Generate your API key

### 2. Configure Environment Variables

Add your Perplexity API key to your environment variables:

```bash
# In your .env file or environment configuration
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

### 3. Deploy the Perplexity Edge Function

The Perplexity Edge Function has been created at `supabase/functions/perplexity-search/index.ts`. Deploy it using:

```bash
supabase functions deploy perplexity-search
```

### 4. Update Your Supabase Environment

Ensure the `PERPLEXITY_API_KEY` is set in your Supabase project's Edge Function secrets:

```bash
supabase secrets set PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

## Models Available

### Sonar (Default)
- **Context Length**: 128K tokens
- **Input Cost**: $1 per 1M tokens
- **Output Cost**: $1 per 1M tokens
- **Request Cost**: $5-12 per 1K requests (based on complexity)
- **Best For**: Quick searches, straightforward queries

### Sonar Pro
- **Context Length**: 200K tokens  
- **Input Cost**: $3 per 1M tokens
- **Output Cost**: $15 per 1M tokens
- **Request Cost**: $5 per 1K requests
- **Best For**: Complex queries, academic research, detailed analysis

## How It Works

### Automatic Provider Selection

The new `AIService` automatically routes requests based on requirements:

- **Perplexity Sonar**: Used for web search, real-time data, citations
- **OpenAI GPT**: Used for text generation, reasoning, structured output

### Magic Brief Generation & Expansion

**Magic Brief Generation** uses Perplexity for:
- Real-time brand information lookup
- Current market trends and news
- Reliable source citations for challenge statements

**Magic Brief Expansion** exclusively uses Perplexity Sonar Pro for:
- Comprehensive research and content development
- Real-time industry data and case studies
- Detailed citations for all expanded content
- Current company information and market context

### Citation Quality

Citations now include:
- **Verified URLs** that don't lead to 404s
- **Source metadata** (domain, publish date, snippets)
- **Domain categorization** (academic, government, commercial)
- **Publication dates** for temporal relevance

## Usage Examples

### Basic Search with Citations

```typescript
import { aiService } from '@/services/aiService';

const response = await aiService.searchWithCitations(
  "What are the latest trends in sustainable packaging?",
  "You are a market research analyst. Provide current trends with reliable sources."
);

console.log(response.content); // Search results
console.log(response.citations); // Array of verified citations
```

### Magic Brief Expansion (Perplexity Only)

```typescript
import { aiService } from '@/services/aiService';

const response = await aiService.generateExpansion(
  `Expand this challenge: "Create a sustainable packaging solution for Nike"`,
  "You are a comprehensive CBL experience designer with access to current market data.",
  'sonar-pro', // Always uses Perplexity Pro
  { 
    taskType: 'expansion',
    brand_name: 'Nike',
    operation: 'magic_brief_expansion'
  }
);

// This will ALWAYS use Perplexity Sonar Pro regardless of other settings
console.log(response.provider); // 'perplexity'
console.log(response.citations); // Rich citations with current data
```

### Academic Research

```typescript
const response = await aiService.academicSearch(
  "Machine learning applications in healthcare diagnostics"
);

// Returns academic sources with .edu and research citations
```

### News and Current Events

```typescript
const response = await aiService.newsSearch(
  "Latest developments in renewable energy policy"
);

// Returns current news with publication dates
```

## Configuration Options

### AI Service Configuration

```typescript
import { aiService } from '@/services/aiService';

aiService.updateConfig({
  preferredProvider: 'perplexity', // or 'openai'
  usePerplexityForWebSearch: true,
  fallbackProvider: 'openai',
  enableLogging: true
});
```

### Search Configuration

```typescript
const response = await perplexityService.search({
  model: 'sonar-pro',
  messages: [{ role: 'user', content: 'Your query here' }],
  searchConfig: {
    focus: 'academic', // or 'internet', 'writing', 'youtube', 'reddit'
    maxCitations: 15,
    includeSnippets: true,
    filterDomains: ['edu', 'gov'], // Only include these domains
    excludeDomains: ['example.com'] // Exclude these domains
  }
});
```

## Monitoring and Analytics

### Request Logging

All Perplexity requests are logged to the `perplexity_request_logs` table with:
- Request details (model, messages, configuration)
- Response metrics (tokens, cost, response time)
- Citation count and quality metrics
- Error tracking and categorization

### Cost Monitoring

Monitor costs through the logging system:
- Token usage tracking
- Request complexity analysis
- Cost per citation metrics
- Usage patterns by user/epic

## Troubleshooting

### Common Issues

1. **API Key Not Found**
   - Verify `PERPLEXITY_API_KEY` is set in environment
   - Check Supabase Edge Function secrets

2. **Rate Limiting**
   - Perplexity has rate limits based on your plan
   - The service includes automatic retry logic

3. **Citation Parsing Errors**
   - The system includes fallback parsing for malformed citations
   - Check logs for parsing error patterns

### Error Handling

The system includes comprehensive error handling:
- Automatic fallback to OpenAI if Perplexity fails
- Retry logic for transient failures
- Detailed error categorization and logging

## Benefits Over ChatGPT Web Search

1. **Citation Reliability**: No more 404 pages
2. **Real-time Data**: Always current information
3. **Source Quality**: Better academic and authoritative sources
4. **Cost Efficiency**: More predictable pricing
5. **Structured Citations**: Rich metadata for each source
6. **Domain Intelligence**: Smart source categorization

## Migration Notes

The integration is backward-compatible:
- Existing OpenAI functionality remains unchanged
- Magic brief generation automatically uses Perplexity
- Fallback to OpenAI if Perplexity is unavailable
- No changes required to existing UI components

## Support

For issues with the Perplexity integration:
1. Check the `perplexity_request_logs` table for error details
2. Verify API key configuration
3. Monitor rate limits and usage
4. Review Edge Function logs in Supabase dashboard
