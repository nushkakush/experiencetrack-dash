import { useEffect, useRef } from 'react';
import { appLifecycleLogger } from '@/lib/logging/AppLifecycleLogger';

export interface UseLifecycleLoggingOptions {
  componentName?: string;
  trackMount?: boolean;
  trackUnmount?: boolean;
  trackUpdates?: boolean;
  trackProps?: boolean;
  trackState?: boolean;
}

export function useLifecycleLogging(
  options: UseLifecycleLoggingOptions = {},
  props?: Record<string, any>,
  state?: Record<string, any>
) {
  const {
    componentName = 'Unknown',
    trackMount = true,
    trackUnmount = true,
    trackUpdates = false,
    trackProps = false,
    trackState = false
  } = options;

  const mountTime = useRef<number>(Date.now());
  const updateCount = useRef<number>(0);
  const prevProps = useRef<Record<string, any> | undefined>(props);
  const prevState = useRef<Record<string, any> | undefined>(state);

  // Track component mount
  useEffect(() => {
    if (trackMount) {
      appLifecycleLogger.logEvent('mount', {
        message: `Component ${componentName} mounted`,
        componentName,
        mountTime: mountTime.current,
        url: window.location.href
      }, componentName);
    }

    // Track component unmount
    return () => {
      if (trackUnmount) {
        const unmountTime = Date.now();
        const lifetime = unmountTime - mountTime.current;
        
        appLifecycleLogger.logEvent('unmount', {
          message: `Component ${componentName} unmounted`,
          componentName,
          mountTime: mountTime.current,
          unmountTime,
          lifetime,
          updateCount: updateCount.current,
          url: window.location.href
        }, componentName);
      }
    };
  }, [componentName, trackMount, trackUnmount]);

  // Track component updates
  useEffect(() => {
    if (!trackUpdates) return;

    updateCount.current += 1;
    
    const changedProps: Record<string, { old: any; new: any }> = {};
    const changedState: Record<string, { old: any; new: any }> = {};

    // Track prop changes
    if (trackProps && prevProps.current && props) {
      Object.keys(props).forEach(key => {
        if (prevProps.current![key] !== props[key]) {
          changedProps[key] = {
            old: prevProps.current![key],
            new: props[key]
          };
        }
      });
    }

    // Track state changes
    if (trackState && prevState.current && state) {
      Object.keys(state).forEach(key => {
        if (prevState.current![key] !== state[key]) {
          changedState[key] = {
            old: prevState.current![key],
            new: state[key]
          };
        }
      });
    }

    if (Object.keys(changedProps).length > 0 || Object.keys(changedState).length > 0) {
      appLifecycleLogger.logEvent('focus', {
        message: `Component ${componentName} updated`,
        componentName,
        updateCount: updateCount.current,
        changedProps: Object.keys(changedProps).length > 0 ? changedProps : undefined,
        changedState: Object.keys(changedState).length > 0 ? changedState : undefined,
        url: window.location.href
      }, componentName);
    }

    prevProps.current = props;
    prevState.current = state;
  });

  // Return utility functions
  return {
    logEvent: (type: 'mount' | 'unmount' | 'focus' | 'blur' | 'error' | 'warning', details: Record<string, any>) => {
      appLifecycleLogger.logEvent(type, {
        ...details,
        componentName,
        url: window.location.href
      }, componentName);
    },
    getUpdateCount: () => updateCount.current,
    getLifetime: () => Date.now() - mountTime.current
  };
}

// Hook for tracking route changes
export function useRouteLogging() {
  useEffect(() => {
    const handleRouteChange = () => {
      appLifecycleLogger.logEvent('mount', {
        message: 'Route changed',
        pathname: window.location.pathname,
        href: window.location.href,
        search: window.location.search,
        hash: window.location.hash
      }, 'Router');
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);
    
    // Listen for pushstate/replacestate (programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleRouteChange();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleRouteChange();
    };

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);
}

// Hook for tracking React Query events
export function useQueryLogging() {
  useEffect(() => {
    // This would need to be integrated with React Query's devtools or events
    // For now, we'll just log that the hook is active
    appLifecycleLogger.logEvent('mount', {
      message: 'Query logging hook activated',
      url: window.location.href
    }, 'QueryLogger');
  }, []);
}
