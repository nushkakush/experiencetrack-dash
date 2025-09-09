import React, { useState, useEffect, useCallback } from 'react';
import { StudentPaymentSummary } from '@/types/fee';
import { getFullPaymentView } from '@/services/payments/paymentEngineClient';
import { paymentTransactionService } from '@/services/paymentTransaction.service';
import { supabase } from '@/integrations/supabase/client';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { FeeStructureService } from '@/services/feeStructure.service';
import { toast } from 'sonner';

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
    | 'partially_paid_verification_pending'
    | 'waived'
    | 'partially_waived';
  paymentDate?: string;
  // FIXED: Remove verificationStatus field - payment engine status is the single source of truth
  semesterNumber?: number;
  installmentNumber?: number;
}

interface UsePaymentScheduleProps {
  student: StudentPaymentSummary;
  feeStructure?: {
    total_program_fee: number;
    admission_fee: number;
    number_of_semesters: number;
    instalments_per_semester: number;
    one_shot_discount_percentage: number;
    one_shot_dates?: Record<string, string>;
    sem_wise_dates?: Record<string, string | Record<string, unknown>>;
    instalment_wise_dates?: Record<string, string | Record<string, unknown>>;
  };
}

export const usePaymentSchedule = ({
  student,
  feeStructure,
}: UsePaymentScheduleProps) => {
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [recordingPayment, setRecordingPayment] = useState<string | null>(null);
  const [selectedPaymentItem, setSelectedPaymentItem] =
    useState<PaymentScheduleItem | null>(null);
  const [showRecordingDialog, setShowRecordingDialog] = useState(false);
  const [paymentTransactions, setPaymentTransactions] = useState<any[]>([]);

  const { canCollectFees } = useFeaturePermissions();

  // Fetch payment transactions for this student
  const fetchPaymentTransactions = useCallback(async () => {
    try {
      const studentPaymentId = (student as any).student_payment_id;
      if (!studentPaymentId) return;

      const result =
        await paymentTransactionService.getByPaymentId(studentPaymentId);
      if (result.success && result.data) {
        setPaymentTransactions(result.data);
      }
    } catch (error) {
      console.error('Error fetching payment transactions:', error);
    }
  }, [student]);

  // Get relevant transactions for a specific installment
  const getRelevantTransactions = useCallback(
    (item: PaymentScheduleItem) => {
      if (!paymentTransactions || !Array.isArray(paymentTransactions))
        return [];

      const instKey = `${item.semesterNumber || 1}-${item.installmentNumber || 0}`;

      console.log(
        '🔍 [getRelevantTransactions] Looking for transactions with key:',
        instKey
      );
      console.log(
        '🔍 [getRelevantTransactions] All transactions:',
        paymentTransactions.map(tx => ({
          id: tx.id,
          installment_id: tx.installment_id,
          semester_number: tx.semester_number,
          verification_status: tx.verification_status,
          lit_invoice_id: tx.lit_invoice_id,
        }))
      );

      const filteredTransactions = paymentTransactions.filter(tx => {
        const txKey =
          typeof tx?.installment_id === 'string'
            ? String(tx.installment_id)
            : '';
        const matchesKey = txKey === instKey;
        const matchesSemester =
          Number(tx?.semester_number) === Number(item.semesterNumber);

        // Only include transactions that match the installment, not all transactions with invoices
        const shouldInclude =
          matchesKey || (!!txKey === false && matchesSemester);

        console.log('🔍 [getRelevantTransactions] Transaction filter:', {
          txId: tx.id,
          txKey,
          instKey,
          matchesKey,
          matchesSemester,
          hasInvoice: !!tx.lit_invoice_id,
          shouldInclude,
        });

        return shouldInclude;
      });

      console.log(
        '🔍 [getRelevantTransactions] Filtered transactions:',
        filteredTransactions.length
      );

      return filteredTransactions.map(tx => ({
        id: tx.id,
        amount: Number(tx.amount),
        partial_payment_sequence: tx.partial_payment_sequence || 0,
        verification_status: tx.verification_status || 'pending',
        created_at: tx.created_at || new Date().toISOString(),
        payment_method: tx.payment_method,
        notes: tx.notes,
        verification_notes: tx.verification_notes,
        rejection_reason: tx.rejection_reason,
        lit_invoice_id: tx.lit_invoice_id, // Include this for invoice checking

        // Verification fields and uploaded files
        receipt_url: tx.receipt_url,
        proof_of_payment_url: tx.proof_of_payment_url,
        transaction_screenshot_url: tx.transaction_screenshot_url,

        // Bank and payment details
        bank_name: tx.bank_name,
        bank_branch: tx.bank_branch,
        utr_number: tx.utr_number,
        account_number: tx.account_number,
        cheque_number: tx.cheque_number,
        payer_upi_id: tx.payer_upi_id,
        qr_code_url: tx.qr_code_url,
        receiver_bank_name: tx.receiver_bank_name,
        receiver_bank_logo_url: tx.receiver_bank_logo_url,

        // DD-specific fields
        dd_number: tx.dd_number,
        dd_bank_name: tx.dd_bank_name,
        dd_branch: tx.dd_branch,

        // Payment dates
        payment_date: tx.payment_date,
        transfer_date: tx.transfer_date,

        // Verification tracking
        verified_by: tx.verified_by,
        verified_at: tx.verified_at,

        // Reference number
        reference_number: tx.reference_number,
      }));
    },
    [paymentTransactions]
  );

  const calculatePaymentSchedule = useCallback(async (): Promise<
    PaymentScheduleItem[]
  > => {
    const validPaymentPlans = ['one_shot', 'sem_wise', 'instalment_wise'];

    if (
      !student.student_id ||
      student.student_id === 'undefined' ||
      !student.student?.cohort_id ||
      student.student?.cohort_id === 'undefined' ||
      !student.payment_plan ||
      student.payment_plan === 'not_selected' ||
      !validPaymentPlans.includes(student.payment_plan)
    ) {
      console.log(
        '🔍 [PaymentSchedule] Skipping payment engine call - missing required data:',
        {
          student_id: student.student_id,
          cohort_id: student.student?.cohort_id,
          payment_plan: student.payment_plan,
          hasStudent: !!student.student,
          isValidPaymentPlan: validPaymentPlans.includes(student.payment_plan),
        }
      );
      return [];
    }

    try {
      // Determine additional discount (admin-side) to keep parity with student view
      let additionalDiscountPercentage = 0;
      let scholarshipId = null;
      try {
        // Get payment record for scholarship_id
        const { data: sp } = await supabase
          .from('student_payments')
          .select('id, scholarship_id')
          .eq('student_id', student.student_id)
          .eq('cohort_id', student.student?.cohort_id)
          .maybeSingle();

        scholarshipId = sp?.scholarship_id || null;

        // Get additional discount from student_scholarships if scholarship exists
        if (scholarshipId) {
          const { data: scholarship } = await supabase
            .from('student_scholarships')
            .select('additional_discount_percentage')
            .eq('student_id', student.student_id)
            .eq('scholarship_id', scholarshipId)
            .maybeSingle();

          if (
            scholarship &&
            typeof scholarship.additional_discount_percentage === 'number' &&
            scholarship.additional_discount_percentage > 0
          ) {
            additionalDiscountPercentage =
              scholarship.additional_discount_percentage || 0;
          }
        }
      } catch (error) {
        console.warn('Error fetching student payment/scholarship data:', error);
      }

      // Debug: Log the exact parameters being sent to payment engine
      const paymentParams = {
        studentId: String(student.student_id),
        cohortId: String(student.student?.cohort_id),
        paymentPlan: student.payment_plan as
          | 'one_shot'
          | 'sem_wise'
          | 'instalment_wise',
        scholarshipId: scholarshipId || undefined,
        additionalDiscountPercentage,
      };

      // First, try to get the student's custom fee structure
      const customFeeStructure = await FeeStructureService.getFeeStructure(
        String(student.student?.cohort_id),
        String(student.student_id)
      );

      // Use custom structure if it exists, otherwise use the provided cohort structure
      const feeStructureToUse = customFeeStructure || feeStructure;

      // Fetch canonical breakdown and fee structure from Edge Function
      const { breakdown: feeReview, feeStructure: responseFeeStructure } =
        await getFullPaymentView({
          ...paymentParams,
          feeStructureData: {
            total_program_fee: feeStructureToUse.total_program_fee,
            admission_fee: feeStructureToUse.admission_fee,
            number_of_semesters: feeStructureToUse.number_of_semesters,
            instalments_per_semester:
              feeStructureToUse.instalments_per_semester,
            one_shot_discount_percentage:
              feeStructureToUse.one_shot_discount_percentage,
            program_fee_includes_gst:
              (feeStructureToUse as any).program_fee_includes_gst ?? true,
            equal_scholarship_distribution:
              (feeStructureToUse as any).equal_scholarship_distribution ??
              false,
            one_shot_dates: feeStructureToUse.one_shot_dates,
            sem_wise_dates: feeStructureToUse.sem_wise_dates,
            instalment_wise_dates: feeStructureToUse.instalment_wise_dates,
          },
        });

      if (!responseFeeStructure) {
        throw new Error('Fee structure not found in edge function response');
      }

      // Fetch payment transactions to check verification status
      let transactions: Array<{
        verification_status?: string;
        amount?: string | number;
      }> = [];
      let paymentId: string | undefined = student.student_payment_id as
        | string
        | undefined;
      if (!paymentId) {
        const { data: paymentRecord } = await supabase
          .from('student_payments')
          .select('id')
          .eq('student_id', student.student_id)
          .eq('cohort_id', student.student?.cohort_id)
          .maybeSingle();
        paymentId = paymentRecord?.id;
      }
      if (paymentId) {
        const transactionResponse =
          await paymentTransactionService.getByPaymentId(paymentId);
        if (transactionResponse.success && transactionResponse.data) {
          transactions = transactionResponse.data;
        }
      }

      const schedule: PaymentScheduleItem[] = [];

      // Add admission fee (always first) - always marked as paid since student is registered
      schedule.push({
        id: 'admission_fee',
        type: 'Admission Fee',
        amount: responseFeeStructure.admission_fee,
        dueDate:
          feeReview.admissionFee?.paymentDate || new Date().toISOString(),
        status: 'paid',
        paymentDate: new Date().toISOString(),
      });

      // Add program fee installments based on payment plan
      if (student.payment_plan === 'one_shot') {
        // For one-shot payments, treat as semester 1, installment 1
        const semester1 = feeReview.semesters?.[0];
        const installment1 = semester1?.instalments?.[0];

        const programFeeAmount =
          installment1?.amountPayable ??
          feeReview.oneShotPayment?.amountPayable ??
          (feeReview.overallSummary.totalAmountPayable -
            feeStructureToUse.admission_fee ||
            0);

        const statusFromEngine = (installment1 as Record<string, unknown>)
          ?.status as
          | 'pending'
          | 'pending_10_plus_days'
          | 'verification_pending'
          | 'paid'
          | 'overdue'
          | 'partially_paid_days_left'
          | 'partially_paid_overdue'
          | 'partially_paid_verification_pending'
          | 'waived'
          | 'partially_waived'
          | undefined;

        schedule.push({
          id: '1-1', // Use semester 1, installment 1 ID
          type: 'Program Fee (One-Shot)',
          amount: programFeeAmount,
          dueDate:
            installment1?.paymentDate ||
            feeReview.oneShotPayment?.paymentDate ||
            new Date().toISOString(),
          status: statusFromEngine || 'pending',
          paymentDate: undefined,
          // FIXED: Remove verificationStatus field - payment engine status is the single source of truth
          semesterNumber: 1,
          installmentNumber: 1,
        });
      } else if (student.payment_plan === 'sem_wise') {
        // Use engine statuses for each semester (single installment per semester)
        feeReview.semesters.forEach((semester, index) => {
          const inst = semester.instalments[0];
          const statusFromEngine = (inst as Record<string, unknown>)?.status as
            | 'pending'
            | 'pending_10_plus_days'
            | 'verification_pending'
            | 'paid'
            | 'overdue'
            | 'partially_paid_days_left'
            | 'partially_paid_overdue'
            | 'partially_paid_verification_pending'
            | 'waived'
            | 'partially_waived'
            | undefined;

          const scheduleItem = {
            id: `semester_${index + 1}`,
            type: `Program Fee (Semester ${index + 1})`,
            amount: semester.total.totalPayable,
            dueDate: inst?.paymentDate || new Date().toISOString(),
            status: statusFromEngine || 'pending',
            paymentDate: undefined,
            // FIXED: Remove verificationStatus field - payment engine status is the single source of truth
            semesterNumber: semester.semesterNumber,
            installmentNumber: 1, // sem_wise always has 1 installment per semester
          };

          schedule.push(scheduleItem);
        });
      } else if (student.payment_plan === 'instalment_wise') {
        // Use engine statuses per installment
        let installmentIndex = 1;
        feeReview.semesters.forEach(semester => {
          semester.instalments.forEach(installment => {
            const statusFromEngine = (installment as Record<string, unknown>)
              ?.status as
              | 'pending'
              | 'pending_10_plus_days'
              | 'verification_pending'
              | 'paid'
              | 'overdue'
              | 'partially_paid_days_left'
              | 'partially_paid_overdue'
              | 'partially_paid_verification_pending'
              | 'waived'
              | 'partially_waived'
              | undefined;
            schedule.push({
              id: `installment_${installmentIndex}`,
              type: `Program Fee (Instalment ${installmentIndex})`,
              amount: installment.amountPayable,
              dueDate: installment.paymentDate,
              status: statusFromEngine || 'pending',
              paymentDate: undefined,
              // FIXED: Remove verificationStatus field - payment engine status is the single source of truth
              semesterNumber: semester.semesterNumber,
              installmentNumber:
                installment.installmentNumber || installmentIndex,
            });
            installmentIndex++;
          });
        });
      }

      return schedule;
    } catch (error) {
      console.error('Error calculating payment schedule:', error);
      try {
        toast?.error?.('Failed to load payment schedule.');
      } catch (error) {
        console.warn('Error showing toast:', error);
      }
      return [];
    }
  }, [student, feeStructure]);

  const fetchPaymentSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const schedule = await calculatePaymentSchedule();
      setPaymentSchedule(schedule);
    } catch (error) {
      console.error('Error fetching payment schedule:', error);
    } finally {
      setLoading(false);
    }
  }, [calculatePaymentSchedule]);

  // Function to handle recording payment for an installment
  const handleRecordPayment = useCallback(
    async (paymentItem: PaymentScheduleItem) => {
      console.log('🔍 [PaymentSchedule] handleRecordPayment called with:', {
        paymentItem,
        amount: paymentItem.amount,
        type: paymentItem.type,
        semesterNumber: paymentItem.semesterNumber,
        installmentNumber: paymentItem.installmentNumber,
        status: paymentItem.status,
      });
      setSelectedPaymentItem(paymentItem);
      setShowRecordingDialog(true);
    },
    []
  );

  // Function to handle payment recording completion
  const handlePaymentRecorded = useCallback(() => {
    // Add a small delay to ensure payment engine has processed the transaction
    setTimeout(() => {
      // Refresh the payment schedule
      fetchPaymentSchedule();
    }, 1000);
  }, [fetchPaymentSchedule]);

  // Function to close the recording dialog
  const handleCloseRecordingDialog = useCallback(() => {
    setShowRecordingDialog(false);
    setSelectedPaymentItem(null);
  }, []);

  // Helper to determine if a payment can be recorded by admin
  const canRecordPayment = useCallback(
    (status: string) => {
      // Admin can record payments for pending/overdue/partially waived payments
      // Don't allow recording for fully paid, fully waived, or verification pending payments
      return (
        canCollectFees &&
        (status === 'pending' ||
          status === 'pending_10_plus_days' ||
          status === 'overdue' ||
          status === 'partially_paid_overdue' ||
          status === 'partially_paid_days_left' ||
          status === 'partially_waived') && // ✅ Allow recording for partially waived (scholarship applied)
        status !== 'waived' && // Only exclude fully waived
        status !== 'verification_pending' && // Don't allow recording for verification pending
        status !== 'partially_paid_verification_pending' // Don't allow recording for partially paid verification pending
      );
    },
    [canCollectFees]
  );

  // Check if payment plan is selected
  const hasPaymentPlan =
    student.payment_plan && student.payment_plan !== 'not_selected';

  // Initialize data
  useEffect(() => {
    fetchPaymentTransactions();
  }, [fetchPaymentTransactions]);

  useEffect(() => {
    fetchPaymentSchedule();
  }, [fetchPaymentSchedule]);

  return {
    // State
    paymentSchedule,
    loading,
    recordingPayment,
    selectedPaymentItem,
    showRecordingDialog,
    paymentTransactions,
    hasPaymentPlan,

    // Actions
    getRelevantTransactions,
    handleRecordPayment,
    handlePaymentRecorded,
    handleCloseRecordingDialog,
    canRecordPayment,
  };
};
