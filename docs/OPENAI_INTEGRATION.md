# OpenAI Integration Architecture

This document describes the comprehensive OpenAI integration architecture for the ExperienceTrack Dashboard application.

## Overview

The OpenAI integration provides a flexible, scalable, and cost-effective way to incorporate AI capabilities throughout the application. It uses Supabase Edge Functions for secure API handling and provides both high-level and low-level interfaces for different use cases.

## Architecture Components

### 1. Edge Function (`supabase/functions/openai-chat/`)
- **Purpose**: Secure server-side handling of OpenAI API requests
- **Features**:
  - Model selection (GPT-4, GPT-3.5, etc.)
  - Context management for multiple data types
  - Request logging and analytics
  - Error handling and retry logic
  - Cost tracking and usage monitoring

### 2. Client Service (`src/services/openai.service.ts`)
- **Purpose**: Type-safe client-side service for OpenAI interactions
- **Features**:
  - Context builder for systematic data inclusion
  - Batch processing capabilities
  - Specialized methods for common use cases
  - Error handling and logging

### 3. React Hooks (`src/hooks/useOpenAI.ts`)
- **Purpose**: Easy-to-use React hooks for OpenAI functionality
- **Features**:
  - Specialized hooks for different domains (Student, Cohort, Payment, Session)
  - State management for loading, error, and response states
  - Automatic error handling and cleanup

### 4. Type Definitions (`src/types/openai.ts`)
- **Purpose**: Comprehensive TypeScript types for type safety
- **Features**:
  - Request/response interfaces
  - Context data types
  - Error handling types
  - Analytics and logging types

## Setup Instructions

### 1. Environment Configuration

Add the following environment variables to your Supabase project:

```bash
# In Supabase Dashboard > Settings > Edge Functions > Environment Variables
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Database Migration

Run the migration to create the logging table:

```bash
supabase db push
```

### 3. Deploy Edge Function

```bash
supabase functions deploy openai-chat
```

## Usage Examples

### Basic Text Generation

```typescript
import { useOpenAI } from '@/hooks/useOpenAI';

