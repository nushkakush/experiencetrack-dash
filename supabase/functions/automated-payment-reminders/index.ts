import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  TestReminderData,
  PaymentReminderData,
  ReminderResult,
} from './types.ts';
import { getEmailSubject, getEmailContent } from './email-templates.ts';
import {
  determineReminderType,
  extractDueDatesFromFeeStructure,
  filterDueDatesNeedingReminders,
} from './reminder-logic.ts';
import {
  sendPaymentReminderEmail,
  sendTestEmail,
  logCommunication,
} from './email-service.ts';
import {
  getStudentsWithEmailReminders,
  getStudentPayments,
  getFeeStructure,
  getReminderTracking,
  updateReminderTracking,
} from './database-service.ts';
import { testAllEmailTemplates } from './test-all-emails.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { test_mode = false } = body;

    const { test_all_emails = false } = body;

    if (test_all_emails) {
      console.log('[AUTOMATED-REMINDERS] Starting test all email templates...');
      return await testAllEmailTemplates();
    } else if (test_mode) {
      console.log('[AUTOMATED-REMINDERS] Starting test reminder processing...');
      return await processTestReminders();
    } else {
      console.log(
        '[AUTOMATED-REMINDERS] Starting payment reminder processing...'
      );
      return await processPaymentReminders();
    }
  } catch (error) {
    console.error('[AUTOMATED-REMINDERS] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function processTestReminders() {
  const supabase = createSupabaseClient();
  const students = await getStudentsWithEmailReminders(supabase);
  const results: ReminderResult[] = [];

  // Process each student
  for (const student of students || []) {
    try {
      const testData: TestReminderData = {
        student_id: student.id,
        student_email: student.email,
        student_name:
          `${student.first_name || ''} ${student.last_name || ''}`.trim() ||
          'Student',
        test_message: `This is a test automated reminder sent at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
      };

      // Send test email
      const emailResult = await sendTestEmail(supabase, testData);

      // Log the communication
      await logCommunication(supabase, {
        channel: 'email',
        type: 'automated_test_reminder',
        recipient_email: student.email,
        recipient_phone: null,
        subject: 'Test Automated Reminder',
        content: testData.test_message,
        context: {
          student_id: student.id,
          test_timestamp: new Date().toISOString(),
          reminder_type: 'test_automated',
        },
        status: emailResult.success ? 'sent' : 'failed',
        sent_at: new Date().toISOString(),
      });

      results.push({
        student_id: student.id,
        email: student.email,
        success: emailResult.success,
        message: emailResult.message,
      });

      console.log(
        `[AUTOMATED-REMINDERS] Processed student ${student.email}: ${emailResult.success ? 'SUCCESS' : 'FAILED'}`
      );
    } catch (error) {
      console.error(
        `[AUTOMATED-REMINDERS] Error processing student ${student.email}:`,
        error
      );
      results.push({
        student_id: student.id,
        email: student.email,
        success: false,
        message: error.message,
      });
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Test reminders processed for ${students?.length || 0} students`,
      timestamp: new Date().toISOString(),
      results,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function processPaymentReminders() {
  const supabase = createSupabaseClient();
  const today = new Date();
  const results: ReminderResult[] = [];

  // Get students and their payments
  const students = await getStudentsWithEmailReminders(supabase);
  const studentPayments = await getStudentPayments(supabase);

  // Create a map of student payments for quick lookup
  const studentPaymentsMap = new Map(
    studentPayments?.map(sp => [sp.student_id, sp]) || []
  );
  console.log(
    `[AUTOMATED-REMINDERS] Found ${studentPayments?.length || 0} student payments`
  );
  console.log(
    `[AUTOMATED-REMINDERS] Student payments map size:`,
    studentPaymentsMap.size
  );

  // Process each student
  for (const student of students || []) {
    try {
      const studentPayment = studentPaymentsMap.get(student.id);
      if (!studentPayment) {
        console.log(
          `[AUTOMATED-REMINDERS] Skipping student ${student.email} - no payment record found`
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
          `[AUTOMATED-REMINDERS] Skipping student ${student.email} - no fee structure found`
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
        `[AUTOMATED-REMINDERS] Found ${dueDates.length} due dates for student ${student.email} with payment plan: ${studentPayment.payment_plan}`
      );

      // Filter due dates that need reminders
      const installments = filterDueDatesNeedingReminders(dueDates, today);
      console.log(
        `[AUTOMATED-REMINDERS] Found ${installments.length} installments needing reminders for student ${student.email}`
      );

      // Process each installment
      for (const installment of installments) {
        try {
          const dueDate = new Date(installment.due_date);
          const daysRemaining = Math.ceil(
            (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          const daysOverdue = Math.max(0, -daysRemaining);

          console.log(
            `[AUTOMATED-REMINDERS] Processing installment ${installment.id}:`
          );
          console.log(
            `[AUTOMATED-REMINDERS] - Due date: ${installment.due_date}`
          );
          console.log(
            `[AUTOMATED-REMINDERS] - Today: ${today.toISOString().split('T')[0]}`
          );
          console.log(
            `[AUTOMATED-REMINDERS] - Days remaining: ${daysRemaining}`
          );
          console.log(`[AUTOMATED-REMINDERS] - Days overdue: ${daysOverdue}`);

          // Determine if reminder should be sent
          const reminderType = determineReminderType(
            daysRemaining,
            daysOverdue
          );
          console.log(`[AUTOMATED-REMINDERS] - Reminder type: ${reminderType}`);

          if (!reminderType) {
            console.log(
              `[AUTOMATED-REMINDERS] Skipping installment ${installment.id} - no reminder needed (${daysRemaining} days remaining)`
            );
            continue;
          }

          // Check if reminder was already sent today
          const reminderTracking = await getReminderTracking(
            supabase,
            studentPayment.id
          );
          const lastReminderDate = reminderTracking.last_reminder_sent_at;

          if (lastReminderDate) {
            const lastReminder = new Date(lastReminderDate);
            const todayStart = new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate()
            );
            const lastReminderStart = new Date(
              lastReminder.getFullYear(),
              lastReminder.getMonth(),
              lastReminder.getDate()
            );

            if (lastReminderStart.getTime() === todayStart.getTime()) {
              console.log(
                `[AUTOMATED-REMINDERS] Skipping installment ${installment.id} - reminder already sent today`
              );
              continue;
            }
          }

          const reminderData: PaymentReminderData = {
            student_id: student.id,
            student_email: student.email,
            student_name:
              `${student.first_name || ''} ${student.last_name || ''}`.trim() ||
              'Student',
            payment_id: installment.id,
            due_date: installment.due_date,
            installment_number: installment.installment_number.toString(),
            days_remaining: daysRemaining,
            days_overdue: daysOverdue,
            reminder_type: reminderType,
          };

          // Send payment reminder email
          const emailResult = await sendPaymentReminderEmail(
            supabase,
            reminderData
          );

          // Update reminder tracking
          await updateReminderTracking(
            supabase,
            studentPayment.id,
            reminderType
          );

          // Log the communication
          await logCommunication(supabase, {
            channel: 'email',
            type: 'automated_payment_reminder',
            recipient_email: student.email,
            recipient_phone: null,
            subject: getEmailSubject(reminderType),
            content: getEmailContent(reminderData),
            context: {
              student_id: student.id,
              payment_id: installment.id,
              reminder_type: reminderType,
              days_remaining: daysRemaining,
              days_overdue: daysOverdue,
              installment_number: installment.installment_number,
              semester_number: installment.semester_number,
            },
            status: emailResult.success ? 'sent' : 'failed',
            sent_at: new Date().toISOString(),
          });

          results.push({
            student_id: student.id,
            email: student.email,
            payment_id: installment.id,
            reminder_type: reminderType,
            success: emailResult.success,
            message: emailResult.message,
          });

          console.log(
            `[AUTOMATED-REMINDERS] Processed installment ${installment.id} for ${student.email}: ${emailResult.success ? 'SUCCESS' : 'FAILED'}`
          );
        } catch (error) {
          console.error(
            `[AUTOMATED-REMINDERS] Error processing installment ${installment.id}:`,
            error
          );
          results.push({
            student_id: student.id,
            email: student.email,
            payment_id: installment.id,
            success: false,
            message: error.message,
          });
        }
      }
    } catch (error) {
      console.error(
        `[AUTOMATED-REMINDERS] Error processing student ${student.email}:`,
        error
      );
      results.push({
        student_id: student.id,
        email: student.email,
        success: false,
        message: error.message,
      });
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Payment reminders processed for ${results.length} installments`,
      timestamp: new Date().toISOString(),
      results,
      debug: {
        students_found: students?.length || 0,
        students_with_payments:
          students?.filter(s => studentPaymentsMap.has(s.id)).length || 0,
        total_installments_found: results.length,
        today: today.toISOString().split('T')[0],
        student_payments_count: studentPayments?.length || 0,
        student_payments_map_size: studentPaymentsMap.size,
        student_ids: students?.map(s => s.id) || [],
        payment_student_ids: studentPayments?.map(sp => sp.student_id) || [],
      },
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseServiceKey);
}
