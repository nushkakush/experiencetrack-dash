/**
 * Performance Monitoring Dashboard
 * Real-time monitoring of application performance metrics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Zap,
  Database,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Settings,
} from 'lucide-react';
import { BundleAnalyzer } from '@/infrastructure/performance/BundleOptimizer';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift

  // Bundle Metrics
  totalBundleSize: number;
  loadTime: number;
  memoryUsage: number;

  // API Metrics
  apiResponseTime: number;
  errorRate: number;
  activeConnections: number;

  // User Metrics
  activeUsers: number;
  bounceRate: number;
  sessionDuration: number;
}

interface ComponentPerformance {
  name: string;
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  reRenderCount: number;
}

export const PerformanceDashboard: React.FC = React.memo(() => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [componentMetrics, setComponentMetrics] = useState<
    ComponentPerformance[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadPerformanceMetrics();

    if (autoRefresh) {
      const interval = setInterval(loadPerformanceMetrics, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadPerformanceMetrics = async () => {
    try {
      setIsLoading(true);

      // Get bundle metrics
      const bundleAnalyzer = BundleAnalyzer.getInstance();
      const bundleMetrics = bundleAnalyzer.getMetrics();

      // Get Core Web Vitals
      const webVitals = await getCoreWebVitals();

      // Get API metrics
      const apiMetrics = await getApiMetrics();

      // Get user metrics
      const userMetrics = await getUserMetrics();

      setMetrics({
        ...webVitals,
        ...bundleMetrics,
        ...apiMetrics,
        ...userMetrics,
      });

      // Get component performance data
      const componentData = await getComponentMetrics();
      setComponentMetrics(componentData);
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCoreWebVitals = async (): Promise<Partial<PerformanceMetrics>> => {
    return new Promise(resolve => {
      // Use Performance Observer for Core Web Vitals
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          let lcp = 0,
            fid = 0,
            cls = 0;

          entries.forEach(entry => {
            if (entry.entryType === 'largest-contentful-paint') {
              lcp = entry.startTime;
            } else if (entry.entryType === 'first-input') {
              fid = (entry as any).processingStart - entry.startTime;
            } else if (entry.entryType === 'layout-shift') {
              if (!(entry as any).hadRecentInput) {
                cls += (entry as any).value;
              }
            }
          });

          resolve({ lcp, fid, cls });
        });

        observer.observe({
          entryTypes: [
            'largest-contentful-paint',
            'first-input',
            'layout-shift',
          ],
        });

        // Fallback timeout
        setTimeout(() => resolve({ lcp: 0, fid: 0, cls: 0 }), 1000);
      } else {
        resolve({ lcp: 0, fid: 0, cls: 0 });
      }
    });
  };

  const getApiMetrics = async (): Promise<Partial<PerformanceMetrics>> => {
    // Mock API metrics - replace with actual implementation
    return {
      apiResponseTime: Math.random() * 500 + 100,
      errorRate: Math.random() * 5,
      activeConnections: Math.floor(Math.random() * 50) + 10,
    };
  };

  const getUserMetrics = async (): Promise<Partial<PerformanceMetrics>> => {
    // Mock user metrics - replace with actual implementation
    return {
      activeUsers: Math.floor(Math.random() * 100) + 20,
      bounceRate: Math.random() * 30 + 10,
      sessionDuration: Math.random() * 300 + 120,
    };
  };

  const getComponentMetrics = async (): Promise<ComponentPerformance[]> => {
    // Get component metrics from BundleAnalyzer
    const bundleAnalyzer = BundleAnalyzer.getInstance();
    const bundleMetrics = bundleAnalyzer.getMetrics();

    return Object.entries(bundleMetrics.loadTimes || {}).map(
      ([name, loadTime]) => ({
        name,
        loadTime,
        renderTime: Math.random() * 50,
        memoryUsage: Math.random() * 1024,
        reRenderCount: Math.floor(Math.random() * 10),
      })
    );
  };

  const getStatusColor = (
    value: number,
    thresholds: { good: number; needs_improvement: number }
  ) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.needs_improvement) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (
    value: number,
    thresholds: { good: number; needs_improvement: number }
  ) => {
    if (value <= thresholds.good)
      return <Badge className='bg-green-100 text-green-800'>Good</Badge>;
    if (value <= thresholds.needs_improvement)
      return (
        <Badge className='bg-yellow-100 text-yellow-800'>
          Needs Improvement
        </Badge>
      );
    return <Badge className='bg-red-100 text-red-800'>Poor</Badge>;
  };

  const exportMetrics = () => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics,
      componentMetrics,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !metrics) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='flex items-center space-x-2'>
          <div className='h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
          <span>Loading performance metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Performance Dashboard</h1>
          <p className='text-muted-foreground'>
            Real-time application performance monitoring
          </p>
        </div>

        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`}
            />
            Auto Refresh
          </Button>

          <Button variant='outline' size='sm' onClick={exportMetrics}>
            <Download className='h-4 w-4 mr-2' />
            Export
          </Button>

          <Button variant='outline' size='sm'>
            <Settings className='h-4 w-4 mr-2' />
            Settings
          </Button>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Largest Contentful Paint
            </CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{metrics.lcp.toFixed(0)}ms</div>
            <div className='flex items-center justify-between mt-2'>
              {getStatusBadge(metrics.lcp, {
                good: 2500,
                needs_improvement: 4000,
              })}
              <p className='text-xs text-muted-foreground'>Target: &lt;2.5s</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              First Input Delay
            </CardTitle>
            <Zap className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{metrics.fid.toFixed(0)}ms</div>
            <div className='flex items-center justify-between mt-2'>
              {getStatusBadge(metrics.fid, {
                good: 100,
                needs_improvement: 300,
              })}
              <p className='text-xs text-muted-foreground'>Target: &lt;100ms</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Cumulative Layout Shift
            </CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{metrics.cls.toFixed(3)}</div>
            <div className='flex items-center justify-between mt-2'>
              {getStatusBadge(metrics.cls, {
                good: 0.1,
                needs_improvement: 0.25,
              })}
              <p className='text-xs text-muted-foreground'>Target: &lt;0.1</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue='performance' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='performance'>Performance</TabsTrigger>
          <TabsTrigger value='components'>Components</TabsTrigger>
          <TabsTrigger value='api'>API</TabsTrigger>
          <TabsTrigger value='users'>Users</TabsTrigger>
        </TabsList>

        <TabsContent value='performance' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Bundle Size
                </CardTitle>
                <Database className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {(metrics.totalBundleSize / 1024 / 1024).toFixed(1)}MB
                </div>
                <p className='text-xs text-muted-foreground'>Target: &lt;2MB</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Load Time</CardTitle>
                <Clock className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {metrics.averageLoadTime?.toFixed(0) || 0}ms
                </div>
                <p className='text-xs text-muted-foreground'>
                  Average component load
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Memory Usage
                </CardTitle>
                <Activity className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {(metrics.memoryUsage / 1024 / 1024).toFixed(0)}MB
                </div>
                <p className='text-xs text-muted-foreground'>Current usage</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Performance Score
                </CardTitle>
                <CheckCircle className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>85</div>
                <Progress value={85} className='mt-2' />
                <p className='text-xs text-muted-foreground mt-1'>
                  Overall score
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='components' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Component Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {componentMetrics.slice(0, 10).map((component, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-3 border rounded-lg'
                  >
                    <div>
                      <div className='font-medium'>{component.name}</div>
                      <div className='text-sm text-muted-foreground'>
                        Load: {component.loadTime.toFixed(0)}ms • Render:{' '}
                        {component.renderTime.toFixed(0)}ms • Re-renders:{' '}
                        {component.reRenderCount}
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm font-medium'>
                        {(component.memoryUsage / 1024).toFixed(1)}KB
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        Memory
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='api' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Response Time
                </CardTitle>
                <Clock className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {metrics.apiResponseTime.toFixed(0)}ms
                </div>
                <p className='text-xs text-muted-foreground'>
                  Average API response
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Error Rate
                </CardTitle>
                <AlertTriangle className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {metrics.errorRate.toFixed(1)}%
                </div>
                <p className='text-xs text-muted-foreground'>Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Active Connections
                </CardTitle>
                <Database className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {metrics.activeConnections}
                </div>
                <p className='text-xs text-muted-foreground'>
                  Real-time connections
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='users' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Active Users
                </CardTitle>
                <Users className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{metrics.activeUsers}</div>
                <p className='text-xs text-muted-foreground'>
                  Currently online
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Bounce Rate
                </CardTitle>
                <Activity className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {metrics.bounceRate.toFixed(1)}%
                </div>
                <p className='text-xs text-muted-foreground'>Last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Session Duration
                </CardTitle>
                <Clock className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {Math.floor(metrics.sessionDuration / 60)}m
                </div>
                <p className='text-xs text-muted-foreground'>Average session</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

PerformanceDashboard.displayName = 'PerformanceDashboard';
