import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PaymentReminderData } from './types.ts';
import { getEmailSubject, getEmailContent } from './email-templates.ts';
import { extractDueDatesFromFeeStructure } from './reminder-logic.ts';
import { sendPaymentReminderEmail, logCommunication } from './email-service.ts';
import {
  getStudentsWithEmailReminders,
  getStudentPayments,
  getFeeStructure,
} from './database-service.ts';

export async function testAllEmailTemplates() {
  const supabase = createSupabaseClient();
  const results: any[] = [];

  // Get students and their payments
  const students = await getStudentsWithEmailReminders(supabase);
  const studentPayments = await getStudentPayments(supabase);

  // Create a map of student payments for quick lookup
  const studentPaymentsMap = new Map(
    studentPayments?.map(sp => [sp.student_id, sp]) || []
  );

  console.log(
    `[TEST-ALL-EMAILS] Found ${students?.length || 0} students with email reminders enabled`
  );
  console.log(
    `[TEST-ALL-EMAILS] Found ${studentPayments?.length || 0} student payments`
  );

  // Process each student
  for (const student of students || []) {
    try {
      const studentPayment = studentPaymentsMap.get(student.id);
      if (!studentPayment) {
        console.log(
          `[TEST-ALL-EMAILS] Skipping student ${student.email} - no payment record found`
        );
        continue;
      }

      // Get fee structure
      const feeStructure = await getFeeStructure(
        supabase,
        student.id,
        student.cohort_id
      );
      if (!feeStructure) {
        console.log(
          `[TEST-ALL-EMAILS] Skipping student ${student.email} - no fee structure found`
        );
        continue;
      }

      // Extract due dates from fee structure
      const dueDates = extractDueDatesFromFeeStructure(
        feeStructure,
        studentPayment,
        student.id,
        studentPayment.id
      );
      console.log(
        `[TEST-ALL-EMAILS] Found ${dueDates.length} due dates for student ${student.email}`
      );

      // Send all reminder types as tests (using only the first installment to avoid duplicates)
      const firstInstallment = dueDates[0]; // Use only the first installment
      const reminderTypes = [
        '7_days_before',
        '2_days_before',
        'on_due_date',
        'overdue_reminder',
      ];

      for (const reminderType of reminderTypes) {
        try {
          // Create test data for each reminder type
          const testData: PaymentReminderData = {
            student_id: student.id,
            student_email: 'kundan9595@gmail.com', // Always send to your email
            student_name:
              `${student.first_name || ''} ${student.last_name || ''}`.trim() ||
              'Student',
            payment_id: firstInstallment.id,
            due_date: firstInstallment.due_date,
            installment_number: firstInstallment.installment_number.toString(),
            days_remaining:
              reminderType === '7_days_before'
                ? 7
                : reminderType === '2_days_before'
                  ? 2
                  : reminderType === 'on_due_date'
                    ? 0
                    : -5, // -5 for overdue
            days_overdue: reminderType === 'overdue_reminder' ? 5 : 0,
            reminder_type: reminderType,
          };

          console.log(
            `[TEST-ALL-EMAILS] Sending ${reminderType} email for installment ${firstInstallment.id}`
          );

          // Send the email
          const emailResult = await sendPaymentReminderEmail(
            supabase,
            testData
          );

          // Log the communication
          await logCommunication(supabase, {
            channel: 'email',
            type: 'test_payment_reminder',
            recipient_email: 'kundan9595@gmail.com',
            recipient_phone: null,
            subject: `[TEST] ${getEmailSubject(reminderType)}`,
            content: getEmailContent(testData),
            context: {
              student_id: student.id,
              payment_id: firstInstallment.id,
              reminder_type: reminderType,
              installment_number: firstInstallment.installment_number,
              semester_number: firstInstallment.semester_number,
              test_mode: true,
              original_student_email: student.email,
            },
            status: emailResult.success ? 'sent' : 'failed',
            sent_at: new Date().toISOString(),
          });

          results.push({
            student_id: student.id,
            original_email: student.email,
            test_email: 'kundan9595@gmail.com',
            payment_id: firstInstallment.id,
            reminder_type: reminderType,
            installment_number: firstInstallment.installment_number,
            success: emailResult.success,
            message: emailResult.message,
            sent_at: new Date().toISOString(),
          });

          console.log(
            `[TEST-ALL-EMAILS] ${reminderType} email for ${firstInstallment.id}: ${emailResult.success ? 'SUCCESS' : 'FAILED'}`
          );

          // Wait 1 second between emails to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(
            `[TEST-ALL-EMAILS] Error sending ${reminderType} email for installment ${firstInstallment.id}:`,
            error
          );
          results.push({
            student_id: student.id,
            original_email: student.email,
            test_email: 'kundan9595@gmail.com',
            payment_id: firstInstallment.id,
            reminder_type: reminderType,
            installment_number: firstInstallment.installment_number,
            success: false,
            message: error.message,
            sent_at: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error(
        `[TEST-ALL-EMAILS] Error processing student ${student.email}:`,
        error
      );
      results.push({
        student_id: student.id,
        original_email: student.email,
        test_email: 'kundan9595@gmail.com',
        success: false,
        message: error.message,
        sent_at: new Date().toISOString(),
      });
    }
  }

  return {
    success: true,
    message: `Test emails sent for ${results.length} reminder types`,
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total_emails_sent: results.filter(r => r.success).length,
      total_emails_failed: results.filter(r => !r.success).length,
      students_processed: students?.length || 0,
      reminder_types_tested: [
        '7_days_before',
        '2_days_before',
        'on_due_date',
        'overdue_reminder',
      ],
    },
  };
}

function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseServiceKey);
}
