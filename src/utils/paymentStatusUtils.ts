import { PaymentStatus, PAYMENT_STATUS_CONFIG } from '@/types/payments/PaymentStatus';

/**
 * Centralized Payment Status Utilities
 * 
 * This file consolidates all payment status logic to ensure consistency
 * between student and admin sides. All status calculations should use
 * these utilities instead of duplicating logic.
 */

/**
 * Get the display label for a payment status
 */
export const getPaymentStatusLabel = (status: PaymentStatus): string => {
  return PAYMENT_STATUS_CONFIG[status]?.label || 'Unknown';
};

/**
 * Get the color variant for a payment status
 */
export const getPaymentStatusColor = (status: PaymentStatus): string => {
  return PAYMENT_STATUS_CONFIG[status]?.color || 'gray';
};

/**
 * Get the priority for a payment status (higher number = higher priority)
 */
export const getPaymentStatusPriority = (status: PaymentStatus): number => {
  return PAYMENT_STATUS_CONFIG[status]?.priority || 0;
};

/**
 * Check if a payment status indicates overdue
 */
export const isPaymentOverdue = (status: PaymentStatus): boolean => {
  return status === 'overdue' || status === 'partially_paid_overdue';
};

/**
 * Check if a payment status indicates pending (not overdue)
 */
export const isPaymentPending = (status: PaymentStatus): boolean => {
  return status === 'pending' || status === 'pending_10_plus_days' || status === 'upcoming';
};

/**
 * Check if a payment status indicates verification pending
 */
export const isPaymentVerificationPending = (status: PaymentStatus): boolean => {
  return status === 'verification_pending' || status === 'partially_paid_verification_pending';
};

/**
 * Check if a payment status indicates paid
 */
export const isPaymentPaid = (status: PaymentStatus): boolean => {
  return status === 'paid' || status === 'on_time' || status === 'complete' || status === 'waived';
};

/**
 * Get the overall status display text for admin UI
 * This maps payment engine statuses to user-friendly display text
 */
export const getOverallStatusDisplay = (aggregateStatus: string): { status: PaymentStatus; text: string } => {
  switch (aggregateStatus) {
    case 'paid':
      return { status: 'paid' as const, text: 'All Payments Complete' };
    case 'overdue':
    case 'partially_paid_overdue':
      return { status: 'overdue' as const, text: 'Payments Overdue' };
    case 'verification_pending':
    case 'partially_paid_verification_pending':
      return { status: 'verification_pending' as const, text: 'Verification Pending' };
    case 'partially_paid_days_left':
      return { status: 'pending' as const, text: 'Partially Paid' };
    case 'pending_10_plus_days':
      return { status: 'pending_10_plus_days' as const, text: 'Payments Upcoming' };
    case 'pending':
    default:
      return { status: 'pending' as const, text: 'Payments Pending' };
  }
};

/**
 * Get the individual installment status display text
 * This maps payment engine statuses to user-friendly display text for individual installments
 */
export const getInstallmentStatusDisplay = (status: string): { status: PaymentStatus; text: string } => {
  switch (status) {
    case 'paid':
      return { status: 'paid' as const, text: 'Paid' };
    case 'waived':
      return { status: 'waived' as const, text: 'Waived' };
    case 'partially_waived':
      return { status: 'partially_waived' as const, text: 'Partially Waived' };
    case 'overdue':
      return { status: 'overdue' as const, text: 'Overdue' };
    case 'partially_paid_overdue':
      return { status: 'partially_paid_overdue' as const, text: 'Partially Paid (Overdue)' };
    case 'verification_pending':
      return { status: 'verification_pending' as const, text: 'Verification Pending' };
    case 'partially_paid_verification_pending':
      return { status: 'partially_paid_verification_pending' as const, text: 'Partially Paid (Verification Pending)' };
    case 'partially_paid_days_left':
      return { status: 'partially_paid_days_left' as const, text: 'Partially Paid' };
    case 'pending_10_plus_days':
      return { status: 'pending_10_plus_days' as const, text: 'Upcoming' };
    case 'pending':
    default:
      return { status: 'pending' as const, text: 'Pending' };
  }
};

/**
 * Calculate days until due date
 */
export const calculateDaysUntilDue = (dueDate: string): number => {
  const today = new Date();
  const d0 = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
  const d1 = new Date(
    new Date(dueDate).getFullYear(),
    new Date(dueDate).getMonth(),
    new Date(dueDate).getDate()
  ).getTime();
  return Math.ceil((d1 - d0) / (1000 * 60 * 60 * 24));
};

/**
 * Derive payment status based on due date, amount paid, and total payable
 * This is a simplified version for cases where payment engine is not available
 */
export const derivePaymentStatus = (
  dueDate: string,
  amountPaid: number,
  totalPayable: number,
  hasVerificationPendingTx: boolean = false,
  hasApprovedTx: boolean = false
): PaymentStatus => {
  // If fully paid and approved, it's paid
  if (hasApprovedTx && amountPaid >= totalPayable) {
    return 'paid';
  }

  // If verification pending and amount paid
  if (hasVerificationPendingTx && amountPaid > 0) {
    if (amountPaid >= totalPayable) return 'verification_pending';
    return 'partially_paid_verification_pending';
  }

  // If fully paid without verification pending
  if (amountPaid >= totalPayable) {
    return 'paid';
  }

  // Calculate days until due
  const daysUntilDue = calculateDaysUntilDue(dueDate);

  // If overdue
  if (daysUntilDue < 0) {
    return amountPaid > 0 ? 'partially_paid_overdue' : 'overdue';
  }

  // If partially paid and not overdue
  if (amountPaid > 0) {
    return 'partially_paid_days_left';
  }

  // If not paid and not overdue
  if (daysUntilDue >= 10) {
    return 'pending_10_plus_days';
  }

  return 'pending';
};

/**
 * Get the highest priority status from a list of statuses
 * Used for determining overall status when multiple installments have different statuses
 */
export const getHighestPriorityStatus = (statuses: PaymentStatus[]): PaymentStatus => {
  if (statuses.length === 0) return 'pending';

  return statuses.reduce((highest, current) => {
    const highestPriority = getPaymentStatusPriority(highest);
    const currentPriority = getPaymentStatusPriority(current);
    return currentPriority > highestPriority ? current : highest;
  });
};
