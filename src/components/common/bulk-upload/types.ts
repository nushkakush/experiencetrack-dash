export interface ValidationResult<T> {
  valid: T[];
  invalid: Array<{
    data: any;
    errors: string[];
    row: number;
  }>;
  duplicates?: Array<{
    data: T;
    row: number;
    existingData?: any;
  }>;
}

export interface BulkUploadConfig<T> {
  requiredHeaders: string[];
  optionalHeaders?: string[];
  validateRow: (data: any, row: number) => string[];
  processValidData: (data: T[], duplicateHandling: 'ignore' | 'overwrite') => Promise<{ success: boolean; message: string }> | Promise<void>;
  checkDuplicates?: (data: T[]) => Promise<Array<{ data: T; row: number; existingData?: any }>>;
  templateData?: string;
  dialogTitle: string;
  dialogDescription: string;
  fileType: string;
  fileExtension: string;
}

export interface BulkUploadState {
  isOpen: boolean;
  isDragOver: boolean;
  selectedFile: File | null;
  validationResult: ValidationResult<any> | null;
  isProcessing: boolean;
  isUploading: boolean;
  duplicateHandling: 'ignore' | 'overwrite';
  currentStep: 'upload' | 'validate' | 'confirm';
}

export type BulkUploadAction =
  | { type: 'SET_OPEN'; payload: boolean }
  | { type: 'SET_DRAG_OVER'; payload: boolean }
  | { type: 'SET_FILE'; payload: File | null }
  | { type: 'SET_VALIDATION_RESULT'; payload: ValidationResult<any> | null }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_UPLOADING'; payload: boolean }
  | { type: 'SET_DUPLICATE_HANDLING'; payload: 'ignore' | 'overwrite' }
  | { type: 'SET_STEP'; payload: 'upload' | 'validate' | 'confirm' }
  | { type: 'RESET' };
