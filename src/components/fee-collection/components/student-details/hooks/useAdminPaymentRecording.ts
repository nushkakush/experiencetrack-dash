import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StudentPaymentSummary } from '@/types/fee';
import { getFullPaymentView } from '@/services/payments/paymentEngineClient';
import { paymentTransactionService } from '@/services/paymentTransaction.service';
import { FeeStructureService } from '@/services/feeStructure.service';
import { studentScholarshipsService } from '@/services/studentScholarships.service';
import { useAuth } from '@/hooks/useAuth';
import { usePaymentSubmissions } from '@/pages/dashboards/student/hooks/usePaymentSubmissions';
import { PaymentSubmissionData } from '@/types/components/PaymentFormTypes';

interface PaymentScheduleItem {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  status:
    | 'pending'
    | 'pending_10_plus_days'
    | 'verification_pending'
    | 'paid'
    | 'overdue'
    | 'partially_paid_days_left'
    | 'partially_paid_overdue'
    | 'partially_paid_verification_pending';
  paymentDate?: string;
  verificationStatus?: string;
  semesterNumber?: number;
  installmentNumber?: number;
}

interface AdminPaymentBreakdown {
  baseAmount: number;
  gstAmount: number;
  discountAmount: number;
  scholarshipAmount: number;
  totalAmount: number;
  paymentDate?: string;
}

interface UseAdminPaymentRecordingProps {
  open: boolean;
  student: StudentPaymentSummary;
  paymentItem: PaymentScheduleItem | null;
  onPaymentRecorded?: () => void;
  onOpenChange: (open: boolean) => void;
  feeStructure?: {
    total_program_fee: number;
    admission_fee: number;
    number_of_semesters: number;
    instalments_per_semester: number;
    one_shot_discount_percentage: number;
    program_fee_includes_gst?: boolean;
    equal_scholarship_distribution?: boolean;
    one_shot_dates?: Record<string, string>;
    sem_wise_dates?: Record<string, string | Record<string, unknown>>;
    instalment_wise_dates?: Record<string, string | Record<string, unknown>>;
  };
}

