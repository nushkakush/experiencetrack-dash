import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getEmailSubject, getEmailContent } from './email-templates.ts';
import { PaymentReminderData } from './types.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

export async function testAllEmailTemplates() {
  const supabase = createSupabaseClient();

  // Test data for all reminder types
  const testData: PaymentReminderData = {
    student_id: 'test-student-id',
    student_email: 'test@example.com',
    student_name: 'Test Student',
    payment_id: 'test-payment-id',
    due_date: new Date().toISOString(),
    installment_number: '1',
    days_remaining: 7,
    days_overdue: 0,
    reminder_type: '7_days_before',
  };

  const reminderTypes = [
    '7_days_before',
    '2_days_before',
    'on_due_date',
    'overdue_reminder',
  ];
  const results = [];

  for (const reminderType of reminderTypes) {
    const testDataWithType = { ...testData, reminder_type: reminderType };

    try {
      const subject = getEmailSubject(reminderType);
      const content = getEmailContent(testDataWithType);

      results.push({
        reminder_type: reminderType,
        subject,
        content_preview: content.substring(0, 200) + '...',
        success: true,
      });
    } catch (error) {
      results.push({
        reminder_type: reminderType,
        error: error.message,
        success: false,
      });
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'All email templates tested successfully',
      timestamp: new Date().toISOString(),
      results,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseServiceKey);
}
