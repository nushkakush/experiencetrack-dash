/**
 * Retry utility for handling transient failures in AI generation
 */

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 2000
};

/**
 * Execute an async function with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = DEFAULT_RETRY_OPTIONS,
  operationName: string = 'operation'
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} of ${options.maxRetries} to ${operationName}`);
      return await operation();
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      lastError = error as Error;
      
      if (attempt === options.maxRetries) {
        throw new Error(`Failed to ${operationName} after ${options.maxRetries} attempts. Last error: ${lastError.message}`);
      }
      
      // Wait with progressive delay before retrying
      await new Promise(resolve => setTimeout(resolve, options.baseDelay * attempt));
    }
  }
  
  throw lastError || new Error(`Failed to ${operationName}`);
}
