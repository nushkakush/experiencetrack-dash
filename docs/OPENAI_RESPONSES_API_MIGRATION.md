# OpenAI Responses API Migration Guide

This document outlines the migration from the Chat Completions API to the new OpenAI Responses API, which provides enhanced capabilities including built-in tools, reasoning summaries, and background processing.

## What's New

### 🚀 Key Features

1. **Built-in Tools**
   - **Web Search**: Access to real-time web information
   - **File Search**: Search and analyze documents
   - **Computer Use**: Interact with applications and perform tasks

2. **Advanced Capabilities**
   - **Reasoning Summary**: Get insights into AI's thinking process
   - **Background Mode**: Handle long-running tasks asynchronously
   - **Stateful Interactions**: Maintain conversation context

3. **Enhanced Models**
   - Support for `o1-preview` and `o1-mini` models
   - Better reasoning and problem-solving capabilities

## Migration Steps

### 1. Updated Types

The type definitions have been enhanced to support the new Responses API features:

```typescript
// New tool types
export type BuiltInTool = 'web_search' | 'file_search' | 'computer_use';

export interface ToolConfig {
  type: BuiltInTool;
  enabled?: boolean;
  config?: Record<string, any>;
}

// Enhanced request interface
export interface OpenAIChatRequest {
  // ... existing fields
  tools?: ToolConfig[];
  backgroundMode?: BackgroundMode;
  enableReasoningSummary?: boolean;
}

// Enhanced response interface
export interface OpenAIChatResponseData {
  // ... existing fields
  toolsUsed?: ToolUsage[];
  reasoningSummary?: ReasoningSummary;
  backgroundTaskId?: string;
  isBackgroundTask?: boolean;
}
```

### 2. New Service Methods

The `OpenAIService` class now includes new methods for the Responses API:

```typescript
// Web search capability
await openaiService.generateWithWebSearch(
  "What are the latest trends in AI?",
  "You are a research assistant with web access.",
  'gpt-4o-mini',
  { maxResults: 10 }
);

// File search capability
await openaiService.generateWithFileSearch(
  "Analyze the documents in my project",
  "You are a document analysis assistant.",
  'gpt-4o-mini',
  { maxFiles: 20 }
);

// Computer use capability
await openaiService.generateWithComputerUse(
  "Help me organize my files",
  "You are a productivity assistant.",
  'gpt-4o-mini',
  { allowFileOperations: true }
);

// Reasoning summary
await openaiService.generateWithReasoning(
  "Solve this complex problem step by step",
  "You are a problem-solving assistant."
);

// Background processing
await openaiService.generateInBackground(
  "Generate a comprehensive report",
  "You are a report generation assistant.",
  'gpt-4o-mini',
  600 // 10 minutes timeout
);
```

### 3. Enhanced Hooks

The `useOpenAI` hook now includes new methods:

```typescript
const {
  // Existing methods
  generateText,
  generateJson,
  
  // New Responses API methods
  generateWithWebSearch,
  generateWithFileSearch,
  generateWithComputerUse,
  generateWithReasoning,
  generateInBackground,
  getBackgroundTaskStatus
} = useOpenAI();
```

### 4. Specialized Hooks

New specialized hooks for specific use cases:

```typescript
// Web search specialized hook
const {
  searchAndAnalyze,
  getCurrentInformation,
  researchWithReasoning
} = useWebSearchAI();

// Example usage
await searchAndAnalyze(
  "Latest developments in quantum computing",
  "Provide a comprehensive analysis with current information"
);
```

## Usage Examples

### Basic Web Search

```typescript
import { useWebSearchAI } from '@/hooks/useOpenAI';

function ResearchComponent() {
  const { searchAndAnalyze, state } = useWebSearchAI();
  
  const handleResearch = async () => {
    const response = await searchAndAnalyze(
      "Current trends in educational technology",
      "Focus on AI and personalized learning"
    );
    
    console.log('Research results:', response.data?.content);
    console.log('Tools used:', response.data?.toolsUsed);
  };
  
  return (
    <div>
      <button onClick={handleResearch} disabled={state.isLoading}>
        {state.isLoading ? 'Researching...' : 'Start Research'}
      </button>
      {state.response && (
        <div>
          <h3>Results:</h3>
          <p>{state.response.data?.content}</p>
        </div>
      )}
    </div>
  );
}
```

