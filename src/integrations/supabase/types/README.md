# Supabase Types Structure

This directory contains the modular TypeScript types for the Supabase database schema.

## 📁 File Structure

```
types/
├── base.ts          # Base types, Database interface, and utilities
├── tables.ts        # All table type definitions
├── views.ts         # All view type definitions
├── functions.ts     # All function type definitions
├── index.ts         # Re-exports all types for easy importing
└── README.md        # This documentation file
```

## 🔧 Usage

### Importing Types

```typescript
// Import everything (recommended for most cases)
import type { Database } from '@/integrations/supabase/types';

// Import specific table types
import type { 
  AttendanceRecordTable, 
  CohortTable,
  ProfileTable 
} from '@/integrations/supabase/types';

// Import specific view types
import type { AttendanceSummaryView } from '@/integrations/supabase/types';

// Import specific function types
import type { MarkStudentAttendanceFunction } from '@/integrations/supabase/types';

// Import utilities
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
```

### Type Utilities

```typescript
// Get Row type for a table
type AttendanceRecord = Database['public']['Tables']['attendance_records']['Row'];

// Get Insert type for a table
type NewAttendanceRecord = Database['public']['Tables']['attendance_records']['Insert'];

// Get Update type for a table
type AttendanceRecordUpdate = Database['public']['Tables']['attendance_records']['Update'];

// Get function return type
type MarkAttendanceResult = Database['public']['Functions']['mark_student_attendance']['Returns'];
```

## 🏗️ Architecture

### Base Types (`base.ts`)
- `Database` interface
- Type utilities (`Tables`, `TablesInsert`, `TablesUpdate`, etc.)
- Constants and enums
- Common type definitions

### Table Types (`tables.ts`)
- `AttendanceRecordTable`
- `CancelledSessionTable`
- `CohortEpicTable`
- `CohortStudentTable`
- `CohortTable`
- `ProfileTable`

### View Types (`views.ts`)
- `AttendanceSummaryView`

### Function Types (`functions.ts`)
- `HasRoleFunction`
- `IsSessionCancelledFunction`
- `MarkStudentAttendanceFunction`
- `ToggleSessionCancellationFunction`

## 🔄 Maintenance

When the database schema changes:

1. **Regenerate types**: Run `supabase gen types typescript --local`
2. **Update modular files**: Copy the relevant sections to the appropriate files
3. **Update index.ts**: Ensure all exports are current
4. **Test imports**: Verify that existing code still works

## 💡 Benefits

- **Better organization**: Related types are grouped together
- **Easier maintenance**: Smaller files are easier to navigate and update
- **Selective imports**: Only import what you need
- **Better IDE support**: Faster autocomplete and type checking
- **Backward compatibility**: Existing imports continue to work
