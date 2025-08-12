import { NewFeeStructureInput, Scholarship, FeeStructure } from '@/types/fee';

export interface FeeCollectionSetupState {
  currentStep: number;
  loading: boolean;
  saving: boolean;
  feeStructureData: NewFeeStructureInput;
  scholarships: Scholarship[];
  errors: Record<string, string>;
  isFeeStructureComplete: boolean;
}

export interface UseFeeCollectionSetupProps {
  cohortId: string;
  onSetupComplete: () => void;
}

export interface FeeCollectionSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohortId: string;
  cohortStartDate: string;
  onSetupComplete: () => void;
}

export interface StepNavigationProps {
  steps: Step[];
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onSave?: () => void;
  onEdit?: () => void;
  onClose?: () => void;
  isComplete?: boolean;
  saving?: boolean;
  canProceed?: boolean;
  nextButtonText?: string;
  saveButtonText?: string;
}

export interface Step {
  id: number;
  title: string;
  description?: string;
}

export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface FeeStructureValidationData {
  feeStructure: NewFeeStructureInput;
  scholarships: Scholarship[];
}

export interface ScholarshipValidationData {
  scholarship: Scholarship;
  index: number;
  allScholarships: Scholarship[];
}
