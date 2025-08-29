export async function getStudentsWithEmailReminders(supabase: any) {
  const { data: students, error: studentsError } = await supabase
    .from('cohort_students')
    .select(
      `
      id,
      email,
      first_name,
      last_name,
      cohort_id,
      communication_preferences
    `
    )
    .eq(
      'communication_preferences->automated_communications->email->enabled',
      true
    );

  if (studentsError) {
    console.error(
      '[AUTOMATED-REMINDERS] Error fetching students:',
      studentsError
    );
    throw studentsError;
  }

  console.log(
    `[AUTOMATED-REMINDERS] Found ${students?.length || 0} students with email reminders enabled`
  );
  return students;
}

export async function getStudentPayments(supabase: any) {
  const { data: studentPayments, error: paymentsError } = await supabase.from(
    'student_payments'
  ).select(`
      id,
      student_id,
      payment_plan,
      scholarship_id
    `);

  if (paymentsError) {
    console.error(
      '[AUTOMATED-REMINDERS] Error fetching student payments:',
      paymentsError
    );
    throw paymentsError;
  }

  return studentPayments;
}

export async function getFeeStructure(
  supabase: any,
  studentId: string,
  cohortId: string
) {
  // Get fee structure - first check for student-specific, then fall back to cohort-level
  let { data: feeStructure, error: feeError } = await supabase
    .from('fee_structures')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (feeError || !feeStructure) {
    // Fall back to cohort-level fee structure
    const { data: cohortFeeStructure, error: cohortFeeError } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('structure_type', 'cohort')
      .single();

    feeStructure = cohortFeeStructure;
    feeError = cohortFeeError;
  }

  if (feeError || !feeStructure) {
    console.log(
      `[AUTOMATED-REMINDERS] No fee structure found for student ${studentId}`
    );
    return null;
  }

  return feeStructure;
}

export async function getReminderTracking(supabase: any, paymentId: string) {
  const { data: currentTracking } = await supabase
    .from('student_payments')
    .select('reminder_tracking')
    .eq('id', paymentId)
    .single();

  return currentTracking?.reminder_tracking || {};
}

export async function updateReminderTracking(
  supabase: any,
  paymentId: string,
  reminderType: string
) {
  try {
    const { error: updateError } = await supabase
      .from('student_payments')
      .update({
        reminder_tracking: {
          last_reminder_type: reminderType,
          last_reminder_sent_at: new Date().toISOString(),
          next_reminder_date: null,
          reminder_count: 1,
        },
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error(
        '[AUTOMATED-REMINDERS] Error updating reminder tracking:',
        updateError
      );
    }
  } catch (error) {
    console.error(
      '[AUTOMATED-REMINDERS] Error in updateReminderTracking:',
      error
    );
  }
}
