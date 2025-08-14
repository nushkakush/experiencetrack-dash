// Main logger
export { logger, LogLevel, debug, info, warn, error, critical } from './Logger';

// Lifecycle logger
export { appLifecycleLogger, AppLifecycleLogger } from './AppLifecycleLogger';
export type { LifecycleEvent } from './AppLifecycleLogger';

// Query logger
export { queryLogger, QueryLogger } from './QueryLogger';
export type { QueryEvent } from './QueryLogger';

// React hooks
export { useLifecycleLogging, useRouteLogging, useQueryLogging } from '@/hooks/useLifecycleLogging';
export type { UseLifecycleLoggingOptions } from '@/hooks/useLifecycleLogging';

// Debug components
export { LifecycleDebugPanel } from '@/components/debug/LifecycleDebugPanel';
export { DebugButton, FloatingDebugButton, InlineDebugButton } from '@/components/debug/DebugButton';

// Utility functions for debugging
export const debugUtils = {
  // Get all recent events from both loggers
  getAllRecentEvents: (seconds: number = 60) => {
    const lifecycleEvents = appLifecycleLogger.getRecentEvents(seconds);
    const queryEvents = queryLogger.getRecentEvents(seconds);
    return {
      lifecycle: lifecycleEvents,
      query: queryEvents,
      total: lifecycleEvents.length + queryEvents.length
    };
  },

  // Analyze potential reload causes
  analyzeReloadCauses: () => {
    appLifecycleLogger.analyzeReloadCauses();
    queryLogger.analyzeQueryPatterns();
  },

  // Export all logs
  exportAllLogs: () => {
    return {
      lifecycle: appLifecycleLogger.exportEvents(),
      query: queryLogger.exportEvents(),
      timestamp: new Date().toISOString()
    };
  },

  // Clear all logs
  clearAllLogs: () => {
    appLifecycleLogger.clearEvents();
    queryLogger.clearEvents();
  },

  // Get system information
  getSystemInfo: () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      memory: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null,
      timestamp: new Date().toISOString()
    };
  }
};
