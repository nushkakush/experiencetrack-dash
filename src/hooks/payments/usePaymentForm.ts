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
import { paymentTransactionService } from '@/services/paymentTransaction.service';

// Using imported UsePaymentFormProps interface from PaymentFormTypes

export const usePaymentForm = ({
  selectedInstallment,
  paymentBreakdown,
  selectedPaymentPlan,
  onPaymentSubmission,
  studentData,
  isAdminMode = false,
}: UsePaymentFormProps) => {
  console.log('🔍 [usePaymentForm] Hook called with:', {
    hasSelectedInstallment: !!selectedInstallment,
    selectedInstallmentDetails: selectedInstallment
      ? {
          id: selectedInstallment.id,
          semesterNumber: selectedInstallment.semesterNumber,
          installmentNumber: selectedInstallment.installmentNumber,
          amount: selectedInstallment.amount,
        }
      : null,
    hasPaymentBreakdown: !!paymentBreakdown,
    selectedPaymentPlan,
    hasStudentData: !!studentData,
    studentDataId: studentData?.id,
    isAdminMode,
    isAdminModeType: typeof isAdminMode,
    isAdminModeBoolean: isAdminMode === true,
  });
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('');
  const [amountToPay, setAmountToPay] = useState<number>(0);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [existingTransactions, setExistingTransactions] = useState<
    Record<string, unknown>[]
  >([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [hasUserEnteredCustomAmount, setHasUserEnteredCustomAmount] =
    useState(false);

  // Fetch existing transactions for this student to calculate pending amount
  const fetchExistingTransactions = useCallback(async () => {
    if (!studentData?.id) {
      console.log(
        '🔍 [usePaymentForm] No studentData.id, skipping transaction fetch'
      );
      return;
    }

    try {
      setLoadingTransactions(true);

      // Try to get student_payment_id from studentData if it exists
      const studentPaymentId = (studentData as Record<string, unknown>)
        .student_payment_id as string | undefined;

      console.log('🔍 [usePaymentForm] Fetching transactions with:', {
        studentId: studentData.id,
        studentPaymentId,
        hasStudentPaymentId: !!studentPaymentId,
        studentDataKeys: Object.keys(studentData),
        studentDataValues: Object.fromEntries(
          Object.entries(studentData).map(([key, value]) => [
            key,
            typeof value === 'object' ? '[Object]' : value,
          ])
        ),
      });

      let result;

      if (studentPaymentId) {
        // Use student_payment_id if available
        result =
          await paymentTransactionService.getByPaymentId(studentPaymentId);
      } else {
        // Fallback: fetch by student_id directly
        console.log(
          '🔍 [usePaymentForm] Using fallback method with student_id directly'
        );
        // Get all transactions for the student directly
        result = await paymentTransactionService.getByStudentId(studentData.id);
      }

      console.log('🔍 [usePaymentForm] Transaction fetch result:', {
        success: result.success,
        dataLength: result.data?.length || 0,
        data: result.data?.slice(0, 3), // Show first 3 transactions to avoid console spam
        allTransactionIds: result.data?.map(tx => tx.id) || [],
        allTransactionAmounts:
          result.data?.map(tx => ({
            id: tx.id,
            amount: (tx as Record<string, unknown>).amount,
            status: (tx as Record<string, unknown>).verification_status,
          })) || [],
      });

      if (result.success && result.data) {
        setExistingTransactions(result.data);
      }
    } catch (error) {
      console.error('Error fetching existing transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  }, [studentData]);

  // Calculate the maximum amount that can be paid for the selected installment
  const getMaxAmount = useCallback(() => {
    let originalAmount = 0;

    if (selectedInstallment) {
      console.log(
        '🔍 [usePaymentForm] getMaxAmount with selectedInstallment:',
        {
          selectedInstallment,
          amount: selectedInstallment.amount,
          hasAmount: 'amount' in selectedInstallment,
        }
      );
      // Round to 2 decimal places to avoid floating point precision issues
      originalAmount = Math.round(selectedInstallment.amount * 100) / 100;
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
            (semester: SemesterInstallment) =>
              semester.instalments?.filter(
                (inst: Installment) => inst.amount > 0
              ) || []
          ) || [];

        if (pendingInstallments.length > 0) {
          originalAmount =
            Math.round(pendingInstallments[0].amount * 100) / 100;
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

      // Check if selectedInstallment.amount is already reduced (less than originalAmount)
      // This happens when the admin dialog has already calculated the pending amount
      if (selectedInstallment.amount < originalAmount) {
        console.log(
          '🔍 [usePaymentForm] Using already reduced amount from selectedInstallment:',
          {
            selectedInstallmentAmount: selectedInstallment.amount,
            originalAmount,
            isAdminMode,
            usingReducedAmount: true,
          }
        );
        return selectedInstallment.amount;
      }

      // Also check if we're in admin mode and the amount is significantly different from the expected original
      // This handles the case where the admin dialog has already reduced the amount
      if (
        isAdminMode === true &&
        selectedInstallment.amount !== originalAmount
      ) {
        console.log(
          '🔍 [usePaymentForm] Admin mode detected - using selectedInstallment amount:',
          {
            selectedInstallmentAmount: selectedInstallment.amount,
            originalAmount,
            isAdminMode,
            usingSelectedAmount: true,
          }
        );
        return selectedInstallment.amount;
      }

      // If we're in admin mode, always use the selectedInstallment amount if it's provided
      if (isAdminMode === true && selectedInstallment.amount > 0) {
        console.log(
          '🔍 [usePaymentForm] Admin mode - using selectedInstallment amount directly:',
          {
            selectedInstallmentAmount: selectedInstallment.amount,
            originalAmount,
            isAdminMode,
            usingDirectAmount: true,
          }
        );
        return selectedInstallment.amount;
      }

      const pendingAmount = Math.max(0, originalAmount - totalPaid);

      console.log('🔍 [usePaymentForm] Calculated pending amount:', {
        originalAmount: originalAmount,
        totalPaid,
        pendingAmount,
        relevantTransactions: relevantTransactions.length,
        approvedTransactions: approvedTransactions.length,
        installmentKey,
        isAdminMode,
        selectedInstallmentAmount: selectedInstallment.amount,
        relevantTransactionDetails: relevantTransactions.map(tx => ({
          id: tx.id,
          amount: tx.amount,
          status: tx.verification_status,
          installment_id: tx.installment_id,
          semester_number: tx.semester_number,
        })),
        approvedTransactionDetails: approvedTransactions.map(tx => ({
          id: tx.id,
          amount: tx.amount,
          status: tx.verification_status,
        })),
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

  console.log('🔍 [usePaymentForm] Calculated values:', {
    maxAmount,
    isMaxAmountNaN: isNaN(maxAmount),
    existingTransactionsLength: existingTransactions.length,
    selectedInstallment: selectedInstallment
      ? {
          semesterNumber: selectedInstallment.semesterNumber,
          installmentNumber: selectedInstallment.installmentNumber,
          amount: selectedInstallment.amount,
        }
      : null,
    studentData: studentData
      ? {
          id: studentData.id,
          hasStudentPaymentId: !!(studentData as Record<string, unknown>)
            .student_payment_id,
          studentPaymentId: (studentData as Record<string, unknown>)
            .student_payment_id,
          keys: Object.keys(studentData),
        }
      : null,
  });

  // Fetch existing transactions when component mounts
  useEffect(() => {
    console.log(
      '🔍 [usePaymentForm] useEffect triggered for fetchExistingTransactions'
    );
    if (studentData?.id) {
      fetchExistingTransactions();
    }
  }, [fetchExistingTransactions, studentData?.id]);

  // Set initial amount when component mounts or installment changes
  useEffect(() => {
    console.log('🔍 [usePaymentForm] Setting amountToPay to maxAmount:', {
      maxAmount,
      isNaN: isNaN(maxAmount),
      previousAmountToPay: amountToPay,
      hasUserEnteredCustomAmount,
    });

    // Set the amount to maxAmount if:
    // 1. User hasn't manually entered a custom amount, OR
    // 2. The current amount is 0 (initial state), OR
    // 3. The current amount is significantly different from maxAmount (more than 1% difference)
    //    This handles cases where the amount was set to an old value due to partial payment changes
    const shouldUpdateAmount =
      !hasUserEnteredCustomAmount ||
      amountToPay === 0 ||
      (maxAmount > 0 && Math.abs(amountToPay - maxAmount) / maxAmount > 0.01);

    if (shouldUpdateAmount) {
      console.log(
        '🔍 [usePaymentForm] Updating amountToPay from',
        amountToPay,
        'to',
        maxAmount,
        'reason:',
        !hasUserEnteredCustomAmount
          ? 'user has not entered custom amount'
          : amountToPay === 0
            ? 'amount is 0'
            : 'amount differs significantly from maxAmount'
      );
      setAmountToPay(maxAmount);
    }
  }, [maxAmount, hasUserEnteredCustomAmount]); // Removed amountToPay from dependencies to prevent infinite loops

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

  // Initialize payment details with current date and time when component mounts
  useEffect(() => {
    // Initialize for both student payments and admin payment recording
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM format

    console.log(
      '🔍 [usePaymentForm] Initializing payment details with current date/time:',
      {
        currentDate,
        currentTime,
        isAdminMode,
      }
    );

    setPaymentDetails(prev => ({
      ...prev,
      paymentDate: currentDate,
      paymentTime: currentTime,
    }));
  }, [isAdminMode]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  }, []);

  const validateAmount = useCallback(
    (amount: number) => {
      if (amount <= 0) {
        return 'Amount must be greater than 0';
      }
      // Use a small epsilon for floating-point comparison to handle precision issues
      const epsilon = 0.01;
      if (amount > maxAmount + epsilon) {
        return `Amount cannot exceed ${formatCurrency(maxAmount)}`;
      }
      return '';
    },
    [maxAmount, formatCurrency]
  );

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

      console.log('🔍 [usePaymentForm] handleAmountChange called:', {
        inputValue: value,
        cleanValue,
        formattedValue,
        parsedAmount: amount,
        currentAmountToPay: amountToPay,
        maxAmount,
        hasUserEnteredCustomAmount,
      });

      setAmountToPay(amount);

      // Mark that user has entered a custom amount - this prevents the useEffect from resetting the amount
      setHasUserEnteredCustomAmount(true);

      // Only show validation error if amount is greater than 0 but exceeds max
      // Allow empty input (amount = 0) during typing
      let amountError = '';
      if (amount > 0) {
        // Use a small epsilon for floating-point comparison to handle precision issues
        const epsilon = 0.01;
        if (amount > maxAmount + epsilon) {
          amountError = `Amount cannot exceed ${formatCurrency(maxAmount)}`;
        }
      }

      setErrors(prev => ({
        ...prev,
        amount: amountError,
      }));
    },
    [maxAmount, formatCurrency, amountToPay, hasUserEnteredCustomAmount]
  );

  const handlePaymentModeChange = useCallback((mode: string) => {
    setSelectedPaymentMode(mode);

    // Initialize payment details with current date and time for both student and admin payments
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM format

    const initialPaymentDetails: PaymentDetails = {
      paymentDate: currentDate,
      paymentTime: currentTime,
    };

    setPaymentDetails(initialPaymentDetails);
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
    console.log('🔍 [usePaymentForm] validateForm called with:', {
      amountToPay,
      selectedPaymentMode,
      paymentDetails,
      uploadedFiles,
    });

    const newErrors: Record<string, string> = {};

    // Validate amount
    const amountError = validateAmount(amountToPay);
    if (amountError) {
      newErrors.amount = amountError;
      console.log('❌ [usePaymentForm] Amount validation failed:', amountError);
    }

    // Validate payment mode
    if (!selectedPaymentMode) {
      newErrors.paymentMode = 'Please select a payment mode';
      console.log(
        '❌ [usePaymentForm] Payment mode validation failed: No payment mode selected'
      );
    }

    // Validate payment mode specific fields
    if (selectedPaymentMode && selectedPaymentMode !== 'razorpay') {
      // For admin mode, only validate amount and payment method - all other fields are optional
      if (isAdminMode) {
        // Admin mode validation - only require amount and payment method
        // All other fields are optional
      } else {
        // Student mode validation - require all fields as before
        const requiredFields = getRequiredFieldsForMode(selectedPaymentMode);
        for (const field of requiredFields) {
          if (!paymentDetails[field]) {
            newErrors[field] =
              `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
          }
        }
      }
    }

    // Validate file uploads
    if (isAdminMode) {
      // Admin mode: Only require proof of payment file, make others optional
      const proofOfPaymentFields = [
        'bankTransferScreenshot',
        'proofOfPayment',
        'transactionScreenshot',
        'ddReceipt',
      ];
      const hasAnyProofOfPayment = proofOfPaymentFields.some(
        field => uploadedFiles[field]
      );

      if (!hasAnyProofOfPayment) {
        newErrors.proofOfPayment = 'Please upload proof of payment';
        console.log(
          '❌ [usePaymentForm] Admin mode: No proof of payment uploaded'
        );
      }
    } else {
      // Student mode: Require all files as before
      const requiredFiles = getRequiredFilesForMode(selectedPaymentMode);
      console.log(
        '🔍 [usePaymentForm] Required files for mode:',
        selectedPaymentMode,
        requiredFiles
      );
      for (const fileField of requiredFiles) {
        if (!uploadedFiles[fileField]) {
          newErrors[fileField] = 'Please upload the required file';
          console.log(
            '❌ [usePaymentForm] File validation failed:',
            fileField,
            'is missing'
          );
        }
      }
    }

    // For admin mode with razorpay, validate payment ID instead
    if (isAdminMode && selectedPaymentMode === 'razorpay') {
      if (!paymentDetails.razorpayPaymentId) {
        newErrors.razorpayPaymentId = 'Payment ID is required';
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('🔍 [usePaymentForm] Validation result:', {
      isValid,
      errors: newErrors,
    });
    return isValid;
  }, [
    amountToPay,
    selectedPaymentMode,
    paymentDetails,
    uploadedFiles,
    validateAmount,
    isAdminMode,
  ]);

  const handleSubmit = useCallback(() => {
    console.log('🔍 [usePaymentForm] handleSubmit called with:', {
      amountToPay,
      selectedPaymentMode,
      selectedInstallment,
      paymentDetails,
      uploadedFiles,
      errors,
    });

    if (!validateForm()) {
      console.log('❌ [usePaymentForm] Validation failed, errors:', errors);
      return;
    }

    // Require explicit installment targeting for all payment types
    const isOneShotPayment = selectedPaymentPlan === 'one_shot';
    const semesterNum: number | undefined = isOneShotPayment
      ? 1
      : ((selectedInstallment as Record<string, unknown>)?.semesterNumber as
          | number
          | undefined);
    const installNum: number | undefined = isOneShotPayment
      ? 1
      : selectedInstallment?.installmentNumber;
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

    // For one-shot payments, treat as semester 1, installment 1
    const computedInstallmentId = isOneShotPayment
      ? '1-1'
      : `${semesterNum}-${installNum}`;

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
      // DD-specific file mapping
      ddReceiptFile: uploadedFiles.ddReceipt,
      bankName: paymentDetails.bankName,
      bankBranch: paymentDetails.bankBranch,
      transferDate: paymentDetails.transferDate || paymentDetails.chequeDate,
      // Installment targeting (treat one-shot as semester 1)
      installmentId: computedInstallmentId,
      semesterNumber: isOneShotPayment ? 1 : semesterNum,
      // Admin mode flag for payment validation
      isAdminRecorded: isAdminMode,
    };

    console.log('🔍 [usePaymentForm] Submitting payment data:', {
      paymentMethod: selectedPaymentMode,
      isAdminMode,
      isAdminRecorded: paymentData.isAdminRecorded,
      hasReceiptFile: !!paymentData.receiptFile,
      hasProofOfPaymentFile: !!paymentData.proofOfPaymentFile,
      hasTransactionScreenshotFile: !!paymentData.transactionScreenshotFile,
    });

    onPaymentSubmission(paymentData);
  }, [
    validateForm,
    amountToPay,
    selectedPaymentMode,
    paymentDetails,
    uploadedFiles,
    onPaymentSubmission,
    selectedInstallment,
    isAdminMode,
    selectedPaymentPlan,
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
