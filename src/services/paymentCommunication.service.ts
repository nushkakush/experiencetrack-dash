import { emailService } from './email.service';
import { CommunicationPreferencesService } from './communicationPreferences.service';
import { ApiResponse } from '@/types/common';

export interface PaymentCommunicationContext {
  studentId: string;
  studentName: string;
  studentEmail: string;
  amount: number;
  installmentDescription: string;
  paymentMethod: string;
  referenceNumber: string;
  submissionDate: string;
  approvalDate?: string;
  rejectionDate?: string;
  rejectionReason?: string;
  submittedAmount?: number;
  approvedAmount?: number;
  remainingAmount?: number;
  receiptNumber?: string;
  paymentDate?: string;
  errorMessage?: string;
  attemptDate?: string;
  totalAmount?: number;
  firstPaymentAmount?: number;
  firstApprovalDate?: string;
  secondPaymentAmount?: number;
  secondApprovalDate?: string;
}

export class PaymentCommunicationService {
  /**
   * Check if student has communication preferences enabled
   */
  private static async shouldSendCommunication(
    studentId: string,
    channel: 'email' | 'whatsapp'
  ): Promise<boolean> {
    const preferences =
      await CommunicationPreferencesService.getPreferences(studentId);
    if (!preferences) return false;

    return preferences.automated_communications[channel].enabled;
  }

  /**
   * Send payment submitted notification
   */
  static async sendPaymentSubmittedNotification(
    context: PaymentCommunicationContext
  ): Promise<ApiResponse<boolean>> {
    try {
      const shouldSendEmail = await this.shouldSendCommunication(
        context.studentId,
        'email'
      );

      if (!shouldSendEmail) {
        return { data: false, error: null, success: true };
      }

      const response = await emailService.sendEmail({
        type: 'payment_submitted',
        recipient: {
          email: context.studentEmail,
          name: context.studentName,
        },
        subject: 'Payment Submitted Successfully - Verification Pending',
        content: `Dear ${context.studentName},

Your payment of ₹${context.amount} for ${context.installmentDescription} has been submitted successfully and is pending verification.

Payment Details:
- Amount: ₹${context.amount}
- Method: ${context.paymentMethod}
- Reference: ${context.referenceNumber}
- Date: ${context.submissionDate}

Our team will review your payment within 24-48 hours. You'll receive a confirmation email once verified.

Thank you for your payment!

Admissions Team,
LIT School`,
        context: {
          amount: context.amount,
          installmentDescription: context.installmentDescription,
          paymentMethod: context.paymentMethod,
          referenceNumber: context.referenceNumber,
          submissionDate: context.submissionDate,
        },
      });

      return {
        data: response.success,
        error: response.error,
        success: response.success,
      };
    } catch (error) {
      return { data: false, error: error.message, success: false };
    }
  }

  /**
   * Send payment approved notification
   */
  static async sendPaymentApprovedNotification(
    context: PaymentCommunicationContext
  ): Promise<ApiResponse<boolean>> {
    try {
      const shouldSendEmail = await this.shouldSendCommunication(
        context.studentId,
        'email'
      );

      if (!shouldSendEmail) {
        return { data: false, error: null, success: true };
      }

      const response = await emailService.sendEmail({
        type: 'payment_approved',
        recipient: {
          email: context.studentEmail,
          name: context.studentName,
        },
        subject: 'Payment Approved - Receipt Generated',
        content: `Dear ${context.studentName},

Great news! Your payment of ₹${context.amount} has been approved.

Payment Details:
- Amount: ₹${context.amount}
- Method: ${context.paymentMethod}
- Reference: ${context.referenceNumber}
- Approval Date: ${context.approvalDate}
- Installment: ${context.installmentDescription}

Your receipt has been generated and is available in your student portal.

Thank you for your payment!

Admissions Team,
LIT School`,
        context: {
          amount: context.amount,
          paymentMethod: context.paymentMethod,
          referenceNumber: context.referenceNumber,
          approvalDate: context.approvalDate,
          installmentDescription: context.installmentDescription,
        },
      });

      return {
        data: response.success,
        error: response.error,
        success: response.success,
      };
    } catch (error) {
      return { data: false, error: error.message, success: false };
    }
  }

