import { useMemo } from 'react';
import { StudentPaymentRow } from '@/types/payments/DatabaseAlignedTypes';
import { PaymentBreakdown } from '@/types/payments/PaymentCalculationTypes';
import { generateFeeStructureReview } from '@/utils/fee-calculations';
import { FeeStructure } from '@/types/fee';

interface PaymentSchedule {
  plan: string;
  total_amount: number;
  admission_fee: number;
  program_fee: number;
  installments: Array<{
    installment_number: number;
    due_date: string;
    amount: number;
    status: string;
    amount_paid: number;
    amount_pending: number;
    semester_number?: number;
  }>;
  summary: {
    total_installments: number;
    next_due_date?: string;
    next_due_amount?: number;
    completion_percentage: number;
  };
  scholarship_id?: string;
}

// Calculate payment status based on due date and amount paid
const calculatePaymentStatus = (
  dueDate: string,
  amountPayable: number,
  amountPaid: number
): string => {
  const today = new Date();
  const due = new Date(dueDate);
  const daysOverdue = Math.floor(
    (today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (amountPaid >= amountPayable) {
    return 'paid';
  }

  if (daysOverdue > 0) {
    if (amountPaid > 0) {
      return 'partially_paid_overdue';
    }
    return 'overdue';
  }

  if (amountPaid > 0) {
    return 'partially_paid_days_left';
  }

  if (daysOverdue <= -5) {
    return 'upcoming';
  }

  return 'pending';
};

interface UsePaymentScheduleFromDatabaseProps {
  studentPayments: StudentPaymentRow[] | null;
  feeStructure: FeeStructure | null;
  scholarshipAmount: number;
  cohortStartDate: string;
}

export const usePaymentScheduleFromDatabase = ({
  studentPayments,
  feeStructure,
  scholarshipAmount,
  cohortStartDate,
}: UsePaymentScheduleFromDatabaseProps) => {
  const paymentBreakdown = useMemo(() => {
    if (!studentPayments || studentPayments.length === 0 || !feeStructure) {
      return null;
    }

    // Get the total amount paid from student payments
    const totalAmountPaid = studentPayments.reduce(
      (sum, payment) => sum + (payment.total_amount_paid || 0),
      0
    );

    // Use the EXACT SAME LOGIC as admin side - use generateFeeStructureReview
    // This ensures consistency between admin and student dashboards

    // Generate the complete fee structure review using the same logic as admin
    const feeReview = generateFeeStructureReview(
      feeStructure,
      [], // scholarships array - we'll handle scholarship separately
      'sem_wise', // default to semester-wise for consistency
      0, // test score
      cohortStartDate,
      undefined, // selectedScholarshipId
      0 // additionalScholarshipPercentage
    );

    // Apply scholarship to the fee review
    // Since generateFeeStructureReview doesn't handle the scholarship we pass, we need to apply it manually
    const semesters = feeReview.semesters.map((semester, semesterIndex) => {
      const isLastSemester = semesterIndex === feeReview.semesters.length - 1;

      // Apply scholarship only to the last semester
      const updatedInstallments = semester.instalments.map(
        (installment, installmentIndex) => {
          let updatedInstallment = { ...installment };

          if (isLastSemester) {
            // For the last semester, apply scholarship backwards
            const totalInstallmentsInLastSemester = semester.instalments.length;
            const scholarshipPerInstallment =
              scholarshipAmount / totalInstallmentsInLastSemester;

            // Apply scholarship to this installment
            const scholarshipForThisInstallment = Math.min(
              scholarshipPerInstallment,
              installment.amountPayable
            );

            updatedInstallment = {
              ...installment,
              scholarshipAmount: scholarshipForThisInstallment,
              amountPayable: Math.max(
                0,
                installment.amountPayable - scholarshipForThisInstallment
              ),
            };
          }

          return updatedInstallment;
        }
      );

      // Recalculate semester totals
      const updatedSemesterTotal = {
        scholarshipAmount: updatedInstallments.reduce(
          (sum, inst) => sum + inst.scholarshipAmount,
          0
        ),
        baseAmount: updatedInstallments.reduce(
          (sum, inst) => sum + inst.baseAmount,
          0
        ),
        gstAmount: updatedInstallments.reduce(
          (sum, inst) => sum + inst.gstAmount,
          0
        ),
        discountAmount: updatedInstallments.reduce(
          (sum, inst) => sum + inst.discountAmount,
          0
        ),
        totalPayable: updatedInstallments.reduce(
          (sum, inst) => sum + inst.amountPayable,
          0
        ),
      };

      return {
        ...semester,
        instalments: updatedInstallments,
        total: updatedSemesterTotal,
      };
    });

    // Convert to student format and add payment tracking
    const studentSemesters = semesters.map(semester => {
      let cumulativePaid = 0; // Track cumulative payments across installments

      const studentInstallments = semester.instalments.map(
        (adminInst, index) => {
          const amountPayable = adminInst.amountPayable;
          const dueDate = adminInst.paymentDate;

          // Calculate how much has been paid for this specific installment
          const installmentPaid = Math.min(
            amountPayable,
            Math.max(0, totalAmountPaid - cumulativePaid)
          );
          cumulativePaid += installmentPaid;

          // Calculate proper payment status
          const status = calculatePaymentStatus(
            dueDate,
            amountPayable,
            installmentPaid
          );
          const amountPending = Math.max(0, amountPayable - installmentPaid);

          return {
            installmentNumber: index + 1,
            dueDate: dueDate,
            amount: amountPayable,
            status: status,
            amountPaid: installmentPaid,
            amountPending: amountPending,
            semesterNumber: semester.semesterNumber,
            baseAmount: adminInst.baseAmount,
            scholarshipAmount: adminInst.scholarshipAmount,
            discountAmount: adminInst.discountAmount,
            gstAmount: adminInst.gstAmount,
            amountPayable: amountPayable,
            totalPayable: amountPayable,
            paymentDate: installmentPaid > 0 ? new Date().toISOString() : null,
          };
        }
      );

      return {
        semesterNumber: semester.semesterNumber,
        instalments: studentInstallments,
        total: semester.total,
      };
    });

    // Update the overall summary to reflect the scholarship
    const updatedOverallSummary = {
      ...feeReview.overallSummary,
      totalScholarship: scholarshipAmount,
      totalAmountPayable:
        feeReview.overallSummary.totalAmountPayable - scholarshipAmount,
    };

    return {
      admissionFee: feeReview.admissionFee,
      semesters: studentSemesters,
      overallSummary: updatedOverallSummary,
    };
  }, [studentPayments, feeStructure, scholarshipAmount, cohortStartDate]);

  return paymentBreakdown;
};
