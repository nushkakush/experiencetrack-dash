import { lazy, ComponentType, Suspense } from 'react';

export interface LazyComponentConfig {
  name: string;
  importPath: string;
  fallback?: React.ComponentType;
  preload?: boolean;
}

export interface CodeSplittingConfig {
  components: LazyComponentConfig[];
  routes: Array<{
    path: string;
    component: LazyComponentConfig;
    preload?: boolean;
  }>;
  chunks: Array<{
    name: string;
    components: string[];
  }>;
}

export class CodeSplittingManager {
  private static instance: CodeSplittingManager;
  private lazyComponents: Map<string, ComponentType<any>> = new Map();
  private loadedComponents: Set<string> = new Set();
  private preloadedComponents: Set<string> = new Set();

  private constructor() {}

  static getInstance(): CodeSplittingManager {
    if (!CodeSplittingManager.instance) {
      CodeSplittingManager.instance = new CodeSplittingManager();
    }
    return CodeSplittingManager.instance;
  }

  /**
   * Create a lazy component with error boundary and loading state
   */
  createLazyComponent(config: LazyComponentConfig): ComponentType<any> {
    if (this.lazyComponents.has(config.name)) {
      return this.lazyComponents.get(config.name)!;
    }

    const LazyComponent = lazy(() => 
      import(/* webpackChunkName: "[request]" */ `${config.importPath}`)
        .then(module => {
          this.loadedComponents.add(config.name);
          return module;
        })
        .catch(error => {
          console.error(`Failed to load component ${config.name}:`, error);
          throw error;
        })
    );

    const WrappedComponent = (props: React.ComponentProps<any>) => (
      <Suspense fallback={this.getFallback(config)}>
        <LazyComponent {...props} />
      </Suspense>
    );

    this.lazyComponents.set(config.name, WrappedComponent);

    // Preload if configured
    if (config.preload) {
      this.preloadComponent(config.name);
    }

    return WrappedComponent;
  }

  /**
   * Preload a component
   */
  preloadComponent(componentName: string): void {
    if (this.preloadedComponents.has(componentName)) {
      return;
    }

    const config = this.getComponentConfig(componentName);
    if (!config) {
      console.warn(`Component config not found for: ${componentName}`);
      return;
    }

    // Trigger preload
    import(/* webpackChunkName: "[request]" */ `${config.importPath}`)
      .then(() => {
        this.preloadedComponents.add(componentName);
        Logger.getInstance().debug(`Preloaded component: ${componentName}`);
      })
      .catch(error => {
        console.error(`Failed to preload component ${componentName}:`, error);
      });
  }

  /**
   * Preload multiple components
   */
  preloadComponents(componentNames: string[]): void {
    componentNames.forEach(name => this.preloadComponent(name));
  }

  /**
   * Get component loading status
   */
  getComponentStatus(componentName: string): {
    loaded: boolean;
    preloaded: boolean;
    error?: string;
  } {
    return {
      loaded: this.loadedComponents.has(componentName),
      preloaded: this.preloadedComponents.has(componentName),
    };
  }

  /**
   * Get all component statuses
   */
  getAllComponentStatuses(): Record<string, {
    loaded: boolean;
    preloaded: boolean;
  }> {
    const statuses: Record<string, { loaded: boolean; preloaded: boolean }> = {};
    
    this.lazyComponents.forEach((_, name) => {
      statuses[name] = this.getComponentStatus(name);
    });

    return statuses;
  }

  /**
   * Get loading statistics
   */
  getLoadingStats(): {
    totalComponents: number;
    loadedComponents: number;
    preloadedComponents: number;
    loadingProgress: number;
  } {
    const totalComponents = this.lazyComponents.size;
    const loadedComponents = this.loadedComponents.size;
    const preloadedComponents = this.preloadedComponents.size;
    const loadingProgress = totalComponents > 0 ? (loadedComponents / totalComponents) * 100 : 0;

    return {
      totalComponents,
      loadedComponents,
      preloadedComponents,
      loadingProgress,
    };
  }

  /**
   * Clear component cache (useful for development)
   */
  clearCache(): void {
    this.loadedComponents.clear();
    this.preloadedComponents.clear();
    this.lazyComponents.clear();
  }

  /**
   * Get fallback component
   */
  private getFallback(config: LazyComponentConfig): React.ReactNode {
    if (config.fallback) {
      const FallbackComponent = config.fallback;
      return <FallbackComponent />;
    }

    // Default fallback
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading {config.name}...</span>
      </div>
    );
  }

  /**
   * Get component configuration
   */
  private getComponentConfig(componentName: string): LazyComponentConfig | null {
    // This would typically come from a configuration file
    const configs: LazyComponentConfig[] = [
      {
        name: 'StudentDashboard',
        importPath: '@/pages/dashboards/student/StudentDashboard',
        preload: true,
      },
      {
        name: 'PaymentBreakdown',
        importPath: '@/pages/dashboards/student/components/PaymentBreakdown',
        preload: false,
      },
      {
        name: 'AttendanceOverview',
        importPath: '@/pages/dashboards/student/components/AttendanceOverview',
        preload: false,
      },
      {
        name: 'CohortDetailsPage',
        importPath: '@/pages/CohortDetailsPage',
        preload: false,
      },
      {
        name: 'FeePaymentDashboard',
        importPath: '@/pages/FeePaymentDashboard',
        preload: false,
      },
    ];

    return configs.find(config => config.name === componentName) || null;
  }
}

// Export singleton instance
export const codeSplittingManager = CodeSplittingManager.getInstance();

// Predefined lazy components for common use cases
export const LazyStudentDashboard = codeSplittingManager.createLazyComponent({
  name: 'StudentDashboard',
  importPath: '@/pages/dashboards/student/StudentDashboard',
  preload: true,
});

export const LazyPaymentBreakdown = codeSplittingManager.createLazyComponent({
  name: 'PaymentBreakdown',
  importPath: '@/pages/dashboards/student/components/PaymentBreakdown',
  preload: false,
});

export const LazyAttendanceOverview = codeSplittingManager.createLazyComponent({
  name: 'AttendanceOverview',
  importPath: '@/pages/dashboards/student/components/AttendanceOverview',
  preload: false,
});

export const LazyCohortDetailsPage = codeSplittingManager.createLazyComponent({
  name: 'CohortDetailsPage',
  importPath: '@/pages/CohortDetailsPage',
  preload: false,
});

export const LazyFeePaymentDashboard = codeSplittingManager.createLazyComponent({
  name: 'FeePaymentDashboard',
  importPath: '@/pages/FeePaymentDashboard',
  preload: false,
});

// React hook for component loading status
export function useComponentLoadingStatus(componentName: string) {
  const [status, setStatus] = React.useState(() => 
    codeSplittingManager.getComponentStatus(componentName)
  );

  React.useEffect(() => {
    const checkStatus = () => {
      setStatus(codeSplittingManager.getComponentStatus(componentName));
    };

    // Check status periodically
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, [componentName]);

  return status;
}

// React hook for loading statistics
export function useLoadingStats() {
  const [stats, setStats] = React.useState(() => 
    codeSplittingManager.getLoadingStats()
  );

  React.useEffect(() => {
    const updateStats = () => {
      setStats(codeSplittingManager.getLoadingStats());
    };

    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  return stats;
}

// Import React for hooks
import React from 'react';
