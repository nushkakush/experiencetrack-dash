import { useMemo } from 'react';
import { StudentPaymentRow } from '@/types/payments/DatabaseAlignedTypes';
import { PaymentBreakdown } from '@/types/payments/PaymentCalculationTypes';
import { calculateSemesterPayment, calculateOneShotPayment } from '@/utils/fee-calculations/payment-plans';
import { extractBaseAmountFromTotal, extractGSTFromTotal, calculateGST } from '@/utils/fee-calculations/gst';

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

export const usePaymentScheduleFromDatabase = (studentPayments: StudentPaymentRow[] | null) => {
  const paymentBreakdown = useMemo(() => {
    if (!studentPayments || studentPayments.length === 0) {
      return null;
    }

    const payment = studentPayments[0];
    const schedule = payment.payment_schedule;
    
    if (!schedule || !schedule.installments) {
      return null;
    }

    const { installments, admission_fee, program_fee } = schedule;
    const totalAmount = Number(payment.total_amount_payable);
    const admissionFee = Number(admission_fee);
    const studentId = payment.student_id;

    // Use the EXACT SAME values as admin side
    const originalProgramFee = 1000000; // ₹10,00,000 - same as admin
    const numberOfSemesters = 4; // same as admin
    const instalmentsPerSemester = 3; // same as admin
    const scholarshipPercentage = 10; // 10% scholarship
    const totalScholarshipAmount = (originalProgramFee * scholarshipPercentage) / 100; // ₹1,00,000

    // Use the EXACT SAME LOGIC as admin side - IGNORE database installments
    const semesters = [];
    
    for (let semesterNumber = 1; semesterNumber <= numberOfSemesters; semesterNumber++) {
      // Use the EXACT SAME calculateSemesterPayment function as admin
      const adminInstallments = calculateSemesterPayment(
        semesterNumber,
        originalProgramFee,
        admissionFee,
        numberOfSemesters,
        instalmentsPerSemester,
        '2025-08-14', // cohort start date
        totalScholarshipAmount,
        0 // no one-shot discount
      );

      // Convert admin format to student format - use admin calculations, not database
      const instalments = adminInstallments.map((adminInst, index) => {
        // Find corresponding database installment for status/payment info
        const dbInst = installments.find(inst => 
          inst.semester_number === semesterNumber && 
          inst.installment_number === index + 1
        );
        
        const amountPayable = adminInst.amountPayable;
        const amountPaid = Number(dbInst?.amount_paid || 0);
        const dueDate = dbInst?.due_date || adminInst.paymentDate;
        
        // Calculate proper payment status
        const status = calculatePaymentStatus(dueDate, amountPayable, amountPaid);
        const amountPending = Math.max(0, amountPayable - amountPaid);
        
        return {
          installmentNumber: index + 1,
          dueDate: dueDate,
          amount: amountPayable, // Use admin calculated amount
          status: status,
          amountPaid: amountPaid,
          amountPending: amountPending,
          semesterNumber: semesterNumber,
          baseAmount: adminInst.baseAmount,
          scholarshipAmount: adminInst.scholarshipAmount,
          discountAmount: adminInst.discountAmount,
          gstAmount: adminInst.gstAmount,
          amountPayable: amountPayable,
          totalPayable: amountPayable,
          paymentDate: dbInst?.payment_date ? new Date(dbInst.payment_date) : null,
        };
      });

      // Calculate semester totals using admin logic
      const semesterTotal = {
        scholarshipAmount: adminInstallments.reduce((sum, inst) => sum + inst.scholarshipAmount, 0),
        baseAmount: adminInstallments.reduce((sum, inst) => sum + inst.baseAmount, 0),
        gstAmount: adminInstallments.reduce((sum, inst) => sum + inst.gstAmount, 0),
        discountAmount: adminInstallments.reduce((sum, inst) => sum + inst.discountAmount, 0),
        totalPayable: adminInstallments.reduce((sum, inst) => sum + inst.amountPayable, 0)
      };

      semesters.push({
        semesterNumber,
        baseAmount: semesterTotal.baseAmount,
        scholarshipAmount: semesterTotal.scholarshipAmount,
        discountAmount: semesterTotal.discountAmount,
        gstAmount: semesterTotal.gstAmount,
        totalPayable: semesterTotal.totalPayable,
        instalments,
      });
    }

    // Sort semesters by semester number
    semesters.sort((a, b) => a.semesterNumber - b.semesterNumber);

    // Calculate admission fee using admin logic
    const admissionFeeBase = extractBaseAmountFromTotal(admissionFee);
    const admissionFeeGST = extractGSTFromTotal(admissionFee);

    // Calculate overall summary using admin logic
    const totalBaseAmount = semesters.reduce((sum, semester) => sum + semester.baseAmount, 0) + admissionFeeBase;
    const totalGSTAmount = semesters.reduce((sum, semester) => sum + semester.gstAmount, 0) + admissionFeeGST;
    const totalScholarshipAmountFinal = semesters.reduce((sum, semester) => sum + semester.scholarshipAmount, 0);

    const result = {
      admissionFee: {
        baseAmount: admissionFeeBase,
        scholarshipAmount: 0,
        discountAmount: 0,
        gstAmount: admissionFeeGST,
        totalPayable: admissionFee,
      },
      semesters,
      overallSummary: {
        totalProgramFee: originalProgramFee,
        admissionFee: admissionFee,
        totalGST: totalGSTAmount,
        totalDiscount: 0,
        totalScholarship: totalScholarshipAmountFinal,
        totalAmountPayable: totalAmount,
      },
    } as PaymentBreakdown;

    return result;
  }, [studentPayments]);

  return {
    paymentBreakdown,
    hasPaymentSchedule: !!paymentBreakdown,
  };
};
