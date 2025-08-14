# Application Logging System

This document describes the comprehensive logging system implemented to identify and debug application reload issues.

## Overview

The logging system consists of multiple components that track different aspects of the application lifecycle:

1. **AppLifecycleLogger** - Tracks window focus/blur, visibility changes, and page lifecycle events
2. **QueryLogger** - Monitors React Query events and network-related issues
3. **React Hooks** - Component-level lifecycle tracking
4. **Debug Components** - Real-time monitoring and analysis tools

## Quick Start

### 1. Access the Debug Panel

In development mode, you'll see a floating "Debug" button in the bottom-right corner of the application. Click it to open the comprehensive debug panel.

### 2. Visit the Test Page

Navigate to `/test-logging` in development mode to access the dedicated testing page with detailed monitoring tools.

### 3. Monitor Events

Keep the debug panel open while you:
- Switch between browser tabs
- Switch between browser windows
- Navigate between pages in the app
- Perform actions that might trigger reloads

## Components

### AppLifecycleLogger

Tracks global application events:

- **Focus/Blur Events** - When the window gains/loses focus
- **Visibility Changes** - When the page becomes visible/hidden
- **Page Lifecycle** - Page show/hide, before unload events
- **Network Status** - Online/offline events
- **Memory Usage** - High memory usage warnings
- **Performance** - Navigation timing and performance metrics

### QueryLogger

Monitors React Query activity:

- **Query Events** - Start, success, error, invalidate, refetch
- **Mutation Events** - Start, success, error
- **Network Issues** - Connection changes, storage quota
- **Query Patterns** - Frequent queries, error patterns

### React Hooks

Component-level tracking:

```typescript
import { useLifecycleLogging } from '@/hooks/useLifecycleLogging';

function MyComponent() {
  useLifecycleLogging({
    componentName: 'MyComponent',
    trackMount: true,
    trackUnmount: true,
    trackUpdates: false
  });
  
  // ... component logic
}
```

## Identifying Reload Causes

### Common Patterns to Look For

1. **Multiple Mount Events**
   - If you see multiple "mount" events in quick succession, this indicates the application is reloading
   - Look for patterns in the timing and frequency

2. **Query Errors**
   - Query errors can cause React Query to retry, potentially triggering reloads
   - Check for network-related errors or authentication issues

3. **Memory Issues**
   - High memory usage can cause the browser to reload the page
   - Monitor memory usage in the system information panel

4. **Network Status Changes**
   - Going offline/online can trigger query refetches
   - Check if network changes correlate with reloads

5. **Focus/Blur Patterns**
   - Excessive focus/blur events might indicate problematic event listeners
   - Look for components that don't properly clean up listeners

### Debugging Steps

1. **Open the Debug Panel**
   - Click the floating debug button
   - Monitor the "Events" tab for real-time activity

2. **Switch Between Tabs**
   - Keep the debug panel open
   - Switch to another tab and back
   - Watch for events that fire when you return

3. **Check the Analysis Tab**
   - Look for warnings about potential reloads
   - Review event distribution and patterns

4. **Export Logs**
   - Use the export function to save logs for detailed analysis
   - Share logs with the development team

## Configuration

### Log Levels

The system uses different log levels:

- **DEBUG** - Detailed information for debugging
- **INFO** - General information about application flow
- **WARN** - Warning conditions that might indicate issues
- **ERROR** - Error conditions that need attention
- **CRITICAL** - Critical errors that might cause crashes

### Development vs Production

- **Development**: All log levels are enabled, debug components are visible
- **Production**: Only WARN, ERROR, and CRITICAL logs are shown, debug components are hidden

## API Reference

### AppLifecycleLogger

```typescript
import { appLifecycleLogger } from '@/lib/logging';

// Log a custom event
appLifecycleLogger.logEvent('focus', {
  message: 'Custom focus event',
  customData: 'value'
}, 'ComponentName');

// Get recent events
const recentEvents = appLifecycleLogger.getRecentEvents(300); // Last 5 minutes

// Analyze reload causes
appLifecycleLogger.analyzeReloadCauses();

// Export events
const exportedData = appLifecycleLogger.exportEvents();
```

### QueryLogger

```typescript
import { queryLogger } from '@/lib/logging';

// Log query events
queryLogger.logQueryStart('my-query', { options: 'data' });
queryLogger.logQuerySuccess('my-query', data);
queryLogger.logQueryError('my-query', error);

// Analyze query patterns
queryLogger.analyzeQueryPatterns();
```

### Debug Utils

```typescript
import { debugUtils } from '@/lib/logging';

// Get all recent events
const allEvents = debugUtils.getAllRecentEvents(300);

// Run comprehensive analysis
debugUtils.analyzeReloadCauses();

// Export all logs
const allLogs = debugUtils.exportAllLogs();

// Get system information
const systemInfo = debugUtils.getSystemInfo();
```

## Troubleshooting

### No Events Showing

1. Check that the logging system is initialized
2. Verify you're in development mode
3. Check browser console for any errors

### High Event Volume

1. Filter events by type in the debug panel
2. Use the analysis tools to identify patterns
3. Consider adjusting log levels if needed

### Performance Impact

1. The logging system is designed to be lightweight
2. In production, only critical events are logged
3. Debug components are automatically disabled in production

## Best Practices

1. **Use Component Names** - Always provide meaningful component names when logging
2. **Include Context** - Add relevant context data to help with debugging
3. **Monitor Regularly** - Check the debug panel during development
4. **Export Logs** - Save logs when investigating specific issues
5. **Clean Up** - Clear logs periodically to prevent memory buildup

## Common Issues and Solutions

### Issue: Application reloads when switching tabs

**Possible Causes:**
- React Query refetching on window focus
- Memory pressure causing browser to reload
- Event listeners not properly cleaned up

**Solutions:**
- Check `refetchOnWindowFocus` setting in React Query
- Monitor memory usage
- Review component cleanup in useEffect hooks

### Issue: Multiple mount events

**Possible Causes:**
- Component re-mounting due to key changes
- Route changes triggering re-renders
- State changes causing component tree updates

**Solutions:**
- Check component keys and dependencies
- Review route configuration
- Analyze state management patterns

### Issue: Query errors causing reloads

**Possible Causes:**
- Network connectivity issues
- Authentication token expiration
- Server errors

**Solutions:**
- Implement proper error boundaries
- Add retry logic with exponential backoff
- Handle authentication gracefully

## Support

If you encounter issues with the logging system or need help interpreting the logs, please:

1. Export the logs using the debug panel
2. Include system information from the test page
3. Describe the steps that led to the issue
4. Share any error messages from the browser console