### Background Processing

```typescript
import { useOpenAI } from '@/hooks/useOpenAI';

function ReportGenerator() {
  const { generateInBackground, getBackgroundTaskStatus, state } = useOpenAI();
  
  const handleGenerateReport = async () => {
    const response = await generateInBackground(
      "Generate a comprehensive market analysis report",
      "You are a market research analyst.",
      'gpt-4o',
      600 // 10 minutes
    );
    
    if (response.data?.backgroundTaskId) {
      // Poll for status
      const status = await getBackgroundTaskStatus(response.data.backgroundTaskId);
      console.log('Task status:', status);
    }
  };
  
  return (
    <div>
      <button onClick={handleGenerateReport} disabled={state.isLoading}>
        Generate Report
      </button>
    </div>
  );
}
```

### Reasoning Summary

```typescript
import { useOpenAI } from '@/hooks/useOpenAI';

function ProblemSolver() {
  const { generateWithReasoning, state } = useOpenAI();
  
  const handleSolveProblem = async () => {
    const response = await generateWithReasoning(
      "How can we improve student engagement in online learning?",
      "You are an educational consultant."
    );
    
    if (response.data?.reasoningSummary) {
      console.log('Reasoning summary:', response.data.reasoningSummary.summary);
      console.log('Key steps:', response.data.reasoningSummary.keySteps);
    }
  };
  
  return (
    <div>
      <button onClick={handleSolveProblem} disabled={state.isLoading}>
        Solve Problem
      </button>
      {state.response?.data?.reasoningSummary && (
        <div>
          <h3>Reasoning Process:</h3>
          <p>{state.response.data.reasoningSummary.summary}</p>
          <ul>
            {state.response.data.reasoningSummary.keySteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## Testing

A comprehensive test component is available at `src/components/OpenAIResponsesTestComponent.tsx` that demonstrates all the new features:

- Basic text generation
- Web search functionality
- File search capabilities
- Computer use features
- Reasoning summaries
- Background processing

## Backward Compatibility

The migration maintains backward compatibility:

- All existing code using `generateText()` and `generateJson()` will continue to work
- The original Chat Completions API is still available through the existing Edge Function
- New features are opt-in and don't affect existing functionality

## Edge Function Updates

A new Edge Function `openai-responses` has been created to handle the Responses API calls. The original `openai-chat` function remains available for backward compatibility.

## Configuration

The service configuration has been updated to include new defaults:

```typescript
const DEFAULT_CONFIG: OpenAIServiceConfig = {
  // ... existing config
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
```

## Best Practices

1. **Use Web Search for Current Information**: When you need up-to-date information, use `generateWithWebSearch()`

2. **Enable Reasoning for Complex Problems**: Use `generateWithReasoning()` for problems that require step-by-step thinking

3. **Use Background Mode for Long Tasks**: For tasks that might take more than a few minutes, use `generateInBackground()`

4. **Monitor Tool Usage**: Check the `toolsUsed` field in responses to understand what tools were utilized

5. **Handle Background Tasks**: Implement proper polling for background task status when using background mode

## Troubleshooting

### Common Issues

1. **Tool Not Available**: Some tools may not be available for all models. Check the model compatibility.

2. **Background Task Timeout**: Adjust the timeout value based on the complexity of your task.

3. **Rate Limits**: The Responses API may have different rate limits than the Chat Completions API.

### Debug Information

The enhanced response includes detailed debugging information:

```typescript
{
  data: {
    content: "Response content",
    toolsUsed: [
      {
        tool: "web_search",
        success: true,
        input: "search query",
        output: "search results"
      }
    ],
    reasoningSummary: {
      summary: "Brief summary of reasoning",
      keySteps: ["Step 1", "Step 2", "Step 3"],
      confidence: 0.95
    }
  }
}
```

## Next Steps

1. Test the new functionality using the test component
2. Gradually migrate existing code to use the new features where beneficial
3. Monitor usage and costs as the Responses API may have different pricing
4. Explore the specialized hooks for domain-specific use cases

For more information, refer to the [OpenAI Responses API documentation](https://platform.openai.com/docs/api-reference/responses).
