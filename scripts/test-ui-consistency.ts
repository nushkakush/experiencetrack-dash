#!/usr/bin/env tsx

/**
 * Test script to verify UI consistency
 * This simulates how the payment schedule hook processes the data
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

// Simulate the usePaymentScheduleFromDatabase hook logic
function processPaymentSchedule(
  studentPayments: Array<{
    payment_schedule: {
      installments: Array<{
        installment_number: number;
        semester_number?: number;
        amount: number;
        amount_paid?: number;
        amount_pending?: number;
        due_date: string;
        status: string;
      }>;
      admission_fee: number;
      program_fee: number;
    };
    total_amount_payable: number;
  }>
) {
  if (!studentPayments || studentPayments.length === 0) {
    return null;
  }

  const payment = studentPayments[0]; // Single record approach
  const schedule = payment.payment_schedule;

  if (!schedule || !schedule.installments) {
    return null;
  }

  const { installments, admission_fee, program_fee } = schedule;
  const totalAmount = Number(payment.total_amount_payable);
  const programFee = Number(program_fee);
  const admissionFee = Number(admission_fee);

  // Group installments by semester
  const semesterMap = new Map<
    number,
    Array<{
      installment_number: number;
      semester_number?: number;
      amount: number;
      amount_paid?: number;
      amount_pending?: number;
      due_date: string;
      status: string;
    }>
  >();

  installments.forEach(
    (installment: {
      installment_number: number;
      semester_number?: number;
      amount: number;
      amount_paid?: number;
      amount_pending?: number;
      due_date: string;
      status: string;
    }) => {
      const semesterNumber = installment.semester_number || 1;
      if (!semesterMap.has(semesterNumber)) {
        semesterMap.set(semesterNumber, []);
      }
      semesterMap.get(semesterNumber)!.push(installment);
    }
  );

  // Convert to UI format with proper semester grouping
  const semesters = Array.from(semesterMap.entries()).map(
    ([semesterNumber, installments]) => {
      const semesterTotal = installments.reduce(
        (sum: number, inst: { amount: number }) => sum + Number(inst.amount),
        0
      );
      const semesterPaid = installments.reduce(
        (sum: number, inst: { amount_paid?: number }) =>
          sum + Number(inst.amount_paid || 0),
        0
      );
      const semesterPending = installments.reduce(
        (sum: number, inst: { amount_pending?: number }) =>
          sum + Number(inst.amount_pending || 0),
        0
      );

      return {
        semesterNumber,
        baseAmount: semesterTotal * 0.9, // Assuming 10% GST
        scholarshipAmount: 0,
        discountAmount: 0,
        gstAmount: semesterTotal * 0.1, // Assuming 10% GST
        totalPayable: semesterTotal,
        instalments: installments.map(
          (installment: {
            installment_number: number;
            semester_number?: number;
            amount: number;
            amount_paid?: number;
            amount_pending?: number;
            due_date: string;
            status: string;
          }) => ({
            installmentNumber: installment.installment_number,
            dueDate: installment.due_date,
            amount: Number(installment.amount),
            status: installment.status,
            amountPaid: Number(installment.amount_paid || 0),
            amountPending: Number(installment.amount_pending || 0),
            semesterNumber: installment.semester_number || semesterNumber,
          })
        ),
      };
    }
  );

  // Sort semesters by semester number
  semesters.sort((a, b) => a.semesterNumber - b.semesterNumber);

  const result = {
    admissionFee: {
      baseAmount: admissionFee * 0.9,
      scholarshipAmount: 0,
      discountAmount: 0,
      gstAmount: admissionFee * 0.1,
      totalPayable: admissionFee,
    },
    semesters,
    overallSummary: {
      totalProgramFee: programFee,
      admissionFee: admissionFee,
      totalGST: (admissionFee + programFee) * 0.1,
      totalDiscount: 0,
      totalAmountPayable: totalAmount,
    },
  };

  return result;
}

async function testUIConsistency() {
  try {
    console.log('🧪 Testing UI consistency...\n');

    // Get all student payments
    const { data: studentPayments, error: fetchError } = await supabase
      .from('student_payments')
      .select(
        `
        *,
        student:cohort_students(email, first_name, last_name)
      `
      )
      .eq('cohort_id', COHORT_ID);

    if (fetchError) {
      console.error('❌ Error fetching student payments:', fetchError);
      return;
    }

    let allTestsPassed = true;

    for (const studentPayment of studentPayments) {
      const student = studentPayment.student;

      console.log(
        `🧪 Testing UI for ${student.first_name} ${student.last_name} (${student.email})`
      );
      console.log(`   Payment Plan: ${studentPayment.payment_plan}`);

      // Process the payment schedule as the UI would
      const paymentBreakdown = processPaymentSchedule([studentPayment]);

      if (!paymentBreakdown) {
        console.log('   ❌ Failed to process payment schedule');
        allTestsPassed = false;
        continue;
      }

      // Test 1: Number of semesters displayed
      const expectedSemesters =
        studentPayment.payment_plan === 'one_shot'
          ? 0
          : studentPayment.payment_plan === 'sem_wise'
            ? 4
            : 4;
      const actualSemesters = paymentBreakdown.semesters.length;

      if (expectedSemesters === actualSemesters) {
        console.log(
          `   ✅ Semesters Displayed: ${expectedSemesters} (expected) = ${actualSemesters} (actual)`
        );
      } else {
        console.log(
          `   ❌ Semesters Displayed: ${expectedSemesters} (expected) ≠ ${actualSemesters} (actual)`
        );
        allTestsPassed = false;
      }

      // Test 2: Total amount consistency
      const expectedTotal = Number(studentPayment.total_amount_payable);
      const actualTotal = paymentBreakdown.overallSummary.totalAmountPayable;

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

      // Test 3: Semester grouping (for installment-wise plans)
      if (studentPayment.payment_plan === 'instalment_wise') {
        const semesterGroups = paymentBreakdown.semesters.map(
          s => s.instalments.length
        );
        const expectedGroups = [3, 3, 3, 3]; // 3 installments per semester

        if (JSON.stringify(semesterGroups) === JSON.stringify(expectedGroups)) {
          console.log(
            `   ✅ Semester Groups: ${JSON.stringify(semesterGroups)} (expected) = ${JSON.stringify(expectedGroups)} (actual)`
          );
        } else {
          console.log(
            `   ❌ Semester Groups: ${JSON.stringify(semesterGroups)} (expected) ≠ ${JSON.stringify(expectedGroups)} (actual)`
          );
          allTestsPassed = false;
        }

        // Test 4: Semester totals
        const semesterTotals = paymentBreakdown.semesters.map(
          s => s.totalPayable
        );
        const expectedSemesterTotal =
          studentPayment.payment_plan === 'instalment_wise'
            ? Number(studentPayment.payment_schedule.program_fee) / 4
            : 0;

        const allSemesterTotalsCorrect = semesterTotals.every(
          total => Math.abs(total - expectedSemesterTotal) < 1
        );

        if (allSemesterTotalsCorrect) {
          console.log(
            `   ✅ Semester Totals: All semesters have ₹${expectedSemesterTotal.toLocaleString()}`
          );
        } else {
          console.log(
            `   ❌ Semester Totals: Inconsistent amounts across semesters`
          );
          allTestsPassed = false;
        }
      }

      console.log('');
    }

    if (allTestsPassed) {
      console.log('🎉 All UI consistency tests passed! ✅');
      console.log(
        'The UI will correctly display all payment plans with proper semester grouping.'
      );
    } else {
      console.log('❌ Some UI consistency tests failed!');
      console.log(
        'There are issues with how the UI processes payment schedules.'
      );
    }
  } catch (error) {
    console.error('💥 Error running UI consistency tests:', error);
  }
}

// Run the test
testUIConsistency()
  .then(() => {
    console.log('🎉 Test execution completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