export const useAdminPaymentRecording = ({
  open,
  student,
  paymentItem,
  onPaymentRecorded,
  onOpenChange,
  feeStructure,
}: UseAdminPaymentRecordingProps) => {
  const [adminPaymentBreakdown, setAdminPaymentBreakdown] =
    useState<AdminPaymentBreakdown | null>(null);
  const [studentPaymentBreakdown, setStudentPaymentBreakdown] =
    useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [existingTransactions, setExistingTransactions] = useState<any[]>([]);
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [studentScholarship, setStudentScholarship] = useState<any>(null);
  const { profile } = useAuth();

  // Transform student data for PaymentForm
  const studentData = useMemo(
    () => ({
      id: student.student_id,
      email: student.student?.email || '',
      first_name: student.student?.first_name || null,
      last_name: student.student?.last_name || null,
      phone: student.student?.phone || null,
      cohort_id: student.student?.cohort_id || '',
      user_id: student.student?.user_id || null,
      invite_status: 'accepted' as const,
      dropped_out_status: 'active' as const,
      invited_at: null,
      accepted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
    [student]
  );

  // Fetch existing transactions for this student to calculate pending amount
  const fetchExistingTransactions = useCallback(async () => {
    if (!student?.student_id) return;

    console.log(
      '🔍 [AdminPaymentDialog] fetchExistingTransactions called with:',
      {
        studentId: student.student_id,
        paymentItem: paymentItem
          ? {
              id: paymentItem.id,
              type: paymentItem.type,
              amount: paymentItem.amount,
              semesterNumber: paymentItem.semesterNumber,
              installmentNumber: paymentItem.installmentNumber,
            }
          : null,
      }
    );

    try {
      const result = await paymentTransactionService.getByStudentId(
        student.student_id
      );
      console.log('🔍 [AdminPaymentDialog] Transaction fetch result:', {
        success: result.success,
        dataLength: result.data?.length || 0,
        data: result.data?.slice(0, 3), // Show first 3 transactions
      });

      if (result.success && result.data) {
        setExistingTransactions(result.data);

        // Calculate pending amount for the specific installment
        if (paymentItem && result.data.length > 0) {
          const installmentKey = `${paymentItem.semesterNumber || 1}-${paymentItem.installmentNumber || 0}`;

          const relevantTransactions = result.data.filter(tx => {
            const txKey =
              typeof tx?.installment_id === 'string'
                ? String(tx.installment_id)
                : '';
            const matchesKey = txKey === installmentKey;
            const matchesSemester =
              Number(tx?.semester_number) ===
              Number(paymentItem.semesterNumber);
            return matchesKey || (!!txKey === false && matchesSemester);
          });

          const approvedTransactions = relevantTransactions.filter(
            tx => tx.verification_status === 'approved'
          );

          const totalPaid = approvedTransactions.reduce(
            (sum, tx) => sum + Number(tx.amount),
            0
          );
          const originalAmount = paymentItem.amount || 0;
          const calculatedPendingAmount = Math.max(
            0,
            originalAmount - totalPaid
          );

          console.log('🔍 [AdminPaymentDialog] Calculated pending amount:', {
            originalAmount,
            totalPaid,
            calculatedPendingAmount,
            relevantTransactions: relevantTransactions.length,
            approvedTransactions: approvedTransactions.length,
            installmentKey,
            relevantTransactionDetails: relevantTransactions.map(tx => ({
              id: tx.id,
              amount: tx.amount,
              status: tx.verification_status,
              installment_id: tx.installment_id,
              semester_number: tx.semester_number,
            })),
          });

          setPendingAmount(calculatedPendingAmount);
        } else {
          console.log(
            '🔍 [AdminPaymentDialog] No paymentItem or no transactions found'
          );
          setPendingAmount(0);
        }
      }
    } catch (error) {
      console.error('Error fetching existing transactions:', error);
    }
  }, [student?.student_id, paymentItem]);

  // Fetch student scholarship data
  const fetchStudentScholarship = useCallback(async () => {
    if (!student?.student_id) return;

    try {
      const scholarshipResult = await studentScholarshipsService.getByStudent(
        student.student_id
      );
      if (scholarshipResult.success && scholarshipResult.data) {
        setStudentScholarship(scholarshipResult.data);
      } else {
        setStudentScholarship(null);
      }
    } catch (error) {
      console.error('Error fetching student scholarship:', error);
      setStudentScholarship(null);
    }
  }, [student?.student_id]);

  // Fetch payment breakdown from payment engine
  const fetchPaymentBreakdown = useCallback(async () => {
    if (!paymentItem || !student.student_id || !student.student?.cohort_id) {
      console.log(
        '🔍 [AdminPaymentDialog] fetchPaymentBreakdown skipped - missing data:',
        {
          paymentItem: !!paymentItem,
          student_id: student.student_id,
          cohort_id: student.student?.cohort_id,
        }
      );
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 [AdminPaymentDialog] Fetching payment breakdown:', {
        studentId: student.student_id,
        cohortId: student.student?.cohort_id,
        paymentPlan: student.payment_plan,
        paymentItemType: paymentItem.type,
      });

      // First, try to get the student's custom fee structure
      const customFeeStructure = await FeeStructureService.getFeeStructure(
        String(student.student?.cohort_id),
        String(student.student_id)
      );

      // Use custom structure if it exists, otherwise use the provided cohort structure
      const feeStructureToUse = customFeeStructure || feeStructure;

      // Get scholarship ID and additional discount percentage
      let scholarshipId = undefined as string | undefined;
      let additionalDiscountPercentage = 0;

      // Fetch scholarship data directly to avoid circular dependency
      try {
        const scholarshipResult = await studentScholarshipsService.getByStudent(
          student.student_id
        );
        if (scholarshipResult.success && scholarshipResult.data) {
          scholarshipId = scholarshipResult.data.scholarship_id;
          additionalDiscountPercentage =
            scholarshipResult.data.additional_discount_percentage || 0;
        } else if (student.scholarship_id) {
          scholarshipId = student.scholarship_id;
        }
      } catch (error) {
        console.error(
          'Error fetching scholarship data in payment breakdown:',
          error
        );
        // Fallback to student scholarship ID if available
        if (student.scholarship_id) {
          scholarshipId = student.scholarship_id;
        }
      }

      // Get the full payment breakdown from the payment engine
      const response = await getFullPaymentView({
        studentId: student.student_id,
        cohortId: student.student?.cohort_id,
        paymentPlan: student.payment_plan,
        scholarshipId,
        additionalDiscountPercentage,
        feeStructureData: {
          total_program_fee: feeStructureToUse.total_program_fee,
          admission_fee: feeStructureToUse.admission_fee,
          number_of_semesters: feeStructureToUse.number_of_semesters,
          instalments_per_semester: feeStructureToUse.instalments_per_semester,
          one_shot_discount_percentage:
            feeStructureToUse.one_shot_discount_percentage,
          program_fee_includes_gst:
            feeStructureToUse.program_fee_includes_gst ?? true,
          equal_scholarship_distribution:
            feeStructureToUse.equal_scholarship_distribution ?? false,
          one_shot_dates: feeStructureToUse.one_shot_dates,
          sem_wise_dates: feeStructureToUse.sem_wise_dates,
          instalment_wise_dates: feeStructureToUse.instalment_wise_dates,
        },
      });

      console.log('🔍 [AdminPaymentDialog] Payment engine response:', {
        success: response.success,
        hasBreakdown: !!response.breakdown,
        overallSummary: response.breakdown?.overallSummary,
        feeStructure: feeStructure,
      });

      if (response.success && response.breakdown) {
        // Find the specific installment breakdown
        let breakdown: AdminPaymentBreakdown | null = null;

        console.log('🔍 [AdminPaymentDialog] Determining breakdown type:', {
          type: paymentItem.type,
          semesterNumber: paymentItem.semesterNumber,
          installmentNumber: paymentItem.installmentNumber,
        });

        if (paymentItem.type === 'Admission Fee') {
          console.log('🔍 [AdminPaymentDialog] Processing Admission Fee:', {
            admissionFee: response.breakdown.admissionFee,
          });
          breakdown = {
            baseAmount: response.breakdown.admissionFee.baseAmount || 0,
            gstAmount: response.breakdown.admissionFee.gstAmount || 0,
            discountAmount: response.breakdown.admissionFee.discountAmount || 0,
            scholarshipAmount:
              response.breakdown.admissionFee.scholarshipAmount || 0,
            totalAmount: response.breakdown.admissionFee.totalPayable || 0,
            paymentDate: response.breakdown.admissionFee.paymentDate,
          };
        } else if (paymentItem.type === 'Program Fee (One-Shot)') {
          const oneShotPayment = response.breakdown.oneShotPayment;
          console.log('🔍 [AdminPaymentDialog] Processing One-Shot Payment:', {
            oneShotPayment,
            baseAmount: oneShotPayment?.baseAmount,
            gstAmount: oneShotPayment?.gstAmount,
            discountAmount: oneShotPayment?.discountAmount,
            scholarshipAmount: oneShotPayment?.scholarshipAmount,
            amountPayable: oneShotPayment?.amountPayable,
          });
          if (oneShotPayment) {
            // For one-shot payments, use the overall summary to show the correct breakdown
            const overallSummary = response.breakdown.overallSummary;

            breakdown = {
              baseAmount: overallSummary.totalProgramFee, // Full program fee
              gstAmount: overallSummary.totalGST, // Total GST
              discountAmount: overallSummary.totalDiscount, // Total discount
              scholarshipAmount: overallSummary.totalScholarship, // Total scholarship
              totalAmount: paymentItem.amount || 0, // Use the actual payment item amount
              paymentDate: oneShotPayment?.paymentDate,
            };
          }
        } else if (
          paymentItem.semesterNumber &&
          paymentItem.installmentNumber
        ) {
          // Find the specific semester and installment
          const semester = response.breakdown.semesters?.find(
            s => s.semesterNumber === paymentItem.semesterNumber
          );
          const installment = semester?.instalments?.find(
            i => i.installmentNumber === paymentItem.installmentNumber
          );

          console.log(
            '🔍 [AdminPaymentDialog] Processing Installment Payment:',
            {
              targetSemester: paymentItem.semesterNumber,
              targetInstallment: paymentItem.installmentNumber,
              foundSemester: !!semester,
              foundInstallment: !!installment,
              availableSemesters: response.breakdown.semesters?.map(s => ({
                semesterNumber: s.semesterNumber,
                installmentCount: s.instalments?.length,
              })),
              installment,
            }
          );

          if (installment) {
            breakdown = {
              baseAmount: installment.baseAmount || 0,
              gstAmount: installment.gstAmount || 0,
              discountAmount: installment.discountAmount || 0,
              scholarshipAmount: installment.scholarshipAmount || 0,
              totalAmount: installment.amountPayable || 0,
              paymentDate: installment.paymentDate,
            };
          }
        }

        console.log('🔍 [AdminPaymentDialog] Final breakdown calculated:', {
          breakdown,
          totalAmount: breakdown?.totalAmount,
          baseAmount: breakdown?.baseAmount,
          gstAmount: breakdown?.gstAmount,
          discountAmount: breakdown?.discountAmount,
          scholarshipAmount: breakdown?.scholarshipAmount,
        });

        setAdminPaymentBreakdown(breakdown);
        // Also store the full payment breakdown for the SemesterBreakdown component
        setStudentPaymentBreakdown(response.breakdown);
      }
    } catch (error) {
      console.error('Error fetching payment breakdown:', error);
    } finally {
      setLoading(false);
    }
  }, [
    paymentItem,
    student.student_id,
    student.student?.cohort_id,
    student.payment_plan,
    student.scholarship_id,
    feeStructure,
  ]);

  // Transform payment item for PaymentForm - MEMOIZED to prevent infinite re-renders
  const selectedInstallment = useMemo(() => {
    if (!paymentItem) return undefined;

    // Calculate the amount - use pending amount if available, otherwise prefer breakdown total, fallback to paymentItem amount
    const calculatedAmount =
      pendingAmount > 0
        ? pendingAmount
        : (adminPaymentBreakdown?.totalAmount ?? paymentItem.amount);

    console.log(
      '🔍 [AdminPaymentDialog] selectedInstallment amount calculation:',
      {
        adminBreakdownTotal: adminPaymentBreakdown?.totalAmount,
        paymentItemAmount: paymentItem.amount,
        pendingAmount,
        calculatedAmount,
        isNaN: isNaN(calculatedAmount),
        paymentItemSemesterNumber: paymentItem.semesterNumber,
        paymentItemInstallmentNumber: paymentItem.installmentNumber,
        usePendingAmount: pendingAmount > 0,
        finalAmount: calculatedAmount,
      }
    );

    return {
      id: paymentItem.id,
      installmentNumber: paymentItem.installmentNumber || 1,
      semesterNumber: paymentItem.semesterNumber || 1, // Add semesterNumber for targeting validation
      amount: calculatedAmount,
      dueDate: paymentItem.dueDate,
      status: paymentItem.status as 'pending' | 'paid' | 'overdue',
      paidAmount: 0,
      paidDate: paymentItem.paymentDate,
    };
  }, [paymentItem, adminPaymentBreakdown?.totalAmount, pendingAmount]);

  // Create PaymentBreakdown for PaymentForm component - MEMOIZED to prevent infinite re-renders
  const paymentBreakdownForForm = useMemo(() => {
    if (!paymentItem || !selectedInstallment) return undefined;

    // Use the same amount calculation as selectedInstallment
    const calculatedAmount =
      adminPaymentBreakdown?.totalAmount ?? paymentItem.amount;

    console.log(
      '🔍 [AdminPaymentDialog] paymentBreakdownForForm amount calculation:',
      {
        adminBreakdownTotal: adminPaymentBreakdown?.totalAmount,
        paymentItemAmount: paymentItem.amount,
        calculatedAmount,
        selectedInstallmentAmount: selectedInstallment.amount,
      }
    );

    return {
      totalAmount: calculatedAmount,
      paidAmount: 0,
      pendingAmount: calculatedAmount,
      // Create a basic semester structure if needed
      instalmentPayments: [
        {
          id: selectedInstallment.id,
          installmentNumber: selectedInstallment.installmentNumber,
          amount: calculatedAmount,
          dueDate: selectedInstallment.dueDate,
          status: selectedInstallment.status,
          paidAmount: 0,
        },
      ],
    };
  }, [paymentItem, selectedInstallment, adminPaymentBreakdown?.totalAmount]);

  // Handle payment submission with admin context
  const handlePaymentSubmission = async (
    paymentData: PaymentSubmissionData
  ) => {
    try {
      // Convert PaymentFormTypes.PaymentSubmissionData to PaymentMethods.PaymentSubmissionData
      const adminPaymentData = {
        paymentId: `student-payment-${Date.now()}`,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        referenceNumber: paymentData.referenceNumber,
        notes: paymentData.notes,
        receiptFile: paymentData.receiptFile,
        studentId: studentData.id,
        cohortId: studentData.cohort_id,
        studentUserId: studentData.user_id,
        // Construct installmentId in the same format as usePaymentForm
        installmentId:
          paymentItem?.semesterNumber && paymentItem?.installmentNumber
            ? `${paymentItem.semesterNumber}-${paymentItem.installmentNumber}`
            : paymentItem?.id, // Fallback to original id for one-shot payments
        semesterNumber: paymentItem?.semesterNumber,
        isAdminRecorded: true,
        recordedByUserId: profile?.user_id,
      };

      await handleRegularPayment(adminPaymentData);
      onPaymentRecorded?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting admin payment:', error);
    }
  };

  const handlePaymentSuccess = async () => {
    // Close the dialog and refresh the payment schedule
    onOpenChange(false);
    onPaymentRecorded?.();
  };

  // Use the payment submissions hook for proper handling
  const { handlePaymentSubmission: handleRegularPayment, submittingPayments } =
    usePaymentSubmissions(studentData, handlePaymentSuccess);

  // Initialize data when dialog opens
  useEffect(() => {
    if (open && paymentItem && student) {
      fetchPaymentBreakdown();
      fetchExistingTransactions();
    }
  }, [
    open,
    paymentItem,
    student,
    fetchPaymentBreakdown,
    fetchExistingTransactions,
  ]);

  // Debug logging when dialog opens
  useEffect(() => {
    if (open) {
      console.log('🔍 [AdminPaymentDialog] Dialog opened with props:', {
        paymentItem,
        paymentItemAmount: paymentItem?.amount,
        studentData: {
          student_id: student.student_id,
          cohort_id: student.student?.cohort_id,
          payment_plan: student.payment_plan,
        },
      });
    }
  }, [open, paymentItem, student]);

  return {
    // State
    adminPaymentBreakdown,
    studentPaymentBreakdown,
    loading,
    existingTransactions,
    pendingAmount,
    studentData,
    selectedInstallment,
    paymentBreakdownForForm,
    submittingPayments,

    // Actions
    handlePaymentSubmission,
  };
};
