/**
 * Security Wrapper Component
 * Provides safe HTML rendering and XSS protection
 * Replaces dangerous dangerouslySetInnerHTML usage
 */

import React from 'react';
import DOMPurify from 'dompurify';

interface SecurityWrapperProps {
  /** HTML content to render safely */
  html: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to allow certain HTML tags */
  allowedTags?: string[];
  /** Whether to allow certain attributes */
  allowedAttributes?: string[];
}

/**
 * Safe HTML renderer that sanitizes content to prevent XSS attacks
 */
export const SafeHtmlRenderer: React.FC<SecurityWrapperProps> = React.memo(({
  html,
  className = '',
  allowedTags = ['p', 'br', 'strong', 'em', 'span', 'div'],
  allowedAttributes = ['class'],
}) => {
  const sanitizedHtml = React.useMemo(() => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: allowedAttributes,
      KEEP_CONTENT: true,
    });
  }, [html, allowedTags, allowedAttributes]);

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
});

SafeHtmlRenderer.displayName = 'SafeHtmlRenderer';

/**
 * QR Code fallback component that safely handles QR code display
 * Replaces the unsafe innerHTML usage in PaymentFieldRenderer
 */
export const QRCodeFallback: React.FC<{ message?: string }> = React.memo(({ 
  message = 'QR Code unavailable' 
}) => {
  return (
    <div className="text-xs text-gray-500 p-2 border border-gray-200 rounded">
      {message}
    </div>
  );
});

QRCodeFallback.displayName = 'QRCodeFallback';

/**
 * Hook for safe content handling
 */
export function useSafeContent() {
  const sanitizeHtml = React.useCallback((html: string, options?: {
    allowedTags?: string[];
    allowedAttributes?: string[];
  }) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: options?.allowedTags || ['p', 'br', 'strong', 'em', 'span'],
      ALLOWED_ATTR: options?.allowedAttributes || ['class'],
      KEEP_CONTENT: true,
    });
  }, []);

  const stripHtml = React.useCallback((html: string) => {
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
  }, []);

  return {
    sanitizeHtml,
    stripHtml,
  };
}
