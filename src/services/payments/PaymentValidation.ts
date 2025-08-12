import { ApiResponse } from '@/types/common';
import { PaymentPlan, PaymentStatus } from '@/types/fee';
import { StudentPaymentRow } from '@/types/payments/DatabaseAlignedTypes';
import { 
  PaymentValidationResult,
  PaymentPlanValidation,
  FeeStructure,
  StudentData,
  PaymentSubmission,
  StudentScholarship
} from '@/types/payments/PaymentValidationTypes';



export class PaymentValidationService {
  /**
   * Validate payment data
   */
  static validatePayment(payment: Partial<StudentPaymentRow>): PaymentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!payment.student_id) {
      errors.push('Student ID is required');
    }

    if (!payment.cohort_id) {
      errors.push('Cohort ID is required');
    }

    if (!payment.payment_type) {
      errors.push('Payment type is required');
    }

    if (!payment.payment_plan) {
      errors.push('Payment plan is required');
    }

    if (payment.base_amount === undefined || payment.base_amount < 0) {
      errors.push('Base amount must be a positive number');
    }

    if (payment.amount_payable === undefined || payment.amount_payable < 0) {
      errors.push('Amount payable must be a positive number');
    }

    if (payment.amount_paid === undefined || payment.amount_paid < 0) {
      errors.push('Amount paid must be a positive number');
    }

    if (!payment.due_date) {
      errors.push('Due date is required');
    }

    // Business logic validation
    if (payment.amount_paid > payment.amount_payable) {
      errors.push('Amount paid cannot exceed amount payable');
    }

    if (payment.scholarship_amount && payment.scholarship_amount < 0) {
      errors.push('Scholarship amount cannot be negative');
    }

    if (payment.discount_amount && payment.discount_amount < 0) {
      errors.push('Discount amount cannot be negative');
    }

    if (payment.gst_amount && payment.gst_amount < 0) {
      errors.push('GST amount cannot be negative');
    }

    // Date validation
    if (payment.due_date && new Date(payment.due_date) < new Date()) {
      warnings.push('Due date is in the past');
    }

    // Status validation
    if (payment.status && !this.isValidPaymentStatus(payment.status)) {
      errors.push('Invalid payment status');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate payment plan selection
   */
  static validatePaymentPlan(
    paymentPlan: PaymentPlan,
    feeStructure: FeeStructure,
    studentData: StudentData
  ): PaymentPlanValidation {
    const errors: string[] = [];
    const recommendations: string[] = [];

    if (paymentPlan === 'not_selected') {
      errors.push('Payment plan must be selected');
      return { isValid: false, errors, recommendations };
    }

    // Validate against fee structure
    if (feeStructure) {
      if (paymentPlan === 'one_shot') {
        if (feeStructure.one_shot_discount_percentage > 0) {
          recommendations.push(`One-shot payment offers ${feeStructure.one_shot_discount_percentage}% discount`);
        }
      }

      if (paymentPlan === 'sem_wise') {
        if (feeStructure.number_of_semesters <= 0) {
          errors.push('Invalid number of semesters in fee structure');
        }
      }

      if (paymentPlan === 'instalment_wise') {
        if (feeStructure.instalments_per_semester <= 0) {
          errors.push('Invalid number of instalments per semester in fee structure');
        }
      }
    }

    // Student-specific validation
    if (studentData) {
      // Check if student has existing payments
      if (studentData.existingPayments && studentData.existingPayments.length > 0) {
        recommendations.push('Student has existing payments. Consider payment plan carefully.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      recommendations,
    };
  }

  /**
   * Validate payment submission
   */
  static validatePaymentSubmission(submission: PaymentSubmission): PaymentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!submission.paymentMethod) {
      errors.push('Payment method is required');
    }

    if (!submission.amountPaid || submission.amountPaid <= 0) {
      errors.push('Payment amount must be greater than 0');
    }

    if (submission.amountPaid > submission.requiredAmount) {
      errors.push('Payment amount cannot exceed required amount');
    }

    // File validation for receipt uploads
    if (submission.receiptFile) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (submission.receiptFile.size > maxSize) {
        errors.push('Receipt file size must be less than 5MB');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(submission.receiptFile.type)) {
        errors.push('Receipt file must be JPEG, PNG, or PDF');
      }
    }

    // Reference number validation
    if (submission.paymentReferenceNumber) {
      if (submission.paymentReferenceNumber.length < 3) {
        warnings.push('Payment reference number seems too short');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if payment status is valid
   */
  private static isValidPaymentStatus(status: string): status is PaymentStatus {
    const validStatuses: PaymentStatus[] = [
      'pending',
      'pending_10_plus_days',
      'verification_pending',
      'paid',
      'overdue',
      'not_setup',
      'awaiting_bank_approval_e_nach',
      'awaiting_bank_approval_physical_mandate',
      'setup_request_failed_e_nach',
      'setup_request_failed_physical_mandate',
      'on_time',
      'failed_5_days_left',
      'complete',
      'dropped',
      'upcoming',
      'partially_paid_verification_pending',
      'partially_paid_days_left',
      'partially_paid_overdue',
    ];

    return validStatuses.includes(status as PaymentStatus);
  }

  /**
   * Validate scholarship assignment
   */
  static validateScholarshipAssignment(
    scholarshipId: string,
    studentId: string,
    existingScholarships: StudentScholarship[]
  ): PaymentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!scholarshipId) {
      errors.push('Scholarship ID is required');
    }

    if (!studentId) {
      errors.push('Student ID is required');
    }

    // Check for existing scholarship
    const existingScholarship = existingScholarships.find(
      (s) => s.student_id === studentId && s.scholarship_id === scholarshipId
    );

    if (existingScholarship) {
      errors.push('Student already has this scholarship assigned');
    }

    // Check for multiple scholarships
    const studentScholarships = existingScholarships.filter((s) => s.student_id === studentId);
    if (studentScholarships.length > 0) {
      warnings.push('Student already has scholarships assigned. Consider replacing existing ones.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
