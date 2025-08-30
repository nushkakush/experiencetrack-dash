import { PaymentReminderData } from './types.ts';
import { numberToOrdinalWord } from './utils.ts';

export function getEmailSubject(reminderType: string): string {
  const subjects = {
    '7_days_before': 'Payment Reminder - Your Installment is Due Soon',
    '2_days_before': 'Urgent: Payment Due in 2 Days',
    on_due_date: 'Today is Your Payment Due Date',
    overdue_reminder: 'Overdue Payment Notice',
  };
  return subjects[reminderType] || 'Payment Reminder';
}

export function getEmailContent(data: PaymentReminderData): string {
  // Convert installment number to ordinal word
  const installmentNumber = parseInt(data.installment_number);
  const ordinalInstallment = numberToOrdinalWord(installmentNumber);

  const templates = {
    '7_days_before': `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Payment Reminder</h2>
        <p>Hello ${data.student_name},</p>
        <p>This is a friendly reminder that your <strong>${ordinalInstallment} installment</strong> payment is due on <strong>${new Date(data.due_date).toLocaleDateString('en-IN')}</strong>.</p>
        <p>Please ensure timely payment to avoid any late fees.</p>
        <p>Best regards,<br>Admissions team,<br>LIT School</p>
      </div>
    `,
    '2_days_before': `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Urgent: Payment Due in 2 Days</h2>
        <p>Hello ${data.student_name},</p>
        <p><strong>URGENT:</strong> Your <strong>${ordinalInstallment} installment</strong> payment is due in 2 days on <strong>${new Date(data.due_date).toLocaleDateString('en-IN')}</strong>.</p>
        <p>Please complete your payment immediately to avoid late fees.</p>
        <p>Best regards,<br>Admissions team,<br>LIT School</p>
      </div>
    `,
    on_due_date: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Today is Your Payment Due Date</h2>
        <p>Hello ${data.student_name},</p>
        <p>Today, <strong>${new Date(data.due_date).toLocaleDateString('en-IN')}</strong>, is the due date for your <strong>${ordinalInstallment} installment</strong> payment.</p>
        <p>Please complete your payment today to maintain your program status.</p>
        <p>Best regards,<br>Admissions team,<br>LIT School</p>
      </div>
    `,
    overdue_reminder: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Overdue Payment Notice</h2>
        <p>Hello ${data.student_name},</p>
        <p>Your <strong>${ordinalInstallment} installment</strong> payment was due on <strong>${new Date(data.due_date).toLocaleDateString('en-IN')}</strong> and is currently <strong>${data.days_overdue} days overdue</strong>.</p>
        <p>This payment is essential for the continuation of your program. Please complete your payment immediately to avoid program suspension.</p>
        <p>Best regards,<br>Admissions team,<br>LIT School</p>
      </div>
    `,
  };
  return templates[data.reminder_type] || templates['on_due_date'];
}

export function getTestEmailContent(data: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">🧪 Test Automated Reminder</h2>
      <p>Hello ${data.student_name},</p>
      <p>This is a <strong>test email</strong> from the automated payment reminder system.</p>
      <p><strong>Test Details:</strong></p>
      <ul>
        <li>Student ID: ${data.student_id}</li>
        <li>Email: ${data.student_email}</li>
        <li>Sent at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</li>
        <li>Test Message: ${data.test_message}</li>
      </ul>
      <p>This email confirms that:</p>
      <ul>
        <li>✅ Your email reminders are enabled</li>
        <li>✅ The automated system is working</li>
        <li>✅ You will receive payment reminders when due</li>
      </ul>
      <p style="color: #6b7280; font-size: 14px;">
        This is a test email. No action is required from your side.
      </p>
      <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        Sent by LIT OS Automated Reminder System
      </p>
    </div>
  `;
}
