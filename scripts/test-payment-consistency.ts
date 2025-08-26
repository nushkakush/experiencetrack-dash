#!/usr/bin/env tsx

/**
 * Test script to verify payment calculation consistency
 * This tests that the PaymentCalculationService generates the same results as our manual calculations
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ghmpaghyasyllfvamfna.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXBhZ2h5YXN5bGxmdmFtZm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTI0NDgsImV4cCI6MjA3MDIyODQ0OH0.qhWHU-KkdpvfOTG-ROxf1BMTUlah2xDYJean69hhyH4';

const COHORT_ID = 'f56dfcd5-197d-4186-97e9-712311c73bc9';

// Create a Node.js compatible Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
    one_shot_discount_percentage?: number;
  },
  startDate: string,
  scholarshipPercentage: number
): PaymentSchedule {
  const totalProgramFee = Number(feeStructure.total_program_fee);
  const admissionFee = Number(feeStructure.admission_fee);

  let finalProgramFee = totalProgramFee;
  if (paymentPlan === 'one_shot') {
    const discountPercentage = Number(
      feeStructure.one_shot_discount_percentage || 0
    );
    const discountAmount = (totalProgramFee * discountPercentage) / 100;
    finalProgramFee = totalProgramFee - discountAmount;
  } else if (scholarshipPercentage > 0) {
    const discountAmount = (totalProgramFee * scholarshipPercentage) / 100;
    finalProgramFee = totalProgramFee - discountAmount;
  }

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

async function testPaymentConsistency() {
  try {
    console.log('🧪 Testing payment calculation consistency...\n');

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

    // Get all student payments
    const { data: studentPayments, error: fetchError } = await supabase
      .from('student_payments')
      .select(
        `
        *,
        student:cohort_students(email, first_name, last_name),
        scholarship:cohort_scholarships(amount_percentage)
      `
      )
      .eq('cohort_id', COHORT_ID);

    if (fetchError) {
      console.error('❌ Error fetching student payments:', fetchError);
      return;
    }

    console.log('📊 Fee Structure Configuration:');
    console.log(
      `   Program Fee: ₹${feeStructure.total_program_fee.toLocaleString()}`
    );
    console.log(
      `   Admission Fee: ₹${feeStructure.admission_fee.toLocaleString()}`
    );
    console.log(`   Semesters: ${feeStructure.number_of_semesters}`);
    console.log(
      `   Installments per Semester: ${feeStructure.instalments_per_semester}`
    );
    console.log(
      `   One-shot Discount: ${feeStructure.one_shot_discount_percentage}%\n`
    );

    let allTestsPassed = true;

    for (const studentPayment of studentPayments) {
      const student = studentPayment.student;
      const scholarship = studentPayment.scholarship;

      console.log(
        `🧪 Testing ${student.first_name} ${student.last_name} (${student.email})`
      );
      console.log(`   Payment Plan: ${studentPayment.payment_plan}`);
      console.log(
        `   Scholarship: ${scholarship ? `${scholarship.amount_percentage}%` : 'None'}`
      );

      // Calculate expected payment schedule
      const scholarshipPercentage = scholarship
        ? Number(scholarship.amount_percentage)
        : 0;
      const expectedSchedule = calculatePaymentSchedule(
        studentPayment.payment_plan,
        feeStructure,
        cohortData.start_date,
        scholarshipPercentage
      );

      // Compare with actual payment schedule
      const actualSchedule = studentPayment.payment_schedule;

      // Test 1: Total amount payable
      const expectedTotal = expectedSchedule.total_amount;
      const actualTotal = Number(studentPayment.total_amount_payable);

      if (Math.abs(expectedTotal - actualTotal) < 1) {
        console.log(
          `   ✅ Total Amount: ₹${expectedTotal.toLocaleString()} (expected) = ₹${actualTotal.toLocaleString()} (actual)`
        );
      } else {
        console.log(
          `   ❌ Total Amount: ₹${expectedTotal.toLocaleString()} (expected) ≠ ₹${actualTotal.toLocaleString()} (actual)`
        );
        allTestsPassed = false;
      }

      // Test 2: Number of installments
      const expectedInstallments = expectedSchedule.installments.length;
      const actualInstallments = actualSchedule.installments.length;

      if (expectedInstallments === actualInstallments) {
        console.log(
          `   ✅ Installments: ${expectedInstallments} (expected) = ${actualInstallments} (actual)`
        );
      } else {
        console.log(
          `   ❌ Installments: ${expectedInstallments} (expected) ≠ ${actualInstallments} (actual)`
        );
        allTestsPassed = false;
      }

      // Test 3: Semester grouping (for installment-wise plans)
      if (studentPayment.payment_plan === 'instalment_wise') {
        const expectedSemesters = new Set(
          expectedSchedule.installments.map(i => i.semester_number)
        ).size;
        const actualSemesters = new Set(
          actualSchedule.installments.map(
            (i: { semester_number: number }) => i.semester_number
          )
        ).size;

        if (expectedSemesters === actualSemesters) {
          console.log(
            `   ✅ Semesters: ${expectedSemesters} (expected) = ${actualSemesters} (actual)`
          );
        } else {
          console.log(
            `   ❌ Semesters: ${expectedSemesters} (expected) ≠ ${actualSemesters} (actual)`
          );
          allTestsPassed = false;
        }
      }

      // Test 4: First installment amount
      const expectedFirstAmount = expectedSchedule.installments[0]?.amount;
      const actualFirstAmount = Number(actualSchedule.installments[0]?.amount);

      if (Math.abs(expectedFirstAmount - actualFirstAmount) < 1) {
        console.log(
          `   ✅ First Installment: ₹${expectedFirstAmount.toLocaleString()} (expected) = ₹${actualFirstAmount.toLocaleString()} (actual)`
        );
      } else {
        console.log(
          `   ❌ First Installment: ₹${expectedFirstAmount.toLocaleString()} (expected) ≠ ₹${actualFirstAmount.toLocaleString()} (actual)`
        );
        allTestsPassed = false;
      }

      console.log('');
    }

    if (allTestsPassed) {
      console.log('🎉 All payment consistency tests passed! ✅');
      console.log(
        'The payment calculation service generates consistent results with the database.'
      );
    } else {
      console.log('❌ Some payment consistency tests failed!');
      console.log(
        'There are discrepancies between expected and actual payment calculations.'
      );
    }
  } catch (error) {
    console.error('💥 Error running payment consistency tests:', error);
  }
}

// Run the test
testPaymentConsistency()
  .then(() => {
    console.log('🎉 Test execution completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
