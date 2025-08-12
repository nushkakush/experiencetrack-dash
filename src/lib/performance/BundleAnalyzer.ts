export interface BundleMetrics {
  totalSize: number;
  chunkCount: number;
  chunks: Array<{
    name: string;
    size: number;
    modules: Array<{
      name: string;
      size: number;
      percentage: number;
    }>;
  }>;
  largestChunks: Array<{
    name: string;
    size: number;
    percentage: number;
  }>;
  duplicateModules: Array<{
    name: string;
    count: number;
    totalSize: number;
  }>;
}

export interface PerformanceMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  bundleLoadTime: number;
  apiResponseTime: number;
}

export class BundleAnalyzer {
  private static instance: BundleAnalyzer;
  private metrics: BundleMetrics | null = null;
  private performanceMetrics: PerformanceMetrics | null = null;

  private constructor() {}

  static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer();
    }
    return BundleAnalyzer.instance;
  }

  /**
   * Analyze bundle size and composition
   */
  async analyzeBundle(): Promise<BundleMetrics> {
    try {
      // In a real implementation, this would use webpack-bundle-analyzer
      // or similar tools to analyze the actual bundle
      const mockMetrics: BundleMetrics = {
        totalSize: 1024 * 1024, // 1MB
        chunkCount: 5,
        chunks: [
          {
            name: 'main',
            size: 512 * 1024,
            modules: [
              { name: 'react', size: 128 * 1024, percentage: 12.5 },
              { name: 'react-dom', size: 96 * 1024, percentage: 9.4 },
              { name: 'supabase', size: 64 * 1024, percentage: 6.3 },
            ],
          },
          {
            name: 'vendor',
            size: 256 * 1024,
            modules: [
              { name: 'lodash', size: 48 * 1024, percentage: 4.7 },
              { name: 'date-fns', size: 32 * 1024, percentage: 3.1 },
            ],
          },
        ],
        largestChunks: [
          { name: 'main', size: 512 * 1024, percentage: 50 },
          { name: 'vendor', size: 256 * 1024, percentage: 25 },
        ],
        duplicateModules: [
          { name: 'react', count: 2, totalSize: 256 * 1024 },
        ],
      };

      this.metrics = mockMetrics;
      return mockMetrics;
    } catch (error) {
      console.error('Failed to analyze bundle:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const metrics: PerformanceMetrics = {
        firstContentfulPaint: this.getFCP(),
        largestContentfulPaint: this.getLCP(),
        firstInputDelay: this.getFID(),
        cumulativeLayoutShift: this.getCLS(),
        timeToInteractive: this.getTTI(),
        bundleLoadTime: this.getBundleLoadTime(),
        apiResponseTime: this.getApiResponseTime(),
      };

      this.performanceMetrics = metrics;
      return metrics;
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get bundle optimization recommendations
   */
  getOptimizationRecommendations(): Array<{
    type: 'critical' | 'warning' | 'info';
    message: string;
    impact: 'high' | 'medium' | 'low';
    action: string;
  }> {
    const recommendations = [];

    if (this.metrics) {
      // Check bundle size
      if (this.metrics.totalSize > 1024 * 1024) {
        recommendations.push({
          type: 'critical',
          message: 'Bundle size exceeds 1MB threshold',
          impact: 'high',
          action: 'Implement code splitting and lazy loading',
        });
      }

      // Check for duplicate modules
      const duplicates = this.metrics.duplicateModules.filter(d => d.count > 1);
      if (duplicates.length > 0) {
        recommendations.push({
          type: 'warning',
          message: `${duplicates.length} duplicate modules detected`,
          impact: 'medium',
          action: 'Review and deduplicate dependencies',
        });
      }

      // Check chunk distribution
      const largestChunk = this.metrics.largestChunks[0];
      if (largestChunk && largestChunk.percentage > 50) {
        recommendations.push({
          type: 'warning',
          message: 'Main chunk is too large',
          impact: 'medium',
          action: 'Split main chunk into smaller chunks',
        });
      }
    }

    if (this.performanceMetrics) {
      // Check Core Web Vitals
      if (this.performanceMetrics.largestContentfulPaint > 2500) {
        recommendations.push({
          type: 'critical',
          message: 'LCP exceeds 2.5s threshold',
          impact: 'high',
          action: 'Optimize critical rendering path',
        });
      }

      if (this.performanceMetrics.firstInputDelay > 100) {
        recommendations.push({
          type: 'warning',
          message: 'FID exceeds 100ms threshold',
          impact: 'medium',
          action: 'Reduce JavaScript execution time',
        });
      }

      if (this.performanceMetrics.cumulativeLayoutShift > 0.1) {
        recommendations.push({
          type: 'warning',
          message: 'CLS exceeds 0.1 threshold',
          impact: 'medium',
          action: 'Fix layout shifts and optimize images',
        });
      }
    }

    return recommendations;
  }

  /**
   * Monitor bundle size over time
   */
  trackBundleSize(size: number): void {
    // In a real implementation, this would send metrics to a monitoring service
    Logger.getInstance().debug(`Bundle size tracked: ${size} bytes`);
    
    // Store in localStorage for development
    if (process.env.NODE_ENV === 'development') {
      const history = JSON.parse(localStorage.getItem('bundle-size-history') || '[]');
      history.push({
        timestamp: new Date().toISOString(),
        size,
      });
      
      // Keep only last 30 entries
      if (history.length > 30) {
        history.shift();
      }
      
      localStorage.setItem('bundle-size-history', JSON.stringify(history));
    }
  }

  /**
   * Get bundle size history
   */
  getBundleSizeHistory(): Array<{ timestamp: string; size: number }> {
    if (process.env.NODE_ENV === 'development') {
      return JSON.parse(localStorage.getItem('bundle-size-history') || '[]');
    }
    return [];
  }

  // Performance measurement methods
  private getFCP(): number {
    // Mock implementation - in real app, use Performance API
    return Math.random() * 2000 + 500; // 500-2500ms
  }

  private getLCP(): number {
    return Math.random() * 3000 + 1000; // 1000-4000ms
  }

  private getFID(): number {
    return Math.random() * 200 + 50; // 50-250ms
  }

  private getCLS(): number {
    return Math.random() * 0.2; // 0-0.2
  }

  private getTTI(): number {
    return Math.random() * 5000 + 2000; // 2000-7000ms
  }

  private getBundleLoadTime(): number {
    return Math.random() * 1000 + 200; // 200-1200ms
  }

  private getApiResponseTime(): number {
    return Math.random() * 500 + 100; // 100-600ms
  }
}

// Export singleton instance
export const bundleAnalyzer = BundleAnalyzer.getInstance();
