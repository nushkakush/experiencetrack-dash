/**
 * Payment Status Types
 * Centralized payment status definitions for the application
 */

export type PaymentStatus =
  | 'pending'
  | 'pending_10_plus_days'
  | 'verification_pending'
  | 'paid'
  | 'overdue'
  | 'not_setup'
  | 'awaiting_bank_approval_e_nach'
  | 'awaiting_bank_approval_physical_mandate'
  | 'setup_request_failed_e_nach'
  | 'setup_request_failed_physical_mandate'
  | 'on_time'
  | 'failed_5_days_left'
  | 'complete'
  | 'dropped'
  | 'upcoming'
  | 'partially_paid_verification_pending'
  | 'partially_paid_days_left'
  | 'partially_paid_overdue';

export type PaymentPlan =
  | 'one_shot'
  | 'sem_wise'
  | 'instalment_wise'
  | 'not_selected';

// Use database enum types for transaction-related types
export type TransactionStatus = 'success' | 'failed' | 'pending';

export type TransactionType = 'payment' | 'refund' | 'adjustment';

export type PaymentMethod = 'online' | 'bank_transfer' | 'cash' | 'cheque';

export type VerificationStatus = 'pending' | 'verification_pending' | 'approved' | 'rejected';

export type CommunicationType = 
  | 'reminder' 
  | 'receipt' 
  | 'notification' 
  | 'verification_request' 
  | 'payment_confirmation' 
  | 'overdue_notice' 
  | 'plan_change_notification';

export type CommunicationChannel = 'email' | 'whatsapp' | 'sms' | 'in_app';

export type CommunicationStatus = 'sent' | 'delivered' | 'failed' | 'read';

/**
 * Payment Status Utilities
 */
export const PAYMENT_STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'yellow',
    priority: 1,
  },
  pending_10_plus_days: {
    label: 'Upcoming',
    color: 'orange',
    priority: 2,
  },
  verification_pending: {
    label: 'Verification Pending',
    color: 'blue',
    priority: 3,
  },
  paid: {
    label: 'Paid',
    color: 'green',
    priority: 0,
  },
  overdue: {
    label: 'Overdue',
    color: 'red',
    priority: 4,
  },
  not_setup: {
    label: 'Not Setup',
    color: 'gray',
    priority: 0,
  },
  awaiting_bank_approval_e_nach: {
    label: 'Awaiting Bank Approval (E-NACH)',
    color: 'blue',
    priority: 3,
  },
  awaiting_bank_approval_physical_mandate: {
    label: 'Awaiting Bank Approval (Physical)',
    color: 'blue',
    priority: 3,
  },
  setup_request_failed_e_nach: {
    label: 'Setup Failed (E-NACH)',
    color: 'red',
    priority: 4,
  },
  setup_request_failed_physical_mandate: {
    label: 'Setup Failed (Physical)',
    color: 'red',
    priority: 4,
  },
  on_time: {
    label: 'On Time',
    color: 'green',
    priority: 0,
  },
  failed_5_days_left: {
    label: 'Failed (5 days left)',
    color: 'red',
    priority: 4,
  },
  complete: {
    label: 'Complete',
    color: 'green',
    priority: 0,
  },
  dropped: {
    label: 'Dropped',
    color: 'gray',
    priority: 0,
  },
  upcoming: {
    label: 'Upcoming',
    color: 'blue',
    priority: 1,
  },
  partially_paid_verification_pending: {
    label: 'Partially Paid (Verification Pending)',
    color: 'yellow',
    priority: 3,
  },
  partially_paid_days_left: {
    label: 'Partially Paid (Days Left)',
    color: 'orange',
    priority: 2,
  },
  partially_paid_overdue: {
    label: 'Partially Paid (Overdue)',
    color: 'red',
    priority: 4,
  },
} as const;

/**
 * Payment Status Helper Functions
 */
export const isPaymentOverdue = (status: PaymentStatus): boolean => {
  return status.includes('overdue') || status === 'failed_5_days_left';
};

export const isPaymentPending = (status: PaymentStatus): boolean => {
  return status.includes('pending') || status === 'upcoming';
};

export const isPaymentComplete = (status: PaymentStatus): boolean => {
  return status === 'paid' || status === 'complete' || status === 'on_time';
};

export const getPaymentStatusPriority = (status: PaymentStatus): number => {
  return PAYMENT_STATUS_CONFIG[status]?.priority ?? 0;
};

export const getPaymentStatusColor = (status: PaymentStatus): string => {
  return PAYMENT_STATUS_CONFIG[status]?.color ?? 'gray';
};

export const getPaymentStatusLabel = (status: PaymentStatus): string => {
  return PAYMENT_STATUS_CONFIG[status]?.label ?? status;
};
