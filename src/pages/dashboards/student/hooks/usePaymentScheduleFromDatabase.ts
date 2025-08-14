import { useMemo } from 'react';
import { StudentPaymentRow } from '@/types/payments/DatabaseAlignedTypes';
import { PaymentBreakdown } from '@/types/payments/PaymentCalculationTypes';
import { calculateSemesterPayment } from '@/utils/fee-calculations/payment-plans';
import { generateSemesterPaymentDates } from '@/utils/fee-calculations/dateUtils';
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
  const daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  
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
  cohortStartDate
}: UsePaymentScheduleFromDatabaseProps) => {
  const paymentBreakdown = useMemo(() => {
    if (!studentPayments || studentPayments.length === 0 || !feeStructure) {
      return null;
    }

    // Get the total amount paid from student payments
    const totalAmountPaid = studentPayments.reduce((sum, payment) => sum + (payment.total_amount_paid || 0), 0);

    // Use dynamic values from fee structure and scholarship data
    const originalProgramFee = Number(feeStructure.total_program_fee);
    const admissionFee = Number(feeStructure.admission_fee);
    const numberOfSemesters = Number(feeStructure.number_of_semesters);
    const instalmentsPerSemester = Number(feeStructure.instalments_per_semester);
    const totalScholarshipAmount = scholarshipAmount;

    // Use the EXACT SAME LOGIC as admin side - IGNORE database installments
    const semesters = [];
    let cumulativePaid = 0; // Track cumulative payments across installments
    
    for (let semesterNumber = 1; semesterNumber <= numberOfSemesters; semesterNumber++) {
      // Use the EXACT SAME calculateSemesterPayment function as admin
      const adminInstallments = calculateSemesterPayment(
        semesterNumber,
        originalProgramFee,
        admissionFee,
        numberOfSemesters,
        instalmentsPerSemester,
        cohortStartDate, // Use dynamic cohort start date
        totalScholarshipAmount,
        0 // no one-shot discount
      );

      // Convert admin format to student format - use admin calculations only
      const instalments = adminInstallments.map((adminInst, index) => {
        const amountPayable = adminInst.amountPayable;
        const dueDate = adminInst.paymentDate; // Use admin calculated date
        
        // Calculate how much has been paid for this specific installment
        // Distribute the total paid amount across installments in order
        const installmentPaid = Math.min(amountPayable, Math.max(0, totalAmountPaid - cumulativePaid));
        cumulativePaid += installmentPaid;
        
        // Calculate proper payment status
        const status = calculatePaymentStatus(dueDate, amountPayable, installmentPaid);
        const amountPending = Math.max(0, amountPayable - installmentPaid);
        
        return {
          installmentNumber: index + 1,
          dueDate: dueDate,
          amount: amountPayable, // Use admin calculated amount
          status: status,
          amountPaid: installmentPaid,
          amountPending: amountPending,
          semesterNumber: semesterNumber,
          baseAmount: adminInst.baseAmount,
          scholarshipAmount: adminInst.scholarshipAmount,
          discountAmount: adminInst.discountAmount,
          gstAmount: adminInst.gstAmount,
          amountPayable: amountPayable,
          totalPayable: amountPayable,
          paymentDate: installmentPaid > 0 ? new Date().toISOString() : null, // Set payment date if paid
        };
      });

      // Calculate semester totals using admin logic
      const semesterTotal = {
        scholarshipAmount: adminInstallments.reduce((sum, inst) => sum + inst.scholarshipAmount, 0),
        baseAmount: adminInstallments.reduce((sum, inst) => sum + inst.baseAmount, 0),
        gstAmount: adminInstallments.reduce((sum, inst) => sum + inst.gstAmount, 0),
        discountAmount: adminInstallments.reduce((sum, inst) => sum + inst.discountAmount, 0),
        totalPayable: adminInstallments.reduce((sum, inst) => sum + inst.amountPayable, 0),
      };

      semesters.push({
        semesterNumber,
        instalments,
        total: semesterTotal,
      });
    }

    // Calculate admission fee breakdown (GST inclusive)
    const admissionFeeBase = admissionFee / 1.18; // Extract base amount from GST inclusive total
    const admissionFeeGST = admissionFee - admissionFeeBase;
    
    // Calculate overall summary
    const totalProgramFee = originalProgramFee;
    const totalAdmissionFee = admissionFee;
    const totalGST = semesters.reduce((sum, semester) => sum + semester.total.gstAmount, 0) + admissionFeeGST;
    const totalScholarship = totalScholarshipAmount;
    const totalAmountPayable = totalAdmissionFee + semesters.reduce((sum, semester) => sum + semester.total.totalPayable, 0);

    return {
      admissionFee: {
        baseAmount: admissionFeeBase,
        scholarshipAmount: 0,
        discountAmount: 0,
        gstAmount: admissionFeeGST,
        totalPayable: admissionFee,
      },
      semesters,
      overallSummary: {
        totalProgramFee,
        admissionFee: totalAdmissionFee,
        totalGST,
        totalScholarship,
        totalAmountPayable,
      },
    };
  }, [studentPayments, feeStructure, scholarshipAmount, cohortStartDate]);

  return paymentBreakdown;
};
