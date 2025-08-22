/**
 * Payment Types Index
 * Centralized exports for all payment-related types
 */

// Core payment types
export * from './PaymentStatus';
export * from './PaymentMethods';
export * from './PaymentPlans';
export * from './FeeStructureTypes';
export * from './PaymentBreakdownTypes';
export * from './PartialPaymentTypes';

// Re-export commonly used types for backward compatibility
export type {
  PaymentStatus,
  PaymentType,
  PaymentPlan,
  TransactionStatus,
  TransactionType,
  PaymentMethod,
  CommunicationType,
  CommunicationChannel,
  CommunicationStatus
} from './PaymentStatus';

export type {
  PaymentMethodConfiguration,
  IndianBank,
  PaymentSubmissionData,
  PaymentTransaction
} from './PaymentMethods';

export type {
  FeeStructure,
  NewFeeStructureInput,
  Scholarship,
  NewScholarshipInput,
  StudentScholarship,
  NewStudentScholarshipInput,
  StudentScholarshipWithDetails,
  FeeCalculation,
  PaymentBreakdown,
  SemesterBreakdown,
  FeeStructureReview
} from './PaymentPlans';

// Re-export utility functions
export {
  PAYMENT_STATUS_CONFIG,
  isPaymentOverdue,
  isPaymentPending,
  isPaymentComplete,
  getPaymentStatusPriority,
  getPaymentStatusColor,
  getPaymentStatusLabel
} from './PaymentStatus';

export {
  PAYMENT_METHOD_CONFIG,
  getPaymentMethodConfig,
  isPaymentMethodEnabled,
  getAvailablePaymentMethods
} from './PaymentMethods';

export {
  PAYMENT_PLAN_CONFIG,
  getPaymentPlanConfig,
  isPaymentPlanValid,
  getPaymentPlanDiscount,
  calculateFeeBreakdown
} from './PaymentPlans';
