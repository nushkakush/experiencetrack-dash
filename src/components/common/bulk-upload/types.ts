export interface ValidationResult<T> {
  valid: T[];
  invalid: Array<{
    data: Record<string, unknown>;
    errors: string[];
    row: number;
  }>;
  duplicates?: Array<{
    data: T;
    row: number;
    existingData?: Record<string, unknown>;
  }>;
}

export interface BulkUploadConfig<T> {
  requiredHeaders: string[];
  optionalHeaders?: string[];
  validateRow: (data: Record<string, unknown>, row: number) => string[];
  processValidData: (
    data: T[],
    duplicateHandling: 'ignore' | 'overwrite'
  ) => Promise<{ success: boolean; message: string }> | Promise<void>;
  checkDuplicates?: (
    data: T[]
  ) => Promise<
    Array<{ data: T; row: number; existingData?: Record<string, unknown> }>
  >;
  templateData?: string | (() => Promise<string>);
  dialogTitle: string;
  dialogDescription: string;
  fileType: string;
  fileExtension: string;
}

export interface BulkUploadState {
  isOpen: boolean;
  isDragOver: boolean;
  selectedFile: File | null;
  validationResult: ValidationResult<Record<string, unknown>> | null;
  isProcessing: boolean;
  isUploading: boolean;
  duplicateHandling: 'ignore' | 'overwrite';
  currentStep: 'upload' | 'validate' | 'confirm';
}

export type BulkUploadAction =
  | { type: 'SET_OPEN'; payload: boolean }
  | { type: 'SET_DRAG_OVER'; payload: boolean }
  | { type: 'SET_FILE'; payload: File | null }
  | {
      type: 'SET_VALIDATION_RESULT';
      payload: ValidationResult<Record<string, unknown>> | null;
    }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_UPLOADING'; payload: boolean }
  | { type: 'SET_DUPLICATE_HANDLING'; payload: 'ignore' | 'overwrite' }
  | { type: 'SET_STEP'; payload: 'upload' | 'validate' | 'confirm' }
  | { type: 'RESET' };
