import {
  PaymentReminderData,
  TestReminderData,
  CommunicationLog,
} from './types.ts';
import {
  getEmailSubject,
  getEmailContent,
  getTestEmailContent,
} from './email-templates.ts';

export async function sendPaymentReminderEmail(
  supabase: any,
  data: PaymentReminderData
) {
  try {
    const { data: emailResult, error: emailError } =
      await supabase.functions.invoke('send-email', {
        body: {
          type: 'automated_payment_reminder',
          recipient: {
            email: data.student_email,
            name: data.student_name,
          },
          subject: getEmailSubject(data.reminder_type),
          content: getEmailContent(data),
          context: {
            payment_id: data.payment_id,
            reminder_type: data.reminder_type,
            installment_number: data.installment_number,
            due_date: data.due_date,
            automated_reminder: true,
          },
        },
      });

    if (emailError) {
      console.error('[AUTOMATED-REMINDERS] Email service error:', emailError);
      return { success: false, message: emailError.message };
    }

    return {
      success: true,
      message: 'Payment reminder email sent successfully',
    };
  } catch (error) {
    console.error(
      '[AUTOMATED-REMINDERS] Error sending payment reminder email:',
      error
    );
    return { success: false, message: error.message };
  }
}

export async function sendTestEmail(supabase: any, data: TestReminderData) {
  try {
    const { data: emailResult, error: emailError } =
      await supabase.functions.invoke('send-email', {
        body: {
          type: 'test_automated_reminder',
          recipient: {
            email: data.student_email,
            name: data.student_name,
          },
          subject: '🧪 Test Automated Reminder System',
          content: getTestEmailContent(data),
          context: {
            test_mode: true,
            student_id: data.student_id,
            automated_reminder: true,
          },
        },
      });

    if (emailError) {
      console.error('[AUTOMATED-REMINDERS] Email service error:', emailError);
      return { success: false, message: emailError.message };
    }

    return { success: true, message: 'Test email sent successfully' };
  } catch (error) {
    console.error('[AUTOMATED-REMINDERS] Error sending test email:', error);
    return { success: false, message: error.message };
  }
}

export async function logCommunication(
  supabase: any,
  logData: CommunicationLog
) {
  try {
    const { error: logError } = await supabase
      .from('email_logs')
      .insert(logData);

    if (logError) {
      console.error(
        '[AUTOMATED-REMINDERS] Error logging communication:',
        logError
      );
    }
  } catch (error) {
    console.error('[AUTOMATED-REMINDERS] Error in logCommunication:', error);
  }
}
