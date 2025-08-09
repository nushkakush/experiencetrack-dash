// This file now uses the modular type structure
// All types are organized in separate files for better maintainability

export * from './types/index';

// Legacy export for backward compatibility
// This ensures existing imports continue to work
export type { Database } from './types/base';
