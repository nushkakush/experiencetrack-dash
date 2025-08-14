import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLifecycleLogging } from '@/hooks/useLifecycleLogging';
import { debugUtils, appLifecycleLogger, queryLogger } from '@/lib/logging';
import { LifecycleDebugPanel } from '@/components/debug/LifecycleDebugPanel';

export default function TestLoggingPage() {
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(false);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<any>(null);

  // Use lifecycle logging for this component
  useLifecycleLogging({
    componentName: 'TestLoggingPage',
    trackMount: true,
    trackUnmount: true,
    trackUpdates: true
  });

  useEffect(() => {
    // Get system information
    setSystemInfo(debugUtils.getSystemInfo());
    
    // Get recent events
    setRecentEvents(debugUtils.getAllRecentEvents(300)); // Last 5 minutes

    // Update every 10 seconds
    const interval = setInterval(() => {
      setRecentEvents(debugUtils.getAllRecentEvents(300));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const triggerTestEvents = () => {
    // Simulate various events that might cause reloads
    appLifecycleLogger.logEvent('focus', {
      message: 'Test focus event triggered',
      testType: 'manual'
    }, 'TestLoggingPage');

    appLifecycleLogger.logEvent('blur', {
      message: 'Test blur event triggered',
      testType: 'manual'
    }, 'TestLoggingPage');

    // Simulate a query error
    queryLogger.logQueryError('test-query', new Error('Test query error'), {
      testType: 'manual'
    });

    // Update recent events
    setRecentEvents(debugUtils.getAllRecentEvents(300));
  };

  const runAnalysis = () => {
    debugUtils.analyzeReloadCauses();
    setRecentEvents(debugUtils.getAllRecentEvents(300));
  };

  const exportLogs = () => {
    const logs = debugUtils.exportAllLogs();
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Application Logging Test Page</h1>
          <p className="text-muted-foreground">
            Use this page to test the logging system and identify potential reload causes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsDebugPanelOpen(true)}>
            Open Debug Panel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Current browser and system state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {systemInfo && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Platform:</span>
                  <Badge variant="outline">{systemInfo.platform}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Online:</span>
                  <Badge variant={systemInfo.onLine ? "default" : "destructive"}>
                    {systemInfo.onLine ? "Online" : "Offline"}
                  </Badge>
                </div>
                {systemInfo.memory && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Memory Usage:</span>
                    <Badge variant="outline">
                      {Math.round(systemInfo.memory.usedJSHeapSize / (1024 * 1024))}MB
                    </Badge>
                  </div>
                )}
                {systemInfo.connection && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Connection:</span>
                    <Badge variant="outline">{systemInfo.connection.effectiveType}</Badge>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Events from the last 5 minutes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentEvents && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Lifecycle Events:</span>
                  <Badge variant="outline">{recentEvents.lifecycle.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Query Events:</span>
                  <Badge variant="outline">{recentEvents.query.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total Events:</span>
                  <Badge variant="default">{recentEvents.total}</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
            <CardDescription>Trigger test events and analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={triggerTestEvents} className="w-full">
              Trigger Test Events
            </Button>
            <Button onClick={runAnalysis} variant="outline" className="w-full">
              Run Analysis
            </Button>
            <Button onClick={exportLogs} variant="outline" className="w-full">
              Export Logs
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use This Page</CardTitle>
          <CardDescription>Steps to identify reload causes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">1. Monitor Events</h4>
            <p className="text-sm text-muted-foreground">
              Keep this page open and switch between browser tabs/windows. Watch the Recent Events 
              counter to see if events are being logged when you switch back.
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-semibold">2. Use the Debug Panel</h4>
            <p className="text-sm text-muted-foreground">
              Click "Open Debug Panel" to see detailed event logs in real-time. This will show you 
              exactly what events are firing when you switch tabs.
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-semibold">3. Look for Patterns</h4>
            <p className="text-sm text-muted-foreground">
              Pay attention to:
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Multiple "mount" events in quick succession</li>
                <li>Query errors or excessive refetches</li>
                <li>Memory usage spikes</li>
                <li>Network status changes</li>
              </ul>
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-semibold">4. Export and Analyze</h4>
            <p className="text-sm text-muted-foreground">
              Use the "Export Logs" button to save event data for further analysis. This can help 
              identify patterns over longer periods.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Debug Panel */}
      <LifecycleDebugPanel
        isVisible={isDebugPanelOpen}
        onClose={() => setIsDebugPanelOpen(false)}
      />
    </div>
  );
}