  /**
   * Send payment partially approved notification
   */
  static async sendPaymentPartiallyApprovedNotification(
    context: PaymentCommunicationContext
  ): Promise<ApiResponse<boolean>> {
    try {
      const shouldSendEmail = await this.shouldSendCommunication(
        context.studentId,
        'email'
      );

      if (!shouldSendEmail) {
        return { data: false, error: null, success: true };
      }

      const response = await emailService.sendEmail({
        type: 'payment_partially_approved',
        recipient: {
          email: context.studentEmail,
          name: context.studentName,
        },
        subject: 'Payment Partially Approved - Balance Due',
        content: `Dear ${context.studentName},

Your payment has been partially approved.

Payment Details:
- Submitted Amount: ₹${context.submittedAmount}
- Approved Amount: ₹${context.approvedAmount}
- Remaining Balance: ₹${context.remainingAmount}
- Reference: ${context.referenceNumber}
- Approval Date: ${context.approvalDate}

Please submit the remaining amount of ₹${context.remainingAmount} to complete your payment.

You can make the remaining payment through your student portal.

Thank you!

Admissions Team,
LIT School`,
        context: {
          submittedAmount: context.submittedAmount,
          approvedAmount: context.approvedAmount,
          remainingAmount: context.remainingAmount,
          referenceNumber: context.referenceNumber,
          approvalDate: context.approvalDate,
        },
      });

      return {
        data: response.success,
        error: response.error,
        success: response.success,
      };
    } catch (error) {
      return { data: false, error: error.message, success: false };
    }
  }

  /**
   * Send payment rejected notification
   */
  static async sendPaymentRejectedNotification(
    context: PaymentCommunicationContext
  ): Promise<ApiResponse<boolean>> {
    try {
      const shouldSendEmail = await this.shouldSendCommunication(
        context.studentId,
        'email'
      );

      if (!shouldSendEmail) {
        return { data: false, error: null, success: true };
      }

      const response = await emailService.sendEmail({
        type: 'payment_rejected',
        recipient: {
          email: context.studentEmail,
          name: context.studentName,
        },
        subject: 'Payment Rejected - Action Required',
        content: `Dear ${context.studentName},

Your payment of ₹${context.amount} has been rejected.

Rejection Details:
- Submitted Amount: ₹${context.amount}
- Reference: ${context.referenceNumber}
- Rejection Date: ${context.rejectionDate}
- Reason: ${context.rejectionReason}

Please review the rejection reason and submit a new payment with the correct details.

If you have any questions, please contact our support team.

Admissions Team,
LIT School`,
        context: {
          amount: context.amount,
          referenceNumber: context.referenceNumber,
          rejectionDate: context.rejectionDate,
          rejectionReason: context.rejectionReason,
        },
      });

      return {
        data: response.success,
        error: response.error,
        success: response.success,
      };
    } catch (error) {
      return { data: false, error: error.message, success: false };
    }
  }

  /**
   * Send partial payment submitted notification
   */
  static async sendPartialPaymentSubmittedNotification(
    context: PaymentCommunicationContext
  ): Promise<ApiResponse<boolean>> {
    try {
      const shouldSendEmail = await this.shouldSendCommunication(
        context.studentId,
        'email'
      );

      if (!shouldSendEmail) {
        return { data: false, error: null, success: true };
      }

      const response = await emailService.sendEmail({
        type: 'partial_payment_submitted',
        recipient: {
          email: context.studentEmail,
          name: context.studentName,
        },
        subject: 'Partial Payment Submitted - Verification Pending',
        content: `Dear ${context.studentName},

Your partial payment of ₹${context.amount} has been submitted successfully and is pending verification.

Payment Details:
- Partial Amount: ₹${context.amount}
- Installment: ${context.installmentDescription}
- Method: ${context.paymentMethod}
- Reference: ${context.referenceNumber}
- Date: ${context.submissionDate}

This payment will complete your installment. You'll receive confirmation once verified.

Thank you!

Admissions Team,
LIT School`,
        context: {
          amount: context.amount,
          installmentDescription: context.installmentDescription,
          paymentMethod: context.paymentMethod,
          referenceNumber: context.referenceNumber,
          submissionDate: context.submissionDate,
        },
      });

      return {
        data: response.success,
        error: response.error,
        success: response.success,
      };
    } catch (error) {
      return { data: false, error: error.message, success: false };
    }
  }

