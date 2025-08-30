import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';

export interface EmailRequest {
  type:
    | 'invitation'
    | 'user_invitation'
    | 'custom'
    | 'payment_reminder'
    | 'notification'
    | 'payment_submitted'
    | 'payment_approved'
    | 'payment_partially_approved'
    | 'payment_rejected'
    | 'partial_payment_submitted'
    | 'all_payments_completed'
    | 'receipt_generated'
    | 'payment_submission_failed';
  template?: string;
  subject?: string;
  content?: string;
  recipient: {
    email: string;
    name: string;
  };
  context?: Record<string, any>;
  enhanceWithAI?: boolean;

  // Legacy invitation fields for backward compatibility
  studentId?: string;
  firstName?: string;
  lastName?: string;
  cohortName?: string;
  invitationType?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  invitationUrl?: string;
  emailSent: boolean;
  error?: string;
}

class EmailService {
  private supabaseUrl = 'https://ghmpaghyasyllfvamfna.supabase.co';

  /**
   * Universal email sending method
   */
  async sendEmail(request: EmailRequest): Promise<ApiResponse<EmailResponse>> {
    try {
      // Get current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return {
          data: null,
          error: 'User not authenticated. Please log in and try again.',
          success: false,
        };
      }

      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            Origin: window.location.origin,
            Referer: window.location.href,
          },
          body: JSON.stringify(request),
        }
      );

      const result = await response.json();

      if (result.success) {
        return { data: result, error: null, success: true };
      } else {
        return { data: null, error: result.error, success: false };
      }
    } catch (error) {
      return { data: null, error: error.message, success: false };
    }
  }

  /**
   * Send invitation email (backward compatibility)
   */
  async sendInvitationEmail(
    studentId: string,
    email: string,
    firstName: string,
    lastName: string,
    cohortName: string,
    invitationType?: string
  ): Promise<ApiResponse<{ invitationUrl: string; emailSent: boolean }>> {
    const request: EmailRequest = {
      type: invitationType === 'user' ? 'user_invitation' : 'invitation',
      recipient: {
        email,
        name: `${firstName} ${lastName}`,
      },
      studentId,
      firstName,
      lastName,
      cohortName,
      invitationType,
    };

    const result = await this.sendEmail(request);

    if (result.success && result.data) {
      return {
        data: {
          invitationUrl: result.data.invitationUrl || '',
          emailSent: result.data.emailSent || false,
        },
        error: null,
        success: true,
      };
    } else {
      return {
        data: null,
        error: result.error || 'Failed to send invitation',
        success: false,
      };
    }
  }

  /**
   * Send custom email
   */
  async sendCustomEmail(
    recipient: { email: string; name: string },
    subject: string,
    content: string,
    enhanceWithAI?: boolean
  ): Promise<ApiResponse<EmailResponse>> {
    const request: EmailRequest = {
      type: 'custom',
      recipient,
      subject,
      content,
      enhanceWithAI,
    };

    return this.sendEmail(request);
  }

  /**
   * Convert a number to its ordinal word representation
   */
  private numberToOrdinalWord(num: number): string {
    const ordinals = [
      'first',
      'second',
      'third',
      'fourth',
      'fifth',
      'sixth',
      'seventh',
      'eighth',
      'ninth',
      'tenth',
      'eleventh',
      'twelfth',
      'thirteenth',
      'fourteenth',
      'fifteenth',
      'sixteenth',
      'seventeenth',
      'eighteenth',
      'nineteenth',
      'twentieth',
      'twenty-first',
      'twenty-second',
      'twenty-third',
      'twenty-fourth',
      'twenty-fifth',
      'twenty-sixth',
      'twenty-seventh',
      'twenty-eighth',
      'twenty-ninth',
      'thirtieth',
      'thirty-first',
      'thirty-second',
      'thirty-third',
      'thirty-fourth',
      'thirty-fifth',
      'thirty-sixth',
      'thirty-seventh',
      'thirty-eighth',
      'thirty-ninth',
      'fortieth',
    ];

    if (num >= 1 && num <= ordinals.length) {
      return ordinals[num - 1];
    }

    // Fallback for numbers beyond our list
    const j = num % 10;
    const k = num % 100;
    let suffix = 'th';
    if (j === 1 && k !== 11) suffix = 'st';
    else if (j === 2 && k !== 12) suffix = 'nd';
    else if (j === 3 && k !== 13) suffix = 'rd';

    return `${num}${suffix}`;
  }

  /**
   * Send payment reminder email
   */
  async sendPaymentReminder(
    recipient: { email: string; name: string },
    paymentContext: {
      amount: number;
      dueDate: string;
      installmentNumber: number;
      studentName: string;
    },
    customMessage?: string
  ): Promise<ApiResponse<EmailResponse>> {
    const ordinalInstallment = this.numberToOrdinalWord(
      paymentContext.installmentNumber
    );
    const subject = `Payment Reminder - ${ordinalInstallment} Installment`;

    const defaultContent = `Dear ${paymentContext.studentName},

This is a friendly reminder that your ${ordinalInstallment} installment payment of ${paymentContext.amount} is due on ${paymentContext.dueDate}.

Please ensure timely payment to avoid any late fees or complications with your program.

If you have any questions or need assistance, please don't hesitate to contact us.

Best regards,
Admissions team,
LIT School`;

    const content = customMessage || defaultContent;

    const request: EmailRequest = {
      type: 'payment_reminder',
      recipient,
      subject,
      content,
      context: paymentContext,
    };

    return this.sendEmail(request);
  }

  /**
   * Enhance email content with AI (placeholder for future implementation)
   */
  async enhanceWithAI(
    content: string,
    context: string,
    tone: 'professional' | 'friendly' | 'formal' = 'professional'
  ): Promise<string> {
    // TODO: Implement OpenAI integration
    // For now, return the original content
    console.log('AI enhancement requested:', { content, context, tone });
    return content;
  }

  /**
   * Get email logs for tracking
   */
  async getEmailLogs(limit: number = 50): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error) {
      return { data: null, error: error.message, success: false };
    }
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export const getEmailService = (): EmailService => {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
};

export const emailService = getEmailService();
