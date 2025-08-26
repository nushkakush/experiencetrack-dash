#!/usr/bin/env tsx

/**
 * Direct database update script to fix payment schedules
 * This bypasses the browser-specific Supabase client
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ghmpaghyasyllfvamfna.supabase.co';
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const COHORT_ID = 'f56dfcd5-197d-4186-97e9-712311c73bc9';

// Create a Node.js compatible Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface PaymentInstallment {
  installment_number: number;
  semester_number?: number;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'partially_paid';
  amount_paid: number;
  amount_pending: number;
}

interface PaymentSchedule {
  plan: string;
  total_amount: number;
  admission_fee: number;
  program_fee: number;
  installments: PaymentInstallment[];
  summary: {
    total_installments: number;
    next_due_date?: string;
    next_due_amount?: number;
    completion_percentage: number;
  };
}

function calculatePaymentSchedule(
  paymentPlan: string,
  feeStructure: {
    total_program_fee: number;
    admission_fee: number;
    number_of_semesters: number;
    instalments_per_semester: number;
  },
  startDate: string,
  scholarshipPercentage: number
): PaymentSchedule {
  const totalProgramFee = Number(feeStructure.total_program_fee);
  const admissionFee = Number(feeStructure.admission_fee);

  const totalDiscount = scholarshipPercentage;
  const discountAmount = (totalProgramFee * totalDiscount) / 100;
  const finalProgramFee = totalProgramFee - discountAmount;
  const totalAmount = admissionFee + finalProgramFee;

  const installments: PaymentInstallment[] = [];
  const startDateObj = new Date(startDate);

  if (paymentPlan === 'one_shot') {
    installments.push({
      installment_number: 1,
      due_date: startDateObj.toISOString().split('T')[0],
      amount: totalAmount,
      status: 'pending',
      amount_paid: 0,
      amount_pending: totalAmount,
    });
  } else if (paymentPlan === 'sem_wise') {
    const semesterAmount = finalProgramFee / feeStructure.number_of_semesters;

    for (let i = 0; i < feeStructure.number_of_semesters; i++) {
      const dueDate = new Date(startDateObj);
      dueDate.setMonth(startDateObj.getMonth() + i * 6);

      installments.push({
        installment_number: i + 1,
        semester_number: i + 1,
        due_date: dueDate.toISOString().split('T')[0],
        amount: semesterAmount,
        status: 'pending',
        amount_paid: 0,
        amount_pending: semesterAmount,
      });
    }
  } else if (paymentPlan === 'instalment_wise') {
    const totalInstallments =
      feeStructure.number_of_semesters * feeStructure.instalments_per_semester;
    const installmentAmount = finalProgramFee / totalInstallments;

    for (let i = 0; i < totalInstallments; i++) {
      const dueDate = new Date(startDateObj);
      dueDate.setMonth(startDateObj.getMonth() + i);

      const semesterNumber =
        Math.floor(i / feeStructure.instalments_per_semester) + 1;

      installments.push({
        installment_number: i + 1,
        semester_number: semesterNumber,
        due_date: dueDate.toISOString().split('T')[0],
        amount: installmentAmount,
        status: 'pending',
        amount_paid: 0,
        amount_pending: installmentAmount,
      });
    }
  }

  return {
    plan: paymentPlan,
    total_amount: totalAmount,
    admission_fee: admissionFee,
    program_fee: finalProgramFee,
    installments,
    summary: {
      total_installments: installments.length,
      next_due_date: installments[0]?.due_date,
      next_due_amount: installments[0]?.amount,
      completion_percentage: 0,
    },
  };
}

async function getScholarshipPercentage(
  scholarshipId: string
): Promise<number> {
  try {
    const { data: scholarship, error } = await supabase
      .from('cohort_scholarships')
      .select('amount_percentage')
      .eq('id', scholarshipId)
      .single();

    if (error) {
      console.error('Error fetching scholarship:', error);
      return 0;
    }

    return Number(scholarship?.amount_percentage || 0);
  } catch (error) {
    console.error('Error in getScholarshipPercentage:', error);
    return 0;
  }
}

async function fixPaymentSchedules() {
  try {
    console.log('🔄 Starting payment schedule fix for cohort:', COHORT_ID);

    // Get all student payments for the cohort
    const { data: studentPayments, error: fetchError } = await supabase
      .from('student_payments')
      .select('*')
      .eq('cohort_id', COHORT_ID);

    if (fetchError) {
      console.error('❌ Error fetching student payments:', fetchError);
      return;
    }

    if (!studentPayments || studentPayments.length === 0) {
      console.log('ℹ️ No student payments found for recalculation');
      return;
    }

    console.log(
      `📊 Found ${studentPayments.length} student payments to update`
    );

    // Get fee structure and cohort data
    const { data: feeStructure, error: feeError } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('cohort_id', COHORT_ID)
      .single();

    if (feeError) {
      console.error('❌ Error fetching fee structure:', feeError);
      return;
    }

    const { data: cohortData, error: cohortError } = await supabase
      .from('cohorts')
      .select('start_date')
      .eq('id', COHORT_ID)
      .single();

    if (cohortError) {
      console.error('❌ Error fetching cohort data:', cohortError);
      return;
    }

    let updatedCount = 0;
    let errorCount = 0;

    // Recalculate each student's payment schedule
    for (const studentPayment of studentPayments) {
      try {
        console.log(`🔄 Processing student: ${studentPayment.student_id}`);

        // Get scholarship percentage if applicable
        let scholarshipPercentage = 0;
        if (studentPayment.scholarship_id) {
          scholarshipPercentage = await getScholarshipPercentage(
            studentPayment.scholarship_id
          );
          console.log(`💰 Scholarship percentage: ${scholarshipPercentage}%`);
        }

        // Recalculate payment schedule
        const newPaymentSchedule = calculatePaymentSchedule(
          studentPayment.payment_plan,
          feeStructure,
          cohortData.start_date,
          scholarshipPercentage
        );

        console.log(
          `📅 New schedule has ${newPaymentSchedule.installments.length} installments across ${feeStructure.number_of_semesters} semesters`
        );

        // Update the payment record
        const { error: updateError } = await supabase
          .from('student_payments')
          .update({
            payment_schedule: newPaymentSchedule,
            total_amount_payable: newPaymentSchedule.total_amount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', studentPayment.id);

        if (updateError) {
          console.error(
            `❌ Error updating student payment ${studentPayment.student_id}:`,
            updateError
          );
          errorCount++;
        } else {
          console.log(
            `✅ Updated student payment: ${studentPayment.student_id}`
          );
          updatedCount++;
        }
      } catch (error) {
        console.error(
          `❌ Error processing student payment ${studentPayment.student_id}:`,
          error
        );
        errorCount++;
      }
    }

    console.log('🎉 Payment schedule fix completed!');
    console.log(`📊 Updated: ${updatedCount}, Errors: ${errorCount}`);
  } catch (error) {
    console.error('💥 Error running payment schedule fix:', error);
  }
}

// Run the script
fixPaymentSchedules()
  .then(() => {
    console.log('🎉 Script execution completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script execution failed:', error);
    process.exit(1);
  });
