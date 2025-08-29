import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';

export interface EmailRequest {
  type:
    | 'invitation'
    | 'user_invitation'
    | 'custom'
    | 'payment_reminder'
    | 'notification';
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
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXBhZ2h5YXN5bGxmdmFtZm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTI0NDgsImV4cCI6MjA3MDIyODQ0OH0.qhWHU-KkdpvfOTG-ROxf1BMTUlah2xDYJean69hhyH4`,
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
    const subject = `Payment Reminder - ${paymentContext.installmentNumber} Installment`;

    const defaultContent = `Dear ${paymentContext.studentName},

This is a friendly reminder that your ${paymentContext.installmentNumber} installment payment of ${paymentContext.amount} is due on ${paymentContext.dueDate}.

Please ensure timely payment to avoid any late fees or complications with your program.

If you have any questions or need assistance, please don't hesitate to contact us.

Best regards,
LIT OS Team`;

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
