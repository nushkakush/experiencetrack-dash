export interface PerformanceEvent {
  name: string;
  timestamp: number;
  duration: number;
  metadata?: Record<string, any>;
}

export interface ErrorEvent {
  message: string;
  stack?: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

export interface UserInteractionEvent {
  type: 'click' | 'navigation' | 'form_submit' | 'api_call';
  element?: string;
  url: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

export interface ApiCallEvent {
  method: string;
  url: string;
  status: number;
  duration: number;
  timestamp: number;
  userId?: string;
  sessionId: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface MonitoringConfig {
  enabled: boolean;
  sampleRate: number; // 0-1, percentage of events to capture
  maxEventsPerSession: number;
  flushInterval: number; // milliseconds
  endpoint?: string;
  apiKey?: string;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private config: MonitoringConfig;
  private events: Array<PerformanceEvent | ErrorEvent | UserInteractionEvent | ApiCallEvent> = [];
  private sessionId: string;
  private flushTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private constructor() {
    this.config = {
      enabled: true,
      sampleRate: 1.0,
      maxEventsPerSession: 1000,
      flushInterval: 30000, // 30 seconds
    };
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize the performance monitor
   */
  initialize(config?: Partial<MonitoringConfig>): void {
    if (this.isInitialized) {
      return;
    }

    this.config = { ...this.config, ...config };
    this.isInitialized = true;

    // Start flush timer
    this.startFlushTimer();

    // Set up global error handler
    this.setupErrorHandling();

    // Set up performance observer
    this.setupPerformanceObserver();

    // Set up user interaction tracking
    this.setupUserInteractionTracking();

    Logger.getInstance().info('Performance monitor initialized');
  }

  /**
   * Track a performance event
   */
  trackPerformance(name: string, duration: number, metadata?: Record<string, any>): void {
    if (!this.shouldTrack()) return;

    const event: PerformanceEvent = {
      name,
      timestamp: Date.now(),
      duration,
      metadata,
    };

    this.addEvent(event);
  }

  /**
   * Track an error
   */
  trackError(error: Error, metadata?: Record<string, any>): void {
    if (!this.shouldTrack()) return;

    const event: ErrorEvent = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      userId: this.getUserId(),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      metadata,
    };

    this.addEvent(event);
  }

  /**
   * Track user interaction
   */
  trackUserInteraction(
    type: UserInteractionEvent['type'],
    element?: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.shouldTrack()) return;

    const event: UserInteractionEvent = {
      type,
      element,
      url: window.location.href,
      timestamp: Date.now(),
      userId: this.getUserId(),
      sessionId: this.sessionId,
      metadata,
    };

    this.addEvent(event);
  }

  /**
   * Track API call
   */
  trackApiCall(
    method: string,
    url: string,
    status: number,
    duration: number,
    error?: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.shouldTrack()) return;

    const event: ApiCallEvent = {
      method,
      url,
      status,
      duration,
      timestamp: Date.now(),
      userId: this.getUserId(),
      sessionId: this.sessionId,
      error,
      metadata,
    };

    this.addEvent(event);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    totalEvents: number;
    errorCount: number;
    averageApiResponseTime: number;
    slowestApiCalls: ApiCallEvent[];
    mostFrequentErrors: Array<{ message: string; count: number }>;
  } {
    const apiCalls = this.events.filter((e): e is ApiCallEvent => 'method' in e);
    const errors = this.events.filter((e): e is ErrorEvent => 'message' in e);

    const averageApiResponseTime = apiCalls.length > 0
      ? apiCalls.reduce((sum, call) => sum + call.duration, 0) / apiCalls.length
      : 0;

    const slowestApiCalls = [...apiCalls]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const errorCounts = errors.reduce((acc, error) => {
      acc[error.message] = (acc[error.message] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostFrequentErrors = Object.entries(errorCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: this.events.length,
      errorCount: errors.length,
      averageApiResponseTime,
      slowestApiCalls,
      mostFrequentErrors,
    };
  }

  /**
   * Flush events to monitoring service
   */
  async flush(): Promise<void> {
    if (this.events.length === 0 || !this.config.endpoint) {
      return;
    }

    try {
      const eventsToSend = [...this.events];
      this.events = [];

      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          events: eventsToSend,
        }),
      });

      Logger.getInstance().info(`Flushed ${eventsToSend.length} events to monitoring service`);
    } catch (error) {
      console.error('Failed to flush events:', error);
      // Restore events for retry
      this.events.unshift(...this.events);
    }
  }

  /**
   * Clear all events (useful for testing)
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Check if event should be tracked based on sample rate
   */
  private shouldTrack(): boolean {
    if (!this.config.enabled) return false;
    if (this.events.length >= this.config.maxEventsPerSession) return false;
    return Math.random() < this.config.sampleRate;
  }

  /**
   * Add event to the queue
   */
  private addEvent(event: PerformanceEvent | ErrorEvent | UserInteractionEvent | ApiCallEvent): void {
    this.events.push(event);

    // Flush if we have too many events
    if (this.events.length >= this.config.maxEventsPerSession) {
      this.flush();
    }
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Set up global error handling
   */
  private setupErrorHandling(): void {
    window.addEventListener('error', (event) => {
      this.trackError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), {
        type: 'unhandledrejection',
      });
    });
  }

  /**
   * Set up performance observer
   */
  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      // Observe navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.trackPerformance('page_load', navEntry.loadEventEnd - navEntry.loadEventStart, {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              firstPaint: navEntry.responseStart - navEntry.requestStart,
            });
          }
        });
      });

      navigationObserver.observe({ entryTypes: ['navigation'] });

      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.trackPerformance('resource_load', resourceEntry.duration, {
              name: resourceEntry.name,
              type: resourceEntry.initiatorType,
              size: resourceEntry.transferSize,
            });
          }
        });
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Set up user interaction tracking
   */
  private setupUserInteractionTracking(): void {
    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.trackUserInteraction('click', target.tagName.toLowerCase(), {
        className: target.className,
        id: target.id,
      });
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.trackUserInteraction('form_submit', form.tagName.toLowerCase(), {
        action: form.action,
        method: form.method,
      });
    });

    // Track navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      PerformanceMonitor.getInstance().trackUserInteraction('navigation', 'pushState', {
        url: args[2],
      });
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      PerformanceMonitor.getInstance().trackUserInteraction('navigation', 'replaceState', {
        url: args[2],
      });
    };
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user ID from auth context
   */
  private getUserId(): string | undefined {
    // This would typically get the user ID from your auth context
    // For now, return undefined
    return undefined;
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
