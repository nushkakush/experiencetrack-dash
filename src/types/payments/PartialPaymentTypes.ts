/**
 * Partial Payment Types
 * Types and interfaces for handling partial payment functionality
 */

export interface PartialPaymentSummary {
  installmentId: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  partialPayments: PartialPaymentDetail[];
  canMakePartialPayment: boolean;
  maxPartialPayments: number;
  currentPartialPaymentCount: number;
}

export interface PartialPaymentDetail {
  id: string;
  sequenceNumber: number;
  amount: number;
  status: 'pending' | 'verification_pending' | 'approved' | 'rejected' | 'partially_approved';
  paymentDate?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
  rejectionReason?: string;
}

export interface PartialApprovalRequest {
  transactionId: string;
  originalAmount: number;
  approvedAmount: number;
  remainingAmount: number;
  approvalNotes?: string;
}

export interface PartialPaymentConfig {
  allowPartialPayments: boolean;
  maxPartialPaymentsPerInstallment: number;
  minimumPartialPaymentAmount?: number;
  minimumRemainingAmount?: number;
}

export interface PaymentInstallmentWithPartials {
  id: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'partially_paid' | 'verification_pending' | 'on_time' | 'overdue' | 'complete';
  partialPayments: PartialPaymentDetail[];
  totalPaid: number;
  remainingAmount: number;
  canAcceptPartialPayment: boolean;
}

/**
 * Utility type for admin partial approval actions
 */
export interface AdminPartialApprovalAction {
  type: 'approve_full' | 'approve_partial' | 'reject';
  transactionId: string;
  approvedAmount?: number; // Only for approve_partial
  rejectionReason?: string; // Only for reject
  adminNotes?: string;
}

/**
 * Response type for partial payment calculations from payment engine
 */
export interface PartialPaymentCalculationResponse {
  installmentId: string;
  originalAmount: number;
  totalPaid: number;
  pendingAmount: number;
  nextPaymentAmount: number; // What the student should pay next
  canMakeAnotherPayment: boolean;
  partialPaymentHistory: PartialPaymentDetail[];
  restrictions: {
    maxPartialPayments: number;
    currentCount: number;
    remainingPayments: number;
  };
}
