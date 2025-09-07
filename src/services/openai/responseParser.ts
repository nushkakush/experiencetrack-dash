/**
 * Utility for parsing OpenAI API responses
 * Handles different response formats and extracts content reliably
 */

interface OpenAIResponse {
  data?: {
    content?: any;
  };
}

interface ContentItem {
  type: string;
  text?: string;
  content?: ContentItem[];
}

/**
 * Extract text content from OpenAI response
 * Handles both array and string content formats
 */
export function extractContentText(response: OpenAIResponse): string {
  console.log('Raw OpenAI response:', response);
  console.log('Response data:', response.data);
  console.log('Response content:', response.data?.content);
  console.log('Response content type:', typeof response.data?.content);
  
  if (!response.data?.content) {
    throw new Error('No content in OpenAI response');
  }
  
  let contentText = '';
  
  if (Array.isArray(response.data.content)) {
    contentText = extractFromContentArray(response.data.content);
  } else if (typeof response.data.content === 'string') {
    contentText = response.data.content;
  } else {
    console.log('Unexpected content format:', response.data.content);
    throw new Error('Unexpected content format in response');
  }
  
  console.log('Extracted content text length:', contentText.length);
  console.log('First 200 chars of content:', contentText.substring(0, 200));
  
  return contentText;
}

/**
 * Extract text from content array format
 */
function extractFromContentArray(content: ContentItem[]): string {
  console.log('Content array items:', content.map(item => ({ 
    type: item.type, 
    hasText: !!item.text,
    hasContent: !!item.content,
    contentLength: item.content?.length || 0,
    textLength: item.text?.length || 0,
    textPreview: item.text?.substring(0, 100) || 'no text'
  })));
  
  // First try to find output_text items
  let contentText = content
    .filter(item => item.type === 'output_text')
    .map(item => item.text)
    .join('');
    
  // If no output_text found, look for message items with nested content
  if (!contentText) {
    console.log('No output_text found, looking for message items with nested content...');
    for (const item of content) {
      if (item.type === 'message' && item.content && Array.isArray(item.content)) {
        console.log('Found message item with nested content:', item.content.map(nested => ({
          type: nested.type,
          hasText: !!nested.text,
          textLength: nested.text?.length || 0
        })));
        
        // Extract text from nested content
        const nestedText = item.content
          .filter(nested => nested.type === 'output_text')
          .map(nested => nested.text)
          .join('');
          
        if (nestedText) {
          contentText = nestedText;
          break;
        }
      }
    }
  }
  
  // If still no content, try to get any text content from anywhere
  if (!contentText) {
    console.log('Still no content found, trying all possible text sources...');
    contentText = content
      .filter(item => item.text)
      .map(item => item.text)
      .join('');
  }
  
  return contentText;
}
