// Re-export all types from modular files
export * from './base';
export * from './tables';
export * from './views';
export * from './functions';

// Convenience exports for commonly used types
export type {
  AttendanceRecordTable,
  CancelledSessionTable,
  CohortEpicTable,
  CohortStudentTable,
  CohortTable,
  ProfileTable,
} from './tables';

export type {
  AttendanceSummaryView,
} from './views';

export type {
  HasRoleFunction,
  IsSessionCancelledFunction,
  MarkStudentAttendanceFunction,
  ToggleSessionCancellationFunction,
} from './functions';

// Re-export the main Database type and utilities
export type { Database, Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes } from './base';
export { Constants } from './base';
