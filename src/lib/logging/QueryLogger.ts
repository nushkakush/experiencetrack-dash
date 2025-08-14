import { logger } from './Logger';
import { appLifecycleLogger } from './AppLifecycleLogger';

export interface QueryEvent {
  type: 'query_start' | 'query_success' | 'query_error' | 'query_invalidate' | 'query_refetch' | 'mutation_start' | 'mutation_success' | 'mutation_error';
  queryKey: string;
  timestamp: string;
  details: Record<string, any>;
}

export class QueryLogger {
  private static instance: QueryLogger;
  private events: QueryEvent[] = [];
  private maxEvents: number = 200;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): QueryLogger {
    if (!QueryLogger.instance) {
      QueryLogger.instance = new QueryLogger();
    }
    return QueryLogger.instance;
  }

  initialize(): void {
    if (this.isInitialized) return;
    
    this.setupQueryMonitoring();
    this.isInitialized = true;
    
    logger.info('QueryLogger initialized');
  }

  private setupQueryMonitoring(): void {
    // Monitor for potential query-related issues that might cause reloads
    if (typeof window !== 'undefined') {
      // Monitor for network status changes
      window.addEventListener('online', () => {
        this.logQueryEvent('query_refetch', 'network_online', {
          message: 'Network came online - queries may refetch',
          networkType: navigator.connection?.effectiveType || 'unknown'
        });
      });

      window.addEventListener('offline', () => {
        this.logQueryEvent('query_error', 'network_offline', {
          message: 'Network went offline - queries may fail',
          networkType: navigator.connection?.effectiveType || 'unknown'
        });
      });

      // Monitor for storage quota issues
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
          if (estimate.usage && estimate.quota) {
            const usagePercent = (estimate.usage / estimate.quota) * 100;
            if (usagePercent > 80) {
              this.logQueryEvent('query_error', 'storage_quota', {
                message: 'Storage quota nearly full',
                usage: estimate.usage,
                quota: estimate.quota,
                usagePercent: Math.round(usagePercent)
              });
            }
          }
        });
      }
    }
  }

  logQueryEvent(
    type: QueryEvent['type'], 
    queryKey: string, 
    details: Record<string, any>
  ): void {
    const event: QueryEvent = {
      type,
      queryKey,
      timestamp: new Date().toISOString(),
      details: {
        ...details,
        url: window.location.href,
        route: window.location.pathname
      }
    };

    this.events.push(event);
    
    // Keep only the last maxEvents entries
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to lifecycle logger as well
    const lifecycleType = type.includes('error') ? 'error' : 
                         type.includes('success') ? 'focus' : 'mount';
    
    appLifecycleLogger.logEvent(lifecycleType, {
      message: `Query event: ${type}`,
      queryKey,
      ...details
    }, 'QueryLogger');

    // Log to console with appropriate level
    const logMessage = `[QUERY] ${type.toUpperCase()}: ${queryKey}`;
    
    if (type.includes('error')) {
      logger.error(logMessage, details);
    } else if (type.includes('success')) {
      logger.info(logMessage, details);
    } else {
      logger.debug(logMessage, details);
    }
  }

  // Method to be called from React Query hooks
  logQueryStart(queryKey: string, options?: Record<string, any>): void {
    this.logQueryEvent('query_start', queryKey, {
      message: 'Query started',
      options,
      timestamp: Date.now()
    });
  }

  logQuerySuccess(queryKey: string, data: any, options?: Record<string, any>): void {
    this.logQueryEvent('query_success', queryKey, {
      message: 'Query succeeded',
      dataSize: data ? JSON.stringify(data).length : 0,
      options,
      timestamp: Date.now()
    });
  }

  logQueryError(queryKey: string, error: Error, options?: Record<string, any>): void {
    this.logQueryEvent('query_error', queryKey, {
      message: 'Query failed',
      error: error.message,
      errorStack: error.stack,
      options,
      timestamp: Date.now()
    });
  }

  logQueryInvalidate(queryKey: string, reason?: string): void {
    this.logQueryEvent('query_invalidate', queryKey, {
      message: 'Query invalidated',
      reason,
      timestamp: Date.now()
    });
  }

  logQueryRefetch(queryKey: string, reason?: string): void {
    this.logQueryEvent('query_refetch', queryKey, {
      message: 'Query refetched',
      reason,
      timestamp: Date.now()
    });
  }

  logMutationStart(mutationKey: string, variables?: any): void {
    this.logQueryEvent('mutation_start', mutationKey, {
      message: 'Mutation started',
      variables,
      timestamp: Date.now()
    });
  }

  logMutationSuccess(mutationKey: string, data: any): void {
    this.logQueryEvent('mutation_success', mutationKey, {
      message: 'Mutation succeeded',
      dataSize: data ? JSON.stringify(data).length : 0,
      timestamp: Date.now()
    });
  }

  logMutationError(mutationKey: string, error: Error): void {
    this.logQueryEvent('mutation_error', mutationKey, {
      message: 'Mutation failed',
      error: error.message,
      errorStack: error.stack,
      timestamp: Date.now()
    });
  }

  getEvents(type?: QueryEvent['type']): QueryEvent[] {
    if (type) {
      return this.events.filter(event => event.type === type);
    }
    return [...this.events];
  }

  getRecentEvents(seconds: number = 60): QueryEvent[] {
    const cutoff = new Date(Date.now() - seconds * 1000);
    return this.events.filter(event => new Date(event.timestamp) > cutoff);
  }

  clearEvents(): void {
    this.events = [];
  }

  exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }

  // Analyze query patterns that might cause reloads
  analyzeQueryPatterns(): void {
    const recentEvents = this.getRecentEvents(300); // Last 5 minutes
    const errorEvents = recentEvents.filter(e => e.type.includes('error'));
    const refetchEvents = recentEvents.filter(e => e.type === 'query_refetch');
    const invalidateEvents = recentEvents.filter(e => e.type === 'query_invalidate');

    logger.info('Query Pattern Analysis', {
      totalEvents: recentEvents.length,
      errorEvents: errorEvents.length,
      refetchEvents: refetchEvents.length,
      invalidateEvents: invalidateEvents.length,
      timeRange: '5 minutes'
    });

    if (errorEvents.length > 5) {
      logger.warn('High number of query errors detected', {
        errorCount: errorEvents.length,
        errors: errorEvents.map(e => ({ queryKey: e.queryKey, details: e.details }))
      });
    }

    if (refetchEvents.length > 10) {
      logger.warn('High number of query refetches detected', {
        refetchCount: refetchEvents.length,
        refetches: refetchEvents.map(e => ({ queryKey: e.queryKey, details: e.details }))
      });
    }

    // Check for patterns in query keys that might indicate problematic queries
    const queryKeyFrequency: Record<string, number> = {};
    recentEvents.forEach(event => {
      queryKeyFrequency[event.queryKey] = (queryKeyFrequency[event.queryKey] || 0) + 1;
    });

    const frequentQueries = Object.entries(queryKeyFrequency)
      .filter(([_, count]) => count > 5)
      .sort(([_, a], [__, b]) => b - a);

    if (frequentQueries.length > 0) {
      logger.warn('Frequently called queries detected', {
        frequentQueries: frequentQueries.slice(0, 5)
      });
    }
  }
}

export const queryLogger = QueryLogger.getInstance();
