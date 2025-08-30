import {
  PaymentCommunicationService,
  PaymentCommunicationContext,
} from './paymentCommunication.service';
import {
  WhatsAppCommunicationService,
  WhatsAppMessageContext,
} from './whatsappCommunication.service';
import { ApiResponse } from '@/types/common';

export interface UnifiedPaymentCommunicationContext
  extends PaymentCommunicationContext {
  studentPhone?: string;
}

export interface CommunicationResult {
  emailSent: boolean;
  whatsappSent: boolean;
  emailError?: string;
  whatsappError?: string;
}

export class UnifiedPaymentCommunicationService {
  /**
   * Send payment submitted notification (Email + WhatsApp)
   */
  static async sendPaymentSubmittedNotification(
    context: UnifiedPaymentCommunicationContext
  ): Promise<ApiResponse<CommunicationResult>> {
    try {
      const [emailResult, whatsappResult] = await Promise.allSettled([
        PaymentCommunicationService.sendPaymentSubmittedNotification(context),
        context.studentPhone
          ? WhatsAppCommunicationService.sendPaymentSubmittedNotification({
              ...context,
              studentPhone: context.studentPhone,
            })
          : Promise.resolve({ data: false, error: null, success: true }),
      ]);

      const result: CommunicationResult = {
        emailSent:
          emailResult.status === 'fulfilled' && emailResult.value.success,
        whatsappSent:
          whatsappResult.status === 'fulfilled' && whatsappResult.value.success,
        emailError:
          emailResult.status === 'rejected' ? emailResult.reason : undefined,
        whatsappError:
          whatsappResult.status === 'rejected'
            ? whatsappResult.reason
            : undefined,
      };

      return { data: result, error: null, success: true };
    } catch (error) {
      return { data: null, error: error.message, success: false };
    }
  }

  /**
   * Send payment approved notification (Email + WhatsApp)
   */
  static async sendPaymentApprovedNotification(
    context: UnifiedPaymentCommunicationContext
  ): Promise<ApiResponse<CommunicationResult>> {
    try {
      const [emailResult, whatsappResult] = await Promise.allSettled([
        PaymentCommunicationService.sendPaymentApprovedNotification(context),
        context.studentPhone
          ? WhatsAppCommunicationService.sendPaymentApprovedNotification({
              ...context,
              studentPhone: context.studentPhone,
            })
          : Promise.resolve({ data: false, error: null, success: true }),
      ]);

      const result: CommunicationResult = {
        emailSent:
          emailResult.status === 'fulfilled' && emailResult.value.success,
        whatsappSent:
          whatsappResult.status === 'fulfilled' && whatsappResult.value.success,
        emailError:
          emailResult.status === 'rejected' ? emailResult.reason : undefined,
        whatsappError:
          whatsappResult.status === 'rejected'
            ? whatsappResult.reason
            : undefined,
      };

      return { data: result, error: null, success: true };
    } catch (error) {
      return { data: null, error: error.message, success: false };
    }
  }

  /**
   * Send payment partially approved notification (Email + WhatsApp)
   */
  static async sendPaymentPartiallyApprovedNotification(
    context: UnifiedPaymentCommunicationContext
  ): Promise<ApiResponse<CommunicationResult>> {
    try {
      const [emailResult, whatsappResult] = await Promise.allSettled([
        PaymentCommunicationService.sendPaymentPartiallyApprovedNotification(
          context
        ),
        context.studentPhone
          ? WhatsAppCommunicationService.sendPaymentPartiallyApprovedNotification(
              {
                ...context,
                studentPhone: context.studentPhone,
              }
            )
          : Promise.resolve({ data: false, error: null, success: true }),
      ]);

      const result: CommunicationResult = {
        emailSent:
          emailResult.status === 'fulfilled' && emailResult.value.success,
        whatsappSent:
          whatsappResult.status === 'fulfilled' && whatsappResult.value.success,
        emailError:
          emailResult.status === 'rejected' ? emailResult.reason : undefined,
        whatsappError:
          whatsappResult.status === 'rejected'
            ? whatsappResult.reason
            : undefined,
      };

      return { data: result, error: null, success: true };
    } catch (error) {
      return { data: null, error: error.message, success: false };
    }
  }

  /**
   * Send payment rejected notification (Email + WhatsApp)
   */
  static async sendPaymentRejectedNotification(
    context: UnifiedPaymentCommunicationContext
  ): Promise<ApiResponse<CommunicationResult>> {
    try {
      const [emailResult, whatsappResult] = await Promise.allSettled([
        PaymentCommunicationService.sendPaymentRejectedNotification(context),
        context.studentPhone
          ? WhatsAppCommunicationService.sendPaymentRejectedNotification({
              ...context,
              studentPhone: context.studentPhone,
            })
          : Promise.resolve({ data: false, error: null, success: true }),
      ]);

      const result: CommunicationResult = {
        emailSent:
          emailResult.status === 'fulfilled' && emailResult.value.success,
        whatsappSent:
          whatsappResult.status === 'fulfilled' && whatsappResult.value.success,
        emailError:
          emailResult.status === 'rejected' ? emailResult.reason : undefined,
        whatsappError:
          whatsappResult.status === 'rejected'
            ? whatsappResult.reason
            : undefined,
      };

      return { data: result, error: null, success: true };
    } catch (error) {
      return { data: null, error: error.message, success: false };
    }
  }

