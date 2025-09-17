import { CommunicationPreferencesService } from './communicationPreferences.service';
import { ApiResponse } from '@/types/common';
import { formatPaymentMethodForEmail } from '@/utils/paymentMethodFormatter';

export interface WhatsAppMessageContext {
  studentId: string;
  studentName: string;
  studentPhone: string;
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

export class WhatsAppCommunicationService {
  /**
   * Check if student has WhatsApp communication preferences enabled
   */
  private static async shouldSendWhatsApp(studentId: string): Promise<boolean> {
    const preferences =
      await CommunicationPreferencesService.getPreferences(studentId);
    if (!preferences) return false;

    return preferences.automated_communications.whatsapp.enabled;
  }

  /**
   * Send payment submitted WhatsApp notification
   */
  static async sendPaymentSubmittedNotification(
    context: WhatsAppMessageContext
  ): Promise<ApiResponse<boolean>> {
    try {
      const shouldSendWhatsApp = await this.shouldSendWhatsApp(
        context.studentId
      );

      if (!shouldSendWhatsApp) {
        return { data: false, error: null, success: true };
      }

      const message = `Dear ${context.studentName},

Your payment of ₹${context.amount} for ${context.installmentDescription} has been submitted successfully and is pending verification.

Payment Details:
• Amount: ₹${context.amount}
• Method: ${formatPaymentMethodForEmail(context.paymentMethod)}
• Reference: ${context.referenceNumber}
• Date: ${context.submissionDate}

Our team will review your payment within 24-48 hours. You'll receive a confirmation message once verified.

Thank you for your payment!
Admissions Team,
LIT School`;

      // TODO: Implement WhatsApp API integration
      console.log('WhatsApp message would be sent:', {
        to: context.studentPhone,
        message: message,
      });

      return { data: true, error: null, success: true };
    } catch (error) {
      return { data: false, error: error.message, success: false };
    }
  }

  /**
   * Send payment approved WhatsApp notification
   */
  static async sendPaymentApprovedNotification(
    context: WhatsAppMessageContext
  ): Promise<ApiResponse<boolean>> {
    try {
      const shouldSendWhatsApp = await this.shouldSendWhatsApp(
        context.studentId
      );

      if (!shouldSendWhatsApp) {
        return { data: false, error: null, success: true };
      }

      const message = `Dear ${context.studentName},

Great news! Your payment of ₹${context.amount} has been approved.

Payment Details:
• Amount: ₹${context.amount}
• Method: ${formatPaymentMethodForEmail(context.paymentMethod)}
• Reference: ${context.referenceNumber}
• Approval Date: ${context.approvalDate}
• Installment: ${context.installmentDescription}

Your receipt has been generated and is available in your student portal.

Thank you for your payment!

Admissions Team,
LIT School`;

      // TODO: Implement WhatsApp API integration
      console.log('WhatsApp message would be sent:', {
        to: context.studentPhone,
        message: message,
      });

      return { data: true, error: null, success: true };
    } catch (error) {
      return { data: false, error: error.message, success: false };
    }
  }

  /**
   * Send payment partially approved WhatsApp notification
   */
  static async sendPaymentPartiallyApprovedNotification(
    context: WhatsAppMessageContext
  ): Promise<ApiResponse<boolean>> {
    try {
      const shouldSendWhatsApp = await this.shouldSendWhatsApp(
        context.studentId
      );

      if (!shouldSendWhatsApp) {
        return { data: false, error: null, success: true };
      }

      const message = `Dear ${context.studentName},

Your payment has been partially approved.

Payment Details:
• Submitted Amount: ₹${context.submittedAmount}
• Approved Amount: ₹${context.approvedAmount}
• Remaining Balance: ₹${context.remainingAmount}
• Reference: ${context.referenceNumber}
• Approval Date: ${context.approvalDate}

Please submit the remaining amount of ₹${context.remainingAmount} to complete your payment.

You can make the remaining payment through your student portal.

Thank you!

Admissions Team,
LIT School`;

      // TODO: Implement WhatsApp API integration
      console.log('WhatsApp message would be sent:', {
        to: context.studentPhone,
        message: message,
      });

      return { data: true, error: null, success: true };
    } catch (error) {
      return { data: false, error: error.message, success: false };
    }
  }

  /**
   * Send payment rejected WhatsApp notification
   */
  static async sendPaymentRejectedNotification(
    context: WhatsAppMessageContext
  ): Promise<ApiResponse<boolean>> {
    try {
      const shouldSendWhatsApp = await this.shouldSendWhatsApp(
        context.studentId
      );

      if (!shouldSendWhatsApp) {
        return { data: false, error: null, success: true };
      }

      const message = `Dear ${context.studentName},

Your payment of ₹${context.amount} has been rejected.

Rejection Details:
• Submitted Amount: ₹${context.amount}
• Reference: ${context.referenceNumber}
• Rejection Date: ${context.rejectionDate}
• Reason: ${context.rejectionReason}

Please review the rejection reason and submit a new payment with the correct details.

If you have any questions, please contact our support team.

Admissions Team,
LIT School`;

      // TODO: Implement WhatsApp API integration
      console.log('WhatsApp message would be sent:', {
        to: context.studentPhone,
        message: message,
      });

      return { data: true, error: null, success: true };
    } catch (error) {
      return { data: false, error: error.message, success: false };
    }
  }

