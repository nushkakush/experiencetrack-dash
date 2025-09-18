/**
 * Console filter utilities for better debugging
 * Use these in browser console to filter logs
 */

export const consoleFilters = {
  /**
   * Filter to show only real-time sync logs
   * Usage: In browser console, run: filterRealtimeSyncLogs()
   */
  filterRealtimeSyncLogs: () => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args: any[]) => {
      if (args[0]?.includes?.('[REALTIME SYNC]') || 
          args[0]?.includes?.('[AUTO-SAVE]') || 
          args[0]?.includes?.('[FORM INPUT]') || 
          args[0]?.includes?.('[PROFILE EXTENDED]')) {
        originalLog(...args);
      }
    };

    console.error = (...args: any[]) => {
      if (args[0]?.includes?.('[REALTIME SYNC]') || 
          args[0]?.includes?.('[AUTO-SAVE]') || 
          args[0]?.includes?.('[FORM INPUT]') || 
          args[0]?.includes?.('[PROFILE EXTENDED]')) {
        originalError(...args);
      }
    };

    console.warn = (...args: any[]) => {
      if (args[0]?.includes?.('[REALTIME SYNC]') || 
          args[0]?.includes?.('[AUTO-SAVE]') || 
          args[0]?.includes?.('[FORM INPUT]') || 
          args[0]?.includes?.('[PROFILE EXTENDED]')) {
        originalWarn(...args);
      }
    };

    console.log('🔍 [CONSOLE FILTER] Real-time sync logs filter activated');
    console.log('🔍 [CONSOLE FILTER] Only showing logs with [REALTIME SYNC], [AUTO-SAVE], [FORM INPUT], or [PROFILE EXTENDED] tags');
  },

  /**
   * Reset console to show all logs
   * Usage: In browser console, run: resetConsoleFilters()
   */
  resetConsoleFilters: () => {
    // Reload the page to reset console
    window.location.reload();
  },

  /**
   * Show only error logs
   * Usage: In browser console, run: showOnlyErrors()
   */
  showOnlyErrors: () => {
    const originalLog = console.log;
    const originalWarn = console.warn;

    console.log = () => {};
    console.warn = () => {};

    console.log('🔍 [CONSOLE FILTER] Showing only error logs');
  },

  /**
   * Show only Meritto-related logs
   * Usage: In browser console, run: showOnlyMerittoLogs()
   */
  showOnlyMerittoLogs: () => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args: any[]) => {
      if (args.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('Meritto') || arg.includes('Merito') || arg.includes('merito'))
      )) {
        originalLog(...args);
      }
    };

    console.error = (...args: any[]) => {
      if (args.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('Meritto') || arg.includes('Merito') || arg.includes('merito'))
      )) {
        originalError(...args);
      }
    };

    console.warn = (...args: any[]) => {
      if (args.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('Meritto') || arg.includes('Merito') || arg.includes('merito'))
      )) {
        originalWarn(...args);
      }
    };

    console.log('🔍 [CONSOLE FILTER] Meritto logs filter activated');
  }
};

// Make filters available globally for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).filterRealtimeSyncLogs = consoleFilters.filterRealtimeSyncLogs;
  (window as any).resetConsoleFilters = consoleFilters.resetConsoleFilters;
  (window as any).showOnlyErrors = consoleFilters.showOnlyErrors;
  (window as any).showOnlyMerittoLogs = consoleFilters.showOnlyMerittoLogs;
}

export default consoleFilters;
