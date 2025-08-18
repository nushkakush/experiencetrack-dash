import { useState, useEffect, useCallback } from 'react';
import {
  getPaymentModeConfig,
  getRequiredFieldsForMode,
  getRequiredFilesForMode,
} from '@/features/payments/domain/PaymentModeConfig';
import {
  UsePaymentFormProps,
  PaymentDetails,
  UploadedFiles,
  FormErrors,
  PaymentSubmissionData,
  Installment,
  SemesterInstallment,
} from '@/types/payments/PaymentFormTypes';

// Using imported UsePaymentFormProps interface from PaymentFormTypes

export const usePaymentForm = ({
  selectedInstallment,
  paymentBreakdown,
  selectedPaymentPlan,
  onPaymentSubmission,
  studentData,
}: UsePaymentFormProps) => {
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('');
  const [amountToPay, setAmountToPay] = useState<number>(0);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({});
  const [errors, setErrors] = useState<FormErrors>({});

  // Calculate the maximum amount that can be paid for the selected installment
  const getMaxAmount = useCallback(() => {
    if (selectedInstallment) {
      console.log(
        '🔍 [usePaymentForm] getMaxAmount with selectedInstallment:',
        {
          selectedInstallment,
          amountPayable: selectedInstallment.amountPayable,
          amount: selectedInstallment.amount,
          hasAmountPayable: 'amountPayable' in selectedInstallment,
        }
      );
      // Round to 2 decimal places to avoid floating point precision issues
      return Math.round(selectedInstallment.amountPayable * 100) / 100;
    }

    if (!paymentBreakdown) return 0;

    if (selectedPaymentPlan === 'one_shot') {
      return (
        Math.round(
          (paymentBreakdown.overallSummary?.totalAmountPayable || 0) * 100
        ) / 100
      );
    } else {
      // For semester/installment plans, find the next due amount
      const pendingInstallments =
        paymentBreakdown.semesters?.flatMap(
          (semester: SemesterInstallment) =>
            semester.instalments?.filter(
              (inst: Installment) => inst.amountPayable > 0
            ) || []
        ) || [];

      if (pendingInstallments.length > 0) {
        return Math.round(pendingInstallments[0].amountPayable * 100) / 100;
      }

      return 0;
    }
  }, [selectedInstallment, paymentBreakdown, selectedPaymentPlan]);

  const maxAmount = getMaxAmount();

  console.log('🔍 [usePaymentForm] Calculated values:', {
    maxAmount,
    isMaxAmountNaN: isNaN(maxAmount),
  });

  // Set initial amount when component mounts or installment changes
  useEffect(() => {
    console.log('🔍 [usePaymentForm] Setting amountToPay to maxAmount:', {
      maxAmount,
      isNaN: isNaN(maxAmount),
    });
    setAmountToPay(maxAmount);
  }, [maxAmount]);

  const validateAmount = useCallback(
    (amount: number) => {
      if (amount <= 0) {
        return 'Amount must be greater than 0';
      }
      if (amount > maxAmount) {
        return `Amount cannot exceed ${formatCurrency(maxAmount)}`;
      }
      return '';
    },
    [maxAmount, formatCurrency]
  );

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  }, []);

  const handleAmountChange = useCallback(
    (value: string) => {
      // Remove all non-digit characters except decimal point
      const cleanValue = value.replace(/[^\d.]/g, '');

      // Ensure only one decimal point
      const parts = cleanValue.split('.');
      const formattedValue =
        parts.length > 2
          ? parts[0] + '.' + parts.slice(1).join('')
          : cleanValue;

      const amount = parseFloat(formattedValue) || 0;
      setAmountToPay(amount);

      const amountError = validateAmount(amount);
      setErrors(prev => ({
        ...prev,
        amount: amountError,
      }));
    },
    [validateAmount]
  );

  const handlePaymentModeChange = useCallback((mode: string) => {
    setSelectedPaymentMode(mode);
    setPaymentDetails({});
    setUploadedFiles({});
    setErrors(prev => ({
      ...prev,
      paymentMode: '',
    }));
  }, []);

  const handleFieldChange = useCallback(
    (fieldName: string, value: string | number | boolean) => {
      setPaymentDetails(prev => ({ ...prev, [fieldName]: value }));

      // Clear field error when user starts typing
      if (errors[fieldName]) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: '',
        }));
      }
    },
    [errors]
  );

  const handleFileUpload = useCallback(
    (fieldName: string, file: File | null) => {
      setUploadedFiles(prev => ({ ...prev, [fieldName]: file }));

      // Clear file error when user uploads
      if (errors[fieldName]) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: '',
        }));
      }
    },
    [errors]
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Validate amount
    const amountError = validateAmount(amountToPay);
    if (amountError) {
      newErrors.amount = amountError;
    }

    // Validate payment mode
    if (!selectedPaymentMode) {
      newErrors.paymentMode = 'Please select a payment mode';
    }

    // Validate payment mode specific fields
    if (selectedPaymentMode && selectedPaymentMode !== 'razorpay') {
      const requiredFields = getRequiredFieldsForMode(selectedPaymentMode);
      for (const field of requiredFields) {
        if (!paymentDetails[field]) {
          newErrors[field] =
            `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
        }
      }
    }

    // Validate file uploads
    const requiredFiles = getRequiredFilesForMode(selectedPaymentMode);
    for (const fileField of requiredFiles) {
      if (!uploadedFiles[fileField]) {
        newErrors[fileField] = 'Please upload the required file';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    amountToPay,
    selectedPaymentMode,
    paymentDetails,
    uploadedFiles,
    validateAmount,
  ]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) {
      return;
    }

    // Require explicit installment targeting for all non one-shot payments
    const semesterNum: number | undefined = (
      selectedInstallment as Record<string, unknown>
    )?.semesterNumber as number | undefined;
    const installNum: number | undefined =
      selectedInstallment?.installmentNumber;
    const hasTargeting =
      typeof semesterNum === 'number' && typeof installNum === 'number';

    if (!hasTargeting) {
      // Block submission to avoid NULLs server-side
      setErrors(prev => ({
        ...prev,
        paymentMode:
          prev.paymentMode || 'Please select a specific installment to pay',
      }));
      return;
    }

    const computedInstallmentId = `${semesterNum}-${installNum}`;

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
      // Installment targeting (strict)
      installmentId: computedInstallmentId,
      semesterNumber: semesterNum,
    };

    onPaymentSubmission(paymentData);
  }, [
    validateForm,
    amountToPay,
    selectedPaymentMode,
    paymentDetails,
    uploadedFiles,
    onPaymentSubmission,
    selectedInstallment,
  ]);

  const getCurrentPaymentModeConfig = useCallback(() => {
    if (!selectedPaymentMode) return null;
    return getPaymentModeConfig(selectedPaymentMode);
  }, [selectedPaymentMode]);

  return {
    // State
    selectedPaymentMode,
    amountToPay,
    paymentDetails,
    uploadedFiles,
    errors,
    maxAmount,

    // Handlers
    handlePaymentModeChange,
    handleAmountChange,
    handleFieldChange,
    handleFileUpload,
    handleSubmit,

    // Utilities
    getPaymentModeConfig: getCurrentPaymentModeConfig,
    formatCurrency,
    validateForm,
  };
};
