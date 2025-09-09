# ExperienceToSessionService - Modular Architecture

This directory contains the modularized version of the ExperienceToSessionService, broken down into focused, maintainable modules.

## Structure

```
src/services/experienceToSession/
├── README.md                           # This documentation
├── index.ts                           # Main exports
├── ExperienceToSessionService.ts      # Main service class
├── types/
│   └── index.ts                       # Type definitions
├── utils/
│   ├── sessionUtils.ts                # Common session utilities
│   └── sessionPreview.ts              # Session preview utilities
└── creators/
    ├── cblSessionCreators.ts          # CBL-specific session creation
    └── simpleSessionCreators.ts       # Simple session type creators
```

## Modules

### Main Service (`ExperienceToSessionService.ts`)

- **Purpose**: Main entry point and orchestration
- **Responsibilities**:
  - Route experience types to appropriate creators
  - Provide session preview functionality
  - Handle high-level error management

### Types (`types/index.ts`)

- **Purpose**: Centralized type definitions
- **Contents**: All interfaces and types used across the module

### Utilities (`utils/`)

#### `sessionUtils.ts`

- **Purpose**: Common session creation utilities
- **Key Functions**:
  - `toUtcIso()`: Convert time strings to UTC ISO format
  - `formatDateToSessionDate()`: Format dates for session storage
  - `isSlotAvailable()`: Check session slot availability
  - `createBasicSession()`: Create sessions with common validation
  - `advanceSlotAndDate()`: Handle slot/day progression

#### `sessionPreview.ts`

- **Purpose**: Generate session creation previews
- **Key Functions**:
  - `getSessionPreview()`: Get preview for any experience type

### Creators (`creators/`)

#### `cblSessionCreators.ts`

- **Purpose**: CBL-specific session creation logic
- **Key Functions**:
  - `createCBLExperienceSessions()`: Main CBL session creation
  - `createEnhancedCBLSessions()`: Create full CBL challenge with all sessions
  - `createChallengeIntroSession()`: Create challenge introduction session
  - `createLearnSession()`: Create learn sessions from lectures
  - `createInnovateSession()`: Create innovate session
  - `createTransformReflectionSessions()`: Create transform and reflection sessions

#### `simpleSessionCreators.ts`

- **Purpose**: Simple session type creators (single sessions)
- **Key Functions**:
  - `createMockChallengeSessions()`
  - `createMasterclassSessions()`
  - `createWorkshopSessions()`
  - `createGAPSessions()`

## Usage

### Basic Usage

```typescript
import { ExperienceToSessionService } from '@/services/experienceToSessionService';

// Create sessions from an experience
const result = await ExperienceToSessionService.addExperienceToTimetable({
  experience,
  date: new Date(),
  sessionNumber: 1,
  cohortId: 'cohort-123',
  epicId: 'epic-456',
  createdBy: 'user-789',
  sessionsPerDay: 3,
});

// Get session preview
const preview = ExperienceToSessionService.getSessionPreview(experience);
```

### Advanced Usage

```typescript
import {
  createCBLExperienceSessions,
  createBasicSession,
  toUtcIso,
} from '@/services/experienceToSession';

// Use individual creators
const cblResult = await createCBLExperienceSessions(options);

// Use utilities directly
const utcTime = toUtcIso(new Date(), '09:00');
```

## Benefits of Modularization

1. **Separation of Concerns**: Each module has a single responsibility
2. **Maintainability**: Easier to locate and modify specific functionality
3. **Testability**: Individual modules can be tested in isolation
4. **Reusability**: Utilities and creators can be used independently
5. **Scalability**: Easy to add new session types or modify existing ones
6. **Code Organization**: Clear structure makes the codebase more navigable

## Migration Notes

- The original `experienceToSessionService.ts` now re-exports from the modular structure
- All existing imports continue to work without changes
- New functionality should use the modular imports for better tree-shaking
- Type definitions are centralized in `types/index.ts`

## Adding New Session Types

1. Add the session type to `types/index.ts` if needed
2. Create a new creator function in `creators/simpleSessionCreators.ts` or a new file
3. Add the case to the switch statement in `ExperienceToSessionService.ts`
4. Update `sessionPreview.ts` if the new type has special preview logic
