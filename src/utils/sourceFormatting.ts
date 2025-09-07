import React from 'react';

/**
 * Utility functions for formatting sources in magic briefs
 */

/**
 * Parses source text and converts both markdown-style links and inline citations to clickable elements
 * Example: ([reuters.com](https://www.reuters.com/...)) becomes a styled link
 * Example: [1], [2], [3] become clickable citations that link to structured sources
 */
export const formatSources = (text: string, citations?: Array<{ index: number; title: string; url: string }>): React.ReactNode => {
  if (!text) return text;

  // Regular expression to match markdown-style links
  // Matches: ([text](url)) or [text](url) with optional extra parentheses
  const linkRegex = /(?:\(\[([^\]]+)\]\(([^)]+)\)\)|\[([^\]]+)\]\(([^)]+)\))/g;
  
  // Regular expression to match inline citations like [1], [2], [3]
  const citationRegex = /\[(\d+)\]/g;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // First, handle markdown-style links
  while ((match = linkRegex.exec(text)) !== null) {
    const [fullMatch, linkText1, url1, linkText2, url2] = match;
    const startIndex = match.index;
    
    // Determine which pattern matched and extract the correct text and URL
    const linkText = linkText1 || linkText2;
    const url = url1 || url2;
    
    // Add text before the match
    if (startIndex > lastIndex) {
      parts.push(text.slice(lastIndex, startIndex));
    }
    
    // Add the formatted link
    parts.push(
      React.createElement('a', {
        key: startIndex,
        href: url,
        target: '_blank',
        rel: 'noopener noreferrer',
        className: 'inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline decoration-1 underline-offset-2 hover:decoration-2 transition-all duration-200 font-medium'
      }, [
        linkText,
        React.createElement('svg', {
          key: 'icon',
          className: 'w-3 h-3',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          xmlns: 'http://www.w3.org/2000/svg'
        }, React.createElement('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2,
          d: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
        }))
      ])
    );
    
    lastIndex = startIndex + fullMatch.length;
  }
  
  // Add remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  // If we have structured citations, process inline citations in the final text
  if (citations && citations.length > 0) {
    const finalText = parts.length > 1 ? parts.join('') : text;
    return formatInlineCitations(finalText, citations);
  }
  
  return parts.length > 1 ? parts : text;
};

/**
 * Formats inline citations [1], [2], [3] as clickable elements that link to structured sources
 */
const formatInlineCitations = (text: string, citations: Array<{ index: number; title: string; url: string }>): React.ReactNode => {
  const citationRegex = /\[(\d+)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    const [fullMatch, citationNumber] = match;
    const startIndex = match.index;
    const citationIndex = parseInt(citationNumber, 10);
    
    // Find the corresponding citation by index (1-based)
    const citation = citations.find(c => c.index === citationIndex);
    
    // Add text before the match
    if (startIndex > lastIndex) {
      parts.push(text.slice(lastIndex, startIndex));
    }
    
    // Add the formatted citation
    if (citation) {
      parts.push(
        React.createElement('a', {
          key: startIndex,
          href: citation.url,
          target: '_blank',
          rel: 'noopener noreferrer',
          className: 'inline-flex items-center gap-1 text-primary hover:text-primary/80 underline decoration-1 underline-offset-2 hover:decoration-2 transition-all duration-200 font-medium bg-primary/10 hover:bg-primary/20 px-1 py-0.5 rounded text-xs'
        }, [
          `[${citationNumber}]`,
          React.createElement('svg', {
            key: 'icon',
            className: 'w-3 h-3',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24',
            xmlns: 'http://www.w3.org/2000/svg'
          }, React.createElement('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
          }))
        ])
      );
    } else {
      // If citation not found, just show the number
      parts.push(
        React.createElement('span', {
          key: startIndex,
          className: 'text-muted-foreground text-xs'
        }, `[${citationNumber}]`)
      );
    }
    
    lastIndex = startIndex + fullMatch.length;
  }
  
  // Add remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length > 1 ? parts : text;
};

/**
 * Extracts all sources from text and returns them as an array
 */
export const extractSources = (text: string): Array<{ text: string; url: string }> => {
  if (!text) return [];
  
  const linkRegex = /(?:\(\[([^\]]+)\]\(([^)]+)\)\)|\[([^\]]+)\]\(([^)]+)\))/g;
  const sources: Array<{ text: string; url: string }> = [];
  let match;
  
  while ((match = linkRegex.exec(text)) !== null) {
    const [, linkText1, url1, linkText2, url2] = match;
    const linkText = linkText1 || linkText2;
    const url = url1 || url2;
    sources.push({ text: linkText, url });
  }
  
  return sources;
};

/**
 * Formats sources as a clean list with proper styling
 */
export const formatSourcesList = (text: string): React.ReactNode => {
  const sources = extractSources(text);
  
  if (sources.length === 0) return null;
  
  return React.createElement('div', {
    className: 'mt-4 p-3 bg-gray-50 rounded-lg border'
  }, [
    React.createElement('h4', {
      key: 'title',
      className: 'text-sm font-semibold text-gray-700 mb-2'
    }, 'Sources:'),
    React.createElement('div', {
      key: 'sources',
      className: 'space-y-1'
    }, sources.map((source, index) => 
      React.createElement('div', {
        key: index,
        className: 'flex items-center gap-2'
      }, [
        React.createElement('span', {
          key: 'bullet',
          className: 'text-gray-500 text-sm'
        }, '•'),
        React.createElement('a', {
          key: 'link',
          href: source.url,
          target: '_blank',
          rel: 'noopener noreferrer',
          className: 'text-blue-600 hover:text-blue-800 underline decoration-1 underline-offset-2 hover:decoration-2 transition-all duration-200 font-medium text-sm'
        }, source.text),
        React.createElement('svg', {
          key: 'icon',
          className: 'w-3 h-3 text-gray-400',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          xmlns: 'http://www.w3.org/2000/svg'
        }, React.createElement('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2,
          d: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
        }))
      ])
    ))
  ]);
};
