import React from 'react';

/**
 * Utility functions for formatting sources in magic briefs
 */

/**
 * Parses source text and converts markdown-style links to clickable elements
 * Example: ([reuters.com](https://www.reuters.com/...)) becomes a styled link
 */
export const formatSources = (text: string): React.ReactNode => {
  if (!text) return text;

  // Regular expression to match markdown-style links
  // Matches: ([text](url)) or [text](url) with optional extra parentheses
  const linkRegex = /(?:\(\[([^\]]+)\]\(([^)]+)\)\)|\[([^\]]+)\]\(([^)]+)\))/g;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

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