function MyComponent() {
  const { state, generateText } = useOpenAI();

  const handleGenerate = async () => {
    try {
      const result = await generateText(
        'Explain machine learning in simple terms',
        'You are a helpful educational assistant'
      );
      console.log(result);
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  return (
    <button onClick={handleGenerate} disabled={state.isLoading}>
      {state.isLoading ? 'Generating...' : 'Generate Text'}
    </button>
  );
}
```

### Context-Aware Generation

```typescript
import { openaiService } from '@/services/openai.service';

const context = openaiService.createContextBuilder()
  .addStructured({
    name: 'John Doe',
    email: 'john@example.com',
    cohort: 'LIT OS 2024'
  }, 'Student Information')
  .addJson({
    attendance: 85,
    assignments: 12,
    completed: 10
  }, 'Performance Data')
  .build();

const response = await openaiService.chatCompletion({
  model: 'gpt-4o-mini',
  systemPrompt: 'You are an educational AI assistant.',
  userPrompt: 'Analyze this student\'s performance',
  context
});
```

### JSON Generation

```typescript
import { useOpenAI } from '@/hooks/useOpenAI';

function MyComponent() {
  const { generateJson } = useOpenAI();

  const handleGenerateReport = async () => {
    try {
      const report = await generateJson<{
        summary: string;
        metrics: Record<string, number>;
        recommendations: string[];
      }>(
        'Generate a student performance report',
        'You are an educational AI that generates structured reports in JSON format.'
      );
      console.log(report);
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  return <button onClick={handleGenerateReport}>Generate Report</button>;
}
```

### Specialized Domain Hooks

```typescript
import { useStudentAI, useCohortAI, usePaymentAI } from '@/hooks/useOpenAI';

function StudentAnalysis() {
  const { analyzeStudentPerformance } = useStudentAI();

  const handleAnalyze = async () => {
    const studentData = {
      studentId: '123',
      name: 'Jane Doe',
      // ... other student data
    };

    const analysis = await analyzeStudentPerformance(
      studentData,
      'Analyze this student\'s performance and provide recommendations'
    );
    console.log(analysis);
  };

  return <button onClick={handleAnalyze}>Analyze Student</button>;
}
```

## Supported Models

| Model | Max Tokens | Cost per 1K Tokens | Description |
|-------|------------|-------------------|-------------|
| gpt-4o | 128,000 | $0.005 | Most capable model |
| gpt-4o-mini | 128,000 | $0.00015 | Faster and cheaper |
| gpt-4-turbo | 128,000 | $0.01 | High performance |
| gpt-4 | 8,192 | $0.03 | Standard model |
| gpt-3.5-turbo | 16,384 | $0.0015 | Fast and efficient |
| gpt-3.5-turbo-16k | 16,384 | $0.003 | Extended context |

## Context Types

The system supports multiple context types for systematic data inclusion:

### 1. Text Context
```typescript
context.addText('This is plain text content', 'Description of the content');
```

### 2. JSON Context
```typescript
context.addJson({
  name: 'John Doe',
  age: 25,
  skills: ['JavaScript', 'React', 'Node.js']
}, 'User Profile Data');
```

### 3. CSV Context
```typescript
context.addCsv(
  'Name,Age,Score\nJohn,25,85\nJane,23,92',
  'Student Performance Data'
);
```

### 4. Table Context
```typescript
context.addTable(
  '| Name | Age | Score |\n|------|-----|-------|\n| John | 25  | 85    |',
  'Student Performance Table'
);
```

### 5. Structured Context
```typescript
context.addStructured({
  type: 'student',
  data: studentData,
  metadata: { source: 'database' }
}, 'Student Information');
```

## Error Handling

The integration provides comprehensive error handling:

```typescript
import { OpenAIError } from '@/types/openai';

try {
  const response = await openaiService.chatCompletion(request);
} catch (error) {
  if (error instanceof OpenAIError) {
    console.error('OpenAI Error:', error.message);
    console.error('Error Code:', error.code);
    console.error('Status:', error.status);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Analytics and Monitoring

### Request Logging
All requests are automatically logged to the `openai_request_logs` table with:
- User ID (if authenticated)
- Model used
- Tokens consumed
- Cost incurred
- Response time
- Success/failure status

### Usage Analytics
```sql
-- Get user usage statistics
SELECT * FROM get_user_openai_usage('user-id', 30);

-- Get model usage statistics
SELECT * FROM get_model_usage_stats(30);

-- View analytics dashboard
SELECT * FROM openai_analytics;
```

## Best Practices

### 1. Model Selection
- Use `gpt-4o-mini` for most use cases (cost-effective)
- Use `gpt-4o` for complex reasoning tasks
- Use `gpt-3.5-turbo` for simple text generation

### 2. Context Management
- Use the context builder for systematic data inclusion
- Provide clear descriptions for context data
- Limit context size to avoid token limits

### 3. Error Handling
- Always handle errors gracefully
- Provide fallback responses when AI fails
- Log errors for debugging

### 4. Cost Management
- Monitor usage through analytics
- Set up alerts for high costs
- Use appropriate models for the task complexity

### 5. Security
- Never expose API keys in client-side code
- Validate all inputs before sending to AI
- Sanitize AI responses before displaying

## Advanced Features

### Batch Processing
```typescript
const batchRequest = {
  requests: [
    { model: 'gpt-4o-mini', systemPrompt: '...', userPrompt: '...' },
    { model: 'gpt-4o-mini', systemPrompt: '...', userPrompt: '...' }
  ],
  concurrency: 3,
  onProgress: (completed, total) => {
    console.log(`Progress: ${completed}/${total}`);
  }
};

const response = await openaiService.batchChatCompletion(batchRequest);
```

### Custom Configuration
```typescript
import { OpenAIService } from '@/services/openai.service';

const customService = new OpenAIService({
  defaultModel: 'gpt-4o',
  defaultTemperature: 0.5,
  defaultMaxTokens: 2000,
  enableLogging: true,
  retryAttempts: 5,
  retryDelay: 2000
});
```

## Troubleshooting

### Common Issues

1. **API Key Not Found**
   - Ensure `OPENAI_API_KEY` is set in Supabase environment variables
   - Check that the Edge Function is deployed

2. **Model Not Supported**
   - Verify the model name is correct
   - Check the supported models list

3. **Token Limit Exceeded**
   - Reduce context size
   - Use a model with higher token limits
   - Split large requests into smaller ones

4. **Rate Limiting**
   - Implement exponential backoff
   - Use batch processing for multiple requests
   - Consider upgrading OpenAI plan

### Debug Mode
Enable debug logging by setting the log level in your service configuration:

```typescript
const service = new OpenAIService({
  enableLogging: true
});
```

## Future Enhancements

1. **Streaming Support**: Real-time response streaming
2. **Function Calling**: Integration with OpenAI function calling
3. **Fine-tuning**: Custom model fine-tuning capabilities
4. **Multi-modal**: Support for image and document inputs
5. **Caching**: Response caching for repeated requests
6. **Rate Limiting**: Built-in rate limiting and throttling

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the analytics for usage patterns
3. Check Supabase Edge Function logs
4. Contact the development team

## License

This integration is part of the ExperienceTrack Dashboard project and follows the same licensing terms.
