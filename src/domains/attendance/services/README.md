# Attendance Services

This directory contains the refactored attendance services, which were broken down from the original large `AttendanceService.ts` (600 lines) into smaller, more manageable and focused services following enterprise architecture patterns.

## Services

### Main Service

#### AttendanceService.ts
The main orchestrator service that coordinates all attendance operations. Now significantly smaller and focused on:
- Delegating operations to focused services
- Maintaining the same public API for backward compatibility
- Coordinating between different attendance concerns

## Focused Services

### AttendanceMarkingService.ts
Handles all attendance marking operations:
- `markAttendance()` - Mark individual student attendance
- `bulkMarkAttendance()` - Bulk mark attendance for multiple students
- Manages attendance status, absence types, and reasons

### AttendanceQueryService.ts
Manages all attendance data retrieval operations:
- `getAttendanceRecords()` - Get attendance records with filtering
- `getSessionAttendance()` - Get attendance for specific sessions
- `getAttendanceSummary()` - Get attendance summaries for students/cohorts
- `getCohortEpics()` - Get cohort epic information

### SessionManagementService.ts
Handles session-related operations:
- `getSessionsForDate()` - Get sessions for specific dates
- `toggleSessionCancellation()` - Toggle session cancellation status
- `isSessionCancelled()` - Check if a session is cancelled

### AttendanceStatsService.ts
Manages attendance statistics and calculations:
- `getAttendanceStats()` - Calculate comprehensive attendance statistics
- `calculateTotalSessions()` - Calculate unique session count
- `calculateAverageAttendance()` - Calculate average attendance percentage
- `calculatePerfectAttendance()` - Count students with perfect attendance
- `calculatePoorAttendance()` - Count students with poor attendance (<75%)

### AttendanceSubscriptionService.ts
Handles real-time attendance subscriptions:
- `subscribeToAttendanceChanges()` - Subscribe to attendance record changes
- Manages Supabase real-time channels for live updates

## Types

### AttendanceTypes.ts
Centralized type definitions for all attendance-related data:
- `AttendanceRecord` - Individual attendance record structure
- `SessionInfo` - Session information with attendance counts
- `AttendanceSummary` - Student attendance summary
- `EpicInfo` - Cohort epic information
- `AttendanceFilters` - Filter options for attendance queries
- `AttendanceStats` - Comprehensive attendance statistics
- `StudentStats` - Individual student statistics
- `BulkAttendanceData` - Bulk attendance marking data

## Benefits of Refactoring

1. **Separation of Concerns**: Each service has a single, clear responsibility
2. **Reusability**: Services can be used independently across different contexts
3. **Maintainability**: Easier to locate and fix issues in specific functionality
4. **Testability**: Smaller, focused services are easier to unit test
5. **Readability**: Code is more organized and easier to understand
6. **Error Handling**: Centralized error handling with consistent messaging
7. **Performance**: Smaller modules can be optimized independently
8. **Enterprise Architecture**: Follows domain-driven design principles

## File Structure

```
services/
├── AttendanceService.ts                    # Main orchestrator service
├── AttendanceMarkingService.ts             # Attendance marking operations
├── AttendanceQueryService.ts               # Data retrieval operations
├── SessionManagementService.ts             # Session management operations
├── AttendanceStatsService.ts               # Statistics calculations
├── AttendanceSubscriptionService.ts        # Real-time subscriptions
├── types/
│   └── AttendanceTypes.ts                  # Centralized type definitions
├── index.ts                               # Export file
└── README.md                              # This file
```

## Usage

The main entry point is still the `AttendanceService`:

```tsx
import { attendanceService } from '@/domains/attendance/services';

// Mark attendance
await attendanceService.markAttendance(
  cohortId,
  epicId,
  sessionNumber,
  sessionDate,
  studentId,
  'present'
);

// Get attendance records
const records = await attendanceService.getAttendanceRecords({
  cohortId,
  epicId,
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31'
});

// Get statistics
const stats = await attendanceService.getAttendanceStats(cohortId);
```

For direct access to specific services:

```tsx
import { 
  AttendanceMarkingService,
  AttendanceQueryService,
  AttendanceStatsService 
} from '@/domains/attendance/services';

const markingService = new AttendanceMarkingService();
const queryService = new AttendanceQueryService();
const statsService = new AttendanceStatsService(queryService);
```

## Refactoring Summary

### Before:
- One massive file with 600 lines
- Mixed concerns (marking, querying, session management, statistics, subscriptions)
- Complex nested logic and helper methods
- Difficult to maintain and test

### After:
- **6 focused services** with clear responsibilities
- **1 types file** for centralized type definitions
- **1 main orchestrator** for backward compatibility
- **1 index file** for clean exports
- **1 README** for documentation

The refactored code maintains all the original functionality while being much more maintainable and following enterprise architecture best practices.

## Complex Features Preserved

The refactoring successfully preserved all complex features:
- ✅ Individual and bulk attendance marking
- ✅ Comprehensive attendance filtering and querying
- ✅ Session management and cancellation
- ✅ Attendance statistics calculations
- ✅ Real-time attendance subscriptions
- ✅ Student attendance summaries
- ✅ Cohort epic management
- ✅ Error handling and logging
- ✅ API response standardization

## Service Architecture Benefits

The new service-oriented architecture provides:
- **Clear API boundaries** between different concerns
- **Consistent error handling** across all operations
- **Modular testing** capabilities
- **Easy extension** for new attendance features
- **Improved debugging** with focused, smaller code units
- **Better dependency management** with explicit service dependencies
- **Domain-driven design** principles implementation
