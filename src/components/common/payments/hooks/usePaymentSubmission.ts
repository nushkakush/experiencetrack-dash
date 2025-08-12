import { useState, useEffect } from 'react';
import { CohortStudent } from '@/types/cohort';
import { validatePaymentForm } from '../PaymentFormValidation';

interface Installment {
  paymentDate: string;
  baseAmount: number;
  gstAmount: number;
  amountPayable: number;
}

interface Semester {
  semesterNumber: number;
  instalments: Installment[];
}

interface PaymentBreakdown {
  semesters: Semester[];
  overallSummary: {
    totalAmountPayable: number;
  };
}

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
  onPaymentSubmission: (paymentData: PaymentData) => void;
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
    setSelectedPaymentMode(mode);
    setPaymentDetails({});
    setUploadedFiles({});
    setErrors(prev => ({
      ...prev,
      paymentMode: ''
    }));
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
    const validation = validatePaymentForm(
      selectedPaymentMode,
      amountToPay,
      maxAmount,
      paymentDetails,
      uploadedFiles
    );

    setErrors(validation.errors);

    if (!validation.isValid) {
      return;
    }

    const paymentData = {
      studentId: studentData.id,
      cohortId: studentData.cohort_id,
      amount: amountToPay,
      paymentMode: selectedPaymentMode,
      paymentDetails,
      uploadedFiles,
      installmentId: selectedInstallment?.id,
      paymentPlan: selectedPaymentPlan,
      timestamp: new Date().toISOString()
    };

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
