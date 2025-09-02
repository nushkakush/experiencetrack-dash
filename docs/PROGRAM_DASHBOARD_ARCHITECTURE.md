# Program Dashboard Architecture

## Overview

The Program Dashboard has been refactored from a monolithic structure to a scalable, domain-driven design architecture. This document outlines the new structure, components, and how to use them.

## Architecture Principles

- **Domain-Driven Design (DDD)**: Clear separation of business domains
- **Single Responsibility**: Each component has one clear purpose
- **Separation of Concerns**: UI, business logic, and data are separated
- **Reusability**: Components can be used across different parts of the application
- **Scalability**: Easy to add new features without affecting existing code

## Directory Structure

```
src/
├── domains/                          # Business domain logic
│   ├── calendar/                     # Calendar functionality
│   │   ├── entities/                 # Calendar domain objects
│   │   ├── services/                 # Calendar business logic
│   │   ├── hooks/                    # Calendar React hooks
│   │   ├── components/               # Calendar-specific components
│   │   └── types/                    # Calendar type definitions
│   ├── sessions/                     # Session management
│   │   ├── entities/                 # Session domain objects
│   │   ├── services/                 # Session business logic
│   │   ├── hooks/                    # Session React hooks
│   │   ├── components/               # Session-specific components
│   │   └── types/                    # Session type definitions
│   └── programs/                     # Program management
│       ├── entities/                 # Program domain objects
│       ├── services/                 # Program business logic
│       ├── hooks/                    # Program React hooks
│       ├── components/               # Program-specific components
│       └── types/                    # Program type definitions
├── components/ui/                     # Reusable UI components
│   ├── calendar/                     # Generic calendar components
│   └── sessions/                     # Generic session components
├── stores/                           # State management
│   └── programStore.ts              # Centralized program state
└── config/features/                  # Feature flags
    └── programs.ts                   # Program feature configuration
```

## Core Components

### 1. Calendar Domain

#### `useCalendar` Hook

Manages calendar state and navigation:

```typescript
const {
  currentMonth,
  calendarDays,
  weekDayLabels,
  navigateToPreviousMonth,
  navigateToNextMonth,
  selectDate,
} = useCalendar(initialDate);
```

#### `CalendarService`

Handles calendar calculations and date logic:

```typescript
const days = CalendarService.generateCalendarDays(month);
const prevMonth = CalendarService.getPreviousMonth(currentMonth);
```

### 2. Sessions Domain

#### `SessionService`

Manages session-related business logic:

```typescript
const sessionsForDate = SessionService.getSessionsForDate(sessions, date);
const isAvailable = SessionService.isSessionSlotAvailable(
  sessions,
  date,
  sessionNumber
);
const cellHeight = SessionService.calculateCellHeight(
  sessionsCount,
  cblSessionsCount
);
```

#### `SessionCard`

Reusable session display component:

```typescript
<SessionCard
  session={session}
  sessionNumber={1}
  onClick={handleSessionClick}
/>
```

### 3. Programs Domain

#### `CBLService`

Handles Challenge-Based Learning logic:

```typescript
const cblSessions = CBLService.getCBLSessionsForDate(sessions, date);
const sessionCount = CBLService.getCBLSessionCountForDate(sessions, date);
const groupedSessions = CBLService.groupCBLSessionsByType(sessions, date);
```

#### `CBLSessionDisplay`

Renders CBL sessions with overlay design:

```typescript
<CBLSessionDisplay
  sessions={cblSessions}
  date={selectedDate}
/>
```

### 4. State Management

#### `useProgramStore`

Centralized state management using Zustand:

```typescript
const {
  currentEpic,
  plannedSessions,
  cblSessions,
  loadingSessions,
  loadingCBLSessions,
  setCurrentEpic,
  setPlannedSessions,
  addPlannedSession,
} = useProgramStore();
```

## Usage Examples

### Basic Calendar Implementation

```typescript
import { useCalendar } from '@/domains/calendar';
import { CalendarHeader, CalendarGrid } from '@/components/ui/calendar';

const MyCalendar = () => {
  const {
    currentMonth,
    calendarDays,
    weekDayLabels,
    navigateToPreviousMonth,
    navigateToNextMonth,
  } = useCalendar();

  return (
    <div>
      <CalendarHeader
        currentMonth={currentMonth}
        onPreviousMonth={navigateToPreviousMonth}
        onNextMonth={navigateToNextMonth}
      />
      <CalendarGrid
        days={calendarDays}
        weekDayLabels={weekDayLabels}
        onDateSelect={handleDateSelect}
      />
    </div>
  );
};
```

### Program Calendar with Sessions

```typescript
import { ProgramCalendarView } from '@/domains/calendar';
import { useProgramCalendar } from '@/domains/programs';

const ProgramCalendar = ({ cohortId, epicId }) => {
  const {
    plannedSessions,
    cblSessions,
    loadingSessions,
    loadingCBLSessions,
    handleDateSelect,
    handlePlanSession,
  } = useProgramCalendar(cohortId, epicId);

  return (
    <ProgramCalendarView
      cohortId={cohortId}
      epicId={epicId}
      plannedSessions={plannedSessions}
      cblSessions={cblSessions}
      loadingSessions={loadingSessions}
      loadingCBLSessions={loadingCBLSessions}
      onDateSelect={handleDateSelect}
      onPlanSession={handlePlanSession}
    />
  );
};
```

## Feature Flags

The program dashboard uses feature flags for gradual rollout and A/B testing:

```typescript
import { PROGRAM_FEATURES } from '@/config/features/programs';

// Check if a feature is enabled
if (PROGRAM_FEATURES.ADVANCED_SCHEDULING.enabled) {
  // Show advanced scheduling UI
}
```

## Migration Guide

### From Old Monolithic Structure

1. **Replace direct imports**:

   ```typescript
   // Old
   import { ProgramCalendarView } from '@/components/programs/ProgramCalendarView';

   // New
   import { ProgramCalendarView } from '@/domains/calendar';
   ```

2. **Use new hooks**:

   ```typescript
   // Old
   const [currentMonth, setCurrentMonth] = useState(new Date());

   // New
   const { currentMonth, navigateToPreviousMonth } = useCalendar();
   ```

3. **Leverage state management**:

   ```typescript
   // Old
   const [plannedSessions, setPlannedSessions] = useState([]);

   // New
   const { plannedSessions, setPlannedSessions } = useProgramStore();
   ```

## Performance Benefits

- **Reduced Bundle Size**: Components are tree-shakeable
- **Optimized Re-renders**: State is managed efficiently
- **Lazy Loading**: Components can be loaded on demand
- **Memoization**: Expensive calculations are cached

## Testing Strategy

Each domain has its own test suite:

- Unit tests for services and utilities
- Integration tests for hooks
- Component tests for UI components
- E2E tests for user workflows

## Future Enhancements

- **Virtual Scrolling**: For large calendars
- **Offline Support**: Service worker integration
- **Real-time Updates**: WebSocket integration
- **Advanced Analytics**: Session performance metrics
- **Mobile Optimization**: Touch-friendly interactions

## Contributing

When adding new features:

1. **Identify the domain** (calendar, sessions, programs)
2. **Create appropriate types** in the domain's types folder
3. **Implement business logic** in the domain's services
4. **Create React hooks** for state management
5. **Build UI components** using the domain's components
6. **Add feature flags** for gradual rollout
7. **Write comprehensive tests**

## Support

For questions about the new architecture:

- Check this documentation
- Review the example implementations
- Consult the domain-specific README files
- Reach out to the development team
