import { useState, useEffect, useCallback } from 'react';
import { CohortStudent } from '@/types/cohort';
import {
  PaymentBreakdown,
  Installment,
  Semester,
} from '@/types/payments/PaymentCalculationTypes';
import { validatePaymentForm } from '@/components/fee-collection/utils/PaymentValidation';
import { PaymentSubmissionData } from '@/types/payments/PaymentMethods';
import { paymentTransactionService } from '@/services/paymentTransaction.service';

interface PaymentData {
  paymentMode: string;
  amount: number;
  details: Record<string, unknown>;
  files: Record<string, File>;
}

export interface UsePaymentSubmissionProps {
  studentData: CohortStudent;
  selectedPaymentPlan?: string;
  paymentBreakdown?: PaymentBreakdown;
  selectedInstallment?: Installment;
  onPaymentSubmission: (paymentData: PaymentSubmissionData) => void;
}

export const usePaymentSubmission = ({
  studentData,
  selectedPaymentPlan,
  paymentBreakdown,
  selectedInstallment,
  onPaymentSubmission,
}: UsePaymentSubmissionProps) => {
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('');
  const [amountToPay, setAmountToPay] = useState<number>(0);
  const [paymentDetails, setPaymentDetails] = useState<Record<string, unknown>>(
    {}
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [existingTransactions, setExistingTransactions] = useState<unknown[]>(
    []
  );
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [hasUserEnteredCustomAmount, setHasUserEnteredCustomAmount] =
    useState(false);

  // Fetch existing transactions for this student to calculate pending amount
  const fetchExistingTransactions = useCallback(async () => {
    if (!studentData?.id) return;

    try {
      setLoadingTransactions(true);
      const studentPaymentId = (studentData as { student_payment_id?: string })
        .student_payment_id;
      if (!studentPaymentId) return;

      const result =
        await paymentTransactionService.getByPaymentId(studentPaymentId);
      if (result.success && result.data) {
        setExistingTransactions(result.data);
      }
    } catch (error) {
      console.error('Error fetching existing transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  }, [studentData]);

  // Fetch existing transactions when component mounts
  useEffect(() => {
    fetchExistingTransactions();
  }, [fetchExistingTransactions]);

  // Calculate the maximum amount that can be paid for the selected installment
  const getMaxAmount = useCallback(() => {
    let originalAmount = 0;

    if (selectedInstallment) {
      // Round to 2 decimal places to avoid floating point precision issues
      originalAmount =
        Math.round(selectedInstallment.amountPayable * 100) / 100;
    } else if (paymentBreakdown) {
      if (selectedPaymentPlan === 'one_shot') {
        originalAmount =
          Math.round(
            (paymentBreakdown.overallSummary?.totalAmountPayable || 0) * 100
          ) / 100;
      } else {
        // For semester/installment plans, find the next due amount
        const pendingInstallments =
          paymentBreakdown.semesters?.flatMap(
            (semester: Semester) =>
              semester.instalments?.filter(
                (inst: Installment) => inst.amountPayable > 0
              ) || []
          ) || [];

        if (pendingInstallments.length > 0) {
          originalAmount =
            Math.round(pendingInstallments[0].amountPayable * 100) / 100;
        }
      }
    }

    // Calculate pending amount by subtracting already paid transactions
    if (
      originalAmount > 0 &&
      existingTransactions.length > 0 &&
      selectedInstallment
    ) {
      const installmentKey = `${selectedInstallment.semesterNumber || 1}-${selectedInstallment.installmentNumber || 0}`;

      const relevantTransactions = existingTransactions.filter(tx => {
        const txKey =
          typeof tx?.installment_id === 'string'
            ? String(tx.installment_id)
            : '';
        const matchesKey = txKey === installmentKey;
        const matchesSemester =
          Number(tx?.semester_number) ===
          Number(selectedInstallment.semesterNumber);
        return matchesKey || (!!txKey === false && matchesSemester);
      });

      const approvedTransactions = relevantTransactions.filter(
        tx => tx.verification_status === 'approved'
      );

      const totalPaid = approvedTransactions.reduce(
        (sum, tx) => sum + Number(tx.amount),
        0
      );
      const pendingAmount = Math.max(0, originalAmount - totalPaid);

      console.log('🔍 [usePaymentSubmission] Calculated pending amount:', {
        originalAmount,
        totalPaid,
        pendingAmount,
        relevantTransactions: relevantTransactions.length,
        approvedTransactions: approvedTransactions.length,
      });

      return pendingAmount;
    }

    return originalAmount;
  }, [
    selectedInstallment,
    paymentBreakdown,
    selectedPaymentPlan,
    existingTransactions,
  ]);

  const maxAmount = getMaxAmount();

  // Recalculate maxAmount when existingTransactions change
  useEffect(() => {
    const newMaxAmount = getMaxAmount();
    if (newMaxAmount !== maxAmount) {
      setAmountToPay(newMaxAmount);
    }
  }, [existingTransactions, selectedInstallment, getMaxAmount, maxAmount]);

  // Set initial amount when component mounts or installment changes
  useEffect(() => {
    // Only set the amount if user hasn't manually entered a custom amount
    // and this is the initial load (amountToPay is 0 and we're not in the middle of typing)
    if (!hasUserEnteredCustomAmount && amountToPay === 0) {
      setAmountToPay(maxAmount);
    }
  }, [maxAmount, hasUserEnteredCustomAmount]); // Removed amountToPay from dependencies to prevent resetting on empty input

  // Reset custom amount flag when installment changes
  useEffect(() => {
    if (selectedInstallment) {
      setHasUserEnteredCustomAmount(false);
    }
  }, [
    selectedInstallment?.id,
    selectedInstallment?.semesterNumber,
    selectedInstallment?.installmentNumber,
  ]);

  const handlePaymentModeChange = (mode: string) => {
    console.log('🔍 [DEBUG] handlePaymentModeChange called with mode:', mode);
    console.log('🔍 [DEBUG] handlePaymentModeChange - mode type:', typeof mode);
    console.log(
      '🔍 [DEBUG] handlePaymentModeChange - mode length:',
      mode?.length
    );

    setSelectedPaymentMode(mode);
    setPaymentDetails({});
    setUploadedFiles({});
    setErrors(prev => ({
      ...prev,
      paymentMode: '',
    }));

    console.log('🔍 [DEBUG] handlePaymentModeChange - state updated');
  };

  const handleAmountChange = (amount: number) => {
    setAmountToPay(amount);

    // Mark that user has entered a custom amount
    setHasUserEnteredCustomAmount(true);

    // Clear amount error when user changes the amount
    setErrors(prev => ({
      ...prev,
      amount: '',
    }));
  };

  const handlePaymentDetailsChange = (details: Record<string, unknown>) => {
    setPaymentDetails(details);
  };

  const handleFileUpload = (fieldName: string, file: File) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fieldName]: file,
    }));

    // Clear error for this field
    setErrors(prev => ({
      ...prev,
      [fieldName]: '',
    }));
  };

  const handleRemoveFile = (fieldName: string) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[fieldName];
      return newFiles;
    });
  };

  const handleSubmit = () => {
    console.log('🔍 [DEBUG] handleSubmit called');
    console.log('🔍 [DEBUG] selectedPaymentMode:', selectedPaymentMode);
    console.log('🔍 [DEBUG] amountToPay:', amountToPay);
    console.log('🔍 [DEBUG] maxAmount:', maxAmount);
    console.log('🔍 [DEBUG] paymentDetails:', paymentDetails);
    console.log('🔍 [DEBUG] uploadedFiles:', uploadedFiles);
    console.log(
      '🔍 [DEBUG] selectedPaymentMode type:',
      typeof selectedPaymentMode
    );
    console.log(
      '🔍 [DEBUG] selectedPaymentMode length:',
      selectedPaymentMode?.length
    );
    console.log(
      '🔍 [DEBUG] selectedPaymentMode truthy check:',
      !!selectedPaymentMode
    );

    const validation = validatePaymentForm(
      selectedPaymentMode,
      amountToPay,
      maxAmount,
      paymentDetails,
      uploadedFiles
    );

    console.log('🔍 [DEBUG] validation result:', validation);
    console.log('🔍 [DEBUG] validation.isValid:', validation.isValid);
    console.log('🔍 [DEBUG] validation.errors:', validation.errors);

    setErrors(validation.errors);

    if (!validation.isValid) {
      console.log('❌ [DEBUG] Validation failed, returning early');
      return;
    }

    console.log('✅ [DEBUG] Validation passed, creating payment data');

    const paymentData = {
      paymentId: `student-payment-${Date.now()}`,
      amount: amountToPay,
      paymentMethod: selectedPaymentMode,
      referenceNumber:
        paymentDetails.transactionId || paymentDetails.chequeNumber,
      notes: paymentDetails.notes,
      receiptFile: uploadedFiles.cashAcknowledgment, // Fixed: was cashReceipt, should be cashAcknowledgment
      proofOfPaymentFile:
        uploadedFiles.bankTransferScreenshot || uploadedFiles.chequeImage,
      transactionScreenshotFile: uploadedFiles.scanToPayScreenshot,
      bankName: paymentDetails.bankName,
      bankBranch: paymentDetails.bankBranch,
      transferDate: paymentDetails.transferDate || paymentDetails.chequeDate,
      studentId: studentData.id,
      cohortId: studentData.cohort_id,
      // Add installment identification
      installmentId: selectedInstallment?.id,
      semesterNumber: selectedInstallment?.semesterNumber,
    };

    console.log(
      '🔍 [DEBUG] usePaymentSubmission - FULL paymentData:',
      paymentData
    );
    console.log(
      '🔍 [DEBUG] usePaymentSubmission - selectedInstallment:',
      selectedInstallment
    );
    console.log('🔍 [DEBUG] usePaymentSubmission - installment breakdown:', {
      installmentId: selectedInstallment?.id,
      semesterNumber: selectedInstallment?.semesterNumber,
      hasSelectedInstallment: !!selectedInstallment,
      selectedInstallmentKeys: selectedInstallment
        ? Object.keys(selectedInstallment)
        : [],
    });
    console.log('🔍 [DEBUG] Calling onPaymentSubmission');

    onPaymentSubmission(paymentData);
  };

  return {
    selectedPaymentMode,
    amountToPay,
    paymentDetails,
    errors,
    uploadedFiles,
    maxAmount,
    handlePaymentModeChange,
    handleAmountChange,
    handlePaymentDetailsChange,
    handleFileUpload,
    handleRemoveFile,
    handleSubmit,
  };
};
