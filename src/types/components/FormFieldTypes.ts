// Form Field Types - Comprehensive type definitions for form field components

// Form Field Value Types
export type FormFieldValue = string | number | boolean | null | undefined;

// Form Field Type Types
export type FormFieldType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'date' | 'time' | 'datetime-local' | 'url' | 'search';

// Form Field Option Types
export interface FormFieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Form Field Validation Types
export interface FormFieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  custom?: (value: FormFieldValue) => string | null;
}

// Form Field Props Types
export interface FormFieldProps {
  label: string;
  name: string;
  type?: FormFieldType;
  placeholder?: string;
  value?: FormFieldValue;
  onChange?: (value: FormFieldValue) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  options?: FormFieldOption[];
  className?: string;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  validation?: FormFieldValidation;
}

// Form Field State Types
export interface FormFieldState {
  value: FormFieldValue;
  error: string | null;
  isDirty: boolean;
  isTouched: boolean;
  isValid: boolean;
}

// Form Field Actions Types
export interface FormFieldActions {
  setValue: (value: FormFieldValue) => void;
  setError: (error: string | null) => void;
  setDirty: (isDirty: boolean) => void;
  setTouched: (isTouched: boolean) => void;
  validate: () => string | null;
  reset: () => void;
}

// Form Field Hook Return Types
export interface UseFormFieldReturn extends FormFieldState, FormFieldActions {}

export interface UseFormFieldProps {
  name: string;
  initialValue?: FormFieldValue;
  validation?: FormFieldValidation;
  onChange?: (value: FormFieldValue) => void;
  onBlur?: () => void;
}

// Form Field Event Types
export interface FormFieldEvents {
  onChange: (value: FormFieldValue) => void;
  onBlur: () => void;
  onFocus: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onKeyUp: (event: React.KeyboardEvent) => void;
}

// Form Field Configuration Types
export interface FormFieldConfig {
  type: FormFieldType;
  validation: FormFieldValidation;
  options?: FormFieldOption[];
  placeholder?: string;
  className?: string;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
}

// Form Field Renderer Types
export interface FormFieldRendererProps {
  field: FormFieldConfig;
  value: FormFieldValue;
  onChange: (value: FormFieldValue) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

// Form Field Validation Result Types
export interface FormFieldValidationResult {
  isValid: boolean;
  error: string | null;
  warnings: string[];
}

// Form Field Error Types
export interface FormFieldError {
  type: 'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  message: string;
  field: string;
}

// Utility Types
export type FormFieldPropsUpdate = Partial<FormFieldProps>;
export type FormFieldStateUpdate = Partial<FormFieldState>;
export type FormFieldConfigUpdate = Partial<FormFieldConfig>;

// Form Field Component Types
export interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export interface NumberFieldProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface BooleanFieldProps {
  value: boolean;
  onChange: (value: boolean) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: FormFieldOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export interface TextareaFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
}

// Form Field Factory Types
export interface FormFieldFactory {
  createField: (config: FormFieldConfig) => React.ComponentType<FormFieldRendererProps>;
  validateField: (value: FormFieldValue, validation: FormFieldValidation) => FormFieldValidationResult;
  getFieldType: (type: FormFieldType) => string;
}
