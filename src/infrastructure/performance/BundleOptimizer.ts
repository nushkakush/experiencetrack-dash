/**
 * Bundle Optimization Utilities
 * Tools for monitoring and optimizing bundle size and performance
 */

// Bundle analysis utilities
export class BundleAnalyzer {
  private static instance: BundleAnalyzer;
  private loadTimes = new Map<string, number>();
  private chunkSizes = new Map<string, number>();

  static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer();
    }
    return BundleAnalyzer.instance;
  }

  /**
   * Track component load time
   */
  trackLoadTime(componentName: string, startTime: number) {
    const loadTime = performance.now() - startTime;
    this.loadTimes.set(componentName, loadTime);
    
    // Log slow loading components
    if (loadTime > 1000) {
      console.warn(`Slow loading component: ${componentName} took ${loadTime.toFixed(2)}ms`);
    }
  }

  /**
   * Track chunk sizes
   */
  trackChunkSize(chunkName: string, size: number) {
    this.chunkSizes.set(chunkName, size);
    
    // Warn about large chunks
    if (size > 500 * 1024) { // 500KB
      console.warn(`Large chunk detected: ${chunkName} is ${(size / 1024).toFixed(2)}KB`);
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      loadTimes: Object.fromEntries(this.loadTimes),
      chunkSizes: Object.fromEntries(this.chunkSizes),
      averageLoadTime: Array.from(this.loadTimes.values()).reduce((a, b) => a + b, 0) / this.loadTimes.size,
      totalBundleSize: Array.from(this.chunkSizes.values()).reduce((a, b) => a + b, 0),
    };
  }

  /**
   * Report to console
   */
  report() {
    const metrics = this.getMetrics();
    console.group('Bundle Performance Report');
    console.log('Average Load Time:', `${metrics.averageLoadTime.toFixed(2)}ms`);
    console.log('Total Bundle Size:', `${(metrics.totalBundleSize / 1024 / 1024).toFixed(2)}MB`);
    console.log('Component Load Times:', metrics.loadTimes);
    console.log('Chunk Sizes:', Object.fromEntries(
      Object.entries(metrics.chunkSizes).map(([name, size]) => [name, `${(size / 1024).toFixed(2)}KB`])
    ));
    console.groupEnd();
  }
}

// Performance monitoring hook
export function usePerformanceMonitoring(componentName: string) {
  const startTime = React.useRef(performance.now());
  
  React.useEffect(() => {
    const analyzer = BundleAnalyzer.getInstance();
    analyzer.trackLoadTime(componentName, startTime.current);
  }, [componentName]);
}

// Tree shaking helpers
export const createOptimizedImport = <T>(
  importFn: () => Promise<{ default: T }>,
  componentName: string
) => {
  return React.lazy(async () => {
    const startTime = performance.now();
    const module = await importFn();
    
    BundleAnalyzer.getInstance().trackLoadTime(componentName, startTime);
    
    return module;
  });
};

// Webpack bundle analysis integration
declare global {
  interface Window {
    __WEBPACK_BUNDLE_ANALYZER__?: {
      getBundleStats: () => any;
    };
  }
}

export const getBundleStats = () => {
  if (window.__WEBPACK_BUNDLE_ANALYZER__) {
    return window.__WEBPACK_BUNDLE_ANALYZER__.getBundleStats();
  }
  return null;
};

// Dynamic import with error handling
export const safeDynamicImport = async <T>(
  importFn: () => Promise<T>,
  fallback?: T,
  retries = 3
): Promise<T> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await importFn();
    } catch (error) {
      console.warn(`Dynamic import failed (attempt ${attempt}/${retries}):`, error);
      
      if (attempt === retries) {
        if (fallback) {
          return fallback;
        }
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }
  
  throw new Error('All import attempts failed');
};

// Chunk preloading for critical routes
export const preloadCriticalChunks = () => {
  // Preload commonly used components
  const criticalImports = [
    () => import('@/components/ui/button'),
    () => import('@/components/ui/input'),
    () => import('@/components/ui/dialog'),
    () => import('@/shared/components/Dialog'),
  ];

  criticalImports.forEach(importFn => {
    importFn().catch(() => {}); // Silent fail
  });
};

// Resource hints for optimization
export const addResourceHints = () => {
  // DNS prefetch for external resources
  const dnsPrefetch = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];

  dnsPrefetch.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });

  // Preconnect to critical resources
  const preconnect = [
    'https://ghmpaghyasyllfvamfna.supabase.co',
  ];

  preconnect.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    document.head.appendChild(link);
  });
};

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Add performance observer for Core Web Vitals
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', entry.startTime);
        } else if (entry.entryType === 'first-input') {
          console.log('FID:', entry.processingStart - entry.startTime);
        }
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
  }

  // Monitor Cumulative Layout Shift
  let cumulativeLayoutShift = 0;
  if ('PerformanceObserver' in window) {
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          cumulativeLayoutShift += (entry as any).value;
        }
      }
      console.log('CLS:', cumulativeLayoutShift);
    });

    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }
}