  /**
   * Send all payments completed notification
   */
  static async sendAllPaymentsCompletedNotification(
    context: PaymentCommunicationContext
  ): Promise<ApiResponse<boolean>> {
    try {
      const shouldSendEmail = await this.shouldSendCommunication(
        context.studentId,
        'email'
      );

      if (!shouldSendEmail) {
        return { data: false, error: null, success: true };
      }

      const response = await emailService.sendEmail({
        type: 'all_payments_completed',
        recipient: {
          email: context.studentEmail,
          name: context.studentName,
        },
        subject: 'Installment Completed - All Payments Approved',
        content: `Dear ${context.studentName},

Excellent! Your installment is now complete.

Payment Summary:
- Total Installment Amount: ₹${context.totalAmount}
- First Payment: ₹${context.firstPaymentAmount} (approved on ${context.firstApprovalDate})
- Second Payment: ₹${context.secondPaymentAmount} (approved on ${context.secondApprovalDate})
- Installment: ${context.installmentDescription}

Your receipt has been generated and is available in your student portal.

Thank you for completing your payment!

Admissions Team,
LIT School`,
        context: {
          totalAmount: context.totalAmount,
          firstPaymentAmount: context.firstPaymentAmount,
          firstApprovalDate: context.firstApprovalDate,
          secondPaymentAmount: context.secondPaymentAmount,
          secondApprovalDate: context.secondApprovalDate,
          installmentDescription: context.installmentDescription,
        },
      });

      return {
        data: response.success,
        error: response.error,
        success: response.success,
      };
    } catch (error) {
      return { data: false, error: error.message, success: false };
    }
  }

  /**
   * Send receipt generated notification
   */
  static async sendReceiptGeneratedNotification(
    context: PaymentCommunicationContext
  ): Promise<ApiResponse<boolean>> {
    try {
      const shouldSendEmail = await this.shouldSendCommunication(
        context.studentId,
        'email'
      );

      if (!shouldSendEmail) {
        return { data: false, error: null, success: true };
      }

      const response = await emailService.sendEmail({
        type: 'receipt_generated',
        recipient: {
          email: context.studentEmail,
          name: context.studentName,
        },
        subject: `Payment Receipt Generated - ${context.installmentDescription}`,
        content: `Dear ${context.studentName},

Your payment receipt has been generated.

Receipt Details:
- Receipt Number: ${context.receiptNumber}
- Amount: ₹${context.amount}
- Installment: ${context.installmentDescription}
- Payment Date: ${context.paymentDate}
- Method: ${context.paymentMethod}

You can download your receipt from your student portal.

Thank you for your payment!

Admissions Team,
LIT School`,
        context: {
          receiptNumber: context.receiptNumber,
          amount: context.amount,
          installmentDescription: context.installmentDescription,
          paymentDate: context.paymentDate,
          paymentMethod: context.paymentMethod,
        },
      });

      return {
        data: response.success,
        error: response.error,
        success: response.success,
      };
    } catch (error) {
      return { data: false, error: error.message, success: false };
    }
  }

  /**
   * Send payment submission failed notification
   */
  static async sendPaymentSubmissionFailedNotification(
    context: PaymentCommunicationContext
  ): Promise<ApiResponse<boolean>> {
    try {
      const shouldSendEmail = await this.shouldSendCommunication(
        context.studentId,
        'email'
      );

      if (!shouldSendEmail) {
        return { data: false, error: null, success: true };
      }

      const response = await emailService.sendEmail({
        type: 'payment_submission_failed',
        recipient: {
          email: context.studentEmail,
          name: context.studentName,
        },
        subject: 'Payment Submission Failed - Action Required',
        content: `Dear ${context.studentName},

Your payment submission was unsuccessful.

Error Details:
- Attempted Amount: ₹${context.amount}
- Method: ${context.paymentMethod}
- Error: ${context.errorMessage}
- Date: ${context.attemptDate}

Please try submitting your payment again. If the issue persists, please contact our support team.

Admissions Team,
LIT School`,
        context: {
          amount: context.amount,
          paymentMethod: context.paymentMethod,
          errorMessage: context.errorMessage,
          attemptDate: context.attemptDate,
        },
      });

      return {
        data: response.success,
        error: response.error,
        success: response.success,
      };
    } catch (error) {
      return { data: false, error: error.message, success: false };
    }
  }
}
