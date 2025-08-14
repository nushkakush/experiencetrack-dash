import { logger, LogLevel } from './Logger';

export interface LifecycleEvent {
  type: 'mount' | 'unmount' | 'focus' | 'blur' | 'visibility_change' | 'beforeunload' | 'error' | 'warning';
  timestamp: string;
  details: Record<string, any>;
  componentName?: string;
  route?: string;
}

export class AppLifecycleLogger {
  private static instance: AppLifecycleLogger;
  private events: LifecycleEvent[] = [];
  private maxEvents: number = 500;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): AppLifecycleLogger {
    if (!AppLifecycleLogger.instance) {
      AppLifecycleLogger.instance = new AppLifecycleLogger();
    }
    return AppLifecycleLogger.instance;
  }

  initialize(): void {
    if (this.isInitialized) return;
    
    this.setupGlobalEventListeners();
    this.setupPerformanceMonitoring();
    this.setupErrorTracking();
    this.setupMemoryMonitoring();
    
    this.isInitialized = true;
    this.logEvent('mount', { message: 'AppLifecycleLogger initialized' });
  }

  private setupGlobalEventListeners(): void {
    // Focus/Blur events
    window.addEventListener('focus', () => {
      this.logEvent('focus', { 
        message: 'Window gained focus',
        url: window.location.href,
        timestamp: Date.now()
      });
    });

    window.addEventListener('blur', () => {
      this.logEvent('blur', { 
        message: 'Window lost focus',
        url: window.location.href,
        timestamp: Date.now()
      });
    });

    // Visibility change events
    document.addEventListener('visibilitychange', () => {
      this.logEvent('visibility_change', {
        message: 'Document visibility changed',
        hidden: document.hidden,
        visibilityState: document.visibilityState,
        url: window.location.href,
        timestamp: Date.now()
      });
    });

    // Before unload events
    window.addEventListener('beforeunload', (event) => {
      this.logEvent('beforeunload', {
        message: 'Page is about to unload',
        url: window.location.href,
        timestamp: Date.now()
      });
    });

    // Page show/hide events
    window.addEventListener('pageshow', (event) => {
      this.logEvent('mount', {
        message: 'Page shown',
        persisted: event.persisted,
        url: window.location.href,
        timestamp: Date.now(),
        isReload: !event.persisted // This indicates a true reload vs back/forward navigation
      });
    });

    window.addEventListener('pagehide', (event) => {
      this.logEvent('unmount', {
        message: 'Page hidden',
        persisted: event.persisted,
        url: window.location.href,
        timestamp: Date.now()
      });
    });

    // Online/Offline events
    window.addEventListener('online', () => {
      this.logEvent('mount', {
        message: 'Browser went online',
        url: window.location.href,
        timestamp: Date.now()
      });
    });

    window.addEventListener('offline', () => {
      this.logEvent('unmount', {
        message: 'Browser went offline',
        url: window.location.href,
        timestamp: Date.now()
      });
    });

    // Resize events (might indicate tab switching)
    let resizeTimeout: NodeJS.Timeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.logEvent('focus', {
          message: 'Window resized (potential tab switch)',
          width: window.innerWidth,
          height: window.innerHeight,
          url: window.location.href,
          timestamp: Date.now()
        });
      }, 100);
    });
  }

  private setupPerformanceMonitoring(): void {
    // Monitor navigation timing
    if ('performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.logEvent('mount', {
              message: 'Navigation timing recorded',
              type: navEntry.type,
              loadEventEnd: navEntry.loadEventEnd,
              domContentLoadedEventEnd: navEntry.domContentLoadedEventEnd,
              url: window.location.href,
              timestamp: Date.now()
            });
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['navigation'] });
      } catch (error) {
        logger.warn('PerformanceObserver not supported', { error });
      }
    }

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
          this.logEvent('warning', {
            message: 'High memory usage detected',
            usedJSHeapSize: memory.usedJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
            totalJSHeapSize: memory.totalJSHeapSize,
            url: window.location.href,
            timestamp: Date.now()
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private setupErrorTracking(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logEvent('error', {
        message: 'Global error occurred',
        error: event.error?.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        url: window.location.href,
        timestamp: Date.now()
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logEvent('error', {
        message: 'Unhandled promise rejection',
        reason: event.reason,
        url: window.location.href,
        timestamp: Date.now()
      });
    });
  }

  private setupMemoryMonitoring(): void {
    // Monitor for potential memory leaks
    let lastMemoryUsage = 0;
    
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const currentUsage = memory.usedJSHeapSize;
        
        if (lastMemoryUsage > 0) {
          const increase = currentUsage - lastMemoryUsage;
          const increaseMB = increase / (1024 * 1024);
          
          if (increaseMB > 10) { // More than 10MB increase
            this.logEvent('warning', {
              message: 'Significant memory increase detected',
              increaseMB: Math.round(increaseMB * 100) / 100,
              currentUsageMB: Math.round(currentUsage / (1024 * 1024) * 100) / 100,
              url: window.location.href,
              timestamp: Date.now()
            });
          }
        }
        
        lastMemoryUsage = currentUsage;
      }
    }, 60000); // Check every minute
  }

  logEvent(type: LifecycleEvent['type'], details: Record<string, any>, componentName?: string): void {
    const event: LifecycleEvent = {
      type,
      timestamp: new Date().toISOString(),
      details,
      componentName,
      route: window.location.pathname
    };

    this.events.push(event);
    
    // Keep only the last maxEvents entries
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console with appropriate level
    const logMessage = `[LIFECYCLE] ${type.toUpperCase()}: ${details.message || 'Event occurred'}`;
    const logContext = {
      ...details,
      componentName,
      route: window.location.pathname,
      url: window.location.href
    };

    switch (type) {
      case 'error':
        logger.error(logMessage, logContext);
        break;
      case 'warning':
        logger.warn(logMessage, logContext);
        break;
      case 'mount':
      case 'focus':
        logger.info(logMessage, logContext);
        break;
      case 'unmount':
      case 'blur':
        logger.debug(logMessage, logContext);
        break;
      default:
        logger.debug(logMessage, logContext);
    }
  }

  getEvents(type?: LifecycleEvent['type']): LifecycleEvent[] {
    if (type) {
      return this.events.filter(event => event.type === type);
    }
    return [...this.events];
  }

  getRecentEvents(seconds: number = 60): LifecycleEvent[] {
    const cutoff = new Date(Date.now() - seconds * 1000);
    return this.events.filter(event => new Date(event.timestamp) > cutoff);
  }

  clearEvents(): void {
    this.events = [];
  }

  exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }

  // Debug method to check for potential reload causes
  analyzeReloadCauses(): void {
    const recentEvents = this.getRecentEvents(300); // Last 5 minutes
    const focusEvents = recentEvents.filter(e => e.type === 'focus');
    const blurEvents = recentEvents.filter(e => e.type === 'blur');
    const mountEvents = recentEvents.filter(e => e.type === 'mount');
    const errorEvents = recentEvents.filter(e => e.type === 'error');

    logger.info('Reload Analysis', {
      totalEvents: recentEvents.length,
      focusEvents: focusEvents.length,
      blurEvents: blurEvents.length,
      mountEvents: mountEvents.length,
      errorEvents: errorEvents.length,
      timeRange: '5 minutes'
    });

    if (mountEvents.length > 3) {
      logger.warn('Multiple mount events detected - possible reloads', {
        mountCount: mountEvents.length,
        mountEvents: mountEvents.map(e => ({ timestamp: e.timestamp, details: e.details }))
      });
    }

    if (errorEvents.length > 0) {
      logger.error('Errors detected that might cause reloads', {
        errorCount: errorEvents.length,
        errors: errorEvents.map(e => ({ timestamp: e.timestamp, details: e.details }))
      });
    }

    // Check for React StrictMode double-invocation pattern
    this.detectStrictModePattern(recentEvents);
  }

  private detectStrictModePattern(events: LifecycleEvent[]): void {
    const mountEvents = events.filter(e => e.type === 'mount' && e.componentName);
    const componentMounts: Record<string, number> = {};
    
    mountEvents.forEach(event => {
      const componentName = event.componentName!;
      componentMounts[componentName] = (componentMounts[componentName] || 0) + 1;
    });

    const suspiciousComponents = Object.entries(componentMounts)
      .filter(([_, count]) => count > 2)
      .map(([name, count]) => ({ name, count }));

    if (suspiciousComponents.length > 0) {
      logger.warn('Potential React StrictMode double-invocation detected', {
        suspiciousComponents,
        message: 'Components mounting multiple times in quick succession - this is normal in development with StrictMode'
      });
    }

    // Check for very short component lifetimes (indicating immediate unmount/remount)
    const unmountEvents = events.filter(e => e.type === 'unmount' && e.componentName);
    const shortLivedComponents = unmountEvents
      .filter(event => {
        const lifetime = event.details.lifetime;
        return lifetime && lifetime < 50; // Less than 50ms lifetime
      })
      .map(event => ({
        component: event.componentName,
        lifetime: event.details.lifetime
      }));

    if (shortLivedComponents.length > 0) {
      logger.info('Short-lived components detected (normal in StrictMode)', {
        shortLivedComponents,
        message: 'These are likely React StrictMode double-invocations in development'
      });
    }
  }
}

export const appLifecycleLogger = AppLifecycleLogger.getInstance();