  /**
   * Send partial payment submitted WhatsApp notification
   */
  static async sendPartialPaymentSubmittedNotification(
    context: WhatsAppMessageContext
  ): Promise<ApiResponse<boolean>> {
    try {
      const shouldSendWhatsApp = await this.shouldSendWhatsApp(
        context.studentId
      );

      if (!shouldSendWhatsApp) {
        return { data: false, error: null, success: true };
      }

      const message = `Dear ${context.studentName},

Your partial payment of ₹${context.amount} has been submitted successfully and is pending verification.

Payment Details:
• Partial Amount: ₹${context.amount}
• Installment: ${context.installmentDescription}
• Method: ${formatPaymentMethodForEmail(context.paymentMethod)}
• Reference: ${context.referenceNumber}
• Date: ${context.submissionDate}

This payment will complete your installment. You'll receive confirmation once verified.

Thank you!
LIT School Team`;

      // TODO: Implement WhatsApp API integration
      console.log('WhatsApp message would be sent:', {
        to: context.studentPhone,
        message: message,
      });

      return { data: true, error: null, success: true };
    } catch (error) {
      return { data: false, error: error.message, success: false };
    }
  }

  /**
   * Send all payments completed WhatsApp notification
   */
  static async sendAllPaymentsCompletedNotification(
    context: WhatsAppMessageContext
  ): Promise<ApiResponse<boolean>> {
    try {
      const shouldSendWhatsApp = await this.shouldSendWhatsApp(
        context.studentId
      );

      if (!shouldSendWhatsApp) {
        return { data: false, error: null, success: true };
      }

      const message = `Dear ${context.studentName},

Excellent! Your installment is now complete.

Payment Summary:
• Total Installment Amount: ₹${context.totalAmount}
• First Payment: ₹${context.firstPaymentAmount} (approved on ${context.firstApprovalDate})
• Second Payment: ₹${context.secondPaymentAmount} (approved on ${context.secondApprovalDate})
• Installment: ${context.installmentDescription}

Your receipt has been generated and is available in your student portal.

Thank you for completing your payment!

Admissions Team,
LIT School`;

      // TODO: Implement WhatsApp API integration
      console.log('WhatsApp message would be sent:', {
        to: context.studentPhone,
        message: message,
      });

      return { data: true, error: null, success: true };
    } catch (error) {
      return { data: false, error: error.message, success: false };
    }
  }

  /**
   * Send receipt generated WhatsApp notification
   */
  static async sendReceiptGeneratedNotification(
    context: WhatsAppMessageContext
  ): Promise<ApiResponse<boolean>> {
    try {
      const shouldSendWhatsApp = await this.shouldSendWhatsApp(
        context.studentId
      );

      if (!shouldSendWhatsApp) {
        return { data: false, error: null, success: true };
      }

      const message = `Dear ${context.studentName},

Your payment receipt has been generated.

Receipt Details:
• Receipt Number: ${context.receiptNumber}
• Amount: ₹${context.amount}
• Installment: ${context.installmentDescription}
• Payment Date: ${context.paymentDate}
• Method: ${formatPaymentMethodForEmail(context.paymentMethod)}

You can download your receipt from your student portal.

Thank you for your payment!

Admissions Team,
LIT School`;

      // TODO: Implement WhatsApp API integration
      console.log('WhatsApp message would be sent:', {
        to: context.studentPhone,
        message: message,
      });

      return { data: true, error: null, success: true };
    } catch (error) {
      return { data: false, error: error.message, success: false };
    }
  }

  /**
   * Send payment submission failed WhatsApp notification
   */
  static async sendPaymentSubmissionFailedNotification(
    context: WhatsAppMessageContext
  ): Promise<ApiResponse<boolean>> {
    try {
      const shouldSendWhatsApp = await this.shouldSendWhatsApp(
        context.studentId
      );

      if (!shouldSendWhatsApp) {
        return { data: false, error: null, success: true };
      }

      const message = `Dear ${context.studentName},

Your payment submission was unsuccessful.

Error Details:
• Attempted Amount: ₹${context.amount}
• Method: ${formatPaymentMethodForEmail(context.paymentMethod)}
• Error: ${context.errorMessage}
• Date: ${context.attemptDate}

Please try submitting your payment again. If the issue persists, please contact our support team.

Admissions Team,
LIT School`;

      // TODO: Implement WhatsApp API integration
      console.log('WhatsApp message would be sent:', {
        to: context.studentPhone,
        message: message,
      });

      return { data: true, error: null, success: true };
    } catch (error) {
      return { data: false, error: error.message, success: false };
    }
  }
}
