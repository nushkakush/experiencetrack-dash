/**
 * Comprehensive Error Tracking System
 * Centralized error handling, logging, and monitoring
 */

import { Logger } from '@/lib/logging/Logger';

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface TrackedError {
  id: string;
  message: string;
  stack?: string;
  type: 'javascript' | 'api' | 'validation' | 'permission' | 'network' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: ErrorContext;
  fingerprint: string; // For grouping similar errors
  resolved: boolean;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  topErrors: Array<{
    message: string;
    count: number;
    lastSeen: string;
  }>;
  errorRate: number; // Errors per hour
  affectedUsers: number;
}

export class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: Map<string, TrackedError> = new Map();
  private logger = Logger.getInstance();
  private errorHandlers: Set<(error: TrackedError) => void> = new Set();

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers() {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError(event.error || new Error(event.message), {
        type: 'javascript',
        severity: 'high',
        context: {
          url: event.filename,
          component: 'Global',
          action: 'Unhandled Error',
        },
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), {
        type: 'javascript',
        severity: 'high',
        context: {
          component: 'Global',
          action: 'Unhandled Promise Rejection',
        },
      });
    });

    // Handle React error boundaries (if using React 18+)
    if (window.React && window.React.version.startsWith('18')) {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        if (args[0] && args[0].includes && args[0].includes('React')) {
          this.trackError(new Error(args.join(' ')), {
            type: 'javascript',
            severity: 'medium',
            context: {
              component: 'React',
              action: 'Component Error',
            },
          });
        }
        originalConsoleError.apply(console, args);
      };
    }
  }

  /**
   * Track an error
   */
  trackError(
    error: Error | string, 
    options: {
      type?: TrackedError['type'];
      severity?: TrackedError['severity'];
      context?: Partial<ErrorContext>;
      metadata?: Record<string, any>;
    } = {}
  ): string {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const fingerprint = this.generateFingerprint(errorObj, options.context);
    
    const context: ErrorContext = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...options.context,
      metadata: {
        ...options.metadata,
        browserInfo: this.getBrowserInfo(),
        deviceInfo: this.getDeviceInfo(),
      },
    };

    const existingError = this.errors.get(fingerprint);
    
    if (existingError) {
      // Update existing error
      existingError.occurrences++;
      existingError.lastSeen = context.timestamp;
      existingError.context = context; // Update with latest context
    } else {
      // Create new error record
      const trackedError: TrackedError = {
        id: this.generateId(),
        message: errorObj.message,
        stack: errorObj.stack,
        type: options.type || this.inferErrorType(errorObj),
        severity: options.severity || this.inferSeverity(errorObj),
        context,
        fingerprint,
        resolved: false,
        occurrences: 1,
        firstSeen: context.timestamp,
        lastSeen: context.timestamp,
      };

      this.errors.set(fingerprint, trackedError);
      
      // Notify error handlers
      this.errorHandlers.forEach(handler => {
        try {
          handler(trackedError);
        } catch (handlerError) {
          console.error('Error handler failed:', handlerError);
        }
      });
    }

    // Log to console and external logger
    this.logger.error(`[ErrorTracker] ${errorObj.message}`, {
      error: errorObj,
      context,
      fingerprint,
    });

    // Send to external monitoring service (e.g., Sentry, LogRocket)
    this.sendToExternalService(this.errors.get(fingerprint)!);

    return fingerprint;
  }

  /**
   * Track API errors
   */
  trackApiError(
    endpoint: string,
    status: number,
    message: string,
    context: Partial<ErrorContext> = {}
  ): string {
    return this.trackError(new Error(`API Error: ${message}`), {
      type: 'api',
      severity: status >= 500 ? 'high' : 'medium',
      context: {
        ...context,
        action: `API ${endpoint}`,
        metadata: {
          endpoint,
          status,
          ...context.metadata,
        },
      },
    });
  }

  /**
   * Track validation errors
   */
  trackValidationError(
    field: string,
    message: string,
    value?: any,
    context: Partial<ErrorContext> = {}
  ): string {
    return this.trackError(new Error(`Validation Error: ${message}`), {
      type: 'validation',
      severity: 'low',
      context: {
        ...context,
        action: `Validation ${field}`,
        metadata: {
          field,
          value,
          ...context.metadata,
        },
      },
    });
  }

  /**
   * Track permission errors
   */
  trackPermissionError(
    action: string,
    resource: string,
    context: Partial<ErrorContext> = {}
  ): string {
    return this.trackError(new Error(`Permission denied: ${action} on ${resource}`), {
      type: 'permission',
      severity: 'medium',
      context: {
        ...context,
        action: `Permission ${action}`,
        metadata: {
          resource,
          ...context.metadata,
        },
      },
    });
  }

  /**
   * Get error statistics
   */
  getErrorStats(timeframe = '24h'): ErrorStats {
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeframe) {
      case '1h':
        cutoff.setHours(now.getHours() - 1);
        break;
      case '24h':
        cutoff.setDate(now.getDate() - 1);
        break;
      case '7d':
        cutoff.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoff.setDate(now.getDate() - 30);
        break;
    }

    const recentErrors = Array.from(this.errors.values()).filter(
      error => new Date(error.lastSeen) > cutoff
    );

    const errorsByType = recentErrors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + error.occurrences;
      return acc;
    }, {} as Record<string, number>);

    const errorsBySeverity = recentErrors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + error.occurrences;
      return acc;
    }, {} as Record<string, number>);

    const topErrors = recentErrors
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 10)
      .map(error => ({
        message: error.message,
        count: error.occurrences,
        lastSeen: error.lastSeen,
      }));

    const totalOccurrences = recentErrors.reduce((sum, error) => sum + error.occurrences, 0);
    const hours = timeframe === '1h' ? 1 : timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720;
    const errorRate = totalOccurrences / hours;

    const affectedUsers = new Set(
      recentErrors.map(error => error.context.userId).filter(Boolean)
    ).size;

    return {
      totalErrors: totalOccurrences,
      errorsByType,
      errorsBySeverity,
      topErrors,
      errorRate,
      affectedUsers,
    };
  }

  /**
   * Get all errors with pagination
   */
  getErrors(
    page = 1,
    limit = 50,
    filters: {
      type?: TrackedError['type'];
      severity?: TrackedError['severity'];
      resolved?: boolean;
      search?: string;
    } = {}
  ): { errors: TrackedError[]; total: number; page: number; pages: number } {
    let filteredErrors = Array.from(this.errors.values());

    // Apply filters
    if (filters.type) {
      filteredErrors = filteredErrors.filter(error => error.type === filters.type);
    }

    if (filters.severity) {
      filteredErrors = filteredErrors.filter(error => error.severity === filters.severity);
    }

    if (filters.resolved !== undefined) {
      filteredErrors = filteredErrors.filter(error => error.resolved === filters.resolved);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filteredErrors = filteredErrors.filter(error => 
        error.message.toLowerCase().includes(search) ||
        error.context.component?.toLowerCase().includes(search)
      );
    }

    // Sort by last seen (most recent first)
    filteredErrors.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

    const total = filteredErrors.length;
    const pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      errors: filteredErrors.slice(start, end),
      total,
      page,
      pages,
    };
  }

  /**
   * Mark error as resolved
   */
  resolveError(fingerprint: string): boolean {
    const error = this.errors.get(fingerprint);
    if (error) {
      error.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Add error handler
   */
  addErrorHandler(handler: (error: TrackedError) => void): () => void {
    this.errorHandlers.add(handler);
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors.clear();
  }

  // Private helper methods
  private generateFingerprint(error: Error, context?: Partial<ErrorContext>): string {
    const key = `${error.message}-${context?.component || ''}-${context?.action || ''}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private inferErrorType(error: Error): TrackedError['type'] {
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'network';
    }
    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      return 'permission';
    }
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return 'validation';
    }
    return 'javascript';
  }

  private inferSeverity(error: Error): TrackedError['severity'] {
    if (error.message.includes('critical') || error.message.includes('fatal')) {
      return 'critical';
    }
    if (error.message.includes('warning') || error.message.includes('validation')) {
      return 'low';
    }
    return 'medium';
  }

  private getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
    };
  }

  private getDeviceInfo() {
    return {
      screenWidth: screen.width,
      screenHeight: screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  private sendToExternalService(error: TrackedError): void {
    // Integration point for external monitoring services
    // e.g., Sentry, LogRocket, DataDog, etc.
    
    if (process.env.NODE_ENV === 'production') {
      // Example Sentry integration
      // Sentry.captureException(new Error(error.message), {
      //   contexts: {
      //     error: error.context,
      //   },
      //   fingerprint: [error.fingerprint],
      // });
      
      console.log('Would send to external service:', error);
    }
  }
}

// Global error tracker instance
export const errorTracker = ErrorTracker.getInstance();

// React Error Boundary HOC
export const withErrorTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const ErrorBoundary = React.Component as any;
    
    class TrackedErrorBoundary extends ErrorBoundary {
      componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        errorTracker.trackError(error, {
          type: 'javascript',
          severity: 'high',
          context: {
            component: componentName || Component.displayName || Component.name,
            action: 'Component Render',
            metadata: {
              componentStack: errorInfo.componentStack,
            },
          },
        });
      }

      render() {
        return React.createElement(Component, { ...props, ref });
      }
    }

    return React.createElement(TrackedErrorBoundary);
  });
};
