import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { appLifecycleLogger } from '@/lib/logging/AppLifecycleLogger';
import { LifecycleEvent } from '@/lib/logging/AppLifecycleLogger';
import { useLifecycleLogging } from '@/hooks/useLifecycleLogging';

interface LifecycleDebugPanelProps {
  isVisible?: boolean;
  onClose?: () => void;
}

export function LifecycleDebugPanel({ isVisible = false, onClose }: LifecycleDebugPanelProps) {
  const [events, setEvents] = useState<LifecycleEvent[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [analysis, setAnalysis] = useState<any>(null);

  // Use the lifecycle logging hook for this component
  useLifecycleLogging({
    componentName: 'LifecycleDebugPanel',
    trackMount: true,
    trackUnmount: true
  });

  useEffect(() => {
    if (!isVisible) return;

    const updateEvents = () => {
      setEvents(appLifecycleLogger.getEvents());
    };

    updateEvents();

    if (autoRefresh) {
      const interval = setInterval(updateEvents, 1000);
      return () => clearInterval(interval);
    }
  }, [isVisible, autoRefresh]);

  useEffect(() => {
    if (!isVisible) return;

    const runAnalysis = () => {
      appLifecycleLogger.analyzeReloadCauses();
      // Get recent events for analysis
      const recentEvents = appLifecycleLogger.getRecentEvents(300);
      const focusEvents = recentEvents.filter(e => e.type === 'focus');
      const blurEvents = recentEvents.filter(e => e.type === 'blur');
      const mountEvents = recentEvents.filter(e => e.type === 'mount');
      const errorEvents = recentEvents.filter(e => e.type === 'error');

      setAnalysis({
        totalEvents: recentEvents.length,
        focusEvents: focusEvents.length,
        blurEvents: blurEvents.length,
        mountEvents: mountEvents.length,
        errorEvents: errorEvents.length,
        potentialReloads: mountEvents.length > 3,
        hasErrors: errorEvents.length > 0,
        lastMountEvent: mountEvents[mountEvents.length - 1],
        lastErrorEvent: errorEvents[errorEvents.length - 1]
      });
    };

    runAnalysis();
    const interval = setInterval(runAnalysis, 5000);
    return () => clearInterval(interval);
  }, [isVisible]);

  const filteredEvents = filterType === 'all' 
    ? events 
    : events.filter(event => event.type === filterType);

  const getEventColor = (type: string) => {
    switch (type) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'mount': return 'default';
      case 'focus': return 'default';
      case 'blur': return 'outline';
      case 'unmount': return 'outline';
      default: return 'outline';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const exportLogs = () => {
    const data = appLifecycleLogger.exportEvents();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifecycle-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-[80vh] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Application Lifecycle Debug Panel</CardTitle>
              <CardDescription>
                Monitor application lifecycle events and detect potential reload causes
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </Button>
              <Button variant="outline" size="sm" onClick={exportLogs}>
                Export Logs
              </Button>
              <Button variant="outline" size="sm" onClick={() => appLifecycleLogger.clearEvents()}>
                Clear Logs
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-4">
          {/* Analysis Section */}
          {analysis && (
            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Reload Analysis</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analysis.totalEvents}</div>
                    <div className="text-sm text-muted-foreground">Total Events</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{analysis.focusEvents}</div>
                    <div className="text-sm text-muted-foreground">Focus Events</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analysis.mountEvents}</div>
                    <div className="text-sm text-muted-foreground">Mount Events</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{analysis.errorEvents}</div>
                    <div className="text-sm text-muted-foreground">Error Events</div>
                  </div>
                </div>
                
                {analysis.potentialReloads && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
                    <div className="font-semibold text-red-800">⚠️ Potential Reloads Detected</div>
                    <div className="text-sm text-red-700">
                      Multiple mount events detected in the last 5 minutes. This may indicate application reloads.
                    </div>
                  </div>
                )}

                {analysis.hasErrors && (
                  <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
                    <div className="font-semibold text-yellow-800">⚠️ Errors Detected</div>
                    <div className="text-sm text-yellow-700">
                      Errors detected that might be causing reloads.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="events" className="flex-1 flex flex-col">
            <TabsList>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium">Filter:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="all">All Events</option>
                  <option value="mount">Mount</option>
                  <option value="unmount">Unmount</option>
                  <option value="focus">Focus</option>
                  <option value="blur">Blur</option>
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                </select>
                <Badge variant="outline">{filteredEvents.length} events</Badge>
              </div>

              <ScrollArea className="flex-1 border rounded-md p-4">
                <div className="space-y-2">
                  {filteredEvents.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No events to display
                    </div>
                  ) : (
                    filteredEvents.map((event, index) => (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={getEventColor(event.type) as any}>
                              {event.type.toUpperCase()}
                            </Badge>
                            <span className="text-sm font-medium">
                              {event.componentName || 'System'}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>
                        
                        <div className="text-sm">
                          {event.details.message || 'Event occurred'}
                        </div>
                        
                        {event.route && (
                          <div className="text-xs text-muted-foreground">
                            Route: {event.route}
                          </div>
                        )}
                        
                        {Object.keys(event.details).length > 1 && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground">
                              Show details
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                              {JSON.stringify(event.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="analysis" className="flex-1">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['mount', 'unmount', 'focus', 'blur', 'error', 'warning'].map(type => {
                        const count = events.filter(e => e.type === type).length;
                        return (
                          <div key={type} className="text-center">
                            <div className="text-2xl font-bold">{count}</div>
                            <div className="text-sm text-muted-foreground capitalize">{type}</div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {appLifecycleLogger.getRecentEvents(60).slice(-10).map((event, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="capitalize">{event.type}</span>
                          <span className="text-muted-foreground">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
