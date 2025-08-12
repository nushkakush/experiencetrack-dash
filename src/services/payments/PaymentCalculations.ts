import { FeeStructure, Scholarship, PaymentPlan, FeeStructureReview } from '@/types/fee';
import { generateFeeStructureReview } from '@/utils/fee-calculations';

export interface PaymentCalculationOptions {
  feeStructure: FeeStructure;
  scholarships: Scholarship[];
  paymentPlan: PaymentPlan;
  scholarshipId?: string;
  startDate: string;
  additionalDiscount?: number;
}

export interface PaymentBreakdown {
  admissionFee: {
    baseAmount: number;
    scholarshipAmount: number;
    discountAmount: number;
    gstAmount: number;
    totalPayable: number;
  };
  semesters: Array<{
    semesterNumber: number;
    instalments: Array<{
      paymentDate: string;
      baseAmount: number;
      scholarshipAmount: number;
      discountAmount: number;
      gstAmount: number;
      amountPayable: number;
    }>;
    total: {
      baseAmount: number;
      scholarshipAmount: number;
      discountAmount: number;
      gstAmount: number;
      totalPayable: number;
    };
  }>;
  oneShotPayment?: {
    paymentDate: string;
    baseAmount: number;
    scholarshipAmount: number;
    discountAmount: number;
    gstAmount: number;
    amountPayable: number;
  };
  overallSummary: {
    totalProgramFee: number;
    admissionFee: number;
    totalGST: number;
    totalDiscount: number;
    totalScholarship: number;
    totalAmountPayable: number;
  };
}

export class PaymentCalculationsService {
  /**
   * Calculate complete payment breakdown
   */
  static calculatePaymentBreakdown(options: PaymentCalculationOptions): PaymentBreakdown {
    const { feeStructure, scholarships, paymentPlan, scholarshipId, startDate, additionalDiscount = 0 } = options;

    // Generate fee structure review using existing utility
    const review = generateFeeStructureReview(
      feeStructure,
      scholarships,
      paymentPlan,
      additionalDiscount,
      startDate,
      scholarshipId || 'no_scholarship'
    );

    return {
      admissionFee: review.admissionFee,
      semesters: review.semesters,
      oneShotPayment: review.oneShotPayment || undefined,
      overallSummary: review.overallSummary,
    };
  }

  /**
   * Calculate GST amount
   */
  static calculateGST(amount: number, gstRate: number = 18): number {
    return Math.round((amount * gstRate) / 100);
  }

  /**
   * Calculate scholarship amount
   */
  static calculateScholarshipAmount(
    baseAmount: number,
    scholarshipPercentage: number,
    additionalDiscount: number = 0
  ): number {
    const totalDiscountPercentage = scholarshipPercentage + additionalDiscount;
    return Math.round((baseAmount * totalDiscountPercentage) / 100);
  }

  /**
   * Calculate one-shot discount
   */
  static calculateOneShotDiscount(
    amount: number,
    discountPercentage: number
  ): number {
    return Math.round((amount * discountPercentage) / 100);
  }

  /**
   * Calculate installment amounts for semester-wise payment
   */
  static calculateSemesterInstallments(
    semesterAmount: number,
    numberOfInstallments: number
  ): number[] {
    const baseAmount = Math.floor(semesterAmount / numberOfInstallments);
    const remainder = semesterAmount % numberOfInstallments;
    
    const installments = new Array(numberOfInstallments).fill(baseAmount);
    
    // Distribute remainder to first few installments
    for (let i = 0; i < remainder; i++) {
      installments[i] += 1;
    }
    
    return installments;
  }

  /**
   * Calculate due dates for installments
   */
  static calculateDueDates(
    startDate: string,
    numberOfInstallments: number,
    intervalDays: number = 30
  ): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < numberOfInstallments; i++) {
      const dueDate = new Date(start);
      dueDate.setDate(dueDate.getDate() + (i * intervalDays));
      dates.push(dueDate.toISOString().split('T')[0]);
    }
    
    return dates;
  }

  /**
   * Calculate payment status based on due date and amount paid
   */
  static calculatePaymentStatus(
    dueDate: string,
    amountPayable: number,
    amountPaid: number
  ): string {
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
  }

  /**
   * Calculate total amount with all adjustments
   */
  static calculateTotalAmount(
    baseAmount: number,
    scholarshipPercentage: number = 0,
    additionalDiscount: number = 0,
    gstRate: number = 18,
    oneShotDiscount: number = 0
  ): {
    scholarshipAmount: number;
    discountAmount: number;
    gstAmount: number;
    totalPayable: number;
  } {
    // Calculate scholarship amount
    const scholarshipAmount = this.calculateScholarshipAmount(baseAmount, scholarshipPercentage, additionalDiscount);
    
    // Calculate amount after scholarship
    const amountAfterScholarship = baseAmount - scholarshipAmount;
    
    // Calculate one-shot discount
    const discountAmount = this.calculateOneShotDiscount(amountAfterScholarship, oneShotDiscount);
    
    // Calculate amount after discount
    const amountAfterDiscount = amountAfterScholarship - discountAmount;
    
    // Calculate GST
    const gstAmount = this.calculateGST(amountAfterDiscount, gstRate);
    
    // Calculate total payable
    const totalPayable = amountAfterDiscount + gstAmount;
    
    return {
      scholarshipAmount,
      discountAmount,
      gstAmount,
      totalPayable,
    };
  }

  /**
   * Validate payment calculation inputs
   */
  static validateCalculationInputs(options: PaymentCalculationOptions): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!options.feeStructure) {
      errors.push('Fee structure is required');
    }
    
    if (!options.startDate) {
      errors.push('Start date is required');
    }
    
    if (options.additionalDiscount && (options.additionalDiscount < 0 || options.additionalDiscount > 100)) {
      errors.push('Additional discount must be between 0 and 100');
    }
    
    if (options.scholarshipId && !options.scholarships.find(s => s.id === options.scholarshipId)) {
      errors.push('Invalid scholarship ID');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
