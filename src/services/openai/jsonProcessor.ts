/**
 * Consolidated JSON processing utilities
 * Eliminates redundancy across multiple files
 */

/**
 * Clean and extract JSON from raw text content
 */
export function cleanAndExtractJSON(contentText: string): string {
  let cleanContent = contentText.trim();
  
  // Remove any introductory text that might come before JSON
  const jsonStart = cleanContent.indexOf('{');
  if (jsonStart !== -1) {
    cleanContent = cleanContent.substring(jsonStart);
  }
  
  // Look for JSON object starting with {
  if (cleanContent.indexOf('{') !== -1) {
    // Find the matching closing brace
    let braceCount = 0;
    let jsonEnd = -1;
    for (let i = 0; i < cleanContent.length; i++) {
      if (cleanContent[i] === '{') braceCount++;
      if (cleanContent[i] === '}') braceCount--;
      if (braceCount === 0) {
        jsonEnd = i;
        break;
      }
    }
    
    if (jsonEnd !== -1) {
      cleanContent = cleanContent.substring(0, jsonEnd + 1);
    }
  }
  
  // Remove markdown code blocks if still present
  if (cleanContent.startsWith('```json')) {
    cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  // Remove any remaining text after the JSON object
  const lastBrace = cleanContent.lastIndexOf('}');
  if (lastBrace !== -1) {
    cleanContent = cleanContent.substring(0, lastBrace + 1);
  }
  
  console.log('Cleaned content:', cleanContent);
  
  return cleanContent;
}

/**
 * Check if content contains AI refusal messages
 */
export function containsRefusalMessage(content: string): boolean {
  const lowerContent = content.toLowerCase();
  const refusalPatterns = [
    "i'm sorry",
    "i cannot",
    "i am unable",
    "sorry",
    "cannot provide",
    "unable to",
    "can't provide"
  ];
  
  return refusalPatterns.some(pattern => lowerContent.includes(pattern));
}

/**
 * Parse JSON with fallback extraction methods
 */
export function parseJSONWithFallback(cleanContent: string): any {
  // Check if the response contains an error message or refusal
  if (containsRefusalMessage(cleanContent)) {
    console.error('AI returned an error/refusal message:', cleanContent);
    throw new Error('AI returned a refusal message instead of JSON. This might be due to content policy restrictions or API limitations.');
  }
  
  // Try to parse JSON with better error handling
  try {
    return JSON.parse(cleanContent);
  } catch (parseError) {
    console.error('JSON parsing failed. Clean content:', cleanContent);
    console.error('Parse error:', parseError);
    
    // Try to extract JSON from the response more aggressively
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const result = JSON.parse(jsonMatch[0]);
        console.log('Successfully extracted JSON from response');
        return result;
      } catch (secondError) {
        console.error('Second JSON parse attempt failed:', secondError);
        throw new Error(`Failed to parse JSON response. Content: ${cleanContent.substring(0, 200)}...`);
      }
    } else {
      throw new Error(`No valid JSON found in response. Content: ${cleanContent.substring(0, 200)}...`);
    }
  }
}

/**
 * Validate that parsed object has required fields
 */
export function validateRequiredFields(obj: any, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !obj[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

/**
 * Process AI response and extract JSON with comprehensive error handling
 */
export function processAIResponse(
  response: { content: string; citations?: any[] },
  requiredFields: string[],
  operationName: string = 'AI response'
): any {
  try {
    const contentText = response.content;
    const cleanContent = cleanAndExtractJSON(contentText);
    
    if (!cleanContent) {
      throw new Error('No content extracted from response');
    }
    
    const parsed = parseJSONWithFallback(cleanContent);
    
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Response is not a single object');
    }

    // Validate required fields
    validateRequiredFields(parsed, requiredFields);

    // Add citations if available
    if (response.citations && response.citations.length > 0) {
      parsed.citations = response.citations.map(citation => ({
        index: citation.index,
        title: citation.title,
        url: citation.url,
        snippet: citation.snippet,
        publishedDate: citation.publishedDate,
        domain: citation.domain,
        source: 'ai_response'
      }));
    }

    // Add raw response for debugging
    parsed.rawResponse = response;

    return parsed;
  } catch (error) {
    console.error(`${operationName} parsing error:`, error);
    console.error('Raw response that failed to parse:', response);
    throw new Error(`Failed to parse ${operationName}: ${error.message}`);
  }
}
