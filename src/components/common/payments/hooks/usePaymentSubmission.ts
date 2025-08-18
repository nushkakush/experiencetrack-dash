import { useState, useEffect } from 'react';
import { CohortStudent } from '@/types/cohort';
import { PaymentBreakdown, Installment, Semester } from '@/types/payments/PaymentCalculationTypes';
import { validatePaymentForm } from '@/components/fee-collection/utils/PaymentValidation';
import { PaymentSubmissionData } from '@/types/payments/PaymentMethods';

interface PaymentData {
  paymentMode: string;
  amount: number;
  details: Record<string, any>;
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
  onPaymentSubmission
}: UsePaymentSubmissionProps) => {
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('');
  const [amountToPay, setAmountToPay] = useState<number>(0);
  const [paymentDetails, setPaymentDetails] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  // Calculate the maximum amount that can be paid for the selected installment
  const getMaxAmount = () => {
    if (selectedInstallment) {
      // Round to 2 decimal places to avoid floating point precision issues
      return Math.round(selectedInstallment.amountPayable * 100) / 100;
    }
    
    if (!paymentBreakdown) return 0;
    
    if (selectedPaymentPlan === 'one_shot') {
      return Math.round((paymentBreakdown.overallSummary?.totalAmountPayable || 0) * 100) / 100;
    } else {
      // For semester/installment plans, find the next due amount
      const pendingInstallments = paymentBreakdown.semesters?.flatMap((semester: Semester) => 
        semester.instalments?.filter((inst: Installment) => inst.amountPayable > 0) || []
      ) || [];
      
      if (pendingInstallments.length > 0) {
        return Math.round(pendingInstallments[0].amountPayable * 100) / 100;
      }
      
      return 0;
    }
  };

  const maxAmount = getMaxAmount();

  // Set initial amount when component mounts or installment changes
  useEffect(() => {
    setAmountToPay(maxAmount);
  }, [maxAmount]);

  const handlePaymentModeChange = (mode: string) => {
    console.log('🔍 [DEBUG] handlePaymentModeChange called with mode:', mode);
    console.log('🔍 [DEBUG] handlePaymentModeChange - mode type:', typeof mode);
    console.log('🔍 [DEBUG] handlePaymentModeChange - mode length:', mode?.length);
    
    setSelectedPaymentMode(mode);
    setPaymentDetails({});
    setUploadedFiles({});
    setErrors(prev => ({
      ...prev,
      paymentMode: ''
    }));
    
    console.log('🔍 [DEBUG] handlePaymentModeChange - state updated');
  };

  const handleAmountChange = (amount: number) => {
    setAmountToPay(amount);
    
    // Clear amount error when user changes the amount
    setErrors(prev => ({
      ...prev,
      amount: ''
    }));
  };

  const handlePaymentDetailsChange = (details: Record<string, any>) => {
    setPaymentDetails(details);
  };

  const handleFileUpload = (fieldName: string, file: File) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fieldName]: file
    }));
    
    // Clear error for this field
    setErrors(prev => ({
      ...prev,
      [fieldName]: ''
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
    console.log('🔍 [DEBUG] selectedPaymentMode type:', typeof selectedPaymentMode);
    console.log('🔍 [DEBUG] selectedPaymentMode length:', selectedPaymentMode?.length);
    console.log('🔍 [DEBUG] selectedPaymentMode truthy check:', !!selectedPaymentMode);

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
      referenceNumber: paymentDetails.transactionId || paymentDetails.chequeNumber,
      notes: paymentDetails.notes,
      receiptFile: uploadedFiles.cashAcknowledgment, // Fixed: was cashReceipt, should be cashAcknowledgment
      proofOfPaymentFile: uploadedFiles.bankTransferScreenshot || uploadedFiles.chequeImage,
      transactionScreenshotFile: uploadedFiles.scanToPayScreenshot,
      bankName: paymentDetails.bankName,
      bankBranch: paymentDetails.bankBranch,
      transferDate: paymentDetails.transferDate || paymentDetails.chequeDate,
      studentId: studentData.id,
      cohortId: studentData.cohort_id,
      // Add installment identification
      installmentId: selectedInstallment?.id,
      semesterNumber: selectedInstallment?.semesterNumber
    };

    console.log('🔍 [DEBUG] usePaymentSubmission - FULL paymentData:', paymentData);
    console.log('🔍 [DEBUG] usePaymentSubmission - selectedInstallment:', selectedInstallment);
    console.log('🔍 [DEBUG] usePaymentSubmission - installment breakdown:', {
      installmentId: selectedInstallment?.id,
      semesterNumber: selectedInstallment?.semesterNumber,
      hasSelectedInstallment: !!selectedInstallment,
      selectedInstallmentKeys: selectedInstallment ? Object.keys(selectedInstallment) : []
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
    handleSubmit
  };
};