  /**
   * Send partial payment submitted notification (Email + WhatsApp)
   */
  static async sendPartialPaymentSubmittedNotification(
    context: UnifiedPaymentCommunicationContext
  ): Promise<ApiResponse<CommunicationResult>> {
    try {
      const [emailResult, whatsappResult] = await Promise.allSettled([
        PaymentCommunicationService.sendPartialPaymentSubmittedNotification(
          context
        ),
        context.studentPhone
          ? WhatsAppCommunicationService.sendPartialPaymentSubmittedNotification(
              {
                ...context,
                studentPhone: context.studentPhone,
              }
            )
          : Promise.resolve({ data: false, error: null, success: true }),
      ]);

      const result: CommunicationResult = {
        emailSent:
          emailResult.status === 'fulfilled' && emailResult.value.success,
        whatsappSent:
          whatsappResult.status === 'fulfilled' && whatsappResult.value.success,
        emailError:
          emailResult.status === 'rejected' ? emailResult.reason : undefined,
        whatsappError:
          whatsappResult.status === 'rejected'
            ? whatsappResult.reason
            : undefined,
      };

      return { data: result, error: null, success: true };
    } catch (error) {
      return { data: null, error: error.message, success: false };
    }
  }

  /**
   * Send all payments completed notification (Email + WhatsApp)
   */
  static async sendAllPaymentsCompletedNotification(
    context: UnifiedPaymentCommunicationContext
  ): Promise<ApiResponse<CommunicationResult>> {
    try {
      const [emailResult, whatsappResult] = await Promise.allSettled([
        PaymentCommunicationService.sendAllPaymentsCompletedNotification(
          context
        ),
        context.studentPhone
          ? WhatsAppCommunicationService.sendAllPaymentsCompletedNotification({
              ...context,
              studentPhone: context.studentPhone,
            })
          : Promise.resolve({ data: false, error: null, success: true }),
      ]);

      const result: CommunicationResult = {
        emailSent:
          emailResult.status === 'fulfilled' && emailResult.value.success,
        whatsappSent:
          whatsappResult.status === 'fulfilled' && whatsappResult.value.success,
        emailError:
          emailResult.status === 'rejected' ? emailResult.reason : undefined,
        whatsappError:
          whatsappResult.status === 'rejected'
            ? whatsappResult.reason
            : undefined,
      };

      return { data: result, error: null, success: true };
    } catch (error) {
      return { data: null, error: error.message, success: false };
    }
  }

  /**
   * Send receipt generated notification (Email + WhatsApp)
   */
  static async sendReceiptGeneratedNotification(
    context: UnifiedPaymentCommunicationContext
  ): Promise<ApiResponse<CommunicationResult>> {
    try {
      const [emailResult, whatsappResult] = await Promise.allSettled([
        PaymentCommunicationService.sendReceiptGeneratedNotification(context),
        context.studentPhone
          ? WhatsAppCommunicationService.sendReceiptGeneratedNotification({
              ...context,
              studentPhone: context.studentPhone,
            })
          : Promise.resolve({ data: false, error: null, success: true }),
      ]);

      const result: CommunicationResult = {
        emailSent:
          emailResult.status === 'fulfilled' && emailResult.value.success,
        whatsappSent:
          whatsappResult.status === 'fulfilled' && whatsappResult.value.success,
        emailError:
          emailResult.status === 'rejected' ? emailResult.reason : undefined,
        whatsappError:
          whatsappResult.status === 'rejected'
            ? whatsappResult.reason
            : undefined,
      };

      return { data: result, error: null, success: true };
    } catch (error) {
      return { data: null, error: error.message, success: false };
    }
  }

  /**
   * Send payment submission failed notification (Email + WhatsApp)
   */
  static async sendPaymentSubmissionFailedNotification(
    context: UnifiedPaymentCommunicationContext
  ): Promise<ApiResponse<CommunicationResult>> {
    try {
      const [emailResult, whatsappResult] = await Promise.allSettled([
        PaymentCommunicationService.sendPaymentSubmissionFailedNotification(
          context
        ),
        context.studentPhone
          ? WhatsAppCommunicationService.sendPaymentSubmissionFailedNotification(
              {
                ...context,
                studentPhone: context.studentPhone,
              }
            )
          : Promise.resolve({ data: false, error: null, success: true }),
      ]);

      const result: CommunicationResult = {
        emailSent:
          emailResult.status === 'fulfilled' && emailResult.value.success,
        whatsappSent:
          whatsappResult.status === 'fulfilled' && whatsappResult.value.success,
        emailError:
          emailResult.status === 'rejected' ? emailResult.reason : undefined,
        whatsappError:
          whatsappResult.status === 'rejected'
            ? whatsappResult.reason
            : undefined,
      };

      return { data: result, error: null, success: true };
    } catch (error) {
      return { data: null, error: error.message, success: false };
    }
  }
}
